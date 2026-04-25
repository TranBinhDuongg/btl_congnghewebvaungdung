const { getPool, sql } = require('../config/db');

// Nhập hàng thủ công vào kho đại lý
const nhapKho = async (req, res) => {
  const { MaKho, MaLo, SoLuong, MaDonHang } = req.body;
  try {
    const pool = await getPool();
    const result = await pool.request()
      .input('MaKho',     sql.Int,          MaKho)
      .input('MaLo',      sql.Int,          MaLo)
      .input('SoLuong',   sql.Decimal(18,2), SoLuong)
      .input('MaDonHang', sql.Int,          MaDonHang || null)
      .execute('sp_NhapKhoDaiLy');
    res.json({ message: result.recordset[0]?.Message || 'Nhập kho thành công' });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// Xuất hàng thủ công khỏi kho đại lý
const xuatKho = async (req, res) => {
  const { MaKho, MaLo, SoLuong, MaDonHang } = req.body;
  try {
    const pool = await getPool();
    const result = await pool.request()
      .input('MaKho',     sql.Int,          MaKho)
      .input('MaLo',      sql.Int,          MaLo)
      .input('SoLuong',   sql.Decimal(18,2), SoLuong)
      .input('MaDonHang', sql.Int,          MaDonHang || null)
      .execute('sp_XuatKhoDaiLy');
    res.json({ message: result.recordset[0]?.Message || 'Xuất kho thành công' });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// Xem tồn kho theo đại lý
const getTonKho = async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request()
      .input('MaDaiLy', sql.Int, req.params.maDaiLy)
      .execute('sp_GetTonKhoDaiLy');
    res.json(result.recordset);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// Nhập kho hàng loạt từ đơn hàng daily_to_nongdan
const nhapKhoTuDonHang = async (req, res) => {
  const { MaDonHang, MaKho } = req.body;
  try {
    const pool = await getPool();
    const result = await pool.request()
      .input('MaDonHang', sql.Int, MaDonHang)
      .input('MaKho',     sql.Int, MaKho)
      .execute('sp_NhapKhoTuDonHang');
    res.json({ message: result.recordset[0]?.Message || 'Nhập kho thành công' });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// Xuất kho hàng loạt từ đơn hàng sieuthi_to_daily
const xuatKhoTuDonHang = async (req, res) => {
  const { MaDonHang, MaKho } = req.body;
  try {
    const pool = await getPool();
    const result = await pool.request()
      .input('MaDonHang', sql.Int, MaDonHang)
      .input('MaKho',     sql.Int, MaKho)
      .execute('sp_XuatKhoTuDonHang');
    res.json({ message: result.recordset[0]?.Message || 'Xuất kho thành công' });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

module.exports = { nhapKho, xuatKho, getTonKho, nhapKhoTuDonHang, xuatKhoTuDonHang };
