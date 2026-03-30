const { getPool, sql } = require('../config/db');

// --- Profile ---
const getProfile = async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request()
      .input('MaTaiKhoan', sql.Int, req.params.maTaiKhoan)
      .execute('sp_GetSieuThiProfile');
    if (!result.recordset[0]) return res.status(404).json({ message: 'Không tìm thấy siêu thị' });
    res.json(result.recordset[0]);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

const search = async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request()
      .input('Keyword', sql.NVarChar, req.query.keyword || null)
      .execute('sp_SearchSieuThi');
    res.json(result.recordset);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

const create = async (req, res) => {
  const { TenDangNhap, MatKhauHash, TenSieuThi, SoDienThoai, Email, DiaChi } = req.body;
  try {
    const pool = await getPool();
    const result = await pool.request()
      .input('TenDangNhap', sql.NVarChar, TenDangNhap)
      .input('MatKhauHash', sql.NVarChar, MatKhauHash)
      .input('TenSieuThi', sql.NVarChar, TenSieuThi)
      .input('SoDienThoai', sql.NVarChar, SoDienThoai)
      .input('Email', sql.NVarChar, Email)
      .input('DiaChi', sql.NVarChar, DiaChi)
      .execute('sp_CreateSieuThi');
    res.status(201).json({ MaSieuThi: result.recordset[0].MaSieuThi, message: 'Tạo siêu thị thành công' });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

const update = async (req, res) => {
  const { TenSieuThi, SoDienThoai, Email, DiaChi } = req.body;
  try {
    const pool = await getPool();
    await pool.request()
      .input('MaSieuThi', sql.Int, req.params.maSieuThi)
      .input('TenSieuThi', sql.NVarChar, TenSieuThi)
      .input('SoDienThoai', sql.NVarChar, SoDienThoai)
      .input('Email', sql.NVarChar, Email)
      .input('DiaChi', sql.NVarChar, DiaChi)
      .execute('sp_UpdateSieuThi');
    res.json({ message: 'Cập nhật siêu thị thành công' });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

const remove = async (req, res) => {
  try {
    const pool = await getPool();
    await pool.request()
      .input('MaSieuThi', sql.Int, req.params.maSieuThi)
      .execute('sp_DeleteSieuThi');
    res.json({ message: 'Xóa siêu thị thành công' });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// --- Đơn hàng ---
const taoDonHang = async (req, res) => {
  const { MaSieuThi, MaDaiLy, GhiChu } = req.body;
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

const getDonHangById = async (req, res) => {
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

module.exports = {
  getProfile, search, create, update, remove,
  taoDonHang, themChiTiet, capNhatChiTiet, xoaChiTiet,
  nhanDonHang, huyDonHang, getDonHangById, getDonHangBySieuThi,
};
