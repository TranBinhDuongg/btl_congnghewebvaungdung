import { useState, useEffect, type ChangeEvent, type FormEvent } from "react";
import { type UserRole, apiRegister } from "./AuthHelper.ts";

const G = {
  green: "#2d7a2d", greenL: "#4caf50", leaf: "#e8f5e9", soil: "#3b2a1a",
  mist: "#f7faf7", white: "#ffffff", err: "#c62828", errBg: "#fff0f0",
  ok: "#1b5e20", okBg: "#e8f5e9",
};

const baseInp = {
  width: "100%", padding: "11px 14px", border: "1.5px solid #cde3cd",
  borderRadius: 9, fontSize: 13, fontFamily: "inherit", outline: "none",
  background: G.mist, color: G.soil, transition: "border-color .2s, box-shadow .2s",
  boxSizing: "border-box" as const,
};

const Label = ({ children }: { children: React.ReactNode }) => (
  <div style={{ fontSize: 11, fontWeight: 800, color: "#555", marginBottom: 5, textTransform: "uppercase" as const, letterSpacing: 0.7 }}>{children}</div>
);
const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div style={{ marginBottom: 14 }}><Label>{label}</Label>{children}</div>
);

function passwordScore(pw: string): 0 | 1 | 2 | 3 {
  let s = 0;
  if (pw.length >= 8) s++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) s++;
  if (/\d/.test(pw) && /[^A-Za-z0-9]/.test(pw)) s++;
  return s as 0 | 1 | 2 | 3;
}
const STRENGTH = ["", "Yếu", "Trung bình", "Mạnh"];
const STRENGTH_COLOR = ["", "#f44336", "#ff9800", "#4caf50"];

const ROLES: { value: UserRole; label: string; icon: string; desc: string }[] = [
  { value: "nongdan", label: "Nông dân",  icon: "🌾", desc: "Quản lý trang trại" },
  { value: "daily",   label: "Đại lý",    icon: "🏢", desc: "Vận chuyển, phân phối" },
  { value: "sieuthi", label: "Siêu thị",  icon: "🛒", desc: "Bán lẻ, kinh doanh" },
];

function LeafBg() {
  return (
    <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0.08, pointerEvents: "none" }} viewBox="0 0 400 200">
      <path d="M0 180 Q100 80 200 100 Q300 120 400 20" stroke="#fff" strokeWidth="2" fill="none"/>
      <circle cx="350" cy="30" r="40" fill="#fff" opacity=".5"/>
    </svg>
  );
}

const INIT_FORM = {
  fullName: "", phone: "", email: "", username: "", password: "", confirmPassword: "",
  province: "", district: "", address: "",
  farmName: "", farmArea: "", cropType: "", certification: "",
  companyName: "", taxCode: "", vehicleCount: "", serviceArea: "",
  storeName: "", businessType: "", businessLicense: "", storeSize: "",
};

export default function DangKy() {
  const [role, setRole] = useState<UserRole | "">("");
  const [form, setForm] = useState(INIT_FORM);
  const [agree, setAgree] = useState(false);
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState<{ msg: string; type: "error" | "success" } | null>(null);
  const [focused, setFocused] = useState<string | null>(null);
  const [pwScore, setPwScore] = useState<0 | 1 | 2 | 3>(0);

  const set = (k: string) => (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm(f => ({ ...f, [k]: e.target.value }));
    if (k === "password") setPwScore(passwordScore(e.target.value));
  };

  useEffect(() => {
    if (!alert) return;
    const t = setTimeout(() => setAlert(null), 6000);
    return () => clearTimeout(t);
  }, [alert]);

  const fs = (name: string) => ({
    ...baseInp,
    borderColor: focused === name ? G.green : "#cde3cd",
    boxShadow: focused === name ? `0 0 0 3px ${G.leaf}` : "none",
  });

  const inp_ = (name: string, placeholder: string, type = "text") => (
    <input style={fs(name)} type={type} placeholder={placeholder}
      value={(form as Record<string, string>)[name]}
      onChange={set(name)} onFocus={() => setFocused(name)} onBlur={() => setFocused(null)} />
  );

  const sel = (name: string, children: React.ReactNode) => (
    <select style={{ ...fs(name), appearance: "none" as const }}
      value={(form as Record<string, string>)[name]}
      onChange={set(name)} onFocus={() => setFocused(name)} onBlur={() => setFocused(null)}>
      {children}
    </select>
  );

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setAlert(null);
    if (!role) return setAlert({ msg: "Vui lòng chọn vai trò", type: "error" });
    if (!form.fullName) return setAlert({ msg: "Họ tên không được trống", type: "error" });
    if (!form.phone) return setAlert({ msg: "Số điện thoại không được trống", type: "error" });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return setAlert({ msg: "Email không hợp lệ", type: "error" });
    if (form.password.length < 8) return setAlert({ msg: "Mật khẩu tối thiểu 8 ký tự", type: "error" });
    if (form.password !== form.confirmPassword) return setAlert({ msg: "Mật khẩu xác nhận không khớp", type: "error" });
    if (!agree) return setAlert({ msg: "Vui lòng đồng ý điều khoản", type: "error" });
    setLoading(true);
    try {
      await apiRegister({ ...form, role: role as UserRole });
      setAlert({ msg: "Đăng ký thành công! Đang chuyển đến trang đăng nhập…", type: "success" });
      setTimeout(() => { window.location.href = "/login"; }, 2000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Đăng ký thất bại";
      setAlert({ msg, type: "error" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: `linear-gradient(145deg,${G.green} 0%,#1b5e20 55%,${G.soil} 100%)`, display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "28px 16px 40px", fontFamily: "'Nunito','Segoe UI',sans-serif" }}>
      <div style={{ background: G.white, borderRadius: 20, width: "100%", maxWidth: 800, boxShadow: "0 24px 64px rgba(0,0,0,0.28)", overflow: "hidden" }}>
        <style>{`@keyframes slideUp{from{opacity:0;transform:translateY(28px)}to{opacity:1;transform:none}}`}</style>

        {/* Header */}
        <div style={{ background: `linear-gradient(135deg,${G.green},#1b5e20)`, padding: "28px 28px 20px", textAlign: "center", position: "relative", overflow: "hidden" }}>
          <LeafBg />
          <div style={{ fontSize: 36, marginBottom: 8, position: "relative" }}>🌿</div>
          <h2 style={{ color: G.white, fontSize: 20, fontWeight: 800, margin: 0, position: "relative" }}>Đăng ký tài khoản</h2>
          <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 12, margin: "4px 0 0", position: "relative" }}>Hệ thống Quản lý Nông sản & Chuỗi cung ứng</p>
        </div>

        <div style={{ padding: "28px 28px 24px" }}>
          {alert && (
            <div style={{ padding: "11px 14px", borderRadius: 10, marginBottom: 20, fontSize: 13, fontWeight: 600, background: alert.type === "error" ? G.errBg : G.okBg, color: alert.type === "error" ? G.err : G.ok, borderLeft: `4px solid ${alert.type === "error" ? G.err : G.greenL}` }}>
              {alert.type === "error" ? "⚠ " : "✓ "}{alert.msg}
            </div>
          )}

          {/* Role */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: G.green, marginBottom: 12, textTransform: "uppercase", letterSpacing: 0.8 }}>① Chọn vai trò</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10 }}>
              {ROLES.map(r => (
                <button key={r.value} type="button" onClick={() => setRole(r.value)} style={{ padding: "14px 8px", border: `2px solid ${role === r.value ? G.green : "#e5e5e5"}`, borderRadius: 12, background: role === r.value ? G.leaf : G.mist, cursor: "pointer", transition: "all .18s", textAlign: "center" }}>
                  <div style={{ fontSize: 24, marginBottom: 6 }}>{r.icon}</div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: role === r.value ? G.green : "#555" }}>{r.label}</div>
                  <div style={{ fontSize: 10, color: "#999", marginTop: 2 }}>{r.desc}</div>
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            {/* Personal */}
            <div style={{ fontSize: 13, fontWeight: 800, color: G.green, marginBottom: 12, textTransform: "uppercase", letterSpacing: 0.8 }}>② Thông tin cá nhân</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
              <Field label="Họ và tên *">{inp_("fullName", "Nguyễn Văn A")}</Field>
              <Field label="Số điện thoại *">{inp_("phone", "0912 345 678", "tel")}</Field>
            </div>
            <Field label="Email *">{inp_("email", "email@example.com", "email")}</Field>

            {/* Account */}
            <div style={{ fontSize: 13, fontWeight: 800, color: G.green, margin: "18px 0 12px", textTransform: "uppercase", letterSpacing: 0.8 }}>③ Tài khoản</div>
            <Field label="Tên đăng nhập *">{inp_("username", "username")}</Field>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
              <div style={{ marginBottom: 14 }}>
                <Label>Mật khẩu *</Label>
                <input style={fs("pw")} type="password" placeholder="Ít nhất 8 ký tự" value={form.password} onChange={set("password")} onFocus={() => setFocused("pw")} onBlur={() => setFocused(null)} />
                {form.password && (
                  <div style={{ marginTop: 6 }}>
                    <div style={{ height: 4, background: "#eee", borderRadius: 2, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${(pwScore / 3) * 100}%`, background: STRENGTH_COLOR[pwScore], transition: "width .3s" }} />
                    </div>
                    <div style={{ fontSize: 10, color: STRENGTH_COLOR[pwScore], marginTop: 3, fontWeight: 700 }}>{STRENGTH[pwScore]}</div>
                  </div>
                )}
              </div>
              <Field label="Xác nhận mật khẩu *">{inp_("confirmPassword", "Nhập lại mật khẩu", "password")}</Field>
            </div>

            {/* Address */}
            <div style={{ fontSize: 13, fontWeight: 800, color: G.green, margin: "18px 0 12px", textTransform: "uppercase", letterSpacing: 0.8 }}>④ Địa chỉ</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
              <Field label="Tỉnh/Thành phố *">
                {sel("province", <>
                  <option value="">— Chọn —</option>
                  <option>Hà Nội</option><option>TP. Hồ Chí Minh</option>
                  <option>Đà Nẵng</option><option>Hòa Bình</option><option>Đà Lạt</option>
                </>)}
              </Field>
              <Field label="Quận/Huyện *">{inp_("district", "Quận/Huyện")}</Field>
            </div>
            <Field label="Địa chỉ chi tiết *">{inp_("address", "Số nhà, đường, phường/xã")}</Field>

            {/* Role-specific */}
            {role === "nongdan" && (
              <div style={{ background: G.leaf, borderRadius: 12, padding: 16, marginTop: 16 }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: G.green, marginBottom: 12, textTransform: "uppercase", letterSpacing: 0.8 }}>⑤ Thông tin trang trại</div>
                <Field label="Tên trang trại">{inp_("farmName", "Trang trại Xanh")}</Field>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
                  <Field label="Diện tích (ha)">{inp_("farmArea", "5", "number")}</Field>
                  <Field label="Loại nông sản">
                    {sel("cropType", <><option value="">— Chọn —</option><option>Rau củ</option><option>Trái cây</option><option>Lúa gạo</option></>)}
                  </Field>
                </div>
                <Field label="Chứng nhận">
                  {sel("certification", <><option value="">Không</option><option>VietGAP</option><option>GlobalGAP</option><option>Organic</option></>)}
                </Field>
              </div>
            )}

            {role === "daily" && (
              <div style={{ background: G.leaf, borderRadius: 12, padding: 16, marginTop: 16 }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: G.green, marginBottom: 12, textTransform: "uppercase", letterSpacing: 0.8 }}>⑤ Thông tin đại lý</div>
                <Field label="Tên công ty / Đại lý">{inp_("companyName", "Công ty TNHH…")}</Field>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
                  <Field label="Mã số thuế">{inp_("taxCode", "0100XXXXXX")}</Field>
                  <Field label="Số xe vận chuyển">{inp_("vehicleCount", "3", "number")}</Field>
                </div>
                <Field label="Khu vực hoạt động">
                  <textarea style={{ ...fs("serviceArea"), resize: "vertical", minHeight: 70 }} placeholder="Hà Nội, Hưng Yên…" value={form.serviceArea} onChange={set("serviceArea")} onFocus={() => setFocused("serviceArea")} onBlur={() => setFocused(null)} />
                </Field>
              </div>
            )}

            {role === "sieuthi" && (
              <div style={{ background: G.leaf, borderRadius: 12, padding: 16, marginTop: 16 }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: G.green, marginBottom: 12, textTransform: "uppercase", letterSpacing: 0.8 }}>⑤ Thông tin siêu thị</div>
                <Field label="Tên siêu thị / Cửa hàng">{inp_("storeName", "Siêu thị ABC")}</Field>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
                  <Field label="Loại hình kinh doanh">
                    {sel("businessType", <><option value="">— Chọn —</option><option>Siêu thị</option><option>Cửa hàng tiện lợi</option><option>Chợ</option></>)}
                  </Field>
                  <Field label="Giấy phép kinh doanh">{inp_("businessLicense", "Số GPKD")}</Field>
                </div>
                <Field label="Quy mô (m²)">{inp_("storeSize", "500", "number")}</Field>
              </div>
            )}

            {/* Agree + Submit */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "20px 0 18px" }}>
              <input type="checkbox" id="agree" checked={agree} onChange={e => setAgree(e.target.checked)} style={{ width: 17, height: 17, cursor: "pointer", accentColor: G.green }} />
              <label htmlFor="agree" style={{ fontSize: 13, color: "#555", cursor: "pointer" }}>
                Tôi đồng ý với <a href="/terms" style={{ color: G.green, fontWeight: 700, textDecoration: "none" }}>Điều khoản</a> và <a href="/privacy" style={{ color: G.green, fontWeight: 700, textDecoration: "none" }}>Chính sách</a>
              </label>
            </div>
            <button type="submit" disabled={loading} style={{ width: "100%", padding: "13px", background: loading ? "#aaa" : `linear-gradient(135deg,${G.green},#1b5e20)`, color: G.white, border: "none", borderRadius: 10, fontSize: 15, fontWeight: 800, cursor: loading ? "not-allowed" : "pointer", letterSpacing: 0.5 }}>
              {loading ? "Đang đăng ký…" : "Đăng ký tài khoản →"}
            </button>
            <div style={{ textAlign: "center", marginTop: 16, fontSize: 13, color: "#888" }}>
              Đã có tài khoản? <a href="/login" style={{ color: G.green, fontWeight: 700, textDecoration: "none" }}>Đăng nhập ngay</a>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
