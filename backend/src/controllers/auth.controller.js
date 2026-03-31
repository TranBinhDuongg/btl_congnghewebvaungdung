const { getPool, sql } = require('../config/db');

// Map loại tài khoản → stored procedure + tên trường ID trả về
const ROLE_CONFIG = {
  nongdan: { sp: 'sp_LoginNongDan',  idField: 'MaNongDan',  nameField: 'HoTen'     },
  daily:   { sp: 'sp_LoginDaiLy',    idField: 'MaDaiLy',    nameField: 'TenDaiLy'  },
  sieuthi: { sp: 'sp_LoginSieuThi',  idField: 'MaSieuThi',  nameField: 'TenSieuThi'},
  admin:   { sp: 'sp_LoginAdmin',    idField: 'MaAdmin',    nameField: 'HoTen'     },
};

const login = async (req, res) => {
  const { accountType, username, password } = req.body;

  if (!accountType || !username || !password)
    return res.status(400).json({ message: 'Thiếu thông tin đăng nhập' });

  const cfg = ROLE_CONFIG[accountType];
  if (!cfg)
    return res.status(400).json({ message: 'Loại tài khoản không hợp lệ' });

  try {
    const pool = await getPool();
    const result = await pool.request()
      .input('TenDangNhap', sql.NVarChar, username.trim())
      .input('MatKhau',     sql.NVarChar, password)
      .execute(cfg.sp);

    const row = result.recordset?.[0];
    if (!row) return res.status(401).json({ message: 'Sai tên đăng nhập hoặc mật khẩu' });

    res.json({
      id:       row[cfg.idField],
      fullName: row[cfg.nameField],
      username: row.TenDangNhap,
      role:     accountType,
    });
  } catch (err) {
    // SP trả lỗi RAISERROR khi sai mật khẩu
    if (err.message?.includes('sai') || err.message?.includes('không tìm thấy') || err.number === 50001)
      return res.status(401).json({ message: 'Sai tên đăng nhập hoặc mật khẩu' });
    res.status(500).json({ message: err.message });
  }
};

module.exports = { login };
