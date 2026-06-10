import { Users, Trophy, Lock, Target, CheckCircle2, EyeOff } from "lucide-react";

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
          SCORING SYSTEM
        </div>
        <div style={{ display: "grid", gap: 10 }}>
          <Row icon={<CheckCircle2 size={16} color="#39FF14"/>} color="#39FF14" label="Correct winning team" pts="+1 pt" />
          <Row icon={<Target size={16} color="#00F0FF"/>} color="#00F0FF" label="Exact score (draw)" pts="+3 pts" />
          <Row icon={<Trophy size={16} color="#FFD24A"/>} color="#FFD24A" label="Perfect — winner + score" pts="+4 pts" />
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
