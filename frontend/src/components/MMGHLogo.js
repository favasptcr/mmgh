import { Trophy } from "lucide-react";

const LOGO_URL = "https://customer-assets.emergentagent.com/job_tool-681/artifacts/o71gbfnm_Logo%20MMGH_8.%2023.%202024%20Transp-Corrected-Bold-01.png";
const FRAMEX_LOGO_URL = "https://customer-assets.emergentagent.com/job_tool-681/artifacts/z4y5nm01_FrameX_Color_Horizontal_RGB.png";

export default function MMGHLogo({ size = 64 }) {
  return (
    <div
      data-testid="mmgh-logo"
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: "radial-gradient(circle at 50% 50%, rgba(0,240,255,0.18), rgba(255,0,127,0.10) 60%, transparent 80%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: "0 0 28px rgba(0,240,255,0.30)",
        padding: 2,
      }}
    >
      <img
        src={LOGO_URL}
        alt="MMGH — Malayalee Muslims of Greater Houston"
        style={{
          width: "100%",
          height: "100%",
          objectFit: "contain",
          filter: "drop-shadow(0 0 8px rgba(0,240,255,0.25))",
        }}
      />
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


export function FrameXLogo({ height = 38, withLabel = true }) {
  return (
    <a
      href="https://framexlgs.com/"
      target="_blank"
      rel="noopener noreferrer"
      data-testid="framex-logo"
      style={{
        display: "inline-flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 7,
        verticalAlign: "middle",
        textDecoration: "none",
      }}
    >
      {withLabel && (
        <span style={{
          fontFamily: "Unbounded", fontSize: 9, color: "#A1A1AA",
          letterSpacing: "0.3em", textTransform: "uppercase",
        }}>
          Proudly Sponsored by
        </span>
      )}
      <img
        src={FRAMEX_LOGO_URL}
        alt="FrameX LGS"
        style={{
          height,
          width: "auto",
          objectFit: "contain",
          background: "#fff",
          padding: "6px 16px",
          borderRadius: 8,
          boxShadow: "0 0 28px rgba(255,255,255,0.18), 0 0 60px rgba(255,255,255,0.06)",
          transition: "box-shadow 200ms ease",
        }}
      />
    </a>
  );
}

export function SponsorBanner({ onLearnMore }) {
  return (
    <div style={{
      background: "rgba(26,43,74,0.88)",
      borderBottom: "1px solid rgba(232,52,42,0.28)",
      padding: "5px 16px",
      display: "flex", alignItems: "center", justifyContent: "space-between",
      flexWrap: "wrap", gap: 8,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{
          width: 6, height: 6, borderRadius: "50%",
          background: "#E8342A", flexShrink: 0,
          boxShadow: "0 0 6px #E8342A",
        }} />
        <span style={{ fontSize: 11, color: "#A1A1AA", fontFamily: "Outfit, sans-serif" }}>
          Powered by <strong style={{ color: "#fff" }}>LGS FrameX</strong>
        </span>
        <a
          href="https://framexlgs.com/"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            fontSize: 10, color: "#E8342A",
            fontFamily: "Unbounded", fontWeight: 700,
            letterSpacing: "0.1em", textDecoration: "none",
          }}
        >
          framexlgs.com ↗
        </a>
      </div>
      {onLearnMore ? (
        <button
          onClick={onLearnMore}
          style={{
            background: "rgba(232,52,42,0.12)",
            border: "1px solid rgba(232,52,42,0.4)",
            borderRadius: 999, padding: "3px 12px",
            color: "#E8342A", fontFamily: "Unbounded",
            fontSize: 9, fontWeight: 700, letterSpacing: "0.1em",
            cursor: "pointer",
          }}
        >
          Learn about LGS FrameX →
        </button>
      ) : (
        <a
          href="https://framexlgs.com/"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            background: "rgba(232,52,42,0.12)",
            border: "1px solid rgba(232,52,42,0.4)",
            borderRadius: 999, padding: "3px 12px",
            color: "#E8342A", fontFamily: "Unbounded",
            fontSize: 9, fontWeight: 700, letterSpacing: "0.1em",
            textDecoration: "none",
          }}
        >
          Learn about LGS FrameX →
        </a>
      )}
    </div>
  );
}

export const FRAMEX_LOGO_URL_EXPORT = FRAMEX_LOGO_URL;
