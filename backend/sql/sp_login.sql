-- =============================================
-- SP Login cho từng loại tài khoản
-- Trả về thông tin user nếu đúng, RAISERROR nếu sai
-- =============================================

-- 1. Nông dân
CREATE OR ALTER PROCEDURE sp_LoginNongDan
  @TenDangNhap NVARCHAR(100),
  @MatKhau     NVARCHAR(255)
AS
BEGIN
  SET NOCOUNT ON;
  SELECT MaNongDan, TenDangNhap, HoTen, Email, SoDienThoai, DiaChi
  FROM NongDan
  WHERE TenDangNhap = @TenDangNhap
    AND MatKhauHash = @MatKhau;
END;
GO

-- 2. Đại lý
CREATE OR ALTER PROCEDURE sp_LoginDaiLy
  @TenDangNhap NVARCHAR(100),
  @MatKhau     NVARCHAR(255)
AS
BEGIN
  SET NOCOUNT ON;
  SELECT MaDaiLy, TenDangNhap, TenDaiLy, Email, SoDienThoai, DiaChi
  FROM DaiLy
  WHERE TenDangNhap = @TenDangNhap
    AND MatKhauHash = @MatKhau;
END;
GO

-- 3. Siêu thị
CREATE OR ALTER PROCEDURE sp_LoginSieuThi
  @TenDangNhap NVARCHAR(100),
  @MatKhau     NVARCHAR(255)
AS
BEGIN
  SET NOCOUNT ON;
  SELECT MaSieuThi, TenDangNhap, TenSieuThi, Email, SoDienThoai, DiaChi
  FROM SieuThi
  WHERE TenDangNhap = @TenDangNhap
    AND MatKhauHash = @MatKhau;
END;
GO

-- 4. Admin (nếu có bảng Admin, nếu không thì dùng NongDan với role check)
CREATE OR ALTER PROCEDURE sp_LoginAdmin
  @TenDangNhap NVARCHAR(100),
  @MatKhau     NVARCHAR(255)
AS
BEGIN
  SET NOCOUNT ON;
  SELECT MaNongDan AS MaAdmin, TenDangNhap, HoTen
  FROM NongDan
  WHERE TenDangNhap = @TenDangNhap
    AND MatKhauHash = @MatKhau;
END;
GO
