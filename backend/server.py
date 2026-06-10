"""MMGH FIFA World Cup 2026 Prediction Contest backend."""
from fastapi import FastAPI, APIRouter, HTTPException, Header, Depends
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import uuid
from pathlib import Path
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, EmailStr, Field

from matches_data import get_seed_matches

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


class PredictionsBulkIn(BaseModel):
    email: EmailStr
    predictions: List[PredictionIn]


class AdminLoginIn(BaseModel):
    password: str


class AdminResultIn(BaseModel):
    match_id: int
    home_score: Optional[int] = None
    away_score: Optional[int] = None
    locked: Optional[bool] = None
    home: Optional[str] = None
    away: Optional[str] = None


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


def calc_points(pred_h: Optional[int], pred_a: Optional[int],
                act_h: Optional[int], act_a: Optional[int]) -> Optional[int]:
    """Scoring:
      +4 — winner + exact score (exact score prediction)
      +1 — correct outcome (winner or draw) but wrong score
       0 — wrong outcome
    """
    if act_h is None or act_a is None or pred_h is None or pred_a is None:
        return None
    if pred_h == act_h and pred_a == act_a:
        return 4
    a_winner = "h" if act_h > act_a else ("a" if act_a > act_h else "d")
    p_winner = "h" if pred_h > pred_a else ("a" if pred_a > pred_h else "d")
    if a_winner == p_winner:
        return 1
    return 0


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

    seed = get_seed_matches()
    for m in seed:
        existing = await db.matches.find_one({"match_id": m["match_id"]})
        if not existing:
            await db.matches.insert_one(m)
    log.info("Match seed complete: %d total matches", len(seed))


@app.on_event("shutdown")
async def shutdown():
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
        doc = {
            "email": email,
            "match_id": pred.match_id,
            "home_score": pred.home_score,
            "away_score": pred.away_score,
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
    if body.locked is not None:
        update["locked"] = body.locked
    if body.home is not None:
        update["home"] = body.home.strip()
    if body.away is not None:
        update["away"] = body.away.strip()
    if not update:
        raise HTTPException(400, "No fields provided")
    await db.matches.update_one({"match_id": body.match_id}, {"$set": update})
    updated = await db.matches.find_one({"match_id": body.match_id})
    strip_id(updated)
    updated["locked_effective"] = is_locked(updated)
    return updated


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
        perfect = 0  # 4-pt or 3-pt exact
        correct = 0  # 1-pt
        predicted = 0
        async for pr in db.predictions.find({"email": p["email"]}):
            match = matches_by_id.get(pr["match_id"])
            if not match:
                continue
            predicted += 1
            pts = calc_points(pr["home_score"], pr["away_score"],
                              match.get("home_score"), match.get("away_score"))
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
    res = await db.players.delete_one({"email": email})
    return {"deleted": res.deleted_count}


app.include_router(api)
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get("CORS_ORIGINS", "*").split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)
