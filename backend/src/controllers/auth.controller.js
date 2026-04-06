const { getPool, sql } = require('../config/db');

const login = async (req, res) => {
  const { username, password, role } = req.body;
  if (!username || !password)
    return res.status(400).json({ message: 'Thiếu tên đăng nhập hoặc mật khẩu' });
  if (!role)
    return res.status(400).json({ message: 'Vui lòng chọn loại tài khoản' });
  try {
    const pool = await getPool();
    const result = await pool.request()
      .input('TenDangNhap', sql.NVarChar(50),  username.trim())
      .input('MatKhau',     sql.NVarChar(255), password)
      .input('LoaiYeuCau',  sql.NVarChar(20),  role)
      .execute('sp_Login');
    const row = result.recordset?.[0];
    if (!row) return res.status(401).json({ message: 'Sai tên đăng nhập hoặc mật khẩu' });
    res.json({
      maTaiKhoan:  row.MaTaiKhoan,
      maDoiTuong:  row.MaDoiTuong,
      tenHienThi:  row.TenHienThi,
      username:    row.TenDangNhap,
      role:        row.LoaiTaiKhoan,
      email:       row.Email,
      soDienThoai: row.SoDienThoai,
      diaChi:      row.DiaChi,
    });
  } catch (err) {
    if (err.message?.includes('Sai') || err.message?.includes('khóa') || err.message?.includes('không đúng'))
      return res.status(401).json({ message: err.message });
    res.status(500).json({ message: err.message });
  }
};

const register = async (req, res) => {
  const { role, username, password, fullName, phone, email, address,
          companyName, storeName } = req.body;
  if (!role || !username || !password || !fullName)
    return res.status(400).json({ message: 'Thiếu thông tin bắt buộc' });
  try {
    const pool = await getPool();
    // Tên hiển thị theo role
    const tenHienThi = role === 'daily'   ? (companyName || fullName)
                     : role === 'sieuthi' ? (storeName   || fullName)
                     : fullName;
    const result = await pool.request()
      .input('TenDangNhap',   sql.NVarChar(50),  username.trim())
      .input('MatKhau',       sql.NVarChar(255), password)
      .input('LoaiTaiKhoan',  sql.NVarChar(20),  role)
      .input('HoTen',         sql.NVarChar(100), tenHienThi)
      .input('SoDienThoai',   sql.NVarChar(20),  phone   || null)
      .input('Email',         sql.NVarChar(100), email   || null)
      .input('DiaChi',        sql.NVarChar(255), address || null)
      .execute('sp_Register');
    res.status(201).json({ message: 'Đăng ký thành công', maTaiKhoan: result.recordset?.[0]?.MaTaiKhoan });
  } catch (err) {
    if (err.message?.includes('duplicate') || err.message?.includes('UNIQUE') || err.message?.includes('tồn tại'))
      return res.status(409).json({ message: 'Tên đăng nhập đã tồn tại' });
    res.status(500).json({ message: err.message });
  }
};

const resetPassword = async (req, res) => {
  const { role, email, newPassword } = req.body;
  if (!role || !email || !newPassword)
    return res.status(400).json({ message: 'Thiếu thông tin' });
  try {
    const pool = await getPool();
    const result = await pool.request()
      .input('LoaiTaiKhoan', sql.NVarChar(20),  role)
      .input('Email',        sql.NVarChar(100), email.trim())
      .input('MatKhauMoi',   sql.NVarChar(255), newPassword)
      .execute('sp_ResetPassword');
    const row = result.recordset?.[0];
    if (!row?.Success) return res.status(404).json({ message: 'Không tìm thấy tài khoản với email này' });
    res.json({ message: 'Đặt lại mật khẩu thành công' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const updateProfile = async (req, res) => {
  const { maTaiKhoan, hoTen, soDienThoai, email, diaChi } = req.body;
  if (!maTaiKhoan || !hoTen)
    return res.status(400).json({ message: 'Thiếu thông tin bắt buộc' });
  try {
    const pool = await getPool();
    await pool.request()
      .input('MaTaiKhoan',  sql.Int,           maTaiKhoan)
      .input('HoTen',       sql.NVarChar(100), hoTen.trim())
      .input('SoDienThoai', sql.NVarChar(20),  soDienThoai || null)
      .input('Email',       sql.NVarChar(100), email       || null)
      .input('DiaChi',      sql.NVarChar(255), diaChi      || null)
      .execute('sp_UpdateProfile');
    res.json({ message: 'Cập nhật thành công', tenHienThi: hoTen.trim(), soDienThoai, email, diaChi });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { login, register, resetPassword, updateProfile };
