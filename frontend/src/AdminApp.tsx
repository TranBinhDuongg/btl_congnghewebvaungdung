import { useState, useEffect, useCallback, ReactNode } from "react";
import { getCurrentUser, clearCurrentUser, apiUpdateProfile } from "./AuthHelper.ts";
import "./AdminApp.css";

// ─── Types ────────────────────────────────────────────────────────────────────
interface NongDan { MaNongDan: number; HoTen: string; TenDangNhap: string; Email?: string; SoDienThoai?: string; DiaChi?: string; }
interface DaiLy   { MaDaiLy: number; TenDaiLy: string; TenDangNhap?: string; Email?: string; SoDienThoai?: string; DiaChi?: string; }
interface SieuThi { MaSieuThi: number; TenSieuThi: string; TenDangNhap?: string; Email?: string; SoDienThoai?: string; DiaChi?: string; }
interface TrangTrai { MaTrangTrai: number; TenTrangTrai: string; DiaChi?: string; SoChungNhan?: string; MaNongDan: number; TenNongDan?: string; }
interface LoNongSan { MaLo: number; TenSanPham?: string; SoLuongBanDau: number; SoLuongHienTai: number; NgayThuHoach?: string; HanSuDung?: string; TrangThai?: string; TenTrangTrai?: string; }
interface DonHangDaiLy { MaDonHang: number; TenDaiLy?: string; TenNongDan?: string; TrangThai?: string; NgayTao?: string; GhiChu?: string; }
interface DonHangSieuThi { MaDonHang: number; TenSieuThi?: string; TenDaiLy?: string; TrangThai?: string; NgayTao?: string; GhiChu?: string; }
interface Log { time: string; user: string; action: string; }

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const API: string = (window as any)._env_?.REACT_APP_API_URL || "";
const ls = <T,>(k: string, fb: T): T => { try { return JSON.parse(localStorage.getItem(k) || "null") ?? fb; } catch { return fb; } };
const lsSave = (k: string, v: unknown) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /**/ } };

// ─── Nav ──────────────────────────────────────────────────────────────────────
type Section = "dashboard" | "nongdan" | "trangtrai" | "lonongsan" | "donhang_dl" | "daily" | "donhang_st" | "sieuthi" | "profile" | "logs";

interface NavItem { id: Section; label: string; icon: string; }
interface NavGroup { group: string; items: NavItem[]; }

const NAV_GROUPS: NavGroup[] = [
  {
    group: "",
    items: [{ id: "dashboard", label: "Bảng điều khiển", icon: "📊" }],
  },
  {
    group: "🌾 Nông dân",
    items: [
      { id: "nongdan",   label: "Nông dân",     icon: "🌾" },
      { id: "trangtrai", label: "Trang trại",    icon: "🌿" },
      { id: "lonongsan", label: "Lô nông sản",   icon: "📦" },
      { id: "donhang_dl",label: "Đơn hàng",      icon: "🧾" },
    ],
  },
  {
    group: "🏪 Đại lý",
    items: [
      { id: "daily",      label: "Đại lý",   icon: "🏪" },
      { id: "donhang_st", label: "Đơn hàng", icon: "🧾" },
    ],
  },
  {
    group: "🛒 Siêu thị",
    items: [
      { id: "sieuthi", label: "Siêu thị", icon: "🛒" },
    ],
  },
  {
    group: "",
    items: [{ id: "logs", label: "Audit / Log", icon: "🔍" }],
  },
];

// ─── Status config ────────────────────────────────────────────────────────────
const STATUS_MAP: Record<string, { label: string; color: string; bg: string }> = {
  "đã giao":    { label: "Đã giao",    color: "#065f46", bg: "#d1fae5" },
  "đang giao":  { label: "Đang giao",  color: "#92400e", bg: "#fef3c7" },
  pending:      { label: "Chờ xử lý", color: "#1e40af", bg: "#dbeafe" },
  "chờ xử lý": { label: "Chờ xử lý", color: "#1e40af", bg: "#dbeafe" },
  "xác nhận":   { label: "Xác nhận",  color: "#7c3aed", bg: "#ede9fe" },
  confirmed:    { label: "Xác nhận",  color: "#7c3aed", bg: "#ede9fe" },
  "đã hủy":     { label: "Đã hủy",    color: "#dc2626", bg: "#fee2e2" },
  cancelled:    { label: "Đã hủy",    color: "#dc2626", bg: "#fee2e2" },
  "hoàn thành": { label: "Hoàn thành",color: "#065f46", bg: "#d1fae5" },
  completed:    { label: "Hoàn thành",color: "#065f46", bg: "#d1fae5" },
  tai_trang_trai: { label: "Tại trang trại", color: "#15803d", bg: "#dcfce7" },
  da_xuat:      { label: "Đã xuất",   color: "#7c3aed", bg: "#ede9fe" },
  het_hang:     { label: "Hết hàng",  color: "#6b7280", bg: "#f3f4f6" },
  chua_nhan:    { label: "Chờ xác nhận", color: "#b45309", bg: "#fef3c7" },
  da_nhan:      { label: "Đã xác nhận",  color: "#059669", bg: "#d1fae5" },
  hoan_thanh:   { label: "Hoàn thành",   color: "#15803d", bg: "#dcfce7" },
  da_huy:       { label: "Đã hủy",       color: "#6b7280", bg: "#f3f4f6" },
};

// ─── Shared UI Components ─────────────────────────────────────────────────────
function StatusBadge({ status }: { status?: string }) {
  const s = STATUS_MAP[(status || "").toLowerCase()] ?? { label: status || "—", color: "#374151", bg: "#f3f4f6" };
  return <span className="badge" style={{ color: s.color, background: s.bg }}>{s.label}</span>;
}

function Panel({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`panel ${className}`}>{children}</div>;
}

function StatCard({ icon, label, value, accent }: { icon: string; label: string; value: string | number; accent: string }) {
  return (
    <div className="stat-card" style={{ "--accent": accent } as React.CSSProperties}>
      <div className="stat-icon">{icon}</div>
      <div>
        <div className="stat-value">{value}</div>
        <div className="stat-label">{label}</div>
      </div>
    </div>
  );
}

function StyledTable({ headers, children }: { headers: string[]; children: ReactNode }) {
  return (
    <div className="table-container">
      <table>
        <thead><tr>{headers.map(h => <th key={h}>{h}</th>)}</tr></thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

function EmptyRow({ cols }: { cols: number }) {
  return (
    <tr><td colSpan={cols} className="empty-msg">
      <div style={{ fontSize: 28, marginBottom: 6 }}>📭</div>Chưa có dữ liệu
    </td></tr>
  );
}

function ActionBtn({ children, onClick, variant = "primary", disabled }: { children: ReactNode; onClick: () => void; variant?: "primary" | "danger" | "success" | "warning" | "ghost"; disabled?: boolean }) {
  const bgMap: Record<string, string> = {
    primary: "var(--primary)", danger: "var(--danger)", success: "var(--success)",
    warning: "var(--warning)", ghost: "#f3f4f6",
  };
  const colorMap: Record<string, string> = { ghost: "#374151" };
  return (
    <button className="btn btn-action" onClick={onClick} disabled={disabled}
      style={{ background: disabled ? "#ccc" : bgMap[variant], color: colorMap[variant] || "#fff", marginRight: 5 }}>
      {children}
    </button>
  );
}

function PrimaryBtn({ children, onClick, disabled }: { children: ReactNode; onClick?: () => void; disabled?: boolean }) {
  return <button className="btn btn-primary" onClick={onClick} disabled={disabled}>{children}</button>;
}

function Modal({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: ReactNode }) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    if (open) document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-content">
        <button className="modal-close" onClick={onClose}>×</button>
        <h3 className="panel-title u-text-xl u-mb-6">{title}</h3>
        {children}
      </div>
    </div>
  );
}

function FormField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="form-field">
      <label className="form-label">{label}</label>
      {children}
    </div>
  );
}

function SearchBar({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div className="search-wrapper">
      <span className="search-icon">🔍</span>
      <input className="search-input" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder || "Tìm kiếm..."} />
    </div>
  );
}

function Toast({ msg, type }: { msg: string; type: "success" | "error" }) {
  return (
    <div className="toast" style={{ background: type === "success" ? "#16a34a" : "#dc2626" }}>
      {type === "success" ? "✅" : "❌"} {msg}
    </div>
  );
}

// ─── Dashboard Section ────────────────────────────────────────────────────────
function Dashboard({ nongDan, daily, sieuThi, trangTrai, loNongSan, donHangDL, donHangST, logs, onRefresh }: {
  nongDan: NongDan[]; daily: DaiLy[]; sieuThi: SieuThi[]; trangTrai: TrangTrai[];
  loNongSan: LoNongSan[]; donHangDL: DonHangDaiLy[]; donHangST: DonHangSieuThi[];
  logs: Log[]; onRefresh: () => void;
}) {
  const total = nongDan.length + daily.length + sieuThi.length || 1;
  return (
    <div className="u-fade-in">
      <div className="u-flex u-items-center u-justify-between u-mb-6">
        <div>
          <h1 className="page-title">📊 Bảng điều khiển</h1>
          <p className="page-subtitle">Tổng quan hệ thống nông nghiệp</p>
        </div>
        <button className="btn btn-secondary" onClick={onRefresh}>🔄 Làm mới</button>
      </div>
      <div className="stat-grid">
        <StatCard icon="🌾" label="Nông dân"    value={nongDan.length}   accent="#0369a1" />
        <StatCard icon="🏪" label="Đại lý"      value={daily.length}     accent="#b45309" />
        <StatCard icon="🛒" label="Siêu thị"    value={sieuThi.length}   accent="#065f46" />
        <StatCard icon="🌿" label="Trang trại"  value={trangTrai.length} accent="#22c55e" />
        <StatCard icon="📦" label="Lô nông sản" value={loNongSan.length} accent="#0ea5e9" />
        <StatCard icon="🧾" label="Đơn hàng"    value={donHangDL.length + donHangST.length} accent="#f59e0b" />
      </div>
      <div className="u-grid u-grid-2-col u-gap-6">
        <Panel>
          <div className="panel-title">🕐 Hoạt động gần đây</div>
          <StyledTable headers={["Thời gian", "Người", "Hành động"]}>
            {logs.length === 0 ? <EmptyRow cols={3} /> : logs.slice(0, 8).map((l, i) => (
              <tr key={i}>
                <td><span className="u-text-sm u-text-muted">{l.time}</span></td>
                <td className="u-font-bold u-text-primary">{l.user}</td>
                <td>{l.action}</td>
              </tr>
            ))}
          </StyledTable>
        </Panel>
        <Panel>
          <div className="panel-title">📊 Phân bổ hệ thống</div>
          {[
            { label: "Nông dân", count: nongDan.length, color: "#0369a1", emoji: "🌾" },
            { label: "Đại lý",   count: daily.length,   color: "#b45309", emoji: "🏪" },
            { label: "Siêu thị", count: sieuThi.length, color: "#065f46", emoji: "🛒" },
          ].map(({ label, count, color, emoji }) => {
            const pct = Math.round(count / total * 100);
            return (
              <div key={label} className="u-mb-5">
                <div className="u-flex u-justify-between u-mb-2">
                  <span className="u-font-bold u-text-md" style={{ color }}>{emoji} {label}</span>
                  <span className="u-text-sm u-text-muted">{count} ({pct}%)</span>
                </div>
                <div className="progress-bar-track">
                  <div className="progress-bar-fill" style={{ width: `${pct}%`, background: color }} />
                </div>
              </div>
            );
          })}
        </Panel>
      </div>
    </div>
  );
}

// ─── NongDan Section ──────────────────────────────────────────────────────────
function NongDanSection({ list, onAdd, onEdit, onDelete }: {
  list: NongDan[]; onAdd: () => void; onEdit: (u: NongDan) => void; onDelete: (id: number, ten: string) => void;
}) {
  const [search, setSearch] = useState("");
  const filtered = list.filter(u =>
    !search ||
    u.HoTen?.toLowerCase().includes(search.toLowerCase()) ||
    u.TenDangNhap?.toLowerCase().includes(search.toLowerCase()) ||
    u.Email?.toLowerCase().includes(search.toLowerCase()) ||
    u.SoDienThoai?.includes(search) ||
    u.DiaChi?.toLowerCase().includes(search.toLowerCase())
  );
  return (
    <div className="u-fade-in">
      <div className="u-flex u-items-center u-justify-between u-mb-6">
        <div><h1 className="page-title">🌾 Quản lý nông dân</h1></div>
        <div className="u-flex u-gap-3 u-items-center">
          <SearchBar value={search} onChange={setSearch} placeholder="Tìm theo tên, tài khoản, email, SĐT, địa chỉ..." />
          <PrimaryBtn onClick={onAdd}>+ Thêm nông dân</PrimaryBtn>
        </div>
      </div>
      <Panel>
        {search && <p className="u-text-sm u-text-muted u-mb-3">{filtered.length} / {list.length} kết quả</p>}
        <StyledTable headers={["Mã", "Họ tên", "Tài khoản", "Email", "SĐT", "Địa chỉ", "Hành động"]}>
          {filtered.length === 0 ? <EmptyRow cols={7} /> : filtered.map(u => (
            <tr key={u.MaNongDan}>
              <td><code className="u-text-sm u-text-primary u-font-bold">#{u.MaNongDan}</code></td>
              <td className="u-font-bold">{u.HoTen}</td>
              <td className="u-text-muted">{u.TenDangNhap}</td>
              <td className="u-text-muted">{u.Email || "—"}</td>
              <td className="u-text-muted">{u.SoDienThoai || "—"}</td>
              <td className="u-text-muted">{u.DiaChi || "—"}</td>
              <td>
                <ActionBtn onClick={() => onEdit(u)} variant="primary">✏️ Sửa</ActionBtn>
                <ActionBtn onClick={() => onDelete(u.MaNongDan, u.HoTen)} variant="danger">🗑 Xóa</ActionBtn>
              </td>
            </tr>
          ))}
        </StyledTable>
      </Panel>
    </div>
  );
}

// ─── DaiLy Section ────────────────────────────────────────────────────────────
function DaiLySection({ list, onAdd, onEdit, onDelete }: {
  list: DaiLy[]; onAdd: () => void; onEdit: (u: DaiLy) => void; onDelete: (id: number, ten: string) => void;
}) {
  const [search, setSearch] = useState("");
  const filtered = list.filter(u => !search || u.TenDaiLy?.toLowerCase().includes(search.toLowerCase()));
  return (
    <div className="u-fade-in">
      <div className="u-flex u-items-center u-justify-between u-mb-6">
        <div><h1 className="page-title">🏪 Quản lý đại lý</h1></div>
        <div className="u-flex u-gap-3 u-items-center">
          <SearchBar value={search} onChange={setSearch} placeholder="Tìm theo tên đại lý..." />
          <PrimaryBtn onClick={onAdd}>+ Thêm đại lý</PrimaryBtn>
        </div>
      </div>
      <Panel>
        <StyledTable headers={["Mã", "Tên đại lý", "Email", "SĐT", "Địa chỉ", "Hành động"]}>
          {filtered.length === 0 ? <EmptyRow cols={6} /> : filtered.map(u => (
            <tr key={u.MaDaiLy}>
              <td><code className="u-text-sm u-text-primary u-font-bold">#{u.MaDaiLy}</code></td>
              <td className="u-font-bold">{u.TenDaiLy}</td>
              <td className="u-text-muted">{u.Email || "—"}</td>
              <td className="u-text-muted">{u.SoDienThoai || "—"}</td>
              <td className="u-text-muted">{u.DiaChi || "—"}</td>
              <td>
                <ActionBtn onClick={() => onEdit(u)} variant="primary">✏️ Sửa</ActionBtn>
                <ActionBtn onClick={() => onDelete(u.MaDaiLy, u.TenDaiLy)} variant="danger">🗑 Xóa</ActionBtn>
              </td>
            </tr>
          ))}
        </StyledTable>
      </Panel>
    </div>
  );
}

// ─── SieuThi Section ──────────────────────────────────────────────────────────
function SieuThiSection({ list, onAdd, onEdit, onDelete }: {
  list: SieuThi[]; onAdd: () => void; onEdit: (u: SieuThi) => void; onDelete: (id: number, ten: string) => void;
}) {
  const [search, setSearch] = useState("");
  const filtered = list.filter(u => !search || u.TenSieuThi?.toLowerCase().includes(search.toLowerCase()));
  return (
    <div className="u-fade-in">
      <div className="u-flex u-items-center u-justify-between u-mb-6">
        <div><h1 className="page-title">🛒 Quản lý siêu thị</h1></div>
        <div className="u-flex u-gap-3 u-items-center">
          <SearchBar value={search} onChange={setSearch} placeholder="Tìm theo tên siêu thị..." />
          <PrimaryBtn onClick={onAdd}>+ Thêm siêu thị</PrimaryBtn>
        </div>
      </div>
      <Panel>
        <StyledTable headers={["Mã", "Tên siêu thị", "Email", "SĐT", "Địa chỉ", "Hành động"]}>
          {filtered.length === 0 ? <EmptyRow cols={6} /> : filtered.map(u => (
            <tr key={u.MaSieuThi}>
              <td><code className="u-text-sm u-text-primary u-font-bold">#{u.MaSieuThi}</code></td>
              <td className="u-font-bold">{u.TenSieuThi}</td>
              <td className="u-text-muted">{u.Email || "—"}</td>
              <td className="u-text-muted">{u.SoDienThoai || "—"}</td>
              <td className="u-text-muted">{u.DiaChi || "—"}</td>
              <td>
                <ActionBtn onClick={() => onEdit(u)} variant="primary">✏️ Sửa</ActionBtn>
                <ActionBtn onClick={() => onDelete(u.MaSieuThi, u.TenSieuThi)} variant="danger">🗑 Xóa</ActionBtn>
              </td>
            </tr>
          ))}
        </StyledTable>
      </Panel>
    </div>
  );
}

// ─── TrangTrai Section ────────────────────────────────────────────────────────
function TrangTraiSection({ list, onAdd, onEdit, onDelete }: {
  list: TrangTrai[]; onAdd: () => void; onEdit: (t: TrangTrai) => void; onDelete: (id: number, ten: string) => void;
}) {
  const [search, setSearch] = useState("");
  const filtered = list.filter(t => !search || t.TenTrangTrai?.toLowerCase().includes(search.toLowerCase()) || t.TenNongDan?.toLowerCase().includes(search.toLowerCase()));
  return (
    <div className="u-fade-in">
      <div className="u-flex u-items-center u-justify-between u-mb-6">
        <div><h1 className="page-title">🌿 Quản lý trang trại</h1></div>
        <div className="u-flex u-gap-3 u-items-center">
          <SearchBar value={search} onChange={setSearch} placeholder="Tìm theo tên, chủ trang trại..." />
          <PrimaryBtn onClick={onAdd}>+ Thêm trang trại</PrimaryBtn>
        </div>
      </div>
      <Panel>
        <StyledTable headers={["Mã", "Tên trang trại", "Nông dân", "Địa chỉ", "Chứng nhận", "Hành động"]}>
          {filtered.length === 0 ? <EmptyRow cols={6} /> : filtered.map(t => (
            <tr key={t.MaTrangTrai}>
              <td><code className="u-text-sm u-text-primary u-font-bold">#{t.MaTrangTrai}</code></td>
              <td className="u-font-bold">{t.TenTrangTrai}</td>
              <td><span className="badge" style={{ color: "#0369a1", background: "#e0f2fe" }}>{t.TenNongDan || `#${t.MaNongDan}`}</span></td>
              <td className="u-text-muted">{t.DiaChi || "—"}</td>
              <td className="u-text-muted">{t.SoChungNhan || "—"}</td>
              <td>
                <ActionBtn onClick={() => onEdit(t)} variant="primary">✏️ Sửa</ActionBtn>
                <ActionBtn onClick={() => onDelete(t.MaTrangTrai, t.TenTrangTrai)} variant="danger">🗑 Xóa</ActionBtn>
              </td>
            </tr>
          ))}
        </StyledTable>
      </Panel>
    </div>
  );
}

// ─── LoNongSan Section ────────────────────────────────────────────────────────
function LoNongSanSection({ list }: { list: LoNongSan[] }) {
  const [search, setSearch] = useState("");
  const filtered = list.filter(l => !search || l.TenSanPham?.toLowerCase().includes(search.toLowerCase()) || l.TenTrangTrai?.toLowerCase().includes(search.toLowerCase()));
  return (
    <div className="u-fade-in">
      <div className="u-flex u-items-center u-justify-between u-mb-6">
        <div><h1 className="page-title">📦 Lô nông sản</h1></div>
        <SearchBar value={search} onChange={setSearch} placeholder="Tìm theo sản phẩm, trang trại..." />
      </div>
      <Panel>
        <StyledTable headers={["Mã lô", "Sản phẩm", "Trang trại", "SL ban đầu", "SL hiện tại", "Thu hoạch", "Hạn SD", "Trạng thái"]}>
          {filtered.length === 0 ? <EmptyRow cols={8} /> : filtered.map(l => (
            <tr key={l.MaLo}>
              <td><code className="u-text-sm u-text-primary u-font-bold">#{l.MaLo}</code></td>
              <td className="u-font-bold">{l.TenSanPham || "—"}</td>
              <td><span className="badge" style={{ color: "#0369a1", background: "#e0f2fe" }}>{l.TenTrangTrai || "—"}</span></td>
              <td><span className="badge" style={{ color: "#15803d", background: "#dcfce7" }}>{l.SoLuongBanDau}</span></td>
              <td><span className="badge" style={{ color: "#1d4ed8", background: "#dbeafe" }}>{l.SoLuongHienTai}</span></td>
              <td className="u-text-muted">{l.NgayThuHoach ? new Date(l.NgayThuHoach).toLocaleDateString("vi-VN") : "—"}</td>
              <td className="u-text-muted">{l.HanSuDung ? new Date(l.HanSuDung).toLocaleDateString("vi-VN") : "—"}</td>
              <td><StatusBadge status={l.TrangThai} /></td>
            </tr>
          ))}
        </StyledTable>
      </Panel>
    </div>
  );
}

// ─── DonHang Section ──────────────────────────────────────────────────────────
function DonHangSection({ donHangDL, donHangST, title }: { donHangDL: DonHangDaiLy[]; donHangST: DonHangSieuThi[]; title?: string }) {
  const [search, setSearch] = useState("");
  const allDonHang = [
    ...donHangDL.map(d => ({ ...d, loai: "Đại lý → Nông dân", ten: d.TenDaiLy || "—", doi: d.TenNongDan || "—" })),
    ...donHangST.map(d => ({ ...d, loai: "Siêu thị → Đại lý", ten: d.TenSieuThi || "—", doi: d.TenDaiLy || "—" })),
  ];
  const filtered = allDonHang.filter(d => !search || d.ten?.toLowerCase().includes(search.toLowerCase()) || d.doi?.toLowerCase().includes(search.toLowerCase()));
  return (
    <div className="u-fade-in">
      <div className="u-flex u-items-center u-justify-between u-mb-6">
        <div><h1 className="page-title">{title || "🧾 Tất cả đơn hàng"}</h1></div>
        <SearchBar value={search} onChange={setSearch} placeholder="Tìm theo tên người đặt..." />
      </div>
      {(donHangDL.length > 0 || donHangST.length > 0) && donHangDL.length > 0 && donHangST.length > 0 && (
        <div className="stat-grid u-mb-6" style={{ gridTemplateColumns: "1fr 1fr" }}>
          <StatCard icon="🏪" label="Đơn Đại lý → Nông dân" value={donHangDL.length} accent="#b45309" />
          <StatCard icon="🛒" label="Đơn Siêu thị → Đại lý"  value={donHangST.length} accent="#065f46" />
        </div>
      )}
      <Panel>
        <StyledTable headers={["Mã đơn", "Loại", "Người đặt", "Đối tác", "Trạng thái", "Ngày tạo", "Ghi chú"]}>
          {filtered.length === 0 ? <EmptyRow cols={7} /> : filtered.map((d, i) => (
            <tr key={i}>
              <td><code className="u-text-sm u-text-primary u-font-bold">#{d.MaDonHang}</code></td>
              <td><span className="badge" style={{ color: "#374151", background: "#f3f4f6" }}>{d.loai}</span></td>
              <td className="u-font-bold">{d.ten}</td>
              <td className="u-text-muted">{d.doi}</td>
              <td><StatusBadge status={d.TrangThai} /></td>
              <td className="u-text-muted">{d.NgayTao ? new Date(d.NgayTao).toLocaleDateString("vi-VN") : "—"}</td>
              <td className="u-text-muted">{d.GhiChu || "—"}</td>
            </tr>
          ))}
        </StyledTable>
      </Panel>
    </div>
  );
}

// ─── Logs Section ─────────────────────────────────────────────────────────────
function LogsSection({ logs, onClear }: { logs: Log[]; onClear: () => void }) {
  return (
    <div className="u-fade-in">
      <div className="u-flex u-items-center u-justify-between u-mb-6">
        <div><h1 className="page-title">🔍 Audit / Log</h1></div>
        <button className="btn btn-danger-outline" onClick={onClear}>
          🗑 Xóa log
        </button>
      </div>
      <Panel>
        <StyledTable headers={["Thời gian", "Người", "Hành động"]}>
          {logs.length === 0 ? <EmptyRow cols={3} /> : logs.slice(0, 100).map((l, i) => (
            <tr key={i}>
              <td><span className="u-text-sm u-text-muted" style={{ whiteSpace: "nowrap" }}>{l.time}</span></td>
              <td className="u-font-bold u-text-primary">{l.user}</td>
              <td>{l.action}</td>
            </tr>
          ))}
        </StyledTable>
      </Panel>
    </div>
  );
}

// ─── Profile Section ──────────────────────────────────────────────────────────
function ProfileSection({ authUser, onSave }: {
  authUser: ReturnType<typeof getCurrentUser>;
  onSave: (form: { hoTen: string; soDienThoai: string; email: string; diaChi: string }) => Promise<void>;
}) {
  const [form, setForm] = useState({
    hoTen: authUser?.tenHienThi || "",
    soDienThoai: authUser?.soDienThoai || "",
    email: authUser?.email || "",
    diaChi: authUser?.diaChi || "",
  });
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    try { await onSave(form); } finally { setSaving(false); }
  }

  return (
    <div className="u-fade-in" style={{ maxWidth: 560 }}>
      <div className="u-mb-6"><h1 className="page-title">👤 Hồ sơ Admin</h1></div>
      <Panel>
        <div className="profile-header">
          <div className="profile-avatar">🛡️</div>
          <div>
            <div className="u-font-black u-text-lg u-text-dark">{authUser?.tenHienThi || "Admin"}</div>
            <span className="badge" style={{ color: "#7c3aed", background: "#ede9fe" }}>🛡️ Quản trị viên</span>
          </div>
        </div>
        <FormField label="Họ tên *">
          <input className="input" value={form.hoTen} onChange={e => setForm({ ...form, hoTen: e.target.value })} />
        </FormField>
        <FormField label="Số điện thoại">
          <input className="input" value={form.soDienThoai} onChange={e => setForm({ ...form, soDienThoai: e.target.value })} />
        </FormField>
        <FormField label="Email">
          <input className="input" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
        </FormField>
        <FormField label="Địa chỉ">
          <input className="input" value={form.diaChi} onChange={e => setForm({ ...form, diaChi: e.target.value })} />
        </FormField>
        <div className="u-flex u-justify-end u-mt-4">
          <PrimaryBtn onClick={handleSave} disabled={saving}>{saving ? "⏳ Đang lưu..." : "💾 Lưu thay đổi"}</PrimaryBtn>
        </div>
      </Panel>
    </div>
  );
}

// ─── Form Modals ──────────────────────────────────────────────────────────────
function NongDanModal({ edit, onClose, onSaved }: { edit: NongDan | null; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({ HoTen: edit?.HoTen || "", TenDangNhap: edit?.TenDangNhap || "", MatKhauHash: "", Email: edit?.Email || "", SoDienThoai: edit?.SoDienThoai || "", DiaChi: edit?.DiaChi || "" });
  const [err, setErr] = useState("");

  async function handleSave() {
    if (!form.HoTen || !form.TenDangNhap || (!edit && !form.MatKhauHash)) return setErr("Vui lòng điền đầy đủ thông tin bắt buộc");
    try {
      if (edit) {
        const res = await fetch(`${API}/api/nong-dan/update/${edit.MaNongDan}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ HoTen: form.HoTen, Email: form.Email, SoDienThoai: form.SoDienThoai, DiaChi: form.DiaChi }) });
        if (!res.ok) throw new Error((await res.json()).message);
      } else {
        const res = await fetch(`${API}/api/nong-dan/create`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
        if (!res.ok) throw new Error((await res.json()).message);
      }
      onSaved(); onClose();
    } catch (e: unknown) { setErr((e as Error).message); }
  }

  return (
    <Modal open onClose={onClose} title={edit ? "✏️ Sửa nông dân" : "🌾 Thêm nông dân mới"}>
      {err && <div className="error-msg">{err}</div>}
      <FormField label="Họ tên *"><input className="input" value={form.HoTen} onChange={e => setForm({ ...form, HoTen: e.target.value })} placeholder="Nguyễn Văn A" /></FormField>
      {!edit && <>
        <FormField label="Tên đăng nhập *"><input className="input" value={form.TenDangNhap} onChange={e => setForm({ ...form, TenDangNhap: e.target.value })} placeholder="username" /></FormField>
        <FormField label="Mật khẩu *"><input className="input" type="password" value={form.MatKhauHash} onChange={e => setForm({ ...form, MatKhauHash: e.target.value })} placeholder="••••••••" /></FormField>
      </>}
      <FormField label="Email"><input className="input" type="email" value={form.Email} onChange={e => setForm({ ...form, Email: e.target.value })} placeholder="email@example.com" /></FormField>
      <FormField label="Số điện thoại"><input className="input" value={form.SoDienThoai} onChange={e => setForm({ ...form, SoDienThoai: e.target.value })} placeholder="0901234567" /></FormField>
      <FormField label="Địa chỉ"><input className="input" value={form.DiaChi} onChange={e => setForm({ ...form, DiaChi: e.target.value })} placeholder="Tỉnh / Thành phố..." /></FormField>
      <div className="u-flex u-justify-end u-gap-3 u-mt-6 u-py-6 u-border-t">
        <button className="btn btn-secondary" onClick={onClose}>Hủy</button>
        <PrimaryBtn onClick={handleSave}>{edit ? "💾 Lưu" : "+ Thêm"}</PrimaryBtn>
      </div>
    </Modal>
  );
}

function DaiLyModal({ edit, onClose, onSaved }: { edit: DaiLy | null; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({ TenDaiLy: edit?.TenDaiLy || "", TenDangNhap: edit?.TenDangNhap || "", MatKhauHash: "", Email: edit?.Email || "", SoDienThoai: edit?.SoDienThoai || "", DiaChi: edit?.DiaChi || "" });
  const [err, setErr] = useState("");

  async function handleSave() {
    if (!form.TenDaiLy || !form.TenDangNhap || (!edit && !form.MatKhauHash)) return setErr("Vui lòng điền đầy đủ thông tin bắt buộc");
    try {
      if (edit) {
        const res = await fetch(`${API}/api/dai-ly/update/${edit.MaDaiLy}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ TenDaiLy: form.TenDaiLy, Email: form.Email, SoDienThoai: form.SoDienThoai, DiaChi: form.DiaChi }) });
        if (!res.ok) throw new Error((await res.json()).message);
      } else {
        const res = await fetch(`${API}/api/dai-ly/create`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
        if (!res.ok) throw new Error((await res.json()).message);
      }
      onSaved(); onClose();
    } catch (e: unknown) { setErr((e as Error).message); }
  }

  return (
    <Modal open onClose={onClose} title={edit ? "✏️ Sửa đại lý" : "🏪 Thêm đại lý mới"}>
      {err && <div className="error-msg">{err}</div>}
      <FormField label="Tên đại lý *"><input className="input" value={form.TenDaiLy} onChange={e => setForm({ ...form, TenDaiLy: e.target.value })} placeholder="Công ty TNHH..." /></FormField>
      {!edit && <>
        <FormField label="Tên đăng nhập *"><input className="input" value={form.TenDangNhap} onChange={e => setForm({ ...form, TenDangNhap: e.target.value })} placeholder="username" /></FormField>
        <FormField label="Mật khẩu *"><input className="input" type="password" value={form.MatKhauHash} onChange={e => setForm({ ...form, MatKhauHash: e.target.value })} placeholder="••••••••" /></FormField>
      </>}
      <FormField label="Email"><input className="input" type="email" value={form.Email} onChange={e => setForm({ ...form, Email: e.target.value })} placeholder="email@example.com" /></FormField>
      <FormField label="Số điện thoại"><input className="input" value={form.SoDienThoai} onChange={e => setForm({ ...form, SoDienThoai: e.target.value })} placeholder="0901234567" /></FormField>
      <FormField label="Địa chỉ"><input className="input" value={form.DiaChi} onChange={e => setForm({ ...form, DiaChi: e.target.value })} placeholder="Tỉnh / Thành phố..." /></FormField>
      <div className="u-flex u-justify-end u-gap-3 u-mt-6 u-py-6 u-border-t">
        <button className="btn btn-secondary" onClick={onClose}>Hủy</button>
        <PrimaryBtn onClick={handleSave}>{edit ? "💾 Lưu" : "+ Thêm"}</PrimaryBtn>
      </div>
    </Modal>
  );
}

function SieuThiModal({ edit, onClose, onSaved }: { edit: SieuThi | null; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({ TenSieuThi: edit?.TenSieuThi || "", TenDangNhap: edit?.TenDangNhap || "", MatKhauHash: "", Email: edit?.Email || "", SoDienThoai: edit?.SoDienThoai || "", DiaChi: edit?.DiaChi || "" });
  const [err, setErr] = useState("");

  async function handleSave() {
    if (!form.TenSieuThi || !form.TenDangNhap || (!edit && !form.MatKhauHash)) return setErr("Vui lòng điền đầy đủ thông tin bắt buộc");
    try {
      if (edit) {
        const res = await fetch(`${API}/api/sieuthi/${edit.MaSieuThi}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ TenSieuThi: form.TenSieuThi, Email: form.Email, SoDienThoai: form.SoDienThoai, DiaChi: form.DiaChi }) });
        if (!res.ok) throw new Error((await res.json()).message);
      } else {
        const res = await fetch(`${API}/api/sieuthi`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
        if (!res.ok) throw new Error((await res.json()).message);
      }
      onSaved(); onClose();
    } catch (e: unknown) { setErr((e as Error).message); }
  }

  return (
    <Modal open onClose={onClose} title={edit ? "✏️ Sửa siêu thị" : "🛒 Thêm siêu thị mới"}>
      {err && <div className="error-msg">{err}</div>}
      <FormField label="Tên siêu thị *"><input className="input" value={form.TenSieuThi} onChange={e => setForm({ ...form, TenSieuThi: e.target.value })} placeholder="Siêu thị ABC..." /></FormField>
      {!edit && <>
        <FormField label="Tên đăng nhập *"><input className="input" value={form.TenDangNhap} onChange={e => setForm({ ...form, TenDangNhap: e.target.value })} placeholder="username" /></FormField>
        <FormField label="Mật khẩu *"><input className="input" type="password" value={form.MatKhauHash} onChange={e => setForm({ ...form, MatKhauHash: e.target.value })} placeholder="••••••••" /></FormField>
      </>}
      <FormField label="Email"><input className="input" type="email" value={form.Email} onChange={e => setForm({ ...form, Email: e.target.value })} placeholder="email@example.com" /></FormField>
      <FormField label="Số điện thoại"><input className="input" value={form.SoDienThoai} onChange={e => setForm({ ...form, SoDienThoai: e.target.value })} placeholder="0901234567" /></FormField>
      <FormField label="Địa chỉ"><input className="input" value={form.DiaChi} onChange={e => setForm({ ...form, DiaChi: e.target.value })} placeholder="Tỉnh / Thành phố..." /></FormField>
      <div className="u-flex u-justify-end u-gap-3 u-mt-6 u-py-6 u-border-t">
        <button className="btn btn-secondary" onClick={onClose}>Hủy</button>
        <PrimaryBtn onClick={handleSave}>{edit ? "💾 Lưu" : "+ Thêm"}</PrimaryBtn>
      </div>
    </Modal>
  );
}

function TrangTraiModal({ edit, nongDanList, onClose, onSaved }: { edit: TrangTrai | null; nongDanList: NongDan[]; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({ TenTrangTrai: edit?.TenTrangTrai || "", MaNongDan: edit ? String(edit.MaNongDan) : "", DiaChi: edit?.DiaChi || "", SoChungNhan: edit?.SoChungNhan || "" });
  const [err, setErr] = useState("");

  async function handleSave() {
    if (!form.TenTrangTrai || !form.MaNongDan) return setErr("Vui lòng điền đầy đủ thông tin bắt buộc");
    try {
      if (edit) {
        const res = await fetch(`${API}/api/trang-trai/update/${edit.MaTrangTrai}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ TenTrangTrai: form.TenTrangTrai, DiaChi: form.DiaChi, SoChungNhan: form.SoChungNhan }) });
        if (!res.ok) throw new Error((await res.json()).message);
      } else {
        const res = await fetch(`${API}/api/trang-trai/create`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, MaNongDan: Number(form.MaNongDan) }) });
        if (!res.ok) throw new Error((await res.json()).message);
      }
      onSaved(); onClose();
    } catch (e: unknown) { setErr((e as Error).message); }
  }

  return (
    <Modal open onClose={onClose} title={edit ? "✏️ Sửa trang trại" : "🌿 Thêm trang trại mới"}>
      {err && <div className="error-msg">{err}</div>}
      <FormField label="Tên trang trại *"><input className="input" value={form.TenTrangTrai} onChange={e => setForm({ ...form, TenTrangTrai: e.target.value })} placeholder="Trang trại Xanh..." /></FormField>
      {!edit && (
        <FormField label="Nông dân *">
          <select className="select" value={form.MaNongDan} onChange={e => setForm({ ...form, MaNongDan: e.target.value })}>
            <option value="">-- Chọn nông dân --</option>
            {nongDanList.map(nd => <option key={nd.MaNongDan} value={nd.MaNongDan}>{nd.HoTen} (#{nd.MaNongDan})</option>)}
          </select>
        </FormField>
      )}
      <FormField label="Địa chỉ"><input className="input" value={form.DiaChi} onChange={e => setForm({ ...form, DiaChi: e.target.value })} placeholder="Tỉnh / Thành phố..." /></FormField>
      <FormField label="Số chứng nhận"><input className="input" value={form.SoChungNhan} onChange={e => setForm({ ...form, SoChungNhan: e.target.value })} placeholder="VN-CERT-..." /></FormField>
      <div className="u-flex u-justify-end u-gap-3 u-mt-6 u-py-6 u-border-t">
        <button className="btn btn-secondary" onClick={onClose}>Hủy</button>
        <PrimaryBtn onClick={handleSave}>{edit ? "💾 Lưu" : "+ Thêm"}</PrimaryBtn>
      </div>
    </Modal>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function AdminApp() {
  const [section, setSection] = useState<Section>("dashboard");
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);
  const [loading, setLoading] = useState(false);

  // Data
  const [nongDanList, setNongDanList]     = useState<NongDan[]>([]);
  const [dailyList, setDailyList]         = useState<DaiLy[]>([]);
  const [sieuThiList, setSieuThiList]     = useState<SieuThi[]>([]);
  const [trangTraiList, setTrangTraiList] = useState<TrangTrai[]>([]);
  const [loNongSanList, setLoNongSanList] = useState<LoNongSan[]>([]);
  const [donHangDLList, setDonHangDLList] = useState<DonHangDaiLy[]>([]);
  const [donHangSTList, setDonHangSTList] = useState<DonHangSieuThi[]>([]);

  // Modal state
  const [modal, setModal] = useState<string | null>(null);
  const [editNd, setEditNd] = useState<NongDan | null>(null);
  const [editDl, setEditDl] = useState<DaiLy | null>(null);
  const [editSt, setEditSt] = useState<SieuThi | null>(null);
  const [editTt, setEditTt] = useState<TrangTrai | null>(null);

  const authUser = getCurrentUser();

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const addLog = useCallback((action: string) => {
    const logs = [{ time: new Date().toLocaleString("vi-VN"), user: authUser?.tenHienThi || "Admin", action }, ...ls<Log[]>("admin_logs", [])].slice(0, 200);
    lsSave("admin_logs", logs);
  }, [authUser]);

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
    } finally { setLoading(false); }
  }, []);

  useEffect(() => {
    if (!authUser || authUser.role !== "admin") { window.location.href = "/login"; return; }
    fetchAll();
  }, [fetchAll]);

  const logs = ls<Log[]>("admin_logs", []);

  async function handleDeleteNongDan(id: number, ten: string) {
    if (!window.confirm(`Xóa nông dân "${ten}"?`)) return;
    try {
      const res = await fetch(`${API}/api/nong-dan/delete/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error((await res.json()).message);
      addLog(`Xóa nông dân: ${ten}`); showToast("Đã xóa nông dân"); fetchAll();
    } catch (e: unknown) { showToast((e as Error).message, "error"); }
  }

  async function handleDeleteDaiLy(id: number, ten: string) {
    if (!window.confirm(`Xóa đại lý "${ten}"?`)) return;
    try {
      const res = await fetch(`${API}/api/dai-ly/delete/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error((await res.json()).message);
      addLog(`Xóa đại lý: ${ten}`); showToast("Đã xóa đại lý"); fetchAll();
    } catch (e: unknown) { showToast((e as Error).message, "error"); }
  }

  async function handleDeleteSieuThi(id: number, ten: string) {
    if (!window.confirm(`Xóa siêu thị "${ten}"?`)) return;
    try {
      const res = await fetch(`${API}/api/sieuthi/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error((await res.json()).message);
      addLog(`Xóa siêu thị: ${ten}`); showToast("Đã xóa siêu thị"); fetchAll();
    } catch (e: unknown) { showToast((e as Error).message, "error"); }
  }

  async function handleDeleteTrangTrai(id: number, ten: string) {
    if (!window.confirm(`Xóa trang trại "${ten}"?`)) return;
    try {
      const res = await fetch(`${API}/api/trang-trai/delete/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error((await res.json()).message);
      addLog(`Xóa trang trại: ${ten}`); showToast("Đã xóa trang trại"); fetchAll();
    } catch (e: unknown) { showToast((e as Error).message, "error"); }
  }

  async function handleSaveProfile(form: { hoTen: string; soDienThoai: string; email: string; diaChi: string }) {
    if (!authUser) return;
    try {
      await apiUpdateProfile({ maTaiKhoan: authUser.maTaiKhoan, hoTen: form.hoTen, soDienThoai: form.soDienThoai, email: form.email, diaChi: form.diaChi });
      addLog("Cập nhật hồ sơ admin"); showToast("Cập nhật hồ sơ thành công");
    } catch (e: unknown) { showToast((e as Error).message, "error"); }
  }

  return (
    <div className="admin-app">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="u-flex u-items-center u-gap-3">
            <div className="avatar" style={{ background: "linear-gradient(135deg,#7c3aed,#4f46e5)", fontSize: 20 }}>🛡️</div>
            <div>
              <div className="logo">Admin Panel</div>
              <div className="logo-sub">Hệ thống nông nghiệp</div>
            </div>
          </div>
        </div>
        <nav className="nav-list">
          {NAV_GROUPS.map((g, gi) => (
            <div key={gi}>
              {g.group && (
                <div className="nav-group-label">
                  {g.group}
                </div>
              )}
              {g.items.map(({ id, label, icon }) => (
                <button key={id} onClick={() => setSection(id)} className={`nav-item ${section === id ? "active" : ""}`}>
                  <span className="nav-icon">{icon}</span> {label}
                </button>
              ))}
            </div>
          ))}
        </nav>
        <div className="sidebar-footer">
          <button className="profile-btn" onClick={() => setSection("profile")}>
            <div className="avatar">🛡️</div>
            <div style={{ textAlign: "left" }}>
              <div className="u-font-bold u-text-sm">{authUser?.tenHienThi || "Admin"}</div>
              <div className="u-text-sm" style={{ color: '#a78bfa' }}>Quản trị viên</div>
            </div>
          </button>
          <button className="logout-btn" onClick={() => { clearCurrentUser(); window.location.href = "/login"; }}>
            🚪 Đăng xuất
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="main-content">
        {loading && <div className="loading-indicator">⏳ Đang tải...</div>}

        {section === "dashboard" && (
          <Dashboard nongDan={nongDanList} daily={dailyList} sieuThi={sieuThiList} trangTrai={trangTraiList}
            loNongSan={loNongSanList} donHangDL={donHangDLList} donHangST={donHangSTList} logs={logs} onRefresh={fetchAll} />
        )}
        {section === "nongdan" && (
          <NongDanSection list={nongDanList}
            onAdd={() => { setEditNd(null); setModal("nongdan"); }}
            onEdit={u => { setEditNd(u); setModal("nongdan"); }}
            onDelete={handleDeleteNongDan} />
        )}
        {section === "daily" && (
          <DaiLySection list={dailyList}
            onAdd={() => { setEditDl(null); setModal("daily"); }}
            onEdit={u => { setEditDl(u); setModal("daily"); }}
            onDelete={handleDeleteDaiLy} />
        )}
        {section === "sieuthi" && (
          <SieuThiSection list={sieuThiList}
            onAdd={() => { setEditSt(null); setModal("sieuthi"); }}
            onEdit={u => { setEditSt(u); setModal("sieuthi"); }}
            onDelete={handleDeleteSieuThi} />
        )}
        {section === "trangtrai" && (
          <TrangTraiSection list={trangTraiList}
            onAdd={() => { setEditTt(null); setModal("trangtrai"); }}
            onEdit={t => { setEditTt(t); setModal("trangtrai"); }}
            onDelete={handleDeleteTrangTrai} />
        )}
        {section === "lonongsan" && <LoNongSanSection list={loNongSanList} />}
        {section === "donhang_dl" && <DonHangSection donHangDL={donHangDLList} donHangST={[]} title="🧾 Đơn hàng Đại lý → Nông dân" />}
        {section === "donhang_st" && <DonHangSection donHangDL={[]} donHangST={donHangSTList} title="🧾 Đơn hàng Siêu thị → Đại lý" />}
        {section === "profile" && <ProfileSection authUser={authUser} onSave={handleSaveProfile} />}
        {section === "logs" && (
          <LogsSection logs={logs} onClear={() => { if (window.confirm("Xóa toàn bộ log?")) { lsSave("admin_logs", []); showToast("Đã xóa log"); } }} />
        )}
      </main>

      {/* Modals */}
      {modal === "nongdan" && (
        <NongDanModal edit={editNd} onClose={() => setModal(null)}
          onSaved={() => { addLog(editNd ? `Cập nhật nông dân: ${editNd.HoTen}` : "Thêm nông dân mới"); showToast(editNd ? "Cập nhật thành công" : "Thêm thành công"); fetchAll(); }} />
      )}
      {modal === "daily" && (
        <DaiLyModal edit={editDl} onClose={() => setModal(null)}
          onSaved={() => { addLog(editDl ? `Cập nhật đại lý: ${editDl.TenDaiLy}` : "Thêm đại lý mới"); showToast(editDl ? "Cập nhật thành công" : "Thêm thành công"); fetchAll(); }} />
      )}
      {modal === "sieuthi" && (
        <SieuThiModal edit={editSt} onClose={() => setModal(null)}
          onSaved={() => { addLog(editSt ? `Cập nhật siêu thị: ${editSt.TenSieuThi}` : "Thêm siêu thị mới"); showToast(editSt ? "Cập nhật thành công" : "Thêm thành công"); fetchAll(); }} />
      )}
      {modal === "trangtrai" && (
        <TrangTraiModal edit={editTt} nongDanList={nongDanList} onClose={() => setModal(null)}
          onSaved={() => { addLog(editTt ? `Cập nhật trang trại: ${editTt.TenTrangTrai}` : "Thêm trang trại mới"); showToast(editTt ? "Cập nhật thành công" : "Thêm thành công"); fetchAll(); }} />
      )}

      {toast && <Toast msg={toast.msg} type={toast.type} />}
    </div>
  );
}
