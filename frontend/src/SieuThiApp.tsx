import React, { useState, useEffect, CSSProperties, ReactNode } from "react";
import "./SieuThiApp.css";
import { getCurrentUser, clearCurrentUser, apiUpdateProfile } from "./AuthHelper.ts";

// ─── Types ───────────────────────────────────────────────────────────────────
interface DonHang {
  MaDonHang: number;
  MaSieuThi: number;
  MaDaiLy: number;
  TenDaiLy?: string;
  TongSoLuong?: number;
  TongGiaTri?: number;
  GhiChu?: string;
  NgayDat?: string;
  TrangThai: string;
}

interface ChiTietDonHang {
  MaChiTiet: number;
  MaDonHang: number;
  MaLoNongSan?: number;
  TenSanPham?: string;
  DonVi?: string;
  SoLuong: number;
  DonGia: number;
  ThanhTien?: number;
}

interface KhoHang {
  MaKho: number;
  TenKho: string;
  DiaChi?: string;
  TrangThai?: string;
  TongTonKho?: number;
  SoLoaiSanPham?: number;
  SanPham?: SanPhamKho[];
}

interface SanPhamKho {
  TenSanPham: string;
  SoLuong: number;
  DonVi?: string;
}

interface DaiLy {
  MaDaiLy: number;
  TenDaiLy: string;
}

interface LoNongSan {
  MaLo: number;
  TenSanPham: string;
  DonVi?: string;
  SoLuongHienTai?: number;
}

const API = "";

async function apiFetch(path: string, opts?: RequestInit) {
  const res = await fetch(`${API}${path}`, {
    headers: { "Content-Type": "application/json", ...(opts?.headers || {}) },
    ...opts,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || "Lỗi hệ thống");
  return data;
}

const STATUS_MAP: Record<string, { label: string; color: string; bg: string }> = {
  chua_nhan: { label: "Chưa nhận", color: "#b45309", bg: "#fef3c7" },
  da_nhan:   { label: "Đã nhận",   color: "#059669", bg: "#d1fae5" },
  da_huy:    { label: "Đã hủy",    color: "#6b7280", bg: "#f3f4f6" },
  dang_xu_ly:{ label: "Đang xử lý",color: "#1d4ed8", bg: "#dbeafe" },
  hoan_thanh:{ label: "Hoàn thành",color: "#15803d", bg: "#dcfce7" },
};

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_MAP[status] ?? { label: status, color: "#555", bg: "#f3f4f6" };
  return (
    <span className="badge" style={{ color: s.color, background: s.bg }}>
      {s.label}
    </span>
  );
}

function Panel({ children, className = "", style }: { children: ReactNode; className?: string; style?: CSSProperties }) {
  return <div className={`panel ${className}`} style={style}>{children}</div>;
}

function StatCard({ icon, label, value, accent }: { icon: string; label: string; value: string | number; accent: string }) {
  return (
    <div className="stat-card" style={{ "--accent": accent } as any}>
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
        <thead>
          <tr>
            {headers.map(h => <th key={h}>{h}</th>)}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

function Td({ children, className = "", style }: { children: ReactNode; className?: string; style?: CSSProperties }) {
  return <td className={className} style={style}>{children}</td>;
}

function ActionBtn({ children, onClick, color = "var(--primary)", disabled }: { children: ReactNode; onClick: () => void; color?: string; disabled?: boolean }) {
  return (
    <button className="btn btn-action" onClick={onClick} disabled={disabled} style={{ background: disabled ? "#ccc" : color }}>
      {children}
    </button>
  );
}

function PrimaryBtn({ children, onClick, className = "", style }: { children: ReactNode; onClick?: () => void; className?: string; style?: CSSProperties }) {
  return <button className={`btn btn-primary ${className}`} onClick={onClick} style={style}>{children}</button>;
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

// ─── OrderDetailModal ────────────────────────────────────────────────────────
function OrderDetailModal({ donHang, onClose }: { donHang: DonHang; onClose: () => void }) {
  const [chiTiet, setChiTiet] = useState<ChiTietDonHang[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    apiFetch(`/api/sieuthi/donhang/${donHang.MaDonHang}/chi-tiet`)
      .then(d => setChiTiet(Array.isArray(d) ? d : d.chiTiet || []))
      .catch(e => setErr(e.message))
      .finally(() => setLoading(false));
  }, [donHang.MaDonHang]);

  const tong = chiTiet.reduce((s, c) => s + (c.ThanhTien ?? c.SoLuong * c.DonGia), 0);

  return (
    <Modal title={`Chi tiết đơn hàng #${donHang.MaDonHang}`} onClose={onClose} wide>
      <div className="u-grid u-gap-4 u-mb-6 u-bg-light u-rounded-lg u-p-6" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))" }}>
        <div><span className="u-text-sm u-text-muted u-font-bold" style={{ textTransform: "uppercase" }}>Đại lý</span><div className="u-font-black u-text-dark u-mt-3">{donHang.TenDaiLy || `#${donHang.MaDaiLy}`}</div></div>
        <div><span className="u-text-sm u-text-muted u-font-bold" style={{ textTransform: "uppercase" }}>Trạng thái</span><div className="u-mt-3"><StatusBadge status={donHang.TrangThai} /></div></div>
        <div><span className="u-text-sm u-text-muted u-font-bold" style={{ textTransform: "uppercase" }}>Ngày đặt</span><div className="u-font-black u-text-dark u-mt-3">{donHang.NgayDat ? new Date(donHang.NgayDat).toLocaleDateString("vi-VN") : "—"}</div></div>
        <div><span className="u-text-sm u-text-muted u-font-bold" style={{ textTransform: "uppercase" }}>Ghi chú</span><div className="u-text-muted u-text-md u-mt-3">{donHang.GhiChu || "—"}</div></div>
      </div>
      {loading ? <p className="empty-msg">Đang tải...</p> : err ? <p className="u-text-danger u-text-center">{err}</p> : (
        <>
          <StyledTable headers={["Sản phẩm", "Đơn vị", "Số lượng", "Đơn giá", "Thành tiền"]}>
            {chiTiet.map((c, i) => (
              <tr key={i}>
                <Td><b>{c.TenSanPham || `#${c.MaLoNongSan}`}</b></Td>
                <Td>{c.DonVi || "kg"}</Td>
                <Td>{c.SoLuong.toLocaleString()}</Td>
                <Td>{c.DonGia.toLocaleString()} d</Td>
                <Td><b>{(c.ThanhTien ?? c.SoLuong * c.DonGia).toLocaleString()} d</b></Td>
              </tr>
            ))}
          </StyledTable>
          <div className="u-text-right u-mt-4 u-text-lg u-font-black u-text-primary">
            Tổng giá trị: {tong.toLocaleString()} đ
          </div>
        </>
      )}
    </Modal>
  );
}

// ─── OrderModal ──────────────────────────────────────────────────────────────
interface ChiTietRow { maDaiLy: string; maLo: string; tenSanPham: string; soLuong: string; donGia: string; }

function OrderModal({ maSieuThi, onClose, onSaved }: { maSieuThi: number; onClose: () => void; onSaved: () => void }) {
  const [daiLys, setDaiLys] = useState<DaiLy[]>([]);
  const [lots, setLots] = useState<LoNongSan[]>([]);
  const [maDaiLy, setMaDaiLy] = useState("");
  const [ghiChu, setGhiChu] = useState("");
  const [rows, setRows] = useState<ChiTietRow[]>([{ maDaiLy: "", maLo: "", tenSanPham: "", soLuong: "", donGia: "" }]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    apiFetch("/api/dai-ly/get-all").then(d => { setDaiLys(Array.isArray(d) ? d : []); }).catch(() => {});
    apiFetch("/api/lo-nong-san/get-all").then(d => { setLots(Array.isArray(d) ? d : []); }).catch(() => {});
  }, []);

  function setRow(i: number, field: keyof ChiTietRow, val: string) {
    setRows(rs => rs.map((r, idx) => {
      if (idx !== i) return r;
      if (field === "maLo") {
        const lot = lots.find(l => String(l.MaLo) === val);
        return { ...r, maLo: val, tenSanPham: lot?.TenSanPham || "" };
      }
      return { ...r, [field]: val };
    }));
  }

  async function handleSave() {
    setLoading(true); setErr("");
    try {
      if (!maDaiLy) throw new Error("Vui lòng chọn đại lý");
      const validRows = rows.filter(r => r.maLo && r.soLuong && r.donGia);
      if (!validRows.length) throw new Error("Thêm ít nhất 1 sản phẩm");
      const res = await apiFetch("/api/sieuthi/donhang/tao-don-hang", {
        method: "POST",
        body: JSON.stringify({ MaSieuThi: maSieuThi, MaDaiLy: Number(maDaiLy), GhiChu: ghiChu || null }),
      });
      const maDon = res.MaDonHang || res.maDonHang;
      for (const row of validRows) {
        await apiFetch("/api/sieuthi/donhang/them-chi-tiet", {
          method: "POST",
          body: JSON.stringify({ MaDonHang: maDon, MaLo: Number(row.maLo), SoLuong: Number(row.soLuong), DonGia: Number(row.donGia) }),
        });
      }
      onSaved(); onClose();
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Lỗi tạo đơn hàng");
    } finally { setLoading(false); }
  }

  return (
    <Modal title="Tạo đơn hàng mới" onClose={onClose} wide>
      {err && <div className="error-msg">{err}</div>}
      <FormField label="Đại lý *">
        <select className="select" value={maDaiLy} onChange={e => setMaDaiLy(e.target.value)}>
          <option value="">-- Chọn đại lý --</option>
          {daiLys.map(d => <option key={d.MaDaiLy} value={d.MaDaiLy}>{d.TenDaiLy}</option>)}
        </select>
      </FormField>
      <FormField label="Ghi chú">
        <input className="input" value={ghiChu} onChange={e => setGhiChu(e.target.value)} placeholder="Ghi chú đơn hàng..." />
      </FormField>
      <div className="u-mb-4">
        <div className="u-flex u-justify-between u-items-center u-mb-2">
          <label className="u-text-sm u-font-bold u-text-muted">Chi tiết sản phẩm *</label>
          <button onClick={() => setRows(rs => [...rs, { maDaiLy: "", maLo: "", tenSanPham: "", soLuong: "", donGia: "" }])}
            className="u-text-sm u-font-bold u-text-primary u-border u-rounded-md u-px-2" style={{ background: "none", cursor: "pointer", padding: "4px 10px" }}>+ Thêm sản phẩm</button>
        </div>
        <div className="u-grid u-gap-2 u-mb-2" style={{ gridTemplateColumns: "2fr 1fr 1fr 28px" }}>
          {["Lô nông sản", "Số lượng", "Đơn giá (đ)", ""].map(h => (
            <div key={h} className="u-text-sm u-font-bold u-text-muted" style={{ textTransform: "uppercase" }}>{h}</div>
          ))}
        </div>
        {rows.map((row, i) => (
          <div key={i} className="u-grid u-gap-2 u-mb-2 u-items-center" style={{ gridTemplateColumns: "2fr 1fr 1fr 28px" }}>
            <select className="select" value={row.maLo} onChange={e => setRow(i, "maLo", e.target.value)}>
              <option value="">-- Chọn lô --</option>
              {lots.map(l => <option key={l.MaLo} value={l.MaLo}>{l.TenSanPham}{l.SoLuongHienTai ? ` (còn ${l.SoLuongHienTai})` : ""}</option>)}
            </select>
            <input className="input" type="number" placeholder="SL" value={row.soLuong} onChange={e => setRow(i, "soLuong", e.target.value)} />
            <input className="input" type="number" placeholder="Giá" value={row.donGia} onChange={e => setRow(i, "donGia", e.target.value)} />
            <button onClick={() => setRows(rs => rs.filter((_, idx) => idx !== i))} className="u-text-danger u-text-xl u-font-bold" style={{ background: "none", border: "none", cursor: "pointer" }}>×</button>
          </div>
        ))}
      </div>
      <div className="u-flex u-justify-end u-gap-3 u-mt-6 u-py-6 u-border-t">
        <button className="btn btn-secondary" onClick={onClose}>Hủy</button>
        <PrimaryBtn onClick={handleSave}>{loading ? "Đang lưu..." : "Tạo đơn hàng"}</PrimaryBtn>
      </div>
    </Modal>
  );
}

// ─── EditOrderModal ───────────────────────────────────────────────────────────
function EditOrderModal({ donHang, onClose, onSaved }: { donHang: DonHang; onClose: () => void; onSaved: () => void }) {
  const [lots, setLots] = useState<LoNongSan[]>([]);
  const [chiTiet, setChiTiet] = useState<ChiTietDonHang[]>([]);
  const [ghiChu, setGhiChu] = useState(donHang.GhiChu || "");
  const [newRows, setNewRows] = useState<ChiTietRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    apiFetch("/api/lo-nong-san/get-all").then(d => setLots(Array.isArray(d) ? d : [])).catch(() => {});
    apiFetch(`/api/sieuthi/donhang/${donHang.MaDonHang}/chi-tiet`)
      .then(d => setChiTiet(Array.isArray(d) ? d : d.chiTiet || []))
      .catch(e => setErr(e.message));
  }, [donHang.MaDonHang]);

  async function handleSave() {
    setLoading(true); setErr("");
    try {
      await apiFetch(`/api/sieuthi/donhang/${donHang.MaDonHang}/ghi-chu`, {
        method: "PUT",
        body: JSON.stringify({ GhiChu: ghiChu }),
      });
      for (const row of newRows.filter(r => r.maLo && r.soLuong && r.donGia)) {
        await apiFetch("/api/sieuthi/donhang/them-chi-tiet", {
          method: "POST",
          body: JSON.stringify({ MaDonHang: donHang.MaDonHang, MaLo: Number(row.maLo), SoLuong: Number(row.soLuong), DonGia: Number(row.donGia) }),
        });
      }
      onSaved(); onClose();
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Lỗi cập nhật");
    } finally { setLoading(false); }
  }

  async function handleDeleteChiTiet(maChiTiet: number) {
    if (!window.confirm("Xóa sản phẩm này khỏi đơn?")) return;
    try {
      await apiFetch(`/api/sieuthi/donhang/xoa-chi-tiet`, {
        method: "DELETE",
        body: JSON.stringify({ MaChiTiet: maChiTiet }),
      });
      setChiTiet(cs => cs.filter(c => c.MaChiTiet !== maChiTiet));
    } catch (e: unknown) { setErr(e instanceof Error ? e.message : "Lỗi xóa"); }
  }

  return (
    <Modal title={`Sửa đơn hàng #${donHang.MaDonHang}`} onClose={onClose} wide>
      {err && <div className="error-msg">{err}</div>}
      <FormField label="Ghi chú">
        <input className="input" value={ghiChu} onChange={e => setGhiChu(e.target.value)} />
      </FormField>
      <div className="u-mb-5">
        <label className="form-label">Sản phẩm hiện tại</label>
        {chiTiet.length === 0 ? <p className="u-text-muted u-text-sm">Chưa có sản phẩm</p> : (
          <StyledTable headers={["Sản phẩm", "Số lượng", "Đơn giá", "Thành tiền", ""]}>
            {chiTiet.map(c => (
              <tr key={c.MaChiTiet}>
                <Td><b>{c.TenSanPham || `#${c.MaLoNongSan}`}</b></Td>
                <Td>{c.SoLuong}</Td>
                <Td>{c.DonGia.toLocaleString()} đ</Td>
                <Td><b>{(c.ThanhTien ?? c.SoLuong * c.DonGia).toLocaleString()} đ</b></Td>
                <Td><ActionBtn onClick={() => handleDeleteChiTiet(c.MaChiTiet)} color="#dc2626">Xóa</ActionBtn></Td>
              </tr>
            ))}
          </StyledTable>
        )}
      </div>
      <div className="u-mb-4">
        <div className="u-flex u-justify-between u-items-center u-mb-3">
          <label className="form-label u-mb-1">Thêm sản phẩm mới</label>
          <button className="btn btn-secondary" style={{ padding: "4px 12px" }} onClick={() => setNewRows(rs => [...rs, { maDaiLy: "", maLo: "", tenSanPham: "", soLuong: "", donGia: "" }])}>+ Thêm</button>
        </div>
        {newRows.map((row, i) => (
          <div key={i} className="u-grid u-gap-2 u-mb-2 u-items-center" style={{ gridTemplateColumns: "2fr 1fr 1fr 28px" }}>
            <select className="select" value={row.maLo} onChange={e => setNewRows(rs => rs.map((r, idx) => idx === i ? { ...r, maLo: e.target.value } : r))}>
              <option value="">-- Chọn lô --</option>
              {lots.map(l => <option key={l.MaLo} value={l.MaLo}>{l.TenSanPham}</option>)}
            </select>
            <input className="input" type="number" placeholder="SL" value={row.soLuong} onChange={e => setNewRows(rs => rs.map((r, idx) => idx === i ? { ...r, soLuong: e.target.value } : r))} />
            <input className="input" type="number" placeholder="Giá" value={row.donGia} onChange={e => setNewRows(rs => rs.map((r, idx) => idx === i ? { ...r, donGia: e.target.value } : r))} />
            <button onClick={() => setNewRows(rs => rs.filter((_, idx) => idx !== i))} className="u-text-danger u-text-xl" style={{ background: "none", border: "none", cursor: "pointer" }}>×</button>
          </div>
        ))}
      </div>
      <div className="u-flex u-justify-end u-gap-3 u-mt-6 u-py-6 u-border-t">
        <button className="btn btn-secondary" onClick={onClose}>Hủy</button>
        <PrimaryBtn onClick={handleSave}>{loading ? "Đang lưu..." : "Lưu thay đổi"}</PrimaryBtn>
      </div>
    </Modal>
  );
}

// ─── KhoModal ─────────────────────────────────────────────────────────────────
function KhoModal({ kho, maSieuThi, onClose, onSaved }: { kho: KhoHang | null; maSieuThi: number; onClose: () => void; onSaved: () => void }) {
  const [tenKho, setTenKho] = useState(kho?.TenKho || "");
  const [diaChi, setDiaChi] = useState(kho?.DiaChi || "");
  const [trangThai, setTrangThai] = useState(kho?.TrangThai || "hoat_dong");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  async function handleSave() {
    setLoading(true); setErr("");
    try {
      if (!tenKho.trim()) throw new Error("Vui lòng nhập tên kho");
      if (kho) {
        await apiFetch("/api/KhoHang/cap-nhat-kho", {
          method: "PUT",
          body: JSON.stringify({ MaKho: kho.MaKho, TenKho: tenKho, DiaChi: diaChi, TrangThai: trangThai }),
        });
      } else {
        await apiFetch("/api/KhoHang/tao-kho", {
          method: "POST",
          body: JSON.stringify({ LoaiKho: "sieuthi", MaSieuThi: maSieuThi, TenKho: tenKho, DiaChi: diaChi }),
        });
      }
      onSaved(); onClose();
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Lỗi lưu kho");
    } finally { setLoading(false); }
  }

  return (
    <Modal title={kho ? `Sửa kho: ${kho.TenKho}` : "Tạo kho mới"} onClose={onClose}>
      {err && <div className="error-msg">{err}</div>}
      <FormField label="Tên kho *">
        <input className="input" value={tenKho} onChange={e => setTenKho(e.target.value)} placeholder="Nhập tên kho..." />
      </FormField>
      <FormField label="Địa chỉ">
        <input className="input" value={diaChi} onChange={e => setDiaChi(e.target.value)} placeholder="Địa chỉ kho..." />
      </FormField>
      {kho && (
        <FormField label="Trạng thái">
          <select className="select" value={trangThai} onChange={e => setTrangThai(e.target.value)}>
            <option value="hoat_dong">Hoạt động</option>
            <option value="tam_dong">Tạm dừng</option>
          </select>
        </FormField>
      )}
      <div className="u-flex u-justify-end u-gap-3 u-mt-6 u-py-6 u-border-t">
        <button className="btn btn-secondary" onClick={onClose}>Hủy</button>
        <PrimaryBtn onClick={handleSave}>{loading ? "Đang lưu..." : kho ? "Cập nhật" : "Tạo kho"}</PrimaryBtn>
      </div>
    </Modal>
  );
}

// ─── ProfileModal ─────────────────────────────────────────────────────────────
function ProfileModal({ onClose, onEdit }: { onClose: () => void; onEdit: () => void }) {
  const user = getCurrentUser();
  if (!user) return null;
  return (
    <Modal title="Thông tin tài khoản" onClose={onClose}>
      <div className="u-flex u-flex-col u-gap-4">
        <div className="u-flex u-items-center u-gap-5 u-p-6 u-rounded-lg u-border" style={{ background: "linear-gradient(135deg, #f8fafc 0%, #eff6ff 100%)" }}>
          <div className="avatar" style={{ width: 64, height: 64, fontSize: 24 }}>
            {user.tenHienThi?.charAt(0).toUpperCase() || "S"}
          </div>
          <div>
            <div className="u-font-black u-text-lg u-text-dark">{user.tenHienThi}</div>
            <div className="u-text-sm u-text-primary u-font-bold" style={{ textTransform: "uppercase", letterSpacing: 1 }}>Cửa hàng Siêu thị</div>
          </div>
        </div>
        <div className="u-px-2">
          {[
            { label: "Mã tài khoản", value: user.maTaiKhoan },
            { label: "Số điện thoại", value: user.soDienThoai || "—" },
            { label: "Email", value: user.email || "—" },
            { label: "Địa chỉ", value: user.diaChi || "—" },
          ].map(item => (
            <div key={item.label} className="u-flex u-justify-between u-border-b" style={{ padding: "14px 0" }}>
              <span className="u-text-sm u-text-muted u-font-medium">{item.label}</span>
              <span className="u-text-sm u-font-bold u-text-dark">{String(item.value)}</span>
            </div>
          ))}
        </div>
        <div className="u-flex u-justify-end u-mt-3">
          <PrimaryBtn onClick={onEdit}>Chỉnh sửa thông tin</PrimaryBtn>
        </div>
      </div>
    </Modal>
  );
}

function EditProfileModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const user = getCurrentUser();
  const [hoTen, setHoTen] = useState(user?.tenHienThi || "");
  const [sdt, setSdt] = useState(user?.soDienThoai || "");
  const [email, setEmail] = useState(user?.email || "");
  const [diaChi, setDiaChi] = useState(user?.diaChi || "");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  async function handleSave() {
    if (!user) return;
    setLoading(true); setErr("");
    try {
      await apiUpdateProfile({ maTaiKhoan: user.maTaiKhoan, hoTen, soDienThoai: sdt, email, diaChi });
      onSaved(); onClose();
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Lỗi cập nhật");
    } finally { setLoading(false); }
  }

  return (
    <Modal title="Chỉnh sửa thông tin" onClose={onClose}>
      {err && <div className="error-msg">{err}</div>}
      <FormField label="Họ tên"><input className="input" value={hoTen} onChange={e => setHoTen(e.target.value)} /></FormField>
      <FormField label="Số điện thoại"><input className="input" value={sdt} onChange={e => setSdt(e.target.value)} /></FormField>
      <FormField label="Email"><input className="input" value={email} onChange={e => setEmail(e.target.value)} /></FormField>
      <FormField label="Địa chỉ"><input className="input" value={diaChi} onChange={e => setDiaChi(e.target.value)} /></FormField>
      <div className="u-flex u-justify-end u-gap-3 u-mt-6 u-py-6 u-border-t">
        <button className="btn btn-secondary" onClick={onClose}>Hủy</button>
        <PrimaryBtn onClick={handleSave}>{loading ? "Đang lưu..." : "Lưu thay đổi"}</PrimaryBtn>
      </div>
    </Modal>
  );
}

// ─── Dashboard Section ────────────────────────────────────────────────────────
function DashboardSection({ donHangs, khoHangs, onViewOrder }: {
  donHangs: DonHang[];
  khoHangs: KhoHang[];
  onViewOrder: (d: DonHang) => void;
}) {
  const tongDon = donHangs.length;
  const choNhan = donHangs.filter(d => d.TrangThai === "chua_nhan").length;
  const daNhan = donHangs.filter(d => d.TrangThai === "da_nhan").length;
  const tonKho = khoHangs.reduce((s, k) => s + (k.TongTonKho || 0), 0);

  return (
    <div>
      <div className="stat-grid">
        <StatCard icon="📋" label="Tổng đơn hàng" value={tongDon} accent="#2563eb" />
        <StatCard icon="⏳" label="Chờ nhận" value={choNhan} accent="#d97706" />
        <StatCard icon="✅" label="Đã nhận" value={daNhan} accent="#059669" />
        <StatCard icon="📦" label="Tồn kho (kg)" value={tonKho.toLocaleString()} accent="#7c3aed" />
      </div>
      <div className="u-grid u-gap-6" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))" }}>
        <Panel>
          <div className="panel-title">Đơn hàng gần đây</div>
          {donHangs.length === 0
            ? <p className="empty-msg">Chưa có đơn hàng nào</p>
            : <StyledTable headers={["Mã đơn", "Đại lý", "Tổng SL", "Tổng GT", "Ngày đặt", "TT"]}>
                {donHangs.slice(0, 6).map(d => (
                  <tr key={d.MaDonHang} onClick={() => onViewOrder(d)} style={{ cursor: "pointer" }}>
                    <Td><code className="u-text-sm u-text-primary u-font-bold">#{d.MaDonHang}</code></Td>
                    <Td>{d.TenDaiLy || `#${d.MaDaiLy}`}</Td>
                    <Td>{d.TongSoLuong ? d.TongSoLuong.toLocaleString() : "—"}</Td>
                    <Td>{d.TongGiaTri ? d.TongGiaTri.toLocaleString() + " đ" : "—"}</Td>
                    <Td>{d.NgayDat ? new Date(d.NgayDat).toLocaleDateString("vi-VN") : "—"}</Td>
                    <Td><StatusBadge status={d.TrangThai} /></Td>
                  </tr>
                ))}
              </StyledTable>
          }
        </Panel>
        <Panel>
          <div className="panel-title">Tổng quan kho hàng</div>
          {khoHangs.length === 0
            ? <p className="empty-msg">Chưa có kho nào</p>
            : <div className="u-grid u-gap-4" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}>
                {khoHangs.map(k => (
                  <div key={k.MaKho} className="u-p-6 u-rounded-lg u-border" style={{ background: "linear-gradient(135deg, #f8fafc 0%, #eff6ff 100%)" }}>
                    <div className="u-font-black u-text-dark u-text-md u-mb-1">{k.TenKho}</div>
                    <div className="u-text-sm u-text-muted">{k.DiaChi || "—"}</div>
                    <div className="u-text-primary u-font-black u-mt-3" style={{ fontSize: 15 }}>
                      {(k.TongTonKho || 0).toLocaleString()} <span className="u-text-sm u-font-medium">kg</span>
                    </div>
                  </div>
                ))}
              </div>
          }
        </Panel>
      </div>
    </div>
  );
}

// ─── Orders Section ───────────────────────────────────────────────────────────
function OrdersSection({
  donHangs, onView, onEdit, onNhan, onHuy, onXoa, onNew, onRefresh
}: {
  donHangs: DonHang[];
  onView: (d: DonHang) => void;
  onEdit: (d: DonHang) => void;
  onNhan: (id: number) => void;
  onHuy: (id: number) => void;
  onXoa: (id: number) => void;
  onNew: () => void;
  onRefresh: () => void;
}) {
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  const filtered = donHangs.filter(d => {
    const matchSearch = !search || String(d.MaDonHang).includes(search) || (d.TenDaiLy || "").toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "all" || d.TrangThai === filterStatus;
    return matchSearch && matchStatus;
  });

  return (
    <Panel>
      <div className="panel-title u-flex u-flex-wrap u-gap-4">
        <span>Quản lý đơn hàng</span>
        <div className="u-flex u-flex-wrap u-gap-3 u-items-center">
          <input
            className="input"
            style={{ width: 220, padding: "8px 16px" }}
            placeholder="Tìm kiếm mã đơn, đại lý..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <select className="select" style={{ width: 180, padding: "8px 16px" }} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
            <option value="all">Tất cả trạng thái</option>
            <option value="chua_nhan">Chưa nhận</option>
            <option value="da_nhan">Đã nhận</option>
            <option value="da_huy">Đã hủy</option>
          </select>
          <PrimaryBtn onClick={onNew}>+ Tạo đơn hàng</PrimaryBtn>
        </div>
      </div>
      {filtered.length === 0
        ? <p className="empty-msg">Không tìm thấy đơn hàng nào</p>
        : <StyledTable headers={["Mã đơn", "Đại lý", "Tổng SL", "Tổng giá trị", "Ghi chú", "Ngày đặt", "Trạng thái", "Thao tác"]}>
            {filtered.map(d => (
              <tr key={d.MaDonHang}>
                <Td><code className="u-text-sm u-text-primary u-font-bold">#{d.MaDonHang}</code></Td>
                <Td><b>{d.TenDaiLy || `#${d.MaDaiLy}`}</b></Td>
                <Td>{d.TongSoLuong ? d.TongSoLuong.toLocaleString() : "—"}</Td>
                <Td>{d.TongGiaTri ? d.TongGiaTri.toLocaleString() + " đ" : "—"}</Td>
                <Td className="u-text-muted u-text-sm" style={{ maxWidth: 160 }}>{d.GhiChu || "—"}</Td>
                <Td>{d.NgayDat ? new Date(d.NgayDat).toLocaleDateString("vi-VN") : "—"}</Td>
                <Td><StatusBadge status={d.TrangThai} /></Td>
                <Td>
                  <div className="u-flex u-gap-1">
                    <ActionBtn onClick={() => onView(d)} color="var(--primary)">Xem</ActionBtn>
                    {d.TrangThai === "chua_nhan" && <>
                      <ActionBtn onClick={() => onEdit(d)} color="#7c3aed">Sửa</ActionBtn>
                      <ActionBtn onClick={() => onNhan(d.MaDonHang)} color="#059669">Nhận</ActionBtn>
                      <ActionBtn onClick={() => onHuy(d.MaDonHang)} color="#d97706">Hủy</ActionBtn>
                      <ActionBtn onClick={() => onXoa(d.MaDonHang)} color="#dc2626">Xóa</ActionBtn>
                    </>}
                  </div>
                </Td>
              </tr>
            ))}
          </StyledTable>
      }
    </Panel>
  );
}

// ─── Receive Section ──────────────────────────────────────────────────────────
function ReceiveSection({
  donHangs, onView, onNhan
}: {
  donHangs: DonHang[];
  onView: (d: DonHang) => void;
  onNhan: (id: number) => void;
}) {
  const choNhan = donHangs.filter(d => d.TrangThai === "chua_nhan");
  const daNhanHomNay = donHangs.filter(d => {
    if (d.TrangThai !== "da_nhan") return false;
    if (!d.NgayDat) return false;
    const today = new Date().toDateString();
    return new Date(d.NgayDat).toDateString() === today;
  });

  return (
    <div>
      <div className="stat-grid">
        <StatCard icon="⏳" label="Đơn chờ nhận" value={choNhan.length} accent="#d97706" />
        <StatCard icon="✅" label="Đã nhận hôm nay" value={daNhanHomNay.length} accent="#059669" />
      </div>
      <Panel>
        <div className="panel-title">Đơn hàng chờ nhận hàng</div>
        {choNhan.length === 0
          ? <p className="empty-msg">Không có đơn hàng nào chờ nhận</p>
          : <StyledTable headers={["Mã đơn", "Đại lý", "Tổng SL", "Tổng giá trị", "Ngày đặt", "Trạng thái", "Thao tác"]}>
              {choNhan.map(d => (
                <tr key={d.MaDonHang}>
                  <Td><code className="u-text-sm u-text-primary u-font-bold">#{d.MaDonHang}</code></Td>
                  <Td><b>{d.TenDaiLy || `#${d.MaDaiLy}`}</b></Td>
                  <Td>{d.TongSoLuong ? d.TongSoLuong.toLocaleString() : "—"}</Td>
                  <Td>{d.TongGiaTri ? d.TongGiaTri.toLocaleString() + " đ" : "—"}</Td>
                  <Td>{d.NgayDat ? new Date(d.NgayDat).toLocaleDateString("vi-VN") : "—"}</Td>
                  <Td><StatusBadge status={d.TrangThai} /></Td>
                  <Td>
                    <div className="u-flex u-gap-2">
                      <ActionBtn onClick={() => onView(d)} color="var(--primary)">Xem</ActionBtn>
                      <ActionBtn onClick={() => onNhan(d.MaDonHang)} color="#059669">Xác nhận nhận hàng</ActionBtn>
                    </div>
                  </Td>
                </tr>
              ))}
            </StyledTable>
        }
      </Panel>
    </div>
  );
}

// ─── Inventory Section ────────────────────────────────────────────────────────
function InventorySection({
  khoHangs, onNewKho, onEditKho, onDeleteKho
}: {
  khoHangs: KhoHang[];
  onNewKho: () => void;
  onEditKho: (k: KhoHang) => void;
  onDeleteKho: (id: number) => void;
}) {
  const soKho = khoHangs.length;
  const tongTonKho = khoHangs.reduce((s, k) => s + (k.TongTonKho || 0), 0);
  const loaiSanPham = khoHangs.reduce((s, k) => s + (k.SoLoaiSanPham || 0), 0);

  return (
    <div>
      <div className="stat-grid">
        <StatCard icon="🏪" label="Số kho" value={soKho} accent="#2563eb" />
        <StatCard icon="📦" label="Tổng tồn kho (kg)" value={tongTonKho.toLocaleString()} accent="#7c3aed" />
        <StatCard icon="🌿" label="Loại sản phẩm" value={loaiSanPham} accent="#059669" />
      </div>
      <Panel>
        <div className="panel-title u-flex u-justify-between u-items-center">
          <span>Quản lý kho hàng</span>
          <PrimaryBtn onClick={onNewKho}>+ Tạo kho mới</PrimaryBtn>
        </div>
        {khoHangs.length === 0
          ? <p className="empty-msg">Chưa có kho nào</p>
          : khoHangs.map(k => (
              <div key={k.MaKho} className="u-mb-6 u-border u-rounded-lg" style={{ overflow: "hidden", boxShadow: "var(--shadow-sm)" }}>
                <div className="u-flex u-justify-between u-items-center u-p-4 u-bg-light u-border-b">
                  <div>
                    <span className="u-font-black u-text-dark" style={{ fontSize: 15 }}>{k.TenKho}</span>
                    {k.DiaChi && <span className="u-text-sm u-text-muted u-font-medium" style={{ marginLeft: 12 }}>{k.DiaChi}</span>}
                  </div>
                  <div className="u-flex u-gap-3 u-items-center">
                    <span className="badge" style={{ background: "rgba(37,99,235,0.1)", color: "var(--primary)", padding: "6px 14px" }}>Tồn kho: {(k.TongTonKho || 0).toLocaleString()} kg</span>
                    <ActionBtn onClick={() => onEditKho(k)} color="#7c3aed">Sửa</ActionBtn>
                    <ActionBtn onClick={() => onDeleteKho(k.MaKho)} color="#dc2626">Xóa</ActionBtn>
                  </div>
                </div>
                {k.SanPham && k.SanPham.length > 0 ? (
                  <div style={{ padding: "8px 20px 20px" }}>
                    <StyledTable headers={["Sản phẩm", "Số lượng", "Đơn vị"]}>
                      {k.SanPham.map((sp, i) => (
                        <tr key={i}>
                          <Td><b>{sp.TenSanPham}</b></Td>
                          <Td>{sp.SoLuong.toLocaleString()}</Td>
                          <Td>{sp.DonVi || "kg"}</Td>
                        </tr>
                      ))}
                    </StyledTable>
                  </div>
                ) : <p className="empty-msg">Kho trống</p>}
              </div>
            ))
        }
      </Panel>
    </div>
  );
}

// ─── Reports Section ──────────────────────────────────────────────────────────
function ReportsSection({ donHangs }: { donHangs: DonHang[] }) {
  const tongDon = donHangs.length;
  const daNhan = donHangs.filter(d => d.TrangThai === "da_nhan").length;
  const choNhan = donHangs.filter(d => d.TrangThai === "chua_nhan").length;
  const daHuy = donHangs.filter(d => d.TrangThai === "da_huy").length;
  const tongGiaTri = donHangs.reduce((s, d) => s + (d.TongGiaTri || 0), 0);
  const tongSoLuong = donHangs.reduce((s, d) => s + (d.TongSoLuong || 0), 0);

  const kpis = [
    { icon: "📋", label: "Tổng đơn hàng", value: tongDon, color: "#2563eb" },
    { icon: "✅", label: "Đã nhận", value: daNhan, color: "#059669" },
    { icon: "⏳", label: "Chờ nhận", value: choNhan, color: "#d97706" },
    { icon: "❌", label: "Đã hủy", value: daHuy, color: "#dc2626" },
    { icon: "💰", label: "Tổng giá trị (đ)", value: tongGiaTri.toLocaleString(), color: "#7c3aed" },
    { icon: "📦", label: "Tổng số lượng (kg)", value: tongSoLuong.toLocaleString(), color: "#0891b2" },
  ];

  // Group by dai ly
  const byDaiLy: Record<string, { ten: string; tongDon: number; daNhan: number; tongGiaTri: number }> = {};
  donHangs.forEach(d => {
    const key = String(d.MaDaiLy);
    if (!byDaiLy[key]) byDaiLy[key] = { ten: d.TenDaiLy || `Đại lý #${d.MaDaiLy}`, tongDon: 0, daNhan: 0, tongGiaTri: 0 };
    byDaiLy[key].tongDon++;
    if (d.TrangThai === "da_nhan") byDaiLy[key].daNhan++;
    byDaiLy[key].tongGiaTri += d.TongGiaTri || 0;
  });
  const daiLyStats = Object.values(byDaiLy);

  return (
    <div>
      <div className="u-grid u-gap-5 u-mb-6" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}>
        {kpis.map(k => (
          <Panel key={k.label} className="u-text-center" style={{ borderTop: `4px solid ${k.color}` }}>
            <div className="u-text-2xl u-mb-3">{k.icon}</div>
            <div className="u-text-sm u-text-muted u-font-bold u-mb-2" style={{ textTransform: "uppercase" }}>{k.label}</div>
            <div className="u-text-xl u-font-black" style={{ color: k.color }}>{k.value}</div>
          </Panel>
        ))}
      </div>
      <Panel className="u-mb-6">
        <div className="panel-title">Thống kê theo đại lý</div>
        {daiLyStats.length === 0
          ? <p className="empty-msg">Chưa có dữ liệu</p>
          : <StyledTable headers={["Đại lý", "Tổng đơn", "Đã nhận", "Tỉ lệ nhận", "Tổng giá trị"]}>
              {daiLyStats.map((dl, i) => {
                const tl = dl.tongDon > 0 ? Math.round((dl.daNhan / dl.tongDon) * 100) : 0;
                return (
                  <tr key={i}>
                    <Td><b>{dl.ten}</b></Td>
                    <Td>{dl.tongDon}</Td>
                    <Td>{dl.daNhan}</Td>
                    <Td>
                      <div className="u-flex u-items-center u-gap-3">
                        <div style={{ flex: 1, height: 8, background: "#f1f5f9", borderRadius: 4, overflow: "hidden" }}>
                          <div style={{ width: `${tl}%`, height: "100%", background: "linear-gradient(90deg, #10b981 0%, #059669 100%)", borderRadius: 4 }} />
                        </div>
                        <span className="u-text-sm u-font-black u-text-success" style={{ minWidth: 40 }}>{tl}%</span>
                      </div>
                    </Td>
                    <Td><b>{dl.tongGiaTri.toLocaleString()} đ</b></Td>
                  </tr>
                );
              })}
            </StyledTable>
        }
      </Panel>
      <Panel>
        <div className="panel-title">Lịch sử đơn hàng đầy đủ</div>
        {donHangs.length === 0
          ? <p className="empty-msg">Chưa có đơn hàng nào</p>
          : <StyledTable headers={["Mã đơn", "Đại lý", "Tổng SL", "Tổng giá trị", "Ngày đặt", "Trạng thái"]}>
              {donHangs.map(d => (
                <tr key={d.MaDonHang}>
                  <Td><code className="u-text-sm u-text-primary u-font-bold">#{d.MaDonHang}</code></Td>
                  <Td>{d.TenDaiLy || `#${d.MaDaiLy}`}</Td>
                  <Td>{d.TongSoLuong ? d.TongSoLuong.toLocaleString() : "—"}</Td>
                  <Td>{d.TongGiaTri ? d.TongGiaTri.toLocaleString() + " đ" : "—"}</Td>
                  <Td>{d.NgayDat ? new Date(d.NgayDat).toLocaleDateString("vi-VN") : "—"}</Td>
                  <Td><StatusBadge status={d.TrangThai} /></Td>
                </tr>
              ))}
            </StyledTable>
        }
      </Panel>
    </div>
  );
}

// ─── Main SieuThiApp ──────────────────────────────────────────────────────────
export default function SieuThiApp() {
  const authUser = getCurrentUser();

  useEffect(() => {
    if (!authUser || authUser.role !== "sieuthi") {
      window.location.href = "/login";
    }
  }, [authUser]);

  const maSieuThi = authUser?.maDoiTuong || 0;

  type Section = "dashboard" | "orders" | "receive" | "inventory" | "reports";
  const [activeSection, setActiveSection] = useState<Section>("dashboard");
  const [donHangs, setDonHangs] = useState<DonHang[]>([]);
  const [khoHangs, setKhoHangs] = useState<KhoHang[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  // Modals
  const [viewOrder, setViewOrder] = useState<DonHang | null>(null);
  const [editOrder, setEditOrder] = useState<DonHang | null>(null);
  const [showNewOrder, setShowNewOrder] = useState(false);
  const [editKho, setEditKho] = useState<KhoHang | null>(null);
  const [showNewKho, setShowNewKho] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);

  function showToast(msg: string, type: "success" | "error" = "success") {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }

  async function loadData() {
    if (!maSieuThi) return;
    setLoading(true);
    try {
      const [dh, kh] = await Promise.all([
        apiFetch(`/api/sieuthi/donhang/sieu-thi/${maSieuThi}`).then(d => Array.isArray(d) ? d : d.donHangs || []),
        apiFetch(`/api/KhoHang/sieu-thi/${maSieuThi}`).then(d => Array.isArray(d) ? d : d.khoHangs || []),
      ]);
      setDonHangs(dh);
      setKhoHangs(kh);
    } catch (e) {
      showToast("Lỗi tải dữ liệu", "error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadData(); }, [maSieuThi]); // loadData is defined inside component but not memoized, using maSieuThi is enough

  async function handleNhan(id: number) {
    if (!window.confirm("Xác nhận nhận hàng đơn #" + id + "?")) return;
    try {
      await apiFetch(`/api/sieuthi/donhang/nhan-hang/${id}`, { method: "PUT" });
      showToast("Nhận hàng thành công!");
      loadData();
    } catch (e: unknown) { showToast(e instanceof Error ? e.message : "Lỗi nhận hàng", "error"); }
  }

  async function handleHuy(id: number) {
    if (!window.confirm("Hủy đơn hàng #" + id + "?")) return;
    try {
      await apiFetch(`/api/sieuthi/donhang/huy-don-hang/${id}`, { method: "PUT" });
      showToast("Đã hủy đơn hàng");
      loadData();
    } catch (e: unknown) { showToast(e instanceof Error ? e.message : "Lỗi hủy đơn", "error"); }
  }

  async function handleXoa(id: number) {
    if (!window.confirm("Xóa đơn hàng #" + id + "? Hành động này không thể hoàn tác.")) return;
    try {
      await apiFetch(`/api/sieuthi/donhang/${id}`, { method: "DELETE" });
      showToast("Đã xóa đơn hàng");
      loadData();
    } catch (e: unknown) { showToast(e instanceof Error ? e.message : "Lỗi xóa đơn", "error"); }
  }

  async function handleDeleteKho(id: number) {
    if (!window.confirm("Xóa kho này?")) return;
    try {
      await apiFetch(`/api/KhoHang/xoa-kho/${id}`, { method: "DELETE" });
      showToast("Đã xóa kho");
      loadData();
    } catch (e: unknown) { showToast(e instanceof Error ? e.message : "Lỗi xóa kho", "error"); }
  }

  function handleLogout() {
    clearCurrentUser();
    window.location.href = "/login";
  }

  if (!authUser || authUser.role !== "sieuthi") return null;

  const navItems: { id: Section; icon: string; label: string }[] = [
    { id: "dashboard", icon: "📊", label: "Tổng quan" },
    { id: "orders",    icon: "📋", label: "Quản lý đơn hàng" },
    { id: "receive",   icon: "📥", label: "Nhận hàng" },
    { id: "inventory", icon: "🏪", label: "Quản lý kho" },
    { id: "reports",   icon: "📈", label: "Báo cáo thống kê" },
  ];

  return (
    <div className="sieuthi-app">
      {/* Sidebar */}
      <div className="sidebar">
        <div className="sidebar-header">
          <div className="logo">AgriChain</div>
          <div className="logo-sub">Siêu thị</div>
        </div>
        <nav className="nav-list">
          {navItems.map(item => (
            <button key={item.id} onClick={() => setActiveSection(item.id)}
              className={`nav-item ${activeSection === item.id ? 'active' : ''}`}>
              <span className="nav-icon">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>
        <div className="sidebar-footer">
          <button className="profile-btn" onClick={() => setShowProfile(true)}>
            <div className="avatar">
              {authUser.tenHienThi?.charAt(0).toUpperCase() || "S"}
            </div>
            <div className="u-text-left" style={{ overflow: "hidden" }}>
              <div className="u-font-black u-text-md" style={{ color: "#fff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{authUser.tenHienThi}</div>
              <div className="u-text-sm u-font-bold" style={{ color: "var(--primary-light)" }}>Cửa hàng của tôi</div>
            </div>
          </button>
          <button className="logout-btn" onClick={handleLogout}>
            Đăng xuất
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="main-content">
        <div className="page-header">
          <h2 className="page-title">
            <span className="u-text-2xl">{navItems.find(n => n.id === activeSection)?.icon}</span>
            {navItems.find(n => n.id === activeSection)?.label}
          </h2>
          <p className="page-subtitle">Chào mừng trở lại, {authUser.tenHienThi}</p>
        </div>

        {loading ? (
          <div className="u-text-center u-py-10">
            <div className="spinner" style={{ border: "4px solid #f3f3f3", borderTop: "4px solid var(--primary)", borderRadius: "50%", width: 40, height: 40, animation: "spin 1s linear infinite", margin: "0 auto 20px" }}></div>
            <div className="u-text-muted u-text-lg u-font-medium">Đang tải dữ liệu...</div>
          </div>
        ) : (
          <div className="section-content u-fade-in" key={activeSection}>
            {activeSection === "dashboard" && (
              <DashboardSection donHangs={donHangs} khoHangs={khoHangs} onViewOrder={setViewOrder} />
            )}
            {activeSection === "orders" && (
              <OrdersSection
                donHangs={donHangs}
                onView={setViewOrder}
                onEdit={setEditOrder}
                onNhan={handleNhan}
                onHuy={handleHuy}
                onXoa={handleXoa}
                onNew={() => setShowNewOrder(true)}
                onRefresh={loadData}
              />
            )}
            {activeSection === "receive" && (
              <ReceiveSection donHangs={donHangs} onView={setViewOrder} onNhan={handleNhan} />
            )}
            {activeSection === "inventory" && (
              <InventorySection
                khoHangs={khoHangs}
                onNewKho={() => setShowNewKho(true)}
                onEditKho={setEditKho}
                onDeleteKho={handleDeleteKho}
              />
            )}
            {activeSection === "reports" && (
              <ReportsSection donHangs={donHangs} />
            )}
          </div>
        )}
      </div>

      {/* Toast */}
      {toast && (
        <div className="toast" style={{ background: toast.type === "success" ? "var(--success)" : "var(--danger)" }}>
          <span className="u-text-lg">{toast.type === "success" ? "✓" : "✕"}</span>
          {toast.msg}
        </div>
      )}

      {/* Modals */}
      {viewOrder && <OrderDetailModal donHang={viewOrder} onClose={() => setViewOrder(null)} />}
      {showNewOrder && <OrderModal maSieuThi={maSieuThi} onClose={() => setShowNewOrder(false)} onSaved={() => { loadData(); showToast("Tạo đơn hàng thành công!"); }} />}
      {editOrder && <EditOrderModal donHang={editOrder} onClose={() => setEditOrder(null)} onSaved={() => { loadData(); showToast("Cập nhật đơn hàng thành công!"); }} />}
      {showNewKho && <KhoModal kho={null} maSieuThi={maSieuThi} onClose={() => setShowNewKho(false)} onSaved={() => { loadData(); showToast("Tạo kho thành công!"); }} />}
      {editKho && <KhoModal kho={editKho} maSieuThi={maSieuThi} onClose={() => setEditKho(null)} onSaved={() => { loadData(); showToast("Cập nhật kho thành công!"); }} />}
      {showProfile && <ProfileModal onClose={() => setShowProfile(false)} onEdit={() => { setShowProfile(false); setShowEditProfile(true); }} />}
      {showEditProfile && <EditProfileModal onClose={() => setShowEditProfile(false)} onSaved={() => { showToast("Cập nhật thông tin thành công!"); }} />}
      
      <style>{`
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}