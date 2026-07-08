"""MMGH FIFA World Cup 2026 Prediction Contest backend."""
from fastapi import FastAPI, APIRouter, HTTPException, Header, Depends
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import asyncio
import logging
import uuid
from pathlib import Path
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, EmailStr, Field

from matches_data import get_seed_matches
from score_sync import sync_results_once, sync_schedule_once, sync_loop

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

mongo_url = os.environ["MONGO_URL"]
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ["DB_NAME"]]

ADMIN_PASSWORD = os.environ.get("ADMIN_PASSWORD", "mmghfifa2026")
ADMIN_TOKEN = os.environ.get("ADMIN_TOKEN", "mmgh-admin-secret-2026")

app = FastAPI(title="MMGH WC2026 Predictions")
api = APIRouter(prefix="/api")

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
log = logging.getLogger(__name__)

# ────────────────────────────────────────────────────────────────────────────
# Models
# ────────────────────────────────────────────────────────────────────────────

class RegisterIn(BaseModel):
    name: str
    email: EmailStr


class PredictionIn(BaseModel):
    match_id: int
    home_score: int = Field(ge=0, le=99)
    away_score: int = Field(ge=0, le=99)
    penalty_winner: Optional[str] = None        # "home" | "away" | null
    penalty_home_score: Optional[int] = None    # goals in shootout
    penalty_away_score: Optional[int] = None


class PredictionsBulkIn(BaseModel):
    email: EmailStr
    predictions: List[PredictionIn]


class AdminLoginIn(BaseModel):
    password: str


class WinnerPredictionIn(BaseModel):
    email: EmailStr
    team: str


class AdminResultIn(BaseModel):
    match_id: int
    home_score: Optional[int] = None
    away_score: Optional[int] = None
    locked: Optional[bool] = None
    home: Optional[str] = None
    away: Optional[str] = None
    kickoff_utc: Optional[str] = None
    penalty_winner: Optional[str] = None
    penalty_home_score: Optional[int] = None
    penalty_away_score: Optional[int] = None


# ────────────────────────────────────────────────────────────────────────────
# Helpers
# ────────────────────────────────────────────────────────────────────────────

def now_utc_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def strip_id(doc: Dict[str, Any]) -> Dict[str, Any]:
    if doc and "_id" in doc:
        doc.pop("_id", None)
    return doc


def is_locked(match: Dict[str, Any]) -> bool:
    """Match is locked if admin set it, OR if kickoff time has passed."""
    if match.get("locked"):
        return True
    try:
        ko = datetime.fromisoformat(match["kickoff_utc"])
        return datetime.now(timezone.utc) >= ko
    except Exception:
        return False


# Scoring tables for R16 onwards (new system).
# Group Stage + R32 use the old system (+4 exact, +1 correct outcome, +2 pen bonus).
KO_SCORING: Dict[str, Dict[str, int]] = {
    "Round of 16":  {"rw": 3, "rl": 2, "sw": 5, "sl": 2, "ow": 2, "ol": 2, "skip": 3},
    "Quarterfinal": {"rw": 4, "rl": 2, "sw": 6, "sl": 2, "ow": 3, "ol": 2, "skip": 3},
    "Semifinal":    {"rw": 5, "rl": 3, "sw": 8, "sl": 3, "ow": 3, "ol": 3, "skip": 4},
    "3rd Place":    {"rw": 5, "rl": 3, "sw": 8, "sl": 3, "ow": 3, "ol": 3, "skip": 4},
    "Final":        {"rw": 8, "rl": 4, "sw": 12, "sl": 4, "ow": 5, "ol": 4, "skip": 5},
}


def calc_points(pred_h: Optional[int], pred_a: Optional[int],
                act_h: Optional[int], act_a: Optional[int],
                round_name: str = "Group Stage",
                pred_pen_h: Optional[int] = None, pred_pen_a: Optional[int] = None,
                act_pen_h: Optional[int] = None, act_pen_a: Optional[int] = None,
                pred_pen_winner: Optional[str] = None,
                act_pen_winner: Optional[str] = None) -> Optional[int]:
    """
    Group Stage + R32 (old system):
      +4 exact score | +1 correct outcome | +2 bonus if exact penalty score matches
    R16+ (new system, per KO_SCORING):
      result call always scored (±), score checked only if result correct (±),
      shootout winner scored independently (±), skip = flat penalty for no prediction.
    """
    if act_h is None or act_a is None or pred_h is None or pred_a is None:
        return None

    sc = KO_SCORING.get(round_name)

    if sc is None:
        # OLD SYSTEM: Group Stage + Round of 32
        a_pen_h = act_pen_h if act_h == act_a else None
        a_pen_a = act_pen_a if act_h == act_a else None
        pen_bonus = 2 if (
            a_pen_h is not None and a_pen_a is not None and
            pred_pen_h is not None and pred_pen_a is not None and
            pred_pen_h == a_pen_h and pred_pen_a == a_pen_a
        ) else 0
        if a_pen_h is not None and a_pen_a is not None:
            actual_winner = "home" if a_pen_h > a_pen_a else "away"
        elif act_h > act_a:
            actual_winner = "home"
        elif act_a > act_h:
            actual_winner = "away"
        else:
            actual_winner = None
        if pred_h == act_h and pred_a == act_a:
            return 4 + pen_bonus
        pred_winner = "home" if pred_h > pred_a else ("away" if pred_a > pred_h else None)
        correct_outcome = (act_h == act_a) if pred_winner is None else (pred_winner == actual_winner)
        if correct_outcome:
            return 1 + pen_bonus
        return pen_bonus

    # NEW SYSTEM: R16, QF, SF, 3rd Place, Final
    is_draw = act_h == act_a
    pred_winner = "home" if pred_h > pred_a else ("away" if pred_a > pred_h else None)
    act_90_winner = "home" if act_h > act_a else ("away" if act_a > act_h else None)
    # Result call: purely 90-min outcome (draw vs which team won in regular time)
    correct_result = (pred_winner is None and is_draw) or (
        pred_winner is not None and pred_winner == act_90_winner
    )
    pts = sc["rw"] if correct_result else -sc["rl"]
    # Exact score only checked if result call was correct
    if correct_result:
        pts += sc["sw"] if (pred_h == act_h and pred_a == act_a) else -sc["sl"]
    # Shootout: +ow only if exact penalty goals match; -ol if wrong winner; 0 if correct winner but wrong goals
    if act_pen_winner is not None:
        exact_pen = (
            pred_pen_h is not None and pred_pen_a is not None and
            act_pen_h is not None and act_pen_a is not None and
            pred_pen_h == act_pen_h and pred_pen_a == act_pen_a
        )
        if exact_pen:
            pts += sc["ow"]
        elif pred_pen_winner is not None and pred_pen_winner != act_pen_winner:
            pts -= sc["ol"]
        # no prediction (null): no penalty charge
    return pts


def require_admin(authorization: str = Header(None)) -> bool:
    if not authorization:
        raise HTTPException(401, "Missing Authorization header")
    token = authorization.replace("Bearer ", "").strip()
    if token != ADMIN_TOKEN:
        raise HTTPException(401, "Invalid admin token")
    return True


# ────────────────────────────────────────────────────────────────────────────
# Startup: seed matches
# ────────────────────────────────────────────────────────────────────────────

@app.on_event("startup")
async def startup():
    await db.players.create_index("email", unique=True)
    await db.predictions.create_index([("email", 1), ("match_id", 1)], unique=True)
    await db.matches.create_index("match_id", unique=True)
    await db.winner_predictions.create_index("email", unique=True)

    seed = get_seed_matches()
    for m in seed:
        await db.matches.update_one(
            {"match_id": m["match_id"]},
            {"$set": {
                # Structural fields + kickoff_utc always overwritten so corrected
                # seed times propagate to existing DB records on restart.
                # sync_schedule_once runs 5s later and sets the ESPN-exact value.
                "round": m["round"],
                "group": m["group"],
                "kickoff_utc": m["kickoff_utc"],
            }, "$setOnInsert": {
                # Schedule/team fields only written on first insert so that
                # sync_schedule_once and admin edits survive server restarts
                "date": m["date"],
                "time": m["time"],
                "venue": m["venue"],
                "home": m["home"],
                "away": m["away"],
                "home_score": None,
                "away_score": None,
                "locked": False,
            }},
            upsert=True,
        )
    log.info("Match seed/refresh complete: %d total matches", len(seed))

    # Start background sync loop (TheSportsDB, every hour)
    app.state.sync_task = asyncio.create_task(sync_loop(db))
    log.info("Background score-sync task started")


@app.on_event("shutdown")
async def shutdown():
    task = getattr(app.state, "sync_task", None)
    if task:
        task.cancel()
    client.close()


# ────────────────────────────────────────────────────────────────────────────
# Public endpoints
# ────────────────────────────────────────────────────────────────────────────

@api.get("/")
async def root():
    return {"app": "MMGH WC2026 Predictions", "status": "ok"}


@api.get("/matches")
async def list_matches():
    cursor = db.matches.find({}).sort("match_id", 1)
    out = []
    async for m in cursor:
        strip_id(m)
        m["locked_effective"] = is_locked(m)
        out.append(m)
    return out


@api.post("/players/register")
async def register_player(body: RegisterIn):
    email = body.email.lower().strip()
    name = body.name.strip()
    if not name:
        raise HTTPException(400, "Name is required")
    existing = await db.players.find_one({"email": email})
    if existing:
        # update name if changed
        if existing.get("name") != name:
            await db.players.update_one({"email": email}, {"$set": {"name": name}})
        return {"id": existing["id"], "name": name, "email": email, "created_at": existing.get("created_at")}
    doc = {
        "id": str(uuid.uuid4()),
        "name": name,
        "email": email,
        "created_at": now_utc_iso(),
    }
    await db.players.insert_one(doc)
    strip_id(doc)
    return doc


@api.get("/players/me")
async def get_me(email: str):
    email = email.lower().strip()
    p = await db.players.find_one({"email": email})
    if not p:
        raise HTTPException(404, "Player not found")
    strip_id(p)
    preds_cursor = db.predictions.find({"email": email})
    predictions = {}
    async for pr in preds_cursor:
        predictions[str(pr["match_id"])] = {
            "home_score": pr["home_score"],
            "away_score": pr["away_score"],
            "penalty_winner": pr.get("penalty_winner"),
            "penalty_home_score": pr.get("penalty_home_score"),
            "penalty_away_score": pr.get("penalty_away_score"),
            "updated_at": pr.get("updated_at"),
        }
    return {"player": p, "predictions": predictions}


@api.post("/predictions")
async def save_predictions(body: PredictionsBulkIn):
    email = body.email.lower().strip()
    player = await db.players.find_one({"email": email})
    if not player:
        raise HTTPException(404, "Register first")

    saved = 0
    rejected = []
    for pred in body.predictions:
        match = await db.matches.find_one({"match_id": pred.match_id})
        if not match:
            rejected.append({"match_id": pred.match_id, "reason": "match not found"})
            continue
        if is_locked(match):
            rejected.append({"match_id": pred.match_id, "reason": "match locked"})
            continue
        pen = pred.penalty_winner if pred.penalty_winner in ("home", "away") else None
        doc = {
            "email": email,
            "match_id": pred.match_id,
            "home_score": pred.home_score,
            "away_score": pred.away_score,
            "penalty_winner": pen,
            "penalty_home_score": pred.penalty_home_score,
            "penalty_away_score": pred.penalty_away_score,
            "updated_at": now_utc_iso(),
        }
        await db.predictions.update_one(
            {"email": email, "match_id": pred.match_id},
            {"$set": doc},
            upsert=True,
        )
        saved += 1
    return {"saved": saved, "rejected": rejected}


@api.get("/stats")
async def public_stats():
    total_players = await db.players.count_documents({})
    total_matches = await db.matches.count_documents({})
    scored = await db.matches.count_documents({"home_score": {"$ne": None}})
    return {
        "participants": total_players,
        "matches_total": total_matches,
        "matches_scored": scored,
    }


@api.post("/winner-prediction")
async def save_winner_prediction(body: WinnerPredictionIn):
    email = body.email.lower().strip()
    player = await db.players.find_one({"email": email})
    if not player:
        raise HTTPException(404, "Register first")
    team = body.team.strip()
    if not team:
        raise HTTPException(400, "Team is required")
    await db.winner_predictions.update_one(
        {"email": email},
        {"$set": {"email": email, "team": team, "updated_at": now_utc_iso()}},
        upsert=True,
    )
    return {"email": email, "team": team}


@api.get("/winner-prediction")
async def get_winner_prediction(email: str):
    email = email.lower().strip()
    pred = await db.winner_predictions.find_one({"email": email})
    if not pred:
        return {"team": None}
    return {"team": pred["team"]}


# ────────────────────────────────────────────────────────────────────────────
# Admin endpoints
# ────────────────────────────────────────────────────────────────────────────

@api.post("/admin/login")
async def admin_login(body: AdminLoginIn):
    if body.password != ADMIN_PASSWORD:
        raise HTTPException(401, "Invalid password")
    return {"token": ADMIN_TOKEN}


@api.post("/admin/result")
async def admin_set_result(body: AdminResultIn, _: bool = Depends(require_admin)):
    match = await db.matches.find_one({"match_id": body.match_id})
    if not match:
        raise HTTPException(404, "Match not found")
    update = {}
    if body.home_score is not None:
        update["home_score"] = body.home_score
    if body.away_score is not None:
        update["away_score"] = body.away_score
    # If the result is not a draw, clear any penalty data — penalties can't happen
    if body.home_score is not None and body.away_score is not None:
        if body.home_score != body.away_score:
            update["penalty_winner"] = None
            update["penalty_home_score"] = None
            update["penalty_away_score"] = None
    if body.locked is not None:
        update["locked"] = body.locked
    if body.home is not None:
        update["home"] = body.home.strip()
    if body.away is not None:
        update["away"] = body.away.strip()
    if body.kickoff_utc is not None:
        update["kickoff_utc"] = body.kickoff_utc.strip()
    if body.penalty_winner is not None:
        update["penalty_winner"] = body.penalty_winner if body.penalty_winner in ("home", "away") else None
    if body.penalty_home_score is not None:
        update["penalty_home_score"] = body.penalty_home_score
    if body.penalty_away_score is not None:
        update["penalty_away_score"] = body.penalty_away_score
    if not update:
        raise HTTPException(400, "No fields provided")
    await db.matches.update_one({"match_id": body.match_id}, {"$set": update})
    updated = await db.matches.find_one({"match_id": body.match_id})
    strip_id(updated)
    updated["locked_effective"] = is_locked(updated)
    return updated


@api.post("/admin/sync")
async def admin_sync_now(_: bool = Depends(require_admin)):
    """Manually trigger a full-tournament TheSportsDB score sync."""
    res = await sync_results_once(db, full_scan=True)
    return res


@api.post("/admin/sync-schedule")
async def admin_sync_schedule(_: bool = Depends(require_admin)):
    """Pull date / time / kickoff_utc / venue from TheSportsDB for all matches.
    Safe — never touches scores or locked state."""
    res = await sync_schedule_once(db)
    return res


@api.post("/admin/fix-tbd-kickoffs")
async def admin_fix_tbd_kickoffs(_: bool = Depends(require_admin)):
    """Re-apply seed kickoff_utc to all TBD knockout matches.
    Also resets any ESPN placeholder names (e.g. 'Round of 32 1 Winner') back to
    the correct 'TBD R16-X' format so the schedule sync can replace them with real teams."""
    from score_sync import _is_placeholder_name
    seed = get_seed_matches()
    patched = []
    for m in seed:
        if not str(m.get("home", "")).startswith("TBD"):
            continue
        existing = await db.matches.find_one({"match_id": m["match_id"]})
        if not existing:
            continue
        patch: dict = {"kickoff_utc": m["kickoff_utc"]}
        # If stored names are ESPN placeholders (not our TBD format), reset them
        stored_home = existing.get("home", "")
        if _is_placeholder_name(stored_home) and not str(stored_home).startswith("TBD"):
            patch["home"] = m["home"]
            patch["away"] = m["away"]
            log.info("fix-tbd-kickoffs: resetting #%s '%s' → '%s'", m["match_id"], stored_home, m["home"])
        result = await db.matches.update_one(
            {"match_id": m["match_id"]},
            {"$set": patch},
        )
        if result.modified_count:
            patched.append(m["match_id"])
    sched = await sync_schedule_once(db)
    return {"patched_match_ids": patched, "schedule_sync": sched}


@api.get("/admin/espn-check")
async def admin_espn_check(date: str, _: bool = Depends(require_admin)):
    """Return raw ESPN events for a date (YYYY-MM-DD) — debug only."""
    from score_sync import fetch_espn_day
    events = await fetch_espn_day(date)
    return {"date": date, "count": len(events), "events": events}


@api.get("/admin/leaderboard")
async def admin_leaderboard(_: bool = Depends(require_admin)):
    # Build leaderboard from all players + predictions + matches
    matches_by_id: Dict[int, Dict] = {}
    async for m in db.matches.find({}):
        matches_by_id[m["match_id"]] = m

    players = []
    async for p in db.players.find({}):
        strip_id(p)
        players.append(p)

    out = []
    for p in players:
        total = 0
        perfect = 0
        correct = 0
        predicted = 0

        preds_by_match: Dict[int, Dict] = {}
        async for pr in db.predictions.find({"email": p["email"]}):
            preds_by_match[pr["match_id"]] = pr

        for match_id, match in matches_by_id.items():
            if match.get("home_score") is None:
                continue  # not played yet
            round_name = match.get("round", "Group Stage")
            pr = preds_by_match.get(match_id)

            if pr is None:
                sc = KO_SCORING.get(round_name)
                if sc:
                    total -= sc["skip"]  # skip penalty for R16+ only
                continue

            predicted += 1
            if pr.get("home_score") is None or pr.get("away_score") is None:
                continue

            is_new = round_name in KO_SCORING
            is_knockout = not match.get("group")  # R32+ (no group field)
            pts = calc_points(
                pr["home_score"], pr["away_score"],
                match.get("home_score"), match.get("away_score"),
                round_name,
                pred_pen_h=pr.get("penalty_home_score") if is_knockout else None,
                pred_pen_a=pr.get("penalty_away_score") if is_knockout else None,
                act_pen_h=match.get("penalty_home_score") if is_knockout else None,
                act_pen_a=match.get("penalty_away_score") if is_knockout else None,
                pred_pen_winner=pr.get("penalty_winner") if is_new else None,
                act_pen_winner=match.get("penalty_winner") if is_new else None,
            )
            if pts is None:
                continue
            total += pts
            if pts == 4:
                perfect += 1
            elif pts == 1:
                correct += 1

        out.append({
            "name": p["name"],
            "email": p["email"],
            "total": total,
            "perfect": perfect,
            "correct": correct,
            "predicted": predicted,
        })

    out.sort(key=lambda x: (-x["total"], -x["perfect"], -x["correct"]))
    return {"leaderboard": out, "count": len(out)}


@api.get("/admin/players")
async def admin_players(_: bool = Depends(require_admin)):
    players = []
    async for p in db.players.find({}):
        strip_id(p)
        players.append(p)
    return players


@api.delete("/admin/player/{email}")
async def admin_delete_player(email: str, _: bool = Depends(require_admin)):
    email = email.lower().strip()
    await db.predictions.delete_many({"email": email})
    await db.winner_predictions.delete_many({"email": email})
    res = await db.players.delete_one({"email": email})
    return {"deleted": res.deleted_count}


@api.get("/admin/winner-predictions")
async def admin_winner_predictions(_: bool = Depends(require_admin)):
    preds = []
    async for pred in db.winner_predictions.find({}):
        strip_id(pred)
        preds.append(pred)
    preds.sort(key=lambda x: x.get("updated_at", ""))
    return preds


app.include_router(api)
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get("CORS_ORIGINS", "*").split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)
