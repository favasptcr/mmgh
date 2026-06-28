import { useEffect, useMemo, useState } from "react";
import { Lock, Unlock, Save, RefreshCw, Trash2, Trophy, Pencil, Check, X, Zap, Star, Calendar } from "lucide-react";
import {
  fetchMatches, adminSetResult, adminGetLeaderboard,
  adminGetPlayers, adminDeletePlayer, adminSyncNow, adminSyncSchedule, adminFixTbdKickoffs, adminGetWinnerPredictions,
} from "@/lib/api";
import { ROUND_ORDER, ROUND_LABEL, GROUP_COLORS } from "@/lib/data";
import FlagImg from "@/components/FlagImg";

export default function AdminPanel() {
  const [tab, setTab] = useState("results"); // results | leaderboard | players | winner
  const [matches, setMatches] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [players, setPlayers] = useState([]);
  const [winnerPreds, setWinnerPreds] = useState([]);
  const [actualWinner, setActualWinner] = useState("");
  const [round, setRound] = useState("Group Stage");
  const [drafts, setDrafts] = useState({}); // { mid: { home_score, away_score } }
  const [editTeams, setEditTeams] = useState({}); // { mid: { home, away } }
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  const reload = async () => {
    setBusy(true);
    try {
      const [m, lb, pl, wp] = await Promise.all([
        fetchMatches(), adminGetLeaderboard(), adminGetPlayers(), adminGetWinnerPredictions(),
      ]);
      setMatches(m);
      setLeaderboard(lb.leaderboard);
      setPlayers(pl);
      setWinnerPreds(wp);
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

  const syncNow = async () => {
    setBusy(true);
    setMsg("Syncing scores from ESPN…");
    try {
      const res = await adminSyncNow();
      setMsg(`Score sync complete — ${res.synced} updated, ${res.finished_seen} finished, ${res.checked} checked.`);
      await reload();
    } catch (e) {
      setMsg("Sync failed: " + (e?.response?.data?.detail || e.message));
    } finally { setBusy(false); }
  };

  const syncSchedule = async () => {
    setBusy(true);
    setMsg("Syncing fixture schedule from ESPN…");
    try {
      const res = await adminSyncSchedule();
      setMsg(
        `Schedule sync complete — ${res.updated} matches updated, ${res.checked} checked` +
        (res.unmatched_count ? `, ${res.unmatched_count} unmatched.` : ".")
      );
      await reload();
    } catch (e) {
      setMsg("Schedule sync failed: " + (e?.response?.data?.detail || e.message));
    } finally { setBusy(false); }
  };

  const fixTbdKickoffs = async () => {
    setBusy(true);
    setMsg("Fixing TBD match kickoff times from seed data…");
    try {
      const res = await adminFixTbdKickoffs();
      const sched = res.schedule_sync || {};
      setMsg(
        `TBD kickoff fix complete — ${res.patched_match_ids?.length ?? 0} slots re-timed, ` +
        `${sched.updated ?? 0} matches updated from ESPN.`
      );
      await reload();
    } catch (e) {
      setMsg("Fix failed: " + (e?.response?.data?.detail || e.message));
    } finally { setBusy(false); }
  };

  return (
    <div style={{ padding: "20px 16px 48px", maxWidth: 1100, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14, flexWrap: "wrap", gap: 10 }}>
        <h2 style={{ fontFamily: "Unbounded", fontSize: 18, color: "#fff" }}>
          <span style={{ color: "#FF007F" }}>Admin</span> Control
        </h2>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button onClick={syncNow} disabled={busy} className="btn-ghost" data-testid="admin-sync-now"
                  style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "#00F0FF", borderColor: "rgba(0,240,255,0.4)" }}>
            <Zap size={12} /> Sync Scores Now
          </button>
          <button onClick={syncSchedule} disabled={busy} className="btn-ghost" data-testid="admin-sync-schedule"
                  style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "#FFD24A", borderColor: "rgba(255,210,74,0.4)" }}>
            <Calendar size={12} /> Sync Schedule
          </button>
          <button onClick={fixTbdKickoffs} disabled={busy} className="btn-ghost" data-testid="admin-fix-tbd-kickoffs"
                  style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "#FF007F", borderColor: "rgba(255,0,127,0.4)" }}>
            <Zap size={12} /> Fix TBD Times
          </button>
          <button onClick={reload} className="btn-ghost" data-testid="admin-refresh">
            <RefreshCw size={12} style={{ verticalAlign: "middle", marginRight: 6 }} /> Refresh
          </button>
        </div>
      </div>
      <div style={{ marginBottom: 12, fontSize: 11, color: "#6b6b75" }}>
        <Zap size={11} style={{ verticalAlign: "middle", color: "#00F0FF" }} /> Scores auto-sync hourly from ESPN. Finished matches lock automatically — you can still manually override any score.
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 18, flexWrap: "wrap" }}>
        {[
          { id: "results", label: "Results" },
          { id: "leaderboard", label: `Leaderboard (${leaderboard.length})` },
          { id: "players", label: `Players (${players.length})` },
          { id: "winner", label: `WC Winner Picks (${winnerPreds.length})` },
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
                        <span style={{ display: "flex", alignItems: "center", gap: 6 }}><FlagImg team={m.home} size={18} /> {m.home}</span>
                        <span style={{ color: "#6b6b75" }}>vs</span>
                        <span style={{ display: "flex", alignItems: "center", gap: 6 }}><FlagImg team={m.away} size={18} /> {m.away}</span>
                        {m.round !== "Group Stage" && (
                          <button onClick={() => startEditTeams(m)} className="btn-ghost" style={{ padding: "4px 8px" }} data-testid={`admin-edit-teams-${m.match_id}`}>
                            <Pencil size={11} />
                          </button>
                        )}
                      </div>
                    )}
                    <div style={{ fontSize: 10, color: "#6b6b75", fontFamily: "JetBrains Mono", marginTop: 2, display: "flex", alignItems: "center", gap: 8 }}>
                      <span>{m.date} · {m.time} · {m.venue}</span>
                      {m.synced_source && (
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 3, color: "#00F0FF" }}>
                          <Zap size={10} /> auto-synced
                        </span>
                      )}
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

      {tab === "winner" && (
        <WinnerPicksTab
          winnerPreds={winnerPreds}
          players={players}
          leaderboard={leaderboard}
          actualWinner={actualWinner}
          setActualWinner={setActualWinner}
        />
      )}
    </div>
  );
}

function WinnerPicksTab({ winnerPreds, players, leaderboard, actualWinner, setActualWinner }) {
  const [drawnWinner, setDrawnWinner] = useState(null);

  const playerMap = useMemo(() => {
    const m = {};
    players.forEach(p => { m[p.email] = p.name; });
    return m;
  }, [players]);

  const scoreMap = useMemo(() => {
    const m = {};
    leaderboard.forEach((p, idx) => { m[p.email] = { total: p.total, rank: idx + 1 }; });
    return m;
  }, [leaderboard]);

  const winner = actualWinner.trim().toLowerCase();

  const correctPickers = useMemo(() => {
    if (!winner) return [];
    return winnerPreds
      .filter(p => p.team.toLowerCase() === winner)
      .slice()
      .sort((a, b) => {
        // Primary: highest leaderboard score wins
        const aScore = scoreMap[a.email]?.total ?? -1;
        const bScore = scoreMap[b.email]?.total ?? -1;
        if (bScore !== aScore) return bScore - aScore;
        // Tiebreaker: earliest submission time
        return (a.updated_at || "").localeCompare(b.updated_at || "");
      });
  }, [winnerPreds, winner, scoreMap]);

  // Group all predictions by team for summary bar
  const byTeam = useMemo(() => {
    const map = {};
    winnerPreds.forEach(p => {
      if (!map[p.team]) map[p.team] = [];
      map[p.team].push(p);
    });
    return Object.entries(map).sort((a, b) => b[1].length - a[1].length);
  }, [winnerPreds]);

  const randomDraw = () => {
    if (!correctPickers.length) return;
    const picked = correctPickers[Math.floor(Math.random() * correctPickers.length)];
    setDrawnWinner(picked.email);
  };

  return (
    <div>
      {/* Actual winner input */}
      <div className="glass-strong" style={{
        borderRadius: 14, padding: "16px 18px", marginBottom: 16,
        display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap",
        border: winner ? "1px solid rgba(255,210,74,0.4)" : undefined,
      }}>
        <Star size={16} style={{ color: "#FFD24A", flexShrink: 0 }} />
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: "Unbounded", fontSize: 9, color: "#A1A1AA", letterSpacing: "0.25em", marginBottom: 6 }}>
            ACTUAL WORLD CUP WINNER
          </div>
          <input
            value={actualWinner}
            onChange={e => { setActualWinner(e.target.value); setDrawnWinner(null); }}
            placeholder="e.g. Brazil, France, Argentina…"
            style={{
              background: "rgba(0,0,0,0.5)", border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: 8, padding: "8px 12px", color: "#fff",
              fontFamily: "Unbounded", fontSize: 13, outline: "none", width: "100%",
            }}
          />
        </div>
        {winner && (
          <div style={{ fontFamily: "Unbounded", fontSize: 12, fontWeight: 800, color: "#FFD24A", whiteSpace: "nowrap" }}>
            {correctPickers.length} correct {correctPickers.length === 1 ? "pick" : "picks"}
          </div>
        )}
      </div>

      {/* Tiebreaker result — only when multiple correct pickers */}
      {winner && correctPickers.length > 1 && (
        <div className="glass-strong" style={{
          borderRadius: 14, padding: "18px 20px", marginBottom: 16,
          border: "1px solid rgba(255,210,74,0.5)",
          background: "rgba(255,210,74,0.06)",
        }}>
          <div style={{ fontFamily: "Unbounded", fontSize: 9, color: "#FFD24A", letterSpacing: "0.25em", marginBottom: 14 }}>
            TIEBREAKER — {correctPickers.length} PEOPLE GOT IT RIGHT
          </div>

          {/* Method A: score-based winner */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11, color: "#A1A1AA", marginBottom: 10 }}>
              <strong style={{ color: "#fff" }}>Method A — Highest leaderboard score wins</strong>
              <span style={{ color: "#6b6b75" }}> · earliest pick breaks ties</span>
            </div>
            <div style={{
              display: "flex", alignItems: "center", gap: 12,
              padding: "14px 16px", borderRadius: 12,
              background: "rgba(255,210,74,0.12)", border: "1px solid rgba(255,210,74,0.4)",
            }}>
              <Trophy size={22} style={{ color: "#FFD24A", flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: "Unbounded", fontWeight: 900, fontSize: 16, color: "#FFD24A" }}>
                  {playerMap[correctPickers[0].email] || correctPickers[0].email}
                </div>
                <div style={{ fontSize: 11, color: "#6b6b75", fontFamily: "JetBrains Mono" }}>{correctPickers[0].email}</div>
              </div>
              <div style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                <div style={{ fontFamily: "Unbounded", fontWeight: 900, fontSize: 22, color: "#00F0FF" }}>
                  {scoreMap[correctPickers[0].email]?.total ?? "—"}
                </div>
                <div style={{ fontSize: 10, color: "#6b6b75" }}>pts · rank #{scoreMap[correctPickers[0].email]?.rank ?? "?"}</div>
              </div>
            </div>
          </div>

          {/* Method B: random draw */}
          <div>
            <div style={{ fontSize: 11, color: "#A1A1AA", marginBottom: 10 }}>
              <strong style={{ color: "#fff" }}>Method B — Random draw</strong>
              <span style={{ color: "#6b6b75" }}> · fair lottery among correct pickers</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
              <button
                onClick={randomDraw}
                className="btn-ghost"
                style={{ display: "flex", alignItems: "center", gap: 6, color: "#FF007F", borderColor: "rgba(255,0,127,0.4)" }}
              >
                🎲 Draw Random Winner
              </button>
              {drawnWinner && (
                <div style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "10px 16px", borderRadius: 12, flex: 1,
                  background: "rgba(255,0,127,0.10)", border: "1px solid rgba(255,0,127,0.4)",
                }}>
                  <Trophy size={16} style={{ color: "#FF007F", flexShrink: 0 }} />
                  <div>
                    <div style={{ fontFamily: "Unbounded", fontWeight: 800, fontSize: 14, color: "#FF007F" }}>
                      {playerMap[drawnWinner] || drawnWinner}
                    </div>
                    <div style={{ fontSize: 11, color: "#6b6b75", fontFamily: "JetBrains Mono" }}>{drawnWinner}</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Single correct picker — instant winner */}
      {winner && correctPickers.length === 1 && (
        <div style={{
          display: "flex", alignItems: "center", gap: 14,
          padding: "16px 18px", borderRadius: 14, marginBottom: 16,
          background: "rgba(255,210,74,0.12)", border: "1px solid rgba(255,210,74,0.5)",
        }}>
          <Trophy size={28} style={{ color: "#FFD24A", flexShrink: 0 }} />
          <div>
            <div style={{ fontFamily: "Unbounded", fontSize: 9, color: "#FFD24A", letterSpacing: "0.25em", marginBottom: 4 }}>
              $100 WINNER
            </div>
            <div style={{ fontFamily: "Unbounded", fontWeight: 900, fontSize: 18, color: "#FFD24A" }}>
              {playerMap[correctPickers[0].email] || correctPickers[0].email}
            </div>
            <div style={{ fontSize: 11, color: "#6b6b75", fontFamily: "JetBrains Mono" }}>{correctPickers[0].email}</div>
          </div>
        </div>
      )}

      {winnerPreds.length === 0 ? (
        <div style={{ color: "#6b6b75", textAlign: "center", padding: 30 }}>No winner predictions submitted yet.</div>
      ) : (
        <>
          {/* Summary chips by team */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontFamily: "Unbounded", fontSize: 9, color: "#A1A1AA", letterSpacing: "0.25em", marginBottom: 10 }}>
              PICKS BY TEAM
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {byTeam.map(([team, preds]) => {
                const isWinner = winner && team.toLowerCase() === winner;
                return (
                  <div key={team} style={{
                    display: "inline-flex", alignItems: "center", gap: 6,
                    padding: "5px 12px", borderRadius: 999,
                    background: isWinner ? "rgba(255,210,74,0.15)" : "rgba(255,255,255,0.05)",
                    border: `1px solid ${isWinner ? "rgba(255,210,74,0.5)" : "rgba(255,255,255,0.08)"}`,
                    color: isWinner ? "#FFD24A" : "#A1A1AA",
                    fontFamily: "Unbounded", fontSize: 10, fontWeight: 700,
                  }}>
                    {isWinner && <Trophy size={11} />}
                    {team}
                    <span style={{
                      background: isWinner ? "rgba(255,210,74,0.25)" : "rgba(0,0,0,0.3)",
                      borderRadius: 999, padding: "1px 7px", fontSize: 11,
                      color: isWinner ? "#FFD24A" : "#fff",
                    }}>
                      {preds.length}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* All individual picks */}
          <div className="glass" style={{ borderRadius: 14, padding: 14 }}>
            <div style={{ fontFamily: "Unbounded", fontSize: 9, color: "#A1A1AA", letterSpacing: "0.25em", marginBottom: 12 }}>
              ALL PICKS
            </div>
            <div style={{ display: "grid", gap: 8 }}>
              {winnerPreds
                .slice()
                .sort((a, b) => {
                  const aC = winner && a.team.toLowerCase() === winner;
                  const bC = winner && b.team.toLowerCase() === winner;
                  if (aC && !bC) return -1;
                  if (!aC && bC) return 1;
                  return a.team.localeCompare(b.team);
                })
                .map(p => {
                  const isCorrect = winner && p.team.toLowerCase() === winner;
                  const isDrawn = drawnWinner === p.email;
                  const name = playerMap[p.email] || p.email;
                  const score = scoreMap[p.email];
                  const submittedAt = p.updated_at ? new Date(p.updated_at).toLocaleString() : "—";
                  return (
                    <div key={p.email} style={{
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      gap: 12, padding: "10px 14px", borderRadius: 10,
                      background: isDrawn ? "rgba(255,0,127,0.10)" : isCorrect ? "rgba(255,210,74,0.08)" : "rgba(0,0,0,0.25)",
                      border: `1px solid ${isDrawn ? "rgba(255,0,127,0.4)" : isCorrect ? "rgba(255,210,74,0.35)" : "rgba(255,255,255,0.05)"}`,
                    }}>
                      <div style={{ minWidth: 0 }}>
                        <div style={{
                          color: isDrawn ? "#FF007F" : isCorrect ? "#FFD24A" : "#fff",
                          fontWeight: 700, fontSize: 14,
                          display: "flex", alignItems: "center", gap: 6,
                        }}>
                          {(isCorrect || isDrawn) && <Trophy size={13} style={{ color: isDrawn ? "#FF007F" : "#FFD24A", flexShrink: 0 }} />}
                          {name}
                        </div>
                        <div style={{ fontSize: 10, color: "#6b6b75", fontFamily: "JetBrains Mono", marginTop: 2 }}>
                          {p.email}
                          {isCorrect && score && (
                            <span style={{ marginLeft: 10, color: "#00F0FF" }}>
                              {score.total}pts · rank #{score.rank}
                            </span>
                          )}
                          {isCorrect && (
                            <span style={{ marginLeft: 10, color: "#6b6b75" }}>submitted {submittedAt}</span>
                          )}
                        </div>
                      </div>
                      <div style={{
                        fontFamily: "Unbounded", fontWeight: 800, fontSize: 12,
                        color: isDrawn ? "#FF007F" : isCorrect ? "#FFD24A" : "#A1A1AA",
                        background: isDrawn ? "rgba(255,0,127,0.12)" : isCorrect ? "rgba(255,210,74,0.12)" : "rgba(255,255,255,0.05)",
                        border: `1px solid ${isDrawn ? "rgba(255,0,127,0.3)" : isCorrect ? "rgba(255,210,74,0.3)" : "rgba(255,255,255,0.08)"}`,
                        padding: "5px 12px", borderRadius: 8, whiteSpace: "nowrap",
                      }}>
                        {p.team}
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
