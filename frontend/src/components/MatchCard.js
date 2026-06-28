import { Lock, MapPin, Clock, CheckCircle2, Trophy } from "lucide-react";
import { useCountdown } from "@/lib/useCountdown";
import { GROUP_COLORS, ROUND_LABEL, calcPoints } from "@/lib/data";
import FlagImg from "@/components/FlagImg";

const FRAMEX_LOCAL = "/framex-logo.jpg";

export default function MatchCard({ match, prediction, onChange, readOnly }) {
  const locked = match.locked_effective || readOnly;
  const hasResult = match.home_score !== null && match.home_score !== undefined;
  const groupColor = match.group ? GROUP_COLORS[match.group] : "#A1A1AA";
  const { label: cdLabel, live, soon } = useCountdown(match.kickoff_utc);

  const pts = hasResult && prediction?.home_score !== undefined && prediction?.away_score !== undefined
    ? calcPoints(Number(prediction.home_score), Number(prediction.away_score), match.home_score, match.away_score)
    : null;

  const handleHome = (v) => {
    if (locked) return;
    onChange?.(match.match_id, "home_score", v);
  };
  const handleAway = (v) => {
    if (locked) return;
    onChange?.(match.match_id, "away_score", v);
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
          <div style={{ lineHeight: 1 }}><FlagImg team={match.home} size={22} /></div>
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
          <div style={{ lineHeight: 1 }}><FlagImg team={match.away} size={22} /></div>
          <div style={{
            fontFamily: "Unbounded", fontWeight: 700, fontSize: 13, marginTop: 4,
            color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "100%",
            textAlign: "right",
          }} data-testid={`match-away-${match.match_id}`}>
            {match.away}
          </div>
        </div>
      </div>

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
                  background: pts === 4 ? "rgba(255,210,74,0.15)" : pts === 1 ? "rgba(57,255,20,0.15)" : "rgba(255,42,42,0.12)",
                  border: `1px solid ${pts === 4 ? "#FFD24A" : pts === 1 ? "#39FF14" : "#FF2A2A"}55`,
                  color: pts === 4 ? "#FFD24A" : pts === 1 ? "#39FF14" : "#FF2A2A",
                  fontFamily: "Unbounded", fontSize: 10, fontWeight: 800, letterSpacing: "0.1em",
                }} data-testid={`match-points-${match.match_id}`}>
                  {pts === 4 ? <><Trophy size={10}/> +4 PERFECT</>
                   : pts === 1 ? <><CheckCircle2 size={10}/> +1 WINNER</>
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
