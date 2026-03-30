const { getPool, sql } = require('../config/db');

const getAll = async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request().execute('sp_GetAllLoNongSan');
    res.json(result.recordset);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

const getById = async (req, res) => {
  const id = parseInt(req.params.id);
  if (!id || id <= 0) return res.status(400).json({ message: 'ID không hợp lệ' });
  try {
    const pool = await getPool();
    const result = await pool.request()
      .input('MaLo', sql.Int, id)
      .execute('sp_GetLoNongSanById');
    if (!result.recordset[0]) return res.status(404).json({ message: 'Không tìm thấy lô nông sản' });
    res.json(result.recordset[0]);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

const getByTrangTrai = async (req, res) => {
  const maTrangTrai = parseInt(req.params.maTrangTrai);
  if (!maTrangTrai || maTrangTrai <= 0) return res.status(400).json({ message: 'MaTrangTrai không hợp lệ' });
  try {
    const pool = await getPool();
    const result = await pool.request()
      .input('MaTrangTrai', sql.Int, maTrangTrai)
      .execute('sp_GetLoNongSanByTrangTrai');
    res.json(result.recordset);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

const getByNongDan = async (req, res) => {
  const maNongDan = parseInt(req.params.maNongDan);
  if (!maNongDan || maNongDan <= 0) return res.status(400).json({ message: 'MaNongDan không hợp lệ' });
  try {
    const pool = await getPool();
    const result = await pool.request()
      .input('MaNongDan', sql.Int, maNongDan)
      .execute('sp_GetLoNongSanByNongDan');
    res.json(result.recordset);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

const create = async (req, res) => {
  const { MaTrangTrai, MaSanPham, SoLuongBanDau, NgayThuHoach, HanSuDung, SoChungNhanLo, MaQR } = req.body;
  if (!MaTrangTrai || MaTrangTrai <= 0) return res.status(400).json({ message: 'MaTrangTrai không hợp lệ' });
  if (!MaSanPham || MaSanPham <= 0) return res.status(400).json({ message: 'MaSanPham không hợp lệ' });
  if (!SoLuongBanDau || SoLuongBanDau <= 0) return res.status(400).json({ message: 'SoLuongBanDau phải lớn hơn 0' });
  if (NgayThuHoach && isNaN(Date.parse(NgayThuHoach))) return res.status(400).json({ message: 'NgayThuHoach không hợp lệ' });
  if (HanSuDung && isNaN(Date.parse(HanSuDung))) return res.status(400).json({ message: 'HanSuDung không hợp lệ' });
  try {
    const pool = await getPool();
    const result = await pool.request()
      .input('MaTrangTrai', sql.Int, MaTrangTrai)
      .input('MaSanPham', sql.Int, MaSanPham)
      .input('SoLuongBanDau', sql.Decimal(18, 2), SoLuongBanDau)
      .input('NgayThuHoach', sql.Date, NgayThuHoach || null)
      .input('HanSuDung', sql.Date, HanSuDung || null)
      .input('SoChungNhanLo', sql.NVarChar, SoChungNhanLo || null)
      .input('MaQR', sql.NVarChar, MaQR || null)
      .execute('sp_CreateLoNongSan');
    res.status(201).json({ MaLo: result.recordset[0].MaLo, message: 'Tạo lô thành công' });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

const update = async (req, res) => {
  const id = parseInt(req.params.id);
  if (!id || id <= 0) return res.status(400).json({ message: 'ID không hợp lệ' });
  const { SoLuongHienTai, HanSuDung, TrangThai } = req.body;
  if (SoLuongHienTai !== undefined && SoLuongHienTai < 0) return res.status(400).json({ message: 'SoLuongHienTai không được âm' });
  if (HanSuDung && isNaN(Date.parse(HanSuDung))) return res.status(400).json({ message: 'HanSuDung không hợp lệ' });
  try {
    const pool = await getPool();
    const check = await pool.request().input('MaLo', sql.Int, id).execute('sp_GetLoNongSanById');
    if (!check.recordset[0]) return res.status(404).json({ message: 'Không tìm thấy lô nông sản' });
    await pool.request()
      .input('MaLo', sql.Int, id)
      .input('SoLuongHienTai', sql.Decimal(18, 2), SoLuongHienTai ?? null)
      .input('HanSuDung', sql.Date, HanSuDung || null)
      .input('TrangThai', sql.NVarChar, TrangThai || null)
      .execute('sp_UpdateLoNongSan');
    res.json({ message: 'Cập nhật lô thành công' });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

const remove = async (req, res) => {
  const id = parseInt(req.params.id);
  if (!id || id <= 0) return res.status(400).json({ message: 'ID không hợp lệ' });
  try {
    const pool = await getPool();
    const check = await pool.request().input('MaLo', sql.Int, id).execute('sp_GetLoNongSanById');
    if (!check.recordset[0]) return res.status(404).json({ message: 'Không tìm thấy lô nông sản' });
    await pool.request().input('MaLo', sql.Int, id).execute('sp_DeleteLoNongSan');
    res.json({ message: 'Xóa lô thành công' });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

module.exports = { getAll, getById, getByTrangTrai, getByNongDan, create, update, remove };
