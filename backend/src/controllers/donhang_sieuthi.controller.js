const { getPool, sql } = require('../config/db');

const getAll = async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request().execute('sp_GetAllDonHangSieuThi');
    res.json(result.recordset);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

const getByDaiLy = async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request()
      .input('MaDaiLy', sql.Int, req.params.maDaiLy)
      .execute('sp_GetDonHangSieuThiByDaiLy');
    res.json(result.recordset);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

const getById = async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request()
      .input('MaDonHang', sql.Int, req.params.id)
      .execute('sp_GetDonHangSieuThiById');
    if (!result.recordset[0]) return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });
    res.json(result.recordset);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

const getDonHangBySieuThi = async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request()
      .input('MaSieuThi', sql.Int, req.params.maSieuThi)
      .execute('sp_GetDonHangBySieuThi');
    res.json(result.recordset);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

const taoDonHang = async (req, res) => {
  const { MaSieuThi, MaDaiLy, GhiChu } = req.body;
  if (!MaSieuThi || !MaDaiLy)
    return res.status(400).json({ message: 'Thiếu MaSieuThi hoặc MaDaiLy' });
  try {
    const pool = await getPool();
    const result = await pool.request()
      .input('MaSieuThi', sql.Int, MaSieuThi)
      .input('MaDaiLy', sql.Int, MaDaiLy)
      .input('GhiChu', sql.NVarChar, GhiChu || null)
      .execute('sp_TaoDonHangSieuThi');
    res.status(201).json({ MaDonHang: result.recordset[0].MaDonHang, message: 'Tạo đơn hàng thành công' });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

const themChiTiet = async (req, res) => {
  const { MaDonHang, MaLo, SoLuong, DonGia } = req.body;
  if (!MaDonHang || !MaLo || !SoLuong || !DonGia)
    return res.status(400).json({ message: 'Thiếu thông tin chi tiết đơn hàng' });
  try {
    const pool = await getPool();
    // Lấy MaDaiLy từ đơn hàng
    const orderInfo = await pool.request()
      .input('MaDonHang', sql.Int, MaDonHang)
      .query(`SELECT dst.MaDaiLy FROM DonHangSieuThi dst WHERE dst.MaDonHang = @MaDonHang`);
    if (!orderInfo.recordset[0])
      return res.status(404).json({ message: 'Đơn hàng không tồn tại' });
    const maDaiLy = orderInfo.recordset[0].MaDaiLy;

    // Kiểm tra tồn kho ĐẠI LÝ (TonKho) thay vì LoNongSan
    const stockCheck = await pool.request()
      .input('MaLo', sql.Int, MaLo)
      .input('MaDaiLy', sql.Int, maDaiLy)
      .query(`SELECT ISNULL(SUM(tk.SoLuong), 0) AS TonKho
              FROM TonKho tk JOIN Kho k ON tk.MaKho = k.MaKho
              WHERE tk.MaLo = @MaLo AND k.MaDaiLy = @MaDaiLy`);
    const tonKho = stockCheck.recordset[0]?.TonKho || 0;
    if (SoLuong > tonKho)
      return res.status(400).json({ message: `Số lượng đặt (${SoLuong}) vượt quá tồn kho đại lý (${tonKho})` });

    await pool.request()
      .input('MaDonHang', sql.Int, MaDonHang)
      .input('MaLo', sql.Int, MaLo)
      .input('SoLuong', sql.Decimal(18, 2), SoLuong)
      .input('DonGia', sql.Decimal(18, 2), DonGia)
      .execute('sp_ThemChiTietDonHangSieuThi');
    res.status(201).json({ message: 'Thêm chi tiết thành công' });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

const capNhatChiTiet = async (req, res) => {
  const { MaDonHang, MaLo, SoLuong, DonGia } = req.body;
  if (!MaDonHang || !MaLo || !SoLuong || !DonGia)
    return res.status(400).json({ message: 'Thiếu thông tin cập nhật' });
  try {
    const pool = await getPool();
    await pool.request()
      .input('MaDonHang', sql.Int, MaDonHang)
      .input('MaLo', sql.Int, MaLo)
      .input('SoLuong', sql.Decimal(18, 2), SoLuong)
      .input('DonGia', sql.Decimal(18, 2), DonGia)
      .execute('sp_CapNhatChiTietDonHangSieuThi');
    res.json({ message: 'Cập nhật chi tiết thành công' });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

const xoaChiTiet = async (req, res) => {
  const { MaDonHang, MaLo } = req.body;
  if (!MaDonHang || !MaLo)
    return res.status(400).json({ message: 'Thiếu MaDonHang hoặc MaLo' });
  try {
    const pool = await getPool();
    await pool.request()
      .input('MaDonHang', sql.Int, MaDonHang)
      .input('MaLo', sql.Int, MaLo)
      .execute('sp_XoaChiTietDonHangSieuThi');
    res.json({ message: 'Xóa chi tiết thành công' });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

const nhanDonHang = async (req, res) => {
  const maDonHang = parseInt(req.params.id);
  try {
    const pool = await getPool();
    // Kiểm tra đơn hàng - phải ở trạng thái hoan_thanh (dealer đã xuất kho)
    const orderCheck = await pool.request()
      .input('MaDonHang', sql.Int, maDonHang)
      .query(`SELECT dh.TrangThai, dst.MaSieuThi FROM DonHang dh
              JOIN DonHangSieuThi dst ON dh.MaDonHang = dst.MaDonHang
              WHERE dh.MaDonHang = @MaDonHang`);
    if (!orderCheck.recordset[0])
      return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });
    if (orderCheck.recordset[0].TrangThai !== 'hoan_thanh')
      return res.status(400).json({ message: 'Đơn hàng chưa được đại lý xuất kho' });

    const maSieuThi = orderCheck.recordset[0].MaSieuThi;

    // Lấy chi tiết đơn hàng
    const details = await pool.request()
      .input('MaDonHang', sql.Int, maDonHang)
      .query('SELECT MaLo, SoLuong FROM ChiTietDonHang WHERE MaDonHang = @MaDonHang');

    // Tìm hoặc tạo kho siêu thị
    let khoResult = await pool.request()
      .input('MaSieuThi', sql.Int, maSieuThi)
      .query(`SELECT TOP 1 MaKho FROM Kho WHERE MaSieuThi = @MaSieuThi AND TrangThai = N'hoat_dong' ORDER BY MaKho`);
    let maKho = khoResult.recordset[0]?.MaKho;
    if (!maKho) {
      const newKho = await pool.request()
        .input('MaSieuThi', sql.Int, maSieuThi)
        .query(`INSERT INTO Kho (LoaiKho, MaSieuThi, TenKho, DiaChi) OUTPUT INSERTED.MaKho VALUES (N'sieuthi', @MaSieuThi, N'Kho mặc định', N'')`);
      maKho = newKho.recordset[0].MaKho;
    }

    // Nhập kho siêu thị (dealer đã trừ TonKho + LoNongSan rồi)
    for (const ct of details.recordset) {
      const exists = await pool.request()
        .input('MaKho', sql.Int, maKho).input('MaLo', sql.Int, ct.MaLo)
        .query('SELECT SoLuong FROM TonKho WHERE MaKho = @MaKho AND MaLo = @MaLo');
      if (exists.recordset[0]) {
        await pool.request()
          .input('MaKho', sql.Int, maKho).input('MaLo', sql.Int, ct.MaLo).input('SoLuong', sql.Decimal(18, 2), ct.SoLuong)
          .query('UPDATE TonKho SET SoLuong = SoLuong + @SoLuong, CapNhatCuoi = SYSDATETIME() WHERE MaKho = @MaKho AND MaLo = @MaLo');
      } else {
        await pool.request()
          .input('MaKho', sql.Int, maKho).input('MaLo', sql.Int, ct.MaLo).input('SoLuong', sql.Decimal(18, 2), ct.SoLuong)
          .query('INSERT INTO TonKho (MaKho, MaLo, SoLuong) VALUES (@MaKho, @MaLo, @SoLuong)');
      }
    }

    // Đánh dấu đã nhận - set trạng thái thành 'da_nhan_st' (sieuthi đã nhận)
    await pool.request()
      .input('MaDonHang', sql.Int, maDonHang)
      .query(`UPDATE DonHang SET TrangThai = N'da_nhan', GhiChu = ISNULL(GhiChu, N'') + N' [ST đã nhận hàng]' WHERE MaDonHang = @MaDonHang`);

    res.json({ message: 'Nhận hàng và nhập kho thành công' });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

const huyDonHang = async (req, res) => {
  try {
    const pool = await getPool();
    await pool.request()
      .input('MaDonHang', sql.Int, req.params.id)
      .execute('sp_HuyDonHangSieuThi');
    res.json({ message: 'Hủy đơn hàng thành công' });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

const deleteDonHang = async (req, res) => {
  try {
    const pool = await getPool();
    await pool.request()
      .input('MaDonHang', sql.Int, req.params.id)
      .execute('sp_DeleteDonHangSieuThi');
    res.json({ message: 'Xóa đơn hàng thành công' });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

const getChiTiet = async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request()
      .input('MaDonHang', sql.Int, req.params.id)
      .execute('sp_GetChiTietDonHangSieuThi');
    res.json(result.recordset);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

const updateGhiChu = async (req, res) => {
  const { GhiChu } = req.body;
  try {
    const pool = await getPool();
    await pool.request()
      .input('MaDonHang', sql.Int, req.params.id)
      .input('GhiChu', sql.NVarChar, GhiChu || null)
      .execute('sp_UpdateGhiChuDonHangSieuThi');
    res.json({ message: 'Cập nhật ghi chú thành công' });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

const updateTrangThai = async (req, res) => {
  const { TrangThai } = req.body;
  const validStatus = ['chua_nhan', 'da_nhan', 'dang_xu_ly', 'hoan_thanh', 'da_huy'];
  if (!validStatus.includes(TrangThai))
    return res.status(400).json({ message: 'Trạng thái không hợp lệ' });
  try {
    const pool = await getPool();
    await pool.request()
      .input('MaDonHang', sql.Int, req.params.id)
      .input('TrangThai', sql.NVarChar, TrangThai)
      .execute('sp_UpdateTrangThaiDonHangSieuThi');
    res.json({ message: 'Cập nhật trạng thái thành công' });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// Lấy tồn kho của đại lý (để siêu thị chọn sản phẩm khi tạo đơn)
const getTonKhoDaiLy = async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request()
      .input('MaDaiLy', sql.Int, req.params.maDaiLy)
      .query(`SELECT tk.MaKho, k.TenKho, k.DiaChi, tk.MaLo, tk.SoLuong, tk.CapNhatCuoi,
                     lo.MaSanPham, sp.TenSanPham, sp.DonViTinh,
                     COALESCE(lo.GiaTien, (SELECT TOP 1 ct.DonGia FROM ChiTietDonHang ct WHERE ct.MaLo = tk.MaLo ORDER BY ct.MaDonHang DESC)) AS GiaTien,
                     lo.NgayThuHoach, lo.HanSuDung, lo.TrangThai AS TrangThaiLo
              FROM TonKho tk
              JOIN Kho k ON tk.MaKho = k.MaKho
              JOIN LoNongSan lo ON tk.MaLo = lo.MaLo
              JOIN SanPham sp ON lo.MaSanPham = sp.MaSanPham
              WHERE k.MaDaiLy = @MaDaiLy AND tk.SoLuong > 0
              ORDER BY sp.TenSanPham`);
    res.json(result.recordset);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

module.exports = {
  getAll, getByDaiLy, getById, getDonHangBySieuThi,
  taoDonHang, themChiTiet, capNhatChiTiet, xoaChiTiet,
  nhanDonHang, huyDonHang, updateTrangThai,
  deleteDonHang, getChiTiet, updateGhiChu, getTonKhoDaiLy,
};
