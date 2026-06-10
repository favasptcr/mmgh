# MMGH FIFA 2026 Prediction Contest – PRD

## Original Problem Statement
User shared a single-file React component (`mmgh-wc2026-predictions.jsx`) using `localStorage`. They asked: **"Use this code, enhance it, and create a URL to be used for my group"** — the MMGH (Malayalee Muslims of Greater Houston) community.

## Architecture
- **Frontend**: React (CRA + tailwind base) — modern, futuristic dark UI with cyan/pink neon glassmorphism.
- **Backend**: FastAPI + Motor (async MongoDB).
- **DB**: MongoDB `mmgh_wc2026` — collections: `matches`, `players`, `predictions`.
- **Routing**: All API endpoints under `/api/...` served via Kubernetes ingress; frontend uses `REACT_APP_BACKEND_URL`.

## User Personas
- **Participants**: Community members who submit predictions for all FIFA 2026 matches using just **name + email**.
- **Admin**: Single contest organizer who enters real match results and views the full ranked leaderboard.

## Core Requirements (static)
1. Predictions for all 104 matches: 72 group-stage + 32 knockout (R32 / R16 / QF / SF / 3rd Place / Final).
2. Scoring: **+1 correct winner**, **+3 exact draw score**, **+4 perfect (winner + exact score)**.
3. **Auto-lock** at kickoff time (server enforced via `kickoff_utc` comparison) — participants can't change picks after kickoff.
4. **Anonymous leaderboard** — only the admin sees rankings. Public stats page shows only participant count.
5. Admin password protection (`mmghfifa2026`) → Bearer-token authorized admin endpoints.
6. Knockout team names default to `TBD ...` and admin can rename via the panel as the bracket fills.
7. Prize info: 1st $250 / 2nd $100 / 3rd $50, sponsored by **FrameX LGS**.

## What's Been Implemented (2026-01-10 – v1)
- **Backend** (`/app/backend/server.py`, `matches_data.py`)
  - `POST /api/players/register` (name + email upsert by email)
  - `GET /api/players/me?email=` (player + their predictions)
  - `GET /api/matches` (all 104 with `locked_effective`)
  - `POST /api/predictions` (bulk save; rejects locked matches)
  - `GET /api/stats` (public: participants, matches_total, matches_scored)
  - `POST /api/admin/login` → bearer token
  - `POST /api/admin/result` (set scores, lock, rename teams)
  - `GET /api/admin/leaderboard` (sorted by total → perfect → correct)
  - `GET /api/admin/players` / `DELETE /api/admin/player/{email}`
  - Match seeding on startup with timezone-correct UTC kickoff timestamps.
- **Frontend** modern futuristic UI (Unbounded / Outfit fonts, cyan #00F0FF + pink #FF007F neon glassmorphism, dark `#0A0A0C`)
  - `Landing.js` — name+email entry, prize badges, scoring legend.
  - `Predictions.js` — round chips, group chips, glass match cards with live countdowns, sticky save bar.
  - `MatchCard.js` — flags, score inputs, lock indicator, result + earned-points badge.
  - `Stats.js` — participant count, "rankings are private" message (no leaderboard).
  - `AdminPanel.js` — Results / Leaderboard / Players tabs; inline team-rename for TBD knockout matches.
  - Live countdown timers (every 1s tick) per card.
- **Testing**: 100% backend (15/15 pytest) and 100% frontend critical flows passed in iteration 1.

## Deferred / Backlog
- P1: Export leaderboard as CSV / shareable image once contest ends.
- P1: Email magic-link verification (currently email is honor-system identifier).
- P2: Real-time WebSocket leaderboard updates (admin-only).
- P2: Per-knockout-round score multipliers (e.g., Final = 2×).
- P2: Push notifications / reminder emails before kickoff.

## Next Tasks
- Share the deployed URL with the MMGH group.
- Admin should log in with `mmghfifa2026` and update knockout team names as the group stage concludes.
