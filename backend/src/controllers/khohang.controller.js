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

const capNhatTonKho = async (req, res) => {
  const { MaKho, MaLo, SoLuong } = req.body;
  if (MaKho == null || MaLo == null || SoLuong == null)
    return res.status(400).json({ message: 'Thiếu MaKho, MaLo hoặc SoLuong' });
  try {
    const pool = await getPool();
    await pool.request()
      .input('MaKho', sql.Int, MaKho)
      .input('MaLo', sql.Int, MaLo)
      .input('SoLuong', sql.Decimal(18, 2), SoLuong)
      .query('UPDATE TonKho SET SoLuong = @SoLuong, CapNhatCuoi = SYSDATETIME() WHERE MaKho = @MaKho AND MaLo = @MaLo');
    res.json({ message: 'Cập nhật tồn kho thành công' });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

const themTonKho = async (req, res) => {
  const { MaKho, MaLo, SoLuong } = req.body;
  if (!MaKho || !MaLo || !SoLuong)
    return res.status(400).json({ message: 'Thiếu MaKho, MaLo hoặc SoLuong' });
  try {
    const pool = await getPool();
    const exists = await pool.request()
      .input('MaKho', sql.Int, MaKho).input('MaLo', sql.Int, MaLo)
      .query('SELECT 1 FROM TonKho WHERE MaKho = @MaKho AND MaLo = @MaLo');
    if (exists.recordset.length > 0) {
      await pool.request()
        .input('MaKho', sql.Int, MaKho).input('MaLo', sql.Int, MaLo).input('SoLuong', sql.Decimal(18, 2), SoLuong)
        .query('UPDATE TonKho SET SoLuong = SoLuong + @SoLuong, CapNhatCuoi = SYSDATETIME() WHERE MaKho = @MaKho AND MaLo = @MaLo');
    } else {
      await pool.request()
        .input('MaKho', sql.Int, MaKho).input('MaLo', sql.Int, MaLo).input('SoLuong', sql.Decimal(18, 2), SoLuong)
        .query('INSERT INTO TonKho (MaKho, MaLo, SoLuong) VALUES (@MaKho, @MaLo, @SoLuong)');
    }
    res.status(201).json({ message: 'Thêm tồn kho thành công' });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

module.exports = { getAllKho, getKhoByDaiLy, getKhoBySieuThi, getKhoById, taoKho, capNhatKho, xoaKho, xoaTonKho, capNhatTonKho, themTonKho };
