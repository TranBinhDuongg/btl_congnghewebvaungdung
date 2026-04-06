CREATE OR ALTER PROCEDURE sp_UpdateProfile
  @MaTaiKhoan  INT,
  @HoTen       NVARCHAR(100),
  @SoDienThoai NVARCHAR(20)  = NULL,
  @Email       NVARCHAR(100) = NULL,
  @DiaChi      NVARCHAR(255) = NULL
AS
BEGIN
  SET NOCOUNT ON;
  DECLARE @LoaiTaiKhoan NVARCHAR(20);
  SELECT @LoaiTaiKhoan = LoaiTaiKhoan FROM TaiKhoan WHERE MaTaiKhoan = @MaTaiKhoan;
  IF @LoaiTaiKhoan IS NULL RAISERROR(N'Tài khoản không tồn tại', 16, 1);

  IF @LoaiTaiKhoan = N'nongdan'
    UPDATE NongDan SET HoTen=@HoTen, SoDienThoai=@SoDienThoai, Email=@Email, DiaChi=@DiaChi
    WHERE MaTaiKhoan = @MaTaiKhoan;
  ELSE IF @LoaiTaiKhoan = N'daily'
    UPDATE DaiLy SET TenDaiLy=@HoTen, SoDienThoai=@SoDienThoai, Email=@Email, DiaChi=@DiaChi
    WHERE MaTaiKhoan = @MaTaiKhoan;
  ELSE IF @LoaiTaiKhoan = N'sieuthi'
    UPDATE SieuThi SET TenSieuThi=@HoTen, SoDienThoai=@SoDienThoai, Email=@Email, DiaChi=@DiaChi
    WHERE MaTaiKhoan = @MaTaiKhoan;
  ELSE IF @LoaiTaiKhoan = N'admin'
    UPDATE Admin SET HoTen=@HoTen, SoDienThoai=@SoDienThoai, Email=@Email
    WHERE MaTaiKhoan = @MaTaiKhoan;

  SELECT 1 AS Success;
END;
GO
