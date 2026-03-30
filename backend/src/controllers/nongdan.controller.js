const { getPool, sql } = require('../config/db');

// ===================== NONG DAN =====================
const getAll = async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request().execute('sp_GetAllNongDan');
    res.json(result.recordset);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

const getById = async (req, res) => {
  const id = parseInt(req.params.id);
  if (!id || id <= 0) return res.status(400).json({ message: 'ID không hợp lệ' });
  try {
    const pool = await getPool();
    const result = await pool.request()
      .input('MaNongDan', sql.Int, id)
      .execute('sp_GetNongDanById');
    if (!result.recordset[0]) return res.status(404).json({ message: 'Không tìm thấy nông dân' });
    res.json(result.recordset[0]);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

const create = async (req, res) => {
  const { TenDangNhap, MatKhauHash, HoTen, SoDienThoai, Email, DiaChi } = req.body;
  if (!TenDangNhap?.trim()) return res.status(400).json({ message: 'TenDangNhap không được để trống' });
  if (!MatKhauHash?.trim()) return res.status(400).json({ message: 'MatKhauHash không được để trống' });
  if (!HoTen?.trim()) return res.status(400).json({ message: 'HoTen không được để trống' });
  if (Email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(Email)) return res.status(400).json({ message: 'Email không hợp lệ' });
  if (SoDienThoai && !/^\d{9,11}$/.test(SoDienThoai)) return res.status(400).json({ message: 'Số điện thoại không hợp lệ' });
  try {
    const pool = await getPool();
    const result = await pool.request()
      .input('TenDangNhap', sql.NVarChar, TenDangNhap.trim())
      .input('MatKhauHash', sql.NVarChar, MatKhauHash.trim())
      .input('HoTen', sql.NVarChar, HoTen.trim())
      .input('SoDienThoai', sql.NVarChar, SoDienThoai || null)
      .input('Email', sql.NVarChar, Email || null)
      .input('DiaChi', sql.NVarChar, DiaChi || null)
      .execute('sp_CreateNongDan');
    res.status(201).json({ MaNongDan: result.recordset[0].MaNongDan, message: 'Tạo nông dân thành công' });
  } catch (err) {
    if (err.message.includes('duplicate') || err.message.includes('UNIQUE') || err.message.includes('Violation'))
      return res.status(409).json({ message: 'Tên đăng nhập đã tồn tại' });
    res.status(500).json({ message: err.message });
  }
};

const update = async (req, res) => {
  const id = parseInt(req.params.id);
  if (!id || id <= 0) return res.status(400).json({ message: 'ID không hợp lệ' });
  const { HoTen, SoDienThoai, Email, DiaChi } = req.body;
  if (!HoTen?.trim()) return res.status(400).json({ message: 'HoTen không được để trống' });
  if (Email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(Email)) return res.status(400).json({ message: 'Email không hợp lệ' });
  if (SoDienThoai && !/^\d{9,11}$/.test(SoDienThoai)) return res.status(400).json({ message: 'Số điện thoại không hợp lệ' });
  try {
    const pool = await getPool();
    const check = await pool.request().input('MaNongDan', sql.Int, id).execute('sp_GetNongDanById');
    if (!check.recordset[0]) return res.status(404).json({ message: 'Không tìm thấy nông dân' });
    await pool.request()
      .input('MaNongDan', sql.Int, id)
      .input('HoTen', sql.NVarChar, HoTen.trim())
      .input('SoDienThoai', sql.NVarChar, SoDienThoai || null)
      .input('Email', sql.NVarChar, Email || null)
      .input('DiaChi', sql.NVarChar, DiaChi || null)
      .execute('sp_UpdateNongDan');
    res.json({ message: 'Cập nhật thành công' });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

const remove = async (req, res) => {
  const id = parseInt(req.params.id);
  if (!id || id <= 0) return res.status(400).json({ message: 'ID không hợp lệ' });
  try {
    const pool = await getPool();
    const check = await pool.request().input('MaNongDan', sql.Int, id).execute('sp_GetNongDanById');
    if (!check.recordset[0]) return res.status(404).json({ message: 'Không tìm thấy nông dân' });
    await pool.request().input('MaNongDan', sql.Int, id).execute('sp_DeleteNongDan');
    res.json({ message: 'Xóa nông dân thành công' });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// ===================== TRANG TRAI =====================
const getAllTrangTrai = async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request().execute('sp_GetAllTrangTrai');
    res.json(result.recordset);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

const getTrangTraiById = async (req, res) => {
  const id = parseInt(req.params.id);
  if (!id || id <= 0) return res.status(400).json({ message: 'ID không hợp lệ' });
  try {
    const pool = await getPool();
    const result = await pool.request()
      .input('MaTrangTrai', sql.Int, id)
      .execute('sp_GetTrangTraiById');
    if (!result.recordset[0]) return res.status(404).json({ message: 'Không tìm thấy trang trại' });
    res.json(result.recordset[0]);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

const getTrangTraiByNongDan = async (req, res) => {
  const maNongDan = parseInt(req.params.maNongDan);
  if (!maNongDan || maNongDan <= 0) return res.status(400).json({ message: 'MaNongDan không hợp lệ' });
  try {
    const pool = await getPool();
    const result = await pool.request()
      .input('MaNongDan', sql.Int, maNongDan)
      .execute('sp_GetTrangTraiByNongDan');
    res.json(result.recordset);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

const createTrangTrai = async (req, res) => {
  const { MaNongDan, TenTrangTrai, DiaChi, SoChungNhan } = req.body;
  if (!MaNongDan || MaNongDan <= 0) return res.status(400).json({ message: 'MaNongDan không hợp lệ' });
  if (!TenTrangTrai?.trim()) return res.status(400).json({ message: 'TenTrangTrai không được để trống' });
  try {
    const pool = await getPool();
    const ndCheck = await pool.request().input('MaNongDan', sql.Int, MaNongDan).execute('sp_GetNongDanById');
    if (!ndCheck.recordset[0]) return res.status(404).json({ message: 'Không tìm thấy nông dân' });
    const result = await pool.request()
      .input('MaNongDan', sql.Int, MaNongDan)
      .input('TenTrangTrai', sql.NVarChar, TenTrangTrai.trim())
      .input('DiaChi', sql.NVarChar, DiaChi || null)
      .input('SoChungNhan', sql.NVarChar, SoChungNhan || null)
      .execute('sp_CreateTrangTraiV2');
    res.status(201).json({ MaTrangTrai: result.recordset[0].MaTrangTrai, message: 'Tạo trang trại thành công' });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

const updateTrangTrai = async (req, res) => {
  const id = parseInt(req.params.id);
  if (!id || id <= 0) return res.status(400).json({ message: 'ID không hợp lệ' });
  const { TenTrangTrai, DiaChi, SoChungNhan } = req.body;
  if (!TenTrangTrai?.trim()) return res.status(400).json({ message: 'TenTrangTrai không được để trống' });
  try {
    const pool = await getPool();
    const check = await pool.request().input('MaTrangTrai', sql.Int, id).execute('sp_GetTrangTraiById');
    if (!check.recordset[0]) return res.status(404).json({ message: 'Không tìm thấy trang trại' });
    await pool.request()
      .input('MaTrangTrai', sql.Int, id)
      .input('TenTrangTrai', sql.NVarChar, TenTrangTrai.trim())
      .input('DiaChi', sql.NVarChar, DiaChi || null)
      .input('SoChungNhan', sql.NVarChar, SoChungNhan || null)
      .execute('sp_UpdateTrangTraiV2');
    res.json({ message: 'Cập nhật trang trại thành công' });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

const deleteTrangTrai = async (req, res) => {
  const id = parseInt(req.params.id);
  if (!id || id <= 0) return res.status(400).json({ message: 'ID không hợp lệ' });
  try {
    const pool = await getPool();
    const check = await pool.request().input('MaTrangTrai', sql.Int, id).execute('sp_GetTrangTraiById');
    if (!check.recordset[0]) return res.status(404).json({ message: 'Không tìm thấy trang trại' });
    await pool.request().input('MaTrangTrai', sql.Int, id).execute('sp_DeleteTrangTrai');
    res.json({ message: 'Xóa trang trại thành công' });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

module.exports = {
  getAll, getById, create, update, remove,
  getAllTrangTrai, getTrangTraiById, getTrangTraiByNongDan, createTrangTrai, updateTrangTrai, deleteTrangTrai,
};
