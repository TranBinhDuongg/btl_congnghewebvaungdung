const { getPool, sql } = require('../config/db');

/**
 * Truy xuất nguồn gốc lô nông sản theo MaLo
 * Trả về thông tin đầy đủ chuỗi cung ứng: Nông dân → Trang trại → Đại lý → Siêu thị
 */
const truyXuatNguonGoc = async (req, res) => {
  const maLo = parseInt(req.params.maLo);
  if (!maLo || maLo <= 0) return res.status(400).json({ message: 'Mã lô không hợp lệ' });

  try {
    const pool = await getPool();

    // 1. Thông tin lô nông sản + sản phẩm + trang trại + nông dân
    const loResult = await pool.request()
      .input('MaLo', sql.Int, maLo)
      .query(`
        SELECT lo.MaLo, lo.SoLuongBanDau, lo.SoLuongHienTai, lo.NgayThuHoach, lo.HanSuDung,
               lo.SoChungNhanLo, lo.MaQR, lo.TrangThai, lo.NgayTao, lo.GiaTien,
               sp.TenSanPham, sp.DonViTinh, sp.MoTa AS MoTaSanPham,
               tt.MaTrangTrai, tt.TenTrangTrai, tt.DiaChi AS DiaChiTrangTrai, tt.SoChungNhan AS SoChungNhanTrangTrai,
               nd.MaNongDan, nd.HoTen AS TenNongDan, nd.SoDienThoai AS SdtNongDan, nd.DiaChi AS DiaChiNongDan
        FROM LoNongSan lo
        JOIN SanPham sp ON lo.MaSanPham = sp.MaSanPham
        JOIN TrangTrai tt ON lo.MaTrangTrai = tt.MaTrangTrai
        JOIN NongDan nd ON tt.MaNongDan = nd.MaNongDan
        WHERE lo.MaLo = @MaLo
      `);

    if (!loResult.recordset[0]) {
      return res.status(404).json({ message: 'Không tìm thấy lô nông sản' });
    }

    // 2. Đơn hàng đại lý → nông dân (chứa lô này)
    const donDaiLyResult = await pool.request()
      .input('MaLo', sql.Int, maLo)
      .query(`
        SELECT dh.MaDonHang, dh.NgayDat, dh.NgayGiao, dh.TrangThai,
               dl.MaDaiLy, dl.TenDaiLy, dl.DiaChi AS DiaChiDaiLy, dl.SoDienThoai AS SdtDaiLy,
               ct.SoLuong, ct.DonGia, ct.ThanhTien
        FROM ChiTietDonHang ct
        JOIN DonHang dh ON ct.MaDonHang = dh.MaDonHang
        JOIN DonHangDaiLy dhd ON dh.MaDonHang = dhd.MaDonHang
        JOIN DaiLy dl ON dhd.MaDaiLy = dl.MaDaiLy
        WHERE ct.MaLo = @MaLo
        ORDER BY dh.NgayDat
      `);

    // 3. Đơn hàng siêu thị → đại lý (chứa lô này)
    const donSieuThiResult = await pool.request()
      .input('MaLo', sql.Int, maLo)
      .query(`
        SELECT dh.MaDonHang, dh.NgayDat, dh.NgayGiao, dh.TrangThai,
               st.MaSieuThi, st.TenSieuThi, st.DiaChi AS DiaChiSieuThi,
               dl.TenDaiLy,
               ct.SoLuong, ct.DonGia, ct.ThanhTien
        FROM ChiTietDonHang ct
        JOIN DonHang dh ON ct.MaDonHang = dh.MaDonHang
        JOIN DonHangSieuThi dst ON dh.MaDonHang = dst.MaDonHang
        JOIN SieuThi st ON dst.MaSieuThi = st.MaSieuThi
        JOIN DaiLy dl ON dst.MaDaiLy = dl.MaDaiLy
        WHERE ct.MaLo = @MaLo
        ORDER BY dh.NgayDat
      `);

    // 4. Kiểm định
    const kiemDinhResult = await pool.request()
      .input('MaLo', sql.Int, maLo)
      .query(`
        SELECT kd.MaKiemDinh, kd.NgayKiemDinh, kd.KetQua, kd.NguoiKiemDinh,
               kd.BienBan, kd.GhiChu, kd.TrangThai,
               dl.TenDaiLy, st.TenSieuThi
        FROM KiemDinh kd
        LEFT JOIN DaiLy dl ON kd.MaDaiLy = dl.MaDaiLy
        LEFT JOIN SieuThi st ON kd.MaSieuThi = st.MaSieuThi
        WHERE kd.MaLo = @MaLo
        ORDER BY kd.NgayKiemDinh
      `);

    // 5. Vị trí kho hiện tại
    const khoResult = await pool.request()
      .input('MaLo', sql.Int, maLo)
      .query(`
        SELECT k.TenKho, k.DiaChi AS DiaChiKho, k.LoaiKho,
               tk.SoLuong, tk.CapNhatCuoi,
               dl.TenDaiLy, st.TenSieuThi
        FROM TonKho tk
        JOIN Kho k ON tk.MaKho = k.MaKho
        LEFT JOIN DaiLy dl ON k.MaDaiLy = dl.MaDaiLy
        LEFT JOIN SieuThi st ON k.MaSieuThi = st.MaSieuThi
        WHERE tk.MaLo = @MaLo
      `);

    res.json({
      loNongSan: loResult.recordset[0],
      donHangDaiLy: donDaiLyResult.recordset,
      donHangSieuThi: donSieuThiResult.recordset,
      kiemDinh: kiemDinhResult.recordset,
      viTriKho: khoResult.recordset,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * Tìm kiếm lô nông sản theo từ khóa (tên sản phẩm, mã lô, chứng nhận)
 */
const timKiemLo = async (req, res) => {
  const keyword = req.query.keyword || '';
  try {
    const pool = await getPool();
    const result = await pool.request()
      .input('Keyword', sql.NVarChar, keyword)
      .query(`
        SELECT TOP 20
               lo.MaLo, lo.NgayThuHoach, lo.HanSuDung, lo.SoChungNhanLo, lo.TrangThai, lo.NgayTao,
               sp.TenSanPham, sp.DonViTinh,
               tt.TenTrangTrai, nd.HoTen AS TenNongDan
        FROM LoNongSan lo
        JOIN SanPham sp ON lo.MaSanPham = sp.MaSanPham
        JOIN TrangTrai tt ON lo.MaTrangTrai = tt.MaTrangTrai
        JOIN NongDan nd ON tt.MaNongDan = nd.MaNongDan
        WHERE @Keyword = ''
           OR CAST(lo.MaLo AS NVARCHAR) LIKE N'%' + @Keyword + '%'
           OR sp.TenSanPham LIKE N'%' + @Keyword + '%'
           OR lo.SoChungNhanLo LIKE N'%' + @Keyword + '%'
           OR tt.TenTrangTrai LIKE N'%' + @Keyword + '%'
           OR nd.HoTen LIKE N'%' + @Keyword + '%'
        ORDER BY lo.NgayTao DESC
      `);
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { truyXuatNguonGoc, timKiemLo };
