import React, { useState, useEffect, type CSSProperties, type FormEvent } from "react";
import { type UserRole, ROLE_LABELS, apiLogin } from "./AuthHelper.ts";

const G = {
  green: "#2d7a2d", greenL: "#4caf50", leaf: "#e8f5e9", soil: "#3b2a1a",
  mist: "#f7faf7", white: "#ffffff", err: "#c62828", errBg: "#fff0f0",
  ok: "#1b5e20", okBg: "#e8f5e9",
};

const inp: CSSProperties = {
  width: "100%", padding: "13px 16px", border: "1.5px solid #cde3cd",
  borderRadius: 10, fontSize: 14, fontFamily: "inherit", outline: "none",
  background: G.mist, color: G.soil, transition: "border-color .2s, box-shadow .2s",
  boxSizing: "border-box",
};

const ROLES: { value: UserRole; label: string; icon: string }[] = [
  { value: "nongdan", label: "Nông dân", icon: "🌾" },
  { value: "daily",   label: "Đại lý",   icon: "🏢" },
  { value: "sieuthi", label: "Siêu thị", icon: "🛒" },
  { value: "admin",   label: "Admin",    icon: "⚙️" },
];

function LeafBg() {
  return (
    <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0.07, pointerEvents: "none" }} viewBox="0 0 400 400">
      <path d="M30 380 Q80 200 200 150 Q320 100 370 20" stroke="#fff" strokeWidth="2" fill="none"/>
      <path d="M0 300 Q60 250 120 200 Q180 150 200 50" stroke="#fff" strokeWidth="1.5" fill="none"/>
      <circle cx="200" cy="150" r="60" fill="#fff" opacity=".5"/>
      <circle cx="370" cy="20" r="30" fill="#fff" opacity=".4"/>
    </svg>
  );
}

export default function DangNhap() {
  const [role, setRole] = useState<UserRole | "">("");
  const [username, setUsername] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [showPw, setShowPw] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [alert, setAlert] = useState<{ msg: string; type: "error" | "success" } | null>(null);
  const [focused, setFocused] = useState<string | null>(null);

  useEffect(() => {
    if (!alert) return;
    const t = setTimeout(() => setAlert(null), 5000);
    return () => clearTimeout(t);
  }, [alert]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!role)     return setAlert({ msg: "Vui lòng chọn loại tài khoản", type: "error" });
    if (!username) return setAlert({ msg: "Vui lòng nhập tên đăng nhập", type: "error" });
    if (!password) return setAlert({ msg: "Vui lòng nhập mật khẩu", type: "error" });

    setLoading(true);
    setAlert(null);
    try {
      const user = await apiLogin({ accountType: role, username, password });
      setAlert({ msg: `Chào mừng, ${user.fullName}! Đang chuyển hướng…`, type: "success" });
      setTimeout(() => {
        const urls: Record<string, string> = {
          admin: "/admin", nongdan: "/nongdan", daily: "/daily", sieuthi: "/sieuthi",
        };
        window.location.href = urls[role] || "/";
      }, 1000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Đăng nhập thất bại";
      setAlert({ msg, type: "error" });
    } finally {
      setLoading(false);
    }
  }

  const fieldStyle = (name: string): CSSProperties => ({
    ...inp,
    borderColor: focused === name ? G.green : "#cde3cd",
    boxShadow: focused === name ? `0 0 0 3px ${G.leaf}` : "none",
  });

  return (
    <div style={{ minHeight: "100vh", background: `linear-gradient(145deg,${G.green} 0%,#1b5e20 55%,${G.soil} 100%)`, display: "flex", alignItems: "center", justifyContent: "center", padding: 20, fontFamily: "'Nunito','Segoe UI',sans-serif", position: "relative", overflow: "hidden" }}>
      <LeafBg />
      <div style={{ position: "absolute", top: -80, right: -80, width: 300, height: 300, borderRadius: "50%", background: "rgba(255,255,255,0.04)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", bottom: -60, left: -60, width: 220, height: 220, borderRadius: "50%", background: "rgba(255,255,255,0.06)", pointerEvents: "none" }} />

      <div style={{ background: G.white, borderRadius: 20, width: "100%", maxWidth: 420, boxShadow: "0 24px 64px rgba(0,0,0,0.28)", overflow: "hidden" }}>
        <style>{`
          @keyframes slideUp { from { opacity:0; transform:translateY(28px); } to { opacity:1; transform:none; } }
          @keyframes shake { 0%,100%{transform:none} 20%,60%{transform:translateX(-6px)} 40%,80%{transform:translateX(6px)} }
          .shake { animation: shake .35s; }
        `}</style>

        {/* Header */}
        <div style={{ background: `linear-gradient(135deg,${G.green},#1b5e20)`, padding: "32px 28px 24px", textAlign: "center", position: "relative", overflow: "hidden" }}>
          <LeafBg />
          <div style={{ fontSize: 44, marginBottom: 10, position: "relative" }}>🌿</div>
          <h2 style={{ color: G.white, fontSize: 22, fontWeight: 800, margin: 0, position: "relative" }}>Đăng nhập</h2>
          <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 13, margin: "6px 0 0", position: "relative" }}>Hệ thống Quản lý Nông sản</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ padding: "28px 28px 24px" }}>
          {alert && (
            <div className={alert.type === "error" ? "shake" : ""} style={{ padding: "11px 14px", borderRadius: 10, marginBottom: 20, fontSize: 13, fontWeight: 600, background: alert.type === "error" ? G.errBg : G.okBg, color: alert.type === "error" ? G.err : G.ok, borderLeft: `4px solid ${alert.type === "error" ? G.err : G.greenL}` }}>
              {alert.type === "error" ? "⚠ " : "✓ "}{alert.msg}
            </div>
          )}

          {/* Role */}
          <div style={{ marginBottom: 18 }}>
            <label style={{ display: "block", fontSize: 12, fontWeight: 800, color: "#444", marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.7 }}>Loại tài khoản</label>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8 }}>
              {ROLES.map(r => (
                <button key={r.value} type="button" onClick={() => setRole(r.value)} style={{ padding: "10px 4px", border: `2px solid ${role === r.value ? G.green : "#e0e0e0"}`, borderRadius: 10, background: role === r.value ? G.leaf : G.mist, cursor: "pointer", transition: "all .18s", textAlign: "center" }}>
                  <div style={{ fontSize: 18, marginBottom: 3 }}>{r.icon}</div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: role === r.value ? G.green : "#888" }}>{r.label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Username */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", fontSize: 12, fontWeight: 800, color: "#444", marginBottom: 7, textTransform: "uppercase", letterSpacing: 0.7 }}>Tên đăng nhập</label>
            <input style={fieldStyle("user")} value={username} onChange={e => setUsername(e.target.value)} onFocus={() => setFocused("user")} onBlur={() => setFocused(null)} placeholder="Nhập tên đăng nhập" autoComplete="username" />
          </div>

          {/* Password */}
          <div style={{ marginBottom: 22 }}>
            <label style={{ display: "block", fontSize: 12, fontWeight: 800, color: "#444", marginBottom: 7, textTransform: "uppercase", letterSpacing: 0.7 }}>Mật khẩu</label>
            <div style={{ position: "relative" }}>
              <input style={fieldStyle("pw")} type={showPw ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} onFocus={() => setFocused("pw")} onBlur={() => setFocused(null)} placeholder="Nhập mật khẩu" autoComplete="current-password" />
              <button type="button" onClick={() => setShowPw(s => !s)} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", fontSize: 16, color: "#aaa" }}>
                {showPw ? "🙈" : "👁"}
              </button>
            </div>
          </div>

          {/* Submit */}
          <button type="submit" disabled={loading} style={{ width: "100%", padding: "13px", background: loading ? "#aaa" : `linear-gradient(135deg,${G.green},#1b5e20)`, color: G.white, border: "none", borderRadius: 10, fontSize: 15, fontWeight: 800, cursor: loading ? "not-allowed" : "pointer", letterSpacing: 0.5 }}>
            {loading ? "Đang đăng nhập…" : "Đăng nhập →"}
          </button>
        </form>
      </div>
    </div>
  );
}
