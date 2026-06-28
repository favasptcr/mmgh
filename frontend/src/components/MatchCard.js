import { Lock, MapPin, Clock, CheckCircle2, Trophy } from "lucide-react";
import { useCountdown } from "@/lib/useCountdown";
import { getFlag, GROUP_COLORS, ROUND_LABEL, calcPoints } from "@/lib/data";

const FRAMEX_LOCAL = "/framex-logo.jpg";

export default function MatchCard({ match, prediction, onChange, readOnly }) {
  const locked = match.locked_effective || readOnly;
  const hasResult = match.home_score !== null && match.home_score !== undefined;
  const groupColor = match.group ? GROUP_COLORS[match.group] : "#A1A1AA";
  const { label: cdLabel, live, soon } = useCountdown(match.kickoff_utc);

  const isKnockout = !match.group;
  const penWinner = prediction?.penalty_winner ?? null;

  const pts = hasResult && prediction?.home_score !== undefined && prediction?.away_score !== undefined
    ? calcPoints(Number(prediction.home_score), Number(prediction.away_score),
                 match.home_score, match.away_score,
                 penWinner, match.penalty_winner || null)
    : null;

  const handleHome = (v) => {
    if (locked) return;
    onChange?.(match.match_id, "home_score", v);
  };
  const handleAway = (v) => {
    if (locked) return;
    onChange?.(match.match_id, "away_score", v);
  };
  const handlePenWinner = (side) => {
    if (locked) return;
    // Toggle: clicking the already-selected side clears it
    onChange?.(match.match_id, "penalty_winner", penWinner === side ? null : side);
  };

  const homeVal = prediction?.home_score ?? "";
  const awayVal = prediction?.away_score ?? "";

  const cardCls = `match-card fade-up ${locked ? "locked" : ""} ${hasResult ? "scored" : ""}`;

  return (
    <div className={cardCls} data-testid={`match-card-${match.match_id}`}>
      {/* Header row: round / group / countdown */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12, gap: 8, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {match.group ? (
            <span style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              padding: "4px 10px", borderRadius: 999,
              background: `${groupColor}1a`, border: `1px solid ${groupColor}55`,
              fontFamily: "Unbounded", fontSize: 10, fontWeight: 700, color: groupColor,
              letterSpacing: "0.12em",
            }}>
              <span className="group-dot" style={{ background: groupColor }} />
              GRP {match.group}
            </span>
          ) : (
            <span style={{
              padding: "4px 10px", borderRadius: 999,
              background: "rgba(255,0,127,0.12)", border: "1px solid rgba(255,0,127,0.4)",
              fontFamily: "Unbounded", fontSize: 10, fontWeight: 700, color: "#FF007F",
              letterSpacing: "0.12em",
            }}>
              {ROUND_LABEL[match.round] || match.round}
            </span>
          )}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "#A1A1AA", fontFamily: "JetBrains Mono, monospace" }}>
          <Clock size={12} />
          {live ? (
            <span className="pulse-live" style={{ color: "#39FF14", fontWeight: 700 }} data-testid={`countdown-live-${match.match_id}`}>LIVE / FT</span>
          ) : (
            <span style={{ color: soon ? "#FFD24A" : "#A1A1AA" }} data-testid={`countdown-${match.match_id}`}>{cdLabel}</span>
          )}
        </div>
      </div>

      {/* Teams + Scores */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", alignItems: "center", gap: 12 }}>
        {/* Home */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", minWidth: 0 }}>
          <div style={{ fontSize: 26 }}>{getFlag(match.home)}</div>
          <div style={{
            fontFamily: "Unbounded", fontWeight: 700, fontSize: 13, marginTop: 4,
            color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "100%",
          }} data-testid={`match-home-${match.match_id}`}>
            {match.home}
          </div>
        </div>

        {/* Inputs */}
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <input
            data-testid={`predict-home-${match.match_id}`}
            type="number" min="0" max="99"
            value={homeVal}
            onChange={(e) => handleHome(e.target.value)}
            placeholder="-"
            readOnly={locked}
            className={`score-input ${homeVal !== "" ? "has-value" : ""}`}
          />
          <span style={{ color: "#6b6b75", fontFamily: "Unbounded", fontWeight: 700 }}>—</span>
          <input
            data-testid={`predict-away-${match.match_id}`}
            type="number" min="0" max="99"
            value={awayVal}
            onChange={(e) => handleAway(e.target.value)}
            placeholder="-"
            readOnly={locked}
            className={`score-input ${awayVal !== "" ? "has-value" : ""}`}
          />
        </div>

        {/* Away */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", minWidth: 0 }}>
          <div style={{ fontSize: 26 }}>{getFlag(match.away)}</div>
          <div style={{
            fontFamily: "Unbounded", fontWeight: 700, fontSize: 13, marginTop: 4,
            color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "100%",
            textAlign: "right",
          }} data-testid={`match-away-${match.match_id}`}>
            {match.away}
          </div>
        </div>
      </div>

      {/* Penalty winner picker — knockout only */}
      {isKnockout && (
        <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
          <span style={{ fontSize: 9, color: "#6b6b75", fontFamily: "Unbounded", letterSpacing: "0.15em" }}>
            PEN WINNER:
          </span>
          {["home", "away"].map(side => {
            const label = side === "home" ? match.home : match.away;
            const selected = penWinner === side;
            const display = label?.startsWith("TBD") ? (side === "home" ? "Home" : "Away") : label;
            return (
              <button
                key={side}
                onClick={() => handlePenWinner(side)}
                disabled={locked}
                style={{
                  padding: "3px 9px", borderRadius: 6, cursor: locked ? "default" : "pointer",
                  fontFamily: "Unbounded", fontSize: 9, fontWeight: 700,
                  background: selected ? "rgba(255,0,127,0.18)" : "transparent",
                  border: `1px solid ${selected ? "rgba(255,0,127,0.7)" : "rgba(255,255,255,0.12)"}`,
                  color: selected ? "#FF007F" : "#6b6b75",
                  transition: "all 0.15s",
                }}
              >
                {display}
              </button>
            );
          })}
          {match.penalty_winner && hasResult && (
            <span style={{ fontSize: 9, color: "#FFD24A", fontFamily: "Unbounded", marginLeft: 4 }}>
              → {match.penalty_winner === "home" ? match.home : match.away} WON PENS
            </span>
          )}
        </div>
      )}

      {/* Footer */}
      <div style={{
        marginTop: 14, paddingTop: 12,
        borderTop: "1px dashed rgba(255,255,255,0.06)",
        display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, flexWrap: "wrap",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#6b6b75", fontSize: 11, fontFamily: "JetBrains Mono, monospace" }}>
          <MapPin size={11} /> {match.venue}
          <span style={{ marginLeft: 8 }}>{match.date} · {match.time}</span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {locked && !hasResult && (
            <div style={{ display: "flex", alignItems: "center", gap: 4, color: "#FF2A2A", fontSize: 10, fontFamily: "Unbounded", fontWeight: 700, letterSpacing: "0.12em" }}>
              <Lock size={11} /> LOCKED
            </div>
          )}

          {hasResult && (
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{
                fontFamily: "Unbounded", fontWeight: 800, fontSize: 12,
                color: "#39FF14", letterSpacing: "0.1em",
              }} data-testid={`match-result-${match.match_id}`}>
                FT {match.home_score} – {match.away_score}
              </span>
              {pts !== null && (
                <span style={{
                  display: "inline-flex", alignItems: "center", gap: 4,
                  padding: "3px 8px", borderRadius: 999,
                  background: pts >= 4 ? "rgba(255,210,74,0.15)" : pts >= 1 ? "rgba(57,255,20,0.15)" : "rgba(255,42,42,0.12)",
                  border: `1px solid ${pts >= 4 ? "#FFD24A" : pts >= 1 ? "#39FF14" : "#FF2A2A"}55`,
                  color: pts >= 4 ? "#FFD24A" : pts >= 1 ? "#39FF14" : "#FF2A2A",
                  fontFamily: "Unbounded", fontSize: 10, fontWeight: 800, letterSpacing: "0.1em",
                }} data-testid={`match-points-${match.match_id}`}>
                  {pts >= 4 ? <><Trophy size={10}/> +{pts} PERFECT</>
                   : pts >= 1 ? <><CheckCircle2 size={10}/> +{pts} WINNER</>
                   : "0 PTS"}
                </span>
              )}
            </div>
          )}

          <img
            src={FRAMEX_LOCAL}
            alt="FrameX"
            style={{
              height: 48,
              width: "auto",
              objectFit: "contain",
              background: "#fff",
              padding: "4px",
              borderRadius: 6,
              boxShadow: "0 0 12px rgba(232,52,42,0.18)",
            }}
          />
        </div>
      </div>
    </div>
  );
}
