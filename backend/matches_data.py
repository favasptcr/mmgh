"""Match data for FIFA World Cup 2026 - MMGH Prediction Contest."""
from datetime import datetime, timezone
from zoneinfo import ZoneInfo

TZ_MAP = {
    "CT": "America/Chicago",
    "ET": "America/New_York",
    "PT": "America/Los_Angeles",
    "MT": "America/Denver",
}


def to_utc_iso(date_str: str, time_str: str) -> str:
    """Convert '2026-06-11' + '3:00 PM CT' -> UTC ISO string."""
    parts = time_str.rsplit(" ", 1)
    tz_abbr = parts[-1]
    time_only = parts[0]
    dt_naive = datetime.strptime(f"{date_str} {time_only}", "%Y-%m-%d %I:%M %p")
    tz = ZoneInfo(TZ_MAP[tz_abbr])
    dt_local = dt_naive.replace(tzinfo=tz)
    return dt_local.astimezone(timezone.utc).isoformat()


# Group Stage 72 matches (from original code)
_GROUP_RAW = [
    # Round 1
    (1, "Group Stage", "A", "2026-06-11", "3:00 PM CT", "Mexico", "South Africa", "Mexico City"),
    (2, "Group Stage", "A", "2026-06-11", "10:00 PM CT", "South Korea", "Czechia", "Guadalajara"),
    (3, "Group Stage", "B", "2026-06-12", "3:00 PM ET", "Canada", "Bosnia & Herz.", "Toronto"),
    (4, "Group Stage", "D", "2026-06-12", "9:00 PM ET", "USA", "Paraguay", "Los Angeles"),
    (5, "Group Stage", "B", "2026-06-13", "3:00 PM PT", "Qatar", "Switzerland", "San Francisco"),
    (6, "Group Stage", "C", "2026-06-13", "6:00 PM ET", "Brazil", "Morocco", "New York/NJ"),
    (7, "Group Stage", "C", "2026-06-13", "9:00 PM ET", "Haiti", "Scotland", "Boston"),
    (8, "Group Stage", "D", "2026-06-12", "9:00 PM PT", "Australia", "Turkey", "Vancouver"),
    (9, "Group Stage", "E", "2026-06-14", "1:00 PM CT", "Germany", "Curacao", "Houston"),
    (10, "Group Stage", "F", "2026-06-14", "4:00 PM CT", "Netherlands", "Japan", "Dallas"),
    (11, "Group Stage", "E", "2026-06-14", "7:00 PM ET", "Ivory Coast", "Ecuador", "Philadelphia"),
    (12, "Group Stage", "F", "2026-06-14", "9:00 PM CT", "Sweden", "Tunisia", "Monterrey"),
    (13, "Group Stage", "H", "2026-06-15", "12:00 PM ET", "Spain", "Cape Verde", "Atlanta"),
    (14, "Group Stage", "G", "2026-06-15", "12:00 PM PT", "Belgium", "Egypt", "Vancouver"),
    (15, "Group Stage", "H", "2026-06-15", "6:00 PM ET", "Saudi Arabia", "Uruguay", "Miami"),
    (16, "Group Stage", "G", "2026-06-15", "9:00 PM PT", "Iran", "New Zealand", "Los Angeles"),
    (17, "Group Stage", "I", "2026-06-16", "3:00 PM ET", "France", "Senegal", "New York/NJ"),
    (18, "Group Stage", "I", "2026-06-16", "6:00 PM ET", "Iraq", "Norway", "Boston"),
    (19, "Group Stage", "J", "2026-06-16", "9:00 PM CT", "Argentina", "Algeria", "Kansas City"),
    (20, "Group Stage", "J", "2026-06-15", "9:00 PM PT", "Austria", "Jordan", "San Francisco"),
    (21, "Group Stage", "K", "2026-06-17", "1:00 PM CT", "Portugal", "DRC", "Houston"),
    (22, "Group Stage", "L", "2026-06-17", "3:00 PM CT", "England", "Croatia", "Dallas"),
    (23, "Group Stage", "L", "2026-06-17", "7:00 PM ET", "Ghana", "Panama", "Toronto"),
    (24, "Group Stage", "K", "2026-06-17", "10:00 PM MT", "Uzbekistan", "Colombia", "Mexico City"),
    # Round 2
    (25, "Group Stage", "A", "2026-06-18", "12:00 PM ET", "Czechia", "South Africa", "Atlanta"),
    (26, "Group Stage", "B", "2026-06-18", "3:00 PM PT", "Switzerland", "Bosnia & Herz.", "Los Angeles"),
    (27, "Group Stage", "B", "2026-06-18", "6:00 PM PT", "Canada", "Qatar", "Vancouver"),
    (28, "Group Stage", "A", "2026-06-18", "9:00 PM MT", "Mexico", "South Korea", "Guadalajara"),
    (29, "Group Stage", "C", "2026-06-19", "6:00 PM ET", "Scotland", "Morocco", "Boston"),
    (30, "Group Stage", "D", "2026-06-19", "3:00 PM PT", "USA", "Australia", "Seattle"),
    (31, "Group Stage", "C", "2026-06-19", "9:00 PM ET", "Brazil", "Haiti", "Philadelphia"),
    (32, "Group Stage", "D", "2026-06-19", "12:00 AM PT", "Turkey", "Paraguay", "San Francisco"),
    (33, "Group Stage", "F", "2026-06-20", "1:00 PM CT", "Netherlands", "Sweden", "Houston"),
    (34, "Group Stage", "E", "2026-06-20", "4:00 PM ET", "Germany", "Ivory Coast", "Toronto"),
    (35, "Group Stage", "E", "2026-06-20", "8:00 PM CT", "Ecuador", "Curacao", "Kansas City"),
    (36, "Group Stage", "F", "2026-06-20", "12:00 AM MT", "Tunisia", "Japan", "Monterrey"),
    (37, "Group Stage", "H", "2026-06-21", "12:00 PM ET", "Spain", "Saudi Arabia", "Atlanta"),
    (38, "Group Stage", "G", "2026-06-21", "3:00 PM PT", "Belgium", "Iran", "Los Angeles"),
    (39, "Group Stage", "H", "2026-06-21", "6:00 PM ET", "Uruguay", "Cape Verde", "Miami"),
    (40, "Group Stage", "G", "2026-06-21", "9:00 PM PT", "New Zealand", "Egypt", "Vancouver"),
    (41, "Group Stage", "J", "2026-06-22", "1:00 PM CT", "Argentina", "Austria", "Dallas"),
    (42, "Group Stage", "I", "2026-06-22", "5:00 PM ET", "France", "Iraq", "Philadelphia"),
    (43, "Group Stage", "I", "2026-06-22", "8:00 PM ET", "Norway", "Senegal", "New York/NJ"),
    (44, "Group Stage", "J", "2026-06-22", "11:00 PM PT", "Jordan", "Algeria", "San Francisco"),
    (45, "Group Stage", "K", "2026-06-23", "1:00 PM CT", "Portugal", "Uzbekistan", "Houston"),
    (46, "Group Stage", "L", "2026-06-23", "4:00 PM ET", "England", "Ghana", "Boston"),
    (47, "Group Stage", "L", "2026-06-23", "7:00 PM ET", "Panama", "Croatia", "Toronto"),
    (48, "Group Stage", "K", "2026-06-23", "10:00 PM MT", "Colombia", "DRC", "Guadalajara"),
    # Round 3
    (49, "Group Stage", "B", "2026-06-24", "3:00 PM PT", "Switzerland", "Canada", "Vancouver"),
    (50, "Group Stage", "B", "2026-06-24", "3:00 PM PT", "Bosnia & Herz.", "Qatar", "Seattle"),
    (51, "Group Stage", "C", "2026-06-24", "6:00 PM ET", "Scotland", "Brazil", "Miami"),
    (52, "Group Stage", "C", "2026-06-24", "6:00 PM ET", "Morocco", "Haiti", "Atlanta"),
    (53, "Group Stage", "A", "2026-06-24", "9:00 PM CT", "Czechia", "Mexico", "Mexico City"),
    (54, "Group Stage", "A", "2026-06-24", "9:00 PM CT", "South Africa", "South Korea", "Monterrey"),
    (55, "Group Stage", "E", "2026-06-25", "4:00 PM ET", "Ecuador", "Germany", "New York/NJ"),
    (56, "Group Stage", "E", "2026-06-25", "4:00 PM ET", "Curacao", "Ivory Coast", "Philadelphia"),
    (57, "Group Stage", "F", "2026-06-25", "7:00 PM CT", "Japan", "Sweden", "Kansas City"),
    (58, "Group Stage", "F", "2026-06-25", "7:00 PM CT", "Tunisia", "Netherlands", "Dallas"),
    (59, "Group Stage", "D", "2026-06-25", "10:00 PM PT", "Turkey", "USA", "Los Angeles"),
    (60, "Group Stage", "D", "2026-06-25", "10:00 PM PT", "Paraguay", "Australia", "San Francisco"),
    (61, "Group Stage", "I", "2026-06-26", "3:00 PM ET", "Norway", "France", "Boston"),
    (62, "Group Stage", "I", "2026-06-26", "3:00 PM ET", "Senegal", "Iraq", "Toronto"),
    (63, "Group Stage", "H", "2026-06-26", "8:00 PM CT", "Cape Verde", "Saudi Arabia", "Houston"),
    (64, "Group Stage", "H", "2026-06-26", "8:00 PM MT", "Uruguay", "Spain", "Guadalajara"),
    (65, "Group Stage", "G", "2026-06-26", "11:00 PM PT", "Egypt", "Iran", "Seattle"),
    (66, "Group Stage", "G", "2026-06-26", "11:00 PM PT", "New Zealand", "Belgium", "Vancouver"),
    (67, "Group Stage", "L", "2026-06-27", "5:00 PM ET", "Panama", "England", "New York/NJ"),
    (68, "Group Stage", "L", "2026-06-27", "5:00 PM ET", "Croatia", "Ghana", "Philadelphia"),
    (69, "Group Stage", "K", "2026-06-27", "7:30 PM ET", "Colombia", "Portugal", "Miami"),
    (70, "Group Stage", "K", "2026-06-27", "7:30 PM ET", "DRC", "Uzbekistan", "Atlanta"),
    (71, "Group Stage", "J", "2026-06-27", "10:00 PM CT", "Algeria", "Austria", "Kansas City"),
    (72, "Group Stage", "J", "2026-06-27", "10:00 PM CT", "Jordan", "Argentina", "Dallas"),
]

# Knockouts - placeholders. Admin will update team names as bracket fills.
_KNOCKOUT_RAW = [
    # Round of 32 (16 matches)
    (73, "Round of 32", None, "2026-06-28", "5:00 PM PT", "TBD R32-1", "TBD R32-1", "Los Angeles"),
    (74, "Round of 32", None, "2026-06-29", "12:00 PM CT", "TBD R32-2", "TBD R32-2", "Houston"),
    (75, "Round of 32", None, "2026-06-29", "4:00 PM ET", "TBD R32-3", "TBD R32-3", "Boston"),
    (76, "Round of 32", None, "2026-06-29", "8:00 PM CT", "TBD R32-4", "TBD R32-4", "Guadalajara"),
    (77, "Round of 32", None, "2026-06-30", "1:00 PM CT", "TBD R32-5", "TBD R32-5", "Dallas"),
    (78, "Round of 32", None, "2026-06-30", "4:00 PM ET", "TBD R32-6", "TBD R32-6", "Miami"),
    (79, "Round of 32", None, "2026-06-30", "5:00 PM PT", "TBD R32-7", "TBD R32-7", "Seattle"),
    (80, "Round of 32", None, "2026-07-01", "12:00 PM PT", "TBD R32-8", "TBD R32-8", "San Francisco"),
    (81, "Round of 32", None, "2026-07-01", "4:00 PM ET", "TBD R32-9", "TBD R32-9", "Toronto"),
    (82, "Round of 32", None, "2026-07-01", "7:00 PM CT", "TBD R32-10", "TBD R32-10", "Kansas City"),
    (83, "Round of 32", None, "2026-07-02", "12:00 PM ET", "TBD R32-11", "TBD R32-11", "Philadelphia"),
    (84, "Round of 32", None, "2026-07-02", "4:00 PM ET", "TBD R32-12", "TBD R32-12", "Atlanta"),
    (85, "Round of 32", None, "2026-07-02", "8:00 PM CT", "TBD R32-13", "TBD R32-13", "Mexico City"),
    (86, "Round of 32", None, "2026-07-03", "12:00 PM CT", "TBD R32-14", "TBD R32-14", "Dallas"),
    (87, "Round of 32", None, "2026-07-03", "4:00 PM ET", "TBD R32-15", "TBD R32-15", "Miami"),
    (88, "Round of 32", None, "2026-07-03", "8:00 PM CT", "TBD R32-16", "TBD R32-16", "Kansas City"),
    # Round of 16 (8 matches)
    (89, "Round of 16", None, "2026-07-04", "12:00 PM CT", "TBD R16-1", "TBD R16-1", "Houston"),
    (90, "Round of 16", None, "2026-07-04", "4:00 PM ET", "TBD R16-2", "TBD R16-2", "Philadelphia"),
    (91, "Round of 16", None, "2026-07-05", "12:00 PM ET", "TBD R16-3", "TBD R16-3", "New York/NJ"),
    (92, "Round of 16", None, "2026-07-05", "4:00 PM CT", "TBD R16-4", "TBD R16-4", "Mexico City"),
    (93, "Round of 16", None, "2026-07-06", "12:00 PM ET", "TBD R16-5", "TBD R16-5", "Atlanta"),
    (94, "Round of 16", None, "2026-07-06", "4:00 PM PT", "TBD R16-6", "TBD R16-6", "Vancouver"),
    (95, "Round of 16", None, "2026-07-07", "12:00 PM ET", "TBD R16-7", "TBD R16-7", "Boston"),
    (96, "Round of 16", None, "2026-07-07", "4:00 PM PT", "TBD R16-8", "TBD R16-8", "Los Angeles"),
    # Quarterfinals (4 matches)
    (97, "Quarterfinal", None, "2026-07-09", "4:00 PM ET", "TBD QF-1", "TBD QF-1", "Boston"),
    (98, "Quarterfinal", None, "2026-07-10", "4:00 PM ET", "TBD QF-2", "TBD QF-2", "Miami"),
    (99, "Quarterfinal", None, "2026-07-11", "1:00 PM CT", "TBD QF-3", "TBD QF-3", "Kansas City"),
    (100, "Quarterfinal", None, "2026-07-11", "5:00 PM PT", "TBD QF-4", "TBD QF-4", "Los Angeles"),
    # Semifinals (2 matches)
    (101, "Semifinal", None, "2026-07-14", "3:00 PM ET", "TBD SF-1", "TBD SF-1", "Dallas"),
    (102, "Semifinal", None, "2026-07-15", "3:00 PM ET", "TBD SF-2", "TBD SF-2", "Atlanta"),
    # 3rd place
    (103, "3rd Place", None, "2026-07-18", "3:00 PM ET", "TBD 3rd-A", "TBD 3rd-B", "Miami"),
    # Final
    (104, "Final", None, "2026-07-19", "3:00 PM ET", "TBD Finalist-A", "TBD Finalist-B", "New York/NJ"),
]


def get_seed_matches():
    rows = _GROUP_RAW + _KNOCKOUT_RAW
    out = []
    for (mid, rnd, grp, d, t, h, a, v) in rows:
        out.append({
            "match_id": mid,
            "round": rnd,
            "group": grp,
            "date": d,
            "time": t,
            "kickoff_utc": to_utc_iso(d, t),
            "home": h,
            "away": a,
            "venue": v,
            "home_score": None,
            "away_score": None,
            "locked": False,
        })
    return out
