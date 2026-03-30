const { getPool, sql } = require('../config/db');

const getAll = async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request().execute('sp_GetAllDonHangDaiLy');
    res.json(result.recordset);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

const getById = async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request()
      .input('MaDonHang', sql.Int, req.params.id)
      .execute('sp_GetDonHangDaiLyById');
    if (!result.recordset[0]) return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });
    res.json(result.recordset);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

const getByNongDan = async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request()
      .input('MaNongDan', sql.Int, req.params.maNongDan)
      .execute('sp_GetDonHangDaiLyByNongDan');
    res.json(result.recordset);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

const getByDaiLy = async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request()
      .input('MaDaiLy', sql.Int, req.params.maDaiLy)
      .execute('sp_GetDonHangByDaiLy');
    res.json(result.recordset);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

const create = async (req, res) => {
  const { MaDaiLy, MaNongDan, GhiChu } = req.body;
  try {
    const pool = await getPool();
    const result = await pool.request()
      .input('MaDaiLy', sql.Int, MaDaiLy)
      .input('MaNongDan', sql.Int, MaNongDan)
      .input('GhiChu', sql.NVarChar, GhiChu || null)
      .execute('sp_CreateDonHangDaiLy');
    res.status(201).json({ MaDonHang: result.recordset[0].MaDonHang, message: 'Tạo đơn hàng thành công' });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

const update = async (req, res) => {
  const { GhiChu } = req.body;
  try {
    const pool = await getPool();
    await pool.request()
      .input('MaDonHang', sql.Int, req.params.id)
      .input('GhiChu', sql.NVarChar, GhiChu)
      .execute('sp_UpdateDonHangDaiLy');
    res.json({ message: 'Cập nhật đơn hàng thành công' });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

const xacNhan = async (req, res) => {
  try {
    const pool = await getPool();
    await pool.request()
      .input('MaDonHang', sql.Int, req.params.id)
      .execute('sp_XacNhanDonHangDaiLy');
    res.json({ message: 'Xác nhận đơn hàng thành công' });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

const xuatDon = async (req, res) => {
  try {
    const pool = await getPool();
    await pool.request()
      .input('MaDonHang', sql.Int, req.params.id)
      .execute('sp_XuatDonHangDaiLy');
    res.json({ message: 'Xuất đơn thành công' });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

const huyDon = async (req, res) => {
  try {
    const pool = await getPool();
    await pool.request()
      .input('MaDonHang', sql.Int, req.params.id)
      .execute('sp_HuyDonHangDaiLy');
    res.json({ message: 'Hủy đơn hàng thành công' });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

const remove = async (req, res) => {
  try {
    const pool = await getPool();
    await pool.request()
      .input('MaDonHang', sql.Int, req.params.id)
      .execute('sp_DeleteDonHangDaiLy');
    res.json({ message: 'Xóa đơn hàng thành công' });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

const getChiTiet = async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request()
      .input('MaDonHang', sql.Int, req.params.maDonHang)
      .execute('sp_GetChiTietDonHangDaiLy');
    res.json(result.recordset);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

const addChiTiet = async (req, res) => {
  const { MaLo, SoLuong, DonGia } = req.body;
  try {
    const pool = await getPool();
    await pool.request()
      .input('MaDonHang', sql.Int, req.params.maDonHang)
      .input('MaLo', sql.Int, MaLo)
      .input('SoLuong', sql.Decimal(18, 2), SoLuong)
      .input('DonGia', sql.Decimal(18, 2), DonGia)
      .execute('sp_AddChiTietDonHangDaiLy');
    res.status(201).json({ message: 'Thêm chi tiết thành công' });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

const updateChiTiet = async (req, res) => {
  const { SoLuong, DonGia } = req.body;
  try {
    const pool = await getPool();
    await pool.request()
      .input('MaDonHang', sql.Int, req.params.maDonHang)
      .input('MaLo', sql.Int, req.params.maLo)
      .input('SoLuong', sql.Decimal(18, 2), SoLuong)
      .input('DonGia', sql.Decimal(18, 2), DonGia)
      .execute('sp_UpdateChiTietDonHangDaiLy');
    res.json({ message: 'Cập nhật chi tiết thành công' });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

const deleteChiTiet = async (req, res) => {
  try {
    const pool = await getPool();
    await pool.request()
      .input('MaDonHang', sql.Int, req.params.maDonHang)
      .input('MaLo', sql.Int, req.params.maLo)
      .execute('sp_DeleteChiTietDonHangDaiLy');
    res.json({ message: 'Xóa chi tiết thành công' });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

module.exports = {
  getAll, getById, getByNongDan, getByDaiLy,
  create, update, xacNhan, xuatDon, huyDon, remove,
  getChiTiet, addChiTiet, updateChiTiet, deleteChiTiet,
};
