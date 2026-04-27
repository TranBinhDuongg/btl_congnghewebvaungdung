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
  try {
    const pool = await getPool();
    await pool.request()
      .input('MaDonHang', sql.Int, req.params.id)
      .execute('sp_NhanDonHangSieuThi');
    res.json({ message: 'Nhận đơn hàng thành công' });
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

module.exports = {
  getAll, getByDaiLy, getById, getDonHangBySieuThi,
  taoDonHang, themChiTiet, capNhatChiTiet, xoaChiTiet,
  nhanDonHang, huyDonHang, updateTrangThai,
  deleteDonHang, getChiTiet, updateGhiChu,
};
