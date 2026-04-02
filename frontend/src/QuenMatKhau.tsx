import { useState, useEffect, type CSSProperties } from "react";
import { type UserRole, apiResetPassword } from "./AuthHelper.ts";

const G = {
  green: "#2d7a2d", greenL: "#4caf50", leaf: "#e8f5e9", soil: "#3b2a1a",
  mist: "#f7faf7", white: "#ffffff", err: "#c62828", errBg: "#fff0f0",
  ok: "#1b5e20", okBg: "#e8f5e9",
};

const baseInp: CSSProperties = {
  width: "100%", padding: "12px 14px", border: "1.5px solid #cde3cd",
  borderRadius: 9, fontSize: 14, fontFamily: "inherit", outline: "none",
  background: G.mist, color: G.soil, transition: "border-color .2s, box-shadow .2s",
  boxSizing: "border-box",
};

const ROLES: { value: UserRole; label: string; icon: string }[] = [
  { value: "nongdan", label: "Nông dân", icon: "🌾" },
  { value: "daily",   label: "Đại lý",   icon: "🏢" },
  { value: "sieuthi", label: "Siêu thị", icon: "🛒" },
  { value: "admin",   label: "Admin",    icon: "⚙️" },
];

function passwordScore(pw: string): 0 | 1 | 2 | 3 {
  let s = 0;
  if (pw.length >= 8) s++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) s++;
  if (/\d/.test(pw) && /[^A-Za-z0-9]/.test(pw)) s++;
  return s as 0 | 1 | 2 | 3;
}
const STRENGTH_COLOR = ["", "#f44336", "#ff9800", "#4caf50"];
const STRENGTH = ["", "Yếu", "Trung bình", "Mạnh"];

function LeafBg() {
  return (
    <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0.07, pointerEvents: "none" }} viewBox="0 0 400 200">
      <path d="M0 180 Q100 80 200 100 Q300 120 400 20" stroke="#fff" strokeWidth="2" fill="none"/>
      <circle cx="350" cy="30" r="40" fill="#fff" opacity=".5"/>
    </svg>
  );
}

export default function QuenMatKhau() {
  const [role, setRole] = useState<UserRole | "">("");
  const [email, setEmail] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [pwScore, setPwScore] = useState<0 | 1 | 2 | 3>(0);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [alert, setAlert] = useState<{ msg: string; type: "error" | "success" } | null>(null);
  const [focused, setFocused] = useState<string | null>(null);

  useEffect(() => {
    if (alert && alert.type !== "success") {
      const t = setTimeout(() => setAlert(null), 5000);
      return () => clearTimeout(t);
    }
  }, [alert]);

  const fs = (name: string): CSSProperties => ({
    ...baseInp,
    borderColor: focused === name ? G.green : "#cde3cd",
    boxShadow: focused === name ? `0 0 0 3px ${G.leaf}` : "none",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setAlert(null);
    if (!role) return setAlert({ msg: "Vui lòng chọn loại tài khoản", type: "error" });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return setAlert({ msg: "Email không hợp lệ", type: "error" });
    if (newPw.length < 8) return setAlert({ msg: "Mật khẩu tối thiểu 8 ký tự", type: "error" });
    if (newPw !== confirmPw) return setAlert({ msg: "Mật khẩu xác nhận không khớp", type: "error" });

    setLoading(true);
    try {
      await apiResetPassword({ role: role as UserRole, email, newPassword: newPw });
      setDone(true);
      setAlert({ msg: "Đặt lại mật khẩu thành công!", type: "success" });
      setTimeout(() => { window.location.href = "/login"; }, 2000);
    } catch (err: unknown) {
      setAlert({ msg: err instanceof Error ? err.message : "Không tìm thấy tài khoản với email này", type: "error" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: `linear-gradient(145deg,${G.green} 0%,#1b5e20 55%,${G.soil} 100%)`, display: "flex", alignItems: "center", justifyContent: "center", padding: 20, fontFamily: "'Nunito','Segoe UI',sans-serif", position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", top: -80, right: -80, width: 280, height: 280, borderRadius: "50%", background: "rgba(255,255,255,0.04)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", bottom: -60, left: -60, width: 200, height: 200, borderRadius: "50%", background: "rgba(255,255,255,0.06)", pointerEvents: "none" }} />

      <div style={{ background: G.white, borderRadius: 20, width: "100%", maxWidth: 440, boxShadow: "0 24px 64px rgba(0,0,0,0.28)", overflow: "hidden" }}>
        <style>{`@keyframes slideUp{from{opacity:0;transform:translateY(28px)}to{opacity:1;transform:none}}`}</style>

        <div style={{ background: `linear-gradient(135deg,${G.green},#1b5e20)`, padding: "28px 24px 20px", textAlign: "center", position: "relative", overflow: "hidden" }}>
          <LeafBg />
          <div style={{ fontSize: 40, marginBottom: 8, position: "relative" }}>🔑</div>
          <h2 style={{ color: G.white, fontSize: 20, fontWeight: 800, margin: 0, position: "relative" }}>Quên mật khẩu</h2>
          <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 12, margin: "5px 0 0", position: "relative" }}>Đặt lại mật khẩu theo email đăng ký</p>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: "26px 26px 22px" }}>
          {alert && (
            <div style={{ padding: "11px 14px", borderRadius: 10, marginBottom: 18, fontSize: 13, fontWeight: 600, background: alert.type === "error" ? G.errBg : G.okBg, color: alert.type === "error" ? G.err : G.ok, borderLeft: `4px solid ${alert.type === "error" ? G.err : G.greenL}` }}>
              {alert.type === "error" ? "⚠ " : "✓ "}{alert.msg}
            </div>
          )}

          {/* Role */}
          <div style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: "#555", marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.7 }}>Loại tài khoản</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8 }}>
              {ROLES.map(r => (
                <button key={r.value} type="button" onClick={() => setRole(r.value)} style={{ padding: "9px 4px", border: `2px solid ${role === r.value ? G.green : "#e0e0e0"}`, borderRadius: 10, background: role === r.value ? G.leaf : G.mist, cursor: "pointer", transition: "all .18s", textAlign: "center" }}>
                  <div style={{ fontSize: 16, marginBottom: 3 }}>{r.icon}</div>
                  <div style={{ fontSize: 9, fontWeight: 700, color: role === r.value ? G.green : "#888" }}>{r.label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Email */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: "#555", marginBottom: 7, textTransform: "uppercase", letterSpacing: 0.7 }}>Email đã đăng ký</div>
            <input style={fs("email")} type="email" placeholder="email@example.com" value={email} onChange={e => setEmail(e.target.value)} onFocus={() => setFocused("email")} onBlur={() => setFocused(null)} />
          </div>

          {/* New password */}
          <div style={{ marginBottom: 8 }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: "#555", marginBottom: 7, textTransform: "uppercase", letterSpacing: 0.7 }}>Mật khẩu mới</div>
            <div style={{ position: "relative" }}>
              <input style={fs("npw")} type={showPw ? "text" : "password"} placeholder="Ít nhất 8 ký tự" value={newPw}
                onChange={e => { setNewPw(e.target.value); setPwScore(passwordScore(e.target.value)); }}
                onFocus={() => setFocused("npw")} onBlur={() => setFocused(null)} />
              <button type="button" onClick={() => setShowPw(s => !s)} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", fontSize: 15, color: "#aaa" }}>
                {showPw ? "🙈" : "👁"}
              </button>
            </div>
            {newPw && (
              <div style={{ marginTop: 5 }}>
                <div style={{ height: 3, background: "#eee", borderRadius: 2, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${(pwScore / 3) * 100}%`, background: STRENGTH_COLOR[pwScore], transition: "width .3s" }} />
                </div>
                <div style={{ fontSize: 10, color: STRENGTH_COLOR[pwScore], marginTop: 2, fontWeight: 700 }}>{STRENGTH[pwScore]}</div>
              </div>
            )}
          </div>

          {/* Confirm password */}
          <div style={{ marginBottom: 22 }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: "#555", marginBottom: 7, textTransform: "uppercase", letterSpacing: 0.7 }}>Xác nhận mật khẩu</div>
            <input style={fs("cpw")} type="password" placeholder="Nhập lại mật khẩu mới" value={confirmPw} onChange={e => setConfirmPw(e.target.value)} onFocus={() => setFocused("cpw")} onBlur={() => setFocused(null)} />
            {confirmPw && newPw !== confirmPw && <div style={{ fontSize: 11, color: G.err, marginTop: 4, fontWeight: 700 }}>⚠ Mật khẩu không khớp</div>}
            {confirmPw && newPw === confirmPw && newPw.length >= 8 && <div style={{ fontSize: 11, color: G.ok, marginTop: 4, fontWeight: 700 }}>✓ Mật khẩu khớp</div>}
          </div>

          <button type="submit" disabled={loading || done} style={{ width: "100%", padding: "13px", background: done ? G.ok : loading ? "#aaa" : `linear-gradient(135deg,${G.green},#1b5e20)`, color: G.white, border: "none", borderRadius: 10, fontSize: 14, fontWeight: 800, cursor: loading || done ? "not-allowed" : "pointer", letterSpacing: 0.5, marginBottom: 10 }}>
            {done ? "✓ Thành công!" : loading ? "Đang xử lý…" : "Đặt lại mật khẩu →"}
          </button>
          <button type="button" onClick={() => { window.location.href = "/login"; }} style={{ width: "100%", padding: "12px", background: "#f5f5f5", color: "#555", border: "none", borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
            ← Quay lại đăng nhập
          </button>

          <div style={{ marginTop: 18, padding: "14px 16px", background: G.leaf, borderLeft: `4px solid ${G.green}`, borderRadius: 8, fontSize: 12, color: "#555", lineHeight: 1.7 }}>
            <div style={{ fontWeight: 800, color: G.green, marginBottom: 6 }}>ℹ Hướng dẫn</div>
            <ol style={{ paddingLeft: 16, margin: 0 }}>
              <li>Chọn loại tài khoản tương ứng</li>
              <li>Nhập email đã dùng khi đăng ký</li>
              <li>Nhập và xác nhận mật khẩu mới</li>
              <li>Bấm nút đặt lại và đăng nhập lại</li>
            </ol>
          </div>
        </form>
      </div>
    </div>
  );
}
