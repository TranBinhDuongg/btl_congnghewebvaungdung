const { getPool, sql } = require('../config/db');

const getAll = async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request().execute('sp_GetAllKiemDinh');
    res.json(result.recordset);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

const getById = async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request()
      .input('MaKiemDinh', sql.Int, req.params.id)
      .execute('sp_GetKiemDinhById');
    if (!result.recordset[0]) return res.status(404).json({ message: 'Không tìm thấy kiểm định' });
    res.json(result.recordset[0]);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

const getByDaiLy = async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request()
      .input('MaDaiLy', sql.Int, req.params.maDaiLy)
      .execute('sp_GetKiemDinhByDaiLy');
    res.json(result.recordset);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

const create = async (req, res) => {
  const { MaLo, NguoiKiemDinh, MaDaiLy, MaSieuThi, KetQua, BienBan, GhiChu } = req.body;
  try {
    const pool = await getPool();
    const result = await pool.request()
      .input('MaLo', sql.Int, MaLo)
      .input('NguoiKiemDinh', sql.NVarChar, NguoiKiemDinh)
      .input('MaDaiLy', sql.Int, MaDaiLy || null)
      .input('MaSieuThi', sql.Int, MaSieuThi || null)
      .input('KetQua', sql.NVarChar, KetQua)
      .input('BienBan', sql.NVarChar, BienBan || null)
      .input('GhiChu', sql.NVarChar, GhiChu || null)
      .execute('sp_CreateKiemDinh');
    res.status(201).json({ MaKiemDinh: result.recordset[0].MaKiemDinh, message: 'Tạo kiểm định thành công' });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

const update = async (req, res) => {
  const { KetQua, BienBan, GhiChu, TrangThai } = req.body;
  try {
    const pool = await getPool();
    await pool.request()
      .input('MaKiemDinh', sql.Int, req.params.id)
      .input('KetQua', sql.NVarChar, KetQua)
      .input('BienBan', sql.NVarChar, BienBan || null)
      .input('GhiChu', sql.NVarChar, GhiChu || null)
      .input('TrangThai', sql.NVarChar, TrangThai)
      .execute('sp_UpdateKiemDinh');
    res.json({ message: 'Cập nhật kiểm định thành công' });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

const remove = async (req, res) => {
  try {
    const pool = await getPool();
    await pool.request()
      .input('MaKiemDinh', sql.Int, req.params.id)
      .execute('sp_DeleteKiemDinh');
    res.json({ message: 'Xóa kiểm định thành công' });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

module.exports = { getAll, getById, getByDaiLy, create, update, remove };
