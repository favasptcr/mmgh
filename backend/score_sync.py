"""Auto-sync FIFA World Cup 2026 results from ESPN's public scoreboard API.

ESPN returns all WC matches per UTC day and is more complete than TheSportsDB's
free tier (which only returns ~5 matches per round).

Endpoint: https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard?dates=YYYYMMDD
"""
import asyncio
import logging
import re
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
            notes_raw = comp.get("notes") or []
            if isinstance(notes_raw, dict):
                notes_raw = [notes_raw]
            result.append({
                "home_team": (home.get("team") or {}).get("displayName", ""),
                "away_team": (away.get("team") or {}).get("displayName", ""),
                "start_utc": comp.get("startDate") or ev.get("date", ""),
                "completed": bool(status_type.get("completed")),
                "home_score": home.get("score"),
                "away_score": away.get("score"),
                "venue": venue_obj.get("fullName") or "",
                "status_detail": status_type.get("shortDetail") or status_type.get("description") or "",
                "notes": notes_raw,
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


async def _find_tbd_match_by_kickoff(db, start_utc_str: str) -> Optional[Dict[str, Any]]:
    """Find the closest TBD knockout match to an ESPN kickoff time.

    Returns the TBD match whose kickoff_utc is nearest to the ESPN time,
    within a 3-hour window. Using closest-match (not fixed window) handles
    seed data that is off by up to ~1 hour from ESPN's actual times.
    TBD matches are always ≥1 hour apart so the closest is unambiguous.
    """
    if not start_utc_str:
        return None
    try:
        dt_espn = datetime.fromisoformat(start_utc_str.replace("Z", "+00:00"))
    except Exception:
        return None
    max_window = timedelta(hours=3)
    best_match = None
    best_diff = max_window
    async for m in db.matches.find({"home": {"$regex": "^TBD"}}):
        ko_str = m.get("kickoff_utc")
        if not ko_str:
            continue
        try:
            dt_local = datetime.fromisoformat(ko_str)
            diff = abs(dt_local - dt_espn)
            if diff < best_diff:
                best_diff = diff
                best_match = m
        except Exception:
            continue
    return best_match


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

            # Detect penalty shootout — ESPN shortDetail is "FT-Pens"
            status_detail = (ev.get("status_detail") or "").lower()
            went_to_pens = "pens" in status_detail or "penalt" in status_detail

            # Parse penalty score from ESPN notes, e.g. "Paraguay advance 4-3 on penalties"
            pen_h = pen_a = None
            if went_to_pens:
                for note in (ev.get("notes") or []):
                    text = note.get("text") or note.get("headline") or ""
                    m = re.search(r'(\d+)[–\-](\d+)\s+on\s+penalt', text, re.IGNORECASE)
                    if m:
                        score_winner = int(m.group(1))
                        score_loser = int(m.group(2))
                        prefix = text[:m.start()].strip()
                        winner_name = re.sub(r'\s+advances?\s*$', '', prefix, re.IGNORECASE).strip()
                        if _normalize(winner_name) == _normalize(home):
                            pen_h, pen_a = score_winner, score_loser
                        elif _normalize(winner_name) == _normalize(away):
                            pen_h, pen_a = score_loser, score_winner
                        else:
                            log.warning("Sync pen: couldn't match '%s' to '%s' or '%s'",
                                        winner_name, home, away)
                        break

            match = await _find_match_by_teams(db, home, away)
            if not match:
                match = await _find_tbd_match_by_kickoff(db, ev.get("start_utc", ""))
                if not match:
                    log.warning("Sync: no local match for %s vs %s", home, away)
                    continue
                # Completed matches always have real names, but guard anyway
                if (not _normalize(home).startswith("tbd") and
                        not _normalize(away).startswith("tbd")):
                    await db.matches.update_one(
                        {"match_id": match["match_id"]},
                        {"$set": {"home": home, "away": away}},
                    )
                    log.info("Auto-set teams #%s: %s vs %s", match["match_id"], home, away)
            matched_to_local += 1

            # Skip only if ALL ESPN data already matches stored data exactly
            pen_in_sync = (
                pen_h is None or  # ESPN has no penalty data — don't overwrite
                (match.get("penalty_home_score") == pen_h and
                 match.get("penalty_away_score") == pen_a)
            )
            already_synced = (
                match.get("home_score") == hs and
                match.get("away_score") == a_s and
                match.get("locked") and
                pen_in_sync
            )
            if already_synced:
                continue

            update = {
                "home_score": hs,
                "away_score": a_s,
                "locked": True,
                "synced_at": datetime.now(timezone.utc).isoformat(),
                "synced_source": "espn",
            }
            if pen_h is not None and pen_a is not None:
                update["penalty_home_score"] = pen_h
                update["penalty_away_score"] = pen_a
                update["penalty_winner"] = "home" if pen_h > pen_a else "away"
                log.info("Sync: match #%s penalty %d-%d", match["match_id"], pen_h, pen_a)

            await db.matches.update_one(
                {"match_id": match["match_id"]},
                {"$set": update},
            )
            synced += 1
            trace.append(f"#{match['match_id']} {home} {hs}-{a_s} {away}" +
                         (f" (pens {pen_h}-{pen_a})" if pen_h is not None else ""))
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
        day_unmatched: List[Dict[str, Any]] = []

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
                match = await _find_tbd_match_by_kickoff(db, start_utc_str)
                if not match:
                    # Save for positional fallback below
                    day_unmatched.append({
                        "home": home_raw, "away": away_raw,
                        "kickoff_utc": kickoff_utc, "date": local_date,
                        "time": local_time, "venue": venue,
                        "start_utc": start_utc_str,
                    })
                    continue
                # Only write real team names — don't overwrite "TBD R32-X" with ESPN's own "TBD"
                espn_has_real_teams = (
                    not _normalize(home_raw).startswith("tbd") and
                    not _normalize(away_raw).startswith("tbd")
                )
                if espn_has_real_teams:
                    await db.matches.update_one(
                        {"match_id": match["match_id"]},
                        {"$set": {"home": home_raw, "away": away_raw}},
                    )
                    log.info("Schedule sync: auto-set teams #%s: %s vs %s", match["match_id"], home_raw, away_raw)

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

        # Positional fallback: when kickoff-time matching misses events (seed time off by ≥3h),
        # pair remaining ESPN events to TBD slots by sorted-time order within the same ET date.
        # Safe because matches within a day are always ordered identically in ESPN and our seed.
        if day_unmatched:
            et_dates = set(e["date"] for e in day_unmatched)
            if len(et_dates) == 1:
                fallback_date = next(iter(et_dates))
                tbd_slots: List[Dict[str, Any]] = []
                async for m in db.matches.find(
                    {"home": {"$regex": "^TBD"}, "date": fallback_date}
                ):
                    tbd_slots.append(m)

                if tbd_slots and len(tbd_slots) == len(day_unmatched):
                    tbd_slots.sort(key=lambda m: m.get("kickoff_utc", ""))
                    day_unmatched.sort(key=lambda e: e["start_utc"])
                    for ev_data, slot in zip(day_unmatched, tbd_slots):
                        espn_real = (
                            not _normalize(ev_data["home"]).startswith("tbd") and
                            not _normalize(ev_data["away"]).startswith("tbd")
                        )
                        patch: Dict[str, Any] = {
                            "kickoff_utc": ev_data["kickoff_utc"],
                            "date": ev_data["date"],
                            "time": ev_data["time"],
                        }
                        if ev_data["venue"]:
                            patch["venue"] = ev_data["venue"]
                        if espn_real:
                            patch["home"] = ev_data["home"]
                            patch["away"] = ev_data["away"]
                        await db.matches.update_one(
                            {"match_id": slot["match_id"]},
                            {"$set": {**patch, "schedule_synced_at": datetime.now(timezone.utc).isoformat()}},
                        )
                        updated += 1
                        log.info("Schedule sync (positional): #%s %s vs %s → %s %s",
                                 slot["match_id"], ev_data["home"], ev_data["away"],
                                 ev_data["date"], ev_data["time"])
                else:
                    for ev_data in day_unmatched:
                        unmatched.append(f"{ev_data['home']} vs {ev_data['away']}")
            else:
                for ev_data in day_unmatched:
                    unmatched.append(f"{ev_data['home']} vs {ev_data['away']}")

    return {
        "updated": updated,
        "checked": checked,
        "unmatched_count": len(unmatched),
        "unmatched_sample": unmatched[:10],
    }


async def sync_loop(db):
    """Run forever in background — score sync every hour, schedule sync every 6 hours."""
    log.info("Auto-sync loop starting (interval=%ds, source=ESPN)", SYNC_INTERVAL_SECONDS)
    await asyncio.sleep(5)

    # Run schedule sync immediately on startup to populate TBD team names
    try:
        res = await sync_schedule_once(db)
        log.info("Startup schedule sync: %s", res)
    except Exception as e:
        log.exception("Startup schedule sync error: %s", e)

    cycle = 0
    while True:
        try:
            res = await sync_results_once(db, full_scan=False)
            log.info("Auto-sync cycle: %s", res)
        except asyncio.CancelledError:
            log.info("Auto-sync loop cancelled")
            raise
        except Exception as e:
            log.exception("Auto-sync loop error: %s", e)

        cycle += 1
        # Re-run schedule sync every 6 hours to catch bracket updates (TBD → real teams)
        if cycle % 6 == 0:
            try:
                res = await sync_schedule_once(db)
                log.info("Periodic schedule sync: %s", res)
            except Exception as e:
                log.exception("Periodic schedule sync error: %s", e)

        await asyncio.sleep(SYNC_INTERVAL_SECONDS)
