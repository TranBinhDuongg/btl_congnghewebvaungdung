import { useState, useEffect, useCallback, ReactNode, CSSProperties } from "react";
import { getCurrentUser, clearCurrentUser, apiUpdateProfile } from "./AuthHelper.ts";

// ─── Types ────────────────────────────────────────────────────────────────────
interface NongDan { MaNongDan: number; HoTen: string; TenDangNhap: string; Email?: string; SoDienThoai?: string; DiaChi?: string; }
interface DaiLy   { MaDaiLy: number;   TenDaiLy: string;   TenDangNhap?: string; Email?: string; SoDienThoai?: string; DiaChi?: string; }
interface SieuThi { MaSieuThi: number; TenSieuThi: string; TenDangNhap?: string; Email?: string; SoDienThoai?: string; DiaChi?: string; }
interface TrangTrai { MaTrangTrai: number; TenTrangTrai: string; DiaChi?: string; SoChungNhan?: string; MaNongDan: number; TenNongDan?: string; }
interface LoNongSan { MaLo: number; TenSanPham?: string; SoLuongBanDau: number; SoLuongHienTai: number; NgayThuHoach?: string; HanSuDung?: string; TrangThai?: string; TenTrangTrai?: string; }
interface DonHangDaiLy { MaDonHang: number; TenDaiLy?: string; TenNongDan?: string; TrangThai?: string; NgayTao?: string; GhiChu?: string; }
interface DonHangSieuThi { MaDonHang: number; TenSieuThi?: string; TenDaiLy?: string; TrangThai?: string; NgayTao?: string; GhiChu?: string; }
interface AdminUser { maTaiKhoan: number; tenHienThi: string; username: string; email?: string; soDienThoai?: string; diaChi?: string; }
interface Log { time: string; user: string; action: string; }

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const API: string = (window as any)._env_?.REACT_APP_API_URL || (typeof process !== "undefined" ? (process as any).env?.REACT_APP_API_URL : "") || "";
const ls = <T,>(k: string, fb: T): T => { try { return JSON.parse(localStorage.getItem(k) || "null") ?? fb; } catch { return fb; } };
const lsSave = (k: string, v: unknown) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /**/ } };

// ─── Role config ──────────────────────────────────────────────────────────────
const ROLE_META: Record<string, { label: string; color: string; bg: string; emoji: string }> = {
  admin:   { label: "Admin",    color: "#7c3aed", bg: "#ede9fe", emoji: "🛡️" },
  nongdan: { label: "Nông dân", color: "#0369a1", bg: "#e0f2fe", emoji: "🌾" },
  daily:   { label: "Đại lý",   color: "#b45309", bg: "#fef3c7", emoji: "🏪" },
  sieuthi: { label: "Siêu thị", color: "#065f46", bg: "#d1fae5", emoji: "🛒" },
};
const roleMeta = (r: string) => ROLE_META[r?.toLowerCase?.()] || { label: r, color: "#374151", bg: "#f3f4f6", emoji: "👤" };

// ─── Nav ──────────────────────────────────────────────────────────────────────
const NAV = [
  { id: "dashboard",  label: "Bảng điều khiển", emoji: "📊" },
  { id: "nongdan",    label: "Nông dân",          emoji: "🌾" },
  { id: "daily",      label: "Đại lý",            emoji: "🏪" },
  { id: "sieuthi",    label: "Siêu thị",          emoji: "🛒" },
  { id: "trangtrai",  label: "Trang trại",         emoji: "🌿" },
  { id: "lonongsan",  label: "Lô nông sản",        emoji: "📦" },
  { id: "donhang",    label: "Đơn hàng",           emoji: "🧾" },
  { id: "profile",    label: "Hồ sơ",             emoji: "👤" },
  { id: "logs",       label: "Audit / Log",         emoji: "🔍" },
];

// ─── Atoms ────────────────────────────────────────────────────────────────────
const RoleBadge = ({ role }: { role: string }) => {
  const m = roleMeta(role);
  return <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 10px", borderRadius: 999, fontSize: 11, fontWeight: 700, color: m.color, background: m.bg }}>{m.emoji} {m.label}</span>;
};

const StatusBadge = ({ status }: { status?: string }) => {
  const s = (status || "").toLowerCase();
  const map: Record<string, [string, string]> = {
    "đã giao": ["#065f46","#d1fae5"], delivered: ["#065f46","#d1fae5"], received: ["#065f46","#d1fae5"],
    "đang giao": ["#92400e","#fef3c7"], shipped: ["#92400e","#fef3c7"],
    pending: ["#1e40af","#dbeafe"], "chờ xử lý": ["#1e40af","#dbeafe"],
    "xác nhận": ["#7c3aed","#ede9fe"], confirmed: ["#7c3aed","#ede9fe"],
    "đã hủy": ["#dc2626","#fee2e2"], cancelled: ["#dc2626","#fee2e2"],
    "hoàn thành": ["#065f46","#d1fae5"], completed: ["#065f46","#d1fae5"],
  };
  const [color, bg] = map[s] || ["#374151","#f3f4f6"];
  return <span style={{ padding: "3px 10px", borderRadius: 999, fontSize: 11, fontWeight: 700, color, background: bg }}>{status || "—"}</span>;
};

const Kpi = ({ emoji, value, label, accent }: { emoji: string; value: number | string; label: string; accent: string }) => (
  <div style={{ background: "#fff", borderRadius: 16, padding: "22px 20px", boxShadow: "0 2px 16px rgba(0,0,0,0.07)", borderTop: `3px solid ${accent}`, position: "relative", overflow: "hidden" }}>
    <div style={{ fontSize: 26, marginBottom: 4 }}>{emoji}</div>
    <div style={{ fontSize: 36, fontWeight: 900, color: "#1a1a2e", lineHeight: 1 }}>{value}</div>
    <div style={{ fontSize: 13, color: "#6b7280", marginTop: 6, fontWeight: 500 }}>{label}</div>
    <div style={{ position: "absolute", right: -16, top: -16, width: 90, height: 90, borderRadius: "50%", background: `${accent}18` }} />
  </div>
);

const Card = ({ title, children, action }: { title?: string; children: ReactNode; action?: ReactNode }) => (
  <div style={{ background: "#fff", borderRadius: 14, padding: "20px 22px", boxShadow: "0 2px 16px rgba(0,0,0,0.06)" }}>
    {title && <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}><h4 style={{ fontSize: 15, fontWeight: 700, color: "#111827" }}>{title}</h4>{action}</div>}
    {children}
  </div>
);

const Th = ({ children }: { children: ReactNode }) => (
  <th style={{ padding: "9px 12px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.7px", borderBottom: "2px solid #f3f4f6", whiteSpace: "nowrap" }}>{children}</th>
);
const Td = ({ children, mono }: { children?: ReactNode; mono?: boolean }) => (
  <td style={{ padding: "11px 12px", borderBottom: "1px solid #f9fafb", color: mono ? "#6366f1" : "#374151", fontSize: 13, fontFamily: mono ? "monospace" : "inherit", fontWeight: mono ? 700 : 400, verticalAlign: "middle" }}>{children ?? "—"}</td>
);
const TrHover = ({ children }: { children: ReactNode }) => {
  const [h, setH] = useState(false);
  return <tr onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)} style={{ background: h ? "#f8faff" : "transparent", transition: "background 0.12s" }}>{children}</tr>;
};
const EmptyRow = ({ cols }: { cols: number }) => (
  <tr><td colSpan={cols} style={{ padding: "40px 0", textAlign: "center", color: "#9ca3af", fontSize: 14 }}><div style={{ fontSize: 32, marginBottom: 8 }}>📭</div>Chưa có dữ liệu</td></tr>
);

const Btn = ({ children, variant = "primary", size = "md", onClick, disabled }: { children: ReactNode; variant?: "primary"|"danger"|"ghost"|"outline"|"purple"|"blue"; size?: "sm"|"md"; onClick?: () => void; disabled?: boolean }) => {
  const vars: Record<string, CSSProperties> = {
    primary: { background: "linear-gradient(135deg,#22c55e,#16a34a)", color: "#fff" },
    danger:  { background: "#fef2f2", color: "#dc2626" },
    ghost:   { background: "#f3f4f6", color: "#374151" },
    outline: { background: "transparent", color: "#6b7280", border: "1.5px solid #e5e7eb" },
    purple:  { background: "linear-gradient(135deg,#7c3aed,#5b21b6)", color: "#fff" },
    blue:    { background: "linear-gradient(135deg,#3b82f6,#1d4ed8)", color: "#fff" },
  };
  return (
    <button disabled={disabled} onClick={onClick} style={{ display: "inline-flex", alignItems: "center", gap: 6, border: "none", borderRadius: size === "sm" ? 6 : 8, cursor: disabled ? "not-allowed" : "pointer", fontWeight: 600, fontSize: size === "sm" ? 12 : 14, fontFamily: "inherit", padding: size === "sm" ? "5px 10px" : "9px 18px", transition: "all 0.15s", opacity: disabled ? 0.6 : 1, ...vars[variant] }}
      onMouseEnter={e => { if (!disabled) { e.currentTarget.style.filter = "brightness(1.07)"; e.currentTarget.style.transform = "translateY(-1px)"; } }}
      onMouseLeave={e => { e.currentTarget.style.filter = ""; e.currentTarget.style.transform = ""; }}>
      {children}
    </button>
  );
};

const Modal = ({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: ReactNode }) => {
  useEffect(() => {
    const h = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    if (open) document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div onClick={e => e.target === e.currentTarget && onClose()} style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.55)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9000, backdropFilter: "blur(3px)" }}>
      <div style={{ background: "#fff", borderRadius: 18, padding: "28px 32px", width: "min(520px,94vw)", maxHeight: "88vh", overflowY: "auto", boxShadow: "0 32px 80px rgba(0,0,0,0.22)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 22 }}>
          <h3 style={{ fontSize: 17, fontWeight: 800, color: "#1a1a2e" }}>{title}</h3>
          <button onClick={onClose} style={{ background: "#f3f4f6", border: "none", borderRadius: 8, width: 30, height: 30, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: 16, color: "#6b7280" }}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
};

const Field = ({ label, children }: { label: string; children: ReactNode }) => (
  <div style={{ marginBottom: 14 }}>
    <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 5 }}>{label}</label>
    {children}
  </div>
);

const IS: CSSProperties = { width: "100%", padding: "9px 12px", border: "1.5px solid #e5e7eb", borderRadius: 8, fontSize: 13, fontFamily: "inherit", outline: "none", background: "#fafafa", boxSizing: "border-box" };
const Inp = (p: React.InputHTMLAttributes<HTMLInputElement>) => (
  <input {...p} style={{ ...IS, ...p.style }}
    onFocus={e => { e.currentTarget.style.borderColor = "#6366f1"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(99,102,241,0.1)"; e.currentTarget.style.background = "#fff"; }}
    onBlur={e => { e.currentTarget.style.borderColor = "#e5e7eb"; e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.background = "#fafafa"; }} />
);
const Sel = (p: React.SelectHTMLAttributes<HTMLSelectElement> & { children: ReactNode }) => (
  <select {...p} style={{ ...IS, ...p.style }}
    onFocus={e => { e.currentTarget.style.borderColor = "#6366f1"; }}
    onBlur={e => { e.currentTarget.style.borderColor = "#e5e7eb"; }} />
);

const Toast = ({ msg, type }: { msg: string; type: "success"|"error" }) => (
  <div style={{ position: "fixed", bottom: 28, right: 28, zIndex: 99999, background: type === "success" ? "#16a34a" : "#dc2626", color: "#fff", padding: "12px 22px", borderRadius: 12, fontWeight: 600, fontSize: 14, boxShadow: "0 8px 32px rgba(0,0,0,0.18)", display: "flex", alignItems: "center", gap: 8 }}>
    {type === "success" ? "✅" : "❌"} {msg}
  </div>
);

// ─── Search bar ───────────────────────────────────────────────────────────────
const SearchBar = ({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) => (
  <div style={{ position: "relative", flex: 1, maxWidth: 320 }}>
    <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#9ca3af", fontSize: 14 }}>🔍</span>
    <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder || "Tìm kiếm..."} style={{ ...IS, paddingLeft: 32, maxWidth: "100%" }}
      onFocus={e => { e.currentTarget.style.borderColor = "#6366f1"; e.currentTarget.style.background = "#fff"; }}
      onBlur={e => { e.currentTarget.style.borderColor = "#e5e7eb"; e.currentTarget.style.background = "#fafafa"; }} />
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────
export default function AdminApp() {
  const [section, setSection] = useState("dashboard");
  const [toast, setToast] = useState<{ msg: string; type: "success"|"error" } | null>(null);

  // Data states
  const [nongDanList, setNongDanList]     = useState<NongDan[]>([]);
  const [dailyList, setDailyList]         = useState<DaiLy[]>([]);
  const [sieuThiList, setSieuThiList]     = useState<SieuThi[]>([]);
  const [trangTraiList, setTrangTraiList] = useState<TrangTrai[]>([]);
  const [loNongSanList, setLoNongSanList] = useState<LoNongSan[]>([]);
  const [donHangDLList, setDonHangDLList] = useState<DonHangDaiLy[]>([]);
  const [donHangSTList, setDonHangSTList] = useState<DonHangSieuThi[]>([]);
  const [loading, setLoading]             = useState(false);

  // Search states
  const [searchND, setSearchND]   = useState("");
  const [searchDL, setSearchDL]   = useState("");
  const [searchST, setSearchST]   = useState("");
  const [searchTT, setSearchTT]   = useState("");
  const [searchLo, setSearchLo]   = useState("");
  const [searchDH, setSearchDH]   = useState("");

  // Modal states
  const [modal, setModal] = useState<string | null>(null);

  // Form states
  const [ndForm, setNdForm] = useState({ HoTen: "", TenDangNhap: "", MatKhauHash: "", Email: "", SoDienThoai: "", DiaChi: "" });
  const [dlForm, setDlForm] = useState({ TenDaiLy: "", TenDangNhap: "", MatKhauHash: "", Email: "", SoDienThoai: "", DiaChi: "" });
  const [stForm, setStForm] = useState({ TenSieuThi: "", TenDangNhap: "", MatKhauHash: "", Email: "", SoDienThoai: "", DiaChi: "" });
  const [ttForm, setTtForm] = useState({ TenTrangTrai: "", MaNongDan: "", DiaChi: "", SoChungNhan: "" });
  const [editNd, setEditNd] = useState<NongDan | null>(null);
  const [editDl, setEditDl] = useState<DaiLy | null>(null);
  const [editSt, setEditSt] = useState<SieuThi | null>(null);
  const [editTt, setEditTt] = useState<TrangTrai | null>(null);

  // Profile
  const authUser = getCurrentUser();
  const [profileForm, setProfileForm] = useState({ hoTen: authUser?.tenHienThi || "", soDienThoai: authUser?.soDienThoai || "", email: authUser?.email || "", diaChi: authUser?.diaChi || "" });
  const [profileSaving, setProfileSaving] = useState(false);

  const showToast = (msg: string, type: "success"|"error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const addLog = useCallback((action: string) => {
    const logs = [{ time: new Date().toLocaleString("vi-VN"), user: authUser?.tenHienThi || "Admin", action }, ...ls<Log[]>("admin_logs", [])].slice(0, 200);
    lsSave("admin_logs", logs);
  }, [authUser]);

  // ─── Fetch helpers ──────────────────────────────────────────────────────────
  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [nd, dl, st, tt, lo, dhdl, dhst] = await Promise.allSettled([
        fetch(`${API}/api/nong-dan/get-all`).then(r => r.json()),
        fetch(`${API}/api/dai-ly/get-all`).then(r => r.json()),
        fetch(`${API}/api/sieuthi`).then(r => r.json()),
        fetch(`${API}/api/trang-trai/get-all`).then(r => r.json()),
        fetch(`${API}/api/lo-nong-san/get-all`).then(r => r.json()),
        fetch(`${API}/api/don-hang-dai-ly/get-all`).then(r => r.json()),
        fetch(`${API}/api/don-hang-sieu-thi/get-all`).then(r => r.json()),
      ]);
      if (nd.status === "fulfilled" && Array.isArray(nd.value)) setNongDanList(nd.value);
      if (dl.status === "fulfilled" && Array.isArray(dl.value)) setDailyList(dl.value);
      if (st.status === "fulfilled" && Array.isArray(st.value)) setSieuThiList(st.value);
      if (tt.status === "fulfilled" && Array.isArray(tt.value)) setTrangTraiList(tt.value);
      if (lo.status === "fulfilled" && Array.isArray(lo.value)) setLoNongSanList(lo.value);
      if (dhdl.status === "fulfilled" && Array.isArray(dhdl.value)) setDonHangDLList(dhdl.value);
      if (dhst.status === "fulfilled" && Array.isArray(dhst.value)) setDonHangSTList(dhst.value);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authUser || authUser.role !== "admin") { window.location.href = "/login"; return; }
    fetchAll();
  }, [fetchAll]);

  const closeModal = () => {
    setModal(null);
    setEditNd(null); setEditDl(null); setEditSt(null); setEditTt(null);
    setNdForm({ HoTen: "", TenDangNhap: "", MatKhauHash: "", Email: "", SoDienThoai: "", DiaChi: "" });
    setDlForm({ TenDaiLy: "", TenDangNhap: "", MatKhauHash: "", Email: "", SoDienThoai: "", DiaChi: "" });
    setStForm({ TenSieuThi: "", TenDangNhap: "", MatKhauHash: "", Email: "", SoDienThoai: "", DiaChi: "" });
    setTtForm({ TenTrangTrai: "", MaNongDan: "", DiaChi: "", SoChungNhan: "" });
  };

  // ─── CRUD: Nông dân ─────────────────────────────────────────────────────────
  const saveNongDan = async () => {
    if (!ndForm.HoTen || !ndForm.TenDangNhap || (!editNd && !ndForm.MatKhauHash)) return showToast("Vui lòng điền đầy đủ thông tin bắt buộc", "error");
    try {
      if (editNd) {
        const res = await fetch(`${API}/api/nong-dan/update/${editNd.MaNongDan}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ HoTen: ndForm.HoTen, Email: ndForm.Email, SoDienThoai: ndForm.SoDienThoai, DiaChi: ndForm.DiaChi }) });
        if (!res.ok) throw new Error((await res.json()).message);
        addLog(`Cập nhật nông dân: ${ndForm.HoTen}`);
        showToast("Cập nhật nông dân thành công");
      } else {
        const res = await fetch(`${API}/api/nong-dan/create`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(ndForm) });
        if (!res.ok) throw new Error((await res.json()).message);
        addLog(`Thêm nông dân: ${ndForm.HoTen}`);
        showToast("Thêm nông dân thành công");
      }
      closeModal(); fetchAll();
    } catch (e: unknown) { showToast((e as Error).message, "error"); }
  };

  const deleteNongDan = async (id: number, ten: string) => {
    if (!window.confirm(`Xóa nông dân "${ten}"?`)) return;
    try {
      const res = await fetch(`${API}/api/nong-dan/delete/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error((await res.json()).message);
      addLog(`Xóa nông dân: ${ten}`); showToast("Đã xóa nông dân"); fetchAll();
    } catch (e: unknown) { showToast((e as Error).message, "error"); }
  };

  // ─── CRUD: Đại lý ───────────────────────────────────────────────────────────
  const saveDaiLy = async () => {
    if (!dlForm.TenDaiLy || !dlForm.TenDangNhap || (!editDl && !dlForm.MatKhauHash)) return showToast("Vui lòng điền đầy đủ thông tin bắt buộc", "error");
    try {
      if (editDl) {
        const res = await fetch(`${API}/api/dai-ly/update/${editDl.MaDaiLy}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ TenDaiLy: dlForm.TenDaiLy, Email: dlForm.Email, SoDienThoai: dlForm.SoDienThoai, DiaChi: dlForm.DiaChi }) });
        if (!res.ok) throw new Error((await res.json()).message);
        addLog(`Cập nhật đại lý: ${dlForm.TenDaiLy}`); showToast("Cập nhật đại lý thành công");
      } else {
        const res = await fetch(`${API}/api/dai-ly/create`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(dlForm) });
        if (!res.ok) throw new Error((await res.json()).message);
        addLog(`Thêm đại lý: ${dlForm.TenDaiLy}`); showToast("Thêm đại lý thành công");
      }
      closeModal(); fetchAll();
    } catch (e: unknown) { showToast((e as Error).message, "error"); }
  };

  const deleteDaiLy = async (id: number, ten: string) => {
    if (!window.confirm(`Xóa đại lý "${ten}"?`)) return;
    try {
      const res = await fetch(`${API}/api/dai-ly/delete/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error((await res.json()).message);
      addLog(`Xóa đại lý: ${ten}`); showToast("Đã xóa đại lý"); fetchAll();
    } catch (e: unknown) { showToast((e as Error).message, "error"); }
  };

  // ─── CRUD: Siêu thị ─────────────────────────────────────────────────────────
  const saveSieuThi = async () => {
    if (!stForm.TenSieuThi || !stForm.TenDangNhap || (!editSt && !stForm.MatKhauHash)) return showToast("Vui lòng điền đầy đủ thông tin bắt buộc", "error");
    try {
      if (editSt) {
        const res = await fetch(`${API}/api/sieuthi/${editSt.MaSieuThi}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ TenSieuThi: stForm.TenSieuThi, Email: stForm.Email, SoDienThoai: stForm.SoDienThoai, DiaChi: stForm.DiaChi }) });
        if (!res.ok) throw new Error((await res.json()).message);
        addLog(`Cập nhật siêu thị: ${stForm.TenSieuThi}`); showToast("Cập nhật siêu thị thành công");
      } else {
        const res = await fetch(`${API}/api/sieuthi`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(stForm) });
        if (!res.ok) throw new Error((await res.json()).message);
        addLog(`Thêm siêu thị: ${stForm.TenSieuThi}`); showToast("Thêm siêu thị thành công");
      }
      closeModal(); fetchAll();
    } catch (e: unknown) { showToast((e as Error).message, "error"); }
  };

  const deleteSieuThi = async (id: number, ten: string) => {
    if (!window.confirm(`Xóa siêu thị "${ten}"?`)) return;
    try {
      const res = await fetch(`${API}/api/sieuthi/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error((await res.json()).message);
      addLog(`Xóa siêu thị: ${ten}`); showToast("Đã xóa siêu thị"); fetchAll();
    } catch (e: unknown) { showToast((e as Error).message, "error"); }
  };

  // ─── CRUD: Trang trại ────────────────────────────────────────────────────────
  const saveTrangTrai = async () => {
    if (!ttForm.TenTrangTrai || !ttForm.MaNongDan) return showToast("Vui lòng điền đầy đủ thông tin bắt buộc", "error");
    try {
      if (editTt) {
        const res = await fetch(`${API}/api/trang-trai/update/${editTt.MaTrangTrai}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ TenTrangTrai: ttForm.TenTrangTrai, DiaChi: ttForm.DiaChi, SoChungNhan: ttForm.SoChungNhan }) });
        if (!res.ok) throw new Error((await res.json()).message);
        addLog(`Cập nhật trang trại: ${ttForm.TenTrangTrai}`); showToast("Cập nhật trang trại thành công");
      } else {
        const res = await fetch(`${API}/api/trang-trai/create`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...ttForm, MaNongDan: Number(ttForm.MaNongDan) }) });
        if (!res.ok) throw new Error((await res.json()).message);
        addLog(`Thêm trang trại: ${ttForm.TenTrangTrai}`); showToast("Thêm trang trại thành công");
      }
      closeModal(); fetchAll();
    } catch (e: unknown) { showToast((e as Error).message, "error"); }
  };

  const deleteTrangTrai = async (id: number, ten: string) => {
    if (!window.confirm(`Xóa trang trại "${ten}"?`)) return;
    try {
      const res = await fetch(`${API}/api/trang-trai/delete/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error((await res.json()).message);
      addLog(`Xóa trang trại: ${ten}`); showToast("Đã xóa trang trại"); fetchAll();
    } catch (e: unknown) { showToast((e as Error).message, "error"); }
  };

  // ─── Profile save ────────────────────────────────────────────────────────────
  const saveProfile = async () => {
    if (!authUser) return;
    setProfileSaving(true);
    try {
      await apiUpdateProfile({ maTaiKhoan: authUser.maTaiKhoan, hoTen: profileForm.hoTen, soDienThoai: profileForm.soDienThoai, email: profileForm.email, diaChi: profileForm.diaChi });
      addLog("Cập nhật hồ sơ admin"); showToast("Cập nhật hồ sơ thành công");
    } catch (e: unknown) { showToast((e as Error).message, "error"); }
    finally { setProfileSaving(false); }
  };

  // ─── Filtered lists ──────────────────────────────────────────────────────────
  const filteredND = nongDanList.filter(u => !searchND || u.HoTen?.toLowerCase().includes(searchND.toLowerCase()) || u.TenDangNhap?.toLowerCase().includes(searchND.toLowerCase()));
  const filteredDL = dailyList.filter(u => !searchDL || u.TenDaiLy?.toLowerCase().includes(searchDL.toLowerCase()));
  const filteredST = sieuThiList.filter(u => !searchST || u.TenSieuThi?.toLowerCase().includes(searchST.toLowerCase()));
  const filteredTT = trangTraiList.filter(u => !searchTT || u.TenTrangTrai?.toLowerCase().includes(searchTT.toLowerCase()) || u.TenNongDan?.toLowerCase().includes(searchTT.toLowerCase()));
  const filteredLo = loNongSanList.filter(u => !searchLo || u.TenSanPham?.toLowerCase().includes(searchLo.toLowerCase()) || u.TenTrangTrai?.toLowerCase().includes(searchLo.toLowerCase()));
  const allDonHang = [...donHangDLList.map(d => ({ ...d, loai: "Đại lý → Nông dân", ten: d.TenDaiLy || "—", doi: d.TenNongDan || "—" })), ...donHangSTList.map(d => ({ ...d, loai: "Siêu thị → Đại lý", ten: d.TenSieuThi || "—", doi: d.TenDaiLy || "—" }))];
  const filteredDH = allDonHang.filter(d => !searchDH || d.ten?.toLowerCase().includes(searchDH.toLowerCase()) || d.doi?.toLowerCase().includes(searchDH.toLowerCase()));

  const logs = ls<Log[]>("admin_logs", []);

  // ─── Render ──────────────────────────────────────────────────────────────────
  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#f5f7fc", fontFamily: "'Be Vietnam Pro','Segoe UI',sans-serif" }}>
      {/* Sidebar */}
      <aside style={{ width: 240, minHeight: "100vh", position: "fixed", top: 0, left: 0, zIndex: 100, background: "linear-gradient(180deg,#1a1a2e 0%,#16213e 55%,#0f3460 100%)", display: "flex", flexDirection: "column", boxShadow: "4px 0 28px rgba(0,0,0,0.18)" }}>
        <div style={{ padding: "22px 18px 18px", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 38, height: 38, background: "linear-gradient(135deg,#7c3aed,#4f46e5)", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>🛡️</div>
            <div>
              <div style={{ color: "#fff", fontWeight: 900, fontSize: 14 }}>Admin Panel</div>
              <div style={{ color: "#a78bfa", fontSize: 11, fontWeight: 500 }}>Hệ thống nông nghiệp</div>
            </div>
          </div>
        </div>
        <div style={{ padding: "12px 18px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
            <div style={{ width: 32, height: 32, borderRadius: "50%", background: "linear-gradient(135deg,#7c3aed,#4f46e5)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, flexShrink: 0 }}>🛡️</div>
            <div>
              <div style={{ color: "#f5f3ff", fontSize: 12, fontWeight: 600 }}>{authUser?.tenHienThi || "Admin"}</div>
              <div style={{ color: "#a78bfa", fontSize: 11 }}>Quản trị viên</div>
            </div>
          </div>
        </div>
        <nav style={{ flex: 1, padding: "10px 10px", overflowY: "auto" }}>
          {NAV.map(({ id, label, emoji }) => {
            const active = section === id;
            return (
              <button key={id} onClick={() => setSection(id)} style={{ width: "100%", display: "flex", alignItems: "center", gap: 9, padding: "9px 11px", background: active ? "rgba(124,58,237,0.18)" : "transparent", borderRadius: 10, border: "none", cursor: "pointer", color: active ? "#c4b5fd" : "#94a3b8", fontSize: 13, fontWeight: active ? 700 : 400, fontFamily: "inherit", marginBottom: 2, transition: "all 0.14s", borderLeft: active ? "2.5px solid #7c3aed" : "2.5px solid transparent", textAlign: "left" }}
                onMouseEnter={e => { if (!active) { e.currentTarget.style.background = "rgba(255,255,255,0.05)"; e.currentTarget.style.color = "#e2e8f0"; } }}
                onMouseLeave={e => { if (!active) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#94a3b8"; } }}>
                <span style={{ fontSize: 15 }}>{emoji}</span> {label}
              </button>
            );
          })}
        </nav>
        <div style={{ padding: "12px 10px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          <button style={{ width: "100%", display: "flex", alignItems: "center", gap: 9, padding: "9px 11px", background: "transparent", borderRadius: 10, border: "none", cursor: "pointer", color: "#f87171", fontSize: 13, fontFamily: "inherit", transition: "all 0.14s" }}
            onMouseEnter={e => { e.currentTarget.style.background = "rgba(248,113,113,0.1)"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
            onClick={() => { clearCurrentUser(); window.location.href = "/login"; }}>
            🚪 Đăng xuất
          </button>
        </div>
      </aside>

      {/* Main */}
      <main style={{ marginLeft: 240, flex: 1, padding: "28px 30px", minHeight: "100vh" }}>
        {loading && <div style={{ position: "fixed", top: 16, right: 16, background: "#1a1a2e", color: "#a78bfa", padding: "8px 18px", borderRadius: 10, fontSize: 13, zIndex: 9999 }}>⏳ Đang tải...</div>}

        {/* ── Dashboard ── */}
        {section === "dashboard" && (
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
              <h2 style={{ fontSize: 22, fontWeight: 900, color: "#1a1a2e" }}>📊 Bảng điều khiển</h2>
              <Btn variant="ghost" onClick={fetchAll}>🔄 Làm mới</Btn>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: 16, marginBottom: 26 }}>
              <Kpi emoji="🌾" value={nongDanList.length}   label="Nông dân"    accent="#0369a1" />
              <Kpi emoji="🏪" value={dailyList.length}     label="Đại lý"      accent="#b45309" />
              <Kpi emoji="🛒" value={sieuThiList.length}   label="Siêu thị"    accent="#065f46" />
              <Kpi emoji="🌿" value={trangTraiList.length} label="Trang trại"  accent="#22c55e" />
              <Kpi emoji="📦" value={loNongSanList.length} label="Lô nông sản" accent="#0ea5e9" />
              <Kpi emoji="🧾" value={donHangDLList.length + donHangSTList.length} label="Đơn hàng" accent="#f59e0b" />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <Card title="🕐 Hoạt động gần đây">
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead><tr><Th>Thời gian</Th><Th>Người</Th><Th>Hành động</Th></tr></thead>
                  <tbody>{logs.length === 0 ? <EmptyRow cols={3} /> : logs.slice(0, 8).map((l, i) => (
                    <TrHover key={i}><Td><span style={{ fontSize: 11, color: "#9ca3af" }}>{l.time}</span></Td><Td mono>{l.user}</Td><Td>{l.action}</Td></TrHover>
                  ))}</tbody>
                </table>
              </Card>
              <Card title="📊 Phân bổ hệ thống">
                {[
                  { label: "Nông dân", count: nongDanList.length, color: "#0369a1", emoji: "🌾" },
                  { label: "Đại lý",   count: dailyList.length,   color: "#b45309", emoji: "🏪" },
                  { label: "Siêu thị", count: sieuThiList.length, color: "#065f46", emoji: "🛒" },
                ].map(({ label, count, color, emoji }) => {
                  const total = nongDanList.length + dailyList.length + sieuThiList.length || 1;
                  const pct = Math.round(count / total * 100);
                  return (
                    <div key={label} style={{ marginBottom: 14 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color }}>{emoji} {label}</span>
                        <span style={{ fontSize: 12, color: "#9ca3af" }}>{count} ({pct}%)</span>
                      </div>
                      <div style={{ height: 7, background: "#f3f4f6", borderRadius: 999 }}>
                        <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 999 }} />
                      </div>
                    </div>
                  );
                })}
              </Card>
            </div>
          </div>
        )}

        {/* ── Nông dân ── */}
        {section === "nongdan" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 22 }}>
              <h2 style={{ fontSize: 22, fontWeight: 900, color: "#1a1a2e" }}>🌾 Quản lý nông dân</h2>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <SearchBar value={searchND} onChange={setSearchND} placeholder="Tìm theo tên, tài khoản..." />
                <Btn variant="blue" onClick={() => setModal("addNongDan")}>+ Thêm nông dân</Btn>
              </div>
            </div>
            <Card>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead><tr><Th>Mã</Th><Th>Họ tên</Th><Th>Tài khoản</Th><Th>Email</Th><Th>SĐT</Th><Th>Địa chỉ</Th><Th>Hành động</Th></tr></thead>
                <tbody>{filteredND.length === 0 ? <EmptyRow cols={7} /> : filteredND.map(u => (
                  <TrHover key={u.MaNongDan}>
                    <Td mono>{u.MaNongDan}</Td>
                    <Td><span style={{ fontWeight: 600 }}>{u.HoTen}</span></Td>
                    <Td><span style={{ color: "#6b7280", fontSize: 12 }}>{u.TenDangNhap}</span></Td>
                    <Td><span style={{ color: "#6b7280", fontSize: 12 }}>{u.Email || "—"}</span></Td>
                    <Td><span style={{ color: "#6b7280", fontSize: 12 }}>{u.SoDienThoai || "—"}</span></Td>
                    <Td><span style={{ color: "#6b7280", fontSize: 12 }}>{u.DiaChi || "—"}</span></Td>
                    <Td>
                      <div style={{ display: "flex", gap: 6 }}>
                        <Btn size="sm" variant="ghost" onClick={() => { setEditNd(u); setNdForm({ HoTen: u.HoTen, TenDangNhap: u.TenDangNhap, MatKhauHash: "", Email: u.Email || "", SoDienThoai: u.SoDienThoai || "", DiaChi: u.DiaChi || "" }); setModal("addNongDan"); }}>✏️ Sửa</Btn>
                        <Btn size="sm" variant="danger" onClick={() => deleteNongDan(u.MaNongDan, u.HoTen)}>🗑 Xóa</Btn>
                      </div>
                    </Td>
                  </TrHover>
                ))}</tbody>
              </table>
            </Card>
          </div>
        )}

        {/* ── Đại lý ── */}
        {section === "daily" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 22 }}>
              <h2 style={{ fontSize: 22, fontWeight: 900, color: "#1a1a2e" }}>🏪 Quản lý đại lý</h2>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <SearchBar value={searchDL} onChange={setSearchDL} placeholder="Tìm theo tên đại lý..." />
                <Btn variant="blue" onClick={() => setModal("addDaiLy")}>+ Thêm đại lý</Btn>
              </div>
            </div>
            <Card>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead><tr><Th>Mã</Th><Th>Tên đại lý</Th><Th>Email</Th><Th>SĐT</Th><Th>Địa chỉ</Th><Th>Hành động</Th></tr></thead>
                <tbody>{filteredDL.length === 0 ? <EmptyRow cols={6} /> : filteredDL.map(u => (
                  <TrHover key={u.MaDaiLy}>
                    <Td mono>{u.MaDaiLy}</Td>
                    <Td><span style={{ fontWeight: 600 }}>{u.TenDaiLy}</span></Td>
                    <Td><span style={{ color: "#6b7280", fontSize: 12 }}>{u.Email || "—"}</span></Td>
                    <Td><span style={{ color: "#6b7280", fontSize: 12 }}>{u.SoDienThoai || "—"}</span></Td>
                    <Td><span style={{ color: "#6b7280", fontSize: 12 }}>{u.DiaChi || "—"}</span></Td>
                    <Td>
                      <div style={{ display: "flex", gap: 6 }}>
                        <Btn size="sm" variant="ghost" onClick={() => { setEditDl(u); setDlForm({ TenDaiLy: u.TenDaiLy, TenDangNhap: u.TenDangNhap || "", MatKhauHash: "", Email: u.Email || "", SoDienThoai: u.SoDienThoai || "", DiaChi: u.DiaChi || "" }); setModal("addDaiLy"); }}>✏️ Sửa</Btn>
                        <Btn size="sm" variant="danger" onClick={() => deleteDaiLy(u.MaDaiLy, u.TenDaiLy)}>🗑 Xóa</Btn>
                      </div>
                    </Td>
                  </TrHover>
                ))}</tbody>
              </table>
            </Card>
          </div>
        )}

        {/* ── Siêu thị ── */}
        {section === "sieuthi" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 22 }}>
              <h2 style={{ fontSize: 22, fontWeight: 900, color: "#1a1a2e" }}>🛒 Quản lý siêu thị</h2>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <SearchBar value={searchST} onChange={setSearchST} placeholder="Tìm theo tên siêu thị..." />
                <Btn variant="blue" onClick={() => setModal("addSieuThi")}>+ Thêm siêu thị</Btn>
              </div>
            </div>
            <Card>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead><tr><Th>Mã</Th><Th>Tên siêu thị</Th><Th>Email</Th><Th>SĐT</Th><Th>Địa chỉ</Th><Th>Hành động</Th></tr></thead>
                <tbody>{filteredST.length === 0 ? <EmptyRow cols={6} /> : filteredST.map(u => (
                  <TrHover key={u.MaSieuThi}>
                    <Td mono>{u.MaSieuThi}</Td>
                    <Td><span style={{ fontWeight: 600 }}>{u.TenSieuThi}</span></Td>
                    <Td><span style={{ color: "#6b7280", fontSize: 12 }}>{u.Email || "—"}</span></Td>
                    <Td><span style={{ color: "#6b7280", fontSize: 12 }}>{u.SoDienThoai || "—"}</span></Td>
                    <Td><span style={{ color: "#6b7280", fontSize: 12 }}>{u.DiaChi || "—"}</span></Td>
                    <Td>
                      <div style={{ display: "flex", gap: 6 }}>
                        <Btn size="sm" variant="ghost" onClick={() => { setEditSt(u); setStForm({ TenSieuThi: u.TenSieuThi, TenDangNhap: u.TenDangNhap || "", MatKhauHash: "", Email: u.Email || "", SoDienThoai: u.SoDienThoai || "", DiaChi: u.DiaChi || "" }); setModal("addSieuThi"); }}>✏️ Sửa</Btn>
                        <Btn size="sm" variant="danger" onClick={() => deleteSieuThi(u.MaSieuThi, u.TenSieuThi)}>🗑 Xóa</Btn>
                      </div>
                    </Td>
                  </TrHover>
                ))}</tbody>
              </table>
            </Card>
          </div>
        )}

        {/* ── Trang trại ── */}
        {section === "trangtrai" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 22 }}>
              <h2 style={{ fontSize: 22, fontWeight: 900, color: "#1a1a2e" }}>🌿 Quản lý trang trại</h2>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <SearchBar value={searchTT} onChange={setSearchTT} placeholder="Tìm theo tên, chủ trang trại..." />
                <Btn onClick={() => setModal("addTrangTrai")}>+ Thêm trang trại</Btn>
              </div>
            </div>
            <Card>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead><tr><Th>Mã</Th><Th>Tên trang trại</Th><Th>Nông dân</Th><Th>Địa chỉ</Th><Th>Chứng nhận</Th><Th>Hành động</Th></tr></thead>
                <tbody>{filteredTT.length === 0 ? <EmptyRow cols={6} /> : filteredTT.map(t => (
                  <TrHover key={t.MaTrangTrai}>
                    <Td mono>{t.MaTrangTrai}</Td>
                    <Td><span style={{ fontWeight: 600 }}>{t.TenTrangTrai}</span></Td>
                    <Td><span style={{ color: "#0369a1", fontSize: 12 }}>{t.TenNongDan || `#${t.MaNongDan}`}</span></Td>
                    <Td><span style={{ color: "#6b7280", fontSize: 12 }}>{t.DiaChi || "—"}</span></Td>
                    <Td><span style={{ color: "#6b7280", fontSize: 12 }}>{t.SoChungNhan || "—"}</span></Td>
                    <Td>
                      <div style={{ display: "flex", gap: 6 }}>
                        <Btn size="sm" variant="ghost" onClick={() => { setEditTt(t); setTtForm({ TenTrangTrai: t.TenTrangTrai, MaNongDan: String(t.MaNongDan), DiaChi: t.DiaChi || "", SoChungNhan: t.SoChungNhan || "" }); setModal("addTrangTrai"); }}>✏️ Sửa</Btn>
                        <Btn size="sm" variant="danger" onClick={() => deleteTrangTrai(t.MaTrangTrai, t.TenTrangTrai)}>🗑 Xóa</Btn>
                      </div>
                    </Td>
                  </TrHover>
                ))}</tbody>
              </table>
            </Card>
          </div>
        )}

        {/* ── Lô nông sản ── */}
        {section === "lonongsan" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 22 }}>
              <h2 style={{ fontSize: 22, fontWeight: 900, color: "#1a1a2e" }}>📦 Lô nông sản</h2>
              <SearchBar value={searchLo} onChange={setSearchLo} placeholder="Tìm theo sản phẩm, trang trại..." />
            </div>
            <Card>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead><tr><Th>Mã lô</Th><Th>Sản phẩm</Th><Th>Trang trại</Th><Th>SL ban đầu</Th><Th>SL hiện tại</Th><Th>Thu hoạch</Th><Th>Hạn SD</Th><Th>Trạng thái</Th></tr></thead>
                <tbody>{filteredLo.length === 0 ? <EmptyRow cols={8} /> : filteredLo.map(l => (
                  <TrHover key={l.MaLo}>
                    <Td mono>{l.MaLo}</Td>
                    <Td><span style={{ fontWeight: 600 }}>{l.TenSanPham || "—"}</span></Td>
                    <Td><span style={{ color: "#0369a1", fontSize: 12 }}>{l.TenTrangTrai || "—"}</span></Td>
                    <Td><span style={{ background: "#f0fdf4", color: "#16a34a", padding: "3px 10px", borderRadius: 999, fontWeight: 700, fontSize: 12 }}>{l.SoLuongBanDau}</span></Td>
                    <Td><span style={{ background: "#eff6ff", color: "#1d4ed8", padding: "3px 10px", borderRadius: 999, fontWeight: 700, fontSize: 12 }}>{l.SoLuongHienTai}</span></Td>
                    <Td><span style={{ color: "#6b7280", fontSize: 12 }}>{l.NgayThuHoach ? new Date(l.NgayThuHoach).toLocaleDateString("vi-VN") : "—"}</span></Td>
                    <Td><span style={{ color: "#6b7280", fontSize: 12 }}>{l.HanSuDung ? new Date(l.HanSuDung).toLocaleDateString("vi-VN") : "—"}</span></Td>
                    <Td><StatusBadge status={l.TrangThai} /></Td>
                  </TrHover>
                ))}</tbody>
              </table>
            </Card>
          </div>
        )}

        {/* ── Đơn hàng ── */}
        {section === "donhang" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 22 }}>
              <h2 style={{ fontSize: 22, fontWeight: 900, color: "#1a1a2e" }}>🧾 Tất cả đơn hàng</h2>
              <SearchBar value={searchDH} onChange={setSearchDH} placeholder="Tìm theo tên người đặt..." />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
              <Kpi emoji="🏪→🌾" value={donHangDLList.length} label="Đơn Đại lý → Nông dân" accent="#b45309" />
              <Kpi emoji="🛒→🏪" value={donHangSTList.length} label="Đơn Siêu thị → Đại lý" accent="#065f46" />
            </div>
            <Card>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead><tr><Th>Mã đơn</Th><Th>Loại</Th><Th>Người đặt</Th><Th>Đối tác</Th><Th>Trạng thái</Th><Th>Ngày tạo</Th><Th>Ghi chú</Th></tr></thead>
                <tbody>{filteredDH.length === 0 ? <EmptyRow cols={7} /> : filteredDH.map((d, i) => (
                  <TrHover key={i}>
                    <Td mono>{d.MaDonHang}</Td>
                    <Td><span style={{ fontSize: 11, background: "#f3f4f6", padding: "3px 8px", borderRadius: 6, color: "#374151" }}>{d.loai}</span></Td>
                    <Td><span style={{ fontWeight: 600 }}>{d.ten}</span></Td>
                    <Td><span style={{ color: "#6b7280" }}>{d.doi}</span></Td>
                    <Td><StatusBadge status={d.TrangThai} /></Td>
                    <Td><span style={{ color: "#9ca3af", fontSize: 12 }}>{d.NgayTao ? new Date(d.NgayTao).toLocaleDateString("vi-VN") : "—"}</span></Td>
                    <Td><span style={{ color: "#6b7280", fontSize: 12 }}>{d.GhiChu || "—"}</span></Td>
                  </TrHover>
                ))}</tbody>
              </table>
            </Card>
          </div>
        )}

        {/* ── Hồ sơ ── */}
        {section === "profile" && (
          <div style={{ maxWidth: 560 }}>
            <h2 style={{ fontSize: 22, fontWeight: 900, color: "#1a1a2e", marginBottom: 22 }}>👤 Hồ sơ Admin</h2>
            <Card>
              <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 24, padding: "16px 0", borderBottom: "1px solid #f3f4f6" }}>
                <div style={{ width: 56, height: 56, borderRadius: "50%", background: "linear-gradient(135deg,#7c3aed,#4f46e5)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26 }}>🛡️</div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: 17, color: "#1a1a2e" }}>{authUser?.tenHienThi}</div>
                  <RoleBadge role="admin" />
                </div>
              </div>
              <Field label="Họ tên *"><Inp value={profileForm.hoTen} onChange={e => setProfileForm({ ...profileForm, hoTen: e.target.value })} /></Field>
              <Field label="Số điện thoại"><Inp value={profileForm.soDienThoai} onChange={e => setProfileForm({ ...profileForm, soDienThoai: e.target.value })} /></Field>
              <Field label="Email"><Inp type="email" value={profileForm.email} onChange={e => setProfileForm({ ...profileForm, email: e.target.value })} /></Field>
              <Field label="Địa chỉ"><Inp value={profileForm.diaChi} onChange={e => setProfileForm({ ...profileForm, diaChi: e.target.value })} /></Field>
              <div style={{ marginTop: 20 }}>
                <Btn variant="purple" onClick={saveProfile} disabled={profileSaving}>{profileSaving ? "⏳ Đang lưu..." : "💾 Lưu thay đổi"}</Btn>
              </div>
            </Card>
          </div>
        )}

        {/* ── Logs ── */}
        {section === "logs" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 22 }}>
              <h2 style={{ fontSize: 22, fontWeight: 900, color: "#1a1a2e" }}>🔍 Audit / Log</h2>
              <Btn variant="danger" size="sm" onClick={() => { if (window.confirm("Xóa toàn bộ log?")) { lsSave("admin_logs", []); showToast("Đã xóa log"); } }}>🗑 Xóa log</Btn>
            </div>
            <Card>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead><tr><Th>Thời gian</Th><Th>Người</Th><Th>Hành động</Th></tr></thead>
                <tbody>{logs.length === 0 ? <EmptyRow cols={3} /> : [...logs].slice(0, 100).map((l, i) => (
                  <TrHover key={i}><Td><span style={{ fontSize: 11, color: "#9ca3af", whiteSpace: "nowrap" }}>{l.time}</span></Td><Td mono>{l.user}</Td><Td>{l.action}</Td></TrHover>
                ))}</tbody>
              </table>
            </Card>
          </div>
        )}
      </main>

      {/* ── Modal: Nông dân ── */}
      <Modal open={modal === "addNongDan"} onClose={closeModal} title={editNd ? "✏️ Sửa nông dân" : "🌾 Thêm nông dân mới"}>
        <Field label="Họ tên *"><Inp placeholder="Nguyễn Văn A" value={ndForm.HoTen} onChange={e => setNdForm({ ...ndForm, HoTen: e.target.value })} /></Field>
        {!editNd && <>
          <Field label="Tên đăng nhập *"><Inp placeholder="username" value={ndForm.TenDangNhap} onChange={e => setNdForm({ ...ndForm, TenDangNhap: e.target.value })} /></Field>
          <Field label="Mật khẩu *"><Inp type="password" placeholder="••••••••" value={ndForm.MatKhauHash} onChange={e => setNdForm({ ...ndForm, MatKhauHash: e.target.value })} /></Field>
        </>}
        <Field label="Email"><Inp type="email" placeholder="email@example.com" value={ndForm.Email} onChange={e => setNdForm({ ...ndForm, Email: e.target.value })} /></Field>
        <Field label="Số điện thoại"><Inp placeholder="0901234567" value={ndForm.SoDienThoai} onChange={e => setNdForm({ ...ndForm, SoDienThoai: e.target.value })} /></Field>
        <Field label="Địa chỉ"><Inp placeholder="Tỉnh / Thành phố..." value={ndForm.DiaChi} onChange={e => setNdForm({ ...ndForm, DiaChi: e.target.value })} /></Field>
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 20 }}>
          <Btn variant="outline" onClick={closeModal}>Hủy</Btn>
          <Btn variant="blue" onClick={saveNongDan}>{editNd ? "💾 Lưu" : "+ Thêm"}</Btn>
        </div>
      </Modal>

      {/* ── Modal: Đại lý ── */}
      <Modal open={modal === "addDaiLy"} onClose={closeModal} title={editDl ? "✏️ Sửa đại lý" : "🏪 Thêm đại lý mới"}>
        <Field label="Tên đại lý *"><Inp placeholder="Công ty TNHH..." value={dlForm.TenDaiLy} onChange={e => setDlForm({ ...dlForm, TenDaiLy: e.target.value })} /></Field>
        {!editDl && <>
          <Field label="Tên đăng nhập *"><Inp placeholder="username" value={dlForm.TenDangNhap} onChange={e => setDlForm({ ...dlForm, TenDangNhap: e.target.value })} /></Field>
          <Field label="Mật khẩu *"><Inp type="password" placeholder="••••••••" value={dlForm.MatKhauHash} onChange={e => setDlForm({ ...dlForm, MatKhauHash: e.target.value })} /></Field>
        </>}
        <Field label="Email"><Inp type="email" placeholder="email@example.com" value={dlForm.Email} onChange={e => setDlForm({ ...dlForm, Email: e.target.value })} /></Field>
        <Field label="Số điện thoại"><Inp placeholder="0901234567" value={dlForm.SoDienThoai} onChange={e => setDlForm({ ...dlForm, SoDienThoai: e.target.value })} /></Field>
        <Field label="Địa chỉ"><Inp placeholder="Tỉnh / Thành phố..." value={dlForm.DiaChi} onChange={e => setDlForm({ ...dlForm, DiaChi: e.target.value })} /></Field>
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 20 }}>
          <Btn variant="outline" onClick={closeModal}>Hủy</Btn>
          <Btn variant="blue" onClick={saveDaiLy}>{editDl ? "💾 Lưu" : "+ Thêm"}</Btn>
        </div>
      </Modal>

      {/* ── Modal: Siêu thị ── */}
      <Modal open={modal === "addSieuThi"} onClose={closeModal} title={editSt ? "✏️ Sửa siêu thị" : "🛒 Thêm siêu thị mới"}>
        <Field label="Tên siêu thị *"><Inp placeholder="Siêu thị ABC..." value={stForm.TenSieuThi} onChange={e => setStForm({ ...stForm, TenSieuThi: e.target.value })} /></Field>
        {!editSt && <>
          <Field label="Tên đăng nhập *"><Inp placeholder="username" value={stForm.TenDangNhap} onChange={e => setStForm({ ...stForm, TenDangNhap: e.target.value })} /></Field>
          <Field label="Mật khẩu *"><Inp type="password" placeholder="••••••••" value={stForm.MatKhauHash} onChange={e => setStForm({ ...stForm, MatKhauHash: e.target.value })} /></Field>
        </>}
        <Field label="Email"><Inp type="email" placeholder="email@example.com" value={stForm.Email} onChange={e => setStForm({ ...stForm, Email: e.target.value })} /></Field>
        <Field label="Số điện thoại"><Inp placeholder="0901234567" value={stForm.SoDienThoai} onChange={e => setStForm({ ...stForm, SoDienThoai: e.target.value })} /></Field>
        <Field label="Địa chỉ"><Inp placeholder="Tỉnh / Thành phố..." value={stForm.DiaChi} onChange={e => setStForm({ ...stForm, DiaChi: e.target.value })} /></Field>
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 20 }}>
          <Btn variant="outline" onClick={closeModal}>Hủy</Btn>
          <Btn variant="blue" onClick={saveSieuThi}>{editSt ? "💾 Lưu" : "+ Thêm"}</Btn>
        </div>
      </Modal>

      {/* ── Modal: Trang trại ── */}
      <Modal open={modal === "addTrangTrai"} onClose={closeModal} title={editTt ? "✏️ Sửa trang trại" : "🌿 Thêm trang trại mới"}>
        <Field label="Tên trang trại *"><Inp placeholder="Trang trại Xanh..." value={ttForm.TenTrangTrai} onChange={e => setTtForm({ ...ttForm, TenTrangTrai: e.target.value })} /></Field>
        {!editTt && (
          <Field label="Nông dân *">
            <Sel value={ttForm.MaNongDan} onChange={e => setTtForm({ ...ttForm, MaNongDan: e.target.value })}>
              <option value="">-- Chọn nông dân --</option>
              {nongDanList.map(nd => <option key={nd.MaNongDan} value={nd.MaNongDan}>{nd.HoTen} (#{nd.MaNongDan})</option>)}
            </Sel>
          </Field>
        )}
        <Field label="Địa chỉ"><Inp placeholder="Tỉnh / Thành phố..." value={ttForm.DiaChi} onChange={e => setTtForm({ ...ttForm, DiaChi: e.target.value })} /></Field>
        <Field label="Số chứng nhận"><Inp placeholder="VN-CERT-..." value={ttForm.SoChungNhan} onChange={e => setTtForm({ ...ttForm, SoChungNhan: e.target.value })} /></Field>
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 20 }}>
          <Btn variant="outline" onClick={closeModal}>Hủy</Btn>
          <Btn onClick={saveTrangTrai}>{editTt ? "💾 Lưu" : "+ Thêm"}</Btn>
        </div>
      </Modal>

      {toast && <Toast msg={toast.msg} type={toast.type} />}
    </div>
  );
}
