import { useEffect, useState, useCallback } from "react";
import { fetchMatches } from "@/lib/api";
import { getFlag, isPlaceholderTeam } from "@/lib/data";
import { RefreshCw } from "lucide-react";

const BRACKET_H = 640;
const CARD_W = 152;
const LINE_COLOR = "rgba(255,255,255,0.15)";
const WIN_COLOR = "#39FF14";

function getWinner(match) {
  if (match?.home_score == null) return null;
  if (match.home_score > match.away_score) return "home";
  if (match.away_score > match.home_score) return "away";
  if (match.penalty_winner) return match.penalty_winner;
  return null;
}

function TeamRow({ flag, name, score, isWinner, hasResult }) {
  const display = isPlaceholderTeam(name) ? "TBD"
    : name.length > 11 ? name.slice(0, 10) + "…" : name;
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 5,
      padding: "5px 7px",
      background: isWinner ? "rgba(57,255,20,0.1)" : "transparent",
      transition: "background 0.2s",
    }}>
      <span style={{ fontSize: 15, lineHeight: 1, flexShrink: 0 }}>{flag || "⚪"}</span>
      <span style={{
        flex: 1, fontFamily: "Unbounded", fontSize: 9, fontWeight: 700,
        color: isWinner ? WIN_COLOR : hasResult ? "#6b6b75" : "#fff",
        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
      }}>
        {display}
      </span>
      {hasResult && score != null && (
        <span style={{
          fontFamily: "Unbounded", fontSize: 12, fontWeight: 900,
          color: isWinner ? WIN_COLOR : "#A1A1AA",
          minWidth: 14, textAlign: "right", flexShrink: 0,
        }}>
          {score}
        </span>
      )}
    </div>
  );
}

function MatchCard({ match }) {
  if (!match) {
    return (
      <div style={{
        width: CARD_W, height: 68, borderRadius: 8,
        border: "1px dashed rgba(255,255,255,0.07)",
        background: "rgba(0,0,0,0.2)",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <span style={{ fontFamily: "Unbounded", fontSize: 8, color: "rgba(255,255,255,0.12)" }}>TBD</span>
      </div>
    );
  }

  const winner = getWinner(match);
  const hasResult = match.home_score != null;

  return (
    <div style={{
      width: CARD_W, borderRadius: 8, overflow: "hidden",
      border: `1px solid ${hasResult ? "rgba(255,255,255,0.14)" : "rgba(255,255,255,0.07)"}`,
      background: "rgba(0,0,0,0.45)",
      boxShadow: hasResult ? "0 2px 12px rgba(0,0,0,0.4)" : "none",
    }}>
      <TeamRow
        flag={getFlag(match.home)} name={match.home}
        score={match.home_score} isWinner={winner === "home"} hasResult={hasResult}
      />
      <div style={{ height: 1, background: "rgba(255,255,255,0.06)" }} />
      <TeamRow
        flag={getFlag(match.away)} name={match.away}
        score={match.away_score} isWinner={winner === "away"} hasResult={hasResult}
      />
      <div style={{
        fontSize: 8, color: "#4a4a54", padding: "2px 7px 3px",
        fontFamily: "JetBrains Mono", letterSpacing: "0.05em",
        borderTop: "1px solid rgba(255,255,255,0.04)",
        background: "rgba(0,0,0,0.2)",
      }}>
        {match.date} · {match.time}
      </div>
    </div>
  );
}

// Column of n evenly-spaced match cards using space-around
function RoundCol({ matches, slots }) {
  const cards = Array.from({ length: slots }, (_, i) => matches[i] || null);
  return (
    <div style={{
      display: "flex", flexDirection: "column",
      justifyContent: "space-around",
      height: BRACKET_H, flexShrink: 0,
    }}>
      {cards.map((m, i) => <MatchCard key={i} match={m} />)}
    </div>
  );
}

// CSS bracket connector lines between two adjacent rounds.
// `pairs` = number of pairs (= slots in the NEXT round)
// `dir` = "left" (opens right, for left half) | "right" (opens left, for right half)
function Connector({ pairs, dir = "left" }) {
  const slotH = BRACKET_H / pairs;
  return (
    <div style={{ position: "relative", width: 18, height: BRACKET_H, flexShrink: 0 }}>
      {Array.from({ length: pairs }).map((_, i) => {
        const top = i * slotH + slotH / 4;
        const height = slotH / 2;
        return (
          <div key={i} style={{
            position: "absolute",
            top, height, width: 18,
            ...(dir === "left"
              ? { borderRight: `2px solid ${LINE_COLOR}`, borderTop: `2px solid ${LINE_COLOR}`, borderBottom: `2px solid ${LINE_COLOR}` }
              : { borderLeft: `2px solid ${LINE_COLOR}`, borderTop: `2px solid ${LINE_COLOR}`, borderBottom: `2px solid ${LINE_COLOR}` }
            ),
          }} />
        );
      })}
    </div>
  );
}

function RoundHeader({ label, width }) {
  return (
    <div style={{
      width, textAlign: "center", flexShrink: 0,
      fontFamily: "Unbounded", fontSize: 8, fontWeight: 700,
      color: "rgba(255,255,255,0.25)", letterSpacing: "0.22em",
      paddingBottom: 10,
    }}>
      {label}
    </div>
  );
}

export default function Bracket() {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  const load = useCallback(async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const m = await fetchMatches();
      setMatches(m);
      setLastUpdated(new Date());
    } catch { /* ignore */ }
    finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(() => load(), 3 * 60 * 1000); // refresh every 3 min
    return () => clearInterval(id);
  }, [load]);

  if (loading) {
    return (
      <div style={{ color: "#6b6b75", textAlign: "center", padding: 60, fontFamily: "Unbounded", fontSize: 11 }}>
        Loading bracket…
      </div>
    );
  }

  const sorted = (round) =>
    matches.filter(m => m.round === round).sort((a, b) => a.match_id - b.match_id);

  const r16 = sorted("Round of 16");
  const qf  = sorted("Quarterfinal");
  const sf  = sorted("Semifinal");
  const fin = sorted("Final");
  const tp  = sorted("3rd Place");

  // WC2026 bracket structure — R32 matches are NOT adjacent to the R16 they feed.
  // Order: pairs that feed each R16 slot (R32-1+R32-4 → R16-1, etc.)
  const byId = (id) => matches.find(m => m.match_id === id) || null;

  // Left half
  const r32L = [73, 76, 75, 78, 74, 77, 79, 80].map(byId);
  const r16L = r16.slice(0, 4);
  const qfL  = qf.slice(0, 2);
  const sfL  = sf.slice(0, 1);

  // Right half
  const r32R = [83, 84, 81, 82, 87, 86, 85, 88].map(byId);
  const r16R = r16.slice(4, 8);
  const qfR  = qf.slice(2, 4);
  const sfR  = sf.slice(1, 2);

  const CON_W = 18;
  const CENTER_W = 180;

  return (
    <div style={{ padding: "20px 0 48px" }}>
      <div style={{ padding: "0 16px", marginBottom: 18, display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h2 style={{ fontFamily: "Unbounded", fontSize: 16, color: "#fff" }}>
            <span style={{ color: "#FF007F" }}>WC 2026</span> Bracket
          </h2>
          <div style={{ fontSize: 10, color: "#6b6b75", fontFamily: "JetBrains Mono", marginTop: 4 }}>
            Scroll horizontally · <span style={{ color: WIN_COLOR }}>■</span> = winner
            {lastUpdated && (
              <span style={{ marginLeft: 10 }}>
                · updated {lastUpdated.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </span>
            )}
          </div>
        </div>
        <button
          onClick={() => load(true)}
          disabled={refreshing}
          style={{
            display: "flex", alignItems: "center", gap: 6,
            padding: "8px 14px", borderRadius: 999,
            background: "rgba(0,240,255,0.06)",
            border: "1px solid rgba(0,240,255,0.2)",
            color: refreshing ? "#4a4a54" : "#00F0FF",
            fontFamily: "Unbounded", fontSize: 10, fontWeight: 700,
            letterSpacing: "0.08em", cursor: refreshing ? "default" : "pointer",
            transition: "opacity 0.2s",
          }}
        >
          <RefreshCw size={11} style={{ animation: refreshing ? "spin 1s linear infinite" : "none" }} />
          {refreshing ? "Updating…" : "Refresh"}
        </button>
      </div>

      <div style={{ overflowX: "auto", paddingBottom: 16 }}>
        <div style={{ display: "inline-flex", flexDirection: "column", padding: "0 16px", minWidth: "max-content" }}>

          {/* Round header labels */}
          <div style={{ display: "flex", alignItems: "flex-end", marginBottom: 0 }}>
            <RoundHeader label="R32" width={CARD_W} />
            <div style={{ width: CON_W }} />
            <RoundHeader label="R16" width={CARD_W} />
            <div style={{ width: CON_W }} />
            <RoundHeader label="QF" width={CARD_W} />
            <div style={{ width: CON_W }} />
            <RoundHeader label="SF" width={CARD_W} />
            <div style={{ width: CON_W }} />
            <RoundHeader label="FINAL" width={CENTER_W} />
            <div style={{ width: CON_W }} />
            <RoundHeader label="SF" width={CARD_W} />
            <div style={{ width: CON_W }} />
            <RoundHeader label="QF" width={CARD_W} />
            <div style={{ width: CON_W }} />
            <RoundHeader label="R16" width={CARD_W} />
            <div style={{ width: CON_W }} />
            <RoundHeader label="R32" width={CARD_W} />
          </div>

          {/* Bracket body */}
          <div style={{ display: "flex", alignItems: "center" }}>
            {/* ── Left half: R32 → R16 → QF → SF ── */}
            <RoundCol matches={r32L} slots={8} />
            <Connector pairs={4} dir="left" />
            <RoundCol matches={r16L} slots={4} />
            <Connector pairs={2} dir="left" />
            <RoundCol matches={qfL} slots={2} />
            <Connector pairs={1} dir="left" />
            <RoundCol matches={sfL} slots={1} />
            <Connector pairs={1} dir="left" />

            {/* ── Centre: Final + 3rd Place ── */}
            <div style={{
              width: CENTER_W, height: BRACKET_H, flexShrink: 0,
              display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center", gap: 0,
            }}>
              <div style={{ fontFamily: "Unbounded", fontSize: 9, color: "#FFD24A", letterSpacing: "0.22em", marginBottom: 8 }}>
                🏆 FINAL
              </div>
              <MatchCard match={fin[0] || null} />
              <div style={{
                fontFamily: "Unbounded", fontSize: 8, color: "#4a4a54",
                letterSpacing: "0.2em", margin: "18px 0 8px",
              }}>
                3RD PLACE
              </div>
              <MatchCard match={tp[0] || null} />
            </div>

            {/* ── Right half: SF → QF → R16 → R32 (mirrored) ── */}
            <Connector pairs={1} dir="right" />
            <RoundCol matches={sfR} slots={1} />
            <Connector pairs={1} dir="right" />
            <RoundCol matches={qfR} slots={2} />
            <Connector pairs={2} dir="right" />
            <RoundCol matches={r16R} slots={4} />
            <Connector pairs={4} dir="right" />
            <RoundCol matches={r32R} slots={8} />
          </div>
        </div>
      </div>
    </div>
  );
}
