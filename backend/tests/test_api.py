"""Backend API tests for MMGH WC2026 Prediction Contest."""
import os
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://tool-681.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"
ADMIN_PASS = "mmghfifa2026"
TEST_EMAIL = "TEST_user_pytest@example.com"
TEST_NAME = "TEST PytestUser"


@pytest.fixture(scope="session")
def s():
    sess = requests.Session()
    sess.headers.update({"Content-Type": "application/json"})
    return sess


@pytest.fixture(scope="session")
def admin_token(s):
    r = s.post(f"{API}/admin/login", json={"password": ADMIN_PASS})
    assert r.status_code == 200
    return r.json()["token"]


# Root
def test_root(s):
    r = s.get(f"{API}/")
    assert r.status_code == 200
    data = r.json()
    assert data["status"] == "ok"


# Matches
def test_matches_count_and_fields(s):
    r = s.get(f"{API}/matches")
    assert r.status_code == 200
    matches = r.json()
    assert len(matches) == 104, f"Expected 104 matches, got {len(matches)}"
    group_count = sum(1 for m in matches if m["round"] == "Group Stage")
    assert group_count == 72
    m1 = next(m for m in matches if m["match_id"] == 1)
    assert m1["home"] == "Mexico"
    assert m1["away"] == "South Africa"
    assert "kickoff_utc" in m1
    assert "locked_effective" in m1
    # Match 1 is June 2026 -> future -> not locked
    assert m1["locked_effective"] is False


# Register
def test_register_new_and_upsert(s):
    r = s.post(f"{API}/players/register", json={"name": TEST_NAME, "email": TEST_EMAIL})
    assert r.status_code == 200, r.text
    data = r.json()
    assert data["email"] == TEST_EMAIL.lower()
    assert data["name"] == TEST_NAME
    assert "id" in data
    pid = data["id"]
    # Re-register same email - should return existing
    r2 = s.post(f"{API}/players/register", json={"name": TEST_NAME, "email": TEST_EMAIL})
    assert r2.status_code == 200
    assert r2.json()["id"] == pid


def test_register_invalid_email(s):
    r = s.post(f"{API}/players/register", json={"name": "X", "email": "not-an-email"})
    assert r.status_code == 422


# Get me
def test_get_me(s):
    # ensure registered
    s.post(f"{API}/players/register", json={"name": TEST_NAME, "email": TEST_EMAIL})
    r = s.get(f"{API}/players/me", params={"email": TEST_EMAIL})
    assert r.status_code == 200
    data = r.json()
    assert data["player"]["email"] == TEST_EMAIL.lower()
    assert "predictions" in data


# Predictions save
def test_predictions_save_and_persist(s):
    s.post(f"{API}/players/register", json={"name": TEST_NAME, "email": TEST_EMAIL})
    body = {"email": TEST_EMAIL, "predictions": [
        {"match_id": 1, "home_score": 2, "away_score": 1},
        {"match_id": 2, "home_score": 1, "away_score": 1},
    ]}
    r = s.post(f"{API}/predictions", json=body)
    assert r.status_code == 200
    data = r.json()
    assert data["saved"] == 2
    # Verify GET
    r2 = s.get(f"{API}/players/me", params={"email": TEST_EMAIL})
    preds = r2.json()["predictions"]
    assert preds["1"]["home_score"] == 2
    assert preds["1"]["away_score"] == 1


# Stats
def test_public_stats(s):
    r = s.get(f"{API}/stats")
    assert r.status_code == 200
    data = r.json()
    assert data["matches_total"] == 104
    assert data["participants"] >= 1
    assert "matches_scored" in data


# Admin login
def test_admin_login_correct(s):
    r = s.post(f"{API}/admin/login", json={"password": ADMIN_PASS})
    assert r.status_code == 200
    assert r.json()["token"] == "mmgh-admin-secret-2026"


def test_admin_login_wrong(s):
    r = s.post(f"{API}/admin/login", json={"password": "wrong"})
    assert r.status_code == 401


def test_admin_leaderboard_no_token(s):
    r = s.get(f"{API}/admin/leaderboard")
    assert r.status_code == 401


def test_admin_leaderboard_with_token(s, admin_token):
    r = s.get(f"{API}/admin/leaderboard", headers={"Authorization": f"Bearer {admin_token}"})
    assert r.status_code == 200
    data = r.json()
    assert "leaderboard" in data
    assert "count" in data
    # Find test user
    found = [x for x in data["leaderboard"] if x["email"] == TEST_EMAIL.lower()]
    assert len(found) == 1
    for f in ["name", "email", "total", "perfect", "correct"]:
        assert f in found[0]


# Admin set result + scoring verification
def test_admin_set_result_and_scoring(s, admin_token):
    # Register & predict
    s.post(f"{API}/players/register", json={"name": TEST_NAME, "email": TEST_EMAIL})
    s.post(f"{API}/predictions", json={"email": TEST_EMAIL, "predictions": [
        {"match_id": 1, "home_score": 2, "away_score": 1}
    ]})
    # Use match 50 for the experiment (avoid disturbing match 1)
    # First make a fresh prediction on a clean match (use 60 for instance)
    s.post(f"{API}/predictions", json={"email": TEST_EMAIL, "predictions": [
        {"match_id": 60, "home_score": 3, "away_score": 0}
    ]})
    headers = {"Authorization": f"Bearer {admin_token}"}
    # Set result 3-0 for match 60 -> perfect non-draw = 4 pts
    r = s.post(f"{API}/admin/result", json={"match_id": 60, "home_score": 3, "away_score": 0}, headers=headers)
    assert r.status_code == 200, r.text
    res = r.json()
    assert res["home_score"] == 3
    assert res["away_score"] == 0
    # Check leaderboard for TEST user
    lb = s.get(f"{API}/admin/leaderboard", headers=headers).json()
    me = next(x for x in lb["leaderboard"] if x["email"] == TEST_EMAIL.lower())
    assert me["total"] >= 4
    assert me["perfect"] >= 1


def test_admin_set_result_correct_winner_only(s, admin_token):
    headers = {"Authorization": f"Bearer {admin_token}"}
    # Predict 1-0 on match 59
    s.post(f"{API}/predictions", json={"email": TEST_EMAIL, "predictions": [
        {"match_id": 59, "home_score": 1, "away_score": 0}
    ]})
    # Set actual 2-1 -> same winner, different score -> 1 pt
    r = s.post(f"{API}/admin/result", json={"match_id": 59, "home_score": 2, "away_score": 1}, headers=headers)
    assert r.status_code == 200
    lb = s.get(f"{API}/admin/leaderboard", headers=headers).json()
    me = next(x for x in lb["leaderboard"] if x["email"] == TEST_EMAIL.lower())
    assert me["correct"] >= 1


def test_admin_lock_blocks_predictions(s, admin_token):
    headers = {"Authorization": f"Bearer {admin_token}"}
    # Lock match 58
    r = s.post(f"{API}/admin/result", json={"match_id": 58, "locked": True}, headers=headers)
    assert r.status_code == 200
    assert r.json()["locked_effective"] is True
    # Attempt to predict on it
    r2 = s.post(f"{API}/predictions", json={"email": TEST_EMAIL, "predictions": [
        {"match_id": 58, "home_score": 1, "away_score": 1}
    ]})
    data = r2.json()
    assert data["saved"] == 0
    assert any(x["match_id"] == 58 for x in data["rejected"])
    # Cleanup - unlock
    s.post(f"{API}/admin/result", json={"match_id": 58, "locked": False}, headers=headers)


# Cleanup
def test_zz_cleanup(s, admin_token):
    headers = {"Authorization": f"Bearer {admin_token}"}
    # Reset altered match results so subsequent runs aren't dirty
    for mid in (59, 60):
        s.post(f"{API}/admin/result", json={"match_id": mid, "home_score": None, "away_score": None}, headers=headers)
    s.delete(f"{API}/admin/player/{TEST_EMAIL}", headers=headers)
