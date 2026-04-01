const { getPool, sql } = require('../config/db');

const login = async (req, res) => {
  const { username, password, role } = req.body;
  console.log('LOGIN REQUEST:', { username, role }); // debug

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
    if (err.message?.includes('Sai') || err.message?.includes('khóa'))
      return res.status(401).json({ message: err.message });
    res.status(500).json({ message: err.message });
  }
};

module.exports = { login };
