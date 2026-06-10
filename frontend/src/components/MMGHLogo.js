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


export function FrameXLogo({ height = 28, withLabel = true }) {
  return (
    <span
      data-testid="framex-logo"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        verticalAlign: "middle",
      }}
    >
      {withLabel && (
        <span style={{
          fontFamily: "Unbounded", fontSize: 10, color: "#A1A1AA",
          letterSpacing: "0.22em", textTransform: "uppercase",
        }}>
          Sponsored by
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
          padding: "4px 10px",
          borderRadius: 6,
          boxShadow: "0 0 18px rgba(255,255,255,0.08)",
        }}
      />
    </span>
  );
}
