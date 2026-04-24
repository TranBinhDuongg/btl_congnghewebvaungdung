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

module.exports = { getAll, getByDaiLy, getById, updateTrangThai };
