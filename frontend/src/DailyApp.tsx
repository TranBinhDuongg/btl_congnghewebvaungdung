import React, { useState, useEffect, useCallback, ReactNode } from "react";
import { getCurrentUser, clearCurrentUser, apiUpdateProfile } from "./AuthHelper.ts";
import "./DailyApp.css";

// ─── Types ────────────────────────────────────────────────────────────────────
export interface AgencyUser {
  id: string; fullName: string; username: string; email: string; phone: string;
  role: string; agencyName: string; agencyCode: string; province: string;
  district: string; address: string; createdAt: string;
}
export interface ImportReceipt {
  maPhieu: string; maLo: string; sanPham: string; soLuong: number;
  tenNong: string; khoNhap: string; khoNhapName?: string;
  ngayNhap: string; ghiChu?: string;
  status: "created" | "pending" | "preparing" | "shipped" | "received";
}
export interface Warehouse { maKho: string; tenKho: string; diaChi: string; soDienThoai: string; }
export interface InventoryBatch { maLo: string; maKho: string; sanPham: string; soLuong: number; ngayNhap: string; status: "in_stock" | "low" | "out"; }
export interface QualityCheck {
  maKiemDinh: string; maLo: string; tenSanPham?: string; ngayKiem: string; nguoiKiem: string;
  ketQua: "dat" | "khong_dat" | "A" | "B" | "C";
  trangThai?: "hoan_thanh" | "cho_duyet";
  bienBan?: string; ghiChu?: string;
}
export interface RetailOrder {
  maPhieu: string; maLo: string; sanPham: string; soLuong: number;
  sieu_thi: string; ngayTao: string;
  status: "pending" | "shipped" | "received" | "chua_nhan" | "da_nhan" | "dang_xu_ly" | "hoan_thanh" | "da_huy";
}

const EMPTY_USER: AgencyUser = {
  id: "", fullName: "", username: "", email: "", phone: "", role: "Đại lý",
  agencyName: "", agencyCode: "", province: "", district: "", address: "", createdAt: "",
};

// ─── Status config ────────────────────────────────────────────────────────────
const STATUS_MAP: Record<string, { label: string; color: string; bg: string }> = {
  created:             { label: "Đã tạo",        color: "#64748b", bg: "#f1f5f9" },
  pending:             { label: "Chờ xử lý",     color: "#b45309", bg: "#fef3c7" },
  preparing:           { label: "Chuẩn bị",      color: "#1d4ed8", bg: "#dbeafe" },
  shipped:             { label: "Đã xuất",        color: "#7c3aed", bg: "#ede9fe" },
  received:            { label: "Đã nhận",        color: "#059669", bg: "#d1fae5" },
  chua_nhan:           { label: "Chờ xác nhận",  color: "#b45309", bg: "#fef3c7" },
  da_nhan:             { label: "Đã xác nhận",   color: "#059669", bg: "#d1fae5" },
  dang_xu_ly:          { label: "Đang xử lý",    color: "#1d4ed8", bg: "#dbeafe" },
  hoan_thanh:          { label: "Hoàn thành",    color: "#15803d", bg: "#dcfce7" },
  da_huy:              { label: "Đã hủy",         color: "#6b7280", bg: "#f3f4f6" },
  in_stock:            { label: "Còn hàng",       color: "#15803d", bg: "#dcfce7" },
  low:                 { label: "Sắp hết",        color: "#dc2626", bg: "#fee2e2" },
  out:                 { label: "Hết hàng",       color: "#6b7280", bg: "#f3f4f6" },
  dat:                 { label: "✓ Đạt",          color: "#059669", bg: "#d1fae5" },
  khong_dat:           { label: "✗ Không đạt",    color: "#dc2626", bg: "#fee2e2" },
  A:                   { label: "Loại A",          color: "#15803d", bg: "#dcfce7" },
  B:                   { label: "Loại B",          color: "#1d4ed8", bg: "#dbeafe" },
  C:                   { label: "Loại C",          color: "#b45309", bg: "#fef3c7" },
  hoan_thanh_kd:       { label: "Hoàn thành",     color: "#15803d", bg: "#dcfce7" },
  cho_duyet:           { label: "Chờ duyệt",      color: "#b45309", bg: "#fef3c7" },
  "Đạt":               { label: "✓ Đạt",          color: "#059669", bg: "#d1fae5" },
  "Không đạt":         { label: "✗ Không đạt",    color: "#dc2626", bg: "#fee2e2" },
  "Yêu cầu bổ sung":  { label: "⚠ Bổ sung",      color: "#b45309", bg: "#fef3c7" },
};

function Toast({ msg, type }: { msg: string; type: "success" | "error" }) {
  return (
    <div className="toast" style={{ background: type === "success" ? "#16a34a" : "#dc2626" }}>
      {type === "success" ? "✅" : "❌"} {msg}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_MAP[status] ?? { label: status, color: "#555", bg: "#f3f4f6" };
  return (
    <span className="badge" style={{ color: s.color, background: s.bg }}>
      {s.label}
    </span>
  );
}

// ─── Shared micro-components ──────────────────────────────────────────────────
function Panel({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`panel ${className}`}>{children}</div>;
}

function StatCard({ icon, label, value, accent }: { icon: string; label: string; value: string | number; accent: string }) {
  return (
    <div className="stat-card" style={{ '--accent': accent } as any}>
      <div className="stat-icon">{icon}</div>
      <div>
        <div className="stat-value">{value}</div>
        <div className="stat-label">{label}</div>
      </div>
    </div>
  );
}

function SectionTitle({ children }: { children: ReactNode }) {
  return <h3 className="panel-title">{children}</h3>;
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

function Td({ children, className = "" }: { children?: ReactNode; className?: string }) {
  return <td className={className}>{children}</td>;
}

function ActionBtn({ children, onClick, variant = "primary" }: { children: ReactNode; onClick: () => void; variant?: "primary" | "danger" | "success" | "warning" | "info" }) {
  const bgMap = {
    primary: "var(--primary)",
    danger: "var(--danger)",
    success: "var(--success)",
    warning: "var(--warning)",
    info: "#6366f1"
  };
  return (
    <button className="btn btn-action u-mr-1" onClick={onClick} style={{ background: bgMap[variant] }}>
      {children}
    </button>
  );
}

function PrimaryBtn({ children, onClick }: { children: ReactNode; onClick?: () => void }) {
  return <button className="btn btn-primary" onClick={onClick}>{children}</button>;
}

// ─── Modal shell ──────────────────────────────────────────────────────────────
function Modal({ title, onClose, children, wide = false }: { title: string; onClose: () => void; children: ReactNode; wide?: boolean }) {
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

function FormField({ label, children, className = "" }: { label: string; children: ReactNode; className?: string }) {
  return (
    <div className={`form-field ${className}`}>
      <label className="form-label">{label}</label>
      {children}
    </div>
  );
}

// ─── Sections ─────────────────────────────────────────────────────────────────
function Dashboard({ receipts, quality, inventory, warehouses, onNewReceipt }: { receipts: ImportReceipt[]; quality: QualityCheck[]; inventory: InventoryBatch[]; warehouses: Warehouse[]; onNewReceipt: () => void }) {
  const alerts = quality.filter(q => q.ketQua !== "dat");
  const totalStock = inventory.reduce((s, b) => s + b.soLuong, 0);

  return (
    <div className="u-fade-in">
      <div className="stat-grid">
        <StatCard icon="📥" label="Phiếu nhập" value={receipts.length} accent="var(--success)" />
        <StatCard icon="🏪" label="Kho hàng" value={warehouses.length} accent="var(--primary)" />
        <StatCard icon="📦" label="Tổng tồn kho" value={`${totalStock} kg`} accent="#7c3aed" />
        <StatCard icon="⚠️" label="Cảnh báo chất lượng" value={alerts.length} accent="var(--danger)" />
      </div>

      <div className="u-grid u-grid-2-col u-gap-4">
        <Panel>
          <SectionTitle>📋 Đơn hàng gần đây</SectionTitle>
          {receipts.length === 0 ? (
            <p className="empty-msg">Chưa có đơn hàng nào</p>
          ) : (
            <StyledTable headers={["Mã đơn", "Nông dân", "Tổng SL", "Ghi chú", "Ngày đặt", "TT"]}>
              {receipts.slice(0, 5).map(r => (
                <tr key={r.maPhieu}>
                  <td><code className="u-text-sm u-text-muted">#{r.maPhieu}</code></td>
                  <td className="u-font-bold">{r.tenNong || "—"}</td>
                  <td>{r.soLuong > 0 ? `${r.soLuong.toLocaleString()} kg` : "—"}</td>
                  <td className="u-text-muted">{r.sanPham || "—"}</td>
                  <td>{r.ngayNhap || "—"}</td>
                  <td><StatusBadge status={r.status} /></td>
                </tr>
              ))}
            </StyledTable>
          )}
        </Panel>

        <Panel>
          <SectionTitle>🔬 Cảnh báo chất lượng</SectionTitle>
          {alerts.length === 0 ? (
            <p className="empty-msg">Không có cảnh báo</p>
          ) : (
            <StyledTable headers={["Mã KĐ", "Lô", "Kết quả", "Ngày", "Ghi chú"]}>
              {alerts.map(q => (
                <tr key={q.maKiemDinh}>
                  <td><code className="u-text-sm u-text-muted">{q.maKiemDinh}</code></td>
                  <td className="u-font-bold">{q.maLo}</td>
                  <td><StatusBadge status={q.ketQua} /></td>
                  <td>{q.ngayKiem}</td>
                  <td className="u-text-muted">{q.ghiChu || "—"}</td>
                </tr>
              ))}
            </StyledTable>
          )}
        </Panel>
      </div>
    </div>
  );
}

function DailyOrderDetailModal({ maPhieu, loai, onClose }: { maPhieu: string; loai: "import" | "retail"; onClose: () => void }) {
  const [details, setDetails] = useState<{ MaLo: number; TenSanPham: string; SoLuong: number; DonGia: number; ThanhTien: number }[]>([]);
  const [info, setInfo] = useState<{ tenDoiTac: string; ngayDat: string; trangThai: string; ghiChu: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const detailUrl = loai === "import"
      ? `/api/don-hang-dai-ly/${maPhieu}/chi-tiet`
      : `/api/sieuthi/donhang/${maPhieu}/chi-tiet`;
    const infoUrl = loai === "import"
      ? `/api/don-hang-dai-ly/get-by-id/${maPhieu}`
      : `/api/sieuthi/donhang/${maPhieu}`;

    Promise.all([
      fetch(detailUrl).then(r => r.json()),
      fetch(infoUrl).then(r => r.json()),
    ]).then(([d, o]) => {
      setDetails(Array.isArray(d) ? d : []);
      // get-by-id trả về array (join chi tiết), lấy row đầu
      const first = Array.isArray(o) ? o[0] : o;
      setInfo({
        tenDoiTac: loai === "import" ? (first?.TenNongDan || "—") : (first?.TenDaiLy || "—"),
        ngayDat: first?.NgayDat?.slice(0, 10) || "—",
        trangThai: first?.TrangThai || "",
        ghiChu: first?.GhiChu || "—",
      });
    }).catch(() => {}).finally(() => setLoading(false));
  }, [maPhieu, loai]);

  const tong = details.reduce((s, d) => s + (d.ThanhTien || d.SoLuong * d.DonGia || 0), 0);
  const labelDoiTac = loai === "import" ? "Nông dân" : "Đại lý";

  return (
    <Modal title={`Chi tiết đơn hàng #${maPhieu}`} onClose={onClose}>
      {loading ? <p className="empty-msg">Đang tải...</p> : (
        <>
          {info && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16, padding: "12px 14px", background: "#f8fafc", borderRadius: 10 }}>
              <div><span className="u-text-sm u-text-muted">{labelDoiTac}</span><div className="u-font-bold u-text-dark">{info.tenDoiTac}</div></div>
              <div><span className="u-text-sm u-text-muted">Ngày đặt</span><div className="u-font-bold u-text-dark">{info.ngayDat}</div></div>
              <div><span className="u-text-sm u-text-muted">Trạng thái</span><div style={{ marginTop: 3 }}><StatusBadge status={info.trangThai} /></div></div>
              <div><span className="u-text-sm u-text-muted">Ghi chú</span><div className="u-font-bold u-text-dark">{info.ghiChu}</div></div>
            </div>
          )}
          <StyledTable headers={["Sản phẩm", "Số lượng", "Đơn giá", "Thành tiền"]}>
            {details.length === 0
              ? <tr><td colSpan={4} className="empty-msg">Không có chi tiết</td></tr>
              : details.map((d, i) => (
                <tr key={i}>
                  <td className="u-font-bold">{d.TenSanPham}</td>
                  <td>{d.SoLuong?.toLocaleString("vi-VN")} kg</td>
                  <td>{d.DonGia?.toLocaleString("vi-VN")} đ</td>
                  <td><b style={{ color: "var(--primary)" }}>{(d.ThanhTien || d.SoLuong * d.DonGia)?.toLocaleString("vi-VN")} đ</b></td>
                </tr>
              ))
            }
          </StyledTable>
          {tong > 0 && (
            <div style={{ marginTop: 12, padding: "10px 14px", background: "#fef3c7", borderRadius: 8, display: "flex", justifyContent: "space-between" }}>
              <span className="u-font-bold">Tổng giá trị</span>
              <span style={{ fontWeight: 900, fontSize: 15, color: "var(--primary)" }}>{tong.toLocaleString("vi-VN")} đ</span>
            </div>
          )}
          <div className="u-flex u-justify-end u-mt-4">
            <button className="btn btn-secondary" onClick={onClose}>Đóng</button>
          </div>
        </>
      )}
    </Modal>
  );
}

function OrdersSection({ receipts, retail, warehouses, onNewReceipt, onEditReceipt, onDeleteReceipt, onAcceptRetail, onShipRetail }: {
  receipts: ImportReceipt[]; retail: RetailOrder[]; warehouses: Warehouse[];
  onNewReceipt: () => void; onEditReceipt: (r: ImportReceipt) => void; onDeleteReceipt: (id: string) => void;
  onAcceptRetail: (id: string) => void; onShipRetail: (id: string) => void;
}) {
  const [tab, setTab] = useState<"import" | "retail">("import");
  const [detailId, setDetailId] = useState<string | null>(null);
  const [detailLoai, setDetailLoai] = useState<"import" | "retail">("import");

  const openDetail = (id: string, loai: "import" | "retail") => { setDetailId(id); setDetailLoai(loai); };

  return (
    <div className="u-flex u-flex-col u-gap-4 u-fade-in">
      <div className="u-flex u-items-center u-justify-between">
        <div className="u-flex u-bg-light u-rounded-lg u-gap-1" style={{ padding: '4px' }}>
          {(["import", "retail"] as const).map(id => (
            <button key={id} onClick={() => setTab(id)}
              className={`btn ${tab === id ? 'btn-primary' : 'btn-secondary'}`}
              style={{ boxShadow: tab !== id ? 'none' : undefined, background: tab !== id ? 'transparent' : undefined }}>
              {id === "import" ? "📥 Phiếu nhập" : "📤 Phiếu xuất"}
            </button>
          ))}
        </div>
        {tab === "import" && <PrimaryBtn onClick={onNewReceipt}>+ Tạo phiếu nhập</PrimaryBtn>}
      </div>

      {tab === "import" && (
        <Panel>
          <SectionTitle>Phiếu nhập hàng từ Nông dân</SectionTitle>
          {receipts.length === 0 ? (
            <p className="empty-msg">Chưa có phiếu nhập nào</p>
          ) : (
            <StyledTable headers={["Mã đơn", "Nông dân", "Tổng SL", "Ghi chú", "Ngày đặt", "Trạng thái", "Thao tác"]}>
              {receipts.map(r => (
                <tr key={r.maPhieu}>
                  <td><code className="u-text-sm u-text-muted">#{r.maPhieu}</code></td>
                  <td className="u-font-bold">{r.tenNong || "—"}</td>
                  <td>{r.soLuong > 0 ? `${r.soLuong.toLocaleString()} kg` : "—"}</td>
                  <td className="u-text-muted">{r.sanPham || "—"}</td>
                  <td>{r.ngayNhap || "—"}</td>
                  <td><StatusBadge status={r.status} /></td>
                  <td>
                    <ActionBtn onClick={() => openDetail(r.maPhieu, "import")} variant="info">Xem</ActionBtn>
                    <ActionBtn onClick={() => onEditReceipt(r)} variant="primary">Sửa</ActionBtn>
                    <ActionBtn onClick={() => onDeleteReceipt(r.maPhieu)} variant="danger">Xóa</ActionBtn>
                  </td>
                </tr>
              ))}
            </StyledTable>
          )}
        </Panel>
      )}

      {tab === "retail" && (
        <Panel>
          <SectionTitle>Phiếu xuất hàng cho Siêu thị</SectionTitle>
          {retail.length === 0 ? (
            <p className="empty-msg">Chưa có phiếu xuất nào</p>
          ) : (
            <StyledTable headers={["Mã đơn", "Siêu thị", "Tổng SL", "Ghi chú", "Ngày đặt", "Trạng thái", "Thao tác"]}>
              {retail.map(r => (
                <tr key={r.maPhieu}>
                  <td><code className="u-text-sm u-text-muted">#{r.maPhieu}</code></td>
                  <td className="u-font-bold">{r.sieu_thi || "—"}</td>
                  <td>{r.soLuong > 0 ? `${r.soLuong.toLocaleString()} kg` : "—"}</td>
                  <td className="u-text-muted">{r.sanPham || "—"}</td>
                  <td>{r.ngayTao || "—"}</td>
                  <td><StatusBadge status={r.status} /></td>
                  <td>
                    <ActionBtn onClick={() => openDetail(r.maPhieu, "retail")} variant="info">Xem</ActionBtn>
                    {(r.status === "pending" || r.status === "chua_nhan") && <ActionBtn onClick={() => onAcceptRetail(r.maPhieu)} variant="success">Xác nhận</ActionBtn>}
                    {(r.status === "received" || r.status === "da_nhan") && <ActionBtn onClick={() => onShipRetail(r.maPhieu)} variant="warning">Xuất hàng</ActionBtn>}
                  </td>
                </tr>
              ))}
            </StyledTable>
          )}
        </Panel>
      )}

      {detailId && <DailyOrderDetailModal maPhieu={detailId} loai={detailLoai} onClose={() => setDetailId(null)} />}
    </div>
  );
}

function InventoryDetailModal({ batch, onClose, onEdit, onDelete }: { batch: InventoryBatch; onClose: () => void; onEdit: (b: InventoryBatch) => void; onDelete: (b: InventoryBatch) => void }) {
  return (
    <Modal title={`Chi tiết sản phẩm kho — Lô #${batch.maLo}`} onClose={onClose} wide>
      <div style={{ display: "flex", alignItems: "center", gap: 16, padding: "16px 18px", background: "linear-gradient(135deg, #f8fafc 0%, #eef2ff 100%)", borderRadius: 12, marginBottom: 20 }}>
        <div style={{ width: 52, height: 52, borderRadius: 12, background: "linear-gradient(135deg, var(--primary), #4f46e5)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 900, fontSize: 20 }}>K</div>
        <div style={{ flex: 1 }}>
          <div className="u-font-black u-text-lg u-text-dark">{batch.sanPham}</div>
          <div className="u-text-sm u-text-muted">Kho #{batch.maKho} — Lô #{batch.maLo}</div>
        </div>
        <StatusBadge status={batch.status} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 20 }}>
        <div style={{ padding: "14px 16px", background: "#f0f9ff", borderRadius: 10, textAlign: "center" }}>
          <div className="u-text-sm u-text-muted">Mã lô</div>
          <div className="u-font-black u-text-lg" style={{ color: "#2563eb" }}>#{batch.maLo}</div>
        </div>
        <div style={{ padding: "14px 16px", background: "#f0fdf4", borderRadius: 10, textAlign: "center" }}>
          <div className="u-text-sm u-text-muted">Số lượng tồn</div>
          <div className="u-font-black u-text-lg" style={{ color: "#16a34a" }}>{batch.soLuong.toLocaleString("vi-VN")} kg</div>
        </div>
        <div style={{ padding: "14px 16px", background: "#fefce8", borderRadius: 10, textAlign: "center" }}>
          <div className="u-text-sm u-text-muted">Cập nhật cuối</div>
          <div className="u-font-black u-text-lg" style={{ color: "#d97706" }}>{batch.ngayNhap || "—"}</div>
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 24px" }}>
        {[
          ["Sản phẩm", batch.sanPham],
          ["Mã kho", `#${batch.maKho}`],
          ["Mã lô", `#${batch.maLo}`],
          ["Trạng thái", batch.status === "in_stock" ? "Còn hàng" : batch.status === "low" ? "Sắp hết" : "Hết hàng"],
        ].map(([k, v]) => (
          <div key={k} style={{ padding: "12px 0", borderBottom: "1px solid #f1f5f9" }}>
            <div className="u-text-sm u-text-muted">{k}</div>
            <div className="u-font-bold u-text-dark" style={{ marginTop: 3 }}>{v}</div>
          </div>
        ))}
      </div>
      <div className="u-flex u-justify-end u-gap-3 u-mt-6 u-py-4 u-border-t">
        <button className="btn btn-secondary" onClick={onClose}>Đóng</button>
        <ActionBtn onClick={() => { onClose(); onEdit(batch); }} variant="primary">Sửa</ActionBtn>
        <ActionBtn onClick={() => { if (window.confirm(`Xóa "${batch.sanPham}" khỏi kho?`)) { onClose(); onDelete(batch); } }} variant="danger">Xóa</ActionBtn>
      </div>
    </Modal>
  );
}

function InventoryEditModal({ batch, onClose, onSaved }: { batch: InventoryBatch; onClose: () => void; onSaved: () => void }) {
  const [soLuong, setSoLuong] = useState(String(batch.soLuong));
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  async function handleSave() {
    if (!soLuong || Number(soLuong) < 0) return setErr("Số lượng không hợp lệ");
    setLoading(true); setErr("");
    try {
      const r = await fetch("/api/KhoHang/cap-nhat-ton-kho", {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ MaKho: Number(batch.maKho), MaLo: Number(batch.maLo), SoLuong: Number(soLuong) }),
      });
      if (!r.ok) throw new Error((await r.json()).message);
      onSaved(); onClose();
    } catch (e: unknown) { setErr(e instanceof Error ? e.message : "Lỗi cập nhật"); }
    finally { setLoading(false); }
  }

  return (
    <Modal title={`Sửa tồn kho — ${batch.sanPham}`} onClose={onClose}>
      {err && <div className="error-msg">{err}</div>}
      <div className="u-bg-light u-border u-rounded-md u-mb-4 u-text-sm u-text-muted" style={{ padding: "12px 16px" }}>
        <div className="u-font-black u-text-dark u-mb-1">{batch.sanPham}</div>
        Kho: #{batch.maKho} | Lô: #{batch.maLo} | Hiện tại: {batch.soLuong} kg
      </div>
      <FormField label="Số lượng mới (kg) *">
        <input className="input" type="number" min="0" step="0.01" value={soLuong} onChange={e => setSoLuong(e.target.value)} />
      </FormField>
      <div className="u-flex u-justify-end u-gap-3 u-mt-6 u-py-6 u-border-t">
        <button className="btn btn-secondary" onClick={onClose}>Hủy</button>
        <PrimaryBtn onClick={handleSave}>{loading ? "Đang lưu..." : "Lưu"}</PrimaryBtn>
      </div>
    </Modal>
  );
}

function InventorySection({ warehouses, inventory, onNewWarehouse, onEditWarehouse, onDeleteWarehouse, onEditInventory, onDeleteInventory }: {
  warehouses: Warehouse[]; inventory: InventoryBatch[];
  onNewWarehouse: () => void; onEditWarehouse: (w: Warehouse) => void; onDeleteWarehouse: (id: string) => void;
  onEditInventory: (b: InventoryBatch) => void; onDeleteInventory: (b: InventoryBatch) => void;
}) {
  const [detailBatch, setDetailBatch] = useState<InventoryBatch | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const filtered = filterStatus === "all" ? inventory : inventory.filter(b => b.status === filterStatus);
  const totalStock = inventory.reduce((s, b) => s + b.soLuong, 0);
  const lowCount = inventory.filter(b => b.status === "low").length;
  const outCount = inventory.filter(b => b.status === "out").length;

  return (
    <div className="u-flex u-flex-col u-gap-4 u-fade-in">
      <div className="stat-grid">
        <StatCard icon="P" label="Tổng lô trong kho" value={inventory.length} accent="var(--primary)" />
        <StatCard icon="T" label="Tổng tồn kho" value={`${totalStock.toLocaleString("vi-VN")} kg`} accent="var(--success)" />
        <StatCard icon="!" label="Sắp hết hàng" value={lowCount} accent="var(--warning)" />
        <StatCard icon="X" label="Hết hàng" value={outCount} accent="var(--danger)" />
      </div>

      <Panel>
        <div className="u-flex u-justify-between u-items-center u-mb-4">
          <SectionTitle>Danh sách kho nhập hàng</SectionTitle>
          <PrimaryBtn onClick={onNewWarehouse}>+ Thêm kho</PrimaryBtn>
        </div>
        <StyledTable headers={["Mã kho", "Tên kho", "Địa chỉ", "SĐT", "Thao tác"]}>
          {warehouses.map(w => (
            <tr key={w.maKho}>
              <td><code className="u-text-sm u-text-muted">{w.maKho}</code></td>
              <td className="u-font-bold">{w.tenKho}</td>
              <td>{w.diaChi}</td>
              <td>{w.soDienThoai}</td>
              <td>
                <ActionBtn onClick={() => onEditWarehouse(w)} variant="primary">Sửa</ActionBtn>
                <ActionBtn onClick={() => onDeleteWarehouse(w.maKho)} variant="danger">Xóa</ActionBtn>
              </td>
            </tr>
          ))}
        </StyledTable>
      </Panel>
      
      <Panel>
        <div className="u-flex u-justify-between u-items-center u-mb-4">
          <SectionTitle>Tồn kho hiện tại (theo lô)</SectionTitle>
          <select className="select" style={{ width: "auto", minWidth: 160, fontSize: 13 }} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
            <option value="all">Tất cả trạng thái</option>
            <option value="in_stock">Còn hàng</option>
            <option value="low">Sắp hết</option>
            <option value="out">Hết hàng</option>
          </select>
        </div>
        <p className="page-subtitle u-mb-4">Sản phẩm đang lưu kho — {filtered.length} lô</p>
        {filtered.length === 0 ? (
          <p className="empty-msg">Không có sản phẩm nào{filterStatus !== "all" ? " với trạng thái này" : ""}</p>
        ) : (
          <StyledTable headers={["Mã lô", "Sản phẩm", "Số lượng", "Ngày cập nhật", "Trạng thái", "Hành động"]}>
            {filtered.map(b => (
              <tr key={b.maLo}>
                <td><code className="u-text-sm u-text-muted">{b.maLo}</code></td>
                <td className="u-font-bold">{b.sanPham}</td>
                <td>
                  <span className="u-font-bold" style={{ color: b.status === "out" ? "#dc2626" : b.status === "low" ? "#d97706" : "#16a34a" }}>
                    {b.soLuong.toLocaleString("vi-VN")} kg
                  </span>
                </td>
                <td className="u-text-muted u-text-sm">{b.ngayNhap}</td>
                <td><StatusBadge status={b.status} /></td>
                <td>
                  <ActionBtn onClick={() => setDetailBatch(b)} variant="info">Xem</ActionBtn>
                  <ActionBtn onClick={() => onEditInventory(b)} variant="primary">Sửa</ActionBtn>
                  <ActionBtn onClick={() => onDeleteInventory(b)} variant="danger">Xóa</ActionBtn>
                </td>
              </tr>
            ))}
          </StyledTable>
        )}
      </Panel>
      {detailBatch && <InventoryDetailModal batch={detailBatch} onClose={() => setDetailBatch(null)} onEdit={onEditInventory} onDelete={onDeleteInventory} />}
    </div>
  );
}

function QualityDetailModal({ q, onClose }: { q: QualityCheck; onClose: () => void }) {
  return (
    <Modal title={`🔍 Chi tiết kiểm định #${q.maKiemDinh}`} onClose={onClose}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16, padding: "12px 14px", background: "#f8fafc", borderRadius: 10 }}>
        <div><span className="u-text-sm u-text-muted">Mã kiểm định</span><div className="u-font-bold u-text-dark">#{q.maKiemDinh}</div></div>
        <div><span className="u-text-sm u-text-muted">Mã lô</span><div className="u-font-bold u-text-dark">{q.maLo}</div></div>
        <div><span className="u-text-sm u-text-muted">Sản phẩm</span><div className="u-font-bold u-text-dark">{q.tenSanPham || "—"}</div></div>
        <div><span className="u-text-sm u-text-muted">Ngày kiểm</span><div className="u-font-bold u-text-dark">{q.ngayKiem || "—"}</div></div>
        <div><span className="u-text-sm u-text-muted">Người kiểm</span><div className="u-font-bold u-text-dark">{q.nguoiKiem}</div></div>
        <div><span className="u-text-sm u-text-muted">Kết quả</span><div style={{ marginTop: 4 }}><StatusBadge status={q.ketQua} /></div></div>
        <div><span className="u-text-sm u-text-muted">Trạng thái</span><div style={{ marginTop: 4 }}><StatusBadge status={q.trangThai || "cho_duyet"} /></div></div>
        <div><span className="u-text-sm u-text-muted">Ghi chú</span><div className="u-font-bold u-text-dark">{q.ghiChu || "—"}</div></div>
      </div>
      {q.bienBan && (
        <div style={{ padding: "10px 14px", background: "#f0f4ff", borderRadius: 8, marginBottom: 12 }}>
          <div className="u-text-sm u-text-muted" style={{ marginBottom: 4 }}>Biên bản</div>
          <div style={{ fontSize: 13, color: "#333" }}>{q.bienBan}</div>
        </div>
      )}
      <div className="u-flex u-justify-end u-mt-4">
        <button className="btn btn-secondary" onClick={onClose}>Đóng</button>
      </div>
    </Modal>
  );
}

function QualitySection({ quality, onNew, onEdit, onDelete }: {
  quality: QualityCheck[]; onNew: () => void; onEdit: (q: QualityCheck) => void; onDelete: (id: string) => void;
}) {
  const [detail, setDetail] = useState<QualityCheck | null>(null);
  return (
    <Panel className="u-fade-in">
      <div className="u-flex u-justify-between u-items-center u-mb-4">
        <SectionTitle>🔬 Phiếu kiểm định chất lượng</SectionTitle>
        <PrimaryBtn onClick={onNew}>+ Thêm kiểm định</PrimaryBtn>
      </div>
      {quality.length === 0 ? (
        <p className="empty-msg">Chưa có phiếu kiểm định nào</p>
      ) : (
        <StyledTable headers={["Mã KĐ", "Mã lô", "Sản phẩm", "Người kiểm", "Kết quả", "Trạng thái", "Ghi chú", "Thao tác"]}>
          {quality.map(q => (
            <tr key={q.maKiemDinh}>
              <td><code className="u-text-sm u-text-muted">#{q.maKiemDinh}</code></td>
              <td className="u-font-bold">{q.maLo}</td>
              <td>{q.tenSanPham || "—"}</td>
              <td>{q.nguoiKiem}</td>
              <td><StatusBadge status={q.ketQua} /></td>
              <td><StatusBadge status={q.trangThai || "cho_duyet"} /></td>
              <td className="u-text-muted">{q.ghiChu || "—"}</td>
              <td>
                <ActionBtn onClick={() => setDetail(q)} variant="info">Xem</ActionBtn>
                <ActionBtn onClick={() => onEdit(q)} variant="primary">Sửa</ActionBtn>
                <ActionBtn onClick={() => onDelete(q.maKiemDinh)} variant="danger">Xóa</ActionBtn>
              </td>
            </tr>
          ))}
        </StyledTable>
      )}
      {detail && <QualityDetailModal q={detail} onClose={() => setDetail(null)} />}
    </Panel>
  );
}

function ReportsSection({ receipts, retail, inventory, quality }: {
  receipts: ImportReceipt[]; retail: RetailOrder[]; inventory: InventoryBatch[]; quality: QualityCheck[];
}) {
  const totalStock = inventory.reduce((s, b) => s + b.soLuong, 0);
  const shipped = retail.filter(r => r.status === "shipped" || r.status === "hoan_thanh").length;
  const chuaNhan = retail.filter(r => r.status === "chua_nhan" || r.status === "pending").length;
  const daHuy = retail.filter(r => r.status === "da_huy").length;
  const passed = quality.filter(q => q.ketQua === "dat" || q.ketQua === "A").length;
  const failed = quality.filter(q => q.ketQua === "khong_dat").length;
  const passRate = quality.length ? Math.round((passed / quality.length) * 100) : 0;

  // Thống kê theo nhà cung cấp (nông dân)
  const supplierStats = receipts.reduce((acc, r) => {
    const key = r.tenNong || "Không rõ";
    if (!acc[key]) acc[key] = { tongPhieu: 0, tongSL: 0 };
    acc[key].tongPhieu++;
    acc[key].tongSL += r.soLuong || 0;
    return acc;
  }, {} as Record<string, { tongPhieu: number; tongSL: number }>);

  return (
    <div className="u-fade-in">
      <div className="stat-grid">
        {[
          { icon: "📥", label: "Tổng phiếu nhập",     value: receipts.length,                            color: "var(--success)" },
          { icon: "📦", label: "Tổng tồn kho",         value: `${totalStock.toLocaleString("vi-VN")} kg`, color: "var(--primary)" },
          { icon: "🚚", label: "Đã xuất hàng",          value: `${shipped} đơn`,                           color: "#7c3aed" },
          { icon: "⏳", label: "Chờ xác nhận",          value: `${chuaNhan} đơn`,                          color: "#b45309" },
          { icon: "✅", label: "Tỷ lệ đạt CL",          value: `${passRate}%`,                             color: "#059669" },
          { icon: "❌", label: "Đã hủy",                 value: `${daHuy} đơn`,                             color: "#dc2626" },
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

      <Panel className="u-mb-5">
        <div className="panel-title">Thống kê theo nhà cung cấp</div>
        <StyledTable headers={["Nông dân", "Số phiếu nhập", "Tổng SL (kg)", "Tỷ trọng"]}>
          {Object.entries(supplierStats).sort((a, b) => b[1].tongSL - a[1].tongSL).map(([name, stats]) => {
            const totalSL = Object.values(supplierStats).reduce((s, v) => s + v.tongSL, 0);
            const pct = totalSL ? Math.round((stats.tongSL / totalSL) * 100) : 0;
            return (
              <tr key={name}>
                <Td><b>{name}</b></Td>
                <Td>{stats.tongPhieu}</Td>
                <Td className="u-text-primary u-font-bold">{stats.tongSL.toLocaleString("vi-VN")}</Td>
                <Td>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ flex: 1, height: 6, background: "#f0f4ff", borderRadius: 3, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${pct}%`, background: "var(--primary)", borderRadius: 3 }} />
                    </div>
                    <span className="u-text-sm u-text-muted" style={{ whiteSpace: "nowrap" }}>{pct}%</span>
                  </div>
                </Td>
              </tr>
            );
          })}
          {Object.keys(supplierStats).length === 0 && (
            <tr><td colSpan={4} className="empty-msg">Chưa có dữ liệu</td></tr>
          )}
        </StyledTable>
      </Panel>

      <Panel className="u-mb-5">
        <div className="panel-title">Kiểm định chất lượng</div>
        <div className="u-flex u-gap-5 u-mb-4" style={{ flexWrap: "wrap" }}>
          {[
            { label: "Tổng kiểm định", value: quality.length, color: "#2563eb" },
            { label: "Đạt", value: passed, color: "#059669" },
            { label: "Không đạt", value: failed, color: "#dc2626" },
          ].map(s => (
            <div key={s.label} className="u-flex u-items-center u-gap-2">
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: s.color }} />
              <span className="u-text-sm u-text-muted">{s.label}:</span>
              <span className="u-font-bold" style={{ color: s.color }}>{s.value}</span>
            </div>
          ))}
        </div>
        <StyledTable headers={["Mã KĐ", "Sản phẩm", "Ngày kiểm", "Người kiểm", "Kết quả", "Ghi chú"]}>
          {quality.slice(0, 10).map(q => (
            <tr key={q.maKiemDinh}>
              <Td><code className="u-text-sm u-text-primary u-font-bold">#{q.maKiemDinh}</code></Td>
              <Td><b>{q.tenSanPham || `Lô #${q.maLo}`}</b></Td>
              <Td className="u-text-muted u-text-sm">{q.ngayKiem ? new Date(q.ngayKiem).toLocaleDateString("vi-VN") : "—"}</Td>
              <Td>{q.nguoiKiem || "—"}</Td>
              <Td><StatusBadge status={q.ketQua} /></Td>
              <Td className="u-text-muted u-text-sm">{q.ghiChu || "—"}</Td>
            </tr>
          ))}
        </StyledTable>
        {quality.length === 0 && <p className="empty-msg">Chưa có dữ liệu kiểm định</p>}
      </Panel>

      <Panel>
        <div className="panel-title">Lịch sử đơn hàng bán lẻ</div>
        <StyledTable headers={["Mã đơn", "Sản phẩm", "Số lượng", "Siêu thị", "Ngày tạo", "Trạng thái"]}>
          {retail.map(r => (
            <tr key={r.maPhieu}>
              <Td><code className="u-text-sm u-text-primary u-font-bold">#{r.maPhieu}</code></Td>
              <Td><b>{r.sanPham}</b></Td>
              <Td>{r.soLuong.toLocaleString("vi-VN")} kg</Td>
              <Td>{r.sieu_thi || "—"}</Td>
              <Td className="u-text-muted u-text-sm">{r.ngayTao ? new Date(r.ngayTao).toLocaleDateString("vi-VN") : "—"}</Td>
              <Td><StatusBadge status={r.status} /></Td>
            </tr>
          ))}
        </StyledTable>
        {retail.length === 0 && <p className="empty-msg">Chưa có dữ liệu</p>}
      </Panel>
    </div>
  );
}

// ─── Form Modals ──────────────────────────────────────────────────────────────
interface ChiTietRow { maLo: string; tenLo: string; soLuong: string; donGia: string; isExisting?: boolean; }

function ReceiptModal({ receipt, onClose, onSaved }: {
  receipt: ImportReceipt | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const authUser = getCurrentUser();
  const maDaiLy = authUser?.maDoiTuong;

  const [nongDans, setNongDans] = useState<{ MaNongDan: number; HoTen: string }[]>([]);
  const [maNongDan, setMaNongDan] = useState("");
  const [lots, setLots] = useState<{ MaLo: number; TenSanPham: string; SoLuongHienTai: number; GiaTien?: number }[]>([]);
  const [rows, setRows] = useState<ChiTietRow[]>([{ maLo: "", tenLo: "", soLuong: "", donGia: "" }]);
  const [ghiChu, setGhiChu] = useState(receipt?.ghiChu || receipt?.sanPham || "");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (receipt) return;
    fetch("/api/nong-dan/get-all")
      .then(r => r.json())
      .then((data: any[]) => {
        setNongDans(data);
        if (data.length) setMaNongDan(String(data[0].MaNongDan));
      })
      .catch(() => setErr("Không tải được danh sách nông dân"));
  }, [receipt]);

  useEffect(() => {
    if (receipt || !maNongDan) return;
    fetch(`/api/lo-nong-san/get-by-nong-dan/${maNongDan}`)
      .then(r => r.json())
      .then((data: any[]) => {
        setLots(data);
        const first = data[0];
        setRows([{ maLo: first ? String(first.MaLo) : "", tenLo: first?.TenSanPham || "", soLuong: "", donGia: first?.GiaTien ? String(first.GiaTien) : "" }]);
      })
      .catch(console.error);
  }, [maNongDan, receipt]);

  useEffect(() => {
    if (!receipt) return;
    fetch(`/api/don-hang-dai-ly/${receipt.maPhieu}/chi-tiet`)
      .then(r => r.json())
      .then((data: any[]) => {
        setRows(data.map(d => ({
          maLo: String(d.MaLo),
          tenLo: d.TenSanPham || "",
          soLuong: String(d.SoLuong),
          donGia: String(d.DonGia),
          isExisting: true,
        })));
        if (data.length > 0) {
          fetch("/api/lo-nong-san/get-all")
            .then(r2 => r2.json())
            .then((allLots: any[]) => setLots(allLots))
            .catch(console.error);
        }
      })
      .catch(() => setErr("Không tải được chi tiết đơn"));
  }, [receipt]);

  function setRow(i: number, field: keyof ChiTietRow, val: string) {
    setRows(rs => rs.map((r, idx) => {
      if (idx !== i) return r;
      if (field === "maLo") {
        const lot = lots.find(l => String(l.MaLo) === val);
        return { ...r, maLo: val, tenLo: lot?.TenSanPham || "", donGia: lot?.GiaTien ? String(lot.GiaTien) : r.donGia };
      }
      return { ...r, [field]: val };
    }));
  }

  async function handleSave() {
    setLoading(true); setErr("");
    try {
      if (receipt) {
        const resGhiChu = await fetch(`/api/don-hang-dai-ly/update/${receipt.maPhieu}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ GhiChu: ghiChu }),
        });
        if (!resGhiChu.ok) throw new Error((await resGhiChu.json()).message);

        for (const row of rows.filter(r => r.isExisting && r.maLo && r.soLuong && r.donGia)) {
          const r2 = await fetch(`/api/don-hang-dai-ly/${receipt.maPhieu}/chi-tiet/${row.maLo}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ SoLuong: Number(row.soLuong), DonGia: Number(row.donGia) }),
          });
          if (!r2.ok) throw new Error((await r2.json()).message);
        }

        for (const row of rows.filter(r => !r.isExisting && r.maLo && r.soLuong && r.donGia)) {
          const r2 = await fetch(`/api/don-hang-dai-ly/${receipt.maPhieu}/chi-tiet`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ MaLo: Number(row.maLo), SoLuong: Number(row.soLuong), DonGia: Number(row.donGia) }),
          });
          if (!r2.ok) throw new Error((await r2.json()).message);
        }
      } else {
        const validRows = rows.filter(r => r.maLo && r.soLuong && r.donGia);
        if (!maNongDan) return setErr("Vui lòng chọn nông dân");
        if (!validRows.length) return setErr("Thêm ít nhất 1 lô hàng");

        const res = await fetch("/api/don-hang-dai-ly/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ MaDaiLy: maDaiLy, MaNongDan: Number(maNongDan), GhiChu: ghiChu || null }),
        });
        if (!res.ok) throw new Error((await res.json()).message);
        const { MaDonHang } = await res.json();

        for (const row of validRows) {
          const r2 = await fetch(`/api/don-hang-dai-ly/${MaDonHang}/chi-tiet`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ MaLo: Number(row.maLo), SoLuong: Number(row.soLuong), DonGia: Number(row.donGia) }),
          });
          if (!r2.ok) throw new Error((await r2.json()).message);
        }
      }
      onSaved(); onClose();
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Lỗi lưu đơn hàng");
    } finally { setLoading(false); }
  }

  async function handleDeleteRow(row: ChiTietRow, i: number) {
    if (!receipt || !row.isExisting) { setRows(rs => rs.filter((_, idx) => idx !== i)); return; }
    if (!window.confirm("Xóa lô này khỏi đơn?")) return;
    try {
      const res = await fetch(`/api/don-hang-dai-ly/${receipt.maPhieu}/chi-tiet/${row.maLo}`, { method: "DELETE" });
      if (!res.ok) throw new Error((await res.json()).message);
      setRows(rs => rs.filter((_, idx) => idx !== i));
    } catch (e: unknown) { setErr(e instanceof Error ? e.message : "Lỗi xóa lô"); }
  }

  const allLots = lots;

  return (
    <Modal title={receipt ? `Sửa đơn #${receipt.maPhieu}` : "Tạo đơn nhập hàng"} onClose={onClose} wide={true}>
      {err && <div className="error-msg">{err}</div>}

      {receipt ? (
        <div className="u-bg-light u-p-3 u-rounded-md u-mb-4 u-text-sm u-text-dark u-border">
          Nông dân: <b className="u-text-primary">{receipt.tenNong || "—"}</b>
        </div>
      ) : (
        <FormField label="Nông dân *">
          <select className="select" value={maNongDan} onChange={e => setMaNongDan(e.target.value)}>
            {nongDans.map(n => <option key={n.MaNongDan} value={n.MaNongDan}>{n.HoTen}</option>)}
          </select>
        </FormField>
      )}

      <div className="u-mb-4">
        <div className="u-flex u-justify-between u-items-center u-mb-2">
          <label className="form-label u-mb-0">Chi tiết đơn hàng *</label>
          <button onClick={() => setRows(rs => [...rs, { maLo: allLots[0] ? String(allLots[0].MaLo) : "", tenLo: allLots[0]?.TenSanPham || "", soLuong: "", donGia: allLots[0]?.GiaTien ? String(allLots[0].GiaTien) : "", isExisting: false }])}
            className="btn btn-secondary u-text-sm" style={{ padding: '4px 10px' }}>
            + Thêm lô
          </button>
        </div>
        
        <div className="u-grid u-gap-2 u-mb-2" style={{ gridTemplateColumns: '2fr 1fr 1fr 1fr 32px' }}>
          {["Lô nông sản", "Số lượng (kg)", "Đơn giá (đ)", "Thành tiền", ""].map(h => (
            <div key={h} className="u-text-sm u-font-bold u-text-muted">{h}</div>
          ))}
        </div>
        
        {rows.map((row, i) => {
          const thanhTien = (Number(row.soLuong) || 0) * (Number(row.donGia) || 0);
          return (
            <div key={i} className="u-grid u-gap-2 u-mb-2 u-items-center" style={{ gridTemplateColumns: '2fr 1fr 1fr 1fr 32px' }}>
              {row.isExisting ? (
                <div className="input u-bg-light u-text-muted">
                  {row.tenLo || `Lô #${row.maLo}`}
                </div>
              ) : (
                <select className="select" value={row.maLo} onChange={e => setRow(i, "maLo", e.target.value)}>
                  {allLots.length === 0
                    ? <option value="">— Không có lô —</option>
                    : allLots.map(l => <option key={l.MaLo} value={l.MaLo}>{l.TenSanPham} (còn {l.SoLuongHienTai} kg)</option>)
                  }
                </select>
              )}
              <input className="input" type="number" placeholder="Số lượng" value={row.soLuong} onChange={e => setRow(i, "soLuong", e.target.value)} />
              <input className="input" type="number" placeholder="Đơn giá" value={row.donGia} onChange={e => setRow(i, "donGia", e.target.value)} />
              <div style={{ padding: "9px 12px", background: "#f0f4ff", borderRadius: 8, fontSize: 13, fontWeight: 700, color: "#4f46e5", textAlign: "right", whiteSpace: "nowrap" }}>
                {thanhTien > 0 ? thanhTien.toLocaleString("vi-VN") + " đ" : "—"}
              </div>
              <button onClick={() => handleDeleteRow(row, i)} className="btn u-text-danger" style={{ background: 'none', padding: '8px' }}>✕</button>
            </div>
          );
        })}
        {rows.length === 0 && <p className="empty-msg" style={{ padding: '12px 0' }}>Chưa có lô nào</p>}
      </div>

      {(() => {
        const tong = rows.reduce((s, r) => s + (Number(r.soLuong)||0) * (Number(r.donGia)||0), 0);
        return tong > 0 ? (
          <div style={{ textAlign: "right", marginBottom: 12, fontSize: 13, fontWeight: 700, color: "#4f46e5" }}>
            Tổng giá trị: {tong.toLocaleString("vi-VN")} đ
          </div>
        ) : null;
      })()}

      <FormField label="Ghi chú">
        <input className="input" value={ghiChu} onChange={e => setGhiChu(e.target.value)} placeholder="Ghi chú tuỳ chọn…" />
      </FormField>
      
      <div className="u-flex u-justify-end u-gap-3 u-mt-6 u-py-6 u-border-t">
        <button className="btn btn-secondary" onClick={onClose}>Hủy</button>
        <PrimaryBtn onClick={handleSave}>{loading ? "Đang lưu…" : "Lưu đơn"}</PrimaryBtn>
      </div>
    </Modal>
  );
}

function WarehouseModal({ warehouse, onClose, onSaved }: {
  warehouse: Warehouse | null; onClose: () => void; onSaved: () => void;
}) {
  const authUser = getCurrentUser();
  const maDaiLy = authUser?.maDoiTuong;

  const [tenKho, setTenKho] = useState(warehouse?.tenKho || "");
  const [diaChi, setDiaChi] = useState(warehouse?.diaChi || "");
  const [trangThai, setTrangThai] = useState<"hoat_dong" | "ngung_hoat_dong">("hoat_dong");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  async function handleSave() {
    if (!tenKho) return setErr("Vui lòng nhập tên kho");
    setLoading(true); setErr("");
    try {
      if (warehouse) {
        const res = await fetch(`/api/kho/update/${warehouse.maKho}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ TenKho: tenKho, DiaChi: diaChi, TrangThai: trangThai }),
        });
        if (!res.ok) throw new Error((await res.json()).message);
      } else {
        const res = await fetch("/api/kho/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ LoaiKho: "daily", MaDaiLy: maDaiLy, TenKho: tenKho, DiaChi: diaChi }),
        });
        if (!res.ok) throw new Error((await res.json()).message);
      }
      onSaved(); onClose();
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Lỗi lưu kho");
    } finally { setLoading(false); }
  }

  return (
    <Modal title={warehouse ? "Chỉnh sửa kho" : "Thêm kho mới"} onClose={onClose}>
      {err && <div className="error-msg">⚠ {err}</div>}
      <FormField label="Tên kho *">
        <input className="input" value={tenKho} onChange={e => setTenKho(e.target.value)} placeholder="Kho Long Biên" />
      </FormField>
      <FormField label="Địa chỉ">
        <input className="input" value={diaChi} onChange={e => setDiaChi(e.target.value)} placeholder="Số nhà, đường, quận…" />
      </FormField>
      {warehouse && (
        <FormField label="Trạng thái">
          <select className="select" value={trangThai} onChange={e => setTrangThai(e.target.value as "hoat_dong" | "ngung_hoat_dong")}>
            <option value="hoat_dong">Hoạt động</option>
            <option value="ngung_hoat_dong">Ngừng hoạt động</option>
          </select>
        </FormField>
      )}
      <div className="u-flex u-justify-end u-gap-3 u-mt-6 u-py-6 u-border-t">
        <button className="btn btn-secondary" onClick={onClose}>Hủy</button>
        <PrimaryBtn onClick={handleSave}>{loading ? "Đang lưu…" : "Lưu kho"}</PrimaryBtn>
      </div>
    </Modal>
  );
}

function QualityModal({ check, inventory, onClose, onSaved }: {
  check: QualityCheck | null;
  inventory: InventoryBatch[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const authUser = getCurrentUser();
  const maDaiLy = authUser?.maDoiTuong;

  const [maLo, setMaLo] = useState(check?.maLo || (inventory[0]?.maLo ?? ""));
  const [nguoi, setNguoi] = useState(check?.nguoiKiem || authUser?.tenHienThi || "");
  const [ketQua, setKetQua] = useState<QualityCheck["ketQua"]>(check?.ketQua || "dat");
  const [trangThai, setTrangThai] = useState<"hoan_thanh" | "cho_duyet">(check?.trangThai || "cho_duyet");
  const [bienBan, setBienBan] = useState(check?.bienBan || "");
  const [ghiChu, setGhiChu] = useState(check?.ghiChu || "");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  async function handleSave() {
    if (!maLo || !nguoi) return setErr("Vui lòng điền đủ thông tin");
    setLoading(true); setErr("");
    try {
      if (check) {
        const res = await fetch(`/api/kiem-dinh/update/${check.maKiemDinh}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ KetQua: ketQua, BienBan: bienBan || null, GhiChu: ghiChu || null, TrangThai: trangThai }),
        });
        if (!res.ok) throw new Error((await res.json()).message);
      } else {
        const res = await fetch("/api/kiem-dinh/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ MaLo: Number(maLo), NguoiKiemDinh: nguoi, MaDaiLy: maDaiLy, KetQua: ketQua, BienBan: bienBan || null, GhiChu: ghiChu || null }),
        });
        if (!res.ok) throw new Error((await res.json()).message);
      }
      onSaved(); onClose();
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Lỗi lưu kiểm định");
    } finally { setLoading(false); }
  }

  return (
    <Modal title={check ? `Sửa kiểm định #${check.maKiemDinh}` : "Thêm phiếu kiểm định"} onClose={onClose} wide={true}>
      {err && <div className="error-msg">⚠ {err}</div>}
      <div className="u-grid u-grid-2-col u-gap-4 u-mb-4">
        <FormField label="Lô nông sản *">
          {check ? (
            <div className="input u-bg-light u-text-muted">{check.tenSanPham || `Lô #${check.maLo}`}</div>
          ) : (
            <select className="select" value={maLo} onChange={e => setMaLo(e.target.value)}>
              {inventory.length === 0
                ? <option value="">— Không có lô trong kho —</option>
                : inventory.map(b => <option key={b.maLo} value={b.maLo}>{b.sanPham} — Lô #{b.maLo} ({b.soLuong} kg)</option>)
              }
            </select>
          )}
        </FormField>
        <FormField label="Người kiểm *">
          <input className="input" value={nguoi} onChange={e => setNguoi(e.target.value)} placeholder="Tên người kiểm định" />
        </FormField>
        <FormField label="Kết quả *">
          <select className="select" value={ketQua} onChange={e => setKetQua(e.target.value as QualityCheck["ketQua"])}>
            <option value="dat">✓ Đạt</option>
            <option value="khong_dat">✗ Không đạt</option>
            <option value="A">Loại A</option>
            <option value="B">Loại B</option>
            <option value="C">Loại C</option>
          </select>
        </FormField>
        <FormField label="Trạng thái">
          <select className="select" value={trangThai} onChange={e => setTrangThai(e.target.value as "hoan_thanh" | "cho_duyet")}>
            <option value="cho_duyet">Chờ duyệt</option>
            <option value="hoan_thanh">Hoàn thành</option>
          </select>
        </FormField>
      </div>
      <FormField label="Biên bản">
        <input className="input" value={bienBan} onChange={e => setBienBan(e.target.value)} placeholder="Nội dung biên bản…" />
      </FormField>
      <FormField label="Ghi chú">
        <input className="input" value={ghiChu} onChange={e => setGhiChu(e.target.value)} placeholder="Tuỳ chọn…" />
      </FormField>
      <div className="u-flex u-justify-end u-gap-3 u-mt-6 u-py-6 u-border-t">
        <button className="btn btn-secondary" onClick={onClose}>Hủy</button>
        <PrimaryBtn onClick={handleSave}>{loading ? "Đang lưu…" : "Lưu"}</PrimaryBtn>
      </div>
    </Modal>
  );
}

function UserProfileModal({ user, onClose, onEdit }: { user: AgencyUser; onClose: () => void; onEdit: () => void }) {
  const fields: [string, string][] = [
    ["Họ tên", user.fullName],
    ["Tên đăng nhập", user.username],
    ["Vai trò", user.role],
    ["Email", user.email],
    ["Số điện thoại", user.phone],
    ["Địa chỉ", user.address],
  ];
  return (
    <Modal title="Thông tin cá nhân" onClose={onClose}>
      <div className="u-flex u-justify-center u-mb-4">
        <div className="avatar" style={{ width: '64px', height: '64px', fontSize: '32px' }}>🏢</div>
      </div>
      <div className="u-grid u-grid-2-col u-gap-4 u-mb-6">
        {fields.map(([k, v]) => (
          <div key={k} className="u-border-b u-pb-2">
            <div className="u-text-sm u-font-bold u-text-muted u-mb-1">{k}</div>
            <div className="u-text-md u-font-bold u-text-dark">{v}</div>
          </div>
        ))}
      </div>
      <button className="btn btn-primary" style={{ width: '100%' }} onClick={onEdit}>✏️ Sửa thông tin</button>
    </Modal>
  );
}

function EditProfileModal({ user, onClose, onSaved }: { user: AgencyUser; onClose: () => void; onSaved: (u: Partial<AgencyUser>) => void }) {
  const authUser = getCurrentUser();
  const [hoTen, setHoTen] = useState(user.fullName);
  const [sdt, setSdt] = useState(user.phone);
  const [email, setEmail] = useState(user.email);
  const [diaChi, setDiaChi] = useState(user.address);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  async function handleSave() {
    if (!hoTen) return setErr("Họ tên không được để trống");
    if (!authUser) return setErr("Phiên đăng nhập hết hạn");
    setLoading(true); setErr("");
    try {
      await apiUpdateProfile({ maTaiKhoan: authUser.maTaiKhoan, hoTen, soDienThoai: sdt, email, diaChi });
      onSaved({ fullName: hoTen, phone: sdt, email, address: diaChi });
      onClose();
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Lỗi cập nhật");
    } finally { setLoading(false); }
  }

  return (
    <Modal title="Sửa thông tin cá nhân" onClose={onClose}>
      {err && <div className="error-msg">⚠ {err}</div>}
      <FormField label="Họ tên *"><input className="input" value={hoTen} onChange={e => setHoTen(e.target.value)} /></FormField>
      <FormField label="Số điện thoại"><input className="input" value={sdt} onChange={e => setSdt(e.target.value)} /></FormField>
      <FormField label="Email"><input className="input" type="email" value={email} onChange={e => setEmail(e.target.value)} /></FormField>
      <FormField label="Địa chỉ"><input className="input" value={diaChi} onChange={e => setDiaChi(e.target.value)} /></FormField>
      <div className="u-flex u-justify-end u-gap-3 u-mt-6 u-py-6 u-border-t">
        <button className="btn btn-secondary" onClick={onClose}>Hủy</button>
        <PrimaryBtn onClick={handleSave}>{loading ? "Đang lưu…" : "Lưu"}</PrimaryBtn>
      </div>
    </Modal>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────
type Section = "dashboard" | "orders" | "inventory" | "quality" | "reports";
const NAV: { id: Section; label: string; icon: string }[] = [
  { id: "dashboard", label: "Bảng điều khiển",   icon: "🏠" },
  { id: "orders",    label: "Quản lý đơn hàng",  icon: "📋" },
  { id: "inventory", label: "Quản lý kho",        icon: "🏪" },
  { id: "quality",   label: "Kiểm định chất lượng",       icon: "🔬" },
  { id: "reports",   label: "Báo cáo thống kê",   icon: "📊" },
];
const PAGE_TITLES: Record<Section, string> = {
  dashboard: "Bảng điều khiển", orders: "Quản lý đơn hàng",
  inventory: "Quản lý kho", quality: "Kiểm định chất lượng", reports: "Báo cáo thống kê",
};
type ModalType = "receipt" | "receipt-edit" | "warehouse" | "warehouse-edit" | "quality" | "quality-edit" | "inventory-edit" | "profile" | "edit-profile" | null;

export default function DailyApp() {
  const [section, setSection] = useState<Section>("dashboard");
  const [receipts, setReceipts] = useState<ImportReceipt[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [inventory, setInventory] = useState<InventoryBatch[]>([]);
  const [quality, setQuality] = useState<QualityCheck[]>([]);
  const [retail, setRetail] = useState<RetailOrder[]>([]);
  const [modal, setModal] = useState<ModalType>(null);
  const [editTarget, setEditTarget] = useState<ImportReceipt | Warehouse | QualityCheck | InventoryBatch | null>(null);

  const authUser = getCurrentUser();
  const maDaiLy = authUser?.maDoiTuong;

  useEffect(() => {
    if (!authUser || authUser.role !== "daily") {
      window.location.href = "/login";
      return;
    }
  }, [authUser]);

  useEffect(() => {
    if (!maDaiLy) return;

    fetch(`/api/kho/dai-ly/${maDaiLy}`)
      .then(r => r.json())
      .then((data: any[]) => {
        const seen = new Set<string>();
        const khos = data.reduce((acc: Warehouse[], w: any) => {
          const key = String(w.MaKho);
          if (!seen.has(key)) {
            seen.add(key);
            acc.push({ maKho: key, tenKho: w.TenKho, diaChi: w.DiaChi || "", soDienThoai: "" });
          }
          return acc;
        }, []);
        setWarehouses(khos);
      })
      .catch(console.error);

    fetch(`/api/xuat-nhap-kho/ton-kho/${maDaiLy}`)
      .then(r => r.json())
      .then((data: any[]) => {
        setInventory(data.map(b => ({
          maLo: String(b.MaLo),
          maKho: String(b.MaKho || ""),
          sanPham: b.TenSanPham || "",
          soLuong: Number(b.SoLuong) || 0,
          ngayNhap: b.CapNhatCuoi ? new Date(b.CapNhatCuoi).toLocaleDateString("vi-VN") : "",
          status: Number(b.SoLuong) <= 0 ? "out" : Number(b.SoLuong) < 10 ? "low" : "in_stock",
        })));
      })
      .catch(console.error);

    fetch(`/api/don-hang-dai-ly/get-by-dai-ly/${maDaiLy}`)
      .then(r => r.json())
      .then((data: any[]) => {
        setReceipts(data.map(d => ({
          maPhieu: String(d.MaDonHang),
          maLo: "",
          sanPham: d.GhiChu || `Đơn #${d.MaDonHang}`,
          soLuong: Number(d.TongSoLuong) || 0,
          tenNong: d.TenNongDan || "",
          khoNhap: "",
          khoNhapName: "",
          ngayNhap: d.NgayDat ? new Date(d.NgayDat).toLocaleDateString("vi-VN") : "",
          status: (d.TrangThai as ImportReceipt["status"]) || "created",
        })));
      })
      .catch(console.error);

    fetch(`/api/don-hang-sieu-thi/dai-ly/${maDaiLy}`)
      .then(r => r.json())
      .then((data: any[]) => {
        setRetail(data.map(d => ({
          maPhieu: String(d.MaDonHang),
          maLo: "",
          sanPham: d.GhiChu || `Đơn #${d.MaDonHang}`,
          soLuong: Number(d.TongSoLuong) || 0,
          sieu_thi: d.TenSieuThi || "",
          ngayTao: d.NgayDat ? new Date(d.NgayDat).toLocaleDateString("vi-VN") : "",
          status: (d.TrangThai as RetailOrder["status"]) || "pending",
        })));
      })
      .catch(console.error);

    fetch(`/api/kiem-dinh/dai-ly/${maDaiLy}`)
      .then(r => r.json())
      .then((data: any[]) => {
        if (!Array.isArray(data)) return;
        setQuality(data.map(d => ({
          maKiemDinh: String(d.MaKiemDinh),
          maLo: String(d.MaLo),
          tenSanPham: d.TenSanPham || "",
          ngayKiem: d.NgayKiemDinh ? new Date(d.NgayKiemDinh).toLocaleDateString("vi-VN") : "",
          nguoiKiem: d.NguoiKiemDinh || "",
          ketQua: (d.KetQua as QualityCheck["ketQua"]) || "dat",
          trangThai: (d.TrangThai as QualityCheck["trangThai"]) || "hoan_thanh",
          bienBan: d.BienBan || "",
          ghiChu: d.GhiChu || "",
        })));
      })
      .catch(console.error);
  }, [maDaiLy]);

  const [userInfo, setUserInfo] = useState<Partial<AgencyUser>>({
    fullName: authUser?.tenHienThi || "",
    username: authUser?.username || "",
    email: authUser?.email || "",
    phone: authUser?.soDienThoai || "",
    address: authUser?.diaChi || "",
  });
  const user: AgencyUser = { ...EMPTY_USER, ...userInfo };

  function reloadReceipts() {
    if (!maDaiLy) return;
    fetch(`/api/don-hang-dai-ly/get-by-dai-ly/${maDaiLy}`)
      .then(r => r.json())
      .then((data: any[]) => {
        setReceipts(data.map(d => ({
          maPhieu: String(d.MaDonHang),
          maLo: "",
          sanPham: d.GhiChu || "",
          soLuong: Number(d.TongSoLuong) || 0,
          tenNong: d.TenNongDan || "",
          khoNhap: "", khoNhapName: "",
          ngayNhap: d.NgayDat ? new Date(d.NgayDat).toLocaleDateString("vi-VN") : "",
          status: (d.TrangThai as ImportReceipt["status"]) || "created",
        })));
      })
      .catch(console.error);
  }

  function reloadRetail() {
    if (!maDaiLy) return;
    fetch(`/api/don-hang-sieu-thi/dai-ly/${maDaiLy}`)
      .then(r => r.json())
      .then((data: any[]) => {
        setRetail(data.map(d => ({
          maPhieu: String(d.MaDonHang),
          maLo: "",
          sanPham: d.GhiChu || "",
          soLuong: Number(d.TongSoLuong) || 0,
          sieu_thi: d.TenSieuThi || "",
          ngayTao: d.NgayDat ? new Date(d.NgayDat).toLocaleDateString("vi-VN") : "",
          status: (d.TrangThai as RetailOrder["status"]) || "pending",
        })));
      })
      .catch(console.error);
  }

  async function handleAcceptRetail(id: string) {
    try {
      const res = await fetch(`/api/don-hang-sieu-thi/update-trang-thai/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ TrangThai: "da_nhan" }),
      });
      if (!res.ok) throw new Error((await res.json()).message);
      reloadRetail();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Lỗi xác nhận đơn");
    }
  }

  async function handleShipRetail(id: string) {
    try {
      const res = await fetch(`/api/don-hang-sieu-thi/update-trang-thai/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ TrangThai: "hoan_thanh" }),
      });
      if (!res.ok) throw new Error((await res.json()).message);
      reloadRetail();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Lỗi xuất hàng");
    }
  }

  async function handleDeleteReceipt(id: string) {
    if (!window.confirm("Xóa đơn nhập này?")) return;
    try {
      const res = await fetch(`/api/don-hang-dai-ly/delete/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error((await res.json()).message);
      reloadReceipts();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Lỗi xóa đơn");
    }
  }

  function reloadWarehouses() {
    if (!maDaiLy) return;
    fetch(`/api/kho/dai-ly/${maDaiLy}`)
      .then(r => r.json())
      .then((data: any[]) => {
        const seen = new Set<string>();
        const khos = data.reduce((acc: Warehouse[], w: any) => {
          const key = String(w.MaKho);
          if (!seen.has(key)) { seen.add(key); acc.push({ maKho: key, tenKho: w.TenKho, diaChi: w.DiaChi || "", soDienThoai: "" }); }
          return acc;
        }, []);
        setWarehouses(khos);
      })
      .catch(console.error);
  }

  async function handleDeleteWarehouse(id: string) {
    if (!window.confirm("Xóa kho này?")) return;
    try {
      const res = await fetch(`/api/kho/delete/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error((await res.json()).message);
      reloadWarehouses();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Lỗi xóa kho");
    }
  }

  function reloadInventory() {
    if (!maDaiLy) return;
    fetch(`/api/xuat-nhap-kho/ton-kho/${maDaiLy}`)
      .then(r => r.json())
      .then((data: any[]) => {
        setInventory(data.map(b => ({
          maLo: String(b.MaLo),
          maKho: String(b.MaKho || ""),
          sanPham: b.TenSanPham || "",
          soLuong: Number(b.SoLuong) || 0,
          ngayNhap: b.CapNhatCuoi ? new Date(b.CapNhatCuoi).toLocaleDateString("vi-VN") : "",
          status: Number(b.SoLuong) <= 0 ? "out" : Number(b.SoLuong) < 10 ? "low" : "in_stock",
        })));
      })
      .catch(console.error);
  }

  async function handleDeleteInventory(b: InventoryBatch) {
    if (!window.confirm(`Xóa "${b.sanPham}" khỏi kho?`)) return;
    try {
      const r = await fetch("/api/KhoHang/xoa-ton-kho", {
        method: "DELETE", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ MaKho: Number(b.maKho), MaLo: Number(b.maLo) }),
      });
      if (!r.ok) throw new Error((await r.json()).message);
      reloadInventory();
    } catch (e: unknown) { alert(e instanceof Error ? e.message : "Lỗi xóa"); }
  }

  function reloadQuality() {
    if (!maDaiLy) return;
    fetch(`/api/kiem-dinh/dai-ly/${maDaiLy}`)
      .then(r => r.json())
      .then((data: any[]) => {
        if (!Array.isArray(data)) return;
        setQuality(data.map(d => ({
          maKiemDinh: String(d.MaKiemDinh),
          maLo: String(d.MaLo),
          tenSanPham: d.TenSanPham || "",
          ngayKiem: d.NgayKiemDinh ? new Date(d.NgayKiemDinh).toLocaleDateString("vi-VN") : "",
          nguoiKiem: d.NguoiKiemDinh || "",
          ketQua: (d.KetQua as QualityCheck["ketQua"]) || "dat",
          trangThai: (d.TrangThai as QualityCheck["trangThai"]) || "hoan_thanh",
          bienBan: d.BienBan || "",
          ghiChu: d.GhiChu || "",
        })));
      })
      .catch(console.error);
  }

  async function handleDeleteQuality(id: string) {
    if (!window.confirm("Xóa phiếu kiểm định này?")) return;
    try {
      const res = await fetch(`/api/kiem-dinh/delete/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error((await res.json()).message);
      reloadQuality();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Lỗi xóa kiểm định");
    }
  }

  const headerCtas: Partial<Record<Section, ReactNode>> = {
    dashboard: <PrimaryBtn onClick={() => setModal("receipt")}>+ Nhập hàng</PrimaryBtn>,
  };

  return (
    <div className="daily-app">
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="u-flex u-items-center u-gap-3">
            <span style={{ fontSize: '28px' }}>🏢</span>
            <div>
              <div className="logo">Đại Lý</div>
              <div className="logo-sub">Quản lý phân phối</div>
            </div>
          </div>
        </div>

        <nav className="nav-list">
          {NAV.map(n => (
            <button
              key={n.id}
              onClick={() => setSection(n.id)}
              className={`nav-item ${section === n.id ? "active" : ""}`}
            >
              <span className="nav-icon">{n.icon}</span>
              <span>{n.label}</span>
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button className="profile-btn" onClick={() => setModal("profile")}>
            <div className="avatar">👤</div>
            <div className="u-flex-1" style={{ overflow: 'hidden' }}>
              <div className="u-text-sm u-font-bold u-mb-1" style={{ whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{user.fullName}</div>
              <div className="u-text-sm u-text-muted" style={{ fontSize: '11px' }}>{user.agencyName}</div>
            </div>
          </button>
          <button
            className="logout-btn"
            onClick={() => { clearCurrentUser(); window.location.href = "/login"; }}
          >
            Đăng xuất
          </button>
        </div>
      </aside>

      <main className="main-content">
        <header className="page-header u-flex u-justify-between u-items-center">
          <div>
            <h2 className="page-title">{PAGE_TITLES[section]}</h2>
            <p className="page-subtitle">Xin chào, {user.fullName} · {user.agencyName}</p>
          </div>
          {headerCtas[section]}
        </header>

        {section === "dashboard" && <Dashboard receipts={receipts} quality={quality} inventory={inventory} warehouses={warehouses} onNewReceipt={() => setModal("receipt")} />}
        {section === "orders" && (
          <OrdersSection receipts={receipts} retail={retail} warehouses={warehouses}
            onNewReceipt={() => setModal("receipt")}
            onEditReceipt={r => { setEditTarget(r); setModal("receipt-edit"); }}
            onDeleteReceipt={handleDeleteReceipt}
            onAcceptRetail={handleAcceptRetail}
            onShipRetail={handleShipRetail}
          />
        )}
        {section === "inventory" && (
          <InventorySection warehouses={warehouses} inventory={inventory}
            onNewWarehouse={() => setModal("warehouse")}
            onEditWarehouse={w => { setEditTarget(w); setModal("warehouse-edit"); }}
            onDeleteWarehouse={handleDeleteWarehouse}
            onEditInventory={b => { setEditTarget(b); setModal("inventory-edit"); }}
            onDeleteInventory={handleDeleteInventory}
          />
        )}
        {section === "quality" && (
          <QualitySection quality={quality} onNew={() => setModal("quality")}
            onEdit={q => { setEditTarget(q); setModal("quality-edit"); }}
            onDelete={handleDeleteQuality}
          />
        )}
        {section === "reports" && <ReportsSection receipts={receipts} retail={retail} inventory={inventory} quality={quality} />}
      </main>

      {(modal === "receipt" || modal === "receipt-edit") && <ReceiptModal receipt={modal === "receipt-edit" ? editTarget as ImportReceipt : null} onClose={() => { setModal(null); setEditTarget(null); }} onSaved={() => { reloadReceipts(); }} />}
      {(modal === "warehouse" || modal === "warehouse-edit") && <WarehouseModal warehouse={modal === "warehouse-edit" ? editTarget as Warehouse : null} onClose={() => { setModal(null); setEditTarget(null); }} onSaved={reloadWarehouses} />}
      {(modal === "quality" || modal === "quality-edit") && <QualityModal check={modal === "quality-edit" ? editTarget as QualityCheck : null} inventory={inventory} onClose={() => { setModal(null); setEditTarget(null); }} onSaved={reloadQuality} />}
      {modal === "inventory-edit" && editTarget && <InventoryEditModal batch={editTarget as InventoryBatch} onClose={() => { setModal(null); setEditTarget(null); }} onSaved={reloadInventory} />}
      {modal === "profile" && <UserProfileModal user={user} onClose={() => setModal(null)} onEdit={() => setModal("edit-profile")} />}
      {modal === "edit-profile" && <EditProfileModal user={user} onClose={() => setModal(null)} onSaved={(u) => setUserInfo(prev => ({ ...prev, ...u }))} />}
    </div>
  );
}
