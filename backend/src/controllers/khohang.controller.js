const { getPool, sql } = require('../config/db');

const getAllKho = async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request().execute('sp_GetAllKho');
    res.json(result.recordset);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

const getKhoByDaiLy = async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request()
      .input('MaDaiLy', sql.Int, req.params.maDaiLy)
      .execute('sp_GetKhoByDaiLy');
    res.json(result.recordset);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

const getKhoBySieuThi = async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request()
      .input('MaSieuThi', sql.Int, req.params.maSieuThi)
      .execute('sp_GetKhoBySieuThi');
    res.json(result.recordset);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

const getKhoById = async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request()
      .input('MaKho', sql.Int, req.params.maKho)
      .execute('sp_GetKhoById');
    if (!result.recordset[0]) return res.status(404).json({ message: 'Không tìm thấy kho' });
    res.json(result.recordset);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

const taoKho = async (req, res) => {
  const { LoaiKho, MaDaiLy, MaSieuThi, TenKho, DiaChi } = req.body;
  try {
    const pool = await getPool();
    const result = await pool.request()
      .input('LoaiKho', sql.NVarChar, LoaiKho)
      .input('MaDaiLy', sql.Int, MaDaiLy || null)
      .input('MaSieuThi', sql.Int, MaSieuThi || null)
      .input('TenKho', sql.NVarChar, TenKho)
      .input('DiaChi', sql.NVarChar, DiaChi)
      .execute('sp_TaoKho');
    res.status(201).json({ MaKho: result.recordset[0].MaKho, message: 'Tạo kho thành công' });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

const capNhatKho = async (req, res) => {
  const { MaKho, TenKho, DiaChi, TrangThai } = req.body;
  try {
    const pool = await getPool();
    await pool.request()
      .input('MaKho', sql.Int, MaKho)
      .input('TenKho', sql.NVarChar, TenKho)
      .input('DiaChi', sql.NVarChar, DiaChi)
      .input('TrangThai', sql.NVarChar, TrangThai)
      .execute('sp_CapNhatKho');
    res.json({ message: 'Cập nhật kho thành công' });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

const xoaKho = async (req, res) => {
  try {
    const pool = await getPool();
    await pool.request()
      .input('MaKho', sql.Int, req.params.maKho)
      .execute('sp_XoaKho');
    res.json({ message: 'Xóa kho thành công' });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

const xoaTonKho = async (req, res) => {
  const { MaKho, MaLo } = req.body;
  try {
    const pool = await getPool();
    await pool.request()
      .input('MaKho', sql.Int, MaKho)
      .input('MaLo', sql.Int, MaLo)
      .execute('sp_XoaTonKho');
    res.json({ message: 'Xóa tồn kho thành công' });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

module.exports = { getAllKho, getKhoByDaiLy, getKhoBySieuThi, getKhoById, taoKho, capNhatKho, xoaKho, xoaTonKho };
