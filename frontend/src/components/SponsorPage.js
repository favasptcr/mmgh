import { ExternalLink, MapPin, Phone, Mail, Clock, Zap, Shield, Leaf, Building2, Facebook, Linkedin, Instagram } from "lucide-react";

const FRAMEX_LOGO_URL = "https://customer-assets.emergentagent.com/job_tool-681/artifacts/z4y5nm01_FrameX_Color_Horizontal_RGB.png";
const FRAMEX_URL = "https://framexlgs.com/";

const FEATURES = [
  { icon: <Shield size={16} />, label: "Non-Combustible & Termite-Resistant", desc: "Built with steel that won't burn or rot." },
  { icon: <Zap size={16} />, label: "Faster Build Times", desc: "Reduced labor with precision-engineered systems." },
  { icon: <Leaf size={16} />, label: "Eco-Friendly & Low-Waste", desc: "Sustainable construction for tomorrow's buildings." },
  { icon: <Building2 size={16} />, label: "Scalable Solutions", desc: "From single-family homes to mid-rise projects." },
];

const SERVICES = [
  "LGS Framing for Residential & Commercial",
  "Multi-Family Construction Projects",
  "BIM Technology & Automated Roll-Forming",
  "Precision-Engineered Steel Framing Systems",
  "Structural Engineering Expertise",
  "Nationwide Delivery from Houston HQ",
];

export default function SponsorPage() {
  return (
    <div style={{ padding: "24px 16px 72px", maxWidth: 900, margin: "0 auto" }}>

      {/* Hero */}
      <div
        className="glass-strong fade-up"
        style={{
          borderRadius: 20,
          padding: "44px 32px 36px",
          textAlign: "center",
          marginBottom: 20,
          border: "1px solid rgba(232,52,42,0.3)",
          boxShadow: "0 0 80px rgba(232,52,42,0.08)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* red glow bg */}
        <div style={{
          position: "absolute", top: "-60px", left: "50%", transform: "translateX(-50%)",
          width: 500, height: 300,
          background: "radial-gradient(ellipse, rgba(232,52,42,0.12) 0%, transparent 70%)",
          pointerEvents: "none",
        }} />

        <div style={{ position: "relative" }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            padding: "4px 12px", borderRadius: 999,
            background: "rgba(232,52,42,0.1)", border: "1px solid rgba(232,52,42,0.35)",
            fontFamily: "Unbounded", fontSize: 9, color: "#E8342A",
            letterSpacing: "0.3em", marginBottom: 20,
          }}>
            OFFICIAL SPONSOR — MMGH FIFA 2026
          </div>

          <a href={FRAMEX_URL} target="_blank" rel="noopener noreferrer" style={{ display: "block", marginBottom: 24 }}>
            <img
              src={FRAMEX_LOGO_URL}
              alt="LGS FrameX"
              style={{
                height: 70, width: "auto", objectFit: "contain",
                background: "#fff", padding: "12px 32px", borderRadius: 12,
                boxShadow: "0 0 0 1px rgba(232,52,42,0.2), 0 0 40px rgba(232,52,42,0.2)",
              }}
            />
          </a>

          <h1 style={{
            fontFamily: "Unbounded", fontWeight: 900,
            fontSize: "clamp(22px, 5vw, 40px)", lineHeight: 1.1,
            letterSpacing: "-0.03em", color: "#fff", marginBottom: 10,
          }}>
            Fast. Strong. Green.
          </h1>
          <div style={{
            fontFamily: "Unbounded", fontSize: 13, color: "#E8342A",
            letterSpacing: "0.15em", marginBottom: 20,
          }}>
            Built for Tomorrow
          </div>
          <p style={{
            color: "#A1A1AA", fontSize: 15, lineHeight: 1.7,
            maxWidth: 620, margin: "0 auto 28px",
          }}>
            LGS FrameX is a Houston-based construction company specializing in
            Light Gauge Steel (LGS) framing solutions for residential, commercial,
            and multi-family projects nationwide.
          </p>

          <a
            href={FRAMEX_URL}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              padding: "14px 32px", borderRadius: 8,
              background: "#E8342A", color: "#fff",
              fontFamily: "Unbounded", fontSize: 12, fontWeight: 700,
              letterSpacing: "0.08em", textDecoration: "none",
              boxShadow: "0 0 32px rgba(232,52,42,0.4)",
              transition: "transform 150ms ease, box-shadow 150ms ease",
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 4px 40px rgba(232,52,42,0.6)"; }}
            onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = "0 0 32px rgba(232,52,42,0.4)"; }}
          >
            <ExternalLink size={14} />
            Visit framexlgs.com
          </a>
        </div>
      </div>

      {/* Services + Why FrameX */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(280px, 100%), 1fr))", gap: 16, marginBottom: 16 }}>

        {/* Services */}
        <div className="glass fade-up" style={{ borderRadius: 16, padding: "24px 20px", border: "1px solid rgba(232,52,42,0.18)" }}>
          <div style={{
            fontFamily: "Unbounded", fontSize: 9, color: "#E8342A",
            letterSpacing: "0.3em", marginBottom: 18,
          }}>
            SERVICES
          </div>
          {SERVICES.map(s => (
            <div key={s} style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 13, fontSize: 13, color: "#E4E4E7", lineHeight: 1.4 }}>
              <span style={{
                width: 6, height: 6, borderRadius: "50%",
                background: "#E8342A", flexShrink: 0, marginTop: 5,
              }} />
              {s}
            </div>
          ))}
        </div>

        {/* Why FrameX */}
        <div className="glass fade-up" style={{ borderRadius: 16, padding: "24px 20px", border: "1px solid rgba(232,52,42,0.18)" }}>
          <div style={{
            fontFamily: "Unbounded", fontSize: 9, color: "#E8342A",
            letterSpacing: "0.3em", marginBottom: 18,
          }}>
            WHY FRAMEX
          </div>
          {FEATURES.map(({ icon, label, desc }) => (
            <div key={label} style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 18 }}>
              <span style={{ color: "#E8342A", marginTop: 2, flexShrink: 0 }}>{icon}</span>
              <div>
                <div style={{ fontSize: 13, color: "#fff", fontWeight: 600, marginBottom: 2 }}>{label}</div>
                <div style={{ fontSize: 11, color: "#6b6b75" }}>{desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Contact */}
      <div className="glass fade-up" style={{ borderRadius: 16, padding: "24px 20px", border: "1px solid rgba(232,52,42,0.18)", marginBottom: 16 }}>
        <div style={{
          fontFamily: "Unbounded", fontSize: 9, color: "#E8342A",
          letterSpacing: "0.3em", marginBottom: 18,
        }}>
          CONTACT
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(200px, 100%), 1fr))", gap: 18 }}>
          {[
            { icon: <MapPin size={14} />, text: "9555 W Sam Houston Pkwy Ste 401, Houston, TX 77099" },
            { icon: <Phone size={14} />, text: "346-537-2639 (346-5-FRAMEX)" },
            { icon: <Mail size={14} />, text: "info@framexlgs.com" },
            { icon: <Clock size={14} />, text: "Mon – Sat · 8:00 AM – 5:00 PM" },
          ].map(({ icon, text }) => (
            <div key={text} style={{ display: "flex", alignItems: "flex-start", gap: 10, fontSize: 12, color: "#A1A1AA", lineHeight: 1.5 }}>
              <span style={{ color: "#E8342A", marginTop: 1, flexShrink: 0 }}>{icon}</span>
              {text}
            </div>
          ))}
        </div>
      </div>

      {/* Social + bottom CTA */}
      <div className="glass fade-up" style={{
        borderRadius: 16, padding: "20px 24px",
        border: "1px solid rgba(232,52,42,0.18)",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        flexWrap: "wrap", gap: 16,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontFamily: "Unbounded", fontSize: 9, color: "#6b6b75", letterSpacing: "0.2em" }}>FOLLOW US</span>
          {[
            { icon: <Facebook size={16} />, href: "https://www.facebook.com/lgsframex" },
            { icon: <Linkedin size={16} />, href: "https://linkedin.com/company/lgs-framex" },
            { icon: <Instagram size={16} />, href: "https://instagram.com/lgsframex" },
          ].map(({ icon, href }) => (
            <a
              key={href}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "flex", alignItems: "center", justifyContent: "center",
                width: 34, height: 34, borderRadius: 8,
                background: "rgba(232,52,42,0.10)", border: "1px solid rgba(232,52,42,0.3)",
                color: "#E8342A", textDecoration: "none",
                transition: "background 150ms ease",
              }}
              onMouseEnter={e => { e.currentTarget.style.background = "rgba(232,52,42,0.25)"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "rgba(232,52,42,0.10)"; }}
            >
              {icon}
            </a>
          ))}
        </div>

        <a
          href={FRAMEX_URL}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: "inline-flex", alignItems: "center", gap: 7,
            padding: "10px 22px", borderRadius: 999,
            border: "1px solid rgba(232,52,42,0.5)",
            color: "#E8342A", background: "rgba(232,52,42,0.08)",
            fontFamily: "Unbounded", fontSize: 10, fontWeight: 700,
            letterSpacing: "0.1em", textDecoration: "none",
          }}
        >
          <ExternalLink size={12} />
          framexlgs.com
        </a>
      </div>
    </div>
  );
}
