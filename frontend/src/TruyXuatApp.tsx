import { useState, useEffect, useCallback } from "react";
import "./TruyXuatApp.css";

const API: string = (window as any)._env_?.REACT_APP_API_URL || "";

async function apiFetch(path: string) {
  const res = await fetch(`${API}${path}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Lỗi server");
  return data;
}

interface LoInfo {
  MaLo: number; TenSanPham: string; DonViTinh: string; MoTaSanPham?: string;
  SoLuongBanDau: number; SoLuongHienTai: number; NgayThuHoach?: string; HanSuDung?: string;
  SoChungNhanLo?: string; MaQR?: string; TrangThai: string; NgayTao: string; GiaTien?: number;
  MaTrangTrai: number; TenTrangTrai: string; DiaChiTrangTrai?: string; SoChungNhanTrangTrai?: string;
  MaNongDan: number; TenNongDan: string; SdtNongDan?: string; DiaChiNongDan?: string;
}
interface DonDaiLy {
  MaDonHang: number; NgayDat: string; NgayGiao?: string; TrangThai: string;
  MaDaiLy: number; TenDaiLy: string; DiaChiDaiLy?: string; SdtDaiLy?: string;
  SoLuong: number; DonGia: number; ThanhTien: number;
}
interface DonSieuThi {
  MaDonHang: number; NgayDat: string; NgayGiao?: string; TrangThai: string;
  MaSieuThi: number; TenSieuThi: string; DiaChiSieuThi?: string;
  TenDaiLy: string; SoLuong: number; DonGia: number; ThanhTien: number;
}
interface KiemDinhInfo {
  MaKiemDinh: number; NgayKiemDinh: string; KetQua: string; NguoiKiemDinh?: string;
  BienBan?: string; GhiChu?: string; TrangThai: string; TenDaiLy?: string; TenSieuThi?: string;
}
interface KhoInfo {
  TenKho: string; DiaChiKho?: string; LoaiKho: string; SoLuong: number;
  CapNhatCuoi?: string; TenDaiLy?: string; TenSieuThi?: string;
}
interface TraceData {
  loNongSan: LoInfo; donHangDaiLy: DonDaiLy[]; donHangSieuThi: DonSieuThi[];
  kiemDinh: KiemDinhInfo[]; viTriKho: KhoInfo[];
}
interface SearchResult {
  MaLo: number; TenSanPham: string; DonViTinh: string; NgayThuHoach?: string;
  TrangThai: string; TenTrangTrai: string; TenNongDan: string; SoChungNhanLo?: string;
}

function fmtDate(d?: string) {
  if (!d) return "--";
  return new Date(d).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; bg: string; color: string }> = {
    dat: { label: "✅ Đạt", bg: "#d1fae5", color: "#047857" },
    khong_dat: { label: "❌ Không đạt", bg: "#fee2e2", color: "#dc2626" },
    hoan_thanh: { label: "Hoàn thành", bg: "#d1fae5", color: "#059669" },
    da_nhan: { label: "Đã nhận", bg: "#d1fae5", color: "#059669" },
    chua_nhan: { label: "Chưa nhận", bg: "#fef3c7", color: "#b45309" },
    da_huy: { label: "Đã hủy", bg: "#fee2e2", color: "#dc2626" },
    tai_trang_trai: { label: "Tại trang trại", bg: "#dbeafe", color: "#2563eb" },
    tai_kho_dai_ly: { label: "Tại kho đại lý", bg: "#ede9fe", color: "#7c3aed" },
  };
  const s = map[status] || { label: status, bg: "#f3f4f6", color: "#555" };
  return <span className="tx-status-badge" style={{ background: s.bg, color: s.color }}>{s.label}</span>;
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return <div className="tx-info-item"><span className="tx-info-label">{label}</span><span className="tx-info-value">{value}</span></div>;
}

export default function TruyXuatApp() {
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [traceData, setTraceData] = useState<TraceData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const doSearch = useCallback(async (kw: string) => {
    if (!kw.trim()) { setResults([]); return; }
    try {
      const data = await apiFetch(`/api/truy-xuat/tim-kiem?keyword=${encodeURIComponent(kw)}`);
      setResults(Array.isArray(data) ? data : []);
      setShowResults(true);
    } catch { setResults([]); }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => doSearch(search), 400);
    return () => clearTimeout(t);
  }, [search, doSearch]);

  async function loadTrace(maLo: number) {
    setLoading(true); setError(""); setTraceData(null); setShowResults(false);
    setSearch(`Lô #${maLo}`);
    try {
      const data = await apiFetch(`/api/truy-xuat/${maLo}`);
      setTraceData(data);
    } catch (e: unknown) { setError(e instanceof Error ? e.message : "Lỗi truy xuất"); }
    finally { setLoading(false); }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const num = parseInt(search.replace(/\D/g, ""));
    if (num > 0) loadTrace(num);
  }

  const lo = traceData?.loNongSan;

  return (
    <div className="truyxuat-page">
      {/* Navbar */}
      <nav className="tx-navbar">
        <a href="/" className="tx-navbar-brand">
          <span className="tx-navbar-logo">🌿</span>
          <span className="tx-navbar-name">AgriChain</span>
        </a>
        <a href="/" className="tx-navbar-link">← Trang chủ</a>
      </nav>

      {/* Hero */}
      <section className="tx-hero">
        <div className="tx-hero-badge">🔗 Blockchain Supply Chain</div>
        <h1 className="tx-hero-title">Truy xuất <span>nguồn gốc</span><br />nông sản</h1>
        <p className="tx-hero-subtitle">Minh bạch toàn bộ hành trình từ nông trại đến bàn ăn. Nhập mã lô hoặc tên sản phẩm để bắt đầu tra cứu.</p>
        <form className="tx-search-box" onSubmit={handleSubmit}>
          <div className="tx-search-container">
            <input className="tx-search-input" value={search} onChange={e => { setSearch(e.target.value); setTraceData(null); setError(""); }}
              placeholder="Nhập mã lô, tên sản phẩm, tên trang trại..." onFocus={() => results.length > 0 && setShowResults(true)} />
            <button type="submit" className="tx-search-btn" disabled={loading}>{loading ? "Đang tìm..." : "🔍 Tra cứu"}</button>
          </div>
          {showResults && results.length > 0 && (
            <div className="tx-search-results">
              {results.map(r => (
                <div key={r.MaLo} className="tx-search-result-item" onClick={() => loadTrace(r.MaLo)}>
                  <div className="tx-search-result-icon">🌾</div>
                  <div className="tx-search-result-info">
                    <div className="tx-search-result-name">{r.TenSanPham} — Lô #{r.MaLo}</div>
                    <div className="tx-search-result-meta">🏡 {r.TenTrangTrai} • 👨‍🌾 {r.TenNongDan}{r.NgayThuHoach ? ` • 📅 ${fmtDate(r.NgayThuHoach)}` : ""}</div>
                  </div>
                  <StatusBadge status={r.TrangThai} />
                </div>
              ))}
            </div>
          )}
          <p className="tx-search-hint">Ví dụ: Nhập "1" hoặc "Gạo" hoặc tên trang trại</p>
        </form>
      </section>

      {/* Content */}
      <div className="tx-content" onClick={() => setShowResults(false)}>
        {loading && (
          <div className="tx-loading"><div className="tx-spinner" /><div className="tx-loading-text">Đang truy xuất nguồn gốc...</div></div>
        )}

        {error && (
          <div className="tx-error"><div className="tx-error-icon">⚠️</div><div className="tx-error-text">{error}</div></div>
        )}

        {!loading && !error && !traceData && (
          <div className="tx-empty">
            <div className="tx-empty-icon">🔍</div>
            <div className="tx-empty-title">Bắt đầu tra cứu</div>
            <div className="tx-empty-text">Nhập mã lô nông sản hoặc tên sản phẩm vào ô tìm kiếm ở trên để xem toàn bộ hành trình của sản phẩm.</div>
          </div>
        )}

        {traceData && lo && (
          <>
            {/* Product Summary */}
            <div className="tx-product-summary">
              <div className="tx-product-header">
                <div className="tx-product-icon">🌾</div>
                <div>
                  <h2 className="tx-product-title">{lo.TenSanPham}</h2>
                  <div className="tx-product-lot">
                    <code>Lô #{lo.MaLo}</code>
                    <StatusBadge status={lo.TrangThai} />
                    {lo.SoChungNhanLo && <span style={{ fontSize: 12, color: "#059669", fontWeight: 700 }}>📜 {lo.SoChungNhanLo}</span>}
                  </div>
                </div>
              </div>
              <div className="tx-product-grid">
                <div className="tx-product-field"><div className="tx-product-field-label">Đơn vị</div><div className="tx-product-field-value">{lo.DonViTinh}</div></div>
                <div className="tx-product-field"><div className="tx-product-field-label">SL ban đầu</div><div className="tx-product-field-value">{lo.SoLuongBanDau?.toLocaleString("vi-VN")} {lo.DonViTinh}</div></div>
                <div className="tx-product-field"><div className="tx-product-field-label">Ngày thu hoạch</div><div className="tx-product-field-value">{fmtDate(lo.NgayThuHoach)}</div></div>
                <div className="tx-product-field"><div className="tx-product-field-label">Hạn sử dụng</div><div className="tx-product-field-value">{fmtDate(lo.HanSuDung)}</div></div>
                {lo.GiaTien != null && <div className="tx-product-field"><div className="tx-product-field-label">Giá tiền</div><div className="tx-product-field-value" style={{ color: "#2563eb" }}>{lo.GiaTien.toLocaleString("vi-VN")} đ</div></div>}
                <div className="tx-product-field"><div className="tx-product-field-label">Ngày tạo lô</div><div className="tx-product-field-value">{fmtDate(lo.NgayTao)}</div></div>
              </div>
              {(lo.SoChungNhanLo || lo.MaQR) && (
                <div className="tx-cert-card" style={{ marginTop: 20 }}>
                  <div className="tx-cert-title">📜 Chứng nhận & Mã QR</div>
                  {lo.SoChungNhanLo && <div style={{ marginBottom: 6 }}><span style={{ fontSize: 12, color: "#64748b" }}>Số chứng nhận: </span><span className="tx-cert-value">{lo.SoChungNhanLo}</span></div>}
                  {lo.MaQR && <div><span style={{ fontSize: 12, color: "#64748b" }}>Mã QR: </span><span className="tx-cert-value">{lo.MaQR}</span></div>}
                </div>
              )}
            </div>

            {/* Timeline */}
            <h3 className="tx-timeline-title">📍 Hành trình sản phẩm</h3>
            <div className="tx-timeline">

              {/* Step 1: Harvest / Farm */}
              <div className="tx-timeline-step">
                <div className="tx-timeline-dot harvest">🌱</div>
                <div className="tx-timeline-card">
                  <div className="tx-timeline-card-header">
                    <div className="tx-timeline-card-title">Thu hoạch tại trang trại</div>
                    <div className="tx-timeline-card-date">{fmtDate(lo.NgayThuHoach)}</div>
                  </div>
                  <div className="tx-timeline-card-body">
                    <InfoItem label="Trang trại" value={lo.TenTrangTrai} />
                    <InfoItem label="Địa chỉ" value={lo.DiaChiTrangTrai || "--"} />
                    <InfoItem label="Nông dân" value={lo.TenNongDan} />
                    <InfoItem label="SĐT nông dân" value={lo.SdtNongDan || "--"} />
                    <InfoItem label="Địa chỉ nông dân" value={lo.DiaChiNongDan || "--"} />
                    <InfoItem label="Số lượng thu hoạch" value={`${lo.SoLuongBanDau?.toLocaleString("vi-VN")} ${lo.DonViTinh}`} />
                  </div>
                  {lo.SoChungNhanTrangTrai && (
                    <div className="tx-cert-card"><div className="tx-cert-title">🏅 Chứng nhận trang trại</div><div className="tx-cert-value">{lo.SoChungNhanTrangTrai}</div></div>
                  )}
                </div>
              </div>

              {/* Step 2: Dealer Orders */}
              {traceData.donHangDaiLy.map((d, i) => (
                <div className="tx-timeline-step" key={`dl-${i}`}>
                  <div className="tx-timeline-dot dealer">📦</div>
                  <div className="tx-timeline-card">
                    <div className="tx-timeline-card-header">
                      <div className="tx-timeline-card-title">Đại lý thu mua</div>
                      <div className="tx-timeline-card-date">{fmtDate(d.NgayDat)}</div>
                    </div>
                    <div className="tx-timeline-card-body">
                      <InfoItem label="Đại lý" value={d.TenDaiLy} />
                      <InfoItem label="Địa chỉ" value={d.DiaChiDaiLy || "--"} />
                      <InfoItem label="Mã đơn hàng" value={`#${d.MaDonHang}`} />
                      <InfoItem label="Số lượng" value={`${d.SoLuong?.toLocaleString("vi-VN")} ${lo.DonViTinh}`} />
                      <InfoItem label="Đơn giá" value={`${d.DonGia?.toLocaleString("vi-VN")} đ`} />
                      <InfoItem label="Trạng thái" value="" />
                    </div>
                    <div style={{ marginTop: 8 }}><StatusBadge status={d.TrangThai} /></div>
                    {d.NgayGiao && <div style={{ marginTop: 8, fontSize: 12, color: "#64748b" }}>📅 Ngày giao: {fmtDate(d.NgayGiao)}</div>}
                  </div>
                </div>
              ))}

              {/* Step 3: Inspections */}
              {traceData.kiemDinh.map((kd, i) => (
                <div className="tx-timeline-step" key={`kd-${i}`}>
                  <div className="tx-timeline-dot inspect">🔬</div>
                  <div className="tx-timeline-card">
                    <div className="tx-timeline-card-header">
                      <div className="tx-timeline-card-title">Kiểm định chất lượng</div>
                      <div className="tx-timeline-card-date">{fmtDate(kd.NgayKiemDinh)}</div>
                    </div>
                    <div className="tx-timeline-card-body">
                      <InfoItem label="Người kiểm định" value={kd.NguoiKiemDinh || "--"} />
                      <InfoItem label="Kết quả" value="" />
                      <InfoItem label="Đơn vị KĐ" value={kd.TenDaiLy || kd.TenSieuThi || "--"} />
                      {kd.GhiChu && <InfoItem label="Ghi chú" value={kd.GhiChu} />}
                    </div>
                    <div style={{ marginTop: 12 }}>
                      <span className={`tx-quality-badge ${kd.KetQua === "dat" ? "pass" : kd.KetQua === "khong_dat" ? "fail" : "pending"}`}>
                        {kd.KetQua === "dat" ? "✅ Đạt chuẩn" : kd.KetQua === "khong_dat" ? "❌ Không đạt" : kd.KetQua}
                      </span>
                    </div>
                  </div>
                </div>
              ))}

              {/* Step 4: Supermarket Orders */}
              {traceData.donHangSieuThi.map((d, i) => (
                <div className="tx-timeline-step" key={`st-${i}`}>
                  <div className="tx-timeline-dot supermarket">🏪</div>
                  <div className="tx-timeline-card">
                    <div className="tx-timeline-card-header">
                      <div className="tx-timeline-card-title">Phân phối đến siêu thị</div>
                      <div className="tx-timeline-card-date">{fmtDate(d.NgayDat)}</div>
                    </div>
                    <div className="tx-timeline-card-body">
                      <InfoItem label="Siêu thị" value={d.TenSieuThi} />
                      <InfoItem label="Từ đại lý" value={d.TenDaiLy} />
                      <InfoItem label="Mã đơn hàng" value={`#${d.MaDonHang}`} />
                      <InfoItem label="Số lượng" value={`${d.SoLuong?.toLocaleString("vi-VN")} ${lo.DonViTinh}`} />
                      <InfoItem label="Đơn giá" value={`${d.DonGia?.toLocaleString("vi-VN")} đ`} />
                      <InfoItem label="Địa chỉ" value={d.DiaChiSieuThi || "--"} />
                    </div>
                    <div style={{ marginTop: 8 }}><StatusBadge status={d.TrangThai} /></div>
                    {d.NgayGiao && <div style={{ marginTop: 8, fontSize: 12, color: "#64748b" }}>📅 Ngày giao: {fmtDate(d.NgayGiao)}</div>}
                  </div>
                </div>
              ))}

              {/* Step 5: Current Warehouse */}
              {traceData.viTriKho.length > 0 && traceData.viTriKho.map((k, i) => (
                <div className="tx-timeline-step" key={`kho-${i}`}>
                  <div className="tx-timeline-dot store">🏠</div>
                  <div className="tx-timeline-card">
                    <div className="tx-timeline-card-header">
                      <div className="tx-timeline-card-title">Lưu kho hiện tại</div>
                      <div className="tx-timeline-card-date">{fmtDate(k.CapNhatCuoi)}</div>
                    </div>
                    <div className="tx-timeline-card-body">
                      <InfoItem label="Tên kho" value={k.TenKho} />
                      <InfoItem label="Địa chỉ" value={k.DiaChiKho || "--"} />
                      <InfoItem label="Loại kho" value={k.LoaiKho === "daily" ? "Kho đại lý" : "Kho siêu thị"} />
                      <InfoItem label="Tồn kho" value={`${k.SoLuong?.toLocaleString("vi-VN")} ${lo.DonViTinh}`} />
                      {k.TenDaiLy && <InfoItem label="Thuộc đại lý" value={k.TenDaiLy} />}
                      {k.TenSieuThi && <InfoItem label="Thuộc siêu thị" value={k.TenSieuThi} />}
                    </div>
                  </div>
                </div>
              ))}

              {/* Empty timeline notice */}
              {traceData.donHangDaiLy.length === 0 && traceData.donHangSieuThi.length === 0 && traceData.kiemDinh.length === 0 && traceData.viTriKho.length === 0 && (
                <div className="tx-timeline-step">
                  <div className="tx-timeline-dot harvest" style={{ background: "#94a3b8" }}>📍</div>
                  <div className="tx-timeline-card" style={{ textAlign: "center", padding: "32px 24px", color: "#64748b" }}>
                    Lô hàng này hiện chỉ có thông tin thu hoạch. Chưa có giao dịch hoặc kiểm định nào được ghi nhận.
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Footer */}
      <footer className="tx-footer">
        <p>© 2024 <a href="/">AgriChain</a> — Hệ thống truy xuất nguồn gốc nông sản</p>
      </footer>
    </div>
  );
}
