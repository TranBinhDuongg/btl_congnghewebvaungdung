const { getPool, sql } = require('../config/db');

const getProfile = async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request()
      .input('MaTaiKhoan', sql.Int, req.params.maTaiKhoan)
      .execute('sp_GetDaiLyProfile');
    if (!result.recordset[0]) return res.status(404).json({ message: 'Không tìm thấy đại lý' });
    res.json(result.recordset[0]);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

const getById = async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request()
      .input('MaDaiLy', sql.Int, req.params.id)
      .execute('sp_GetDaiLyById');
    if (!result.recordset[0]) return res.status(404).json({ message: 'Không tìm thấy đại lý' });
    res.json(result.recordset[0]);
  } catch (err) { res.status(500).json({ message: err.message }); }
};
const search = async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request()
      .input('Keyword', sql.NVarChar, req.query.keyword || null)
      .execute('sp_SearchDaiLy');
    res.json(result.recordset);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

const create = async (req, res) => {
  const { TenDangNhap, MatKhauHash, TenDaiLy, SoDienThoai, Email, DiaChi } = req.body;
  try {
    const pool = await getPool();
    const result = await pool.request()
      .input('TenDangNhap', sql.NVarChar, TenDangNhap)
      .input('MatKhauHash', sql.NVarChar, MatKhauHash)
      .input('TenDaiLy', sql.NVarChar, TenDaiLy)
      .input('SoDienThoai', sql.NVarChar, SoDienThoai)
      .input('Email', sql.NVarChar, Email)
      .input('DiaChi', sql.NVarChar, DiaChi)
      .execute('sp_CreateDaiLy');
    res.status(201).json({ MaDaiLy: result.recordset[0].MaDaiLy, message: 'Tạo đại lý thành công' });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

const update = async (req, res) => {
  const { TenDaiLy, SoDienThoai, Email, DiaChi } = req.body;
  try {
    const pool = await getPool();
    await pool.request()
      .input('MaDaiLy', sql.Int, req.params.maDaiLy)
      .input('TenDaiLy', sql.NVarChar, TenDaiLy)
      .input('SoDienThoai', sql.NVarChar, SoDienThoai)
      .input('Email', sql.NVarChar, Email)
      .input('DiaChi', sql.NVarChar, DiaChi)
      .execute('sp_UpdateDaiLy');
    res.json({ message: 'Cập nhật đại lý thành công' });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

const remove = async (req, res) => {
  try {
    const pool = await getPool();
    await pool.request()
      .input('MaDaiLy', sql.Int, req.params.maDaiLy)
      .execute('sp_DeleteDaiLy');
    res.json({ message: 'Xóa đại lý thành công' });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

module.exports = { getProfile, getById, search, create, update, remove };
