"""Auto-sync FIFA World Cup 2026 results from TheSportsDB (free, no API key).

Uses eventsday.php?l=4429&d=YYYY-MM-DD which returns all matches for a given UTC day.
Admin "Sync Scores Now" does a full tournament scan; the hourly background loop
scans only the last 3 days for speed.
"""
import asyncio
import logging
import unicodedata
from datetime import datetime, timezone, date, timedelta
from typing import Optional, Dict, Any, List

import requests

log = logging.getLogger(__name__)

THESPORTSDB_BASE = "https://www.thesportsdb.com/api/v1/json/3"
WC2026_LEAGUE_ID = "4429"
SYNC_INTERVAL_SECONDS = 60 * 60  # 1 hour

TOURNAMENT_START = date(2026, 6, 11)
TOURNAMENT_END = date(2026, 7, 19)

FINISHED_STATUSES = {
    "match finished", "ft", "full time", "finished",
    "aet", "after extra time", "after penalties", "pen",
}

# Internal name → possible TheSportsDB names (before normalization)
TEAM_NAME_ALIASES: Dict[str, List[str]] = {
    "USA": ["united states", "usa", "united states of america"],
    "South Korea": ["korea republic", "south korea"],
    "Bosnia & Herz.": ["bosnia and herzegovina", "bosnia herzegovina"],
    "DRC": ["dr congo", "democratic republic of the congo", "congo dr"],
    "Ivory Coast": ["cote divoire", "ivory coast"],
    "Czechia": ["czech republic", "czechia"],
    "Cape Verde": ["cape verde islands", "cape verde", "cabo verde"],
    "Curacao": ["curacao"],  # accents stripped by _normalize: Curaçao → Curacao
}


def _normalize(name: Optional[str]) -> str:
    if not name:
        return ""
    # Strip unicode accents so Curaçao == Curacao, etc.
    nfkd = unicodedata.normalize("NFD", name)
    no_accents = "".join(c for c in nfkd if unicodedata.category(c) != "Mn")
    return (
        no_accents.lower().strip()
        .replace(".", "")
        .replace("&", "and")
        .replace("-", " ")
        .replace("'", "")
    )


def teams_match(our_name: str, their_name: str) -> bool:
    a = _normalize(our_name)
    b = _normalize(their_name)
    if not a or not b:
        return False
    if a == b:
        return True
    aliases = TEAM_NAME_ALIASES.get(our_name, [])
    return any(_normalize(x) == b for x in aliases)


def _fetch_day_sync(date_str: str) -> List[Dict[str, Any]]:
    try:
        resp = requests.get(
            f"{THESPORTSDB_BASE}/eventsday.php",
            params={"l": WC2026_LEAGUE_ID, "d": date_str},
            timeout=10,
        )
        if resp.status_code != 200:
            return []
        data = resp.json()
        return data.get("events") or []
    except Exception as e:
        log.warning("TheSportsDB day %s fetch failed: %s", date_str, e)
        return []


async def fetch_day(date_str: str) -> List[Dict[str, Any]]:
    return await asyncio.to_thread(_fetch_day_sync, date_str)


def _days_range(start: date, end: date) -> List[str]:
    days = []
    d = start
    while d <= end:
        days.append(d.strftime("%Y-%m-%d"))
        d += timedelta(days=1)
    return days


async def _find_match_by_teams(db, home: str, away: str) -> Optional[Dict[str, Any]]:
    """Find a match by team names — date-independent so UTC/local date differences don't matter."""
    async for m in db.matches.find({}):
        if teams_match(m["home"], home) and teams_match(m["away"], away):
            return m
        if teams_match(m["home"], away) and teams_match(m["away"], home):
            return m
    return None


async def sync_results_once(db, full_scan: bool = False) -> Dict[str, Any]:
    """Run one sync cycle. Returns counters and a small trace.

    full_scan=True  — scans all tournament days from Jun 11 to today+1 UTC.
                      Used by the admin "Sync Scores Now" button.
    full_scan=False — scans last 3 UTC days only (faster; used by hourly loop).
    """
    synced = 0
    checked = 0
    finished_seen = 0
    matched_to_local = 0
    trace = []

    today_utc = datetime.now(timezone.utc).date()
    # Include tomorrow UTC in case a late-night match crosses midnight
    end = min(today_utc + timedelta(days=1), TOURNAMENT_END)

    if full_scan:
        start = TOURNAMENT_START
    else:
        start = max(TOURNAMENT_START, today_utc - timedelta(days=3))

    for date_str in _days_range(start, end):
        events = await fetch_day(date_str)
        if not events:
            continue
        for ev in events:
            checked += 1
            status = (ev.get("strStatus") or "").lower().strip()
            if status not in FINISHED_STATUSES:
                continue
            finished_seen += 1
            home = ev.get("strHomeTeam") or ""
            away = ev.get("strAwayTeam") or ""
            try:
                hs = int(ev.get("intHomeScore"))
                a_s = int(ev.get("intAwayScore"))
            except (TypeError, ValueError):
                continue
            match = await _find_match_by_teams(db, home, away)
            if not match:
                log.warning("Sync: no local match for %s vs %s", home, away)
                continue
            matched_to_local += 1
            # Skip if already-synced with identical scores
            if (match.get("home_score") == hs and
                    match.get("away_score") == a_s and
                    match.get("locked")):
                continue
            await db.matches.update_one(
                {"match_id": match["match_id"]},
                {"$set": {
                    "home_score": hs,
                    "away_score": a_s,
                    "locked": True,
                    "synced_at": datetime.now(timezone.utc).isoformat(),
                    "synced_source": "thesportsdb",
                }},
            )
            synced += 1
            trace.append(f"#{match['match_id']} {home} {hs}-{a_s} {away}")
            log.info("Sync: match #%s %s %d-%d %s", match["match_id"], home, hs, a_s, away)

    return {
        "synced": synced,
        "checked": checked,
        "finished_seen": finished_seen,
        "matched_to_local": matched_to_local,
        "trace": trace[:10],
    }


async def sync_schedule_once(db) -> Dict[str, Any]:
    """Pull date / time / kickoff_utc / venue from TheSportsDB for every match.

    Safe to run at any time — never touches home_score, away_score, or locked.
    Derives display time in ET from the UTC timestamp so it is always consistent.
    """
    from zoneinfo import ZoneInfo

    ET = ZoneInfo("America/New_York")
    updated = 0
    checked = 0
    unmatched: List[str] = []

    for date_str in _days_range(TOURNAMENT_START, TOURNAMENT_END):
        events = await fetch_day(date_str)
        for ev in events:
            checked += 1
            home_raw = ev.get("strHomeTeam") or ""
            away_raw = ev.get("strAwayTeam") or ""
            if not home_raw or not away_raw:
                continue

            kickoff_utc: Optional[str] = None
            ts_str = ev.get("strTimestamp") or ""
            if ts_str:
                try:
                    dt = datetime.fromisoformat(ts_str.replace("Z", "+00:00"))
                    kickoff_utc = dt.astimezone(timezone.utc).isoformat()
                except Exception:
                    pass
            if not kickoff_utc:
                date_s = ev.get("dateEvent") or ""
                time_s = (ev.get("strTime") or "").strip()
                if date_s and time_s:
                    try:
                        dt = datetime.strptime(f"{date_s} {time_s}", "%Y-%m-%d %H:%M:%S")
                        kickoff_utc = dt.replace(tzinfo=timezone.utc).isoformat()
                    except Exception:
                        pass

            if not kickoff_utc:
                unmatched.append(f"no timestamp: {home_raw} vs {away_raw}")
                continue

            dt_utc = datetime.fromisoformat(kickoff_utc)
            dt_et = dt_utc.astimezone(ET)
            local_date = dt_et.strftime("%Y-%m-%d")
            hour = dt_et.strftime("%I").lstrip("0") or "12"
            local_time = f"{hour}:{dt_et.strftime('%M %p')} ET"

            venue = (ev.get("strVenue") or "").strip() or None

            match = await _find_match_by_teams(db, home_raw, away_raw)
            if not match:
                unmatched.append(f"{home_raw} vs {away_raw}")
                continue

            update: Dict[str, Any] = {
                "kickoff_utc": kickoff_utc,
                "date": local_date,
                "time": local_time,
            }
            if venue:
                update["venue"] = venue

            changed = any(match.get(k) != v for k, v in update.items())
            if not changed:
                continue

            await db.matches.update_one(
                {"match_id": match["match_id"]},
                {"$set": {**update, "schedule_synced_at": datetime.now(timezone.utc).isoformat()}},
            )
            updated += 1
            log.info(
                "Schedule sync: #%s %s vs %s → %s %s %s",
                match["match_id"], home_raw, away_raw, local_date, local_time,
                venue or "",
            )

    return {
        "updated": updated,
        "checked": checked,
        "unmatched_count": len(unmatched),
        "unmatched_sample": unmatched[:10],
    }


async def sync_loop(db):
    """Run forever in background — quick 3-day scan every hour."""
    log.info("Auto-sync loop starting (interval=%ds, source=TheSportsDB)", SYNC_INTERVAL_SECONDS)
    await asyncio.sleep(5)
    while True:
        try:
            res = await sync_results_once(db, full_scan=False)
            log.info("Auto-sync cycle: %s", res)
        except asyncio.CancelledError:
            log.info("Auto-sync loop cancelled")
            raise
        except Exception as e:
            log.exception("Auto-sync loop error: %s", e)
        await asyncio.sleep(SYNC_INTERVAL_SECONDS)
