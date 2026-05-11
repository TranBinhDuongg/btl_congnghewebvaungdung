import { useState, useEffect, useCallback, ReactNode, CSSProperties } from "react";
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

// Colors
const C = {
  primary: "#2563eb", dark: "#0f1e3d", darker: "#080f1f",
  accent: "#3b82f6", light: "#eff6ff", mist: "#f8faff", white: "#ffffff",
};

// Status
const STATUS_MAP: Record<string, { label: string; color: string; bg: string }> = {
  chua_nhan:       { label: "Chua nhan",   color: "#b45309", bg: "#fef3c7" },
  da_nhan:         { label: "Da nhan",     color: "#059669", bg: "#d1fae5" },
  dang_xu_ly:      { label: "Dang xu ly", color: "#7c3aed", bg: "#ede9fe" },
  hoan_thanh:      { label: "Hoan thanh", color: "#059669", bg: "#d1fae5" },
  da_huy:          { label: "Da huy",     color: "#dc2626", bg: "#fee2e2" },
  hoat_dong:       { label: "Hoat dong",  color: "#059669", bg: "#d1fae5" },
  ngung_hoat_dong: { label: "Ngung HD",   color: "#dc2626", bg: "#fee2e2" },
};
function StatusBadge({ status }: { status: string }) {
  const s = STATUS_MAP[status] ?? { label: status, color: "#555", bg: "#f3f4f6" };
  return <span style={{ display: "inline-block", padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700, color: s.color, background: s.bg }}>{s.label}</span>;
}

// Shared UI
function Panel({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return <div style={{ background: C.white, borderRadius: 14, padding: 20, boxShadow: "0 1px 8px #0000000a", ...style }}>{children}</div>;
}
function SectionTitle({ children }: { children: ReactNode }) {
  return <h4 style={{ fontSize: 14, fontWeight: 700, color: C.dark, marginBottom: 14 }}>{children}</h4>;
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
function ActionBtn({ children, onClick, color = C.primary, disabled }: { children: ReactNode; onClick: () => void; color?: string; disabled?: boolean }) {
  return <button onClick={onClick} disabled={disabled} style={{ marginRight: 5, padding: "4px 10px", background: disabled ? "#ccc" : color, color: "#fff", border: "none", borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: disabled ? "not-allowed" : "pointer" }}>{children}</button>;
}
function PrimaryBtn({ children, onClick, disabled }: { children: ReactNode; onClick?: () => void; disabled?: boolean }) {
  return <button onClick={onClick} disabled={disabled} style={{ padding: "9px 18px", background: disabled ? "#ccc" : `linear-gradient(135deg,${C.primary},#1d4ed8)`, color: "#fff", border: "none", borderRadius: 8, cursor: disabled ? "not-allowed" : "pointer", fontWeight: 700, fontSize: 13 }}>{children}</button>;
}
function Modal({ title, onClose, children, wide }: { title: string; onClose: () => void; children: ReactNode; wide?: boolean }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2000 }} onClick={onClose}>
      <div style={{ background: C.white, borderRadius: 16, padding: 28, width: wide ? 680 : 500, maxWidth: "94vw", maxHeight: "88vh", overflowY: "auto", position: "relative", boxShadow: "0 8px 40px #0003" }} onClick={e => e.stopPropagation()}>
        <button onClick={onClose} style={{ position: "absolute", top: 12, right: 14, background: "none", border: "none", fontSize: 22, cursor: "pointer", color: "#aaa" }}>x</button>
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

// Nav
type Section = "dashboard" | "orders" | "receive" | "inventory" | "reports";
const NAV: { id: Section; label: string; icon: string }[] = [
  { id: "dashboard", label: "Bang dieu khien",  icon: "🏠" },
  { id: "orders",    label: "Quan ly don hang", icon: "📋" },
  { id: "receive",   label: "Nhan hang",         icon: "📥" },
  { id: "inventory", label: "Quan ly kho",       icon: "🏪" },
  { id: "reports",   label: "Bao cao thong ke",  icon: "📊" },
];
const PAGE_TITLES: Record<Section, string> = {
  dashboard: "Bang dieu khien", orders: "Quan ly don hang",
  receive: "Nhan hang tu Dai ly", inventory: "Quan ly kho hang", reports: "Bao cao thong ke",
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
    <Modal title={`Chi tiet don hang #${order.MaDonHang}`} onClose={onClose} wide>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16, padding: "12px 14px", background: "#f8fafc", borderRadius: 10 }}>
        <div><span style={{ fontSize: 11, color: "#888" }}>Dai ly</span><div style={{ fontWeight: 700, fontSize: 13 }}>{order.TenDaiLy || "--"}</div></div>
        <div><span style={{ fontSize: 11, color: "#888" }}>Ngay dat</span><div style={{ fontWeight: 700, fontSize: 13 }}>{order.NgayDat ? new Date(order.NgayDat).toLocaleDateString("vi-VN") : "--"}</div></div>
        <div><span style={{ fontSize: 11, color: "#888" }}>Trang thai</span><div style={{ marginTop: 3 }}><StatusBadge status={order.TrangThai} /></div></div>
        <div><span style={{ fontSize: 11, color: "#888" }}>Ghi chu</span><div style={{ fontWeight: 600, fontSize: 13 }}>{order.GhiChu || "--"}</div></div>
      </div>
      {loading ? <p style={{ color: "#aaa", textAlign: "center" }}>Dang tai...</p> : (
        <StyledTable headers={["San pham", "Don vi", "So luong", "Don gia", "Thanh tien"]}>
          {details.map((d, i) => (
            <tr key={i}>
              <Td><b>{d.TenSanPham}</b></Td>
              <Td style={{ color: "#888" }}>{d.DonViTinh || "--"}</Td>
              <Td>{d.SoLuong?.toLocaleString("vi-VN")}</Td>
              <Td>{d.DonGia?.toLocaleString("vi-VN")} d</Td>
              <Td><b style={{ color: C.primary }}>{d.ThanhTien?.toLocaleString("vi-VN")} d</b></Td>
            </tr>
          ))}
        </StyledTable>
      )}
      {details.length === 0 && !loading && <p style={{ textAlign: "center", color: "#aaa", padding: "12px 0" }}>Khong co chi tiet</p>}
      <div style={{ marginTop: 14, padding: "10px 14px", background: "#f0f4ff", borderRadius: 8, display: "flex", justifyContent: "space-between" }}>
        <span style={{ fontWeight: 700, color: C.dark }}>Tong gia tri</span>
        <span style={{ fontWeight: 800, fontSize: 16, color: C.primary }}>{order.TongGiaTri?.toLocaleString("vi-VN")} d</span>
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
    if (!tenKho.trim()) return setErr("Ten kho khong duoc de trong");
    setLoading(true); setErr("");
    try {
      if (kho) {
        await apiFetch("/api/KhoHang/cap-nhat-kho", { method: "PUT", body: JSON.stringify({ MaKho: kho.MaKho, TenKho: tenKho, DiaChi: diaChi, TrangThai: trangThai }) });
      } else {
        await apiFetch("/api/KhoHang/tao-kho", { method: "POST", body: JSON.stringify({ LoaiKho: "sieuthi", MaSieuThi: maSieuThi, TenKho: tenKho, DiaChi: diaChi }) });
      }
      onSaved(); onClose();
    } catch (e: unknown) { setErr(e instanceof Error ? e.message : "Loi luu kho"); }
    finally { setLoading(false); }
  }

  return (
    <Modal title={kho ? `Sua kho: ${kho.TenKho}` : "Tao kho moi"} onClose={onClose}>
      {err && <div style={{ padding: "8px 12px", background: "#fff0f0", color: "#c62828", borderRadius: 8, marginBottom: 14, fontSize: 13 }}>{err}</div>}
      <FormField label="Ten kho *"><input style={inp} value={tenKho} onChange={e => setTenKho(e.target.value)} placeholder="Nhap ten kho..." /></FormField>
      <FormField label="Dia chi"><input style={inp} value={diaChi} onChange={e => setDiaChi(e.target.value)} placeholder="Nhap dia chi..." /></FormField>
      {kho && (
        <FormField label="Trang thai">
          <select style={inp} value={trangThai} onChange={e => setTrangThai(e.target.value)}>
            <option value="hoat_dong">Hoat dong</option>
            <option value="ngung_hoat_dong">Ngung hoat dong</option>
          </select>
        </FormField>
      )}
      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 6 }}>
        <button onClick={onClose} style={{ padding: "9px 18px", background: "#f3f4f6", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 600 }}>Huy</button>
        <PrimaryBtn onClick={handleSave} disabled={loading}>{loading ? "Dang luu..." : "Luu"}</PrimaryBtn>
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
      .catch(() => setErr("Khong tai duoc danh sach dai ly"));
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
    if (!maDaiLy) return setErr("Vui long chon dai ly");
    if (!valid.length) return setErr("Them it nhat 1 lo hang");
    setLoading(true); setErr("");
    try {
      const res = await apiFetch("/api/sieuthi/donhang/tao-don-hang", { method: "POST", body: JSON.stringify({ MaSieuThi: maSieuThi, MaDaiLy: Number(maDaiLy), GhiChu: ghiChu || null }) });
      for (const row of valid) {
        await apiFetch("/api/sieuthi/donhang/them-chi-tiet", { method: "POST", body: JSON.stringify({ MaDonHang: res.MaDonHang, MaLo: Number(row.maLo), SoLuong: Number(row.soLuong), DonGia: Number(row.donGia) }) });
      }
      onSaved(); onClose();
    } catch (e: unknown) { setErr(e instanceof Error ? e.message : "Loi tao don hang"); }
    finally { setLoading(false); }
  }

  return (
    <Modal title="Tao don dat hang" onClose={onClose}>
      {err && <div style={{ padding: "8px 12px", background: "#fff0f0", color: "#c62828", borderRadius: 8, marginBottom: 14, fontSize: 13 }}>{err}</div>}
      <FormField label="Dai ly *">
        <select style={inp} value={maDaiLy} onChange={e => setMaDaiLy(e.target.value)}>
          {daiLys.length === 0 ? <option value="">-- Dang tai... --</option> : daiLys.map(d => <option key={d.MaDaiLy} value={d.MaDaiLy}>{d.TenDaiLy}</option>)}
        </select>
      </FormField>
      <div style={{ marginBottom: 14 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <label style={{ fontSize: 12, fontWeight: 700, color: "#555" }}>Chi tiet don hang *</label>
          <button onClick={() => setRows(rs => [...rs, { maLo: lots[0] ? String(lots[0].MaLo) : "", tenLo: lots[0]?.TenSanPham || "", soLuong: "", donGia: "" }])}
            style={{ fontSize: 11, fontWeight: 700, color: C.primary, background: "none", border: `1px solid ${C.primary}`, borderRadius: 6, padding: "3px 10px", cursor: "pointer" }}>+ Them lo</button>
        </div>
        {rows.map((row, i) => (
          <div key={i} style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 28px", gap: 6, marginBottom: 6, alignItems: "center" }}>
            <select style={inp} value={row.maLo} onChange={e => setRow(i, "maLo", e.target.value)}>
              {lots.length === 0 ? <option value="">-- Khong co lo --</option> : lots.map(l => <option key={l.MaLo} value={l.MaLo}>{l.TenSanPham} (con {l.SoLuongHienTai} kg)</option>)}
            </select>
            <input style={inp} type="number" min="0" placeholder="So luong" value={row.soLuong} onChange={e => setRow(i, "soLuong", e.target.value)} onWheel={e => (e.target as HTMLInputElement).blur()} />
            <input style={inp} type="number" min="0" placeholder="Don gia" value={row.donGia} onChange={e => setRow(i, "donGia", e.target.value)} onWheel={e => (e.target as HTMLInputElement).blur()} />
            <button onClick={() => setRows(rs => rs.filter((_, idx) => idx !== i))} style={{ background: "none", border: "none", color: "#dc2626", fontSize: 16, cursor: "pointer", fontWeight: 700 }}>x</button>
          </div>
        ))}
      </div>
      <FormField label="Ghi chu"><input style={inp} value={ghiChu} onChange={e => setGhiChu(e.target.value)} placeholder="Tuy chon..." /></FormField>
      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 6 }}>
        <button onClick={onClose} style={{ padding: "9px 18px", background: "#f3f4f6", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 600 }}>Huy</button>
        <PrimaryBtn onClick={handleSave} disabled={loading}>{loading ? "Dang luu..." : "Luu don"}</PrimaryBtn>
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
      }).catch(() => setErr("Khong tai duoc chi tiet don"));
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
    if (!window.confirm("Xoa lo nay khoi don?")) return;
    try {
      await apiFetch("/api/sieuthi/donhang/xoa-chi-tiet", { method: "DELETE", body: JSON.stringify({ MaDonHang: order.MaDonHang, MaLo: Number(row.maLo) }) });
      setRows(rs => rs.filter((_, idx) => idx !== i));
    } catch (e: unknown) { setErr(e instanceof Error ? e.message : "Loi xoa lo"); }
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
    } catch (e: unknown) { setErr(e instanceof Error ? e.message : "Loi luu don hang"); }
    finally { setLoading(false); }
  }

  return (
    <Modal title={`Sua don #${order.MaDonHang}`} onClose={onClose}>
      {err && <div style={{ padding: "8px 12px", background: "#fff0f0", color: "#c62828", borderRadius: 8, marginBottom: 14, fontSize: 13 }}>{err}</div>}
      <div style={{ marginBottom: 14, padding: "8px 12px", background: "#f8fafc", borderRadius: 8, fontSize: 13, color: "#555" }}>Dai ly: <b>{order.TenDaiLy || "--"}</b></div>
      <div style={{ marginBottom: 14 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <label style={{ fontSize: 12, fontWeight: 700, color: "#555" }}>Chi tiet don hang</label>
          <button onClick={() => setRows(rs => [...rs, { maLo: lots[0] ? String(lots[0].MaLo) : "", tenLo: lots[0]?.TenSanPham || "", soLuong: "", donGia: "", isExisting: false }])}
            style={{ fontSize: 11, fontWeight: 700, color: C.primary, background: "none", border: `1px solid ${C.primary}`, borderRadius: 6, padding: "3px 10px", cursor: "pointer" }}>+ Them lo</button>
        </div>
        {rows.map((row, i) => (
          <div key={i} style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 28px", gap: 6, marginBottom: 6, alignItems: "center" }}>
            {row.isExisting
              ? <div style={{ padding: "8px 10px", background: "#f8fafc", borderRadius: 8, fontSize: 13, color: "#333", border: "1.5px solid #dbeafe" }}>{row.tenLo || `Lo #${row.maLo}`}</div>
              : <select style={inp} value={row.maLo} onChange={e => setRow(i, "maLo", e.target.value)}>
                  {lots.map(l => <option key={l.MaLo} value={l.MaLo}>{l.TenSanPham}</option>)}
                </select>
            }
            <input style={inp} type="number" min="0" placeholder="So luong" value={row.soLuong} onChange={e => setRow(i, "soLuong", e.target.value)} onWheel={e => (e.target as HTMLInputElement).blur()} />
            <input style={inp} type="number" min="0" placeholder="Don gia" value={row.donGia} onChange={e => setRow(i, "donGia", e.target.value)} onWheel={e => (e.target as HTMLInputElement).blur()} />
            <button onClick={() => handleDeleteRow(row, i)} style={{ background: "none", border: "none", color: "#dc2626", fontSize: 16, cursor: "pointer", fontWeight: 700 }}>x</button>
          </div>
        ))}
        {rows.length === 0 && <p style={{ color: "#aaa", fontSize: 13, textAlign: "center", padding: "12px 0" }}>Chua co lo nao</p>}
      </div>
      <FormField label="Ghi chu"><input style={inp} value={ghiChu} onChange={e => setGhiChu(e.target.value)} placeholder="Tuy chon..." /></FormField>
      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 6 }}>
        <button onClick={onClose} style={{ padding: "9px 18px", background: "#f3f4f6", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 600 }}>Huy</button>
        <PrimaryBtn onClick={handleSave} disabled={loading}>{loading ? "Dang luu..." : "Luu don"}</PrimaryBtn>
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
    } catch (e: unknown) { setApiOrdersErr(e instanceof Error ? e.message : "Loi tai don hang"); }
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
    if (!window.confirm("Huy don hang nay?")) return;
    try { await apiFetch(`/api/sieuthi/donhang/huy-don-hang/${id}`, { method: "PUT" }); loadApiOrders(); }
    catch (e: unknown) { alert(e instanceof Error ? e.message : "Loi huy don"); }
  };

  const handleDeleteOrder = async (id: number) => {
    if (!window.confirm("Xoa don hang nay? Chi xoa duoc don chua nhan.")) return;
    try { await apiFetch(`/api/sieuthi/donhang/${id}`, { method: "DELETE" }); loadApiOrders(); }
    catch (e: unknown) { alert(e instanceof Error ? e.message : "Loi xoa don"); }
  };

  const handleNhanHang = async (id: number) => {
    if (!window.confirm("Xac nhan da nhan hang?")) return;
    try { await apiFetch(`/api/sieuthi/donhang/nhan-hang/${id}`, { method: "PUT" }); loadApiOrders(); loadKho(); }
    catch (e: unknown) { alert(e instanceof Error ? e.message : "Loi nhan hang"); }
  };

  const handleXoaKho = async (maKho: number) => {
    if (!window.confirm("Xoa kho nay?")) return;
    try { await apiFetch(`/api/KhoHang/xoa-kho/${maKho}`, { method: "DELETE" }); loadKho(); }
    catch (e: unknown) { alert(e instanceof Error ? e.message : "Loi xoa kho"); }
  };

  async function saveProfile() {
    if (!profileForm.hoTen) return setProfileErr("Ho ten khong duoc de trong");
    if (!authUser) return setProfileErr("Phien dang nhap het han");
    setProfileLoading(true); setProfileErr("");
    try {
      await apiUpdateProfile({ maTaiKhoan: authUser.maTaiKhoan, hoTen: profileForm.hoTen, soDienThoai: profileForm.sdt, email: profileForm.email, diaChi: profileForm.diaChi });
      setModal(null);
    } catch (e: unknown) { setProfileErr(e instanceof Error ? e.message : "Loi cap nhat"); }
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
    <div style={{ fontFamily: "'Be Vietnam Pro','Segoe UI',sans-serif", background: C.mist, minHeight: "100vh" }}>
      {/* Sidebar */}
      <aside style={{ position: "fixed", left: 0, top: 0, width: 248, height: "100vh", background: `linear-gradient(180deg,${C.dark} 0%,${C.darker} 100%)`, color: "#fff", display: "flex", flexDirection: "column", zIndex: 1000 }}>
        <div style={{ padding: "20px 18px 16px", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 28 }}>🛒</span>
            <div>
              <div style={{ fontWeight: 800, fontSize: 16 }}>Sieu Thi</div>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", textTransform: "uppercase" }}>Quan ly ban le</div>
            </div>
          </div>
        </div>
        <div style={{ padding: "12px 18px", borderBottom: "1px solid rgba(255,255,255,0.07)", cursor: "pointer" }} onClick={() => setModal("profile")}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 36, height: 36, background: `linear-gradient(135deg,${C.accent},${C.primary})`, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>🛒</div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 13 }}>{fullName}</div>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.45)" }}>Sieu thi</div>
            </div>
          </div>
        </div>
        <nav style={{ flex: 1, padding: "10px 0", overflowY: "auto" }}>
          {NAV.map(n => (
            <button key={n.id} onClick={() => setSection(n.id)} style={{ display: "flex", alignItems: "center", gap: 12, width: "100%", padding: "11px 18px", background: section === n.id ? "rgba(59,130,246,0.18)" : "none", border: "none", borderLeft: section === n.id ? `3px solid ${C.accent}` : "3px solid transparent", color: section === n.id ? "#fff" : "rgba(255,255,255,0.55)", cursor: "pointer", fontSize: 13, fontWeight: section === n.id ? 700 : 400, textAlign: "left" }}>
              <span>{n.icon}</span><span>{n.label}</span>
            </button>
          ))}
        </nav>
        <div style={{ padding: "10px 8px 16px", borderTop: "1px solid rgba(255,255,255,0.07)" }}>
          <button style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "10px", background: "none", border: "none", color: "rgba(255,255,255,0.45)", cursor: "pointer", fontSize: 12, borderRadius: 8 }} onClick={() => { clearCurrentUser(); window.location.href = "/login"; }}>
            <span>🚪</span><span>Dang xuat</span>
          </button>
        </div>
      </aside>

      {/* Main */}
      <main style={{ marginLeft: 248, padding: "28px 28px 48px", minHeight: "100vh" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 22 }}>
          <div>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: C.dark, margin: 0 }}>{PAGE_TITLES[section]}</h2>
            <p style={{ fontSize: 12, color: "#aaa", margin: "3px 0 0" }}>Xin chao, {fullName}</p>
          </div>
          {section === "orders" && <PrimaryBtn onClick={() => setModal("order")}>+ Tao don hang</PrimaryBtn>}
          {section === "inventory" && <PrimaryBtn onClick={() => { setEditKho(undefined); setModal("kho"); }}>+ Tao kho moi</PrimaryBtn>}
        </div>

        {/* Dashboard */}
        {section === "dashboard" && (
          <div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(190px,1fr))", gap: 16, marginBottom: 24 }}>
              {[
                { icon: "📋", label: "Tong don hang", value: tongDon,    color: C.primary },
                { icon: "📥", label: "Cho nhan",      value: chuaNhan,   color: "#b45309" },
                { icon: "✅", label: "Da nhan",        value: daNhan,     color: "#059669" },
                { icon: "🏪", label: "Ton kho (kg)",   value: tongTonKho, color: "#7c3aed" },
              ].map(k => (
                <Panel key={k.label} style={{ borderTop: `4px solid ${k.color}`, display: "flex", alignItems: "center", gap: 14 }}>
                  <span style={{ fontSize: 28 }}>{k.icon}</span>
                  <div>
                    <div style={{ fontSize: 26, fontWeight: 800, color: "#111", lineHeight: 1 }}>{k.value.toLocaleString("vi-VN")}</div>
                    <div style={{ fontSize: 12, color: "#888", marginTop: 4 }}>{k.label}</div>
                  </div>
                </Panel>
              ))}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <Panel>
                <SectionTitle>Don hang gan day</SectionTitle>
                <StyledTable headers={["Ma don", "Dai ly", "Tong gia tri", "Ngay dat", "Trang thai"]}>
                  {apiOrders.slice(0, 6).map(o => (
                    <tr key={o.MaDonHang} style={{ cursor: "pointer" }} onClick={() => { setDetailOrder(o); setModal("detail"); }}>
                      <Td><code style={{ fontSize: 11, color: C.primary, fontWeight: 700 }}>#{o.MaDonHang}</code></Td>
                      <Td>{o.TenDaiLy || "--"}</Td>
                      <Td style={{ color: C.primary, fontWeight: 700 }}>{o.TongGiaTri ? o.TongGiaTri.toLocaleString("vi-VN") + " d" : "--"}</Td>
                      <Td style={{ color: "#aaa", fontSize: 11 }}>{o.NgayDat ? new Date(o.NgayDat).toLocaleDateString("vi-VN") : "--"}</Td>
                      <Td><StatusBadge status={o.TrangThai} /></Td>
                    </tr>
                  ))}
                </StyledTable>
                {apiOrders.length === 0 && !apiOrdersLoading && <p style={{ textAlign: "center", color: "#aaa", padding: "16px 0" }}>Chua co don hang</p>}
              </Panel>
              <Panel>
                <SectionTitle>Tinh trang kho</SectionTitle>
                {khoList.length === 0 ? (
                  <p style={{ textAlign: "center", color: "#aaa", padding: "24px 0" }}>Chua co kho nao</p>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {Array.from(new Set(khoList.map(k => k.MaKho))).slice(0, 5).map(maKho => {
                      const items = khoList.filter(k => k.MaKho === maKho);
                      const tenKho = items[0]?.TenKho || "--";
                      const tongSL = items.reduce((s, k) => s + (k.SoLuong || 0), 0);
                      return (
                        <div key={maKho} style={{ padding: "10px 14px", background: "#f8faff", borderRadius: 10, border: "1px solid #e0eaff" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <span style={{ fontWeight: 700, fontSize: 13, color: C.dark }}>🏪 {tenKho}</span>
                            <span style={{ background: C.light, color: C.primary, padding: "3px 10px", borderRadius: 10, fontWeight: 700, fontSize: 12 }}>{tongSL.toLocaleString("vi-VN")} kg</span>
                          </div>
                          <div style={{ fontSize: 11, color: "#888", marginTop: 4 }}>{items.filter(k => k.TenSanPham).length} loai san pham</div>
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
            <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
              <input style={{ ...inp, width: 220, flex: "none" }} placeholder="Tim dai ly, ma don..." value={orderSearch} onChange={e => setOrderSearch(e.target.value)} />
              <select style={{ ...inp, width: 160, flex: "none" }} value={orderStatusFilter} onChange={e => setOrderStatusFilter(e.target.value)}>
                <option value="all">Tat ca trang thai</option>
                <option value="chua_nhan">Chua nhan</option>
                <option value="da_nhan">Da nhan</option>
                <option value="da_huy">Da huy</option>
              </select>
              <span style={{ fontSize: 12, color: "#888" }}>{filteredOrders.length} don</span>
            </div>
            {apiOrdersLoading && <p style={{ color: "#aaa", padding: "12px 0" }}>Dang tai...</p>}
            {apiOrdersErr && <p style={{ color: "#dc2626", padding: "8px 0" }}>{apiOrdersErr}</p>}
            <StyledTable headers={["Ma don", "Dai ly", "Tong SL", "Tong gia tri", "Ghi chu", "Ngay dat", "Trang thai", ""]}>
              {filteredOrders.map(o => (
                <tr key={o.MaDonHang}>
                  <Td>
                    <span style={{ color: C.primary, cursor: "pointer", fontWeight: 700, fontSize: 12 }} onClick={() => { setDetailOrder(o); setModal("detail"); }}>#{o.MaDonHang}</span>
                  </Td>
                  <Td>{o.TenDaiLy || "--"}</Td>
                  <Td>{o.TongSoLuong != null ? o.TongSoLuong.toLocaleString("vi-VN") : "--"}</Td>
                  <Td style={{ color: C.primary, fontWeight: 700 }}>{o.TongGiaTri ? o.TongGiaTri.toLocaleString("vi-VN") + " d" : "--"}</Td>
                  <Td style={{ color: "#888", fontSize: 12 }}>{o.GhiChu || "--"}</Td>
                  <Td style={{ color: "#aaa", fontSize: 11 }}>{o.NgayDat ? new Date(o.NgayDat).toLocaleDateString("vi-VN") : "--"}</Td>
                  <Td><StatusBadge status={o.TrangThai} /></Td>
                  <Td>
                    <ActionBtn onClick={() => { setDetailOrder(o); setModal("detail"); }} color="#6366f1">🔍 Chi tiết</ActionBtn>
                    {o.TrangThai === "chua_nhan" && (
                      <>
                        <ActionBtn onClick={() => { setEditOrder(o); setModal("editOrder"); }} color={C.primary}>Sua</ActionBtn>
                        <ActionBtn onClick={() => handleNhanHang(o.MaDonHang)} color="#059669">Nhan</ActionBtn>
                        <ActionBtn onClick={() => huyDonHang(o.MaDonHang)} color="#f59e0b">Huy</ActionBtn>
                        <ActionBtn onClick={() => handleDeleteOrder(o.MaDonHang)} color="#dc2626">Xoa</ActionBtn>
                      </>
                    )}
                  </Td>
                </tr>
              ))}
            </StyledTable>
            {filteredOrders.length === 0 && !apiOrdersLoading && <p style={{ textAlign: "center", color: "#aaa", padding: "24px 0" }}>Khong co don hang nao</p>}
          </Panel>
        )}

        {/* Receive */}
        {section === "receive" && (
          <div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 14, marginBottom: 20 }}>
              <Panel style={{ borderLeft: `4px solid #b45309` }}>
                <div style={{ fontSize: 11, color: "#888", marginBottom: 4 }}>Cho nhan</div>
                <div style={{ fontSize: 28, fontWeight: 800, color: "#b45309" }}>{chuaNhan}</div>
              </Panel>
              <Panel style={{ borderLeft: `4px solid #059669` }}>
                <div style={{ fontSize: 11, color: "#888", marginBottom: 4 }}>Da nhan hom nay</div>
                <div style={{ fontSize: 28, fontWeight: 800, color: "#059669" }}>
                  {apiOrders.filter(o => o.TrangThai === "da_nhan" && o.NgayDat && new Date(o.NgayDat).toDateString() === new Date().toDateString()).length}
                </div>
              </Panel>
            </div>
            <Panel>
              <SectionTitle>Don hang dang cho nhan</SectionTitle>
              <StyledTable headers={["Ma don", "Dai ly", "Tong SL (kg)", "Tong gia tri", "Ngay dat", "Trang thai", ""]}>
                {apiOrders.filter(o => o.TrangThai === "chua_nhan").map(o => (
                  <tr key={o.MaDonHang}>
                    <Td>
                      <span style={{ color: C.primary, cursor: "pointer", fontWeight: 700, fontSize: 12 }} onClick={() => { setDetailOrder(o); setModal("detail"); }}>#{o.MaDonHang}</span>
                    </Td>
                    <Td><b>{o.TenDaiLy || "--"}</b></Td>
                    <Td>{o.TongSoLuong != null ? o.TongSoLuong.toLocaleString("vi-VN") : "--"}</Td>
                    <Td style={{ color: C.primary, fontWeight: 700 }}>{o.TongGiaTri ? o.TongGiaTri.toLocaleString("vi-VN") + " d" : "--"}</Td>
                    <Td style={{ color: "#aaa", fontSize: 11 }}>{o.NgayDat ? new Date(o.NgayDat).toLocaleDateString("vi-VN") : "--"}</Td>
                    <Td><StatusBadge status={o.TrangThai} /></Td>
                    <Td>
                      <ActionBtn onClick={() => { setDetailOrder(o); setModal("detail"); }} color="#6366f1">🔍 Chi tiết</ActionBtn>
                      <ActionBtn onClick={() => handleNhanHang(o.MaDonHang)} color="#059669">Xac nhan nhan hang</ActionBtn>
                    </Td>
                  </tr>
                ))}
              </StyledTable>
              {apiOrders.filter(o => o.TrangThai === "chua_nhan").length === 0 && (
                <p style={{ textAlign: "center", color: "#aaa", padding: "24px 0" }}>Khong co don hang cho nhan</p>
              )}
            </Panel>
          </div>
        )}

        {/* Inventory */}
        {section === "inventory" && (
          <div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 14, marginBottom: 20 }}>
              <Panel style={{ borderTop: `4px solid ${C.primary}` }}>
                <div style={{ fontSize: 11, color: "#888", marginBottom: 4 }}>So kho</div>
                <div style={{ fontSize: 28, fontWeight: 800, color: C.primary }}>{Array.from(new Set(khoList.map(k => k.MaKho))).length}</div>
              </Panel>
              <Panel style={{ borderTop: `4px solid #7c3aed` }}>
                <div style={{ fontSize: 11, color: "#888", marginBottom: 4 }}>Tong ton kho (kg)</div>
                <div style={{ fontSize: 28, fontWeight: 800, color: "#7c3aed" }}>{tongTonKho.toLocaleString("vi-VN")}</div>
              </Panel>
              <Panel style={{ borderTop: `4px solid #059669` }}>
                <div style={{ fontSize: 11, color: "#888", marginBottom: 4 }}>Loai san pham</div>
                <div style={{ fontSize: 28, fontWeight: 800, color: "#059669" }}>{new Set(khoList.map(k => k.TenSanPham).filter(Boolean)).size}</div>
              </Panel>
            </div>
            {khoLoading && <p style={{ color: "#aaa", padding: "12px 0" }}>Dang tai...</p>}
            {Array.from(new Set(khoList.map(k => k.MaKho))).map(maKho => {
              const items = khoList.filter(k => k.MaKho === maKho);
              const khoInfo = items[0];
              return (
                <Panel key={maKho} style={{ marginBottom: 16 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                    <div>
                      <span style={{ fontWeight: 800, fontSize: 15, color: C.dark }}>🏪 {khoInfo?.TenKho}</span>
                      {khoInfo?.DiaChi && <span style={{ fontSize: 11, color: "#888", marginLeft: 10 }}>📍 {khoInfo.DiaChi}</span>}
                      <span style={{ marginLeft: 10 }}><StatusBadge status={khoInfo?.TrangThai || "hoat_dong"} /></span>
                    </div>
                    <div style={{ display: "flex", gap: 6 }}>
                      <ActionBtn onClick={() => { setEditKho(khoInfo); setModal("kho"); }} color={C.primary}>Sua</ActionBtn>
                      <ActionBtn onClick={() => handleXoaKho(maKho)} color="#dc2626">Xoa</ActionBtn>
                    </div>
                  </div>
                  <StyledTable headers={["San pham", "Don vi", "So luong", "Cap nhat cuoi"]}>
                    {items.filter(k => k.TenSanPham).map((k, i) => (
                      <tr key={`${k.MaKho}-${k.MaLo}-${i}`}>
                        <Td><b>{k.TenSanPham}</b></Td>
                        <Td style={{ color: "#888" }}>{k.DonViTinh || "--"}</Td>
                        <Td>
                          <span style={{ background: (k.SoLuong || 0) > 0 ? C.light : "#fee2e2", color: (k.SoLuong || 0) > 0 ? C.primary : "#dc2626", padding: "3px 10px", borderRadius: 10, fontWeight: 700, fontSize: 13 }}>
                            {(k.SoLuong || 0).toLocaleString("vi-VN")}
                          </span>
                        </Td>
                        <Td style={{ color: "#aaa", fontSize: 11 }}>{k.CapNhatCuoi ? new Date(k.CapNhatCuoi).toLocaleDateString("vi-VN") : "--"}</Td>
                      </tr>
                    ))}
                    {items.filter(k => k.TenSanPham).length === 0 && (
                      <tr><td colSpan={4} style={{ textAlign: "center", color: "#aaa", padding: "12px 0", fontSize: 13 }}>Kho trong</td></tr>
                    )}
                  </StyledTable>
                </Panel>
              );
            })}
            {khoList.length === 0 && !khoLoading && (
              <Panel><p style={{ textAlign: "center", color: "#aaa", padding: "24px 0" }}>Chua co kho nao. Nhan "+ Tao kho moi" de bat dau.</p></Panel>
            )}
          </div>
        )}

        {/* Reports */}
        {section === "reports" && (
          <div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 16, marginBottom: 24 }}>
              {[
                { icon: "📋", label: "Tong don hang",   value: `${tongDon} don`,                                 color: C.primary },
                { icon: "✅", label: "Da nhan",           value: `${daNhan} don`,                                 color: "#059669" },
                { icon: "⏳", label: "Cho nhan",          value: `${chuaNhan} don`,                               color: "#b45309" },
                { icon: "❌", label: "Da huy",            value: `${daHuy} don`,                                  color: "#dc2626" },
                { icon: "💰", label: "Gia tri da nhan",  value: tongGiaTriDaNhan.toLocaleString("vi-VN") + " d", color: "#7c3aed" },
                { icon: "🏪", label: "Ton kho",           value: `${tongTonKho.toLocaleString("vi-VN")} kg`,      color: "#0891b2" },
              ].map(c => (
                <Panel key={c.label} style={{ textAlign: "center", borderLeft: `5px solid ${c.color}` }}>
                  <div style={{ fontSize: 28, marginBottom: 6 }}>{c.icon}</div>
                  <div style={{ fontSize: 11, color: "#888", marginBottom: 4 }}>{c.label}</div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: c.color }}>{c.value}</div>
                </Panel>
              ))}
            </div>
            <Panel style={{ marginBottom: 20 }}>
              <SectionTitle>Thong ke theo dai ly</SectionTitle>
              <StyledTable headers={["Dai ly", "Tong don", "Da nhan", "Ti le nhan", "Tong gia tri"]}>
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
                    <Td style={{ color: C.primary, fontWeight: 700 }}>{stats.tongGiaTri.toLocaleString("vi-VN")} d</Td>
                  </tr>
                ))}
                {Object.keys(daiLyStats).length === 0 && (
                  <tr><td colSpan={5} style={{ textAlign: "center", color: "#aaa", padding: "16px 0" }}>Chua co du lieu</td></tr>
                )}
              </StyledTable>
            </Panel>
            <Panel>
              <SectionTitle>Lich su don hang</SectionTitle>
              <StyledTable headers={["Ma don", "Dai ly", "Tong SL", "Tong gia tri", "Ngay dat", "Trang thai"]}>
                {apiOrders.map(o => (
                  <tr key={o.MaDonHang} style={{ cursor: "pointer" }} onClick={() => { setDetailOrder(o); setModal("detail"); }}>
                    <Td><code style={{ fontSize: 11, color: "#888" }}>#{o.MaDonHang}</code></Td>
                    <Td>{o.TenDaiLy || "--"}</Td>
                    <Td>{o.TongSoLuong != null ? o.TongSoLuong.toLocaleString("vi-VN") : "--"}</Td>
                    <Td style={{ color: C.primary, fontWeight: 700 }}>{o.TongGiaTri ? o.TongGiaTri.toLocaleString("vi-VN") + " d" : "--"}</Td>
                    <Td style={{ color: "#aaa", fontSize: 11 }}>{o.NgayDat ? new Date(o.NgayDat).toLocaleDateString("vi-VN") : "--"}</Td>
                    <Td><StatusBadge status={o.TrangThai} /></Td>
                  </tr>
                ))}
              </StyledTable>
              {apiOrders.length === 0 && <p style={{ textAlign: "center", color: "#aaa", padding: "16px 0" }}>Chua co du lieu</p>}
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
        <Modal title="Thong tin ca nhan" onClose={() => setModal(null)}>
          {[["Ho ten", fullName], ["Vai tro", "Sieu thi"], ["Email", authUser?.email || "--"], ["So dien thoai", authUser?.soDienThoai || "--"], ["Dia chi", authUser?.diaChi || "--"]].map(([k, v]) => (
            <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #f0f0f0" }}>
              <span style={{ fontSize: 12, color: "#888", fontWeight: 600 }}>{k}</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: "#222" }}>{v}</span>
            </div>
          ))}
          <button onClick={() => setModal("edit-profile")} style={{ width: "100%", marginTop: 16, padding: "10px", background: `linear-gradient(135deg,${C.primary},#1d4ed8)`, color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 700, fontSize: 13 }}>Sua thong tin</button>
        </Modal>
      )}
      {modal === "edit-profile" && (
        <Modal title="Sua thong tin ca nhan" onClose={() => setModal(null)}>
          {profileErr && <div style={{ padding: "8px 12px", background: "#fff0f0", color: "#c62828", borderRadius: 8, marginBottom: 14, fontSize: 13 }}>{profileErr}</div>}
          <FormField label="Ho ten *"><input style={inp} value={profileForm.hoTen} onChange={e => setProfileForm(p => ({ ...p, hoTen: e.target.value }))} /></FormField>
          <FormField label="So dien thoai"><input style={inp} value={profileForm.sdt} onChange={e => setProfileForm(p => ({ ...p, sdt: e.target.value }))} /></FormField>
          <FormField label="Email"><input style={inp} type="email" value={profileForm.email} onChange={e => setProfileForm(p => ({ ...p, email: e.target.value }))} /></FormField>
          <FormField label="Dia chi"><input style={inp} value={profileForm.diaChi} onChange={e => setProfileForm(p => ({ ...p, diaChi: e.target.value }))} /></FormField>
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 6 }}>
            <button onClick={() => setModal(null)} style={{ padding: "9px 18px", background: "#f3f4f6", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 600 }}>Huy</button>
            <PrimaryBtn onClick={saveProfile} disabled={profileLoading}>{profileLoading ? "Dang luu..." : "Luu"}</PrimaryBtn>
          </div>
        </Modal>
      )}
    </div>
  );
}
