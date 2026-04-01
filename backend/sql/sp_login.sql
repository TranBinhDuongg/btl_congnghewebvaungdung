-- =============================================
-- SP Login dùng bảng TaiKhoan tập trung + kiểm tra role
-- =============================================
CREATE OR ALTER PROCEDURE sp_Login
  @TenDangNhap NVARCHAR(50),
  @MatKhau     NVARCHAR(255),
  @LoaiYeuCau  NVARCHAR(20)  -- role người dùng chọn
AS
BEGIN
  SET NOCOUNT ON;

  DECLARE @MaTaiKhoan INT, @LoaiTaiKhoan NVARCHAR(20), @TrangThai NVARCHAR(20);

  SELECT @MaTaiKhoan   = MaTaiKhoan,
         @LoaiTaiKhoan = LoaiTaiKhoan,
         @TrangThai    = TrangThai
  FROM TaiKhoan
  WHERE TenDangNhap = @TenDangNhap
    AND MatKhau     = @MatKhau;

  IF @MaTaiKhoan IS NULL
  BEGIN
    RAISERROR(N'Sai tên đăng nhập hoặc mật khẩu', 16, 1); RETURN;
  END

  IF @TrangThai != N'hoat_dong'
  BEGIN
    RAISERROR(N'Tài khoản đã bị khóa', 16, 1); RETURN;
  END

  -- Kiểm tra role có khớp không
  IF @LoaiTaiKhoan != @LoaiYeuCau
  BEGIN
    RAISERROR(N'Loại tài khoản không đúng', 16, 1); RETURN;
  END

  UPDATE TaiKhoan SET LanDangNhapCuoi = SYSDATETIME() WHERE MaTaiKhoan = @MaTaiKhoan;

  IF @LoaiTaiKhoan = N'nongdan'
    SELECT tk.MaTaiKhoan, tk.TenDangNhap, tk.LoaiTaiKhoan,
           nd.MaNongDan AS MaDoiTuong, nd.HoTen AS TenHienThi,
           nd.Email, nd.SoDienThoai, nd.DiaChi
    FROM TaiKhoan tk JOIN NongDan nd ON nd.MaTaiKhoan = tk.MaTaiKhoan
    WHERE tk.MaTaiKhoan = @MaTaiKhoan;

  ELSE IF @LoaiTaiKhoan = N'daily'
    SELECT tk.MaTaiKhoan, tk.TenDangNhap, tk.LoaiTaiKhoan,
           dl.MaDaiLy AS MaDoiTuong, dl.TenDaiLy AS TenHienThi,
           dl.Email, dl.SoDienThoai, dl.DiaChi
    FROM TaiKhoan tk JOIN DaiLy dl ON dl.MaTaiKhoan = tk.MaTaiKhoan
    WHERE tk.MaTaiKhoan = @MaTaiKhoan;

  ELSE IF @LoaiTaiKhoan = N'sieuthi'
    SELECT tk.MaTaiKhoan, tk.TenDangNhap, tk.LoaiTaiKhoan,
           st.MaSieuThi AS MaDoiTuong, st.TenSieuThi AS TenHienThi,
           st.Email, st.SoDienThoai, st.DiaChi
    FROM TaiKhoan tk JOIN SieuThi st ON st.MaTaiKhoan = tk.MaTaiKhoan
    WHERE tk.MaTaiKhoan = @MaTaiKhoan;

  ELSE IF @LoaiTaiKhoan = N'admin'
    SELECT tk.MaTaiKhoan, tk.TenDangNhap, tk.LoaiTaiKhoan,
           a.MaAdmin AS MaDoiTuong, a.HoTen AS TenHienThi,
           a.Email, a.SoDienThoai, NULL AS DiaChi
    FROM TaiKhoan tk JOIN Admin a ON a.MaTaiKhoan = tk.MaTaiKhoan
    WHERE tk.MaTaiKhoan = @MaTaiKhoan;
END;
GO
