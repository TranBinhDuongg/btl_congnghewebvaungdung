import { useState, useEffect, useCallback, ReactNode, CSSProperties } from "react";
import "./SieuThiApp.css";
import { getCurrentUser, clearCurrentUser, apiUpdateProfile } from "./AuthHelper.ts";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const API: string = (window as any)._env_?.REACT_APP_API_URL || "";

async function apiFetch(path: string, opts?: RequestInit) {
  const res = await fetch(`${API}${path}`, { headers: { "Content-Type": "application/json" }, ...opts });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Loi server");
  return data;
}

// Types
interface ApiDonHang {
  MaDonHang: number; LoaiDon: string; TrangThai: string; GhiChu?: string;
  NgayDat: string; TongSoLuong?: number; TongGiaTri?: number;
  MaSieuThi?: number; TenSieuThi?: string; MaDaiLy?: number; TenDaiLy?: string;
}
interface ApiKho {
  MaKho: number; TenKho: string; DiaChi?: string; TrangThai: string;
  MaLo?: number; TenSanPham?: string; DonViTinh?: string; SoLuong?: number; CapNhatCuoi?: string;
}
interface ChiTietRow { maLo: string; tenLo: string; soLuong: string; donGia: string; }
interface ChiTietRowEdit extends ChiTietRow { isExisting?: boolean; }
interface ChiTietDonHang { MaLo: number; TenSanPham: string; DonViTinh?: string; SoLuong: number; DonGia: number; ThanhTien: number; }

// Status
const STATUS_MAP: Record<string, { label: string; color: string; bg: string }> = {
  chua_nhan:       { label: "Chưa nhận",   color: "#b45309", bg: "#fef3c7" },
  da_nhan:         { label: "Đã nhận",     color: "#059669", bg: "#d1fae5" },
  dang_xu_ly:      { label: "Đang xử lý", color: "#7c3aed", bg: "#ede9fe" },
  hoan_thanh:      { label: "Hoàn thành", color: "#059669", bg: "#d1fae5" },
  da_huy:          { label: "Đã hủy",     color: "#dc2626", bg: "#fee2e2" },
  hoat_dong:       { label: "Hoạt động",  color: "#059669", bg: "#d1fae5" },
  ngung_hoat_dong: { label: "Ngừng HĐ",   color: "#dc2626", bg: "#fee2e2" },
};
function StatusBadge({ status }: { status: string }) {
  const s = STATUS_MAP[status] ?? { label: status, color: "#555", bg: "#f3f4f6" };
  return <span className="badge" style={{ color: s.color, background: s.bg }}>{s.label}</span>;
}

// Shared UI
function Panel({ children, className = "", style }: { children: ReactNode; className?: string; style?: CSSProperties }) {
  return <div className={`panel ${className}`} style={style}>{children}</div>;
}
function SectionTitle({ children }: { children: ReactNode }) {
  return <h3 className="panel-title">{children}</h3>;
}
function StyledTable({ headers, children }: { headers: string[]; children: ReactNode }) {
  return (
    <div className="table-container">
      <table>
        <thead><tr>{headers.map(h => (
          <th key={h}>{h}</th>
        ))}</tr></thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}
function Td({ children, className = "" }: { children?: ReactNode; className?: string }) {
  return <td className={className}>{children}</td>;
}
function ActionBtn({ children, onClick, color = "var(--primary)", disabled }: { children: ReactNode; onClick: () => void; color?: string; disabled?: boolean }) {
  return <button className="btn btn-action" onClick={onClick} disabled={disabled} style={{ background: disabled ? "#ccc" : color, marginRight: 5 }}>{children}</button>;
}
function PrimaryBtn({ children, onClick, disabled }: { children: ReactNode; onClick?: () => void; disabled?: boolean }) {
  return <button className="btn btn-primary" onClick={onClick} disabled={disabled}>{children}</button>;
}
function Modal({ title, onClose, children, wide }: { title: string; onClose: () => void; children: ReactNode; wide?: boolean }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className={`modal-content ${wide ? 'wide' : ''}`} onClick={e => e.stopPropagation()}>
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

// Nav
type Section = "dashboard" | "orders" | "receive" | "inventory" | "reports";
const NAV: { id: Section; label: string; icon: string }[] = [
  { id: "dashboard", label: "Bảng điều khiển",  icon: "🏠" },
  { id: "orders",    label: "Quản lý đơn hàng", icon: "📋" },
  { id: "receive",   label: "Nhận hàng",         icon: "📥" },
  { id: "inventory", label: "Quản lý kho",       icon: "🏪" },
  { id: "reports",   label: "Báo cáo thống kê",  icon: "📊" },
];
const PAGE_TITLES: Record<Section, string> = {
  dashboard: "Bảng điều khiển", orders: "Quản lý đơn hàng",
  receive: "Nhận hàng từ Đại lý", inventory: "Quản lý kho hàng", reports: "Báo cáo thống kê",
};

// Order Detail Modal - XEM CHI TIET DON HANG
function OrderDetailModal({ order, onClose }: { order: ApiDonHang; onClose: () => void }) {
  const [details, setDetails] = useState<ChiTietDonHang[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    apiFetch(`/api/sieuthi/donhang/${order.MaDonHang}/chi-tiet`)
      .then((d: ChiTietDonHang[]) => setDetails(Array.isArray(d) ? d : []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [order.MaDonHang]);
  return (
    <Modal title={`Chi tiết đơn hàng #${order.MaDonHang}`} onClose={onClose} wide>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16, padding: "12px 14px", background: "#f8fafc", borderRadius: 10 }}>
        <div><span className="u-text-sm u-text-muted">Đại lý</span><div className="u-font-bold u-text-dark">{order.TenDaiLy || "--"}</div></div>
        <div><span className="u-text-sm u-text-muted">Ngày đặt</span><div className="u-font-bold u-text-dark">{order.NgayDat ? new Date(order.NgayDat).toLocaleDateString("vi-VN") : "--"}</div></div>
        <div><span className="u-text-sm u-text-muted">Trạng thái</span><div style={{ marginTop: 3 }}><StatusBadge status={order.TrangThai} /></div></div>
        <div><span className="u-text-sm u-text-muted">Ghi chú</span><div className="u-font-bold u-text-dark">{order.GhiChu || "--"}</div></div>
      </div>
      {loading ? <p className="empty-msg">Đang tải...</p> : (
        <StyledTable headers={["Sản phẩm", "Đơn vị", "Số lượng", "Đơn giá", "Thành tiền"]}>
          {details.map((d, i) => (
            <tr key={i}>
              <Td><b>{d.TenSanPham}</b></Td>
              <Td className="u-text-muted">{d.DonViTinh || "--"}</Td>
              <Td>{d.SoLuong?.toLocaleString("vi-VN")}</Td>
              <Td>{d.DonGia?.toLocaleString("vi-VN")} đ</Td>
              <Td><b className="u-text-primary">{d.ThanhTien?.toLocaleString("vi-VN")} đ</b></Td>
            </tr>
          ))}
        </StyledTable>
      )}
      {details.length === 0 && !loading && <p className="empty-msg">Không có chi tiết</p>}
      <div style={{ marginTop: 14, padding: "10px 14px", background: "#f0f4ff", borderRadius: 8, display: "flex", justifyContent: "space-between" }}>
        <span className="u-font-bold u-text-dark">Tổng giá trị</span>
        <span style={{ fontWeight: 800, fontSize: 16, color: "var(--primary)" }}>{order.TongGiaTri?.toLocaleString("vi-VN")} đ</span>
      </div>
    </Modal>
  );
}

// Kho Modal - TAO / SUA KHO
function KhoModal({ kho, maSieuThi, onClose, onSaved }: { kho?: ApiKho; maSieuThi: number; onClose: () => void; onSaved: () => void }) {
  const [tenKho, setTenKho] = useState(kho?.TenKho || "");
  const [diaChi, setDiaChi] = useState(kho?.DiaChi || "");
  const [trangThai, setTrangThai] = useState(kho?.TrangThai || "hoat_dong");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  async function handleSave() {
    if (!tenKho.trim()) return setErr("Tên kho không được để trống");
    setLoading(true); setErr("");
    try {
      if (kho) {
        await apiFetch("/api/KhoHang/cap-nhat-kho", { method: "PUT", body: JSON.stringify({ MaKho: kho.MaKho, TenKho: tenKho, DiaChi: diaChi, TrangThai: trangThai }) });
      } else {
        await apiFetch("/api/KhoHang/tao-kho", { method: "POST", body: JSON.stringify({ LoaiKho: "sieuthi", MaSieuThi: maSieuThi, TenKho: tenKho, DiaChi: diaChi }) });
      }
      onSaved(); onClose();
    } catch (e: unknown) { setErr(e instanceof Error ? e.message : "Lỗi lưu kho"); }
    finally { setLoading(false); }
  }

  return (
    <Modal title={kho ? `Sửa kho: ${kho.TenKho}` : "Tạo kho mới"} onClose={onClose}>
      {err && <div className="error-msg">{err}</div>}
      <FormField label="Tên kho *"><input className="input" value={tenKho} onChange={e => setTenKho(e.target.value)} placeholder="Nhập tên kho..." /></FormField>
      <FormField label="Địa chỉ"><input className="input" value={diaChi} onChange={e => setDiaChi(e.target.value)} placeholder="Nhập địa chỉ..." /></FormField>
      {kho && (
        <FormField label="Trạng thái">
          <select className="select" value={trangThai} onChange={e => setTrangThai(e.target.value)}>
            <option value="hoat_dong">Hoạt động</option>
            <option value="ngung_hoat_dong">Ngừng hoạt động</option>
          </select>
        </FormField>
      )}
      <div className="u-flex u-justify-end u-gap-3 u-mt-3">
        <button className="btn btn-secondary" onClick={onClose}>Hủy</button>
        <PrimaryBtn onClick={handleSave} disabled={loading}>{loading ? "Đang lưu..." : "Lưu"}</PrimaryBtn>
      </div>
    </Modal>
  );
}

// Order Modal - TAO DON HANG
function OrderModal({ onClose, onSaved, maSieuThi }: { onClose: () => void; onSaved: () => void; maSieuThi: number; }) {
  const [daiLys, setDaiLys] = useState<{ MaDaiLy: number; TenDaiLy: string }[]>([]);
  const [maDaiLy, setMaDaiLy] = useState("");
  const [lots, setLots] = useState<{ MaLo: number; TenSanPham: string; SoLuongHienTai: number }[]>([]);
  const [rows, setRows] = useState<ChiTietRow[]>([{ maLo: "", tenLo: "", soLuong: "", donGia: "" }]);
  const [ghiChu, setGhiChu] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    apiFetch("/api/dai-ly/get-all")
      .then((d: { MaDaiLy: number; TenDaiLy: string }[]) => { setDaiLys(d); if (d.length) setMaDaiLy(String(d[0].MaDaiLy)); })
      .catch(() => setErr("Không tải được danh sách đại lý"));
  }, []);

  useEffect(() => {
    if (!maDaiLy) return;
    apiFetch("/api/lo-nong-san/get-all")
      .then((d: { MaLo: number; TenSanPham: string; SoLuongHienTai: number }[]) => {
        setLots(d);
        setRows([{ maLo: d[0] ? String(d[0].MaLo) : "", tenLo: d[0]?.TenSanPham || "", soLuong: "", donGia: "" }]);
      }).catch(console.error);
  }, [maDaiLy]);

  function setRow(i: number, field: keyof ChiTietRow, val: string) {
    setRows(rs => rs.map((r, idx) => {
      if (idx !== i) return r;
      if (field === "maLo") { const lot = lots.find(l => String(l.MaLo) === val); return { ...r, maLo: val, tenLo: lot?.TenSanPham || "" }; }
      return { ...r, [field]: val };
    }));
  }

  async function handleSave() {
    const valid = rows.filter(r => r.maLo && r.soLuong && r.donGia);
    if (!maDaiLy) return setErr("Vui lòng chọn đại lý");
    if (!valid.length) return setErr("Thêm ít nhất 1 lô hàng");
    setLoading(true); setErr("");
    try {
      const res = await apiFetch("/api/sieuthi/donhang/tao-don-hang", { method: "POST", body: JSON.stringify({ MaSieuThi: maSieuThi, MaDaiLy: Number(maDaiLy), GhiChu: ghiChu || null }) });
      for (const row of valid) {
        await apiFetch("/api/sieuthi/donhang/them-chi-tiet", { method: "POST", body: JSON.stringify({ MaDonHang: res.MaDonHang, MaLo: Number(row.maLo), SoLuong: Number(row.soLuong), DonGia: Number(row.donGia) }) });
      }
      onSaved(); onClose();
    } catch (e: unknown) { setErr(e instanceof Error ? e.message : "Lỗi tạo đơn hàng"); }
    finally { setLoading(false); }
  }

  return (
    <Modal title="Tạo đơn đặt hàng" onClose={onClose}>
      {err && <div className="error-msg">{err}</div>}
      <FormField label="Đại lý *">
        <select className="select" value={maDaiLy} onChange={e => setMaDaiLy(e.target.value)}>
          {daiLys.length === 0 ? <option value="">-- Đang tải... --</option> : daiLys.map(d => <option key={d.MaDaiLy} value={d.MaDaiLy}>{d.TenDaiLy}</option>)}
        </select>
      </FormField>
      <div className="u-mb-4">
        <div className="u-flex u-justify-between u-items-center u-mb-2">
          <label className="form-label">Chi tiết đơn hàng *</label>
          <button onClick={() => setRows(rs => [...rs, { maLo: lots[0] ? String(lots[0].MaLo) : "", tenLo: lots[0]?.TenSanPham || "", soLuong: "", donGia: "" }])}
            className="btn btn-secondary u-text-sm" style={{ padding: '4px 10px' }}>+ Thêm lô</button>
        </div>
        {rows.map((row, i) => (
          <div key={i} className="u-grid u-gap-2 u-mb-2 u-items-center" style={{ gridTemplateColumns: "2fr 1fr 1fr 28px" }}>
            <select className="select" value={row.maLo} onChange={e => setRow(i, "maLo", e.target.value)}>
              {lots.length === 0 ? <option value="">-- Không có lô --</option> : lots.map(l => <option key={l.MaLo} value={l.MaLo}>{l.TenSanPham} (còn {l.SoLuongHienTai} kg)</option>)}
            </select>
            <input className="input" type="number" min="0" placeholder="Số lượng" value={row.soLuong} onChange={e => setRow(i, "soLuong", e.target.value)} onWheel={e => (e.target as HTMLInputElement).blur()} />
            <input className="input" type="number" min="0" placeholder="Đơn giá" value={row.donGia} onChange={e => setRow(i, "donGia", e.target.value)} onWheel={e => (e.target as HTMLInputElement).blur()} />
            <button onClick={() => setRows(rs => rs.filter((_, idx) => idx !== i))} className="btn u-text-danger" style={{ background: 'none', padding: '8px' }}>✕</button>
          </div>
        ))}
      </div>
      <FormField label="Ghi chú"><input className="input" value={ghiChu} onChange={e => setGhiChu(e.target.value)} placeholder="Tùy chọn..." /></FormField>
      <div className="u-flex u-justify-end u-gap-3 u-mt-3">
        <button className="btn btn-secondary" onClick={onClose}>Hủy</button>
        <PrimaryBtn onClick={handleSave} disabled={loading}>{loading ? "Đang lưu..." : "Lưu đơn"}</PrimaryBtn>
      </div>
    </Modal>
  );
}

// Edit Order Modal
function EditOrderModal({ order, onClose, onSaved }: { order: ApiDonHang; onClose: () => void; onSaved: () => void; }) {
  const [lots, setLots] = useState<{ MaLo: number; TenSanPham: string; SoLuongHienTai: number }[]>([]);
  const [rows, setRows] = useState<ChiTietRowEdit[]>([]);
  const [ghiChu, setGhiChu] = useState(order.GhiChu || "");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    apiFetch(`/api/sieuthi/donhang/${order.MaDonHang}/chi-tiet`)
      .then((d: { MaLo: number; TenSanPham: string; SoLuong: number; DonGia: number }[]) => {
        setRows(Array.isArray(d) ? d.map(x => ({ maLo: String(x.MaLo), tenLo: x.TenSanPham || "", soLuong: String(x.SoLuong), donGia: String(x.DonGia), isExisting: true })) : []);
      }).catch(() => setErr("Không tải được chi tiết đơn"));
    apiFetch("/api/lo-nong-san/get-all").then((d: { MaLo: number; TenSanPham: string; SoLuongHienTai: number }[]) => setLots(d)).catch(console.error);
  }, [order.MaDonHang]);

  function setRow(i: number, field: keyof ChiTietRowEdit, val: string) {
    setRows(rs => rs.map((r, idx) => {
      if (idx !== i) return r;
      if (field === "maLo") { const lot = lots.find(l => String(l.MaLo) === val); return { ...r, maLo: val, tenLo: lot?.TenSanPham || "" }; }
      return { ...r, [field]: val };
    }));
  }

  async function handleDeleteRow(row: ChiTietRowEdit, i: number) {
    if (!row.isExisting) { setRows(rs => rs.filter((_, idx) => idx !== i)); return; }
    if (!window.confirm("Xóa lô này khỏi đơn?")) return;
    try {
      await apiFetch("/api/sieuthi/donhang/xoa-chi-tiet", { method: "DELETE", body: JSON.stringify({ MaDonHang: order.MaDonHang, MaLo: Number(row.maLo) }) });
      setRows(rs => rs.filter((_, idx) => idx !== i));
    } catch (e: unknown) { setErr(e instanceof Error ? e.message : "Lỗi xóa lô"); }
  }

  async function handleSave() {
    setLoading(true); setErr("");
    try {
      await apiFetch(`/api/sieuthi/donhang/${order.MaDonHang}/ghi-chu`, { method: "PUT", body: JSON.stringify({ GhiChu: ghiChu }) });
      for (const row of rows.filter(r => r.isExisting && r.maLo && r.soLuong && r.donGia)) {
        await apiFetch("/api/sieuthi/donhang/cap-nhat-chi-tiet", { method: "PUT", body: JSON.stringify({ MaDonHang: order.MaDonHang, MaLo: Number(row.maLo), SoLuong: Number(row.soLuong), DonGia: Number(row.donGia) }) });
      }
      for (const row of rows.filter(r => !r.isExisting && r.maLo && r.soLuong && r.donGia)) {
        await apiFetch("/api/sieuthi/donhang/them-chi-tiet", { method: "POST", body: JSON.stringify({ MaDonHang: order.MaDonHang, MaLo: Number(row.maLo), SoLuong: Number(row.soLuong), DonGia: Number(row.donGia) }) });
      }
      onSaved(); onClose();
    } catch (e: unknown) { setErr(e instanceof Error ? e.message : "Lỗi lưu đơn hàng"); }
    finally { setLoading(false); }
  }

  return (
    <Modal title={`Sửa đơn #${order.MaDonHang}`} onClose={onClose}>
      {err && <div className="error-msg">{err}</div>}
      <div className="u-bg-light u-border u-rounded-md u-mb-4 u-text-sm u-text-muted" style={{ padding: "12px 16px" }}>Đại lý: <b className="u-text-primary">{order.TenDaiLy || "--"}</b></div>
      <div className="u-mb-4">
        <div className="u-flex u-justify-between u-items-center u-mb-2">
          <label className="form-label">Chi tiết đơn hàng</label>
          <button onClick={() => setRows(rs => [...rs, { maLo: lots[0] ? String(lots[0].MaLo) : "", tenLo: lots[0]?.TenSanPham || "", soLuong: "", donGia: "", isExisting: false }])}
            className="btn btn-secondary u-text-sm" style={{ padding: '4px 10px' }}>+ Thêm lô</button>
        </div>
        {rows.map((row, i) => (
          <div key={i} className="u-grid u-gap-2 u-mb-2 u-items-center" style={{ gridTemplateColumns: "2fr 1fr 1fr 28px" }}>
            {row.isExisting
              ? <div className="input u-bg-light u-text-muted">{row.tenLo || `Lô #${row.maLo}`}</div>
              : <select className="select" value={row.maLo} onChange={e => setRow(i, "maLo", e.target.value)}>
                  {lots.map(l => <option key={l.MaLo} value={l.MaLo}>{l.TenSanPham}</option>)}
                </select>
            }
            <input className="input" type="number" min="0" placeholder="Số lượng" value={row.soLuong} onChange={e => setRow(i, "soLuong", e.target.value)} onWheel={e => (e.target as HTMLInputElement).blur()} />
            <input className="input" type="number" min="0" placeholder="Đơn giá" value={row.donGia} onChange={e => setRow(i, "donGia", e.target.value)} onWheel={e => (e.target as HTMLInputElement).blur()} />
            <button onClick={() => handleDeleteRow(row, i)} className="btn u-text-danger" style={{ background: 'none', padding: '8px' }}>✕</button>
          </div>
        ))}
        {rows.length === 0 && <p className="empty-msg" style={{ padding: '12px 0' }}>Chưa có lô nào</p>}
      </div>
      <FormField label="Ghi chú"><input className="input" value={ghiChu} onChange={e => setGhiChu(e.target.value)} placeholder="Tùy chọn..." /></FormField>
      <div className="u-flex u-justify-end u-gap-3 u-mt-3">
        <button className="btn btn-secondary" onClick={onClose}>Hủy</button>
        <PrimaryBtn onClick={handleSave} disabled={loading}>{loading ? "Đang lưu..." : "Lưu đơn"}</PrimaryBtn>
      </div>
    </Modal>
  );
}

// Main App
export default function SieuThiApp() {
  const authUser = getCurrentUser();
  const fullName = authUser?.tenHienThi || "";

  useEffect(() => {
    if (!authUser || authUser.role !== "sieuthi") window.location.href = "/login";
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [section, setSection] = useState<Section>("dashboard");
  const [modal, setModal] = useState<string | null>(null);
  const [editOrder, setEditOrder] = useState<ApiDonHang | null>(null);
  const [detailOrder, setDetailOrder] = useState<ApiDonHang | null>(null);
  const [editKho, setEditKho] = useState<ApiKho | undefined>(undefined);

  const [apiOrders, setApiOrders] = useState<ApiDonHang[]>([]);
  const [apiOrdersLoading, setApiOrdersLoading] = useState(false);
  const [apiOrdersErr, setApiOrdersErr] = useState("");
  const [orderSearch, setOrderSearch] = useState("");
  const [orderStatusFilter, setOrderStatusFilter] = useState("all");

  const [khoList, setKhoList] = useState<ApiKho[]>([]);
  const [khoLoading, setKhoLoading] = useState(false);

  const [profileForm, setProfileForm] = useState({ hoTen: fullName, sdt: authUser?.soDienThoai || "", email: authUser?.email || "", diaChi: authUser?.diaChi || "" });
  const [profileErr, setProfileErr] = useState("");
  const [profileLoading, setProfileLoading] = useState(false);

  const loadApiOrders = useCallback(async () => {
    if (!authUser?.maDoiTuong) return;
    setApiOrdersLoading(true); setApiOrdersErr("");
    try {
      const data = await apiFetch(`/api/sieuthi/donhang/sieu-thi/${authUser.maDoiTuong}`);
      setApiOrders(Array.isArray(data) ? data : []);
    } catch (e: unknown) { setApiOrdersErr(e instanceof Error ? e.message : "Lỗi tải đơn hàng"); }
    finally { setApiOrdersLoading(false); }
  }, [authUser?.maDoiTuong]);

  const loadKho = useCallback(async () => {
    if (!authUser?.maDoiTuong) return;
    setKhoLoading(true);
    try {
      const data = await apiFetch(`/api/KhoHang/sieu-thi/${authUser.maDoiTuong}`);
      setKhoList(Array.isArray(data) ? data : []);
    } catch { setKhoList([]); }
    finally { setKhoLoading(false); }
  }, [authUser?.maDoiTuong]);

  useEffect(() => { loadApiOrders(); loadKho(); }, [loadApiOrders, loadKho]);

  const huyDonHang = async (id: number) => {
    if (!window.confirm("Hủy đơn hàng này?")) return;
    try { await apiFetch(`/api/sieuthi/donhang/huy-don-hang/${id}`, { method: "PUT" }); loadApiOrders(); }
    catch (e: unknown) { alert(e instanceof Error ? e.message : "Lỗi hủy đơn"); }
  };

  const handleDeleteOrder = async (id: number) => {
    if (!window.confirm("Xóa đơn hàng này? Chỉ xóa được đơn chưa nhận.")) return;
    try { await apiFetch(`/api/sieuthi/donhang/${id}`, { method: "DELETE" }); loadApiOrders(); }
    catch (e: unknown) { alert(e instanceof Error ? e.message : "Lỗi xóa đơn"); }
  };

  const handleNhanHang = async (id: number) => {
    if (!window.confirm("Xác nhận đã nhận hàng?")) return;
    try { await apiFetch(`/api/sieuthi/donhang/nhan-hang/${id}`, { method: "PUT" }); loadApiOrders(); loadKho(); }
    catch (e: unknown) { alert(e instanceof Error ? e.message : "Lỗi nhận hàng"); }
  };

  const handleXoaKho = async (maKho: number) => {
    if (!window.confirm("Xóa kho này?")) return;
    try { await apiFetch(`/api/KhoHang/xoa-kho/${maKho}`, { method: "DELETE" }); loadKho(); }
    catch (e: unknown) { alert(e instanceof Error ? e.message : "Lỗi xóa kho"); }
  };

  async function saveProfile() {
    if (!profileForm.hoTen) return setProfileErr("Họ tên không được để trống");
    if (!authUser) return setProfileErr("Phiên đăng nhập hết hạn");
    setProfileLoading(true); setProfileErr("");
    try {
      await apiUpdateProfile({ maTaiKhoan: authUser.maTaiKhoan, hoTen: profileForm.hoTen, soDienThoai: profileForm.sdt, email: profileForm.email, diaChi: profileForm.diaChi });
      setModal(null);
    } catch (e: unknown) { setProfileErr(e instanceof Error ? e.message : "Lỗi cập nhật"); }
    finally { setProfileLoading(false); }
  }

  const tongDon = apiOrders.length;
  const daNhan = apiOrders.filter(o => o.TrangThai === "da_nhan").length;
  const chuaNhan = apiOrders.filter(o => o.TrangThai === "chua_nhan").length;
  const daHuy = apiOrders.filter(o => o.TrangThai === "da_huy").length;
  const tongTonKho = khoList.reduce((s, k) => s + (k.SoLuong || 0), 0);
  const tongGiaTriDaNhan = apiOrders.filter(o => o.TrangThai === "da_nhan").reduce((s, o) => s + (o.TongGiaTri || 0), 0);

  const filteredOrders = apiOrders.filter(o => {
    const matchSearch = !orderSearch || (o.TenDaiLy || "").toLowerCase().includes(orderSearch.toLowerCase()) || String(o.MaDonHang).includes(orderSearch);
    const matchStatus = orderStatusFilter === "all" || o.TrangThai === orderStatusFilter;
    return matchSearch && matchStatus;
  });

  const daiLyStats = apiOrders.reduce((acc, o) => {
    const key = o.TenDaiLy || "Khong ro";
    if (!acc[key]) acc[key] = { tongDon: 0, tongGiaTri: 0, daNhan: 0 };
    acc[key].tongDon++;
    acc[key].tongGiaTri += o.TongGiaTri || 0;
    if (o.TrangThai === "da_nhan") acc[key].daNhan++;
    return acc;
  }, {} as Record<string, { tongDon: number; tongGiaTri: number; daNhan: number }>);

  return (
    <div className="sieuthi-app">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="logo">🛒 Siêu Thị</div>
          <div className="logo-sub">Quản lý bán lẻ</div>
        </div>
        <nav className="nav-list">
          {NAV.map(n => (
            <button key={n.id} onClick={() => setSection(n.id)} className={`nav-item ${section === n.id ? 'active' : ''}`}>
              <span className="nav-icon">{n.icon}</span><span>{n.label}</span>
            </button>
          ))}
        </nav>
        <div className="sidebar-footer">
          <button className="profile-btn" onClick={() => setModal("profile")}>
            <div className="avatar">{fullName?.charAt(0).toUpperCase() || "S"}</div>
            <div>
              <div className="u-font-bold u-text-sm">{fullName}</div>
              <div className="u-text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>Siêu thị</div>
            </div>
          </button>
          <button className="logout-btn" onClick={() => { clearCurrentUser(); window.location.href = "/login"; }}>
            🚪 Đăng xuất
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="main-content">
        <div className="page-header u-flex u-justify-between u-items-center">
          <div>
            <h2 className="page-title">{PAGE_TITLES[section]}</h2>
            <p className="page-subtitle">Xin chào, {fullName}</p>
          </div>
          {section === "orders" && <PrimaryBtn onClick={() => setModal("order")}>+ Tạo đơn hàng</PrimaryBtn>}
          {section === "inventory" && <PrimaryBtn onClick={() => { setEditKho(undefined); setModal("kho"); }}>+ Tạo kho mới</PrimaryBtn>}
        </div>

        {/* Dashboard */}
        {section === "dashboard" && (
          <div className="u-fade-in">
            <div className="stat-grid">
              {[
                { icon: "📋", label: "Tổng đơn hàng", value: tongDon,    color: "var(--primary)" },
                { icon: "📥", label: "Chờ nhận",      value: chuaNhan,   color: "#b45309" },
                { icon: "✅", label: "Đã nhận",        value: daNhan,     color: "#059669" },
                { icon: "🏪", label: "Tồn kho (kg)",   value: tongTonKho, color: "#7c3aed" },
              ].map(k => (
                <div key={k.label} className="stat-card" style={{ "--accent": k.color } as any}>
                  <div className="stat-icon">{k.icon}</div>
                  <div>
                    <div className="stat-value">{k.value.toLocaleString("vi-VN")}</div>
                    <div className="stat-label">{k.label}</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="u-grid u-grid-2-col u-gap-5">
              <Panel>
                <SectionTitle>Đơn hàng gần đây</SectionTitle>
                <StyledTable headers={["Mã đơn", "Đại lý", "Tổng giá trị", "Ngày đặt", "Trạng thái"]}>
                  {apiOrders.slice(0, 6).map(o => (
                    <tr key={o.MaDonHang} style={{ cursor: "pointer" }} onClick={() => { setDetailOrder(o); setModal("detail"); }}>
                      <Td><code className="u-text-sm u-text-primary u-font-bold">#{o.MaDonHang}</code></Td>
                      <Td>{o.TenDaiLy || "--"}</Td>
                      <Td className="u-text-primary u-font-bold">{o.TongGiaTri ? o.TongGiaTri.toLocaleString("vi-VN") + " đ" : "--"}</Td>
                      <Td className="u-text-muted u-text-sm">{o.NgayDat ? new Date(o.NgayDat).toLocaleDateString("vi-VN") : "--"}</Td>
                      <Td><StatusBadge status={o.TrangThai} /></Td>
                    </tr>
                  ))}
                </StyledTable>
                {apiOrders.length === 0 && !apiOrdersLoading && <p className="empty-msg">Chưa có đơn hàng</p>}
              </Panel>
              <Panel>
                <SectionTitle>Tình trạng kho</SectionTitle>
                {khoList.length === 0 ? (
                  <p className="empty-msg">Chưa có kho nào</p>
                ) : (
                  <div className="u-flex u-flex-col u-gap-3">
                    {Array.from(new Set(khoList.map(k => k.MaKho))).slice(0, 5).map(maKho => {
                      const items = khoList.filter(k => k.MaKho === maKho);
                      const tenKho = items[0]?.TenKho || "--";
                      const tongSL = items.reduce((s, k) => s + (k.SoLuong || 0), 0);
                      return (
                        <div key={maKho} className="u-bg-light u-rounded-md u-border" style={{ padding: "10px 14px" }}>
                          <div className="u-flex u-justify-between u-items-center">
                            <span className="u-font-bold u-text-dark">🏪 {tenKho}</span>
                            <span className="badge" style={{ background: "rgba(37,99,235,0.1)", color: "var(--primary)" }}>{tongSL.toLocaleString("vi-VN")} kg</span>
                          </div>
                          <div className="u-text-sm u-text-muted u-mt-1">{items.filter(k => k.TenSanPham).length} loại sản phẩm</div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </Panel>
            </div>
          </div>
        )}

        {/* Orders */}
        {section === "orders" && (
          <Panel>
            <div className="u-flex u-flex-wrap u-gap-3 u-items-center u-mb-4">
              <input className="input" style={{ width: 220, flex: "none" }} placeholder="Tìm đại lý, mã đơn..." value={orderSearch} onChange={e => setOrderSearch(e.target.value)} />
              <select className="select" style={{ width: 160, flex: "none" }} value={orderStatusFilter} onChange={e => setOrderStatusFilter(e.target.value)}>
                <option value="all">Tất cả trạng thái</option>
                <option value="chua_nhan">Chưa nhận</option>
                <option value="da_nhan">Đã nhận</option>
                <option value="da_huy">Đã hủy</option>
              </select>
              <span className="u-text-sm u-text-muted">{filteredOrders.length} đơn</span>
            </div>
            {apiOrdersLoading && <p className="empty-msg">Đang tải...</p>}
            {apiOrdersErr && <p className="error-msg">{apiOrdersErr}</p>}
            <StyledTable headers={["Mã đơn", "Đại lý", "Tổng SL", "Tổng giá trị", "Ghi chú", "Ngày đặt", "Trạng thái", ""]}>
              {filteredOrders.map(o => (
                <tr key={o.MaDonHang}>
                  <Td>
                    <span className="u-text-primary u-font-bold u-text-sm" style={{ cursor: "pointer" }} onClick={() => { setDetailOrder(o); setModal("detail"); }}>#{o.MaDonHang}</span>
                  </Td>
                  <Td>{o.TenDaiLy || "--"}</Td>
                  <Td>{o.TongSoLuong != null ? o.TongSoLuong.toLocaleString("vi-VN") : "--"}</Td>
                  <Td className="u-text-primary u-font-bold">{o.TongGiaTri ? o.TongGiaTri.toLocaleString("vi-VN") + " đ" : "--"}</Td>
                  <Td className="u-text-muted u-text-sm">{o.GhiChu || "--"}</Td>
                  <Td className="u-text-muted u-text-sm">{o.NgayDat ? new Date(o.NgayDat).toLocaleDateString("vi-VN") : "--"}</Td>
                  <Td><StatusBadge status={o.TrangThai} /></Td>
                  <Td>
                    <ActionBtn onClick={() => { setDetailOrder(o); setModal("detail"); }} color="#6366f1">🔍 Chi tiết</ActionBtn>
                    {o.TrangThai === "chua_nhan" && (
                      <>
                        <ActionBtn onClick={() => { setEditOrder(o); setModal("editOrder"); }} color="var(--primary)">Sửa</ActionBtn>
                        <ActionBtn onClick={() => handleNhanHang(o.MaDonHang)} color="#059669">Nhận</ActionBtn>
                        <ActionBtn onClick={() => huyDonHang(o.MaDonHang)} color="#f59e0b">Hủy</ActionBtn>
                        <ActionBtn onClick={() => handleDeleteOrder(o.MaDonHang)} color="#dc2626">Xóa</ActionBtn>
                      </>
                    )}
                  </Td>
                </tr>
              ))}
            </StyledTable>
            {filteredOrders.length === 0 && !apiOrdersLoading && <p className="empty-msg">Không có đơn hàng nào</p>}
          </Panel>
        )}

        {/* Receive */}
        {section === "receive" && (
          <div className="u-fade-in">
            <div className="stat-grid">
              <div className="stat-card" style={{ "--accent": "#b45309" } as any}>
                <div className="stat-icon">📥</div>
                <div><div className="stat-value">{chuaNhan}</div><div className="stat-label">Chờ nhận</div></div>
              </div>
              <div className="stat-card" style={{ "--accent": "#059669" } as any}>
                <div className="stat-icon">✅</div>
                <div><div className="stat-value">{apiOrders.filter(o => o.TrangThai === "da_nhan" && o.NgayDat && new Date(o.NgayDat).toDateString() === new Date().toDateString()).length}</div><div className="stat-label">Đã nhận hôm nay</div></div>
              </div>
            </div>
            <Panel>
              <SectionTitle>Đơn hàng đang chờ nhận</SectionTitle>
              <StyledTable headers={["Mã đơn", "Đại lý", "Tổng SL (kg)", "Tổng giá trị", "Ngày đặt", "Trạng thái", ""]}>
                {apiOrders.filter(o => o.TrangThai === "chua_nhan").map(o => (
                  <tr key={o.MaDonHang}>
                    <Td>
                      <span className="u-text-primary u-font-bold u-text-sm" style={{ cursor: "pointer" }} onClick={() => { setDetailOrder(o); setModal("detail"); }}>#{o.MaDonHang}</span>
                    </Td>
                    <Td><b>{o.TenDaiLy || "--"}</b></Td>
                    <Td>{o.TongSoLuong != null ? o.TongSoLuong.toLocaleString("vi-VN") : "--"}</Td>
                    <Td className="u-text-primary u-font-bold">{o.TongGiaTri ? o.TongGiaTri.toLocaleString("vi-VN") + " đ" : "--"}</Td>
                    <Td className="u-text-muted u-text-sm">{o.NgayDat ? new Date(o.NgayDat).toLocaleDateString("vi-VN") : "--"}</Td>
                    <Td><StatusBadge status={o.TrangThai} /></Td>
                    <Td>
                      <ActionBtn onClick={() => { setDetailOrder(o); setModal("detail"); }} color="#6366f1">🔍 Chi tiết</ActionBtn>
                      <ActionBtn onClick={() => handleNhanHang(o.MaDonHang)} color="#059669">Xác nhận nhận hàng</ActionBtn>
                    </Td>
                  </tr>
                ))}
              </StyledTable>
              {apiOrders.filter(o => o.TrangThai === "chua_nhan").length === 0 && (
                <p className="empty-msg">Không có đơn hàng chờ nhận</p>
              )}
            </Panel>
          </div>
        )}

        {/* Inventory */}
        {section === "inventory" && (
          <div className="u-fade-in">
            <div className="stat-grid">
              <div className="stat-card" style={{ "--accent": "var(--primary)" } as any}>
                <div className="stat-icon">🏠</div>
                <div><div className="stat-value">{Array.from(new Set(khoList.map(k => k.MaKho))).length}</div><div className="stat-label">Số kho</div></div>
              </div>
              <div className="stat-card" style={{ "--accent": "#7c3aed" } as any}>
                <div className="stat-icon">📦</div>
                <div><div className="stat-value">{tongTonKho.toLocaleString("vi-VN")}</div><div className="stat-label">Tổng tồn kho (kg)</div></div>
              </div>
              <div className="stat-card" style={{ "--accent": "#059669" } as any}>
                <div className="stat-icon">🌿</div>
                <div><div className="stat-value">{new Set(khoList.map(k => k.TenSanPham).filter(Boolean)).size}</div><div className="stat-label">Loại sản phẩm</div></div>
              </div>
            </div>
            {khoLoading && <p className="empty-msg">Đang tải...</p>}
            {Array.from(new Set(khoList.map(k => k.MaKho))).map(maKho => {
              const items = khoList.filter(k => k.MaKho === maKho);
              const khoInfo = items[0];
              return (
                <Panel key={maKho} className="u-mb-4">
                  <div className="u-flex u-justify-between u-items-center u-mb-3">
                    <div>
                      <span className="u-font-black u-text-dark">🏪 {khoInfo?.TenKho}</span>
                      {khoInfo?.DiaChi && <span className="u-text-sm u-text-muted" style={{ marginLeft: 10 }}>📍 {khoInfo.DiaChi}</span>}
                      <span style={{ marginLeft: 10 }}><StatusBadge status={khoInfo?.TrangThai || "hoat_dong"} /></span>
                    </div>
                    <div className="u-flex u-gap-2">
                      <ActionBtn onClick={() => { setEditKho(khoInfo); setModal("kho"); }} color="var(--primary)">Sửa</ActionBtn>
                      <ActionBtn onClick={() => handleXoaKho(maKho)} color="#dc2626">Xóa</ActionBtn>
                    </div>
                  </div>
                  <StyledTable headers={["Sản phẩm", "Đơn vị", "Số lượng", "Cập nhật cuối"]}>
                    {items.filter(k => k.TenSanPham).map((k, i) => (
                      <tr key={`${k.MaKho}-${k.MaLo}-${i}`}>
                        <Td><b>{k.TenSanPham}</b></Td>
                        <Td className="u-text-muted">{k.DonViTinh || "--"}</Td>
                        <Td>
                          <span className="badge" style={{ background: (k.SoLuong || 0) > 0 ? "rgba(37,99,235,0.1)" : "#fee2e2", color: (k.SoLuong || 0) > 0 ? "var(--primary)" : "var(--danger)" }}>
                            {(k.SoLuong || 0).toLocaleString("vi-VN")}
                          </span>
                        </Td>
                        <Td className="u-text-muted u-text-sm">{k.CapNhatCuoi ? new Date(k.CapNhatCuoi).toLocaleDateString("vi-VN") : "--"}</Td>
                      </tr>
                    ))}
                    {items.filter(k => k.TenSanPham).length === 0 && (
                      <tr><td colSpan={4} className="empty-msg">Kho trống</td></tr>
                    )}
                  </StyledTable>
                </Panel>
              );
            })}
            {khoList.length === 0 && !khoLoading && (
              <Panel><p className="empty-msg">Chưa có kho nào. Nhấn "+ Tạo kho mới" để bắt đầu.</p></Panel>
            )}
          </div>
        )}

        {/* Reports */}
        {section === "reports" && (
          <div className="u-fade-in">
            <div className="stat-grid">
              {[
                { icon: "📋", label: "Tổng đơn hàng",   value: `${tongDon} đơn`,                                 color: "var(--primary)" },
                { icon: "✅", label: "Đã nhận",           value: `${daNhan} đơn`,                                 color: "#059669" },
                { icon: "⏳", label: "Chờ nhận",          value: `${chuaNhan} đơn`,                               color: "#b45309" },
                { icon: "❌", label: "Đã hủy",            value: `${daHuy} đơn`,                                  color: "#dc2626" },
                { icon: "💰", label: "Giá trị đã nhận",  value: tongGiaTriDaNhan.toLocaleString("vi-VN") + " đ", color: "#7c3aed" },
                { icon: "🏪", label: "Tồn kho",           value: `${tongTonKho.toLocaleString("vi-VN")} kg`,      color: "#0891b2" },
              ].map(c => (
                <div key={c.label} className="stat-card" style={{ "--accent": c.color } as any}>
                  <div className="stat-icon">{c.icon}</div>
                  <div>
                    <div className="stat-value" style={{ fontSize: 20 }}>{c.value}</div>
                    <div className="stat-label">{c.label}</div>
                  </div>
                </div>
              ))}
            </div>
            <Panel style={{ marginBottom: 20 }}>
              <SectionTitle>Thống kê theo đại lý</SectionTitle>
              <StyledTable headers={["Đại lý", "Tổng đơn", "Đã nhận", "Tỉ lệ nhận", "Tổng giá trị"]}>
                {Object.entries(daiLyStats).sort((a, b) => b[1].tongGiaTri - a[1].tongGiaTri).map(([tenDaiLy, stats]) => (
                  <tr key={tenDaiLy}>
                    <Td><b>{tenDaiLy}</b></Td>
                    <Td>{stats.tongDon}</Td>
                    <Td><span style={{ color: "#059669", fontWeight: 700 }}>{stats.daNhan}</span></Td>
                    <Td>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ flex: 1, height: 6, background: "#f0f4ff", borderRadius: 3, overflow: "hidden" }}>
                          <div style={{ height: "100%", width: `${stats.tongDon ? (stats.daNhan / stats.tongDon) * 100 : 0}%`, background: "#059669", borderRadius: 3 }} />
                        </div>
                        <span style={{ fontSize: 11, color: "#888", whiteSpace: "nowrap" }}>{stats.tongDon ? Math.round((stats.daNhan / stats.tongDon) * 100) : 0}%</span>
                      </div>
                    </Td>
                    <Td className="u-text-primary u-font-bold">{stats.tongGiaTri.toLocaleString("vi-VN")} đ</Td>
                  </tr>
                ))}
                {Object.keys(daiLyStats).length === 0 && (
                  <tr><td colSpan={5} className="empty-msg">Chưa có dữ liệu</td></tr>
                )}
              </StyledTable>
            </Panel>
            <Panel>
              <SectionTitle>Lịch sử đơn hàng</SectionTitle>
              <StyledTable headers={["Mã đơn", "Đại lý", "Tổng SL", "Tổng giá trị", "Ngày đặt", "Trạng thái"]}>
                {apiOrders.map(o => (
                  <tr key={o.MaDonHang} style={{ cursor: "pointer" }} onClick={() => { setDetailOrder(o); setModal("detail"); }}>
                    <Td><code className="u-text-sm u-text-muted">#{o.MaDonHang}</code></Td>
                    <Td>{o.TenDaiLy || "--"}</Td>
                    <Td>{o.TongSoLuong != null ? o.TongSoLuong.toLocaleString("vi-VN") : "--"}</Td>
                    <Td className="u-text-primary u-font-bold">{o.TongGiaTri ? o.TongGiaTri.toLocaleString("vi-VN") + " đ" : "--"}</Td>
                    <Td className="u-text-muted u-text-sm">{o.NgayDat ? new Date(o.NgayDat).toLocaleDateString("vi-VN") : "--"}</Td>
                    <Td><StatusBadge status={o.TrangThai} /></Td>
                  </tr>
                ))}
              </StyledTable>
              {apiOrders.length === 0 && <p className="empty-msg">Chưa có dữ liệu</p>}
            </Panel>
          </div>
        )}
      </main>

      {/* Modals */}
      {modal === "order" && authUser?.maDoiTuong && (
        <OrderModal maSieuThi={authUser.maDoiTuong} onClose={() => setModal(null)} onSaved={loadApiOrders} />
      )}
      {modal === "editOrder" && editOrder && (
        <EditOrderModal order={editOrder} onClose={() => { setModal(null); setEditOrder(null); }} onSaved={loadApiOrders} />
      )}
      {modal === "detail" && detailOrder && (
        <OrderDetailModal order={detailOrder} onClose={() => { setModal(null); setDetailOrder(null); }} />
      )}
      {modal === "kho" && authUser?.maDoiTuong && (
        <KhoModal kho={editKho} maSieuThi={authUser.maDoiTuong} onClose={() => { setModal(null); setEditKho(undefined); }} onSaved={loadKho} />
      )}
      {modal === "profile" && (
        <Modal title="Thông tin cá nhân" onClose={() => setModal(null)}>
          {[["Họ tên", fullName], ["Vai trò", "Siêu thị"], ["Email", authUser?.email || "--"], ["Số điện thoại", authUser?.soDienThoai || "--"], ["Địa chỉ", authUser?.diaChi || "--"]].map(([k, v]) => (
            <div key={k} className="u-flex u-justify-between u-border-b" style={{ padding: "10px 0" }}>
              <span className="u-text-sm u-text-muted u-font-medium">{k}</span>
              <span className="u-text-sm u-font-bold u-text-dark">{v}</span>
            </div>
          ))}
          <button className="btn btn-primary u-mt-4" style={{ width: "100%" }} onClick={() => setModal("edit-profile")}>Sửa thông tin</button>
        </Modal>
      )}
      {modal === "edit-profile" && (
        <Modal title="Sửa thông tin cá nhân" onClose={() => setModal(null)}>
          {profileErr && <div className="error-msg">{profileErr}</div>}
          <FormField label="Họ tên *"><input className="input" value={profileForm.hoTen} onChange={e => setProfileForm(p => ({ ...p, hoTen: e.target.value }))} /></FormField>
          <FormField label="Số điện thoại"><input className="input" value={profileForm.sdt} onChange={e => setProfileForm(p => ({ ...p, sdt: e.target.value }))} /></FormField>
          <FormField label="Email"><input className="input" type="email" value={profileForm.email} onChange={e => setProfileForm(p => ({ ...p, email: e.target.value }))} /></FormField>
          <FormField label="Địa chỉ"><input className="input" value={profileForm.diaChi} onChange={e => setProfileForm(p => ({ ...p, diaChi: e.target.value }))} /></FormField>
          <div className="u-flex u-justify-end u-gap-3 u-mt-6 u-border-t u-py-6">
            <button className="btn btn-secondary" onClick={() => setModal(null)}>Hủy</button>
            <PrimaryBtn onClick={saveProfile} disabled={profileLoading}>{profileLoading ? "Đang lưu..." : "Lưu"}</PrimaryBtn>
          </div>
        </Modal>
      )}
    </div>
  );
}
