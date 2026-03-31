import React, { useState } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────
export interface User {
  id: string; fullName: string; username: string; email: string; phone: string;
  role: string; province: string; district: string; address: string;
  farmName: string; farmArea: string; cropType: string; certification: string; createdAt: string;
}
export interface Farm { id: string; name: string; address: string; cert?: string; }
export interface Batch {
  id: string; farmName: string; product: string; quantity: number;
  expiry: string; harvest?: string; status: string;
}
export interface Order {
  id: string; batchId: string; product: string; quantity: number;
  agentName: string; date: string;
  status: "pending" | "preparing" | "shipped" | "received" | "accepted";
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
  pending:   { label: "Chờ xử lý",    color: "#b45309", bg: "#fef3c7" },
  preparing: { label: "Chuẩn bị",     color: "#1d4ed8", bg: "#dbeafe" },
  shipped:   { label: "Đã xuất",      color: "#7c3aed", bg: "#ede9fe" },
  received:  { label: "Đã nhận",      color: "#059669", bg: "#d1fae5" },
  accepted:  { label: "Đã nhận đơn",  color: "#059669", bg: "#d1fae5" },
  active:    { label: "Đang lưu kho", color: "#15803d", bg: "#dcfce7" },
  low:       { label: "Sắp hết",      color: "#dc2626", bg: "#fee2e2" },
};

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_MAP[status] ?? { label: status, color: "#555", bg: "#f3f4f6" };
  return (
    <span style={{ display: "inline-block", padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700, letterSpacing: 0.4, color: s.color, background: s.bg }}>
      {s.label}
    </span>
  );
}

function daysUntil(dateStr: string) {
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400000);
}

// ─── Shared micro-components ──────────────────────────────────────────────────
function StyledTable({ headers, children }: { headers: string[]; children: React.ReactNode }) {
  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
        <thead><tr>{headers.map(h => (
          <th key={h} style={{ textAlign: "left", padding: "8px 12px", background: "#f8faf8", color: "#163d2b", fontWeight: 700, fontSize: 11, textTransform: "uppercase", letterSpacing: 0.5, whiteSpace: "nowrap" }}>{h}</th>
        ))}</tr></thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}
function Td({ children }: { children: React.ReactNode }) {
  return <td style={{ padding: "10px 12px", verticalAlign: "middle" }}>{children}</td>;
}
function ActionBtn({ children, onClick, color }: { children: React.ReactNode; onClick: () => void; color: string }) {
  return (
    <button onClick={onClick} style={{ marginRight: 5, padding: "4px 10px", background: color, color: "#fff", border: "none", borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
      {children}
    </button>
  );
}
function Btn({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) {
  return (
    <button onClick={onClick} style={{ padding: "9px 18px", background: "linear-gradient(135deg,#4caf50,#1a6b2a)", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 700, fontSize: 13, letterSpacing: 0.3 }}>
      {children}
    </button>
  );
}

// ─── Modal ────────────────────────────────────────────────────────────────────
function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2000 }} onClick={onClose}>
      <div style={{ background: "#fff", borderRadius: 16, padding: 28, width: 480, maxWidth: "94vw", maxHeight: "88vh", overflowY: "auto", position: "relative", boxShadow: "0 8px 40px #0003" }} onClick={e => e.stopPropagation()}>
        <button onClick={onClose} style={{ position: "absolute", top: 12, right: 14, background: "none", border: "none", fontSize: 22, cursor: "pointer", color: "#aaa" }}>✕</button>
        <h3 style={{ marginBottom: 18, color: "#163d2b", fontWeight: 800, fontSize: 17 }}>{title}</h3>
        {children}
      </div>
    </div>
  );
}
function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#555", marginBottom: 5 }}>{label}</label>
      {children}
    </div>
  );
}
const inputStyle: React.CSSProperties = { width: "100%", padding: "8px 10px", border: "1.5px solid #e2e8f0", borderRadius: 8, fontSize: 13, outline: "none", fontFamily: "inherit" };

// ─── Sections ─────────────────────────────────────────────────────────────────
function Dashboard({ farms, batches, orders }: { farms: Farm[]; batches: Batch[]; orders: Order[] }) {
  const alerts = batches.filter(b => daysUntil(b.expiry) <= 14);
  const kpis: KpiData = { farms: farms.length, batches: batches.length, orders: orders.length, alerts: alerts.length };
  const kpiItems = [
    { label: "Trang trại",   value: kpis.farms,   icon: "🌿", accent: "#16a34a" },
    { label: "Lô sản phẩm",  value: kpis.batches, icon: "📦", accent: "#2563eb" },
    { label: "Đơn hàng",     value: kpis.orders,  icon: "📋", accent: "#7c3aed" },
    { label: "Cảnh báo HSD", value: kpis.alerts,  icon: "⚠️", accent: "#dc2626" },
  ];
  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(190px,1fr))", gap: 16, marginBottom: 28 }}>
        {kpiItems.map(k => (
          <div key={k.label} style={{ background: "#fff", borderRadius: 14, padding: "22px 20px", boxShadow: "0 1px 8px #0000000a", borderTop: `4px solid ${k.accent}`, display: "flex", alignItems: "center", gap: 14 }}>
            <span style={{ fontSize: 28 }}>{k.icon}</span>
            <div>
              <div style={{ fontSize: 28, fontWeight: 800, color: "#111", lineHeight: 1 }}>{k.value}</div>
              <div style={{ fontSize: 12, color: "#888", marginTop: 4 }}>{k.label}</div>
            </div>
          </div>
        ))}
      </div>
      <div style={{ background: "#fff", borderRadius: 14, padding: 20, boxShadow: "0 1px 8px #0000000a" }}>
        <h4 style={{ fontSize: 15, fontWeight: 700, color: "#163d2b", marginBottom: 14 }}>⚠️ Cảnh báo hạn sử dụng (≤ 14 ngày)</h4>
        {alerts.length === 0 ? (
          <p style={{ color: "#aaa", textAlign: "center", padding: "24px 0" }}>Không có cảnh báo nào</p>
        ) : (
          <StyledTable headers={["Mã lô", "Sản phẩm", "Hạn dùng", "Còn lại"]}>
            {alerts.map(b => {
              const days = daysUntil(b.expiry);
              return (
                <tr key={b.id} style={{ borderBottom: "1px solid #f0f0f0" }}>
                  <Td>{b.id}</Td><Td><b>{b.product}</b></Td><Td>{b.expiry}</Td>
                  <Td><span style={{ color: days <= 7 ? "#dc2626" : "#d97706", fontWeight: 700 }}>{days} ngày</span></Td>
                </tr>
              );
            })}
          </StyledTable>
        )}
      </div>
    </div>
  );
}

function FarmsSection({ farms, onNew, onEdit, onDelete }: { farms: Farm[]; onNew: () => void; onEdit: (f: Farm) => void; onDelete: (id: string) => void }) {
  return (
    <div style={{ background: "#fff", borderRadius: 14, padding: 20, boxShadow: "0 1px 8px #0000000a" }}>
      <StyledTable headers={["ID", "Tên trang trại", "Địa chỉ", "Chứng nhận", "Hành động"]}>
        {farms.map(f => (
          <tr key={f.id} style={{ borderBottom: "1px solid #f0f0f0" }}>
            <Td><code style={{ fontSize: 11, color: "#888" }}>{f.id}</code></Td>
            <Td><b>{f.name}</b></Td><Td>{f.address}</Td>
            <Td><span style={{ background: "#dcfce7", color: "#15803d", padding: "2px 8px", borderRadius: 10, fontSize: 11, fontWeight: 700 }}>{f.cert || "—"}</span></Td>
            <Td><ActionBtn onClick={() => onEdit(f)} color="#2563eb">Sửa</ActionBtn><ActionBtn onClick={() => onDelete(f.id)} color="#dc2626">Xóa</ActionBtn></Td>
          </tr>
        ))}
      </StyledTable>
    </div>
  );
}

function BatchesSection({ batches, onNew, onEdit, onDelete }: { batches: Batch[]; onNew: () => void; onEdit: (b: Batch) => void; onDelete: (id: string) => void }) {
  return (
    <div style={{ background: "#fff", borderRadius: 14, padding: 20, boxShadow: "0 1px 8px #0000000a" }}>
      <StyledTable headers={["Mã lô", "Trang trại", "Sản phẩm", "Số lượng", "Hạn dùng", "Trạng thái", ""]}>
        {batches.map(b => (
          <tr key={b.id} style={{ borderBottom: "1px solid #f0f0f0" }}>
            <Td><code style={{ fontSize: 11, color: "#888" }}>{b.id}</code></Td>
            <Td>{b.farmName}</Td><Td><b>{b.product}</b></Td><Td>{b.quantity} kg</Td>
            <Td>{b.expiry}</Td><Td><StatusBadge status={b.status} /></Td>
            <Td><ActionBtn onClick={() => onEdit(b)} color="#2563eb">Sửa</ActionBtn><ActionBtn onClick={() => onDelete(b.id)} color="#dc2626">Xóa</ActionBtn></Td>
          </tr>
        ))}
      </StyledTable>
    </div>
  );
}

function OrdersSection({ orders, onAccept, onShip }: { orders: Order[]; onAccept: (id: string) => void; onShip: (id: string) => void }) {
  return (
    <div style={{ background: "#fff", borderRadius: 14, padding: 20, boxShadow: "0 1px 8px #0000000a" }}>
      <h4 style={{ fontSize: 15, fontWeight: 700, color: "#163d2b", marginBottom: 14 }}>Đơn từ Đại lý gửi đến</h4>
      <StyledTable headers={["Mã phiếu", "Mã lô — Sản phẩm", "SL", "Đại lý", "Ngày tạo", "Trạng thái", "Hành động"]}>
        {orders.map(o => (
          <tr key={o.id} style={{ borderBottom: "1px solid #f0f0f0" }}>
            <Td><code style={{ fontSize: 11, color: "#888" }}>{o.id}</code></Td>
            <Td><span style={{ color: "#888", fontSize: 11 }}>{o.batchId} —</span> <b>{o.product}</b></Td>
            <Td>{o.quantity} kg</Td><Td>{o.agentName}</Td><Td>{o.date}</Td>
            <Td><StatusBadge status={o.status} /></Td>
            <Td>
              {o.status === "pending"  && <ActionBtn onClick={() => onAccept(o.id)} color="#16a34a">Nhận đơn</ActionBtn>}
              {o.status === "accepted" && <ActionBtn onClick={() => onShip(o.id)}   color="#7c3aed">Xuất hàng</ActionBtn>}
            </Td>
          </tr>
        ))}
      </StyledTable>
    </div>
  );
}

function KhoSection({ batches, orders }: { batches: Batch[]; orders: Order[] }) {
  const exported = orders.filter(o => o.status === "shipped" || o.status === "received");
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(460px,1fr))", gap: 16 }}>
      <div style={{ background: "#fff", borderRadius: 14, padding: 20, boxShadow: "0 1px 8px #0000000a" }}>
        <h4 style={{ fontSize: 15, fontWeight: 700, color: "#163d2b", marginBottom: 6 }}>📥 Tồn kho</h4>
        <p style={{ fontSize: 12, color: "#aaa", marginBottom: 14 }}>Lô sản phẩm đang lưu kho</p>
        <StyledTable headers={["Mã lô", "Sản phẩm", "SL", "Trang trại", "Hạn dùng", "TT"]}>
          {batches.map(b => (
            <tr key={b.id} style={{ borderBottom: "1px solid #f0f0f0" }}>
              <Td><code style={{ fontSize: 11, color: "#888" }}>{b.id}</code></Td>
              <Td><b>{b.product}</b></Td><Td>{b.quantity} kg</Td><Td>{b.farmName}</Td><Td>{b.expiry}</Td>
              <Td><StatusBadge status={b.quantity > 50 ? "active" : "low"} /></Td>
            </tr>
          ))}
        </StyledTable>
      </div>
      <div style={{ background: "#fff", borderRadius: 14, padding: 20, boxShadow: "0 1px 8px #0000000a" }}>
        <h4 style={{ fontSize: 15, fontWeight: 700, color: "#163d2b", marginBottom: 6 }}>📤 Lịch sử xuất hàng</h4>
        <p style={{ fontSize: 12, color: "#aaa", marginBottom: 14 }}>Hàng đã xuất cho Đại lý</p>
        <StyledTable headers={["Mã đơn", "Mã lô", "SL", "Đại lý", "Ngày"]}>
          {exported.length === 0
            ? <tr><td colSpan={5} style={{ textAlign: "center", color: "#aaa", padding: "20px 0", fontSize: 13 }}>Chưa có lịch sử xuất hàng</td></tr>
            : exported.map(o => (
              <tr key={o.id} style={{ borderBottom: "1px solid #f0f0f0" }}>
                <Td><code style={{ fontSize: 11, color: "#888" }}>{o.id}</code></Td>
                <Td>{o.batchId}</Td><Td>{o.quantity} kg</Td><Td>{o.agentName}</Td><Td>{o.date}</Td>
              </tr>
            ))}
        </StyledTable>
      </div>
    </div>
  );
}

function ReportsSection({ farms, batches, orders }: { farms: Farm[]; batches: Batch[]; orders: Order[] }) {
  const totalProd = batches.reduce((s, b) => s + b.quantity, 0);
  const shipped = orders.filter(o => o.status === "shipped" || o.status === "received").reduce((s, o) => s + o.quantity, 0);
  const cards = [
    { icon: "🌱", label: "Tổng sản lượng",    value: `${totalProd} kg`, color: "#16a34a" },
    { icon: "🚚", label: "Đã xuất hàng",       value: `${shipped} kg`,  color: "#7c3aed" },
    { icon: "📦", label: "Tồn kho ước tính",   value: `${totalProd - shipped} kg`, color: "#2563eb" },
    { icon: "🏡", label: "Số trang trại",       value: farms.length,     color: "#d97706" },
  ];
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 16 }}>
      {cards.map(c => (
        <div key={c.label} style={{ background: "#fff", borderRadius: 14, padding: "28px 20px", boxShadow: "0 1px 8px #0000000a", textAlign: "center", borderLeft: `5px solid ${c.color}` }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>{c.icon}</div>
          <div style={{ fontSize: 13, color: "#888", marginBottom: 6 }}>{c.label}</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: c.color }}>{c.value}</div>
        </div>
      ))}
    </div>
  );
}

// ─── User Profile Modal ───────────────────────────────────────────────────────
function UserProfileModal({ user, onClose }: { user: User; onClose: () => void }) {
  const fields: [string, string][] = [
    ["Họ tên", user.fullName], ["Tên đăng nhập", user.username],
    ["Email", user.email], ["Số điện thoại", user.phone],
    ["Vai trò", user.role], ["Tỉnh/TP", user.province],
    ["Quận/Huyện", user.district], ["Địa chỉ", user.address],
    ["Tên trang trại", user.farmName], ["Diện tích", `${user.farmArea} ha`],
    ["Loại nông sản", user.cropType], ["Chứng nhận", user.certification],
    ["Ngày tạo", new Date(user.createdAt).toLocaleDateString("vi-VN")],
    ["Mã người dùng", user.id],
  ];
  return (
    <Modal title="Thông tin cá nhân" onClose={onClose}>
      <div style={{ display: "flex", justifyContent: "center", marginBottom: 18 }}>
        <div style={{ width: 64, height: 64, background: "linear-gradient(135deg,#4caf50,#1a472a)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28 }}>👤</div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px 16px" }}>
        {fields.map(([k, v]) => (
          <div key={k} style={{ padding: "6px 0", borderBottom: "1px solid #f0f0f0" }}>
            <div style={{ fontSize: 10, color: "#aaa", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.4 }}>{k}</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#222", marginTop: 2 }}>{v}</div>
          </div>
        ))}
      </div>
    </Modal>
  );
}

// ─── Form Modals ──────────────────────────────────────────────────────────────
function FarmModal({ farm, onClose, onSave }: { farm: Farm | null; onClose: () => void; onSave: (d: Partial<Farm>) => void }) {
  const [name, setName] = useState(farm?.name || "");
  const [address, setAddress] = useState(farm?.address || "");
  const [cert, setCert] = useState(farm?.cert || "");
  return (
    <Modal title={farm ? "Chỉnh sửa trang trại" : "Thêm trang trại mới"} onClose={onClose}>
      <FormField label="Tên trang trại *"><input style={inputStyle} value={name} onChange={e => setName(e.target.value)} placeholder="VD: Trang trại Hòa Bình" /></FormField>
      <FormField label="Địa chỉ *"><input style={inputStyle} value={address} onChange={e => setAddress(e.target.value)} placeholder="VD: Xã Bình Minh, Cao Phong" /></FormField>
      <FormField label="Chứng nhận">
        <select style={inputStyle} value={cert} onChange={e => setCert(e.target.value)}>
          <option value="">— Chọn chứng nhận —</option>
          <option value="VietGAP">VietGAP</option>
          <option value="GlobalGAP">GlobalGAP</option>
          <option value="Organic">Organic</option>
        </select>
      </FormField>
      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 6 }}>
        <button onClick={onClose} style={{ padding: "9px 18px", background: "#f3f4f6", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 600 }}>Hủy</button>
        <Btn onClick={() => { if (!name || !address) return alert("Vui lòng nhập đầy đủ"); onSave({ name, address, cert }); }}>Lưu</Btn>
      </div>
    </Modal>
  );
}

function BatchModal({ batch, farms, onClose, onSave }: { batch: Batch | null; farms: Farm[]; onClose: () => void; onSave: (d: Partial<Batch>) => void }) {
  const [farmName, setFarmName] = useState(batch?.farmName || farms[0]?.name || "");
  const [product, setProduct] = useState(batch?.product || "");
  const [quantity, setQuantity] = useState(String(batch?.quantity || ""));
  const [expiry, setExpiry] = useState(batch?.expiry || "");
  const [harvest, setHarvest] = useState(batch?.harvest || "");
  return (
    <Modal title={batch ? "Chỉnh sửa lô sản phẩm" : "Đăng ký lô sản phẩm mới"} onClose={onClose}>
      <FormField label="Trang trại *">
        <select style={inputStyle} value={farmName} onChange={e => setFarmName(e.target.value)}>
          {farms.map(f => <option key={f.id} value={f.name}>{f.name}</option>)}
        </select>
      </FormField>
      <FormField label="Sản phẩm *"><input style={inputStyle} value={product} onChange={e => setProduct(e.target.value)} placeholder="VD: Cải thảo, Cà chua…" /></FormField>
      <FormField label="Số lượng (kg) *"><input style={inputStyle} type="number" value={quantity} onChange={e => setQuantity(e.target.value)} placeholder="200" /></FormField>
      <FormField label="Ngày thu hoạch"><input style={inputStyle} type="date" value={harvest} onChange={e => setHarvest(e.target.value)} /></FormField>
      <FormField label="Hạn sử dụng *"><input style={inputStyle} type="date" value={expiry} onChange={e => setExpiry(e.target.value)} /></FormField>
      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 6 }}>
        <button onClick={onClose} style={{ padding: "9px 18px", background: "#f3f4f6", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 600 }}>Hủy</button>
        <Btn onClick={() => { if (!product || !quantity || !expiry) return alert("Vui lòng điền đủ thông tin"); onSave({ farmName, product, quantity: Number(quantity), expiry, harvest }); }}>Lưu</Btn>
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
  const [user] = useState<User>(EMPTY_USER);
  const [showProfile, setShowProfile] = useState(false);
  const [modal, setModal] = useState<null | "new-farm" | "new-batch" | "edit-farm" | "edit-batch">(null);
  const [editTarget, setEditTarget] = useState<Farm | Batch | null>(null);

  function handleDeleteFarm(id: string) {
    if (window.confirm("Xóa trang trại này?")) setFarms(f => f.filter(x => x.id !== id));
  }
  function handleDeleteBatch(id: string) {
    if (window.confirm("Xóa lô sản phẩm này?")) setBatches(b => b.filter(x => x.id !== id));
  }
  function handleAcceptOrder(id: string) {
    setOrders(os => os.map(o => o.id === id ? { ...o, status: "accepted" } : o));
  }
  function handleShipOrder(id: string) {
    setOrders(os => os.map(o => o.id === id ? { ...o, status: "shipped" } : o));
  }
  function handleSaveFarm(data: Partial<Farm>) {
    if (editTarget) {
      setFarms(fs => fs.map(f => f.id === (editTarget as Farm).id ? { ...f, ...data } : f));
    } else {
      setFarms(fs => [...fs, { id: "F" + Date.now(), name: data.name || "", address: data.address || "", cert: data.cert }]);
    }
    setModal(null); setEditTarget(null);
  }
  function handleSaveBatch(data: Partial<Batch>) {
    if (editTarget) {
      setBatches(bs => bs.map(b => b.id === (editTarget as Batch).id ? { ...b, ...data } : b));
    } else {
      setBatches(bs => [...bs, { id: "B" + Date.now(), farmName: data.farmName || "", product: data.product || "", quantity: Number(data.quantity) || 0, expiry: data.expiry || "", status: "active" }]);
    }
    setModal(null); setEditTarget(null);
  }

  const headerCtas: Partial<Record<Section, React.ReactNode>> = {
    farms:     <Btn onClick={() => { setEditTarget(null); setModal("new-farm"); }}>+ Thêm trang trại</Btn>,
    batches:   <Btn onClick={() => { setEditTarget(null); setModal("new-batch"); }}>+ Đăng ký lô mới</Btn>,
    dashboard: <Btn onClick={() => { setEditTarget(null); setModal("new-batch"); }}>+ Đăng ký lô mới</Btn>,
  };

  return (
    <div style={{ fontFamily: "'Be Vietnam Pro','Segoe UI',Tahoma,Geneva,sans-serif", background: "#f4f6f4", minHeight: "100vh" }}>
      {/* Sidebar */}
      <aside style={{ position: "fixed", left: 0, top: 0, width: 248, height: "100vh", background: "linear-gradient(180deg,#0f2f1a 0%,#0a1f11 100%)", color: "#fff", display: "flex", flexDirection: "column", zIndex: 1000, fontFamily: "inherit" }}>
        <div style={{ padding: "20px 18px 16px", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 28 }}>🌾</span>
            <div>
              <div style={{ fontWeight: 800, fontSize: 16, letterSpacing: 0.5 }}>NôngDân</div>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.45)", letterSpacing: 0.8, textTransform: "uppercase" }}>Quản lý trang trại</div>
            </div>
          </div>
        </div>
        <div style={{ padding: "12px 18px", borderBottom: "1px solid rgba(255,255,255,0.07)", cursor: "pointer" }} onClick={() => setShowProfile(true)}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 36, height: 36, background: "linear-gradient(135deg,#4caf50,#1a472a)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>👤</div>
            <div style={{ overflow: "hidden" }}>
              <div style={{ fontWeight: 700, fontSize: 13, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{user.fullName}</div>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.45)" }}>{user.farmName}</div>
            </div>
          </div>
        </div>
        <nav style={{ flex: 1, padding: "10px 0", overflowY: "auto" }}>
          {NAV.map(n => (
            <button key={n.id} onClick={() => setSection(n.id)} style={{ display: "flex", alignItems: "center", gap: 12, width: "100%", padding: "11px 18px", background: section === n.id ? "rgba(76,175,80,0.18)" : "none", border: "none", borderLeft: section === n.id ? "3px solid #4caf50" : "3px solid transparent", color: section === n.id ? "#4caf50" : "rgba(255,255,255,0.6)", cursor: "pointer", fontSize: 13, fontWeight: section === n.id ? 700 : 500, textAlign: "left", transition: "all 0.18s" }}>
              <span>{n.icon}</span><span>{n.label}</span>
            </button>
          ))}
        </nav>
        <div style={{ padding: "10px 8px 16px", borderTop: "1px solid rgba(255,255,255,0.07)" }}>
          <button style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "10px 10px", background: "none", border: "none", color: "rgba(255,255,255,0.45)", cursor: "pointer", fontSize: 12, borderRadius: 8 }} onClick={() => { window.location.href = "/login"; }}>
            <span>🚪</span><span>Đăng xuất</span>
          </button>
        </div>
      </aside>

      {/* Main */}
      <main style={{ marginLeft: 248, padding: "28px 28px 48px", minHeight: "100vh" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 22 }}>
          <div>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: "#0f2f1a", margin: 0 }}>{PAGE_TITLES[section]}</h2>
            <p style={{ fontSize: 12, color: "#aaa", margin: "3px 0 0" }}>Xin chào, {user.fullName}</p>
          </div>
          {headerCtas[section]}
        </div>
        {section === "dashboard" && <Dashboard farms={farms} batches={batches} orders={orders} />}
        {section === "farms"     && <FarmsSection farms={farms} onNew={() => setModal("new-farm")} onEdit={f => { setEditTarget(f); setModal("edit-farm"); }} onDelete={handleDeleteFarm} />}
        {section === "batches"   && <BatchesSection batches={batches} onNew={() => setModal("new-batch")} onEdit={b => { setEditTarget(b); setModal("edit-batch"); }} onDelete={handleDeleteBatch} />}
        {section === "orders"    && <OrdersSection orders={orders} onAccept={handleAcceptOrder} onShip={handleShipOrder} />}
        {section === "kho"       && <KhoSection batches={batches} orders={orders} />}
        {section === "reports"   && <ReportsSection farms={farms} batches={batches} orders={orders} />}
      </main>

      {showProfile && <UserProfileModal user={user} onClose={() => setShowProfile(false)} />}
      {(modal === "new-farm" || modal === "edit-farm") && <FarmModal farm={editTarget as Farm | null} onClose={() => { setModal(null); setEditTarget(null); }} onSave={handleSaveFarm} />}
      {(modal === "new-batch" || modal === "edit-batch") && <BatchModal batch={editTarget as Batch | null} farms={farms} onClose={() => { setModal(null); setEditTarget(null); }} onSave={handleSaveBatch} />}
    </div>
  );
}
