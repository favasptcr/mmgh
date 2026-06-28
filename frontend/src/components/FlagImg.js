import { ISO_CODES } from "@/lib/data";

/**
 * Renders a country flag as an <img> from flagcdn.com.
 * Works on Windows desktop (unlike emoji which renders as letter codes on Windows).
 */
export default function FlagImg({ team, size = 26 }) {
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
      style={{ borderRadius: 2, objectFit: "cover", display: "block" }}
    />
  );
}
