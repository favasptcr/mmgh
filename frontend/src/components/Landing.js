import { useState } from "react";
import { Mail, User, ArrowRight, Trophy, Sparkles, Star } from "lucide-react";
import MMGHLogo, { PrizeBadge, FrameXLogo } from "@/components/MMGHLogo";
import { registerPlayer, setSession } from "@/lib/api";

export default function Landing({ onEntered, stats }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e) => {
    e?.preventDefault?.();
    if (!name.trim() || !email.trim()) return;
    setError("");
    setLoading(true);
    try {
      const player = await registerPlayer(name.trim(), email.trim().toLowerCase());
      setSession({ name: player.name, email: player.email });
      onEntered(player);
    } catch (err) {
      setError(err?.response?.data?.detail || "Could not register. Check your email.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", position: "relative", overflow: "hidden" }}>
      <div className="grid-bg" style={{ position: "absolute", inset: 0, pointerEvents: "none" }} />

      <main style={{
        flex: 1, padding: "48px 20px 32px",
        display: "flex", flexDirection: "column", alignItems: "center",
        gap: 28, position: "relative", zIndex: 1, maxWidth: 920, margin: "0 auto", width: "100%",
      }}>
        {/* Top brand */}
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <MMGHLogo size={68} />
          <div>
            <div style={{ fontFamily: "Unbounded", fontSize: 11, color: "#A1A1AA", letterSpacing: "0.25em" }}>MMGH</div>
            <div style={{ fontFamily: "Unbounded", fontSize: 13, color: "#fff", fontWeight: 700, letterSpacing: "0.08em" }}>
              MALAYALEE MUSLIMS OF GREATER HOUSTON
            </div>
          </div>
        </div>

        {/* Title */}
        <div style={{ textAlign: "center", marginTop: 12 }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            padding: "5px 12px", borderRadius: 999,
            background: "rgba(0,240,255,0.08)", border: "1px solid rgba(0,240,255,0.3)",
            color: "#00F0FF", fontFamily: "Unbounded", fontSize: 10, fontWeight: 700,
            letterSpacing: "0.2em", marginBottom: 18,
          }}>
            <Sparkles size={11} /> JUNE 11 – JULY 19, 2026
          </div>
          <h1 style={{
            fontFamily: "Unbounded", fontWeight: 900,
            fontSize: "clamp(40px, 8vw, 76px)", lineHeight: 0.95,
            letterSpacing: "-0.04em", marginBottom: 8,
            background: "linear-gradient(135deg, #fff 0%, #00F0FF 60%, #FF007F 100%)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}>
            FIFA 2026<br/>PREDICTIONS
          </h1>
          <p style={{ color: "#A1A1AA", fontSize: 15, maxWidth: 540, margin: "16px auto 0", lineHeight: 1.6 }}>
            Pick scores for all 104 matches. Earn points for correct winners and exact scores.
            Top 3 win cash prizes.
          </p>
        </div>

        {/* Prize Badges */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14, width: "100%" }}>
          <div style={{ display: "flex", gap: 14, flexWrap: "wrap", justifyContent: "center" }}>
            <PrizeBadge place="1ST PLACE" prize="$250" color="#FFD24A" />
            <PrizeBadge place="2ND PLACE" prize="$100" color="#A1A1AA" />
            <PrizeBadge place="3RD PLACE" prize="$50" color="#FF7F50" />
          </div>
          {/* Bonus prize */}
          <div style={{
            display: "flex", alignItems: "center", gap: 10,
            padding: "10px 20px", borderRadius: 12,
            background: "rgba(255,215,0,0.08)", border: "1px solid rgba(255,215,0,0.35)",
          }}>
            <Star size={14} style={{ color: "#FFD700", flexShrink: 0 }} />
            <div>
              <span style={{ fontFamily: "Unbounded", fontSize: 10, color: "#A1A1AA", letterSpacing: "0.15em" }}>
                BONUS PRIZE
              </span>
              <span style={{ fontFamily: "Unbounded", fontSize: 12, fontWeight: 800, color: "#FFD700", marginLeft: 10 }}>
                $100
              </span>
              <span style={{ fontSize: 12, color: "#E4E4E7", marginLeft: 8 }}>
                — Correct World Cup Winner Pick
              </span>
            </div>
          </div>
        </div>

        {/* Scoring */}
        <div className="glass" style={{ borderRadius: 16, padding: "16px 20px", maxWidth: 620, width: "100%" }}>
          <div style={{
            fontFamily: "Unbounded", fontSize: 10, color: "#A1A1AA", letterSpacing: "0.25em",
            marginBottom: 12, textAlign: "center",
          }}>SCORING SYSTEM</div>
          <div style={{
            display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 12, fontSize: 13,
          }}>
            <ScoreLine color="#39FF14" label="Correct winner only" pts="+1" />
            <ScoreLine color="#FFD24A" label="Winner + exact score" pts="+4" />
          </div>
        </div>

        {/* Entry form */}
        <form onSubmit={submit} className="glass-strong" style={{
          borderRadius: 18, padding: 24, width: "100%", maxWidth: 460,
          display: "flex", flexDirection: "column", gap: 14,
        }} data-testid="landing-form">
          <div style={{ textAlign: "center", marginBottom: 4 }}>
            <Trophy size={26} style={{ color: "#FFD24A", marginBottom: 8 }} />
            <h3 style={{ fontFamily: "Unbounded", fontSize: 18, fontWeight: 800, color: "#fff" }}>
              Join the Contest
            </h3>
            <p style={{ color: "#A1A1AA", fontSize: 12, marginTop: 4 }}>
              {stats?.participants ?? 0} {stats?.participants === 1 ? "participant" : "participants"} so far
            </p>
          </div>

          <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <span style={{ fontFamily: "Unbounded", fontSize: 10, color: "#A1A1AA", letterSpacing: "0.2em" }}>FULL NAME</span>
            <div style={{ position: "relative" }}>
              <User size={14} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "#6b6b75" }} />
              <input
                data-testid="landing-name-input"
                type="text" value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                style={inputStyle}
                autoComplete="name"
                required
              />
            </div>
          </label>

          <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <span style={{ fontFamily: "Unbounded", fontSize: 10, color: "#A1A1AA", letterSpacing: "0.2em" }}>EMAIL</span>
            <div style={{ position: "relative" }}>
              <Mail size={14} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "#6b6b75" }} />
              <input
                data-testid="landing-email-input"
                type="email" value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@email.com"
                style={inputStyle}
                autoComplete="email"
                required
              />
            </div>
            <span style={{ fontSize: 11, color: "#6b6b75" }}>
              Your email is your login. Use the same one to update predictions later.
            </span>
          </label>

          {error && (
            <div style={{ color: "#FF2A2A", fontSize: 12, textAlign: "center" }} data-testid="landing-error">{error}</div>
          )}

          <button
            data-testid="landing-submit"
            type="submit"
            className="btn-primary"
            disabled={!name.trim() || !email.trim() || loading}
            style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
          >
            {loading ? "ENTERING…" : "ENTER CONTEST"} <ArrowRight size={14} />
          </button>
        </form>

        <div style={{ fontSize: 11, color: "#6b6b75", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
          <FrameXLogo height={44} />
        </div>
      </main>
    </div>
  );
}

const inputStyle = {
  width: "100%",
  background: "rgba(0,0,0,0.5)",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: 10,
  padding: "12px 14px 12px 40px",
  color: "#fff",
  fontFamily: "Outfit, sans-serif",
  fontSize: 14,
  outline: "none",
  transition: "border-color 200ms ease, box-shadow 200ms ease",
};

function ScoreLine({ color, label, pts }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
      <span style={{ color: "#A1A1AA" }}>{label}</span>
      <span style={{
        fontFamily: "Unbounded", fontWeight: 800, color,
        background: `${color}1a`, padding: "3px 8px", borderRadius: 6,
        border: `1px solid ${color}44`, fontSize: 12,
      }}>{pts}</span>
    </div>
  );
}
