import { useState, useEffect } from "react";
import { Trophy, Check, Lock } from "lucide-react";
import { fetchMatches, getWinnerPrediction, saveWinnerPrediction } from "@/lib/api";
import { getFlag } from "@/lib/data";

export default function WinnerPrediction({ session }) {
  const [teams, setTeams] = useState([]);
  const [saved, setSaved] = useState(null);
  const [pending, setPending] = useState(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");
  const [isLocked, setIsLocked] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const [matches, winnerPred] = await Promise.all([
          fetchMatches(),
          getWinnerPrediction(session.email),
        ]);

        // Lock once any R32 match has kicked off
        const r32Started = matches.some(
          m => m.round === "Round of 32" && m.locked
        );
        setIsLocked(r32Started);

        const teamSet = new Set();
        matches
          .filter(m => m.round === "Group Stage")
          .forEach(m => {
            teamSet.add(m.home);
            teamSet.add(m.away);
          });
        setTeams([...teamSet].sort());

        if (winnerPred.team) {
          setSaved(winnerPred.team);
          setPending(winnerPred.team);
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [session.email]);

  const save = async () => {
    if (!pending || isLocked) return;
    setSaving(true);
    setMsg("");
    try {
      await saveWinnerPrediction(session.email, pending);
      setSaved(pending);
      setMsg("Pick saved!");
      setTimeout(() => setMsg(""), 3000);
    } catch {
      setMsg("Failed to save. Try again.");
    } finally {
      setSaving(false);
    }
  };

  const isDirty = pending !== saved;

  if (loading) {
    return (
      <div style={{ padding: 60, textAlign: "center", color: "#A1A1AA", fontFamily: "Outfit, sans-serif" }}>
        Loading…
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 820, margin: "0 auto", padding: "32px 16px" }}>
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: 32 }}>
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 8,
          padding: "6px 16px", borderRadius: 999,
          background: "rgba(255,215,0,0.1)", border: "1px solid rgba(255,215,0,0.4)",
          color: "#FFD700", fontFamily: "Unbounded", fontSize: 10, fontWeight: 700,
          letterSpacing: "0.2em", marginBottom: 14,
        }}>
          <Trophy size={12} /> $100 BONUS PRIZE
        </div>
        <h2 style={{
          fontFamily: "Unbounded", fontWeight: 900,
          fontSize: "clamp(22px, 5vw, 38px)", color: "#fff",
          marginBottom: 10, letterSpacing: "-0.02em",
        }}>
          World Cup Winner Pick
        </h2>

        {isLocked ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
            <p style={{ color: "#A1A1AA", fontSize: 14, maxWidth: 480, margin: 0, lineHeight: 1.7 }}>
              Picks are locked — Round of 32 has begun. One correct pick wins{" "}
              <strong style={{ color: "#FFD700" }}>$100</strong>.
            </p>
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              padding: "5px 14px", borderRadius: 999,
              background: "rgba(255,42,42,0.1)", border: "1px solid rgba(255,42,42,0.35)",
              color: "#FF4444", fontFamily: "Unbounded", fontSize: 10, fontWeight: 700,
              letterSpacing: "0.12em",
            }}>
              <Lock size={10} /> LOCKED
            </div>
          </div>
        ) : (
          <p style={{ color: "#A1A1AA", fontSize: 14, maxWidth: 500, margin: "0 auto", lineHeight: 1.7 }}>
            Pick the team you think will win the FIFA World Cup 2026. One correct pick wins{" "}
            <strong style={{ color: "#FFD700" }}>$100</strong>.{" "}
            <span style={{ color: "#FF7F50" }}>Locks when Round of 32 begins.</span>
          </p>
        )}

        {saved && (
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            margin: "18px 0 0", padding: "10px 20px", borderRadius: 999,
            background: isLocked ? "rgba(255,215,0,0.1)" : "rgba(57,255,20,0.1)",
            border: `1px solid ${isLocked ? "rgba(255,215,0,0.4)" : "rgba(57,255,20,0.35)"}`,
            color: isLocked ? "#FFD700" : "#39FF14",
            fontSize: 14, fontFamily: "Unbounded", fontWeight: 700,
            letterSpacing: "0.08em",
          }}>
            {isLocked ? <Trophy size={14} /> : <Check size={14} />}
            <span style={{ fontSize: 16 }}>{getFlag(saved)}</span>
            {saved}
            {isLocked && <span style={{ fontSize: 10, color: "#A1A1AA", fontWeight: 400, marginLeft: 4 }}>— your final pick</span>}
          </div>
        )}

        {!saved && isLocked && (
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            margin: "18px 0 0", padding: "10px 20px", borderRadius: 999,
            background: "rgba(255,42,42,0.1)", border: "1px solid rgba(255,42,42,0.3)",
            color: "#FF4444", fontSize: 13, fontFamily: "Unbounded", fontWeight: 700,
          }}>
            No pick submitted before lockout
          </div>
        )}
      </div>

      {/* Team grid */}
      <div className="glass" style={{ borderRadius: 16, padding: 20, marginBottom: 24 }}>
        <div style={{
          fontFamily: "Unbounded", fontSize: 10,
          color: isLocked ? "#4a4a54" : "#A1A1AA",
          letterSpacing: "0.25em", marginBottom: 16, textAlign: "center",
        }}>
          {isLocked ? "PICKS CLOSED — ALL 48 TEAMS" : `SELECT A TEAM — ${teams.length} TEAMS`}
        </div>
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
          gap: 8,
        }}>
          {teams.map(team => {
            const isSelected = pending === team;
            return (
              <button
                key={team}
                onClick={() => !isLocked && setPending(team)}
                disabled={isLocked}
                style={{
                  padding: "10px 8px",
                  borderRadius: 10,
                  cursor: isLocked ? "default" : "pointer",
                  textAlign: "center",
                  fontSize: 12,
                  fontWeight: 600,
                  fontFamily: "Outfit, sans-serif",
                  transition: "all 150ms ease",
                  background: isSelected
                    ? isLocked ? "rgba(255,215,0,0.12)" : "rgba(0,240,255,0.15)"
                    : "rgba(255,255,255,0.03)",
                  border: isSelected
                    ? `1px solid ${isLocked ? "#FFD700" : "#00F0FF"}`
                    : "1px solid rgba(255,255,255,0.05)",
                  color: isSelected
                    ? isLocked ? "#FFD700" : "#00F0FF"
                    : isLocked ? "#3a3a44" : "#E4E4E7",
                  boxShadow: isSelected && !isLocked ? "0 0 14px rgba(0,240,255,0.2)" : "none",
                  opacity: isLocked && !isSelected ? 0.3 : 1,
                }}
              >
                {isSelected && (
                  isLocked
                    ? <Trophy size={10} style={{ marginRight: 4, display: "inline" }} />
                    : <Check size={10} style={{ marginRight: 4, display: "inline" }} />
                )}
                {getFlag(team)} {team}
              </button>
            );
          })}
        </div>
      </div>

      {/* Save (hidden when locked) */}
      {!isLocked && (
        <div style={{ textAlign: "center" }}>
          {msg && (
            <div style={{
              marginBottom: 12,
              color: msg.includes("saved") ? "#39FF14" : "#FF2A2A",
              fontSize: 13, fontFamily: "Outfit, sans-serif",
            }}>
              {msg}
            </div>
          )}
          <button
            className="btn-primary"
            onClick={save}
            disabled={!pending || !isDirty || saving}
            style={{ minWidth: 200 }}
          >
            {saving
              ? "Saving…"
              : !pending
              ? "Select a Team First"
              : isDirty
              ? `Save Pick: ${pending}`
              : "Pick Saved ✓"}
          </button>
          {isDirty && pending && saved && (
            <div style={{ marginTop: 8, color: "#A1A1AA", fontSize: 11 }}>
              This will replace your current pick ({saved})
            </div>
          )}
        </div>
      )}
    </div>
  );
}
