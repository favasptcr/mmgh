import { Users, Trophy, Lock, CheckCircle2, EyeOff, AlertTriangle } from "lucide-react";

export default function Stats({ stats }) {
  return (
    <div style={{ padding: "24px 16px 48px", maxWidth: 760, margin: "0 auto" }}>
      <div className="glass-strong fade-up" style={{
        borderRadius: 18, padding: "28px 24px",
        textAlign: "center",
      }} data-testid="stats-card">
        <Users size={26} style={{ color: "#00F0FF", margin: "0 auto 10px" }} />
        <div style={{ fontFamily: "Unbounded", fontSize: 10, color: "#A1A1AA", letterSpacing: "0.25em" }}>
          CONTEST PARTICIPATION
        </div>
        <div style={{
          fontFamily: "Unbounded", fontSize: 64, fontWeight: 900,
          background: "linear-gradient(135deg, #00F0FF, #FF007F)",
          WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          backgroundClip: "text", lineHeight: 1, marginTop: 6,
        }} data-testid="participants-count">
          {stats?.participants ?? 0}
        </div>
        <div style={{ color: "#A1A1AA", fontSize: 13, marginTop: 6 }}>
          {stats?.participants === 1 ? "predictor in the game" : "predictors in the game"}
        </div>
      </div>

      <div className="glass" style={{ borderRadius: 14, padding: "16px 18px", marginTop: 16, textAlign: "center" }}>
        <EyeOff size={18} style={{ color: "#FFD24A", margin: "0 auto 8px" }} />
        <div style={{ fontFamily: "Unbounded", fontSize: 12, fontWeight: 700, color: "#fff" }}>
          Rankings are private
        </div>
        <div style={{ color: "#A1A1AA", fontSize: 12, marginTop: 6, lineHeight: 1.6 }}>
          The leaderboard is hidden until the contest ends. The admin will announce winners — keeps the suspense alive.
        </div>
      </div>

      <div className="glass" style={{ borderRadius: 14, padding: "18px 20px", marginTop: 16 }}>
        <div style={{ fontFamily: "Unbounded", fontSize: 11, color: "#A1A1AA", letterSpacing: "0.22em", marginBottom: 14, textAlign: "center" }}>
          GROUP STAGE &amp; R32 SCORING
        </div>
        <div style={{ display: "grid", gap: 10 }}>
          <Row icon={<CheckCircle2 size={16} color="#39FF14"/>} color="#39FF14" label="Correct winner only" pts="+1 pt" />
          <Row icon={<Trophy size={16} color="#FFD24A"/>} color="#FFD24A" label="Winner + exact goals" pts="+4 pts" />
          <Row icon={<Trophy size={16} color="#00F0FF"/>} color="#00F0FF" label="Exact penalty score bonus" pts="+2 pts" />
        </div>
      </div>

      <div className="glass" style={{ borderRadius: 14, padding: "18px 20px", marginTop: 16 }}>
        <div style={{ fontFamily: "Unbounded", fontSize: 11, color: "#A1A1AA", letterSpacing: "0.22em", marginBottom: 14, textAlign: "center" }}>
          KNOCKOUT SCORING (R16 → FINAL)
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11, fontFamily: "JetBrains Mono" }}>
            <thead>
              <tr style={{ color: "#6b6b75" }}>
                <th style={thStyle}>ROUND</th>
                <th style={thStyle}>RESULT</th>
                <th style={thStyle}>SCORE</th>
                <th style={thStyle}>SHOOTOUT</th>
                <th style={thStyle}>SKIP</th>
                <th style={thStyle}>MAX</th>
              </tr>
            </thead>
            <tbody>
              {KO_ROWS.map(r => (
                <tr key={r.round} style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                  <td style={tdStyle}><span style={{ fontFamily: "Unbounded", fontSize: 9, fontWeight: 700, color: r.color }}>{r.round}</span></td>
                  <td style={tdStyle}><span style={{ color: "#39FF14" }}>+{r.rw}</span> / <span style={{ color: "#FF2A2A" }}>-{r.rl}</span></td>
                  <td style={tdStyle}><span style={{ color: "#39FF14" }}>+{r.sw}</span> / <span style={{ color: "#FF2A2A" }}>-{r.sl}</span></td>
                  <td style={tdStyle}><span style={{ color: "#39FF14" }}>+{r.ow}</span> / <span style={{ color: "#FF2A2A" }}>-{r.ol}</span></td>
                  <td style={tdStyle}><span style={{ color: "#FF2A2A" }}>-{r.skip}</span></td>
                  <td style={{ ...tdStyle, color: "#FFD24A", fontFamily: "Unbounded", fontSize: 10, fontWeight: 800 }}>{r.max}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ marginTop: 12, fontSize: 11, color: "#6b6b75", lineHeight: 1.7 }}>
          <div>• Result: always scored regardless of score or shootout</div>
          <div>• Score: only checked when result call was correct</div>
          <div>• Shootout: scored independently — applies only if match goes to penalties</div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
            <AlertTriangle size={12} color="#FF7F50" />
            <span style={{ color: "#FF7F50" }}>Skip costs more than a wrong guess — always predict!</span>
          </div>
        </div>
      </div>

      <div className="glass" style={{ borderRadius: 14, padding: "18px 20px", marginTop: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", color: "#A1A1AA", fontSize: 13 }}>
          <span>Matches scored</span>
          <span style={{ color: "#fff", fontFamily: "Unbounded", fontWeight: 700 }}>{stats?.matches_scored ?? 0} / {stats?.matches_total ?? 104}</span>
        </div>
      </div>

      <div className="glass" style={{ borderRadius: 14, padding: "16px 18px", marginTop: 16, display: "flex", gap: 10, alignItems: "flex-start" }}>
        <Lock size={16} style={{ color: "#FF2A2A", marginTop: 2 }} />
        <div style={{ color: "#A1A1AA", fontSize: 12, lineHeight: 1.6 }}>
          Predictions auto-lock at kickoff time. Get your picks in early!
        </div>
      </div>
    </div>
  );
}

const KO_ROWS = [
  { round: "R16",   color: "#39FF14", rw: 3, rl: 2, sw: 5,  sl: 2, ow: 2, ol: 2, skip: 3, max: 10 },
  { round: "QF",    color: "#FFD24A", rw: 4, rl: 2, sw: 6,  sl: 2, ow: 3, ol: 2, skip: 3, max: 13 },
  { round: "SF",    color: "#FF7F50", rw: 5, rl: 3, sw: 8,  sl: 3, ow: 3, ol: 3, skip: 4, max: 16 },
  { round: "FINAL", color: "#FF007F", rw: 8, rl: 4, sw: 12, sl: 4, ow: 5, ol: 4, skip: 5, max: 25 },
];
const thStyle = { padding: "4px 8px", textAlign: "center", fontWeight: 600, fontSize: 10 };
const tdStyle = { padding: "6px 8px", textAlign: "center", color: "#A1A1AA" };

function Row({ icon, color, label, pts }) {
  return (
    <div style={{
      display: "flex", justifyContent: "space-between", alignItems: "center",
      padding: "10px 12px", borderRadius: 10,
      background: "rgba(0,0,0,0.35)", border: "1px solid rgba(255,255,255,0.05)",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        {icon}
        <span style={{ color: "#fff", fontSize: 13 }}>{label}</span>
      </div>
      <span style={{
        fontFamily: "Unbounded", fontSize: 12, fontWeight: 800, color,
        padding: "3px 10px", borderRadius: 999,
        background: `${color}1a`, border: `1px solid ${color}44`,
      }}>{pts}</span>
    </div>
  );
}
