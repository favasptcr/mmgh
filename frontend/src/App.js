import { useEffect, useRef, useState } from "react";
import "@/index.css";
import { LogOut, Lock, BarChart3, Target, ShieldCheck, X, Star } from "lucide-react";
import Landing from "@/components/Landing";
import Predictions from "@/components/Predictions";
import Stats from "@/components/Stats";
import AdminPanel from "@/components/AdminPanel";
import WinnerPrediction from "@/components/WinnerPrediction";
import MMGHLogo, { FrameXLogo, FRAMEX_LOGO_URL_EXPORT } from "@/components/MMGHLogo";
import {
  getSession, clearSession,
  getAdminToken, setAdminToken, clearAdminToken,
  fetchStats, adminLogin,
} from "@/lib/api";

function App() {
  const [session, setSessionState] = useState(getSession());
  const [isAdmin, setIsAdmin] = useState(!!getAdminToken());
  const [view, setView] = useState("predict"); // predict | winner | stats | admin
  const [stats, setStats] = useState({ participants: 0, matches_total: 104, matches_scored: 0 });
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [splash, setSplash] = useState(false); // false | 'in' | 'out'
  const splashTimers = useRef([]);

  const navigateTo = (newView) => {
    if (newView === view) return;
    splashTimers.current.forEach(clearTimeout);
    setSplash("in");
    const t1 = setTimeout(() => {
      setView(newView);
      setSplash("out");
      const t2 = setTimeout(() => setSplash(false), 420);
      splashTimers.current = [t2];
    }, 1050);
    splashTimers.current = [t1];
  };

  // Poll stats every 20s
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const s = await fetchStats();
        if (!cancelled) setStats(s);
      } catch { /* ignore */ }
    };
    load();
    const id = setInterval(load, 20000);
    return () => { cancelled = true; clearInterval(id); };
  }, []);

  const handleEntered = (player) => {
    setSessionState({ name: player.name, email: player.email });
  };

  const handleSignOut = () => {
    clearSession();
    clearAdminToken();
    setIsAdmin(false);
    setSessionState(null);
    setView("predict");
  };

  if (!session) {
    return <Landing onEntered={handleEntered} stats={stats} />;
  }

  return (
    <div style={{ minHeight: "100vh" }}>
      {/* Header */}
      <header style={{
        position: "sticky", top: 0, zIndex: 50,
        background: "rgba(10,10,12,0.78)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
      }}>
        <div style={{
          maxWidth: 1200, margin: "0 auto",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          gap: 14, padding: "12px 16px", flexWrap: "wrap",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <MMGHLogo size={42} />
            <div>
              <div style={{ fontFamily: "Unbounded", fontWeight: 800, fontSize: 13, color: "#fff", letterSpacing: "-0.01em" }}>
                FIFA 2026 PREDICTIONS
              </div>
              <div style={{ fontSize: 10, color: "#A1A1AA", fontFamily: "JetBrains Mono" }}>
                MMGH × FrameX LGS
              </div>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <NavBtn active={view === "predict"} onClick={() => navigateTo("predict")} icon={<Target size={13}/>} label="Predict" tid="nav-predict" />
            <NavBtn active={view === "winner"} onClick={() => navigateTo("winner")} icon={<Star size={13}/>} label="WC Winner" tid="nav-winner" />
            <NavBtn active={view === "stats"} onClick={() => navigateTo("stats")} icon={<BarChart3 size={13}/>} label="Stats" tid="nav-stats" />
            {isAdmin && (
              <NavBtn active={view === "admin"} onClick={() => setView("admin")} icon={<ShieldCheck size={13}/>} label="Admin" tid="nav-admin" />
            )}
            {!isAdmin && (
              <button className="btn-ghost" onClick={() => setShowAdminLogin(true)} data-testid="open-admin-login"
                      style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <Lock size={12} /> Admin
              </button>
            )}

            <div style={{
              display: "flex", alignItems: "center", gap: 8,
              padding: "6px 12px", borderRadius: 999,
              background: "rgba(0,240,255,0.08)", border: "1px solid rgba(0,240,255,0.25)",
            }}>
              <div style={{
                width: 28, height: 28, borderRadius: "50%",
                background: "linear-gradient(135deg, #00F0FF, #FF007F)",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "#0A0A0C", fontFamily: "Unbounded", fontWeight: 900, fontSize: 12,
              }}>
                {session.name.charAt(0).toUpperCase()}
              </div>
              <span style={{ fontSize: 12, color: "#fff", fontWeight: 600, maxWidth: 140, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} data-testid="session-name">
                {session.name}
              </span>
              <button onClick={handleSignOut} title="Sign out" data-testid="signout-btn"
                      style={{ background: "transparent", border: "none", color: "#A1A1AA", cursor: "pointer", display: "flex" }}>
                <LogOut size={13} />
              </button>
            </div>
          </div>
        </div>
      </header>

      {view === "predict" && <Predictions session={session} />}
      {view === "winner" && <WinnerPrediction session={session} />}
      {view === "stats" && <Stats stats={stats} />}
      {view === "admin" && isAdmin && <AdminPanel />}

      {/* Admin login modal */}
      {showAdminLogin && (
        <AdminLoginModal
          onClose={() => setShowAdminLogin(false)}
          onSuccess={(token) => {
            setAdminToken(token);
            setIsAdmin(true);
            setShowAdminLogin(false);
            setView("admin");
          }}
        />
      )}

      <footer style={{ padding: "32px 16px 40px", textAlign: "center", color: "#6b6b75", fontSize: 11, display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
        <FrameXLogo height={44} />
        <div style={{ opacity: 0.6 }}>MMGH FIFA WC 2026 Prediction Contest</div>
      </footer>

      {/* Sponsor splash overlay */}
      {splash && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 200,
          background: "rgba(10,10,12,0.92)",
          backdropFilter: "blur(18px)",
          WebkitBackdropFilter: "blur(18px)",
          display: "flex", alignItems: "center", justifyContent: "center",
          animation: splash === "in" ? "sponsorIn 300ms ease both" : "sponsorOut 420ms ease both",
          pointerEvents: "none",
        }}>
          <div style={{ textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 18 }}>
            <div style={{
              fontFamily: "Unbounded", fontSize: 10, color: "#A1A1AA",
              letterSpacing: "0.35em", textTransform: "uppercase",
            }}>
              Proudly Sponsored by
            </div>
            <img
              src={FRAMEX_LOGO_URL_EXPORT}
              alt="FrameX LGS"
              style={{
                height: 80,
                width: "auto",
                objectFit: "contain",
                background: "#fff",
                padding: "14px 32px",
                borderRadius: 14,
                boxShadow: "0 0 80px rgba(255,255,255,0.2), 0 0 160px rgba(255,255,255,0.06)",
              }}
            />
            <div style={{ fontFamily: "Outfit, sans-serif", fontSize: 13, color: "#6b6b75" }}>
              Official Sponsor · FIFA 2026 Prediction Contest
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function NavBtn({ active, onClick, icon, label, tid }) {
  return (
    <button onClick={onClick} data-testid={tid}
      style={{
        display: "flex", alignItems: "center", gap: 6,
        padding: "8px 14px", borderRadius: 999,
        background: active ? "#00F0FF" : "rgba(255,255,255,0.04)",
        color: active ? "#0A0A0C" : "#fff",
        border: active ? "1px solid #00F0FF" : "1px solid rgba(255,255,255,0.08)",
        fontFamily: "Unbounded", fontWeight: 700, fontSize: 11,
        letterSpacing: "0.08em", textTransform: "uppercase",
        cursor: "pointer",
        transition: "background 200ms ease, color 200ms ease, box-shadow 200ms ease",
        boxShadow: active ? "0 0 18px rgba(0,240,255,0.4)" : "none",
      }}>
      {icon}
      {label}
    </button>
  );
}

function AdminLoginModal({ onClose, onSuccess }) {
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e?.preventDefault?.();
    setErr("");
    setLoading(true);
    try {
      const res = await adminLogin(pw);
      onSuccess(res.token);
    } catch (e2) {
      setErr(e2?.response?.status === 401 ? "Wrong password" : "Login failed");
    } finally { setLoading(false); }
  };

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)",
      backdropFilter: "blur(8px)", zIndex: 100,
      display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
    }} onClick={onClose}>
      <form onSubmit={submit} onClick={(e) => e.stopPropagation()} className="glass-strong"
            style={{ borderRadius: 16, padding: 26, width: "100%", maxWidth: 360 }} data-testid="admin-login-modal">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h3 style={{ fontFamily: "Unbounded", fontSize: 16, color: "#fff" }}>
            <Lock size={14} style={{ verticalAlign: "middle", marginRight: 6, color: "#FF007F" }} />
            Admin Login
          </h3>
          <button type="button" onClick={onClose} style={{ background: "transparent", border: "none", color: "#A1A1AA", cursor: "pointer" }}>
            <X size={16} />
          </button>
        </div>
        <input
          type="password" value={pw}
          onChange={(e) => setPw(e.target.value)}
          placeholder="Password"
          autoFocus
          data-testid="admin-password-input"
          style={{
            width: "100%", background: "rgba(0,0,0,0.5)",
            border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10,
            padding: "12px 14px", color: "#fff", fontSize: 14, outline: "none",
          }}
        />
        {err && <div style={{ marginTop: 10, color: "#FF2A2A", fontSize: 12 }} data-testid="admin-login-error">{err}</div>}
        <button type="submit" className="btn-primary" disabled={!pw || loading}
                data-testid="admin-login-submit"
                style={{ width: "100%", marginTop: 14 }}>
          {loading ? "Verifying…" : "Enter Admin"}
        </button>
      </form>
    </div>
  );
}

export default App;
