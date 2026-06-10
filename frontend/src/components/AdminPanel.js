import { useEffect, useMemo, useState } from "react";
import { Lock, Unlock, Save, RefreshCw, Trash2, Trophy, Pencil, Check, X } from "lucide-react";
import {
  fetchMatches, adminSetResult, adminGetLeaderboard,
  adminGetPlayers, adminDeletePlayer,
} from "@/lib/api";
import { ROUND_ORDER, ROUND_LABEL, GROUP_COLORS, getFlag } from "@/lib/data";

export default function AdminPanel() {
  const [tab, setTab] = useState("results"); // results | leaderboard | players
  const [matches, setMatches] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [players, setPlayers] = useState([]);
  const [round, setRound] = useState("Group Stage");
  const [drafts, setDrafts] = useState({}); // { mid: { home_score, away_score } }
  const [editTeams, setEditTeams] = useState({}); // { mid: { home, away } }
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  const reload = async () => {
    setBusy(true);
    try {
      const [m, lb, pl] = await Promise.all([fetchMatches(), adminGetLeaderboard(), adminGetPlayers()]);
      setMatches(m);
      setLeaderboard(lb.leaderboard);
      setPlayers(pl);
    } catch (e) {
      setMsg("Failed to load admin data.");
    } finally {
      setBusy(false);
    }
  };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { reload(); }, []);

  const filteredMatches = useMemo(() =>
    matches.filter(m => m.round === round), [matches, round]);

  const setDraft = (mid, field, val) => {
    setDrafts(d => ({ ...d, [mid]: { ...(d[mid] || {}), [field]: val } }));
  };

  const saveResult = async (match) => {
    const d = drafts[match.match_id] || {};
    const h = d.home_score ?? match.home_score;
    const a = d.away_score ?? match.away_score;
    if (h === undefined || h === null || h === "" || a === undefined || a === null || a === "") {
      alert("Enter both scores.");
      return;
    }
    setBusy(true);
    try {
      await adminSetResult({
        match_id: match.match_id,
        home_score: Number(h),
        away_score: Number(a),
      });
      setMsg(`Saved result for match #${match.match_id}`);
      setDrafts(d => { const x = { ...d }; delete x[match.match_id]; return x; });
      await reload();
    } catch (e) {
      alert("Failed to save: " + (e?.response?.data?.detail || e.message));
    } finally {
      setBusy(false);
    }
  };

  const toggleLock = async (match) => {
    const newLocked = !match.locked;
    if (newLocked && !window.confirm("Lock this match? Predictions will be frozen.")) return;
    setBusy(true);
    try {
      await adminSetResult({ match_id: match.match_id, locked: newLocked });
      await reload();
    } finally { setBusy(false); }
  };

  const startEditTeams = (m) => {
    setEditTeams(et => ({ ...et, [m.match_id]: { home: m.home, away: m.away } }));
  };
  const saveTeams = async (m) => {
    const e = editTeams[m.match_id];
    if (!e?.home || !e?.away) return;
    setBusy(true);
    try {
      await adminSetResult({ match_id: m.match_id, home: e.home, away: e.away });
      setEditTeams(et => { const x = { ...et }; delete x[m.match_id]; return x; });
      await reload();
    } finally { setBusy(false); }
  };
  const cancelEditTeams = (mid) => {
    setEditTeams(et => { const x = { ...et }; delete x[mid]; return x; });
  };

  const removePlayer = async (email) => {
    if (!window.confirm(`Remove ${email} and all their predictions?`)) return;
    setBusy(true);
    try {
      await adminDeletePlayer(email);
      await reload();
    } finally { setBusy(false); }
  };

  return (
    <div style={{ padding: "20px 16px 48px", maxWidth: 1100, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14, flexWrap: "wrap", gap: 10 }}>
        <h2 style={{ fontFamily: "Unbounded", fontSize: 18, color: "#fff" }}>
          <span style={{ color: "#FF007F" }}>Admin</span> Control
        </h2>
        <button onClick={reload} className="btn-ghost" data-testid="admin-refresh">
          <RefreshCw size={12} style={{ verticalAlign: "middle", marginRight: 6 }} /> Refresh
        </button>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 18, flexWrap: "wrap" }}>
        {[
          { id: "results", label: "Results" },
          { id: "leaderboard", label: `Leaderboard (${leaderboard.length})` },
          { id: "players", label: `Players (${players.length})` },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`chip ${tab === t.id ? "active-pink" : ""}`}
            data-testid={`admin-tab-${t.id}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {msg && <div style={{ marginBottom: 12, color: "#39FF14", fontSize: 12 }}>{msg}</div>}

      {tab === "results" && (
        <>
          <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 12, marginBottom: 16 }}>
            {ROUND_ORDER.map(r => (
              <button
                key={r}
                onClick={() => setRound(r)}
                className={`chip ${round === r ? "active" : ""}`}
                data-testid={`admin-round-${r.replace(/\s+/g, "-").toLowerCase()}`}
              >
                {ROUND_LABEL[r]}
              </button>
            ))}
          </div>

          <div style={{ display: "grid", gap: 10 }}>
            {filteredMatches.map(m => {
              const d = drafts[m.match_id] || {};
              const homeVal = d.home_score ?? (m.home_score ?? "");
              const awayVal = d.away_score ?? (m.away_score ?? "");
              const edit = editTeams[m.match_id];
              return (
                <div key={m.match_id} className="glass" style={{
                  borderRadius: 12, padding: "12px 14px",
                  display: "grid", gridTemplateColumns: "auto 1fr auto auto", gap: 12, alignItems: "center",
                }} data-testid={`admin-match-${m.match_id}`}>
                  <div style={{ fontFamily: "JetBrains Mono", color: "#6b6b75", fontSize: 11 }}>
                    #{m.match_id}
                    {m.group && (
                      <div style={{ marginTop: 2, color: GROUP_COLORS[m.group], fontWeight: 700 }}>{m.group}</div>
                    )}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    {edit ? (
                      <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
                        <input className="score-input" style={{ width: "auto", height: 32, padding: "4px 8px", fontSize: 12, textAlign: "left" }}
                          value={edit.home} onChange={(e) => setEditTeams(et => ({ ...et, [m.match_id]: { ...edit, home: e.target.value } }))} />
                        <span style={{ color: "#6b6b75" }}>vs</span>
                        <input className="score-input" style={{ width: "auto", height: 32, padding: "4px 8px", fontSize: 12, textAlign: "left" }}
                          value={edit.away} onChange={(e) => setEditTeams(et => ({ ...et, [m.match_id]: { ...edit, away: e.target.value } }))} />
                        <button className="btn-ghost" onClick={() => saveTeams(m)} style={{ padding: "4px 8px" }}><Check size={12} /></button>
                        <button className="btn-ghost" onClick={() => cancelEditTeams(m.match_id)} style={{ padding: "4px 8px" }}><X size={12} /></button>
                      </div>
                    ) : (
                      <div style={{ display: "flex", gap: 8, alignItems: "center", fontFamily: "Unbounded", fontSize: 13, fontWeight: 700, color: "#fff" }}>
                        <span>{getFlag(m.home)} {m.home}</span>
                        <span style={{ color: "#6b6b75" }}>vs</span>
                        <span>{getFlag(m.away)} {m.away}</span>
                        {(m.home?.startsWith("TBD") || m.away?.startsWith("TBD")) && (
                          <button onClick={() => startEditTeams(m)} className="btn-ghost" style={{ padding: "4px 8px" }} data-testid={`admin-edit-teams-${m.match_id}`}>
                            <Pencil size={11} />
                          </button>
                        )}
                      </div>
                    )}
                    <div style={{ fontSize: 10, color: "#6b6b75", fontFamily: "JetBrains Mono", marginTop: 2 }}>
                      {m.date} · {m.time} · {m.venue}
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <input
                      type="number" min="0" max="99"
                      value={homeVal}
                      onChange={(e) => setDraft(m.match_id, "home_score", e.target.value)}
                      className="score-input" style={{ width: 44, height: 38, fontSize: 16 }}
                      data-testid={`admin-home-score-${m.match_id}`}
                    />
                    <span style={{ color: "#6b6b75" }}>—</span>
                    <input
                      type="number" min="0" max="99"
                      value={awayVal}
                      onChange={(e) => setDraft(m.match_id, "away_score", e.target.value)}
                      className="score-input" style={{ width: 44, height: 38, fontSize: 16 }}
                      data-testid={`admin-away-score-${m.match_id}`}
                    />
                  </div>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button
                      onClick={() => saveResult(m)}
                      disabled={busy}
                      className="btn-ghost"
                      data-testid={`admin-save-${m.match_id}`}
                      style={{ display: "flex", alignItems: "center", gap: 4, padding: "8px 10px" }}
                    >
                      <Save size={12} /> Save
                    </button>
                    <button
                      onClick={() => toggleLock(m)}
                      disabled={busy}
                      className="btn-ghost"
                      data-testid={`admin-lock-${m.match_id}`}
                      style={{ padding: "8px 10px", color: m.locked ? "#FF2A2A" : "#A1A1AA" }}
                      title={m.locked_effective ? "Match locked" : "Lock match"}
                    >
                      {m.locked ? <Lock size={12} /> : <Unlock size={12} />}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {tab === "leaderboard" && (
        <div className="glass" style={{ borderRadius: 14, padding: 14 }}>
          <div style={{ fontFamily: "Unbounded", fontSize: 11, color: "#A1A1AA", letterSpacing: "0.25em", marginBottom: 12, textAlign: "center" }}>
            FULL STANDINGS (ADMIN ONLY)
          </div>
          {leaderboard.length === 0 ? (
            <div style={{ color: "#6b6b75", textAlign: "center", padding: 30 }}>No participants yet.</div>
          ) : (
            <div style={{ display: "grid", gap: 8 }}>
              {leaderboard.map((p, idx) => (
                <div key={p.email} data-testid={`lb-row-${idx}`}
                     style={{
                       display: "grid", gridTemplateColumns: "44px 1fr auto auto auto",
                       gap: 12, alignItems: "center",
                       padding: "10px 14px",
                       borderRadius: 10,
                       background: idx === 0 ? "linear-gradient(90deg, rgba(255,210,74,0.15), rgba(255,210,74,0.02))"
                                : idx === 1 ? "linear-gradient(90deg, rgba(192,192,192,0.12), rgba(192,192,192,0.02))"
                                : idx === 2 ? "linear-gradient(90deg, rgba(205,127,50,0.12), rgba(205,127,50,0.02))"
                                : "rgba(0,0,0,0.25)",
                       border: idx < 3 ? "1px solid rgba(255,210,74,0.25)" : "1px solid rgba(255,255,255,0.05)",
                     }}>
                  <div style={{
                    fontFamily: "Unbounded", fontWeight: 900, fontSize: 18,
                    color: idx === 0 ? "#FFD24A" : idx === 1 ? "#C0C0C0" : idx === 2 ? "#CD7F32" : "#6b6b75",
                  }}>
                    {idx === 0 ? <Trophy size={20} /> : `#${idx + 1}`}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ color: "#fff", fontWeight: 700, fontSize: 14, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {p.name}
                    </div>
                    <div style={{ color: "#6b6b75", fontSize: 11, fontFamily: "JetBrains Mono" }}>{p.email}</div>
                  </div>
                  <span style={{ color: "#FFD24A", fontFamily: "Unbounded", fontSize: 11 }}>🏆 {p.perfect}</span>
                  <span style={{ color: "#39FF14", fontFamily: "Unbounded", fontSize: 11 }}>✓ {p.correct}</span>
                  <span style={{
                    fontFamily: "Unbounded", fontWeight: 900, fontSize: 22, color: "#00F0FF",
                  }}>{p.total}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === "players" && (
        <div className="glass" style={{ borderRadius: 14, padding: 14 }}>
          {players.length === 0 ? (
            <div style={{ color: "#6b6b75", textAlign: "center", padding: 30 }}>No players yet.</div>
          ) : (
            <div style={{ display: "grid", gap: 8 }}>
              {players.map(p => (
                <div key={p.email} style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  padding: "10px 14px", borderRadius: 10,
                  background: "rgba(0,0,0,0.25)", border: "1px solid rgba(255,255,255,0.05)",
                }}>
                  <div>
                    <div style={{ color: "#fff", fontWeight: 700, fontSize: 14 }}>{p.name}</div>
                    <div style={{ color: "#6b6b75", fontSize: 11, fontFamily: "JetBrains Mono" }}>{p.email}</div>
                  </div>
                  <button onClick={() => removePlayer(p.email)} className="btn-ghost"
                          style={{ color: "#FF2A2A", padding: "6px 10px" }}
                          data-testid={`admin-remove-${p.email}`}>
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
