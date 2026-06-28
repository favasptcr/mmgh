import { useEffect, useMemo, useState } from "react";
import { Save, Filter, CheckCircle2 } from "lucide-react";
import MatchCard from "@/components/MatchCard";
import { fetchMatches, fetchMe, savePredictions } from "@/lib/api";
import { ROUND_ORDER, ROUND_LABEL, GROUP_COLORS, calcPoints } from "@/lib/data";

export default function Predictions({ session }) {
  const [matches, setMatches] = useState([]);
  const [preds, setPreds] = useState({});
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);
  const [round, setRound] = useState("Group Stage");
  const [group, setGroup] = useState("All");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const reload = async () => {
    setLoading(true);
    try {
      const [m, me] = await Promise.all([fetchMatches(), fetchMe(session.email)]);
      setMatches(m);
      setPreds(me.predictions || {});
    } catch (e) {
      setError("Failed to load matches.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { reload(); /* eslint-disable-line */ }, [session.email]);

  const handleChange = (matchId, field, value) => {
    setPreds(p => ({
      ...p,
      [matchId]: { ...(p[matchId] || {}), [field]: value },
    }));
    setDirty(true);
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");
    const payload = Object.entries(preds)
      .filter(([_, v]) => v?.home_score !== "" && v?.home_score !== undefined &&
                          v?.away_score !== "" && v?.away_score !== undefined)
      .map(([mid, v]) => ({
        match_id: Number(mid),
        home_score: Number(v.home_score),
        away_score: Number(v.away_score),
        penalty_winner: v.penalty_winner || null,
        penalty_home_score: v.penalty_home_score !== "" && v.penalty_home_score != null ? Number(v.penalty_home_score) : null,
        penalty_away_score: v.penalty_away_score !== "" && v.penalty_away_score != null ? Number(v.penalty_away_score) : null,
      }));
    try {
      const res = await savePredictions(session.email, payload);
      setDirty(false);
      setSavedFlash(true);
      setTimeout(() => setSavedFlash(false), 2400);
      if (res.rejected?.length) {
        setError(`${res.rejected.length} prediction(s) rejected (match already locked).`);
      }
      // reload to get latest locked states
      reload();
    } catch (e) {
      setError("Failed to save predictions.");
    } finally {
      setSaving(false);
    }
  };

  // Available groups for current round
  const groups = useMemo(() => {
    const set = new Set(
      matches.filter(m => m.round === round && m.group).map(m => m.group)
    );
    return ["All", ...Array.from(set).sort()];
  }, [matches, round]);

  // Filter
  const filtered = useMemo(() => {
    return matches
      .filter(m => m.round === round)
      .filter(m => group === "All" || m.group === group);
  }, [matches, round, group]);

  // My current score (only for matches with results)
  const myScore = useMemo(() => {
    let total = 0, perfect = 0, winner = 0;
    for (const m of matches) {
      if (m.home_score == null) continue;
      const p = preds[m.match_id];
      if (!p) continue;
      const ph = Number(p.home_score), pa = Number(p.away_score);
      if (Number.isNaN(ph) || Number.isNaN(pa)) continue;
      const isKnockout = !m.group;
      const pts = calcPoints(ph, pa, m.home_score, m.away_score,
                             isKnockout ? (p.penalty_home_score ?? null) : null,
                             isKnockout ? (p.penalty_away_score ?? null) : null,
                             isKnockout ? (m.penalty_home_score ?? null) : null,
                             isKnockout ? (m.penalty_away_score ?? null) : null);
      if (pts == null) continue;
      total += pts;
      if (pts >= 4) perfect++;
      else if (pts >= 1) winner++;
    }
    return { total, perfect, winner };
  }, [matches, preds]);

  return (
    <div style={{ padding: "20px 16px 48px", maxWidth: 1100, margin: "0 auto" }}>
      {/* My score card */}
      <div className="glass-strong fade-up" style={{
        borderRadius: 14, padding: "14px 18px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        gap: 12, flexWrap: "wrap", marginBottom: 16,
      }} data-testid="my-score-card">
        <div>
          <div style={{ fontFamily: "Unbounded", fontSize: 10, color: "#A1A1AA", letterSpacing: "0.25em" }}>YOUR SCORE</div>
          <div style={{ marginTop: 4, fontSize: 13, color: "#fff" }}>
            <span style={{ fontFamily: "Unbounded", fontSize: 26, fontWeight: 900, color: "#00F0FF" }} className="text-glow-cyan">
              {myScore.total}
            </span>
            <span style={{ marginLeft: 8, color: "#A1A1AA", fontSize: 12 }}>pts</span>
          </div>
        </div>
        <div style={{ display: "flex", gap: 14, fontSize: 11, color: "#A1A1AA", flexWrap: "wrap" }}>
          <Stat color="#FFD24A" v={myScore.perfect} l="PERFECT (+4)" />
          <Stat color="#39FF14" v={myScore.winner} l="WINNER (+1)" />
        </div>
      </div>

      {/* Round chips */}
      <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 12, marginBottom: 8 }} data-testid="round-chips">
        {ROUND_ORDER.map(r => (
          <button
            key={r}
            onClick={() => { setRound(r); setGroup("All"); }}
            className={`chip ${round === r ? "active" : ""}`}
            data-testid={`round-chip-${r.replace(/\s+/g, "-").toLowerCase()}`}
          >
            {ROUND_LABEL[r]}
          </button>
        ))}
      </div>

      {/* Group chips (only for group stage) */}
      {round === "Group Stage" && (
        <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 12, marginBottom: 16 }} data-testid="group-chips">
          {groups.map(g => (
            <button
              key={g}
              onClick={() => setGroup(g)}
              className={`chip ${group === g ? "active-pink" : ""}`}
              data-testid={`group-chip-${g.toLowerCase()}`}
              style={g !== "All" && group !== g ? {
                borderColor: `${GROUP_COLORS[g]}55`,
                color: GROUP_COLORS[g],
              } : undefined}
            >
              {g === "All" ? <><Filter size={10}/> ALL</> : `GRP ${g}`}
            </button>
          ))}
        </div>
      )}

      {/* Matches list */}
      {loading ? (
        <div style={{ color: "#6b6b75", textAlign: "center", padding: 40 }}>Loading matches…</div>
      ) : (
        <div style={{ display: "grid", width: "100%", gridTemplateColumns: "repeat(auto-fit, minmax(min(260px, 100%), 1fr))", gap: 14 }}>
          {filtered.map(m => (
            <MatchCard
              key={m.match_id}
              match={m}
              prediction={preds[m.match_id]}
              onChange={handleChange}
            />
          ))}
        </div>
      )}

      {/* Save bar */}
      <div style={{
        position: "sticky", bottom: 16, marginTop: 24,
        display: "flex", justifyContent: "center",
      }}>
        <div className="glass-strong" style={{
          borderRadius: 999, padding: "8px 8px 8px 18px",
          display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap",
          boxShadow: dirty ? "0 0 24px rgba(255,210,74,0.25)" : "0 8px 28px rgba(0,0,0,0.45)",
          borderColor: dirty ? "rgba(255,210,74,0.4)" : undefined,
        }}>
          <span style={{ fontSize: 12, color: dirty ? "#FFD24A" : "#A1A1AA", fontFamily: "Unbounded", letterSpacing: "0.1em" }}>
            {savedFlash ? <><CheckCircle2 size={12} style={{ verticalAlign: "middle", color: "#39FF14" }}/> SAVED</> : dirty ? "UNSAVED CHANGES" : "ALL SAVED"}
          </span>
          <button
            data-testid="save-predictions-btn"
            className="btn-primary"
            onClick={handleSave}
            disabled={saving}
            style={{ display: "flex", alignItems: "center", gap: 6 }}
          >
            <Save size={14}/> {saving ? "SAVING…" : "SAVE PICKS"}
          </button>
        </div>
      </div>

      {error && (
        <div style={{ marginTop: 14, color: "#FF2A2A", fontSize: 12, textAlign: "center" }} data-testid="predictions-error">{error}</div>
      )}
    </div>
  );
}

function Stat({ color, v, l }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
      <span style={{ color, fontFamily: "Unbounded", fontWeight: 800, fontSize: 16 }}>{v}</span>
      <span style={{ fontFamily: "Unbounded", fontSize: 9, letterSpacing: "0.18em", color: "#6b6b75" }}>{l}</span>
    </div>
  );
}
