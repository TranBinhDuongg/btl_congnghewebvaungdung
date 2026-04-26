import React, { useState, useEffect, CSSProperties, ReactNode } from "react";
import { getCurrentUser, clearCurrentUser, apiUpdateProfile } from "./AuthHelper.ts";

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
export interface InventoryBatch { maLo: string; sanPham: string; soLuong: number; ngayNhap: string; status: "in_stock" | "low" | "out"; }
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
  // frontend keys
  created:             { label: "Đã tạo",        color: "#64748b", bg: "#f1f5f9" },
  pending:             { label: "Chờ xử lý",     color: "#b45309", bg: "#fef3c7" },
  preparing:           { label: "Chuẩn bị",      color: "#1d4ed8", bg: "#dbeafe" },
  shipped:             { label: "Đã xuất",        color: "#7c3aed", bg: "#ede9fe" },
  received:            { label: "Đã nhận",        color: "#059669", bg: "#d1fae5" },
  // DB keys
  chua_nhan:           { label: "Chưa nhận",     color: "#b45309", bg: "#fef3c7" },
  da_nhan:             { label: "Đã nhận",        color: "#059669", bg: "#d1fae5" },
  dang_xu_ly:          { label: "Đang xử lý",    color: "#1d4ed8", bg: "#dbeafe" },
  hoan_thanh:          { label: "Hoàn thành",    color: "#15803d", bg: "#dcfce7" },
  da_huy:              { label: "Đã hủy",         color: "#6b7280", bg: "#f3f4f6" },
  // tồn kho
  in_stock:            { label: "Còn hàng",       color: "#15803d", bg: "#dcfce7" },
  low:                 { label: "Sắp hết",        color: "#dc2626", bg: "#fee2e2" },
  out:                 { label: "Hết hàng",       color: "#6b7280", bg: "#f3f4f6" },
  // kiểm định
  dat:                 { label: "✓ Đạt",          color: "#059669", bg: "#d1fae5" },
  khong_dat:           { label: "✗ Không đạt",    color: "#dc2626", bg: "#fee2e2" },
  A:                   { label: "Loại A",          color: "#15803d", bg: "#dcfce7" },
  B:                   { label: "Loại B",          color: "#1d4ed8", bg: "#dbeafe" },
  C:                   { label: "Loại C",          color: "#b45309", bg: "#fef3c7" },
  hoan_thanh_kd:       { label: "Hoàn thành",     color: "#15803d", bg: "#dcfce7" },
  cho_duyet:           { label: "Chờ duyệt",      color: "#b45309", bg: "#fef3c7" },
  // legacy keys (giữ lại để không break)
  "Đạt":               { label: "✓ Đạt",          color: "#059669", bg: "#d1fae5" },
  "Không đạt":         { label: "✗ Không đạt",    color: "#dc2626", bg: "#fee2e2" },
  "Yêu cầu bổ sung":  { label: "⚠ Bổ sung",      color: "#b45309", bg: "#fef3c7" },
};

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_MAP[status] ?? { label: status, color: "#555", bg: "#f3f4f6" };
  return <span style={{ display: "inline-block", padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700, letterSpacing: 0.3, color: s.color, background: s.bg, whiteSpace: "nowrap" }}>{s.label}</span>;
}

// ─── Shared micro-components ──────────────────────────────────────────────────
function Panel({ children, style }: { children: ReactNode; style?: CSSProperties; key?: string }) {
  return <div style={{ background: "#fff", borderRadius: 14, padding: 20, boxShadow: "0 1px 8px #0000000a", ...style }}>{children}</div>;
}
function SectionTitle({ children }: { children: ReactNode }) {
  return <h4 style={{ fontSize: 14, fontWeight: 700, color: "#431407", marginBottom: 14, letterSpacing: 0.2 }}>{children}</h4>;
}
function StyledTable({ headers, children }: { headers: string[]; children: ReactNode }) {
  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
        <thead><tr>{headers.map(h => (
          <th key={h} style={{ textAlign: "left", padding: "8px 12px", background: "#fffbeb", color: "#431407", fontWeight: 700, fontSize: 10, textTransform: "uppercase", letterSpacing: 0.6, whiteSpace: "nowrap" }}>{h}</th>
        ))}</tr></thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}
function Td({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return <td style={{ padding: "10px 12px", verticalAlign: "middle", borderBottom: "1px solid #f0f0f0", ...style }}>{children}</td>;
}
function ActionBtn({ children, onClick, color = "#2563eb" }: { children: ReactNode; onClick: () => void; color?: string }) {
  return <button onClick={onClick} style={{ marginRight: 5, padding: "4px 10px", background: color, color: "#fff", border: "none", borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: "pointer" }}>{children}</button>;
}
function PrimaryBtn({ children, onClick }: { children: ReactNode; onClick?: () => void }) {
  return <button onClick={onClick} style={{ padding: "9px 18px", background: "linear-gradient(135deg,#d97706,#92400e)", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 700, fontSize: 13, letterSpacing: 0.3 }}>{children}</button>;
}

// ─── Modal shell ──────────────────────────────────────────────────────────────
function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2000 }} onClick={onClose}>
      <div style={{ background: "#fff", borderRadius: 16, padding: 28, width: 620, maxWidth: "94vw", maxHeight: "88vh", overflowY: "auto", position: "relative", boxShadow: "0 8px 40px #0003" }} onClick={e => e.stopPropagation()}>
        <button onClick={onClose} style={{ position: "absolute", top: 12, right: 14, background: "none", border: "none", fontSize: 22, cursor: "pointer", color: "#aaa" }}>✕</button>
        <h3 style={{ marginBottom: 18, color: "#431407", fontWeight: 800, fontSize: 17 }}>{title}</h3>
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
const inp: CSSProperties = { width: "100%", padding: "8px 10px", border: "1.5px solid #e2e8f0", borderRadius: 8, fontSize: 13, outline: "none", fontFamily: "inherit" };

// ─── Sections ─────────────────────────────────────────────────────────────────
function Dashboard({ receipts, quality, inventory, warehouses, onNewReceipt }: { receipts: ImportReceipt[]; quality: QualityCheck[]; inventory: InventoryBatch[]; warehouses: Warehouse[]; onNewReceipt: () => void }) {
  const alerts = quality.filter(q => q.ketQua !== "dat");
  const totalStock = inventory.reduce((s, b) => s + b.soLuong, 0);
  const kpis = [
    { icon: "📥", label: "Phiếu nhập",   value: receipts.length,    accent: "#16a34a" },
    { icon: "🏪", label: "Kho hàng",     value: warehouses.length,  accent: "#2563eb" },
    { icon: "📦", label: "Tổng tồn kho", value: `${totalStock} kg`, accent: "#7c3aed" },
    { icon: "⚠️", label: "Cảnh báo chất lượng",  value: alerts.length,      accent: "#dc2626" },
  ];
  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(190px,1fr))", gap: 16, marginBottom: 24 }}>
        {kpis.map(k => (
          <Panel key={k.label} style={{ borderTop: `4px solid ${k.accent}`, display: "flex", alignItems: "center", gap: 14 }}>
            <span style={{ fontSize: 28 }}>{k.icon}</span>
            <div>
              <div style={{ fontSize: 26, fontWeight: 800, color: "#111", lineHeight: 1 }}>{k.value}</div>
              <div style={{ fontSize: 12, color: "#888", marginTop: 4 }}>{k.label}</div>
            </div>
          </Panel>
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(460px,1fr))", gap: 16 }}>
        <Panel>
          <SectionTitle>📋 Đơn hàng gần đây</SectionTitle>
          {receipts.length === 0
            ? <p style={{ color: "#aaa", textAlign: "center", padding: "20px 0", fontSize: 13 }}>Chưa có đơn hàng nào</p>
            : <StyledTable headers={["Mã đơn", "Nông dân", "Tổng SL", "Ghi chú", "Ngày đặt", "TT"]}>
                {receipts.slice(0, 5).map(r => (
                  <tr key={r.maPhieu}>
                    <Td><code style={{ fontSize: 11, color: "#888" }}>#{r.maPhieu}</code></Td>
                    <Td>{r.tenNong || "—"}</Td>
                    <Td>{r.soLuong > 0 ? `${r.soLuong.toLocaleString()} kg` : "—"}</Td>
                    <Td style={{ color: "#888", maxWidth: 160 }}>{r.sanPham || "—"}</Td>
                    <Td>{r.ngayNhap || "—"}</Td>
                    <Td><StatusBadge status={r.status} /></Td>
                  </tr>
                ))}
              </StyledTable>
          }
        </Panel>
        <Panel>
          <SectionTitle>🔬 Cảnh báo chất lượng</SectionTitle>
          {alerts.length === 0
            ? <p style={{ color: "#aaa", textAlign: "center", padding: "20px 0", fontSize: 13 }}>Không có cảnh báo</p>
            : <StyledTable headers={["Mã kiểm định", "Lô", "Kết quả", "Ngày", "Ghi chú"]}>
                {alerts.map(q => (
                  <tr key={q.maKiemDinh}>
                    <Td><code style={{ fontSize: 11, color: "#888" }}>{q.maKiemDinh}</code></Td>
                    <Td><b>{q.maLo}</b></Td><Td><StatusBadge status={q.ketQua} /></Td>
                    <Td>{q.ngayKiem}</Td><Td style={{ color: "#888" }}>{q.ghiChu || "—"}</Td>
                  </tr>
                ))}
              </StyledTable>
          }
        </Panel>
      </div>
    </div>
  );
}

function OrdersSection({ receipts, retail, warehouses, onNewReceipt, onEditReceipt, onDeleteReceipt, onAcceptRetail, onShipRetail }: {
  receipts: ImportReceipt[]; retail: RetailOrder[]; warehouses: Warehouse[];
  onNewReceipt: () => void; onEditReceipt: (r: ImportReceipt) => void; onDeleteReceipt: (id: string) => void;
  onAcceptRetail: (id: string) => void; onShipRetail: (id: string) => void;
}) {
  const [tab, setTab] = useState<"import" | "retail">("import");
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", background: "#f3f4f6", borderRadius: 10, padding: 4, gap: 4 }}>
          {(["import", "retail"] as const).map(id => (
            <button key={id} onClick={() => setTab(id)}
              style={{ padding: "8px 20px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 700,
                background: tab === id ? "linear-gradient(135deg,#d97706,#92400e)" : "transparent",
                color: tab === id ? "#fff" : "#666", boxShadow: tab === id ? "0 2px 8px #d9770640" : "none" }}>
              {id === "import" ? "📥 Phiếu nhập" : "📤 Phiếu xuất"}
            </button>
          ))}
        </div>
        {tab === "import" && <PrimaryBtn onClick={onNewReceipt}>+ Tạo phiếu nhập</PrimaryBtn>}
      </div>

      {tab === "import" && (
        <Panel>
          <SectionTitle>Phiếu nhập hàng từ Nông dân</SectionTitle>
          {receipts.length === 0
            ? <p style={{ textAlign: "center", color: "#aaa", padding: "24px 0", fontSize: 13 }}>Chưa có phiếu nhập nào</p>
            : <StyledTable headers={["Mã đơn", "Nông dân", "Tổng SL", "Ghi chú", "Ngày đặt", "Trạng thái", ""]}>
                {receipts.map(r => (
                  <tr key={r.maPhieu}>
                    <Td><code style={{ fontSize: 11, color: "#888" }}>#{r.maPhieu}</code></Td>
                    <Td>{r.tenNong || "—"}</Td>
                    <Td>{r.soLuong > 0 ? `${r.soLuong.toLocaleString()} kg` : "—"}</Td>
                    <Td style={{ color: "#888", maxWidth: 180 }}>{r.sanPham || "—"}</Td>
                    <Td>{r.ngayNhap || "—"}</Td>
                    <Td><StatusBadge status={r.status} /></Td>
                    <Td>
                      <ActionBtn onClick={() => onEditReceipt(r)} color="#2563eb">Sửa</ActionBtn>
                      <ActionBtn onClick={() => onDeleteReceipt(r.maPhieu)} color="#dc2626">Xóa</ActionBtn>
                    </Td>
                  </tr>
                ))}
              </StyledTable>
          }
        </Panel>
      )}

      {tab === "retail" && (
        <Panel>
          <SectionTitle>Phiếu xuất hàng cho Siêu thị</SectionTitle>
          {retail.length === 0
            ? <p style={{ textAlign: "center", color: "#aaa", padding: "24px 0", fontSize: 13 }}>Chưa có phiếu xuất nào</p>
            : <StyledTable headers={["Mã đơn", "Siêu thị", "Tổng SL", "Ghi chú", "Ngày đặt", "Trạng thái", ""]}>
                {retail.map(r => (
                  <tr key={r.maPhieu}>
                    <Td><code style={{ fontSize: 11, color: "#888" }}>#{r.maPhieu}</code></Td>
                    <Td>{r.sieu_thi || "—"}</Td>
                    <Td>{r.soLuong > 0 ? `${r.soLuong.toLocaleString()} kg` : "—"}</Td>
                    <Td style={{ color: "#888", maxWidth: 180 }}>{r.sanPham || "—"}</Td>
                    <Td>{r.ngayTao || "—"}</Td>
                    <Td><StatusBadge status={r.status} /></Td>
                    <Td>
                      {(r.status === "pending" || r.status === "chua_nhan") && <ActionBtn onClick={() => onAcceptRetail(r.maPhieu)} color="#16a34a">Xác nhận</ActionBtn>}
                      {(r.status === "received" || r.status === "da_nhan")  && <ActionBtn onClick={() => onShipRetail(r.maPhieu)}   color="#7c3aed">Xuất hàng</ActionBtn>}
                    </Td>
                  </tr>
                ))}
              </StyledTable>
          }
        </Panel>
      )}
    </div>
  );
}

function InventorySection({ warehouses, inventory, onNewWarehouse, onEditWarehouse, onDeleteWarehouse }: {
  warehouses: Warehouse[]; inventory: InventoryBatch[];
  onNewWarehouse: () => void; onEditWarehouse: (w: Warehouse) => void; onDeleteWarehouse: (id: string) => void;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <Panel>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <SectionTitle>🏪 Danh sách kho nhập hàng</SectionTitle>
          <PrimaryBtn onClick={onNewWarehouse}>+ Thêm kho</PrimaryBtn>
        </div>
        <StyledTable headers={["Mã kho", "Tên kho", "Địa chỉ", "SĐT", ""]}>
          {warehouses.map(w => (
            <tr key={w.maKho}>
              <Td><code style={{ fontSize: 11, color: "#888" }}>{w.maKho}</code></Td>
              <Td><b>{w.tenKho}</b></Td><Td>{w.diaChi}</Td><Td>{w.soDienThoai}</Td>
              <Td><ActionBtn onClick={() => onEditWarehouse(w)} color="#2563eb">Sửa</ActionBtn><ActionBtn onClick={() => onDeleteWarehouse(w.maKho)} color="#dc2626">Xóa</ActionBtn></Td>
            </tr>
          ))}
        </StyledTable>
      </Panel>
      <Panel>
        <SectionTitle>📦 Tồn kho hiện tại (theo lô)</SectionTitle>
        <StyledTable headers={["Mã lô", "Sản phẩm", "Số lượng", "Ngày nhập", "Trạng thái"]}>
          {inventory.map(b => (
            <tr key={b.maLo}>
              <Td><code style={{ fontSize: 11, color: "#888" }}>{b.maLo}</code></Td>
              <Td><b>{b.sanPham}</b></Td><Td>{b.soLuong} kg</Td><Td>{b.ngayNhap}</Td>
              <Td><StatusBadge status={b.status} /></Td>
            </tr>
          ))}
        </StyledTable>
      </Panel>
    </div>
  );
}

function QualitySection({ quality, onNew, onEdit, onDelete }: {
  quality: QualityCheck[]; onNew: () => void; onEdit: (q: QualityCheck) => void; onDelete: (id: string) => void;
}) {
  return (
    <Panel>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <SectionTitle>🔬 Phiếu kiểm định chất lượng</SectionTitle>
        <PrimaryBtn onClick={onNew}>+ Thêm kiểm định</PrimaryBtn>
      </div>
      {quality.length === 0
        ? <p style={{ textAlign: "center", color: "#aaa", padding: "24px 0", fontSize: 13 }}>Chưa có phiếu kiểm định nào</p>
        : <StyledTable headers={["Mã KĐ", "Mã lô", "Sản phẩm", "Người kiểm", "Kết quả", "Trạng thái", "Ghi chú", ""]}>
            {quality.map(q => (
              <tr key={q.maKiemDinh}>
                <Td><code style={{ fontSize: 11, color: "#888" }}>#{q.maKiemDinh}</code></Td>
                <Td><b>{q.maLo}</b></Td>
                <Td>{q.tenSanPham || "—"}</Td>
                <Td>{q.nguoiKiem}</Td>
                <Td><StatusBadge status={q.ketQua} /></Td>
                <Td><StatusBadge status={q.trangThai || "cho_duyet"} /></Td>
                <Td style={{ color: "#888", maxWidth: 160 }}>{q.ghiChu || "—"}</Td>
                <Td>
                  <ActionBtn onClick={() => onEdit(q)} color="#2563eb">Sửa</ActionBtn>
                  <ActionBtn onClick={() => onDelete(q.maKiemDinh)} color="#dc2626">Xóa</ActionBtn>
                </Td>
              </tr>
            ))}
          </StyledTable>
      }
    </Panel>
  );
}

function ReportsSection({ receipts, retail, inventory, quality }: {
  receipts: ImportReceipt[]; retail: RetailOrder[]; inventory: InventoryBatch[]; quality: QualityCheck[];
}) {
  const totalStock = inventory.reduce((s, b) => s + b.soLuong, 0);
  const shipped = retail.filter(r => r.status === "shipped").length;
  const passed = quality.filter(q => q.ketQua === "dat" || q.ketQua === "A").length;
  const passRate = quality.length ? Math.round((passed / quality.length) * 100) : 0;
  const cards = [
    { icon: "📥", label: "Tổng phiếu nhập", value: receipts.length,    color: "#16a34a" },
    { icon: "🚚", label: "Đã xuất hàng",    value: shipped,            color: "#7c3aed" },
    { icon: "📦", label: "Tổng tồn kho",    value: `${totalStock} kg`, color: "#2563eb" },
    { icon: "✅", label: "Tỷ lệ đạt chất lượng",    value: `${passRate}%`,     color: "#059669" },
  ];
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 16 }}>
      {cards.map(c => (
        <Panel key={c.label} style={{ textAlign: "center", borderLeft: `5px solid ${c.color}` }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>{c.icon}</div>
          <div style={{ fontSize: 12, color: "#888", marginBottom: 6 }}>{c.label}</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: c.color }}>{c.value}</div>
        </Panel>
      ))}
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
  const [lots, setLots] = useState<{ MaLo: number; TenSanPham: string; SoLuongHienTai: number }[]>([]);
  const [rows, setRows] = useState<ChiTietRow[]>([{ maLo: "", tenLo: "", soLuong: "", donGia: "" }]);
  const [ghiChu, setGhiChu] = useState(receipt?.ghiChu || receipt?.sanPham || "");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  // Tạo mới: load nông dân
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

  // Tạo mới: khi chọn nông dân → load lô của họ
  useEffect(() => {
    if (receipt || !maNongDan) return;
    fetch(`/api/lo-nong-san/get-by-nong-dan/${maNongDan}`)
      .then(r => r.json())
      .then((data: any[]) => {
        setLots(data);
        setRows([{ maLo: data[0] ? String(data[0].MaLo) : "", tenLo: data[0]?.TenSanPham || "", soLuong: "", donGia: "" }]);
      })
      .catch(console.error);
  }, [maNongDan, receipt]);

  // Sửa: load chi tiết đơn hiện tại + lô của nông dân đó
  useEffect(() => {
    if (!receipt) return;
    // Load chi tiết đơn
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
        // Load lô để dùng cho dropdown thêm mới
        if (data.length > 0) {
          // Lấy tất cả lô (dùng get-all vì không biết maNongDan ở đây)
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
        return { ...r, maLo: val, tenLo: lot?.TenSanPham || "" };
      }
      return { ...r, [field]: val };
    }));
  }

  async function handleSave() {
    setLoading(true); setErr("");
    try {
      if (receipt) {
        // Cập nhật ghi chú
        const resGhiChu = await fetch(`/api/don-hang-dai-ly/update/${receipt.maPhieu}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ GhiChu: ghiChu }),
        });
        if (!resGhiChu.ok) throw new Error((await resGhiChu.json()).message);

        // Cập nhật từng dòng chi tiết đã có
        for (const row of rows.filter(r => r.isExisting && r.maLo && r.soLuong && r.donGia)) {
          const r2 = await fetch(`/api/don-hang-dai-ly/${receipt.maPhieu}/chi-tiet/${row.maLo}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ SoLuong: Number(row.soLuong), DonGia: Number(row.donGia) }),
          });
          if (!r2.ok) throw new Error((await r2.json()).message);
        }

        // Thêm các dòng mới
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
    <Modal title={receipt ? `Sửa đơn #${receipt.maPhieu}` : "Tạo đơn nhập hàng"} onClose={onClose}>
      {err && <div style={{ padding: "8px 12px", background: "#fff0f0", color: "#c62828", borderRadius: 8, marginBottom: 14, fontSize: 13 }}>⚠ {err}</div>}

      {receipt ? (
        <div style={{ marginBottom: 14, padding: "8px 12px", background: "#f8fafc", borderRadius: 8, fontSize: 13, color: "#555" }}>
          Nông dân: <b>{receipt.tenNong || "—"}</b>
        </div>
      ) : (
        <FormField label="Nông dân *">
          <select style={inp} value={maNongDan} onChange={e => setMaNongDan(e.target.value)}>
            {nongDans.map(n => <option key={n.MaNongDan} value={n.MaNongDan}>{n.HoTen}</option>)}
          </select>
        </FormField>
      )}

      <div style={{ marginBottom: 14 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <label style={{ fontSize: 12, fontWeight: 700, color: "#555" }}>Chi tiết đơn hàng *</label>
          <button onClick={() => setRows(rs => [...rs, { maLo: allLots[0] ? String(allLots[0].MaLo) : "", tenLo: allLots[0]?.TenSanPham || "", soLuong: "", donGia: "", isExisting: false }])}
            style={{ fontSize: 11, fontWeight: 700, color: "#d97706", background: "none", border: "1px solid #d97706", borderRadius: 6, padding: "3px 10px", cursor: "pointer" }}>
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
            {row.isExisting ? (
              <div style={{ padding: "8px 10px", background: "#f8fafc", borderRadius: 8, fontSize: 13, color: "#333", border: "1.5px solid #e2e8f0" }}>
                {row.tenLo || `Lô #${row.maLo}`}
              </div>
            ) : (
              <select style={inp} value={row.maLo} onChange={e => setRow(i, "maLo", e.target.value)}>
                {allLots.length === 0
                  ? <option value="">— Không có lô —</option>
                  : allLots.map(l => <option key={l.MaLo} value={l.MaLo}>{l.TenSanPham} (còn {l.SoLuongHienTai} kg)</option>)
                }
              </select>
            )}
            <input style={inp} type="number" placeholder="Số lượng" value={row.soLuong} onChange={e => setRow(i, "soLuong", e.target.value)} />
            <input style={inp} type="number" placeholder="Đơn giá" value={row.donGia} onChange={e => setRow(i, "donGia", e.target.value)} />
            <button onClick={() => handleDeleteRow(row, i)}
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

function WarehouseModal({ warehouse, onClose, onSave }: {
  warehouse: Warehouse | null; onClose: () => void; onSave: (d: Partial<Warehouse>) => void;
}) {
  const [maKho, setMaKho] = useState(warehouse?.maKho || "");
  const [tenKho, setTenKho] = useState(warehouse?.tenKho || "");
  const [diaChi, setDiaChi] = useState(warehouse?.diaChi || "");
  const [sdt, setSdt] = useState(warehouse?.soDienThoai || "");
  return (
    <Modal title={warehouse ? "Chỉnh sửa kho" : "Thêm kho mới"} onClose={onClose}>
      <FormField label="Mã kho"><input style={inp} value={maKho} onChange={e => setMaKho(e.target.value)} placeholder="KHO01" /></FormField>
      <FormField label="Tên kho *"><input style={inp} value={tenKho} onChange={e => setTenKho(e.target.value)} placeholder="Kho Long Biên" /></FormField>
      <FormField label="Địa chỉ"><input style={inp} value={diaChi} onChange={e => setDiaChi(e.target.value)} placeholder="Số nhà, đường, quận…" /></FormField>
      <FormField label="Số điện thoại"><input style={inp} value={sdt} onChange={e => setSdt(e.target.value)} placeholder="024…" /></FormField>
      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 6 }}>
        <button onClick={onClose} style={{ padding: "9px 18px", background: "#f3f4f6", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 600 }}>Hủy</button>
        <PrimaryBtn onClick={() => { if (!tenKho) return alert("Cần tên kho"); onSave({ maKho, tenKho, diaChi, soDienThoai: sdt }); }}>Lưu kho</PrimaryBtn>
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
    <Modal title={check ? `Sửa kiểm định #${check.maKiemDinh}` : "Thêm phiếu kiểm định"} onClose={onClose}>
      {err && <div style={{ padding: "8px 12px", background: "#fff0f0", color: "#c62828", borderRadius: 8, marginBottom: 14, fontSize: 13 }}>⚠ {err}</div>}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 14px" }}>
        <FormField label="Lô nông sản *">
          {check
            ? <div style={{ padding: "8px 10px", background: "#f8fafc", borderRadius: 8, fontSize: 13, border: "1.5px solid #e2e8f0" }}>{check.tenSanPham || `Lô #${check.maLo}`}</div>
            : <select style={inp} value={maLo} onChange={e => setMaLo(e.target.value)}>
                {inventory.length === 0
                  ? <option value="">— Không có lô trong kho —</option>
                  : inventory.map(b => <option key={b.maLo} value={b.maLo}>{b.sanPham} — Lô #{b.maLo} ({b.soLuong} kg)</option>)
                }
              </select>
          }
        </FormField>
        <FormField label="Người kiểm *">
          <input style={inp} value={nguoi} onChange={e => setNguoi(e.target.value)} placeholder="Tên người kiểm định" />
        </FormField>
        <FormField label="Kết quả *">
          <select style={inp} value={ketQua} onChange={e => setKetQua(e.target.value as QualityCheck["ketQua"])}>
            <option value="dat">✓ Đạt</option>
            <option value="khong_dat">✗ Không đạt</option>
            <option value="A">Loại A</option>
            <option value="B">Loại B</option>
            <option value="C">Loại C</option>
          </select>
        </FormField>
        <FormField label="Trạng thái">
          <select style={inp} value={trangThai} onChange={e => setTrangThai(e.target.value as "hoan_thanh" | "cho_duyet")}>
            <option value="cho_duyet">Chờ duyệt</option>
            <option value="hoan_thanh">Hoàn thành</option>
          </select>
        </FormField>
      </div>
      <FormField label="Biên bản">
        <input style={inp} value={bienBan} onChange={e => setBienBan(e.target.value)} placeholder="Nội dung biên bản…" />
      </FormField>
      <FormField label="Ghi chú">
        <input style={inp} value={ghiChu} onChange={e => setGhiChu(e.target.value)} placeholder="Tuỳ chọn…" />
      </FormField>
      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 6 }}>
        <button onClick={onClose} style={{ padding: "9px 18px", background: "#f3f4f6", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 600 }}>Hủy</button>
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
      <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
        <div style={{ width: 60, height: 60, background: "linear-gradient(135deg,#d97706,#92400e)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26 }}>🏢</div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px 16px", marginBottom: 18 }}>
        {fields.map(([k, v]) => (
          <div key={k} style={{ padding: "6px 0", borderBottom: "1px solid #f0f0f0" }}>
            <div style={{ fontSize: 10, color: "#aaa", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.4 }}>{k}</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#222", marginTop: 2 }}>{v}</div>
          </div>
        ))}
      </div>
      <button onClick={onEdit} style={{ width: "100%", padding: "10px", background: "linear-gradient(135deg,#d97706,#92400e)", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 700, fontSize: 13 }}>✏️ Sửa thông tin</button>
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
      {err && <div style={{ padding: "8px 12px", background: "#fff0f0", color: "#c62828", borderRadius: 8, marginBottom: 14, fontSize: 13 }}>⚠ {err}</div>}
      <FormField label="Họ tên *"><input style={inp} value={hoTen} onChange={e => setHoTen(e.target.value)} /></FormField>
      <FormField label="Số điện thoại"><input style={inp} value={sdt} onChange={e => setSdt(e.target.value)} /></FormField>
      <FormField label="Email"><input style={inp} type="email" value={email} onChange={e => setEmail(e.target.value)} /></FormField>
      <FormField label="Địa chỉ"><input style={inp} value={diaChi} onChange={e => setDiaChi(e.target.value)} /></FormField>
      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 6 }}>
        <button onClick={onClose} style={{ padding: "9px 18px", background: "#f3f4f6", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 600 }}>Hủy</button>
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
type ModalType = "receipt" | "receipt-edit" | "warehouse" | "warehouse-edit" | "quality" | "quality-edit" | "profile" | "edit-profile" | null;

export default function DailyApp() {
  const [section, setSection] = useState<Section>("dashboard");
  const [receipts, setReceipts] = useState<ImportReceipt[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [inventory, setInventory] = useState<InventoryBatch[]>([]);
  const [quality, setQuality] = useState<QualityCheck[]>([]);
  const [retail, setRetail] = useState<RetailOrder[]>([]);
  const [modal, setModal] = useState<ModalType>(null);
  const [editTarget, setEditTarget] = useState<ImportReceipt | Warehouse | QualityCheck | null>(null);

  const authUser = getCurrentUser();
  const maDaiLy = authUser?.maDoiTuong;

  useEffect(() => {
    if (!authUser || authUser.role !== "daily") {
      window.location.href = "/login";
      return;
    }
    if (!maDaiLy) return;

    // Load kho hàng của đại lý
    fetch(`/api/kho/dai-ly/${maDaiLy}`)
      .then(r => r.json())
      .then((data: any[]) => {
        // dedupe by MaKho vì SP join với TonKho có thể trả nhiều row cùng kho
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

    // Load tồn kho theo đại lý
    fetch(`/api/xuat-nhap-kho/ton-kho/${maDaiLy}`)
      .then(r => r.json())
      .then((data: any[]) => {
        setInventory(data.map(b => ({
          maLo: String(b.MaLo),
          sanPham: b.TenSanPham || "",
          soLuong: Number(b.SoLuong) || 0,
          ngayNhap: b.CapNhatCuoi ? new Date(b.CapNhatCuoi).toLocaleDateString("vi-VN") : "",
          status: Number(b.SoLuong) <= 0 ? "out" : Number(b.SoLuong) < 10 ? "low" : "in_stock",
        })));
      })
      .catch(console.error);

    // Load đơn hàng nhập từ nông dân
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

    // Load đơn hàng xuất từ siêu thị
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

    // Load kiểm định chất lượng
    fetch(`/api/kiem-dinh/dai-ly/${maDaiLy}`)
      .then(r => r.json())
      .then((data: any[]) => {
        console.log('[KiemDinh] raw data:', data);
        if (!Array.isArray(data)) { console.error('[KiemDinh] không phải array:', data); return; }
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
      .catch(e => console.error('[KiemDinh] fetch error:', e));
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
  function handleSaveWarehouse(d: Partial<Warehouse>) {
    if (modal === "warehouse-edit" && editTarget) {
      setWarehouses(ws => ws.map(w => w.maKho === (editTarget as Warehouse).maKho ? { ...w, ...d } : w));
    } else {
      setWarehouses(ws => [...ws, { maKho: "KHO" + Date.now(), ...d } as Warehouse]);
    }
    setModal(null); setEditTarget(null);
  }
  function handleDeleteWarehouse(id: string) {
    if (window.confirm("Xóa kho này?")) setWarehouses(ws => ws.filter(w => w.maKho !== id));
  }
  function handleSaveQuality(_d: Partial<QualityCheck>) { /* replaced by QualityModal onSaved */ }

  function reloadQuality() {
    if (!maDaiLy) return;
    fetch(`/api/kiem-dinh/dai-ly/${maDaiLy}`)
      .then(r => r.json())
      .then((data: any[]) => {
        console.log('[KiemDinh reload] raw data:', data);
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
    <div style={{ fontFamily: "'Be Vietnam Pro','Segoe UI',Tahoma,Geneva,sans-serif", background: "#f4f6f4", minHeight: "100vh" }}>
      <aside style={{ position: "fixed", left: 0, top: 0, width: 248, height: "100vh", background: "linear-gradient(180deg,#431407 0%,#1c0a03 100%)", color: "#fff", display: "flex", flexDirection: "column", zIndex: 1000 }}>
        <div style={{ padding: "20px 18px 16px", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 28 }}>🏢</span>
            <div>
              <div style={{ fontWeight: 800, fontSize: 16, letterSpacing: 0.5 }}>Đại Lý</div>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", letterSpacing: 0.8, textTransform: "uppercase" }}>Quản lý phân phối</div>
            </div>
          </div>
        </div>
        <div style={{ padding: "12px 18px", borderBottom: "1px solid rgba(255,255,255,0.07)", cursor: "pointer" }} onClick={() => setModal("profile")}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 36, height: 36, background: "linear-gradient(135deg,#d97706,#92400e)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>👤</div>
            <div style={{ overflow: "hidden" }}>
              <div style={{ fontWeight: 700, fontSize: 13, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{user.fullName}</div>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)" }}>{user.agencyName}</div>
            </div>
          </div>
        </div>
        <nav style={{ flex: 1, padding: "10px 0", overflowY: "auto" }}>
          {NAV.map(n => (
            <button key={n.id} onClick={() => setSection(n.id)} style={{ display: "flex", alignItems: "center", gap: 12, width: "100%", padding: "11px 18px", background: section === n.id ? "rgba(217,119,6,0.18)" : "none", border: "none", borderLeft: section === n.id ? "3px solid #d97706" : "3px solid transparent", color: section === n.id ? "#d97706" : "rgba(255,255,255,0.6)", cursor: "pointer", fontSize: 13, fontWeight: section === n.id ? 700 : 500, textAlign: "left" }}>
              <span>{n.icon}</span><span>{n.label}</span>
            </button>
          ))}
        </nav>
        <div style={{ padding: "10px 8px 16px", borderTop: "1px solid rgba(255,255,255,0.07)" }}>
          <button style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "10px", background: "none", border: "none", color: "rgba(255,255,255,0.4)", cursor: "pointer", fontSize: 12, borderRadius: 8 }} onClick={() => { clearCurrentUser(); window.location.href = "/login"; }}>
            <span>🚪</span><span>Đăng xuất</span>
          </button>
        </div>
      </aside>

      <main style={{ marginLeft: 248, padding: "28px 28px 48px", minHeight: "100vh" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 22 }}>
          <div>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: "#431407", margin: 0 }}>{PAGE_TITLES[section]}</h2>
            <p style={{ fontSize: 12, color: "#aaa", margin: "3px 0 0" }}>Xin chào, {user.fullName} · {user.agencyName}</p>
          </div>
          {headerCtas[section]}
        </div>
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
      {(modal === "warehouse" || modal === "warehouse-edit") && <WarehouseModal warehouse={modal === "warehouse-edit" ? editTarget as Warehouse : null} onClose={() => { setModal(null); setEditTarget(null); }} onSave={handleSaveWarehouse} />}
      {(modal === "quality" || modal === "quality-edit") && <QualityModal check={modal === "quality-edit" ? editTarget as QualityCheck : null} inventory={inventory} onClose={() => { setModal(null); setEditTarget(null); }} onSaved={reloadQuality} />}
      {modal === "profile" && <UserProfileModal user={user} onClose={() => setModal(null)} onEdit={() => setModal("edit-profile")} />}
      {modal === "edit-profile" && <EditProfileModal user={user} onClose={() => setModal(null)} onSaved={(u) => setUserInfo(prev => ({ ...prev, ...u }))} />}
    </div>
  );
}
