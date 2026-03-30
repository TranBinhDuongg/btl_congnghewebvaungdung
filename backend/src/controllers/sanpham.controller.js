const { getPool, sql } = require('../config/db');

const getAll = async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request().execute('sp_GetAllSanPham');
    res.json(result.recordset);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

const getById = async (req, res) => {
  const id = parseInt(req.params.id);
  if (!id || id <= 0) return res.status(400).json({ message: 'ID không hợp lệ' });
  try {
    const pool = await getPool();
    const result = await pool.request()
      .input('MaSanPham', sql.Int, id)
      .execute('sp_GetSanPhamById');
    if (!result.recordset[0]) return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });
    res.json(result.recordset[0]);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

const create = async (req, res) => {
  const { TenSanPham, DonVi, MoTa } = req.body;
  if (!TenSanPham?.trim()) return res.status(400).json({ message: 'TenSanPham không được để trống' });
  try {
    const pool = await getPool();
    const result = await pool.request()
      .input('TenSanPham', sql.NVarChar, TenSanPham.trim())
      .input('DonVi', sql.NVarChar, DonVi || null)
      .input('MoTa', sql.NVarChar, MoTa || null)
      .execute('sp_CreateSanPham');
    res.status(201).json({ MaSanPham: result.recordset[0].MaSanPham, message: 'Tạo sản phẩm thành công' });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

const update = async (req, res) => {
  const id = parseInt(req.params.id);
  if (!id || id <= 0) return res.status(400).json({ message: 'ID không hợp lệ' });
  const { TenSanPham, DonVi, MoTa } = req.body;
  if (!TenSanPham?.trim()) return res.status(400).json({ message: 'TenSanPham không được để trống' });
  try {
    const pool = await getPool();
    const check = await pool.request().input('MaSanPham', sql.Int, id).execute('sp_GetSanPhamById');
    if (!check.recordset[0]) return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });
    await pool.request()
      .input('MaSanPham', sql.Int, id)
      .input('TenSanPham', sql.NVarChar, TenSanPham.trim())
      .input('DonVi', sql.NVarChar, DonVi || null)
      .input('MoTa', sql.NVarChar, MoTa || null)
      .execute('sp_UpdateSanPham');
    res.json({ message: 'Cập nhật sản phẩm thành công' });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

const remove = async (req, res) => {
  const id = parseInt(req.params.id);
  if (!id || id <= 0) return res.status(400).json({ message: 'ID không hợp lệ' });
  try {
    const pool = await getPool();
    const check = await pool.request().input('MaSanPham', sql.Int, id).execute('sp_GetSanPhamById');
    if (!check.recordset[0]) return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });
    await pool.request().input('MaSanPham', sql.Int, id).execute('sp_DeleteSanPham');
    res.json({ message: 'Xóa sản phẩm thành công' });
  } catch (err) {
    if (err.message.includes('REFERENCE') || err.message.includes('FK_'))
      return res.status(409).json({ message: 'Không thể xóa sản phẩm đang được sử dụng' });
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getAll, getById, create, update, remove };
