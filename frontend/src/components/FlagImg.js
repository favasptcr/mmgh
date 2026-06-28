import { ISO_CODES } from "@/lib/data";

/**
 * Renders a country flag as an <img> from flagcdn.com with a 3D/glossy
 * look matching iOS emoji flags (rounded corners, highlight, drop shadow).
 * Works on Windows desktop (unlike emoji which shows as letter codes on Windows).
 */
export default function FlagImg({ team, size = 22 }) {
  if (!team) return <span style={{ fontSize: size }}>⚪</span>;
  if (team.startsWith("TBD")) return <span style={{ fontSize: size }}>❓</span>;
  const iso = ISO_CODES[team];
  if (!iso) return <span style={{ fontSize: size }}>🏳️</span>;
  return (
    <img
      src={`https://flagcdn.com/w40/${iso}.png`}
      alt={team}
      height={size}
      width="auto"
      style={{
        borderRadius: 3,
        objectFit: "cover",
        display: "block",
        // 3D / glossy look — mimics iOS emoji flag appearance
        boxShadow: [
          "inset 0 1px 0 rgba(255,255,255,0.35)",  // top highlight
          "inset 0 -1px 0 rgba(0,0,0,0.15)",        // bottom inner shadow
          "0 2px 5px rgba(0,0,0,0.35)",              // drop shadow
          "0 0 0 1px rgba(0,0,0,0.18)",              // thin border
        ].join(", "),
      }}
    />
  );
}
