import React, { useState, useEffect, ReactNode, CSSProperties } from "react";
import "./NongDanApp.css";
import { getCurrentUser, clearCurrentUser, apiUpdateProfile } from "./AuthHelper.ts";

// ─── Types ────────────────────────────────────────────────────────────────────
export interface User {
  id: string; fullName: string; username: string; email: string; phone: string;
  role: string; province: string; district: string; address: string;
  farmName: string; farmArea: string; cropType: string; certification: string; createdAt: string;
}
export interface Farm { id: string; name: string; address: string; cert?: string; }
export interface Batch {
  id: string;
  farmId: string;
  farmName: string;
  maSanPham: number;
  product: string;
  soLuongBanDau: number;
  soLuongHienTai: number;
  expiry: string;
  harvest?: string;
  soChungNhan?: string;
  giaTien?: number;
  status: string;
}
export interface Order {
  id: string;
  batchId: string;
  product: string;
  quantity: number;
  agentName: string;
  date: string;
  tongGiaTri?: number;
  ghiChu?: string;
  status: "chua_nhan" | "da_nhan" | "hoan_thanh" | "da_huy" | "pending" | "accepted" | "shipped";
}
export interface KpiData { farms: number; batches: number; orders: number; alerts: number; }

// ─── Empty defaults ───────────────────────────────────────────────────────────
const EMPTY_USER: User = {
  id: "", fullName: "", username: "", email: "", phone: "", role: "Nông dân",
  province: "", district: "", address: "", farmName: "", farmArea: "",
  cropType: "", certification: "", createdAt: "",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const STATUS_MAP: Record<string, { label: string; color: string; bg: string }> = {
  pending:           { label: "Chờ xử lý",       color: "#b45309", bg: "#fef3c7" },
  preparing:         { label: "Chuẩn bị",         color: "#1d4ed8", bg: "#dbeafe" },
  shipped:           { label: "Đã xuất",           color: "#7c3aed", bg: "#ede9fe" },
  received:          { label: "Đã nhận",           color: "#059669", bg: "#d1fae5" },
  accepted:          { label: "Đã nhận đơn",       color: "#059669", bg: "#d1fae5" },
  active:            { label: "Đang lưu kho",      color: "#15803d", bg: "#dcfce7" },
  low:               { label: "Sắp hết",           color: "#dc2626", bg: "#fee2e2" },
  tai_trang_trai:    { label: "Tại trang trại",    color: "#15803d", bg: "#dcfce7" },
  da_xuat:           { label: "Đã xuất",           color: "#7c3aed", bg: "#ede9fe" },
  het_hang:          { label: "Hết hàng",          color: "#6b7280", bg: "#f3f4f6" },
  // Trạng thái đơn hàng từ API
  chua_nhan:         { label: "Chờ xác nhận",      color: "#b45309", bg: "#fef3c7" },
  da_nhan:           { label: "Đã xác nhận",       color: "#059669", bg: "#d1fae5" },
  hoan_thanh:        { label: "Hoàn thành",         color: "#15803d", bg: "#dcfce7" },
  da_huy:            { label: "Đã hủy",             color: "#6b7280", bg: "#f3f4f6" },
};

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_MAP[status] ?? { label: status, color: "#555", bg: "#f3f4f6" };
  return (
    <span className="badge" style={{ color: s.color, background: s.bg }}>
      {s.label}
    </span>
  );
}

function daysUntil(dateStr: string) {
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400000);
}

// ─── Shared UI Components ─────────────────────────────────────────────────────

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

function Td({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <td className={className}>{children}</td>;
}

function ActionBtn({ children, onClick, color = "var(--primary)", disabled }: { children: ReactNode; onClick: () => void; color?: string; disabled?: boolean }) {
  return (
    <button className="btn btn-action" onClick={onClick} disabled={disabled} style={{ background: disabled ? "#ccc" : color, marginRight: 5 }}>
      {children}
    </button>
  );
}

function PrimaryBtn({ children, onClick, className = "", disabled }: { children: ReactNode; onClick?: () => void; className?: string; disabled?: boolean }) {
  return <button className={`btn btn-primary ${className}`} disabled={disabled} onClick={onClick}>{children}</button>;
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

// ─── Sections ─────────────────────────────────────────────────────────────────
function Dashboard({ farms, batches, orders }: { farms: Farm[]; batches: Batch[]; orders: Order[] }) {
  const alerts = batches.filter(b => daysUntil(b.expiry) <= 14);
  const kpis: KpiData = { farms: farms.length, batches: batches.length, orders: orders.length, alerts: alerts.length };

  return (
    <div>
      <div className="stat-grid">
        <StatCard icon="🌿" label="Trang trại" value={kpis.farms} accent="#16a34a" />
        <StatCard icon="📦" label="Lô sản phẩm" value={kpis.batches} accent="#2563eb" />
        <StatCard icon="📋" label="Đơn hàng" value={kpis.orders} accent="#7c3aed" />
        <StatCard icon="⚠️" label="Cảnh báo hạn SD" value={kpis.alerts} accent="#dc2626" />
      </div>
      <Panel>
        <div className="panel-title">⚠️ Cảnh báo hạn sử dụng (≤ 14 ngày)</div>
        {alerts.length === 0 ? (
          <p className="empty-msg">Không có cảnh báo nào</p>
        ) : (
          <StyledTable headers={["Mã lô", "Sản phẩm", "Hạn dùng", "Còn lại"]}>
            {alerts.map(b => {
              const days = daysUntil(b.expiry);
              const daysClass = days <= 7 ? "u-text-danger u-font-bold" : "u-text-warning u-font-bold";
              return (
                <tr key={b.id}>
                  <Td><code className="u-text-sm u-text-primary u-font-bold">#{b.id}</code></Td>
                  <Td><b>{b.product}</b></Td><Td>{b.expiry}</Td>
                  <Td><span className={daysClass}>{days} ngày</span></Td>
                </tr>
              );
            })}
          </StyledTable>
        )}
      </Panel>
    </div>
  );
}

function FarmsSection({ farms, onNew, onEdit, onDelete }: { farms: Farm[]; onNew: () => void; onEdit: (f: Farm) => void; onDelete: (id: string) => void }) {
  const [search, setSearch] = useState("");

  const filtered = farms.filter(f => {
    const q = search.toLowerCase();
    return (
      f.name.toLowerCase().includes(q) ||
      f.address.toLowerCase().includes(q) ||
      (f.cert || "").toLowerCase().includes(q)
    );
  });

  return (
    <Panel>
      <div className="panel-title u-flex u-flex-wrap u-gap-4 u-items-center">
        <span>Quản lý trang trại</span>
        <PrimaryBtn onClick={onNew}>+ Thêm trang trại</PrimaryBtn>
      </div>
      <div className="u-flex u-flex-wrap u-gap-3 u-items-center u-mb-4">
        <input
          className="input"
          style={{ width: 260, flex: "none" }}
          placeholder="Tìm theo tên, địa chỉ, chứng nhận..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <span className="u-text-sm u-text-muted">{filtered.length} / {farms.length} trang trại</span>
      </div>
      {farms.length === 0 ? (
        <p className="empty-msg">Chưa có trang trại nào</p>
      ) : filtered.length === 0 ? (
        <p className="empty-msg">Không tìm thấy trang trại nào</p>
      ) : (
        <StyledTable headers={["ID", "Tên trang trại", "Địa chỉ", "Chứng nhận", "Hành động"]}>
          {filtered.map(f => (
            <tr key={f.id}>
              <Td><code className="u-text-sm u-text-primary u-font-bold">#{f.id}</code></Td>
              <Td><b>{f.name}</b></Td><Td>{f.address}</Td>
              <Td><span className="badge" style={{ background: "rgba(21, 128, 61, 0.1)", color: "#15803d" }}>{f.cert || "—"}</span></Td>
              <Td>
                <div className="u-flex u-gap-2">
                  <ActionBtn onClick={() => onEdit(f)} color="#2563eb">Sửa</ActionBtn>
                  <ActionBtn onClick={() => onDelete(f.id)} color="#dc2626">Xóa</ActionBtn>
                </div>
              </Td>
            </tr>
          ))}
        </StyledTable>
      )}
    </Panel>
  );
}

function BatchesSection({ batches, onNew, onEdit, onDelete }: { batches: Batch[]; onNew: () => void; onEdit: (b: Batch) => void; onDelete: (id: string) => void }) {
  const [search, setSearch] = useState("");
  const [farmFilter, setFarmFilter] = useState("all");

  const uniqueFarms = Array.from(new Map(batches.map(b => [b.farmId, b.farmName])).entries());

  const filtered = batches.filter(b => {
    const matchSearch = !search || b.product.toLowerCase().includes(search.toLowerCase());
    const matchFarm = farmFilter === "all" || b.farmId === farmFilter;
    return matchSearch && matchFarm;
  });

  return (
    <Panel>
      <div className="panel-title u-flex u-flex-wrap u-gap-4 u-items-center">
        <span>Quản lý lô sản phẩm</span>
        <PrimaryBtn onClick={onNew}>+ Đăng ký lô mới</PrimaryBtn>
      </div>
      <div className="u-flex u-flex-wrap u-gap-3 u-items-center u-mb-4">
        <input
          className="input"
          style={{ width: 240, flex: "none" }}
          placeholder="Tìm theo tên sản phẩm..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <select
          className="select"
          style={{ width: 200, flex: "none" }}
          value={farmFilter}
          onChange={e => setFarmFilter(e.target.value)}
        >
          <option value="all">Tất cả trang trại</option>
          {uniqueFarms.map(([id, name]) => (
            <option key={id} value={id}>{name}</option>
          ))}
        </select>
        <span className="u-text-sm u-text-muted">{filtered.length} / {batches.length} lô</span>
      </div>
      {batches.length === 0 ? (
        <p className="empty-msg">Chưa có lô sản phẩm nào</p>
      ) : filtered.length === 0 ? (
        <p className="empty-msg">Không tìm thấy lô sản phẩm nào</p>
      ) : (
        <StyledTable headers={["Mã lô", "Trang trại", "Sản phẩm", "Số lượng", "Giá/kg", "Thu hoạch", "Hạn dùng", "Chứng nhận", "Trạng thái", "Hành động"]}>
          {filtered.map(b => (
            <tr key={b.id}>
              <Td><code className="u-text-sm u-text-primary u-font-bold">#{b.id}</code></Td>
              <Td>{b.farmName}</Td>
              <Td><b>{b.product}</b></Td>
              <Td>{b.soLuongBanDau} kg</Td>
              <Td>{b.giaTien ? <span style={{ color: "#059669", fontWeight: 700 }}>{b.giaTien.toLocaleString("vi-VN")} đ</span> : <span className="u-text-muted">—</span>}</Td>
              <Td>{b.harvest || "—"}</Td>
              <Td>{b.expiry}</Td>
              <Td><span className="u-text-sm u-text-muted">{b.soChungNhan || "—"}</span></Td>
              <Td><StatusBadge status={b.status} /></Td>
              <Td>
                <div className="u-flex u-gap-2">
                  <ActionBtn onClick={() => onEdit(b)} color="#2563eb">Sửa</ActionBtn>
                  <ActionBtn onClick={() => onDelete(b.id)} color="#dc2626">Xóa</ActionBtn>
                </div>
              </Td>
            </tr>
          ))}
        </StyledTable>
      )}
    </Panel>
  );
}

function OrderDetailModal({ orderId, onClose }: { orderId: string; onClose: () => void }) {
  const [details, setDetails] = useState<{ MaLo: number; TenSanPham: string; SoLuong: number; DonGia: number; ThanhTien: number }[]>([]);
  const [loading, setLoading] = useState(true);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [orderInfo, setOrderInfo] = useState<any>(null);

  useEffect(() => {
    Promise.all([
      fetch(`/api/don-hang-dai-ly/get-by-id/${orderId}`).then(r => r.json()),
      fetch(`/api/don-hang-dai-ly/${orderId}/chi-tiet`).then(r => r.json()),
    ]).then(([o, d]) => {
      // get-by-id trả về array (join với chi tiết), lấy row đầu
      const first = Array.isArray(o) ? o[0] : o;
      setOrderInfo(first);
      setDetails(Array.isArray(d) ? d : []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [orderId]);

  const tongGiaTri = details.reduce((s, d) => s + (d.ThanhTien || d.SoLuong * d.DonGia || 0), 0);

  return (
    <Modal title={`Chi tiết đơn hàng #${orderId}`} onClose={onClose}>
      {loading ? (
        <p className="empty-msg">Đang tải...</p>
      ) : (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 18, padding: "12px 14px", background: "#f8fafc", borderRadius: 10 }}>
            <div><span className="u-text-sm u-text-muted">Đại lý</span><div className="u-font-bold u-text-dark">{orderInfo?.TenDaiLy || "—"}</div></div>
            <div><span className="u-text-sm u-text-muted">Ngày đặt</span><div className="u-font-bold u-text-dark">{orderInfo?.NgayDat?.slice(0,10) || "—"}</div></div>
            <div><span className="u-text-sm u-text-muted">Trạng thái</span><div style={{ marginTop: 4 }}><StatusBadge status={orderInfo?.TrangThai || ""} /></div></div>
            <div><span className="u-text-sm u-text-muted">Ghi chú</span><div className="u-font-bold u-text-dark">{orderInfo?.GhiChu || "—"}</div></div>
          </div>
          <StyledTable headers={["Sản phẩm", "Số lượng", "Đơn giá", "Thành tiền"]}>
            {details.length === 0
              ? <tr><td colSpan={4} className="empty-msg">Không có chi tiết</td></tr>
              : details.map((d, i) => (
                <tr key={i}>
                  <Td><b>{d.TenSanPham}</b></Td>
                  <Td>{d.SoLuong?.toLocaleString("vi-VN")} kg</Td>
                  <Td>{d.DonGia?.toLocaleString("vi-VN")} đ</Td>
                  <Td><b style={{ color: "#4f46e5" }}>{(d.ThanhTien || d.SoLuong * d.DonGia)?.toLocaleString("vi-VN")} đ</b></Td>
                </tr>
              ))
            }
          </StyledTable>
          {details.length > 0 && (
            <div style={{ marginTop: 12, padding: "10px 14px", background: "#eef2ff", borderRadius: 8, display: "flex", justifyContent: "space-between" }}>
              <span className="u-font-bold u-text-dark">Tổng giá trị</span>
              <span style={{ fontWeight: 800, fontSize: 16, color: "#4f46e5" }}>{tongGiaTri.toLocaleString("vi-VN")} đ</span>
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

function OrdersSection({ orders, onAccept, onShip, onCancel }: { orders: Order[]; onAccept: (id: string) => void; onShip: (id: string) => void; onCancel: (id: string) => void }) {
  const [detailId, setDetailId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [agentFilter, setAgentFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const uniqueAgents = Array.from(new Set(orders.map(o => o.agentName).filter(Boolean)));

  const filtered = orders.filter(o => {
    const matchSearch = !search || o.id.includes(search);
    const matchAgent = agentFilter === "all" || o.agentName === agentFilter;
    const matchFrom = !dateFrom || o.date >= dateFrom;
    const matchTo = !dateTo || o.date <= dateTo;
    return matchSearch && matchAgent && matchFrom && matchTo;
  });

  return (
    <Panel>
      <div className="panel-title">Đơn hàng từ Đại lý</div>
      <div className="u-flex u-flex-wrap u-gap-3 u-items-center u-mb-4">
        <input
          className="input"
          style={{ width: 160, flex: "none" }}
          placeholder="Tìm mã đơn..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <select
          className="select"
          style={{ width: 180, flex: "none" }}
          value={agentFilter}
          onChange={e => setAgentFilter(e.target.value)}
        >
          <option value="all">Tất cả đại lý</option>
          {uniqueAgents.map(a => <option key={a} value={a}>{a}</option>)}
        </select>
        <input
          className="input"
          type="date"
          style={{ width: 150, flex: "none" }}
          value={dateFrom}
          onChange={e => setDateFrom(e.target.value)}
          title="Từ ngày"
        />
        <input
          className="input"
          type="date"
          style={{ width: 150, flex: "none" }}
          value={dateTo}
          onChange={e => setDateTo(e.target.value)}
          title="Đến ngày"
        />
        <span className="u-text-sm u-text-muted">{filtered.length} / {orders.length} đơn</span>
      </div>
      {orders.length === 0 ? (
        <p className="empty-msg">Chưa có đơn hàng nào</p>
      ) : filtered.length === 0 ? (
        <p className="empty-msg">Không tìm thấy đơn hàng nào</p>
      ) : (
        <StyledTable headers={["Mã đơn", "Đại lý", "Số lượng", "Ngày đặt", "Trạng thái", "Hành động"]}>
          {filtered.map(o => (
            <tr key={o.id}>
              <Td><code className="u-text-sm u-text-primary u-font-bold">#{o.id}</code></Td>
              <Td><b>{o.agentName || "—"}</b></Td>
              <Td>{o.quantity > 0 ? `${o.quantity} kg` : "—"}</Td>
              <Td className="u-text-muted u-text-sm">{o.date}</Td>
              <Td><StatusBadge status={o.status} /></Td>
              <Td>
                <div className="u-flex u-gap-2">
                  <ActionBtn onClick={() => setDetailId(o.id)} color="#6366f1">Xem</ActionBtn>
                  {o.status === "chua_nhan" && (
                    <>
                      <ActionBtn onClick={() => onAccept(o.id)} color="#059669">✓ Xác nhận</ActionBtn>
                      <ActionBtn onClick={() => { if (window.confirm("Hủy đơn hàng này?")) onCancel(o.id); }} color="#dc2626">✕ Hủy</ActionBtn>
                    </>
                  )}
                  {o.status === "da_nhan" && (
                    <ActionBtn onClick={() => onShip(o.id)} color="#7c3aed">📦 Xuất hàng</ActionBtn>
                  )}
                </div>
              </Td>
            </tr>
          ))}
        </StyledTable>
      )}
      {detailId && <OrderDetailModal orderId={detailId} onClose={() => setDetailId(null)} />}
    </Panel>
  );
}


function KhoDetailModal({ batch, onClose, onEdit, onDelete }: { batch: Batch; onClose: () => void; onEdit: (b: Batch) => void; onDelete: (id: string) => void }) {
  const days = daysUntil(batch.expiry);
  const pctUsed = batch.soLuongBanDau > 0 ? ((batch.soLuongBanDau - batch.soLuongHienTai) / batch.soLuongBanDau) * 100 : 0;
  const pctRemain = 100 - pctUsed;
  return (
    <Modal title={`Chi tiết sản phẩm kho #${batch.id}`} onClose={onClose} wide>
      {/* Header card */}
      <div style={{ display: "flex", alignItems: "center", gap: 16, padding: "16px 18px", background: "linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 50%, #f0f9ff 100%)", borderRadius: 12, marginBottom: 20 }}>
        <div style={{ width: 56, height: 56, borderRadius: 14, background: "linear-gradient(135deg, #16a34a, #059669)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28 }}>📦</div>
        <div style={{ flex: 1 }}>
          <div className="u-font-black u-text-lg u-text-dark">{batch.product}</div>
          <div className="u-text-sm u-text-muted">Trang trại: {batch.farmName}</div>
        </div>
        <StatusBadge status={batch.status} />
      </div>

      {/* Stats row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 20 }}>
        <div style={{ padding: "14px 16px", background: "#f0f9ff", borderRadius: 10, textAlign: "center" }}>
          <div className="u-text-sm u-text-muted">SL ban đầu</div>
          <div className="u-font-black u-text-lg" style={{ color: "#2563eb" }}>{batch.soLuongBanDau.toLocaleString("vi-VN")} kg</div>
        </div>
        <div style={{ padding: "14px 16px", background: "#f0fdf4", borderRadius: 10, textAlign: "center" }}>
          <div className="u-text-sm u-text-muted">SL hiện tại</div>
          <div className="u-font-black u-text-lg" style={{ color: "#16a34a" }}>{batch.soLuongHienTai.toLocaleString("vi-VN")} kg</div>
        </div>
        <div style={{ padding: "14px 16px", background: batch.giaTien ? "#fefce8" : "#f8fafc", borderRadius: 10, textAlign: "center" }}>
          <div className="u-text-sm u-text-muted">Giá / kg</div>
          <div className="u-font-black u-text-lg" style={{ color: batch.giaTien ? "#d97706" : "#94a3b8" }}>{batch.giaTien ? `${batch.giaTien.toLocaleString("vi-VN")} đ` : "—"}</div>
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ marginBottom: 20 }}>
        <div className="u-flex u-justify-between u-mb-2">
          <span className="u-text-sm u-text-muted">Tồn kho</span>
          <span className="u-text-sm u-font-bold" style={{ color: pctRemain < 20 ? "#dc2626" : "#16a34a" }}>{pctRemain.toFixed(0)}%</span>
        </div>
        <div style={{ height: 8, background: "#f1f5f9", borderRadius: 4, overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${pctRemain}%`, background: pctRemain < 20 ? "linear-gradient(90deg,#ef4444,#dc2626)" : "linear-gradient(90deg,#22c55e,#16a34a)", borderRadius: 4, transition: "width .3s" }} />
        </div>
      </div>

      {/* Detail fields */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 24px" }}>
        {[
          ["Mã lô", `#${batch.id}`],
          ["Mã sản phẩm", batch.maSanPham ? `#${batch.maSanPham}` : "—"],
          ["Ngày thu hoạch", batch.harvest || "—"],
          ["Hạn sử dụng", batch.expiry || "—"],
          ["Chứng nhận lô", batch.soChungNhan || "—"],
          ["Còn lại", days > 0 ? `${days} ngày` : "Đã hết hạn"],
        ].map(([k, v]) => (
          <div key={k} style={{ padding: "12px 0", borderBottom: "1px solid #f1f5f9" }}>
            <div className="u-text-sm u-text-muted">{k}</div>
            <div className="u-font-bold u-text-dark" style={{ marginTop: 3 }}>{v}</div>
          </div>
        ))}
      </div>

      {/* Total value */}
      {batch.giaTien && batch.soLuongHienTai > 0 && (
        <div style={{ marginTop: 16, padding: "12px 16px", background: "#eef2ff", borderRadius: 10, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span className="u-font-bold u-text-dark">Giá trị tồn kho</span>
          <span style={{ fontWeight: 800, fontSize: 17, color: "#4f46e5" }}>{(batch.giaTien * batch.soLuongHienTai).toLocaleString("vi-VN")} đ</span>
        </div>
      )}

      {/* Action buttons */}
      <div className="u-flex u-justify-end u-gap-3 u-mt-6 u-py-4 u-border-t">
        <button className="btn btn-secondary" onClick={onClose}>Đóng</button>
        <ActionBtn onClick={() => { onClose(); onEdit(batch); }} color="#2563eb">Sửa</ActionBtn>
        <ActionBtn onClick={() => { if (window.confirm(`Xóa lô sản phẩm "${batch.product}" khỏi kho?`)) { onClose(); onDelete(batch.id); } }} color="#dc2626">Xóa</ActionBtn>
      </div>
    </Modal>
  );
}

function KhoSection({ batches, orders, onEdit, onDelete }: { batches: Batch[]; orders: Order[]; onEdit: (b: Batch) => void; onDelete: (id: string) => void }) {
  const exported = orders.filter(o => o.status === "hoan_thanh");
  const [detailBatch, setDetailBatch] = useState<Batch | null>(null);
  const [detailOrderId, setDetailOrderId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [farmFilter, setFarmFilter] = useState("all");
  const [exportSearch, setExportSearch] = useState("");
  const [exportAgentFilter, setExportAgentFilter] = useState("all");

  const uniqueFarms = Array.from(new Map(batches.map(b => [b.farmId, b.farmName])).entries());
  const uniqueAgents = Array.from(new Set(exported.map(o => o.agentName).filter(Boolean)));

  const filteredExported = exported.filter(o => {
    const matchSearch = !exportSearch || o.id.includes(exportSearch) || o.agentName?.toLowerCase().includes(exportSearch.toLowerCase());
    const matchAgent = exportAgentFilter === "all" || o.agentName === exportAgentFilter;
    return matchSearch && matchAgent;
  });

  const filtered = batches.filter(b => {
    const matchStatus = filterStatus === "all" || b.status === filterStatus;
    const matchSearch = !search || b.product.toLowerCase().includes(search.toLowerCase());
    const matchFarm = farmFilter === "all" || b.farmId === farmFilter;
    return matchStatus && matchSearch && matchFarm;
  });

  const tongSL = batches.reduce((s, b) => s + b.soLuongHienTai, 0);
  const tongGiaTri = batches.reduce((s, b) => s + (b.giaTien ? b.giaTien * b.soLuongHienTai : 0), 0);
  const sapHet = batches.filter(b => daysUntil(b.expiry) <= 14).length;

  return (
    <div>
      {/* Stat cards */}
      <div className="stat-grid" style={{ marginBottom: 20 }}>
        <StatCard icon="📦" label="Tổng lô trong kho" value={batches.length} accent="#2563eb" />
        <StatCard icon="⚖️" label="Tổng tồn kho" value={`${tongSL.toLocaleString("vi-VN")} kg`} accent="#16a34a" />
        <StatCard icon="💰" label="Giá trị tồn kho" value={`${tongGiaTri.toLocaleString("vi-VN")} đ`} accent="#7c3aed" />
        <StatCard icon="⚠️" label="Sắp hết hạn" value={sapHet} accent="#dc2626" />
      </div>

      <div className="u-grid u-grid-2-col u-gap-6">
        <Panel style={{ gridColumn: "1 / -1" }}>
          <div className="panel-title u-flex u-flex-wrap u-gap-4 u-items-center u-mb-2">
            <span>📥 Tồn kho</span>
          </div>
          <div className="u-flex u-flex-wrap u-gap-3 u-items-center u-mb-4">
            <input
              className="input"
              style={{ width: 220, flex: "none" }}
              placeholder="Tìm theo tên sản phẩm..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            <select className="select" style={{ width: 180, flex: "none" }} value={farmFilter} onChange={e => setFarmFilter(e.target.value)}>
              <option value="all">Tất cả trang trại</option>
              {uniqueFarms.map(([id, name]) => <option key={id} value={id}>{name}</option>)}
            </select>
            <select className="select" style={{ width: 170, flex: "none" }} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
              <option value="all">Tất cả trạng thái</option>
              <option value="tai_trang_trai">Tại trang trại</option>
              <option value="da_xuat">Đã xuất</option>
              <option value="het_hang">Hết hàng</option>
            </select>
            <span className="u-text-sm u-text-muted">{filtered.length} / {batches.length} lô</span>
          </div>
          {filtered.length === 0 ? (
            <p className="empty-msg">Không có lô sản phẩm nào{filterStatus !== "all" ? " với trạng thái này" : ""}</p>
          ) : (
            <StyledTable headers={["Mã lô", "Sản phẩm", "Trang trại", "SL hiện tại", "Giá/kg", "Hạn dùng", "Trạng thái", "Hành động"]}>
              {filtered.map(b => {
                const days = daysUntil(b.expiry);
                const expiryClass = days <= 7 ? "u-text-danger u-font-bold" : days <= 14 ? "u-text-warning u-font-bold" : "";
                return (
                  <tr key={b.id}>
                    <Td><code className="u-text-sm u-text-primary u-font-bold">#{b.id}</code></Td>
                    <Td><b>{b.product}</b></Td>
                    <Td>{b.farmName}</Td>
                    <Td>
                      <div className="u-flex u-items-center u-gap-2">
                        <div style={{ flex: 1, minWidth: 40, height: 5, background: "#f0f4ff", borderRadius: 3, overflow: "hidden" }}>
                          <div style={{ height: "100%", width: `${b.soLuongBanDau ? (b.soLuongHienTai / b.soLuongBanDau) * 100 : 0}%`, background: b.soLuongHienTai / b.soLuongBanDau < 0.2 ? "#ef4444" : "#22c55e", borderRadius: 3 }} />
                        </div>
                        <span className="u-text-sm u-font-bold">{b.soLuongHienTai.toLocaleString("vi-VN")} kg</span>
                      </div>
                    </Td>
                    <Td>{b.giaTien ? <span style={{ color: "#059669", fontWeight: 700 }}>{b.giaTien.toLocaleString("vi-VN")} đ</span> : <span className="u-text-muted">—</span>}</Td>
                    <Td><span className={expiryClass}>{b.expiry}{days <= 14 && days > 0 ? ` (${days}d)` : days <= 0 ? " (!)" : ""}</span></Td>
                    <Td><StatusBadge status={b.status} /></Td>
                    <Td>
                      <div className="u-flex u-gap-2">
                        <ActionBtn onClick={() => setDetailBatch(b)} color="#6366f1">Xem</ActionBtn>
                        <ActionBtn onClick={() => onEdit(b)} color="#2563eb">Sửa</ActionBtn>
                        <ActionBtn onClick={() => { if (window.confirm(`Xóa lô "${b.product}" (${b.soLuongHienTai} kg)?`)) onDelete(b.id); }} color="#dc2626">Xóa</ActionBtn>
                      </div>
                    </Td>
                  </tr>
                );
              })}
            </StyledTable>
          )}
        </Panel>

        <Panel style={{ gridColumn: "1 / -1" }}>
          <div className="panel-title u-mb-2">📤 Lịch sử xuất hàng</div>
          <div className="u-flex u-flex-wrap u-gap-3 u-items-center u-mb-4">
            <input
              className="input"
              style={{ width: 200, flex: "none" }}
              placeholder="Tìm mã đơn, đại lý..."
              value={exportSearch}
              onChange={e => setExportSearch(e.target.value)}
            />
            <select
              className="select"
              style={{ width: 180, flex: "none" }}
              value={exportAgentFilter}
              onChange={e => setExportAgentFilter(e.target.value)}
            >
              <option value="all">Tất cả đại lý</option>
              {uniqueAgents.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
            <span className="u-text-sm u-text-muted">{filteredExported.length} / {exported.length} đơn</span>
          </div>
          <StyledTable headers={["Mã đơn", "Mã lô", "Số lượng", "Đại lý", "Ngày", ""]}>
            {exported.length === 0
              ? <tr><td colSpan={6} className="empty-msg">Chưa có lịch sử xuất hàng</td></tr>
              : filteredExported.length === 0
              ? <tr><td colSpan={6} className="empty-msg">Không tìm thấy kết quả</td></tr>
              : filteredExported.map(o => (
                <tr key={o.id}>
                  <Td><code className="u-text-sm u-text-primary u-font-bold">#{o.id}</code></Td>
                  <Td>{o.batchId}</Td>
                  <Td>{o.quantity} kg</Td>
                  <Td>{o.agentName}</Td>
                  <Td>{o.date}</Td>
                  <Td><ActionBtn onClick={() => setDetailOrderId(o.id)} color="#6366f1">Xem</ActionBtn></Td>
                </tr>
              ))}
          </StyledTable>
        </Panel>
      </div>
      {detailBatch && <KhoDetailModal batch={detailBatch} onClose={() => setDetailBatch(null)} onEdit={onEdit} onDelete={onDelete} />}
      {detailOrderId && <OrderDetailModal orderId={detailOrderId} onClose={() => setDetailOrderId(null)} />}
    </div>
  );
}

function ReportsSection({ farms, batches, orders }: { farms: Farm[]; batches: Batch[]; orders: Order[] }) {
  const tongLo = batches.length;
  const tongSL = batches.reduce((s, b) => s + b.soLuongBanDau, 0);
  const tongDon = orders.length;
  const daNhan = orders.filter(o => o.status === "da_nhan" || o.status === "accepted").length;
  const hoanThanh = orders.filter(o => o.status === "hoan_thanh" || o.status === "shipped").length;
  const daHuy = orders.filter(o => o.status === "da_huy").length;
  const shipped = orders.filter(o => o.status === "hoan_thanh" || o.status === "shipped").reduce((s, o) => s + o.quantity, 0);
  const tongGiaTri = orders.filter(o => o.tongGiaTri).reduce((s, o) => s + (o.tongGiaTri || 0), 0);
  const canhBao = batches.filter(b => daysUntil(b.expiry) <= 14).length;

  // Thống kê theo trang trại
  const farmStats = farms.map(f => {
    const farmBatches = batches.filter(b => b.farmId === f.id);
    const farmOrders = orders.filter(o => farmBatches.some(b => b.id === o.batchId));
    const slBanDau = farmBatches.reduce((s, b) => s + b.soLuongBanDau, 0);
    const slHienTai = farmBatches.reduce((s, b) => s + b.soLuongHienTai, 0);
    return { name: f.name, loSP: farmBatches.length, slBanDau, slHienTai, donHang: farmOrders.length, cert: f.cert || "—" };
  });

  return (
    <div className="u-fade-in">
      <div className="stat-grid">
        {[
          { icon: "🌿", label: "Trang trại",        value: farms.length,                             color: "#16a34a" },
          { icon: "📦", label: "Tổng lô sản phẩm",  value: `${tongLo} lô`,                          color: "#2563eb" },
          { icon: "📊", label: "Tổng sản lượng",     value: `${tongSL.toLocaleString("vi-VN")} kg`,  color: "#7c3aed" },
          { icon: "📋", label: "Tổng đơn hàng",      value: `${tongDon} đơn`,                        color: "#d97706" },
          { icon: "🚚", label: "Đã xuất hàng",       value: `${shipped.toLocaleString("vi-VN")} kg`, color: "#059669" },
          { icon: "💰", label: "Tổng giá trị",       value: `${tongGiaTri.toLocaleString("vi-VN")} đ`, color: "#0891b2" },
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
        <div className="panel-title">Thống kê theo trang trại</div>
        <StyledTable headers={["Trang trại", "Số lô", "Sản lượng (kg)", "Tồn kho (kg)", "Đơn hàng", "Chứng nhận"]}>
          {farmStats.map(f => (
            <tr key={f.name}>
              <Td><b>{f.name}</b></Td>
              <Td>{f.loSP}</Td>
              <Td>{f.slBanDau.toLocaleString("vi-VN")}</Td>
              <Td>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ flex: 1, height: 6, background: "#f0f4ff", borderRadius: 3, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${f.slBanDau ? (f.slHienTai / f.slBanDau) * 100 : 0}%`, background: "var(--primary)", borderRadius: 3 }} />
                  </div>
                  <span className="u-text-sm u-text-muted" style={{ whiteSpace: "nowrap" }}>{f.slHienTai.toLocaleString("vi-VN")}</span>
                </div>
              </Td>
              <Td>{f.donHang}</Td>
              <Td><span className="badge" style={{ background: "rgba(21,128,61,0.1)", color: "#15803d" }}>{f.cert}</span></Td>
            </tr>
          ))}
          {farmStats.length === 0 && (
            <tr><td colSpan={6} className="empty-msg">Chưa có dữ liệu</td></tr>
          )}
        </StyledTable>
      </Panel>

      <Panel>
        <div className="panel-title">Tổng hợp đơn hàng</div>
        <div className="u-flex u-gap-5 u-mb-4" style={{ flexWrap: "wrap" }}>
          {[
            { label: "Đã nhận", value: daNhan, color: "#059669" },
            { label: "Hoàn thành", value: hoanThanh, color: "#15803d" },
            { label: "Đã hủy", value: daHuy, color: "#dc2626" },
            { label: "Cảnh báo HSD", value: canhBao, color: "#d97706" },
          ].map(s => (
            <div key={s.label} className="u-flex u-items-center u-gap-2">
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: s.color }} />
              <span className="u-text-sm u-text-muted">{s.label}:</span>
              <span className="u-font-bold" style={{ color: s.color }}>{s.value}</span>
            </div>
          ))}
        </div>
        <StyledTable headers={["Mã đơn", "Sản phẩm", "Số lượng", "Giá trị", "Đại lý", "Ngày", "Trạng thái"]}>
          {orders.map(o => (
            <tr key={o.id}>
              <Td><code className="u-text-sm u-text-primary u-font-bold">#{o.id}</code></Td>
              <Td><b>{o.product}</b></Td>
              <Td>{o.quantity.toLocaleString("vi-VN")} kg</Td>
              <Td className="u-text-primary u-font-bold">{o.tongGiaTri ? o.tongGiaTri.toLocaleString("vi-VN") + " đ" : "—"}</Td>
              <Td>{o.agentName || "—"}</Td>
              <Td className="u-text-muted u-text-sm">{o.date ? new Date(o.date).toLocaleDateString("vi-VN") : "—"}</Td>
              <Td><StatusBadge status={o.status} /></Td>
            </tr>
          ))}
        </StyledTable>
        {orders.length === 0 && <p className="empty-msg">Chưa có dữ liệu</p>}
      </Panel>
    </div>
  );
}

// ─── Modals ───────────────────────────────────────────────────────────────────
function UserProfileModal({ user, onClose, onEdit }: { user: User; onClose: () => void; onEdit: () => void }) {
  const fields: [string, string][] = [
    ["Họ tên", user.fullName],
    ["Tên đăng nhập", user.username],
    ["Vai trò", user.role],
    ["Email", user.email],
    ["Số điện thoại", user.phone],
    ["Địa chỉ", user.address],
  ];
  return (
    <Modal title="Thông tin tài khoản" onClose={onClose}>
      <div className="u-flex u-flex-col u-gap-4">
        <div className="u-flex u-items-center u-gap-5 u-p-6 u-rounded-lg u-border" style={{ background: "linear-gradient(135deg, #f8fafc 0%, #f0fdf4 100%)" }}>
          <div className="avatar" style={{ width: 64, height: 64, fontSize: 24 }}>
            {user.fullName?.charAt(0).toUpperCase() || "N"}
          </div>
          <div>
            <div className="u-font-black u-text-lg u-text-dark">{user.fullName}</div>
            <div className="u-text-sm u-text-primary u-font-bold" style={{ textTransform: "uppercase", letterSpacing: 1 }}>{user.farmName || "Nông dân"}</div>
          </div>
        </div>
        <div className="u-px-2">
          {fields.map(([k, v]) => (
            <div key={k} className="u-flex u-justify-between u-py-6 u-border-b" style={{ padding: "14px 0" }}>
              <span className="u-text-sm u-text-muted u-font-medium">{k}</span>
              <span className="u-text-sm u-font-bold u-text-dark">{v || "—"}</span>
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

function EditProfileModal({ user, onClose, onSaved }: { user: User; onClose: () => void; onSaved: (updated: Partial<User>) => void }) {
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
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal title="Sửa thông tin cá nhân" onClose={onClose}>
      {err && <div className="error-msg">{err}</div>}
      <FormField label="Họ tên *"><input className="input" value={hoTen} onChange={e => setHoTen(e.target.value)} /></FormField>
      <FormField label="Số điện thoại"><input className="input" value={sdt} onChange={e => setSdt(e.target.value)} /></FormField>
      <FormField label="Email"><input className="input" type="email" value={email} onChange={e => setEmail(e.target.value)} /></FormField>
      <FormField label="Địa chỉ"><input className="input" value={diaChi} onChange={e => setDiaChi(e.target.value)} /></FormField>
      <div className="u-flex u-justify-end u-gap-3 u-mt-6 u-py-6 u-border-t">
        <button className="btn btn-secondary" onClick={onClose}>Hủy</button>
        <PrimaryBtn onClick={handleSave} disabled={loading}>{loading ? "Đang lưu..." : "Lưu thay đổi"}</PrimaryBtn>
      </div>
    </Modal>
  );
}

function FarmModal({ farm, onClose, onSave }: { farm: Farm | null; onClose: () => void; onSave: (d: Partial<Farm>) => void }) {
  const [name, setName] = useState(farm?.name || "");
  const [address, setAddress] = useState(farm?.address || "");
  const [cert, setCert] = useState(farm?.cert || "");
  return (
    <Modal title={farm ? "Chỉnh sửa trang trại" : "Thêm trang trại mới"} onClose={onClose}>
      <FormField label="Tên trang trại *"><input className="input" value={name} onChange={e => setName(e.target.value)} placeholder="VD: Trang trại Hòa Bình" /></FormField>
      <FormField label="Địa chỉ *"><input className="input" value={address} onChange={e => setAddress(e.target.value)} placeholder="VD: Xã Bình Minh, Cao Phong" /></FormField>
      <FormField label="Chứng nhận">
        <select className="select" value={cert} onChange={e => setCert(e.target.value)}>
          <option value="">— Chọn chứng nhận —</option>
          <option value="VietGAP">VietGAP</option>
          <option value="GlobalGAP">GlobalGAP</option>
          <option value="Organic">Organic</option>
        </select>
      </FormField>
      <div className="u-flex u-justify-end u-gap-3 u-mt-6 u-py-6 u-border-t">
        <button className="btn btn-secondary" onClick={onClose}>Hủy</button>
        <PrimaryBtn onClick={() => { if (!name || !address) return alert("Vui lòng nhập đầy đủ"); onSave({ name, address, cert }); }}>Lưu</PrimaryBtn>
      </div>
    </Modal>
  );
}

function BatchModal({ batch, farms, onClose, onSave }: { batch: Batch | null; farms: Farm[]; onClose: () => void; onSave: (d: Partial<Batch>) => void }) {
  const isEdit = !!batch;
  const [farmId, setFarmId] = useState(batch?.farmId || farms[0]?.id || "");
  const [sanPhams, setSanPhams] = useState<{MaSanPham: number; TenSanPham: string}[]>([]);
  const [maSanPham, setMaSanPham] = useState(batch?.maSanPham || 0);
  const [customProduct, setCustomProduct] = useState(batch?.product || "");
  const [soLuong, setSoLuong] = useState(String(batch?.soLuongBanDau || ""));
  const [expiry, setExpiry] = useState(batch?.expiry || "");
  const [harvest, setHarvest] = useState(batch?.harvest || "");
  const [soChungNhan, setSoChungNhan] = useState(batch?.soChungNhan || "");
  const [giaTien, setGiaTien] = useState(String(batch?.giaTien || ""));
  const [trangThai, setTrangThai] = useState(batch?.status || "tai_trang_trai");

  useEffect(() => {
    if (isEdit) return;
    fetch("/api/san-pham/get-all")
      .then(r => r.json())
      .then(data => {
        const list = Array.isArray(data) ? data : [];
        setSanPhams(list);
        if (!maSanPham && list.length > 0) setMaSanPham(list[0].MaSanPham);
      })
      .catch(() => {});
  }, [isEdit, maSanPham]);

  return (
    <Modal title={isEdit ? "Chỉnh sửa lô sản phẩm" : "Đăng ký lô sản phẩm mới"} onClose={onClose}>
      {!isEdit ? (
        <>
          <FormField label="Trang trại *">
            <select className="select" value={farmId} onChange={e => setFarmId(e.target.value)}>
              {farms.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
            </select>
          </FormField>

          <FormField label="Sản phẩm *">
            <input
              className="input"
              list="sanpham-list"
              value={customProduct}
              onChange={e => {
                setCustomProduct(e.target.value);
                const match = sanPhams.find(s => s.TenSanPham === e.target.value);
                setMaSanPham(match ? match.MaSanPham : 0);
              }}
              placeholder="Chọn hoặc nhập tên sản phẩm..."
            />
            <datalist id="sanpham-list">
              {sanPhams.map(s => <option key={s.MaSanPham} value={s.TenSanPham} />)}
            </datalist>
          </FormField>

          <FormField label="Sản lượng ban đầu *">
            <input className="input" type="number" min="0.01" step="0.01" value={soLuong} onChange={e => setSoLuong(e.target.value)} placeholder="VD: 500" />
          </FormField>
          <FormField label="Ngày thu hoạch"><input className="input" type="date" value={harvest} onChange={e => setHarvest(e.target.value)} /></FormField>
          <FormField label="Hạn sử dụng *"><input className="input" type="date" value={expiry} onChange={e => setExpiry(e.target.value)} /></FormField>
          <FormField label="Số chứng nhận lô"><input className="input" value={soChungNhan} onChange={e => setSoChungNhan(e.target.value)} placeholder="VD: VG-2024-001" /></FormField>
          <FormField label="Giá tiền / kg (đ)">
            <input className="input" type="number" min="0" step="1000" value={giaTien} onChange={e => setGiaTien(e.target.value)} placeholder="VD: 25000" />
          </FormField>
        </>
      ) : (
        <>
          <div className="u-bg-light u-border u-rounded-md u-mb-5 u-text-sm u-text-muted" style={{ padding: "12px 16px" }}>
            <div className="u-font-black u-text-dark u-mb-1">{batch.product}</div>
            Trang trại: {batch.farmName}<br />
            Sản lượng ban đầu: {batch.soLuongBanDau} kg | Hiện tại: {batch.soLuongHienTai} kg
          </div>
          <FormField label="Hạn sử dụng"><input className="input" type="date" value={expiry} onChange={e => setExpiry(e.target.value)} /></FormField>
          <FormField label="Giá tiền / kg (đ)">
            <input className="input" type="number" min="0" step="1000" value={giaTien} onChange={e => setGiaTien(e.target.value)} placeholder="VD: 25000" />
          </FormField>
          <FormField label="Trạng thái">
            <select className="select" value={trangThai} onChange={e => setTrangThai(e.target.value)}>
              <option value="tai_trang_trai">Tại trang trại</option>
              <option value="da_xuat">Đã xuất</option>
              <option value="het_hang">Hết hàng</option>
            </select>
          </FormField>
        </>
      )}
      <div className="u-flex u-justify-end u-gap-3 u-mt-6 u-py-6 u-border-t">
        <button className="btn btn-secondary" onClick={onClose}>Hủy</button>
        <PrimaryBtn onClick={() => {
          if (!isEdit) {
            if (!farmId || !customProduct.trim() || !soLuong || !expiry) return alert("Vui lòng điền đủ thông tin bắt buộc");
            onSave({ farmId, farmName: farms.find(f => f.id === farmId)?.name || "", maSanPham, product: customProduct.trim(), soLuongBanDau: Number(soLuong), soLuongHienTai: Number(soLuong), expiry, harvest, soChungNhan, giaTien: giaTien !== "" ? Number(giaTien) : undefined });
          } else {
            onSave({ expiry, status: trangThai, giaTien: giaTien !== "" ? Number(giaTien) : undefined });
          }
        }}>Lưu</PrimaryBtn>
      </div>
    </Modal>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────
type Section = "dashboard" | "farms" | "batches" | "orders" | "kho" | "reports";
const NAV: { id: Section; label: string; icon: string }[] = [
  { id: "dashboard", label: "Bảng điều khiển",    icon: "🏠" },
  { id: "farms",     label: "Quản lý trang trại",  icon: "🌿" },
  { id: "batches",   label: "Quản lý lô sản phẩm", icon: "📦" },
  { id: "orders",    label: "Quản lý đơn hàng",    icon: "📋" },
  { id: "kho",       label: "Quản lý kho",          icon: "🏪" },
  { id: "reports",   label: "Báo cáo thống kê",     icon: "📊" },
];
const PAGE_TITLES: Record<Section, string> = {
  dashboard: "Bảng điều khiển", farms: "Quản lý trang trại",
  batches: "Quản lý lô sản phẩm", orders: "Đơn hàng từ Đại lý",
  kho: "Quản lý kho", reports: "Báo cáo thống kê",
};

export default function NongDanApp() {
  const [section, setSection] = useState<Section>("dashboard");
  const [farms, setFarms] = useState<Farm[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [showProfile, setShowProfile] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [modal, setModal] = useState<null | "new-farm" | "new-batch" | "edit-farm" | "edit-batch">(null);
  const [editTarget, setEditTarget] = useState<Farm | Batch | null>(null);

  const authUser = getCurrentUser();
  const maNongDan = authUser?.maDoiTuong;

  useEffect(() => {
    if (!authUser || authUser.role !== "nongdan") {
      window.location.href = "/login";
    }
  }, [authUser]);

  const [userInfo, setUserInfo] = useState<Partial<User>>({
    fullName: authUser?.tenHienThi || "",
    username: authUser?.username || "",
    email: authUser?.email || "",
    phone: authUser?.soDienThoai || "",
    address: authUser?.diaChi || "",
  });

  const user: User = { ...EMPTY_USER, ...userInfo } as User;

  // Load trang trại từ API
  useEffect(() => {
    if (!maNongDan) return;
    fetch(`/api/trang-trai/get-by-nong-dan/${maNongDan}`)
      .then(r => r.json())
      .then((data: Array<{MaTrangTrai: number; TenTrangTrai: string; DiaChi: string; SoChungNhan: string}>) => {
        setFarms(data.map(t => ({
          id: String(t.MaTrangTrai),
          name: t.TenTrangTrai,
          address: t.DiaChi || "",
          cert: t.SoChungNhan || "",
        })));
      })
      .catch(() => {});
  }, [maNongDan]);

  async function handleDeleteFarm(id: string) {
    if (!window.confirm("Xóa trang trại này?")) return;
    try {
      const res = await fetch(`/api/trang-trai/delete/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message);
      if (json.deleted) {
        setFarms(f => f.filter(x => x.id !== id));
      } else {
        setFarms(f => f.filter(x => x.id !== id));
        alert(json.message);
      }
    } catch (e: unknown) { alert(e instanceof Error ? e.message : "Xóa thất bại"); }
  }

  async function handleSaveFarm(data: Partial<Farm>) {
    try {
      if (editTarget) {
        await fetch(`/api/trang-trai/update/${(editTarget as Farm).id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ TenTrangTrai: data.name, DiaChi: data.address, SoChungNhan: data.cert }),
        });
        setFarms(fs => fs.map(f => f.id === (editTarget as Farm).id ? { ...f, ...data } : f));
      } else {
        const res = await fetch("/api/trang-trai/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ MaNongDan: maNongDan, TenTrangTrai: data.name, DiaChi: data.address, SoChungNhan: data.cert }),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.message);
        setFarms(fs => [...fs, { id: String(json.MaTrangTrai), name: data.name || "", address: data.address || "", cert: data.cert }]);
      }
      setModal(null); setEditTarget(null);
    } catch (e: unknown) { alert(e instanceof Error ? e.message : "Lỗi lưu trang trại"); }
  }

  async function handleAcceptOrder(id: string) {
    try {
      const res = await fetch(`/api/don-hang-dai-ly/xac-nhan/${id}`, { method: "PUT" });
      if (!res.ok) { const j = await res.json(); throw new Error(j.message); }
      setOrders(os => os.map(o => o.id === id ? { ...o, status: "da_nhan" } : o));
    } catch (e: unknown) { alert(e instanceof Error ? e.message : "Xác nhận thất bại"); }
  }

  async function handleShipOrder(id: string) {
    try {
      const res = await fetch(`/api/don-hang-dai-ly/xuat-don/${id}`, { method: "PUT" });
      if (!res.ok) { const j = await res.json(); throw new Error(j.message); }
      setOrders(os => os.map(o => o.id === id ? { ...o, status: "hoan_thanh" } : o));
    } catch (e: unknown) { alert(e instanceof Error ? e.message : "Xuất hàng thất bại"); }
  }

  async function handleCancelOrder(id: string) {
    try {
      const res = await fetch(`/api/don-hang-dai-ly/huy-don/${id}`, { method: "PUT" });
      if (!res.ok) { const j = await res.json(); throw new Error(j.message); }
      setOrders(os => os.map(o => o.id === id ? { ...o, status: "da_huy" } : o));
    } catch (e: unknown) { alert(e instanceof Error ? e.message : "Hủy đơn thất bại"); }
  }

  // Load đơn hàng từ API
  useEffect(() => {
    if (!maNongDan) return;
    fetch(`/api/don-hang-dai-ly/get-by-nong-dan/${maNongDan}`)
      .then(r => r.json())
      .then((data: Array<{
        MaDonHang: number; TrangThai: string; NgayDat: string;
        TongSoLuong: number; TongGiaTri: number; GhiChu: string;
        MaDaiLy: number; TenDaiLy: string;
      }>) => {
        setOrders(data.map(d => ({
          id: String(d.MaDonHang),
          batchId: "",
          product: "",
          quantity: d.TongSoLuong || 0,
          agentName: d.TenDaiLy || "",
          date: d.NgayDat?.slice(0, 10) || "",
          tongGiaTri: d.TongGiaTri || 0,
          ghiChu: d.GhiChu || "",
          status: (d.TrangThai || "chua_nhan") as Order["status"],
        })));
      })
      .catch(() => {});
  }, [maNongDan]);

  useEffect(() => {
    if (!maNongDan) return;
    fetch(`/api/lo-nong-san/get-by-nong-dan/${maNongDan}`)
      .then(r => r.json())
      .then((data: Array<{MaLo: number; MaTrangTrai: number; TenTrangTrai: string; MaSanPham: number; TenSanPham: string; SoLuongBanDau: number; SoLuongHienTai: number; NgayThuHoach: string; HanSuDung: string; SoChungNhanLo: string; TrangThai: string; GiaTien?: number}>) => {
        setBatches(data.map(lo => ({
          id: String(lo.MaLo),
          farmId: String(lo.MaTrangTrai),
          farmName: lo.TenTrangTrai || "",
          maSanPham: lo.MaSanPham,
          product: lo.TenSanPham || "",
          soLuongBanDau: lo.SoLuongBanDau || 0,
          soLuongHienTai: lo.SoLuongHienTai || 0,
          harvest: lo.NgayThuHoach?.slice(0, 10) || "",
          expiry: lo.HanSuDung?.slice(0, 10) || "",
          soChungNhan: lo.SoChungNhanLo || "",
          giaTien: lo.GiaTien ?? undefined,
          status: lo.TrangThai || "tai_trang_trai",
        })));
      })
      .catch(() => {});
  }, [maNongDan]);

  async function handleSaveBatch(data: Partial<Batch>) {
    try {
      if (editTarget) {
        await fetch(`/api/lo-nong-san/update/${(editTarget as Batch).id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ HanSuDung: data.expiry, TrangThai: data.status, GiaTien: data.giaTien !== undefined ? data.giaTien : null }),
        });
        setBatches(bs => bs.map(b => b.id === (editTarget as Batch).id ? { ...b, ...data } : b));
      } else {
        const res = await fetch("/api/lo-nong-san/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            MaTrangTrai: Number(data.farmId),
            MaSanPham: data.maSanPham,
            SoLuongBanDau: data.soLuongBanDau,
            NgayThuHoach: data.harvest || null,
            HanSuDung: data.expiry,
            SoChungNhanLo: data.soChungNhan || null,
            GiaTien: data.giaTien != null ? data.giaTien : null,
          }),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.message);
        setBatches(bs => [...bs, {
          id: String(json.MaLo),
          farmId: data.farmId || "",
          farmName: data.farmName || "",
          maSanPham: data.maSanPham || 0,
          product: data.product || "",
          soLuongBanDau: data.soLuongBanDau || 0,
          soLuongHienTai: data.soLuongBanDau || 0,
          harvest: data.harvest || "",
          expiry: data.expiry || "",
          soChungNhan: data.soChungNhan || "",
          giaTien: data.giaTien,
          status: "tai_trang_trai",
        }]);
      }
      setModal(null); setEditTarget(null);
    } catch (e: unknown) { alert(e instanceof Error ? e.message : "Lỗi lưu lô"); }
  }

  async function handleDeleteBatch(id: string) {
    if (!window.confirm("Xóa lô sản phẩm này?")) return;
    try {
      const res = await fetch(`/api/lo-nong-san/delete/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message);
      setBatches(b => b.filter(x => x.id !== id));
    } catch (e: unknown) { alert(e instanceof Error ? e.message : "Xóa thất bại"); }
  }

  return (
    <div className="nongdan-app">
      {/* Sidebar */}
      <div className="sidebar">
        <div className="sidebar-header">
          <div className="logo">AgriChain</div>
          <div className="logo-sub">Nông Dân</div>
        </div>
        <nav className="nav-list">
          {NAV.map(n => (
            <button key={n.id} onClick={() => setSection(n.id)} className={`nav-item ${section === n.id ? "active" : ""}`}>
              <span className="nav-icon">{n.icon}</span>{n.label}
            </button>
          ))}
        </nav>
        <div className="sidebar-footer">
          <button className="profile-btn" onClick={() => setShowProfile(true)}>
            <div className="avatar">
              {user.fullName?.charAt(0).toUpperCase() || "N"}
            </div>
            <div className="u-text-left" style={{ overflow: "hidden" }}>
              <div className="u-font-black u-text-md" style={{ color: "#fff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{user.fullName}</div>
              <div className="u-font-medium u-text-sm" style={{ color: "var(--primary-light)" }}>{user.farmName || "Nông dân"}</div>
            </div>
          </button>
          <button className="logout-btn" onClick={() => { clearCurrentUser(); window.location.href = "/login"; }}>
            Đăng xuất
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="main-content">
        <div className="page-header">
          <h2 className="page-title">
            <span className="u-text-2xl">{NAV.find(n => n.id === section)?.icon}</span>
            {PAGE_TITLES[section]}
          </h2>
          <p className="page-subtitle">Chào mừng trở lại, {user.fullName}</p>
        </div>

        <div className="section-content u-fade-in">
          {section === "dashboard" && <Dashboard farms={farms} batches={batches} orders={orders} />}
          {section === "farms"     && <FarmsSection farms={farms} onNew={() => { setEditTarget(null); setModal("new-farm"); }} onEdit={f => { setEditTarget(f); setModal("edit-farm"); }} onDelete={handleDeleteFarm} />}
          {section === "batches"   && <BatchesSection batches={batches} onNew={() => { setEditTarget(null); setModal("new-batch"); }} onEdit={b => { setEditTarget(b); setModal("edit-batch"); }} onDelete={handleDeleteBatch} />}
          {section === "orders"    && <OrdersSection orders={orders} onAccept={handleAcceptOrder} onShip={handleShipOrder} onCancel={handleCancelOrder} />}
          {section === "kho"       && <KhoSection batches={batches} orders={orders} onEdit={b => { setEditTarget(b as Batch); setModal("edit-batch"); }} onDelete={handleDeleteBatch} />}
          {section === "reports"   && <ReportsSection farms={farms} batches={batches} orders={orders} />}
        </div>
      </div>

      {/* Modals */}
      {showProfile && <UserProfileModal user={user} onClose={() => setShowProfile(false)} onEdit={() => { setShowProfile(false); setShowEditProfile(true); }} />}
      {showEditProfile && <EditProfileModal user={user} onClose={() => setShowEditProfile(false)} onSaved={(u) => { setUserInfo(prev => ({ ...prev, ...u })); }} />}
      {(modal === "new-farm" || modal === "edit-farm") && <FarmModal farm={editTarget as Farm | null} onClose={() => { setModal(null); setEditTarget(null); }} onSave={handleSaveFarm} />}
      {(modal === "new-batch" || modal === "edit-batch") && <BatchModal batch={editTarget as Batch | null} farms={farms} onClose={() => { setModal(null); setEditTarget(null); }} onSave={handleSaveBatch} />}
    </div>
  );
}
