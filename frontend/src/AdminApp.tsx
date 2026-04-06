import { useState, useEffect, useCallback } from "react";
import { getCurrentUser, clearCurrentUser } from "./AuthHelper.ts";

// ─── Types ────────────────────────────────────────────────────────────────────
interface User { id: string; hoTen: string; role: string; email: string; }
interface Farm { id: string; ten: string; chu: string; diachi: string; }
interface Batch { ma?: string; maLo?: string; sanPham: string; soLuong: number | string; ngay?: string; ngayTao?: string; }
interface Order { ma?: string; uid?: string; maPhieu?: string; nguoi?: string; daily?: string; soLuong: number | string; trangThai?: string; status?: string; sanPham?: string; }
interface Log { time: string; user: string; action: string; }
interface DB { users: User[]; farms: Farm[]; batches: Batch[]; orders: Order[]; logs: Log[]; }

// ─── Storage ──────────────────────────────────────────────────────────────────
const ls = <T,>(k: string, fb: T): T => { try { return JSON.parse(localStorage.getItem(k) || "null") ?? fb; } catch { return fb; } };
const lsSave = (k: string, v: unknown) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* empty */ } };

function loadDB(): DB {
  const nd = ls<User[]>("users", []);
  const dl = ls<User[]>("dailyAgencies", []);
  const st = ls<User[]>("sieuthiAgencies", []);
  const adminUsers = ls<User[]>("admin_users", []);
  const seen = new Set<string>();
  const users = ([...adminUsers, ...nd, ...dl, ...st] as unknown as Record<string, unknown>[])
    .map(u => ({ id: String(u.id || u.maDaiLy || u.maNong || ""), hoTen: String(u.hoTen || u.fullName || u.tenDaiLy || u.tenNong || u.username || ""), role: String(u.role || u.loai || ""), email: String(u.email || "") }))
    .filter(u => { if (seen.has(u.id)) return false; seen.add(u.id); return true; });
  return {
    users,
    farms:   ls<Farm[]>("admin_farms", []),
    batches: [...ls<Batch[]>("lohang", []), ...ls<Batch[]>("admin_batches", [])],
    orders:  [...ls<Order[]>("market_orders", []), ...ls<Order[]>("retail_orders", []), ...ls<Order[]>("admin_orders", [])],
    logs:    ls<Log[]>("admin_logs", []),
  };
}

const SEED: DB = {
  users: [
    { id: "admin1", hoTen: "Quản trị viên", role: "admin",   email: "admin@nongnghiep.vn" },
    { id: "nd1",    hoTen: "Nguyễn Văn An", role: "nongdan", email: "nd1@example.com" },
    { id: "dl1",    hoTen: "Trần Đại Lý",   role: "daily",   email: "dl1@example.com" },
    { id: "st1",    hoTen: "Lê Siêu Thị",   role: "sieuthi", email: "st1@example.com" },
  ],
  farms: [
    { id: "F1", ten: "Trang trại Xanh A",    chu: "Nguyễn Văn An", diachi: "Hà Nội" },
    { id: "F2", ten: "Trang trại Phú Quý",   chu: "Phạm Thị Bình", diachi: "Hải Phòng" },
  ],
  batches: [
    { ma: "L001", sanPham: "Lúa gạo ST25",      soLuong: 1000, ngay: "2025-10-01" },
    { ma: "L002", sanPham: "Khoai tây Đà Lạt",  soLuong: 500,  ngay: "2025-10-05" },
  ],
  orders: [
    { ma: "O001", nguoi: "Khách hàng A", daily: "DL1", soLuong: 100, trangThai: "Đã giao" },
    { ma: "O002", nguoi: "Siêu thị Xanh", daily: "DL1", soLuong: 250, trangThai: "Đang giao" },
  ],
  logs: [{ time: new Date().toLocaleString("vi-VN"), user: "admin1", action: "Seed data khởi tạo" }],
};

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
  { id: "dashboard", label: "Bảng điều khiển", emoji: "📊" },
  { id: "users",     label: "Người dùng",       emoji: "👥" },
  { id: "farms",     label: "Trang trại",        emoji: "🌿" },
  { id: "batches",   label: "Lô hàng",           emoji: "📦" },
  { id: "orders",    label: "Đơn hàng",          emoji: "🧾" },
  { id: "logs",      label: "Audit / Log",        emoji: "🔍" },
  { id: "reports",   label: "Báo cáo",           emoji: "📈" },
];

// ─── Atoms ────────────────────────────────────────────────────────────────────
const RoleBadge = ({ role }: { role: string }) => {
  const m = roleMeta(role);
  return <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 10px", borderRadius: 999, fontSize: 11, fontWeight: 700, color: m.color, background: m.bg }}>{m.emoji} {m.label}</span>;
};
const StatusBadge = ({ status }: { status?: string }) => {
  const s = (status || "").toLowerCase();
  const map: Record<string, [string, string]> = { "đã giao": ["#065f46","#d1fae5"], delivered: ["#065f46","#d1fae5"], received: ["#065f46","#d1fae5"], "đang giao": ["#92400e","#fef3c7"], shipped: ["#92400e","#fef3c7"], pending: ["#1e40af","#dbeafe"], "chờ xử lý": ["#1e40af","#dbeafe"] };
  const [color, bg] = map[s] || ["#374151","#f3f4f6"];
  return <span style={{ padding: "3px 10px", borderRadius: 999, fontSize: 11, fontWeight: 700, color, background: bg }}>{status || "—"}</span>;
};
const Kpi = ({ emoji, value, label, accent }: { emoji: string; value: number; label: string; accent: string }) => (
  <div style={{ background: "#fff", borderRadius: 16, padding: "22px 20px", boxShadow: "0 2px 16px rgba(0,0,0,0.07)", borderTop: `3px solid ${accent}`, position: "relative", overflow: "hidden" }}>
    <div style={{ fontSize: 26, marginBottom: 4 }}>{emoji}</div>
    <div style={{ fontSize: 36, fontWeight: 900, color: "#1a1a2e", lineHeight: 1 }}>{value}</div>
    <div style={{ fontSize: 13, color: "#6b7280", marginTop: 6, fontWeight: 500 }}>{label}</div>
    <div style={{ position: "absolute", right: -16, top: -16, width: 90, height: 90, borderRadius: "50%", background: `${accent}18` }} />
  </div>
);
const Card = ({ title, children, action }: { title?: string; children: React.ReactNode; action?: React.ReactNode }) => (
  <div style={{ background: "#fff", borderRadius: 14, padding: "20px 22px", boxShadow: "0 2px 16px rgba(0,0,0,0.06)" }}>
    {title && <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}><h4 style={{ fontSize: 15, fontWeight: 700, color: "#111827" }}>{title}</h4>{action}</div>}
    {children}
  </div>
);
const Th = ({ children }: { children: React.ReactNode }) => (
  <th style={{ padding: "9px 12px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.7px", borderBottom: "2px solid #f3f4f6", whiteSpace: "nowrap" }}>{children}</th>
);
const Td = ({ children, mono }: { children?: React.ReactNode; mono?: boolean }) => (
  <td style={{ padding: "11px 12px", borderBottom: "1px solid #f9fafb", color: mono ? "#6366f1" : "#374151", fontSize: 13, fontFamily: mono ? "monospace" : "inherit", fontWeight: mono ? 700 : 400, verticalAlign: "middle" }}>{children ?? "—"}</td>
);
const TrHover = ({ children }: { children: React.ReactNode }) => {
  const [h, setH] = useState(false);
  return <tr onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)} style={{ background: h ? "#f8faff" : "transparent", transition: "background 0.12s" }}>{children}</tr>;
};
const EmptyRow = ({ cols }: { cols: number }) => (
  <tr><td colSpan={cols} style={{ padding: "40px 0", textAlign: "center", color: "#9ca3af", fontSize: 14 }}><div style={{ fontSize: 32, marginBottom: 8 }}>📭</div>Chưa có dữ liệu</td></tr>
);
const Btn = ({ children, variant = "primary", size = "md", onClick }: { children: React.ReactNode; variant?: "primary"|"danger"|"ghost"|"outline"|"purple"; size?: "sm"|"md"; onClick?: () => void }) => {
  const vars: Record<string, React.CSSProperties> = {
    primary: { background: "linear-gradient(135deg,#22c55e,#16a34a)", color: "#fff" },
    danger:  { background: "#fef2f2", color: "#dc2626" },
    ghost:   { background: "#f3f4f6", color: "#374151" },
    outline: { background: "transparent", color: "#6b7280", border: "1.5px solid #e5e7eb" },
    purple:  { background: "linear-gradient(135deg,#7c3aed,#5b21b6)", color: "#fff" },
  };
  return (
    <button onClick={onClick} style={{ display: "inline-flex", alignItems: "center", gap: 6, border: "none", borderRadius: size === "sm" ? 6 : 8, cursor: "pointer", fontWeight: 600, fontSize: size === "sm" ? 12 : 14, fontFamily: "inherit", padding: size === "sm" ? "5px 10px" : "9px 18px", transition: "all 0.15s", ...vars[variant] }}
      onMouseEnter={e => { e.currentTarget.style.filter = "brightness(1.07)"; e.currentTarget.style.transform = "translateY(-1px)"; }}
      onMouseLeave={e => { e.currentTarget.style.filter = ""; e.currentTarget.style.transform = ""; }}>
      {children}
    </button>
  );
};
const Modal = ({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode }) => {
  useEffect(() => {
    const h = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    if (open) document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div onClick={e => e.target === e.currentTarget && onClose()} style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.55)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9000, backdropFilter: "blur(3px)" }}>
      <div style={{ background: "#fff", borderRadius: 18, padding: "28px 32px", width: "min(480px,94vw)", maxHeight: "88vh", overflowY: "auto", boxShadow: "0 32px 80px rgba(0,0,0,0.22)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 22 }}>
          <h3 style={{ fontSize: 17, fontWeight: 800, color: "#1a1a2e" }}>{title}</h3>
          <button onClick={onClose} style={{ background: "#f3f4f6", border: "none", borderRadius: 8, width: 30, height: 30, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: 16, color: "#6b7280" }}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
};
const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div style={{ marginBottom: 14 }}>
    <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 5 }}>{label}</label>
    {children}
  </div>
);
const IS: React.CSSProperties = { width: "100%", padding: "9px 12px", border: "1.5px solid #e5e7eb", borderRadius: 8, fontSize: 13, fontFamily: "inherit", outline: "none", background: "#fafafa" };
const Inp = (p: React.InputHTMLAttributes<HTMLInputElement>) => (
  <input {...p} style={IS}
    onFocus={e => { e.currentTarget.style.borderColor = "#6366f1"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(99,102,241,0.1)"; e.currentTarget.style.background = "#fff"; }}
    onBlur={e => { e.currentTarget.style.borderColor = "#e5e7eb"; e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.background = "#fafafa"; }} />
);
const Sel = (p: React.SelectHTMLAttributes<HTMLSelectElement> & { children: React.ReactNode }) => (
  <select {...p} style={IS}
    onFocus={e => { e.currentTarget.style.borderColor = "#6366f1"; }}
    onBlur={e => { e.currentTarget.style.borderColor = "#e5e7eb"; }} />
);

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function AdminApp() {
  const [section, setSection] = useState("dashboard");
  const [db, setDb] = useState<DB>({ users: [], farms: [], batches: [], orders: [], logs: [] });
  const [modal, setModal] = useState<null | "addUser" | "addFarm">(null);
  const [userForm, setUserForm] = useState({ hoTen: "", role: "nongdan", email: "" });
  const [farmForm, setFarmForm] = useState({ ten: "", chu: "", diachi: "" });

  const authUser = getCurrentUser();
  useEffect(() => {
    if (!authUser || authUser.role !== "admin") {
      window.location.href = "/login";
    }
  }, []);

  const refresh = useCallback(() => setDb(loadDB()), []);
  useEffect(() => { refresh(); }, [refresh]);

  const addLog = (action: string) => {
    const logs = [{ time: new Date().toLocaleString("vi-VN"), user: "Admin", action }, ...ls<Log[]>("admin_logs", [])].slice(0, 100);
    lsSave("admin_logs", logs);
  };
  const addUser = () => {
    if (!userForm.hoTen) return;
    const u: User = { id: "user_" + Date.now(), ...userForm };
    lsSave("admin_users", [...ls<User[]>("admin_users", []), u]);
    addLog(`Thêm người dùng: ${u.hoTen} (${u.role})`);
    refresh(); setModal(null); setUserForm({ hoTen: "", role: "nongdan", email: "" });
  };
  const addFarm = () => {
    if (!farmForm.ten) return;
    const f: Farm = { id: "F" + Date.now(), ...farmForm };
    lsSave("admin_farms", [...ls<Farm[]>("admin_farms", []), f]);
    addLog(`Thêm trang trại: ${f.ten}`);
    refresh(); setModal(null); setFarmForm({ ten: "", chu: "", diachi: "" });
  };
  const deleteUser = (id: string) => {
    if (!window.confirm("Xóa người dùng này?")) return;
    lsSave("admin_users", ls<User[]>("admin_users", []).filter(u => u.id !== id));
    addLog(`Xóa người dùng: ${id}`); refresh();
  };
  const deleteFarm = (id: string) => {
    if (!window.confirm("Xóa trang trại này?")) return;
    lsSave("admin_farms", ls<Farm[]>("admin_farms", []).filter(f => f.id !== id));
    addLog(`Xóa trang trại: ${id}`); refresh();
  };
  const seed = () => {
    lsSave("admin_users", SEED.users); lsSave("admin_farms", SEED.farms);
    lsSave("admin_batches", SEED.batches); lsSave("admin_orders", SEED.orders);
    lsSave("admin_logs", SEED.logs); addLog("Seed demo data"); refresh();
  };

  const roleCounts = db.users.reduce<Record<string, number>>((acc, u) => { const k = u.role || "other"; acc[k] = (acc[k] || 0) + 1; return acc; }, {});
  const totalStock = db.batches.reduce((s, b) => s + (Number(b.soLuong) || 0), 0);

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#f5f7fc", fontFamily: "'Be Vietnam Pro','Segoe UI',sans-serif" }}>
      {/* Sidebar */}
      <aside style={{ width: 240, minHeight: "100vh", position: "fixed", top: 0, left: 0, zIndex: 100, background: "linear-gradient(180deg,#1a1a2e 0%,#16213e 55%,#0f3460 100%)", display: "flex", flexDirection: "column", boxShadow: "4px 0 28px rgba(0,0,0,0.18)" }}>
        <div style={{ padding: "22px 18px 18px", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 38, height: 38, background: "linear-gradient(135deg,#7c3aed,#4f46e5)", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>🛡️</div>
            <div>
              <div style={{ color: "#fff", fontWeight: 900, fontSize: 14, letterSpacing: "-0.2px" }}>Admin Panel</div>
              <div style={{ color: "#a78bfa", fontSize: 11, fontWeight: 500 }}>Hệ thống nông nghiệp</div>
            </div>
          </div>
        </div>
        <div style={{ padding: "12px 18px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
            <div style={{ width: 32, height: 32, borderRadius: "50%", background: "linear-gradient(135deg,#7c3aed,#4f46e5)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, flexShrink: 0 }}>🛡️</div>
            <div>
              <div style={{ color: "#f5f3ff", fontSize: 12, fontWeight: 600 }}>Admin Hệ thống</div>
              <div style={{ color: "#a78bfa", fontSize: 11 }}>Quản trị viên</div>
            </div>
          </div>
        </div>
        <nav style={{ flex: 1, padding: "10px 10px" }}>
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
      <main style={{ marginLeft: 240, flex: 1, padding: "28px 30px" }}>
        {/* Dashboard */}
        {section === "dashboard" && (
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
              <h2 style={{ fontSize: 22, fontWeight: 900, color: "#1a1a2e" }}>📊 Bảng điều khiển</h2>
              <div style={{ display: "flex", gap: 8 }}>
                <Btn variant="ghost" onClick={seed}>🌱 Seed demo</Btn>
                <Btn variant="purple" onClick={() => setSection("reports")}>📈 Báo cáo</Btn>
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(175px,1fr))", gap: 16, marginBottom: 26 }}>
              <Kpi emoji="👥" value={db.users.length}   label="Người dùng" accent="#7c3aed" />
              <Kpi emoji="🌿" value={db.farms.length}   label="Trang trại"  accent="#22c55e" />
              <Kpi emoji="📦" value={db.batches.length} label="Lô hàng"     accent="#0ea5e9" />
              <Kpi emoji="🧾" value={db.orders.length}  label="Đơn hàng"    accent="#f59e0b" />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <Card title="🕐 Hoạt động gần đây">
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead><tr><Th>Thời gian</Th><Th>Người</Th><Th>Hành động</Th></tr></thead>
                  <tbody>{db.logs.length === 0 ? <EmptyRow cols={3} /> : db.logs.slice(0, 8).map((l, i) => (
                    <TrHover key={i}><Td><span style={{ fontSize: 11, color: "#9ca3af" }}>{l.time}</span></Td><Td mono>{l.user}</Td><Td>{l.action}</Td></TrHover>
                  ))}</tbody>
                </table>
              </Card>
              <Card title="⚙️ Thông tin hệ thống">
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {[["Phiên bản", "v2.0.0"], ["Môi trường", "Production"], ["Tổng tồn kho", `${totalStock} sản phẩm`]].map(([k, v]) => (
                    <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "10px 14px", background: "#f8faff", borderRadius: 10 }}>
                      <span style={{ color: "#6b7280", fontSize: 13 }}>{k}</span>
                      <span style={{ fontWeight: 700, color: "#1a1a2e", fontSize: 13 }}>{v}</span>
                    </div>
                  ))}
                  <div style={{ marginTop: 4 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#6b7280", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.5px" }}>Phân bổ vai trò</div>
                    {Object.entries(roleCounts).map(([role, count]) => {
                      const m = roleMeta(role);
                      const pct = db.users.length ? Math.round(count / db.users.length * 100) : 0;
                      return (
                        <div key={role} style={{ marginBottom: 8 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                            <span style={{ fontSize: 12, color: m.color, fontWeight: 600 }}>{m.emoji} {m.label}</span>
                            <span style={{ fontSize: 12, color: "#9ca3af" }}>{count} ({pct}%)</span>
                          </div>
                          <div style={{ height: 5, background: "#f0f0f0", borderRadius: 999 }}>
                            <div style={{ height: "100%", width: `${pct}%`, background: m.color, borderRadius: 999 }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </Card>
            </div>
          </div>
        )}

        {/* Users */}
        {section === "users" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 22 }}>
              <h2 style={{ fontSize: 22, fontWeight: 900, color: "#1a1a2e" }}>👥 Quản lý người dùng</h2>
              <Btn variant="purple" onClick={() => setModal("addUser")}>+ Thêm người dùng</Btn>
            </div>
            <Card>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead><tr><Th>ID</Th><Th>Họ tên</Th><Th>Vai trò</Th><Th>Email</Th><Th>Hành động</Th></tr></thead>
                <tbody>{db.users.length === 0 ? <EmptyRow cols={5} /> : db.users.map(u => (
                  <TrHover key={u.id}><Td mono>{u.id}</Td><Td><span style={{ fontWeight: 600 }}>{u.hoTen || "—"}</span></Td><Td><RoleBadge role={u.role} /></Td><Td><span style={{ color: "#6b7280", fontSize: 12 }}>{u.email || "—"}</span></Td><Td><Btn size="sm" variant="danger" onClick={() => deleteUser(u.id)}>🗑 Xóa</Btn></Td></TrHover>
                ))}</tbody>
              </table>
            </Card>
          </div>
        )}

        {/* Farms */}
        {section === "farms" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 22 }}>
              <h2 style={{ fontSize: 22, fontWeight: 900, color: "#1a1a2e" }}>🌿 Quản lý trang trại</h2>
              <Btn onClick={() => setModal("addFarm")}>+ Thêm trang trại</Btn>
            </div>
            <Card>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead><tr><Th>Mã</Th><Th>Tên trang trại</Th><Th>Chủ</Th><Th>Địa chỉ</Th><Th>Hành động</Th></tr></thead>
                <tbody>{db.farms.length === 0 ? <EmptyRow cols={5} /> : db.farms.map(f => (
                  <TrHover key={f.id}><Td mono>{f.id}</Td><Td><span style={{ fontWeight: 600 }}>{f.ten}</span></Td><Td>{f.chu}</Td><Td><span style={{ color: "#6b7280", fontSize: 12 }}>{f.diachi || "—"}</span></Td><Td><Btn size="sm" variant="danger" onClick={() => deleteFarm(f.id)}>🗑 Xóa</Btn></Td></TrHover>
                ))}</tbody>
              </table>
            </Card>
          </div>
        )}

        {/* Batches */}
        {section === "batches" && (
          <div>
            <h2 style={{ fontSize: 22, fontWeight: 900, color: "#1a1a2e", marginBottom: 22 }}>📦 Quản lý lô hàng</h2>
            <Card>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead><tr><Th>Mã lô</Th><Th>Sản phẩm</Th><Th>Số lượng</Th><Th>Ngày nhập</Th></tr></thead>
                <tbody>{db.batches.length === 0 ? <EmptyRow cols={4} /> : db.batches.map((b, i) => (
                  <TrHover key={i}><Td mono>{b.ma || b.maLo || "—"}</Td><Td><span style={{ fontWeight: 600 }}>{b.sanPham}</span></Td>
                  <Td><span style={{ background: "#f0fdf4", color: "#16a34a", padding: "3px 10px", borderRadius: 999, fontWeight: 700, fontSize: 13 }}>{b.soLuong}</span></Td>
                  <Td><span style={{ color: "#9ca3af", fontSize: 12 }}>{b.ngay || b.ngayTao || "—"}</span></Td></TrHover>
                ))}</tbody>
              </table>
            </Card>
          </div>
        )}

        {/* Orders */}
        {section === "orders" && (
          <div>
            <h2 style={{ fontSize: 22, fontWeight: 900, color: "#1a1a2e", marginBottom: 22 }}>🧾 Quản lý đơn hàng</h2>
            <Card>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead><tr><Th>Mã</Th><Th>Người đặt</Th><Th>Đại lý</Th><Th>Sản phẩm</Th><Th>Số lượng</Th><Th>Trạng thái</Th></tr></thead>
                <tbody>{db.orders.length === 0 ? <EmptyRow cols={6} /> : db.orders.map((o, i) => (
                  <TrHover key={i}><Td mono>{o.ma || o.maPhieu || o.uid || "—"}</Td><Td>{o.nguoi || "—"}</Td><Td>{o.daily || "—"}</Td>
                  <Td><span style={{ fontWeight: 600 }}>{o.sanPham || "—"}</span></Td><Td>{o.soLuong}</Td>
                  <Td><StatusBadge status={o.trangThai || o.status} /></Td></TrHover>
                ))}</tbody>
              </table>
            </Card>
          </div>
        )}

        {/* Logs */}
        {section === "logs" && (
          <div>
            <h2 style={{ fontSize: 22, fontWeight: 900, color: "#1a1a2e", marginBottom: 22 }}>🔍 Audit / Log</h2>
            <Card>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead><tr><Th>Thời gian</Th><Th>Người</Th><Th>Hành động</Th></tr></thead>
                <tbody>{db.logs.length === 0 ? <EmptyRow cols={3} /> : [...db.logs].reverse().slice(0, 50).map((l, i) => (
                  <TrHover key={i}><Td><span style={{ fontSize: 11, color: "#9ca3af", whiteSpace: "nowrap" }}>{l.time}</span></Td><Td mono>{l.user}</Td><Td>{l.action}</Td></TrHover>
                ))}</tbody>
              </table>
            </Card>
          </div>
        )}

        {/* Reports */}
        {section === "reports" && (
          <div>
            <h2 style={{ fontSize: 22, fontWeight: 900, color: "#1a1a2e", marginBottom: 22 }}>📈 Báo cáo tổng hợp</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 16, marginBottom: 22 }}>
              {[{ label: "Tổng đơn hàng", value: `${db.orders.length} đơn`, emoji: "🧾", color: "#f59e0b" }, { label: "Tổng tồn kho", value: `${totalStock} SP`, emoji: "📦", color: "#0ea5e9" }, { label: "Tổng lô hàng", value: `${db.batches.length} lô`, emoji: "📋", color: "#22c55e" }, { label: "Tổng người dùng", value: `${db.users.length} người`, emoji: "👥", color: "#7c3aed" }].map(r => (
                <div key={r.label} style={{ background: "#fff", borderRadius: 14, padding: "22px 20px", boxShadow: "0 2px 16px rgba(0,0,0,0.06)", borderLeft: `4px solid ${r.color}` }}>
                  <div style={{ fontSize: 26, marginBottom: 6 }}>{r.emoji}</div>
                  <div style={{ fontSize: 28, fontWeight: 900, color: r.color }}>{r.value}</div>
                  <div style={{ fontSize: 13, color: "#6b7280", marginTop: 4, fontWeight: 500 }}>{r.label}</div>
                </div>
              ))}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <Card title="📊 Phân bổ vai trò">
                {Object.entries(roleCounts).map(([role, count]) => {
                  const m = roleMeta(role);
                  const pct = db.users.length ? Math.round(count / db.users.length * 100) : 0;
                  return (
                    <div key={role} style={{ marginBottom: 14 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: m.color }}>{m.emoji} {m.label}</span>
                        <span style={{ fontSize: 12, color: "#9ca3af" }}>{count} ({pct}%)</span>
                      </div>
                      <div style={{ height: 7, background: "#f3f4f6", borderRadius: 999 }}>
                        <div style={{ height: "100%", width: `${pct}%`, background: m.color, borderRadius: 999 }} />
                      </div>
                    </div>
                  );
                })}
              </Card>
              <Card title="📋 Tình trạng đơn hàng">
                {(() => {
                  const sm: Record<string, number> = {};
                  db.orders.forEach(o => { const s = o.trangThai || o.status || "unknown"; sm[s] = (sm[s] || 0) + 1; });
                  return Object.entries(sm).map(([status, count]) => (
                    <div key={status} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", background: "#f8faff", borderRadius: 10, marginBottom: 8 }}>
                      <StatusBadge status={status} /><span style={{ fontWeight: 700, color: "#374151" }}>{count} đơn</span>
                    </div>
                  ));
                })()}
              </Card>
            </div>
          </div>
        )}
      </main>

      {/* Modal Add User */}
      <Modal open={modal === "addUser"} onClose={() => setModal(null)} title="👤 Thêm người dùng mới">
        <Field label="Họ tên"><Inp placeholder="Nguyễn Văn A" value={userForm.hoTen} onChange={e => setUserForm({ ...userForm, hoTen: e.target.value })} /></Field>
        <Field label="Vai trò">
          <Sel value={userForm.role} onChange={e => setUserForm({ ...userForm, role: e.target.value })}>
            <option value="admin">🛡️ Admin</option><option value="nongdan">🌾 Nông dân</option>
            <option value="daily">🏪 Đại lý</option><option value="sieuthi">🛒 Siêu thị</option>
          </Sel>
        </Field>
        <Field label="Email"><Inp type="email" placeholder="email@example.com" value={userForm.email} onChange={e => setUserForm({ ...userForm, email: e.target.value })} /></Field>
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 20 }}>
          <Btn variant="outline" onClick={() => setModal(null)}>Hủy</Btn>
          <Btn variant="purple" onClick={addUser}>+ Thêm</Btn>
        </div>
      </Modal>

      {/* Modal Add Farm */}
      <Modal open={modal === "addFarm"} onClose={() => setModal(null)} title="🌿 Thêm trang trại mới">
        <Field label="Tên trang trại"><Inp placeholder="Trang trại Xanh..." value={farmForm.ten} onChange={e => setFarmForm({ ...farmForm, ten: e.target.value })} /></Field>
        <Field label="Chủ trang trại"><Inp placeholder="Họ tên chủ" value={farmForm.chu} onChange={e => setFarmForm({ ...farmForm, chu: e.target.value })} /></Field>
        <Field label="Địa chỉ"><Inp placeholder="Tỉnh / Thành phố..." value={farmForm.diachi} onChange={e => setFarmForm({ ...farmForm, diachi: e.target.value })} /></Field>
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 20 }}>
          <Btn variant="outline" onClick={() => setModal(null)}>Hủy</Btn>
          <Btn onClick={addFarm}>+ Thêm</Btn>
        </div>
      </Modal>
    </div>
  );
}
