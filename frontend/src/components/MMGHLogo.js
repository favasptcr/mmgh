import { Trophy } from "lucide-react";

export default function MMGHLogo({ size = 64 }) {
  return (
    <div
      data-testid="mmgh-logo"
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: "linear-gradient(135deg, #00F0FF 0%, #FF007F 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: "0 0 28px rgba(0,240,255,0.45)",
        padding: 2,
      }}
    >
      <div
        style={{
          width: "100%",
          height: "100%",
          borderRadius: "50%",
          background: "#0A0A0C",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "Unbounded, sans-serif",
          fontWeight: 900,
          fontSize: size * 0.28,
          letterSpacing: "0.03em",
          color: "#fff",
        }}
      >
        MMGH
      </div>
    </div>
  );
}

export function PrizeBadge({ place, prize, color }) {
  return (
    <div
      className="glass"
      style={{
        borderRadius: 14,
        padding: "16px 18px",
        textAlign: "center",
        minWidth: 110,
        borderColor: `${color}55`,
        boxShadow: `0 0 24px ${color}33`,
      }}
    >
      <Trophy size={18} style={{ color, margin: "0 auto 6px" }} />
      <div style={{ fontFamily: "Unbounded", fontSize: 11, color: "#A1A1AA", letterSpacing: "0.15em" }}>{place}</div>
      <div style={{ fontFamily: "Unbounded", fontSize: 22, fontWeight: 900, color, marginTop: 2 }}>{prize}</div>
    </div>
  );
}
