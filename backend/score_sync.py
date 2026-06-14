"""Auto-sync FIFA World Cup 2026 results from ESPN's public scoreboard API.

ESPN returns all WC matches per UTC day and is more complete than TheSportsDB's
free tier (which only returns ~5 matches per round).

Endpoint: https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard?dates=YYYYMMDD
"""
import asyncio
import logging
import unicodedata
from datetime import datetime, timezone, date, timedelta
from typing import Optional, Dict, Any, List

import requests

log = logging.getLogger(__name__)

ESPN_SCOREBOARD = "https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard"
SYNC_INTERVAL_SECONDS = 60 * 60  # 1 hour

TOURNAMENT_START = date(2026, 6, 11)
TOURNAMENT_END = date(2026, 7, 19)

# Internal name → possible ESPN/external name variations (before normalization)
TEAM_NAME_ALIASES: Dict[str, List[str]] = {
    "USA": ["united states", "usa", "united states of america"],
    "Turkey": ["turkiye", "turkey"],           # ESPN uses "Türkiye"
    "South Korea": ["korea republic", "south korea"],
    "Bosnia & Herz.": ["bosnia and herzegovina", "bosnia herzegovina", "bosnia-herzegovina"],
    "DRC": ["dr congo", "democratic republic of the congo", "congo dr"],
    "Ivory Coast": ["cote divoire", "ivory coast", "cote d'ivoire"],
    "Czechia": ["czech republic", "czechia"],
    "Cape Verde": ["cape verde islands", "cape verde", "cabo verde"],
    "Curacao": ["curacao"],                    # ESPN uses "Curaçao" → accent-stripped to "curacao"
}


def _normalize(name: Optional[str]) -> str:
    if not name:
        return ""
    # Strip unicode accents: Türkiye→Turkiye, Curaçao→Curacao, etc.
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


def _fetch_espn_day_sync(date_str: str) -> List[Dict[str, Any]]:
    """Fetch all WC matches for a UTC date (YYYY-MM-DD) from ESPN."""
    try:
        resp = requests.get(
            ESPN_SCOREBOARD,
            params={"dates": date_str.replace("-", "")},  # ESPN wants YYYYMMDD
            timeout=10,
        )
        if resp.status_code != 200:
            return []
        data = resp.json()
        result = []
        for ev in data.get("events") or []:
            comp = ((ev.get("competitions") or []) + [{}])[0]
            competitors = comp.get("competitors") or []
            home = next((c for c in competitors if c.get("homeAway") == "home"), None)
            away = next((c for c in competitors if c.get("homeAway") == "away"), None)
            if not home or not away:
                continue
            status_type = (comp.get("status") or {}).get("type") or {}
            venue_obj = comp.get("venue") or {}
            result.append({
                "home_team": (home.get("team") or {}).get("displayName", ""),
                "away_team": (away.get("team") or {}).get("displayName", ""),
                "start_utc": comp.get("startDate") or ev.get("date", ""),
                "completed": bool(status_type.get("completed")),
                "home_score": home.get("score"),
                "away_score": away.get("score"),
                "venue": venue_obj.get("fullName") or "",
            })
        return result
    except Exception as e:
        log.warning("ESPN day %s fetch failed: %s", date_str, e)
        return []


async def fetch_espn_day(date_str: str) -> List[Dict[str, Any]]:
    return await asyncio.to_thread(_fetch_espn_day_sync, date_str)


def _days_range(start: date, end: date) -> List[str]:
    days, d = [], start
    while d <= end:
        days.append(d.strftime("%Y-%m-%d"))
        d += timedelta(days=1)
    return days


async def _find_match_by_teams(db, home: str, away: str) -> Optional[Dict[str, Any]]:
    """Find a local match by team names — date-independent."""
    async for m in db.matches.find({}):
        if teams_match(m["home"], home) and teams_match(m["away"], away):
            return m
        if teams_match(m["home"], away) and teams_match(m["away"], home):
            return m
    return None


async def sync_results_once(db, full_scan: bool = False) -> Dict[str, Any]:
    """Pull scores from ESPN for all recently finished matches.

    full_scan=True  — scans every tournament day from Jun 11 → today+1 UTC.
                      Used by the admin "Sync Scores Now" button.
    full_scan=False — scans the last 3 UTC days only (faster; used by hourly loop).
    """
    synced = 0
    checked = 0
    finished_seen = 0
    matched_to_local = 0
    trace = []

    today_utc = datetime.now(timezone.utc).date()
    # +1 day: catch late-night matches (e.g. 9 PM PT = next UTC day)
    end = min(today_utc + timedelta(days=1), TOURNAMENT_END)
    start = TOURNAMENT_START if full_scan else max(TOURNAMENT_START, today_utc - timedelta(days=3))

    for date_str in _days_range(start, end):
        events = await fetch_espn_day(date_str)
        if not events:
            continue
        for ev in events:
            checked += 1
            if not ev["completed"]:
                continue
            finished_seen += 1
            home = ev["home_team"]
            away = ev["away_team"]
            try:
                hs = int(ev["home_score"])
                a_s = int(ev["away_score"])
            except (TypeError, ValueError):
                continue
            match = await _find_match_by_teams(db, home, away)
            if not match:
                log.warning("Sync: no local match for %s vs %s", home, away)
                continue
            matched_to_local += 1
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
                    "synced_source": "espn",
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
    """Pull kickoff time and venue from ESPN for every match.

    Safe — never touches home_score, away_score, or locked.
    Stores display time in ET converted from ESPN's UTC startDate.
    """
    from zoneinfo import ZoneInfo
    ET = ZoneInfo("America/New_York")

    updated = 0
    checked = 0
    unmatched: List[str] = []

    for date_str in _days_range(TOURNAMENT_START, TOURNAMENT_END):
        events = await fetch_espn_day(date_str)
        for ev in events:
            checked += 1
            home_raw = ev["home_team"]
            away_raw = ev["away_team"]
            if not home_raw or not away_raw:
                continue

            start_utc_str = ev.get("start_utc") or ""
            if not start_utc_str:
                unmatched.append(f"no timestamp: {home_raw} vs {away_raw}")
                continue

            try:
                dt_utc = datetime.fromisoformat(start_utc_str.replace("Z", "+00:00"))
                kickoff_utc = dt_utc.astimezone(timezone.utc).isoformat()
            except Exception:
                unmatched.append(f"bad timestamp: {home_raw} vs {away_raw}")
                continue

            dt_et = dt_utc.astimezone(ET)
            local_date = dt_et.strftime("%Y-%m-%d")
            hour = dt_et.strftime("%I").lstrip("0") or "12"
            local_time = f"{hour}:{dt_et.strftime('%M %p')} ET"

            venue = ev.get("venue") or ""

            match = await _find_match_by_teams(db, home_raw, away_raw)
            if not match:
                unmatched.append(f"{home_raw} vs {away_raw}")
                continue

            update: Dict[str, Any] = {"kickoff_utc": kickoff_utc, "date": local_date, "time": local_time}
            if venue:
                update["venue"] = venue

            if not any(match.get(k) != v for k, v in update.items()):
                continue

            await db.matches.update_one(
                {"match_id": match["match_id"]},
                {"$set": {**update, "schedule_synced_at": datetime.now(timezone.utc).isoformat()}},
            )
            updated += 1
            log.info("Schedule sync: #%s %s vs %s → %s %s %s",
                     match["match_id"], home_raw, away_raw, local_date, local_time, venue)

    return {
        "updated": updated,
        "checked": checked,
        "unmatched_count": len(unmatched),
        "unmatched_sample": unmatched[:10],
    }


async def sync_loop(db):
    """Run forever in background — quick 3-day scan every hour."""
    log.info("Auto-sync loop starting (interval=%ds, source=ESPN)", SYNC_INTERVAL_SECONDS)
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
