import { useState, useEffect, useCallback, ReactNode, CSSProperties } from "react";
import { getCurrentUser, clearCurrentUser, apiUpdateProfile } from "./AuthHelper.ts";

const API = process.env.REACT_APP_API_URL || "";

// ─── API helpers ──────────────────────────────────────────────────────────────
async function apiFetch(path: string, opts?: RequestInit) {
  const res = await fetch(`${API}${path}`, { headers: { "Content-Type": "application/json" }, ...opts });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Lỗi server");
  return data;
}

// ─── Types ────────────────────────────────────────────────────────────────────
// API order type (từ DB)
interface ApiDonHang {
  MaDonHang: number; LoaiDon: string; TrangThai: string; GhiChu?: string;
  NgayDat: string; TongSoLuong?: number; TongGiaTri?: number;
  MaSieuThi?: number; TenSieuThi?: string; MaDaiLy?: number; TenDaiLy?: string;
}

interface Order {
  uid: string; maPhieu: string; maLo: string; sanPham: string; soLuong: number;
  khoNhap?: string; toDaily?: string; toDailyAgency?: string;
  fromSieuthiId?: string | number; status: string; ngayTao: string;
}
interface LoHang { maLo: string; sanPham: string; soLuong: number; ngayTao: string; }
interface KiemDinh {
  maKiemDinh: string; maLo: string; ngayKiem: string;
  nguoiKiem: string; ketQua: string; ghiChu?: string;
}
interface RetailOrder extends Order { toSieuthi?: string; }
interface DB { orders: Order[]; lohang: LoHang[]; kiemDinh: KiemDinh[]; }

// ─── Colors ───────────────────────────────────────────────────────────────────
const C = {
  primary:  "#2563eb",
  dark:     "#0f1e3d",
  darker:   "#080f1f",
  accent:   "#3b82f6",
  light:    "#eff6ff",
  mist:     "#f8faff",
  white:    "#ffffff",
};

// ─── Storage ──────────────────────────────────────────────────────────────────
const getKey = (k: string, id: string) => `user_${id}_${k}`;
const loadKey = <T,>(k: string, id: string, fb: T): T => {
  try { return JSON.parse(localStorage.getItem(getKey(k, id)) || "null") ?? fb; } catch { return fb; }
};
const saveKey = (k: string, id: string, v: unknown) => localStorage.setItem(getKey(k, id), JSON.stringify(v));

// ─── Status ───────────────────────────────────────────────────────────────────
const STATUS_MAP: Record<string, { label: string; color: string; bg: string }> = {
  pending:    { label: "Chờ xử lý",  color: "#b45309", bg: "#fef3c7" },
  shipped:    { label: "Đang giao",  color: "#7c3aed", bg: "#ede9fe" },
  received:   { label: "Đã nhận",   color: "#059669", bg: "#d1fae5" },
  delivered:  { label: "Đã giao",   color: "#059669", bg: "#d1fae5" },
  "in-transit": { label: "Vận chuyển", color: "#1d4ed8", bg: "#dbeafe" },
};
function StatusBadge({ status }: { status: string }) {
  const s = STATUS_MAP[status?.toLowerCase()] ?? { label: status, color: "#555", bg: "#f3f4f6" };
  return <span style={{ display: "inline-block", padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700, letterSpacing: 0.4, color: s.color, background: s.bg }}>{s.label}</span>;
}

// ─── Shared UI ────────────────────────────────────────────────────────────────
function Panel({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return <div style={{ background: C.white, borderRadius: 14, padding: 20, boxShadow: "0 1px 8px #0000000a", ...style }}>{children}</div>;
}
function SectionTitle({ children }: { children: ReactNode }) {
  return <h4 style={{ fontSize: 14, fontWeight: 700, color: C.dark, marginBottom: 14, letterSpacing: 0.2 }}>{children}</h4>;
}
function StyledTable({ headers, children }: { headers: string[]; children: ReactNode }) {
  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
        <thead><tr>{headers.map(h => (
          <th key={h} style={{ textAlign: "left", padding: "8px 12px", background: "#f0f4ff", color: C.dark, fontWeight: 700, fontSize: 10, textTransform: "uppercase", letterSpacing: 0.6, whiteSpace: "nowrap" }}>{h}</th>
        ))}</tr></thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}
function Td({ children, style }: { children?: ReactNode; style?: CSSProperties }) {
  return <td style={{ padding: "10px 12px", verticalAlign: "middle", borderBottom: "1px solid #f0f4ff", ...style }}>{children}</td>;
}
function ActionBtn({ children, onClick, color = C.primary }: { children: ReactNode; onClick: () => void; color?: string }) {
  return <button onClick={onClick} style={{ marginRight: 5, padding: "4px 10px", background: color, color: "#fff", border: "none", borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: "pointer" }}>{children}</button>;
}
function PrimaryBtn({ children, onClick }: { children: ReactNode; onClick?: () => void }) {
  return <button onClick={onClick} style={{ padding: "9px 18px", background: `linear-gradient(135deg,${C.primary},#1d4ed8)`, color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 700, fontSize: 13, letterSpacing: 0.3 }}>{children}</button>;
}

// ─── Modal ────────────────────────────────────────────────────────────────────
function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2000 }} onClick={onClose}>
      <div style={{ background: C.white, borderRadius: 16, padding: 28, width: 500, maxWidth: "94vw", maxHeight: "88vh", overflowY: "auto", position: "relative", boxShadow: "0 8px 40px #0003" }} onClick={e => e.stopPropagation()}>
        <button onClick={onClose} style={{ position: "absolute", top: 12, right: 14, background: "none", border: "none", fontSize: 22, cursor: "pointer", color: "#aaa" }}>✕</button>
        <h3 style={{ marginBottom: 18, color: C.dark, fontWeight: 800, fontSize: 17 }}>{title}</h3>
        {children}
      </div>
    </div>
  );
}
function FormField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#555", marginBottom: 5 }}>{label}</label>
      {children}
    </div>
  );
}
const inp: CSSProperties = { width: "100%", padding: "8px 10px", border: "1.5px solid #dbeafe", borderRadius: 8, fontSize: 13, outline: "none", fontFamily: "inherit", background: C.mist, boxSizing: "border-box" };

// ─── Nav ──────────────────────────────────────────────────────────────────────
type Section = "dashboard" | "orders" | "receive" | "inventory" | "reports";
const NAV: { id: Section; label: string; icon: string }[] = [
  { id: "dashboard",  label: "Bảng điều khiển",  icon: "🏠" },
  { id: "orders",     label: "Quản lý đơn hàng", icon: "📋" },
  { id: "receive",    label: "Nhận hàng",         icon: "📥" },
  { id: "inventory",  label: "Quản lý kho",       icon: "🏪" },
  { id: "reports",    label: "Báo cáo thống kê",  icon: "📊" },
];
const PAGE_TITLES: Record<Section, string> = {
  dashboard: "Bảng điều khiển", orders: "Quản lý đơn hàng",
  receive: "Nhận hàng từ Đại lý", inventory: "Quản lý kho hàng", reports: "Báo cáo thống kê",
};

// ─── Order Modal ──────────────────────────────────────────────────────────────
interface ChiTietRow { maLo: string; tenLo: string; soLuong: string; donGia: string; }

function OrderModal({ onClose, onSaved, maSieuThi }: {
  onClose: () => void; onSaved: () => void; maSieuThi: number;
}) {
  const [daiLys, setDaiLys] = useState<{ MaDaiLy: number; TenDaiLy: string; DiaChi?: string }[]>([]);
  const [maDaiLy, setMaDaiLy] = useState("");
  const [lots, setLots] = useState<{ MaLo: number; TenSanPham: string; SoLuongHienTai: number }[]>([]);
  const [rows, setRows] = useState<ChiTietRow[]>([{ maLo: "", tenLo: "", soLuong: "", donGia: "" }]);
  const [ghiChu, setGhiChu] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    apiFetch("/api/dai-ly/get-all")
      .then((data: { MaDaiLy: number; TenDaiLy: string; DiaChi?: string }[]) => {
        setDaiLys(data);
        if (data.length) setMaDaiLy(String(data[0].MaDaiLy));
      })
      .catch(() => setErr("Không tải được danh sách đại lý"));
  }, []);

  useEffect(() => {
    if (!maDaiLy) return;
    apiFetch("/api/lo-nong-san/get-all")
      .then((data: { MaLo: number; TenSanPham: string; SoLuongHienTai: number }[]) => {
        setLots(data);
        setRows([{ maLo: data[0] ? String(data[0].MaLo) : "", tenLo: data[0]?.TenSanPham || "", soLuong: "", donGia: "" }]);
      })
      .catch(console.error);
  }, [maDaiLy]);

  function setRow(i: number, field: keyof ChiTietRow, val: string) {
    setRows(rs => rs.map((r, idx) => {
      if (idx !== i) return r;
      if (field === "maLo") {
        const lot = lots.find(l => String(l.MaLo) === val);
        return { ...r, maLo: val, tenLo: lot?.TenSanPham || "" };
      }
      return { ...r, [field]: val };
    }));
  }

  async function handleSave() {
    const validRows = rows.filter(r => r.maLo && r.soLuong && r.donGia);
    if (!maDaiLy) return setErr("Vui lòng chọn đại lý");
    if (!validRows.length) return setErr("Thêm ít nhất 1 lô hàng");
    setLoading(true); setErr("");
    try {
      const res = await apiFetch("/api/sieuthi/donhang/tao-don-hang", {
        method: "POST",
        body: JSON.stringify({ MaSieuThi: maSieuThi, MaDaiLy: Number(maDaiLy), GhiChu: ghiChu || null }),
      });
      const maDonHang: number = res.MaDonHang;
      for (const row of validRows) {
        await apiFetch("/api/sieuthi/donhang/them-chi-tiet", {
          method: "POST",
          body: JSON.stringify({ MaDonHang: maDonHang, MaLo: Number(row.maLo), SoLuong: Number(row.soLuong), DonGia: Number(row.donGia) }),
        });
      }
      onSaved(); onClose();
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Lỗi tạo đơn hàng");
    } finally { setLoading(false); }
  }

  return (
    <Modal title="🛒 Tạo đơn đặt hàng" onClose={onClose}>
      {err && <div style={{ padding: "8px 12px", background: "#fff0f0", color: "#c62828", borderRadius: 8, marginBottom: 14, fontSize: 13 }}>⚠ {err}</div>}

      <FormField label="Đại lý *">
        <select style={inp} value={maDaiLy} onChange={e => { setMaDaiLy(e.target.value); setErr(""); }}>
          {daiLys.length === 0
            ? <option value="">— Đang tải... —</option>
            : daiLys.map(d => <option key={d.MaDaiLy} value={d.MaDaiLy}>{d.TenDaiLy}{d.DiaChi ? ` — ${d.DiaChi}` : ""}</option>)
          }
        </select>
      </FormField>

      <div style={{ marginBottom: 14 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <label style={{ fontSize: 12, fontWeight: 700, color: "#555" }}>Chi tiết đơn hàng *</label>
          <button
            onClick={() => setRows(rs => [...rs, { maLo: lots[0] ? String(lots[0].MaLo) : "", tenLo: lots[0]?.TenSanPham || "", soLuong: "", donGia: "" }])}
            style={{ fontSize: 11, fontWeight: 700, color: C.primary, background: "none", border: `1px solid ${C.primary}`, borderRadius: 6, padding: "3px 10px", cursor: "pointer" }}>
            + Thêm lô
          </button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 28px", gap: 6, marginBottom: 6 }}>
          {["Lô nông sản", "Số lượng (kg)", "Đơn giá (đ)", ""].map(h => (
            <div key={h} style={{ fontSize: 10, fontWeight: 700, color: "#888", textTransform: "uppercase" }}>{h}</div>
          ))}
        </div>
        {rows.map((row, i) => (
          <div key={i} style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 28px", gap: 6, marginBottom: 6, alignItems: "center" }}>
            <select style={inp} value={row.maLo} onChange={e => setRow(i, "maLo", e.target.value)}>
              {lots.length === 0
                ? <option value="">— Không có lô —</option>
                : lots.map(l => <option key={l.MaLo} value={l.MaLo}>{l.TenSanPham} (còn {l.SoLuongHienTai} kg)</option>)
              }
            </select>
            <input style={inp} type="number" min="0" step="any" placeholder="Số lượng" value={row.soLuong}
              onChange={e => { if (Number(e.target.value) >= 0 || e.target.value === "") setRow(i, "soLuong", e.target.value); }}
              onWheel={e => (e.target as HTMLInputElement).blur()} />
            <input style={inp} type="number" min="0" step="any" placeholder="Đơn giá" value={row.donGia}
              onChange={e => { if (Number(e.target.value) >= 0 || e.target.value === "") setRow(i, "donGia", e.target.value); }}
              onWheel={e => (e.target as HTMLInputElement).blur()} />
            <button onClick={() => setRows(rs => rs.filter((_, idx) => idx !== i))}
              style={{ background: "none", border: "none", color: "#dc2626", fontSize: 16, cursor: "pointer", fontWeight: 700 }}>✕</button>
          </div>
        ))}
        {rows.length === 0 && <p style={{ color: "#aaa", fontSize: 13, textAlign: "center", padding: "12px 0" }}>Chưa có lô nào</p>}
      </div>

      <FormField label="Ghi chú">
        <input style={inp} value={ghiChu} onChange={e => setGhiChu(e.target.value)} placeholder="Ghi chú tuỳ chọn…" />
      </FormField>
      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 6 }}>
        <button onClick={onClose} style={{ padding: "9px 18px", background: "#f3f4f6", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 600 }}>Hủy</button>
        <PrimaryBtn onClick={handleSave}>{loading ? "Đang lưu…" : "Lưu đơn"}</PrimaryBtn>
      </div>
    </Modal>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function SieuThiApp() {
  const authUser = getCurrentUser();
  const CURRENT_USER = { id: String(authUser?.maTaiKhoan || ""), fullName: authUser?.tenHienThi || "", role: "Siêu thị" };

  useEffect(() => {
    if (!authUser || authUser.role !== "sieuthi") {
      window.location.href = "/login";
    }
  }, []);

  const [section, setSection] = useState<Section>("dashboard");
  const [db, setDb] = useState<DB>({ orders: [], lohang: [], kiemDinh: [] });
  const [incoming, setIncoming] = useState<RetailOrder[]>([]);
  const [modal, setModal] = useState<string | null>(null);
  // API orders state
  const [apiOrders, setApiOrders] = useState<ApiDonHang[]>([]);
  const [apiOrdersLoading, setApiOrdersLoading] = useState(false);
  const [apiOrdersErr, setApiOrdersErr] = useState("");
  const [editTarget, setEditTarget] = useState<Order | LoHang | null>(null);

  // Forms
  const [chiTietForm, setChiTietForm] = useState({ maDonHang: "", maLo: "", soLuong: "", donGia: "" });
  const [editTrangThaiForm, setEditTrangThaiForm] = useState({ maDonHang: 0, trangThai: "" });
  const [qualityForm, setQualityForm] = useState({ maKiemDinh: "", maLo: "", ngayKiem: "", nguoiKiem: "", ketQua: "Đạt", ghiChu: "" });
  const [profileForm, setProfileForm] = useState({ hoTen: CURRENT_USER.fullName, sdt: authUser?.soDienThoai || "", email: authUser?.email || "", diaChi: authUser?.diaChi || "" });
  const [profileErr, setProfileErr] = useState("");
  const [profileLoading, setProfileLoading] = useState(false);

  async function saveProfile() {
    if (!profileForm.hoTen) return setProfileErr("Họ tên không được để trống");
    if (!authUser) return setProfileErr("Phiên đăng nhập hết hạn");
    setProfileLoading(true); setProfileErr("");
    try {
      await apiUpdateProfile({ maTaiKhoan: authUser.maTaiKhoan, hoTen: profileForm.hoTen, soDienThoai: profileForm.sdt, email: profileForm.email, diaChi: profileForm.diaChi });
      setModal(null);
    } catch (e: unknown) {
      setProfileErr(e instanceof Error ? e.message : "Lỗi cập nhật");
    } finally { setProfileLoading(false); }
  }

  const loadApiOrders = useCallback(async () => {
    if (!authUser?.maDoiTuong) return;
    setApiOrdersLoading(true); setApiOrdersErr("");
    try {
      const data = await apiFetch(`/api/sieuthi/donhang/sieu-thi/${authUser.maDoiTuong}`);
      setApiOrders(data);
    } catch (e: unknown) {
      setApiOrdersErr(e instanceof Error ? e.message : "Lỗi tải đơn hàng");
    } finally { setApiOrdersLoading(false); }
  }, [authUser?.maDoiTuong]);

  const themChiTiet = async () => {
    const { maDonHang, maLo, soLuong, donGia } = chiTietForm;
    if (!maDonHang || !maLo || !soLuong || !donGia) return alert("Vui lòng nhập đầy đủ thông tin");
    try {
      await apiFetch("/api/sieuthi/donhang/them-chi-tiet", {
        method: "POST",
        body: JSON.stringify({ MaDonHang: +maDonHang, MaLo: +maLo, SoLuong: +soLuong, DonGia: +donGia }),
      });
      setChiTietForm({ maDonHang: "", maLo: "", soLuong: "", donGia: "" });
      setModal(null);
      loadApiOrders();
    } catch (e: unknown) { alert(e instanceof Error ? e.message : "Lỗi thêm chi tiết"); }
  };

  const huyDonHang = async (id: number) => {
    if (!window.confirm("Hủy đơn hàng này?")) return;
    try {
      await apiFetch(`/api/sieuthi/donhang/huy-don-hang/${id}`, { method: "PUT" });
      loadApiOrders();
    } catch (e: unknown) { alert(e instanceof Error ? e.message : "Lỗi hủy đơn"); }
  };

  const capNhatTrangThai = async () => {
    if (!editTrangThaiForm.trangThai) return alert("Chọn trạng thái");
    try {
      await apiFetch(`/api/sieuthi/donhang/${editTrangThaiForm.maDonHang}/trang-thai`, {
        method: "PUT",
        body: JSON.stringify({ TrangThai: editTrangThaiForm.trangThai }),
      });
      setModal(null);
      loadApiOrders();
    } catch (e: unknown) { alert(e instanceof Error ? e.message : "Lỗi cập nhật"); }
  };

  const loadAll = useCallback(() => {
    const uid = CURRENT_USER.id;
    setDb({
      orders:   loadKey<Order[]>("orders", uid, []),
      lohang:   loadKey<LoHang[]>("lohang", uid, []),
      kiemDinh: loadKey<KiemDinh[]>("kiemDinh", uid, []),
    });
    try {
      const all: RetailOrder[] = JSON.parse(localStorage.getItem("retail_orders") || "[]");
      setIncoming(all.filter(m => String(m.fromSieuthiId) === CURRENT_USER.id && m.status?.toLowerCase() === "shipped"));
    } catch { /* empty */ }
  }, [CURRENT_USER.id]);

  useEffect(() => { loadAll(); loadApiOrders(); }, [loadAll, loadApiOrders]);

  const save = (newDb: DB) => {
    const uid = CURRENT_USER.id;
    (["orders", "lohang", "kiemDinh"] as (keyof DB)[]).forEach(k => saveKey(k, uid, newDb[k]));
    setDb({ ...newDb });
  };

  // Actions
  const deleteOrder = (uid: string) => {
    if (!window.confirm("Xóa đơn hàng này?")) return;
    save({ ...db, orders: db.orders.filter(o => o.uid !== uid) });
    const retail = JSON.parse(localStorage.getItem("retail_orders") || "[]");
    localStorage.setItem("retail_orders", JSON.stringify(retail.filter((a: Order) => a.uid !== uid)));
  };

  const markReceived = (uid: string) => {
    const all: RetailOrder[] = JSON.parse(localStorage.getItem("retail_orders") || "[]");
    const idx = all.findIndex(x => x.uid === uid);
    if (idx === -1) return;
    all[idx].status = "received";
    localStorage.setItem("retail_orders", JSON.stringify(all));
    const p = all[idx];
    save({ ...db, lohang: [...db.lohang, { maLo: p.maLo, sanPham: p.sanPham, soLuong: +p.soLuong, ngayTao: new Date().toLocaleString() }] });
    setIncoming(prev => prev.filter(x => x.uid !== uid));
  };

  const addQuality = () => {
    const q: KiemDinh = { ...qualityForm, maKiemDinh: qualityForm.maKiemDinh || "KD" + Date.now() };
    save({ ...db, kiemDinh: [...db.kiemDinh, q] });
    setQualityForm({ maKiemDinh: "", maLo: "", ngayKiem: "", nguoiKiem: "", ketQua: "Đạt", ghiChu: "" });
    setModal(null);
  };

  const totalStock = db.lohang.reduce((s, b) => s + b.soLuong, 0);
  const qualityAlerts = db.kiemDinh.filter(k => /không/i.test(k.ketQua)).length;

  return (
    <div style={{ fontFamily: "'Be Vietnam Pro','Segoe UI',sans-serif", background: C.mist, minHeight: "100vh" }}>
      {/* Sidebar */}
      <aside style={{ position: "fixed", left: 0, top: 0, width: 248, height: "100vh", background: `linear-gradient(180deg,${C.dark} 0%,${C.darker} 100%)`, color: "#fff", display: "flex", flexDirection: "column", zIndex: 1000 }}>
        <div style={{ padding: "20px 18px 16px", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 28 }}>🛒</span>
            <div>
              <div style={{ fontWeight: 800, fontSize: 16, letterSpacing: 0.5 }}>Siêu Thị</div>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", letterSpacing: 0.8, textTransform: "uppercase" }}>Quản lý bán lẻ</div>
            </div>
          </div>
        </div>
        <div style={{ padding: "12px 18px", borderBottom: "1px solid rgba(255,255,255,0.07)", cursor: "pointer" }} onClick={() => setModal("profile")}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 36, height: 36, background: `linear-gradient(135deg,${C.accent},${C.primary})`, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>🛒</div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 13 }}>{CURRENT_USER.fullName}</div>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.45)" }}>{CURRENT_USER.role}</div>
            </div>
          </div>
        </div>
        <nav style={{ flex: 1, padding: "10px 0", overflowY: "auto" }}>
          {NAV.map(n => (
            <button key={n.id} onClick={() => setSection(n.id)} style={{ display: "flex", alignItems: "center", gap: 12, width: "100%", padding: "11px 18px", background: section === n.id ? "rgba(59,130,246,0.18)" : "none", border: "none", borderLeft: section === n.id ? `3px solid ${C.accent}` : "3px solid transparent", color: section === n.id ? C.accent : "rgba(255,255,255,0.6)", cursor: "pointer", fontSize: 13, fontWeight: section === n.id ? 700 : 500, textAlign: "left", transition: "all 0.18s" }}>
              <span>{n.icon}</span><span>{n.label}</span>
            </button>
          ))}
        </nav>
        <div style={{ padding: "10px 8px 16px", borderTop: "1px solid rgba(255,255,255,0.07)" }}>
          <button style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "10px", background: "none", border: "none", color: "rgba(255,255,255,0.45)", cursor: "pointer", fontSize: 12, borderRadius: 8 }} onClick={() => { clearCurrentUser(); window.location.href = "/login"; }}>
            <span>🚪</span><span>Đăng xuất</span>
          </button>
        </div>
      </aside>

      {/* Main */}
      <main style={{ marginLeft: 248, padding: "28px 28px 48px", minHeight: "100vh" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 22 }}>
          <div>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: C.dark, margin: 0 }}>{PAGE_TITLES[section]}</h2>
            <p style={{ fontSize: 12, color: "#aaa", margin: "3px 0 0" }}>Xin chào, {CURRENT_USER.fullName}</p>
          </div>
          {section === "orders"  && <PrimaryBtn onClick={() => setModal("order")}>+ Tạo đơn hàng</PrimaryBtn>}
          {section === "reports" && <PrimaryBtn onClick={() => setModal("quality")}>+ Thêm kiểm định</PrimaryBtn>}
        </div>

        {/* Dashboard */}
        {section === "dashboard" && (
          <div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(190px,1fr))", gap: 16, marginBottom: 24 }}>
              {[
                { icon: "📋", label: "Tổng đơn hàng",   value: apiOrders.length,   color: C.primary },
                { icon: "📦", label: "Tồn kho",          value: `${totalStock} `, color: "#7c3aed" },
                { icon: "⚠️", label: "Cảnh báo chất lượng",      value: qualityAlerts,      color: "#dc2626" },
                { icon: "🏪", label: "Số lô hàng",       value: db.lohang.length,   color: "#059669" },
              ].map(k => (
                <Panel key={k.label} style={{ borderTop: `4px solid ${k.color}`, display: "flex", alignItems: "center", gap: 14 }}>
                  <span style={{ fontSize: 28 }}>{k.icon}</span>
                  <div>
                    <div style={{ fontSize: 26, fontWeight: 800, color: "#111", lineHeight: 1 }}>{k.value}</div>
                    <div style={{ fontSize: 12, color: "#888", marginTop: 4 }}>{k.label}</div>
                  </div>
                </Panel>
              ))}
            </div>
            <Panel>
              <SectionTitle>📋 Đơn hàng gần đây</SectionTitle>
              <StyledTable headers={["Mã đơn", "Đại lý", "Tổng SL", "Tổng giá trị", "Ngày đặt", "Trạng thái"]}>
                {[...apiOrders].slice(0, 8).map(o => (
                  <tr key={o.MaDonHang}>
                    <Td><code style={{ fontSize: 11, color: "#888" }}>#{o.MaDonHang}</code></Td>
                    <Td>{o.TenDaiLy || "—"}</Td>
                    <Td>{o.TongSoLuong ?? "—"}</Td>
                    <Td>{o.TongGiaTri ? o.TongGiaTri.toLocaleString("vi-VN") + " ₫" : "—"}</Td>
                    <Td style={{ color: "#aaa", fontSize: 11 }}>{o.NgayDat ? new Date(o.NgayDat).toLocaleDateString("vi-VN") : "—"}</Td>
                    <Td><StatusBadge status={o.TrangThai} /></Td>
                  </tr>
                ))}
              </StyledTable>
              {apiOrders.length === 0 && !apiOrdersLoading && <p style={{ textAlign: "center", color: "#aaa", padding: "16px 0" }}>Chưa có đơn hàng</p>}
            </Panel>
          </div>
        )}

        {/* Orders */}
        {section === "orders" && (
          <Panel>
            <SectionTitle>Danh sách đơn đặt hàng</SectionTitle>
            {apiOrdersLoading && <p style={{ color: "#aaa", padding: "12px 0" }}>Đang tải...</p>}
            {apiOrdersErr && <p style={{ color: "#dc2626", padding: "8px 0" }}>{apiOrdersErr}</p>}
            <StyledTable headers={["Mã đơn", "Đại lý", "Tổng SL", "Tổng giá trị", "Ghi chú", "Ngày đặt", "Trạng thái", ""]}>
              {apiOrders.map(o => (
                <tr key={o.MaDonHang}>
                  <Td><code style={{ fontSize: 11, color: "#888" }}>#{o.MaDonHang}</code></Td>
                  <Td>{o.TenDaiLy || "—"}</Td>
                  <Td>{o.TongSoLuong ?? "—"}</Td>
                  <Td>{o.TongGiaTri ? o.TongGiaTri.toLocaleString("vi-VN") + " ₫" : "—"}</Td>
                  <Td style={{ color: "#888", fontSize: 12 }}>{o.GhiChu || "—"}</Td>
                  <Td style={{ color: "#aaa", fontSize: 11 }}>{o.NgayDat ? new Date(o.NgayDat).toLocaleDateString("vi-VN") : "—"}</Td>
                  <Td><StatusBadge status={o.TrangThai} /></Td>
                  <Td>
                    <ActionBtn onClick={() => { setEditTrangThaiForm({ maDonHang: o.MaDonHang, trangThai: o.TrangThai }); setModal("editTrangThai"); }} color={C.primary}>Sửa TT</ActionBtn>
                    <ActionBtn onClick={() => { setChiTietForm({ ...chiTietForm, maDonHang: String(o.MaDonHang) }); setModal("chiTiet"); }} color="#059669">+ Chi tiết</ActionBtn>
                    {o.TrangThai !== "da_huy" && o.TrangThai !== "hoan_thanh" && (
                      <ActionBtn onClick={() => huyDonHang(o.MaDonHang)} color="#dc2626">Hủy</ActionBtn>
                    )}
                  </Td>
                </tr>
              ))}
            </StyledTable>
            {apiOrders.length === 0 && !apiOrdersLoading && <p style={{ textAlign: "center", color: "#aaa", padding: "24px 0" }}>Chưa có đơn hàng</p>}
          </Panel>
        )}

        {/* Receive */}
        {section === "receive" && (
          <Panel>
            <SectionTitle>Hàng đang chờ nhận từ Đại lý</SectionTitle>
            <StyledTable headers={["Mã phiếu", "Mã lô — Sản phẩm", "Số lượng", "Đại lý", "Ngày gửi", "Trạng thái", ""]}>
              {incoming.map(m => (
                <tr key={m.uid}>
                  <Td><code style={{ fontSize: 11, color: "#888" }}>{m.maPhieu}</code></Td>
                  <Td><span style={{ color: "#aaa", fontSize: 11 }}>{m.maLo} —</span> <b>{m.sanPham}</b></Td>
                  <Td>{m.soLuong}</Td><Td>{m.toDaily || "—"}</Td>
                  <Td style={{ color: "#aaa", fontSize: 11 }}>{m.ngayTao}</Td>
                  <Td><StatusBadge status={m.status} /></Td>
                  <Td>{m.status === "shipped" && <ActionBtn onClick={() => markReceived(m.uid)} color="#059669">✓ Đã nhận</ActionBtn>}</Td>
                </tr>
              ))}
            </StyledTable>
            {incoming.length === 0 && <p style={{ textAlign: "center", color: "#aaa", padding: "24px 0" }}>Không có hàng chờ nhận</p>}
          </Panel>
        )}

        {/* Inventory */}
        {section === "inventory" && (
          <Panel>
            <SectionTitle>📦 Tồn kho hiện tại</SectionTitle>
            <StyledTable headers={["Mã lô", "Sản phẩm", "Số lượng", "Ngày nhập", ""]}>
              {db.lohang.map(b => (
                <tr key={b.maLo + b.ngayTao}>
                  <Td><code style={{ fontSize: 11, color: "#888" }}>{b.maLo}</code></Td>
                  <Td><b>{b.sanPham}</b></Td>
                  <Td><span style={{ background: C.light, color: C.primary, padding: "3px 10px", borderRadius: 10, fontWeight: 700, fontSize: 13 }}>{b.soLuong}</span></Td>
                  <Td style={{ color: "#aaa", fontSize: 11 }}>{b.ngayTao}</Td>
                  <Td>
                    <ActionBtn onClick={() => { setEditTarget(b); setModal("editBatch"); }} color={C.primary}>Sửa</ActionBtn>
                    <ActionBtn onClick={() => { if (window.confirm("Xóa lô này?")) save({ ...db, lohang: db.lohang.filter(x => x.maLo !== b.maLo) }); }} color="#dc2626">Xóa</ActionBtn>
                  </Td>
                </tr>
              ))}
            </StyledTable>
            {db.lohang.length === 0 && <p style={{ textAlign: "center", color: "#aaa", padding: "24px 0" }}>Kho trống</p>}
          </Panel>
        )}

        {/* Reports */}
        {section === "reports" && (
          <div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 16, marginBottom: 24 }}>
              {[
                { icon: "📋", label: "Tổng đơn hàng",   value: `${db.orders.length} đơn`,    color: C.primary },
                { icon: "📦", label: "Tồn kho",          value: `${totalStock} sản phẩm`,            color: "#7c3aed" },
                { icon: "🏪", label: "Số lô hàng",       value: `${db.lohang.length} lô`,      color: "#059669" },
                { icon: "🔍", label: "Phiếu kiểm định",  value: `${db.kiemDinh.length} phiếu`, color: "#f59e0b" },
              ].map(c => (
                <Panel key={c.label} style={{ textAlign: "center", borderLeft: `5px solid ${c.color}` }}>
                  <div style={{ fontSize: 32, marginBottom: 8 }}>{c.icon}</div>
                  <div style={{ fontSize: 12, color: "#888", marginBottom: 6 }}>{c.label}</div>
                  <div style={{ fontSize: 28, fontWeight: 800, color: c.color }}>{c.value}</div>
                </Panel>
              ))}
            </div>
            {db.kiemDinh.length > 0 && (
              <Panel>
                <SectionTitle>🔍 Lịch sử kiểm định</SectionTitle>
                <StyledTable headers={["Mã KĐ", "Mã lô", "Ngày kiểm", "Người kiểm", "Kết quả", "Ghi chú"]}>
                  {db.kiemDinh.map(k => (
                    <tr key={k.maKiemDinh}>
                      <Td><code style={{ fontSize: 11, color: "#888" }}>{k.maKiemDinh}</code></Td>
                      <Td><b>{k.maLo}</b></Td><Td>{k.ngayKiem}</Td><Td>{k.nguoiKiem}</Td>
                      <Td><span style={{ padding: "3px 10px", borderRadius: 10, fontSize: 12, fontWeight: 700, background: /không/i.test(k.ketQua) ? "#fee2e2" : "#d1fae5", color: /không/i.test(k.ketQua) ? "#dc2626" : "#059669" }}>{k.ketQua}</span></Td>
                      <Td style={{ color: "#888" }}>{k.ghiChu || "—"}</Td>
                    </tr>
                  ))}
                </StyledTable>
              </Panel>
            )}
          </div>
        )}
      </main>

      {/* Modals */}
      {modal === "order" && authUser?.maDoiTuong && (
        <OrderModal
          maSieuThi={authUser.maDoiTuong}
          onClose={() => setModal(null)}
          onSaved={() => { loadApiOrders(); }}
        />
      )}

      {modal === "chiTiet" && (
        <Modal title="➕ Thêm chi tiết đơn hàng" onClose={() => setModal(null)}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 14px" }}>
            <FormField label="Mã đơn hàng *"><input style={inp} type="number" value={chiTietForm.maDonHang} onChange={e => setChiTietForm({ ...chiTietForm, maDonHang: e.target.value })} /></FormField>
            <FormField label="Mã lô *"><input style={inp} type="number" value={chiTietForm.maLo} onChange={e => setChiTietForm({ ...chiTietForm, maLo: e.target.value })} placeholder="Mã lô nông sản" /></FormField>
            <FormField label="Số lượng *"><input style={inp} type="number" value={chiTietForm.soLuong} onChange={e => setChiTietForm({ ...chiTietForm, soLuong: e.target.value })} placeholder="0" /></FormField>
            <FormField label="Đơn giá *"><input style={inp} type="number" value={chiTietForm.donGia} onChange={e => setChiTietForm({ ...chiTietForm, donGia: e.target.value })} placeholder="0" /></FormField>
          </div>
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 6 }}>
            <button onClick={() => setModal(null)} style={{ padding: "9px 18px", background: "#f3f4f6", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 600 }}>Hủy</button>
            <PrimaryBtn onClick={themChiTiet}>Thêm</PrimaryBtn>
          </div>
        </Modal>
      )}

      {modal === "editTrangThai" && (
        <Modal title="✏️ Cập nhật trạng thái" onClose={() => setModal(null)}>
          <FormField label="Trạng thái">
            <select style={inp} value={editTrangThaiForm.trangThai} onChange={e => setEditTrangThaiForm({ ...editTrangThaiForm, trangThai: e.target.value })}>
              <option value="chua_nhan">Chưa nhận</option>
              <option value="da_nhan">Đã nhận</option>
              <option value="dang_xu_ly">Đang xử lý</option>
              <option value="hoan_thanh">Hoàn thành</option>
              <option value="da_huy">Đã hủy</option>
            </select>
          </FormField>
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 6 }}>
            <button onClick={() => setModal(null)} style={{ padding: "9px 18px", background: "#f3f4f6", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 600 }}>Hủy</button>
            <PrimaryBtn onClick={capNhatTrangThai}>Lưu</PrimaryBtn>
          </div>
        </Modal>
      )}

      {modal === "editBatch" && editTarget && (
        <Modal title="✏️ Sửa lô hàng" onClose={() => setModal(null)}>
          {(() => {
            const b = editTarget as LoHang;
            return (
              <>
                <FormField label="Mã lô"><input style={inp} value={b.maLo} onChange={e => setEditTarget({ ...b, maLo: e.target.value })} /></FormField>
                <FormField label="Sản phẩm"><input style={inp} value={b.sanPham} onChange={e => setEditTarget({ ...b, sanPham: e.target.value })} /></FormField>
                <FormField label="Số lượng"><input style={inp} type="number" value={b.soLuong} onChange={e => setEditTarget({ ...b, soLuong: +e.target.value })} /></FormField>
                <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 6 }}>
                  <button onClick={() => setModal(null)} style={{ padding: "9px 18px", background: "#f3f4f6", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 600 }}>Hủy</button>
                  <PrimaryBtn onClick={() => { save({ ...db, lohang: db.lohang.map(x => x.maLo === (editTarget as LoHang).maLo ? b : x) }); setModal(null); }}>Lưu</PrimaryBtn>
                </div>
              </>
            );
          })()}
        </Modal>
      )}

      {modal === "quality" && (
        <Modal title="🔍 Thêm phiếu kiểm định" onClose={() => setModal(null)}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 14px" }}>
            <FormField label="Mã kiểm định"><input style={inp} value={qualityForm.maKiemDinh} onChange={e => setQualityForm({ ...qualityForm, maKiemDinh: e.target.value })} placeholder="KD001" /></FormField>
            <FormField label="Mã lô"><input style={inp} value={qualityForm.maLo} onChange={e => setQualityForm({ ...qualityForm, maLo: e.target.value })} placeholder="ML001" /></FormField>
            <FormField label="Ngày kiểm"><input style={inp} type="date" value={qualityForm.ngayKiem} onChange={e => setQualityForm({ ...qualityForm, ngayKiem: e.target.value })} /></FormField>
            <FormField label="Người kiểm"><input style={inp} value={qualityForm.nguoiKiem} onChange={e => setQualityForm({ ...qualityForm, nguoiKiem: e.target.value })} placeholder="Tên người kiểm" /></FormField>
          </div>
          <FormField label="Kết quả">
            <select style={inp} value={qualityForm.ketQua} onChange={e => setQualityForm({ ...qualityForm, ketQua: e.target.value })}>
              <option>Đạt</option><option>Không đạt</option>
            </select>
          </FormField>
          <FormField label="Ghi chú"><input style={inp} value={qualityForm.ghiChu} onChange={e => setQualityForm({ ...qualityForm, ghiChu: e.target.value })} placeholder="Tuỳ chọn" /></FormField>
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 6 }}>
            <button onClick={() => setModal(null)} style={{ padding: "9px 18px", background: "#f3f4f6", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 600 }}>Hủy</button>
            <PrimaryBtn onClick={addQuality}>Lưu kiểm định</PrimaryBtn>
          </div>
        </Modal>
      )}

      {modal === "profile" && (
        <Modal title="Thông tin cá nhân" onClose={() => setModal(null)}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
            <div style={{ width: 60, height: 60, background: `linear-gradient(135deg,${C.accent},${C.primary})`, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26 }}>🛒</div>
          </div>
          {[["Họ tên", CURRENT_USER.fullName], ["Vai trò", CURRENT_USER.role], ["Email", authUser?.email || "—"], ["Số điện thoại", authUser?.soDienThoai || "—"], ["Địa chỉ", authUser?.diaChi || "—"]].map(([k, v]) => (
            <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #f0f0f0" }}>
              <span style={{ fontSize: 12, color: "#888", fontWeight: 600 }}>{k}</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: "#222" }}>{v}</span>
            </div>
          ))}
          <button onClick={() => setModal("edit-profile")} style={{ width: "100%", marginTop: 16, padding: "10px", background: `linear-gradient(135deg,${C.primary},#1d4ed8)`, color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 700, fontSize: 13 }}>✏️ Sửa thông tin</button>
        </Modal>
      )}

      {modal === "edit-profile" && (
        <Modal title="Sửa thông tin cá nhân" onClose={() => setModal(null)}>
          {(() => {
            const [hoTen, setHoTen] = [profileForm.hoTen, (v: string) => setProfileForm(p => ({ ...p, hoTen: v }))];
            const [sdt, setSdt]     = [profileForm.sdt,   (v: string) => setProfileForm(p => ({ ...p, sdt: v }))];
            const [email, setEmail] = [profileForm.email, (v: string) => setProfileForm(p => ({ ...p, email: v }))];
            const [diaChi, setDiaChi] = [profileForm.diaChi, (v: string) => setProfileForm(p => ({ ...p, diaChi: v }))];
            return (
              <>
                {profileErr && <div style={{ padding: "8px 12px", background: "#fff0f0", color: "#c62828", borderRadius: 8, marginBottom: 14, fontSize: 13 }}>⚠ {profileErr}</div>}
                <FormField label="Họ tên *"><input style={inp} value={hoTen} onChange={e => setHoTen(e.target.value)} /></FormField>
                <FormField label="Số điện thoại"><input style={inp} value={sdt} onChange={e => setSdt(e.target.value)} /></FormField>
                <FormField label="Email"><input style={inp} type="email" value={email} onChange={e => setEmail(e.target.value)} /></FormField>
                <FormField label="Địa chỉ"><input style={inp} value={diaChi} onChange={e => setDiaChi(e.target.value)} /></FormField>
                <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 6 }}>
                  <button onClick={() => setModal(null)} style={{ padding: "9px 18px", background: "#f3f4f6", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 600 }}>Hủy</button>
                  <PrimaryBtn onClick={saveProfile}>{profileLoading ? "Đang lưu…" : "Lưu"}</PrimaryBtn>
                </div>
              </>
            );
          })()}
        </Modal>
      )}
    </div>
  );
}
