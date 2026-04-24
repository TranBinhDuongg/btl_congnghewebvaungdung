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
    RAISERROR(N'Sai ten dang nhap hoac mat khau', 16, 1); RETURN;
  END

  IF @TrangThai != N'hoat_dong'
  BEGIN
    RAISERROR(N'Tai khoan da bi khoa', 16, 2); RETURN;
  END

  -- Kiểm tra role có khớp không
  IF @LoaiTaiKhoan != @LoaiYeuCau
  BEGIN
    RAISERROR(N'Loai tai khoan khong dung', 16, 3); RETURN;
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

-- =============================================
-- SP Reset Password
-- =============================================
CREATE OR ALTER PROCEDURE sp_ResetPassword
  @LoaiTaiKhoan NVARCHAR(20),
  @Email        NVARCHAR(100),
  @MatKhauMoi   NVARCHAR(255)
AS
BEGIN
  SET NOCOUNT ON;
  DECLARE @MaTaiKhoan INT;

  -- Tìm tài khoản theo email và loại
  IF @LoaiTaiKhoan = N'nongdan'
    SELECT @MaTaiKhoan = tk.MaTaiKhoan FROM TaiKhoan tk
    JOIN NongDan nd ON nd.MaTaiKhoan = tk.MaTaiKhoan
    WHERE nd.Email = @Email AND tk.LoaiTaiKhoan = @LoaiTaiKhoan;

  ELSE IF @LoaiTaiKhoan = N'daily'
    SELECT @MaTaiKhoan = tk.MaTaiKhoan FROM TaiKhoan tk
    JOIN DaiLy dl ON dl.MaTaiKhoan = tk.MaTaiKhoan
    WHERE dl.Email = @Email AND tk.LoaiTaiKhoan = @LoaiTaiKhoan;

  ELSE IF @LoaiTaiKhoan = N'sieuthi'
    SELECT @MaTaiKhoan = tk.MaTaiKhoan FROM TaiKhoan tk
    JOIN SieuThi st ON st.MaTaiKhoan = tk.MaTaiKhoan
    WHERE st.Email = @Email AND tk.LoaiTaiKhoan = @LoaiTaiKhoan;

  ELSE IF @LoaiTaiKhoan = N'admin'
    SELECT @MaTaiKhoan = tk.MaTaiKhoan FROM TaiKhoan tk
    JOIN Admin a ON a.MaTaiKhoan = tk.MaTaiKhoan
    WHERE a.Email = @Email AND tk.LoaiTaiKhoan = @LoaiTaiKhoan;

  IF @MaTaiKhoan IS NULL
  BEGIN
    SELECT 0 AS Success; RETURN;
  END

  UPDATE TaiKhoan SET MatKhau = @MatKhauMoi WHERE MaTaiKhoan = @MaTaiKhoan;
  SELECT 1 AS Success;
END;
GO

-- =============================================
-- SP Register - tạo TaiKhoan + bảng tương ứng
-- =============================================
CREATE OR ALTER PROCEDURE sp_Register
  @TenDangNhap  NVARCHAR(50),
  @MatKhau      NVARCHAR(255),
  @LoaiTaiKhoan NVARCHAR(20),
  @HoTen        NVARCHAR(100),
  @SoDienThoai  NVARCHAR(20)  = NULL,
  @Email        NVARCHAR(100) = NULL,
  @DiaChi       NVARCHAR(255) = NULL
AS
BEGIN
  SET NOCOUNT ON;
  BEGIN TRANSACTION;
  BEGIN TRY
    -- Kiểm tra trùng tên đăng nhập
    IF EXISTS (SELECT 1 FROM TaiKhoan WHERE TenDangNhap = @TenDangNhap)
    BEGIN
      RAISERROR(N'Tên đăng nhập đã tồn tại', 16, 1); RETURN;
    END

    -- Tạo tài khoản
    INSERT INTO TaiKhoan (TenDangNhap, MatKhau, LoaiTaiKhoan)
    VALUES (@TenDangNhap, @MatKhau, @LoaiTaiKhoan);

    DECLARE @MaTaiKhoan INT = SCOPE_IDENTITY();

    -- Tạo bảng tương ứng
    IF @LoaiTaiKhoan = N'nongdan'
      INSERT INTO NongDan (MaTaiKhoan, HoTen, SoDienThoai, Email, DiaChi)
      VALUES (@MaTaiKhoan, @HoTen, @SoDienThoai, @Email, @DiaChi);

    ELSE IF @LoaiTaiKhoan = N'daily'
      INSERT INTO DaiLy (MaTaiKhoan, TenDaiLy, SoDienThoai, Email, DiaChi)
      VALUES (@MaTaiKhoan, @HoTen, @SoDienThoai, @Email, @DiaChi);

    ELSE IF @LoaiTaiKhoan = N'sieuthi'
      INSERT INTO SieuThi (MaTaiKhoan, TenSieuThi, SoDienThoai, Email, DiaChi)
      VALUES (@MaTaiKhoan, @HoTen, @SoDienThoai, @Email, @DiaChi);

    ELSE IF @LoaiTaiKhoan = N'admin'
      INSERT INTO Admin (MaTaiKhoan, HoTen, SoDienThoai, Email)
      VALUES (@MaTaiKhoan, @HoTen, @SoDienThoai, @Email);

    COMMIT;
    SELECT @MaTaiKhoan AS MaTaiKhoan;
  END TRY
  BEGIN CATCH
    ROLLBACK;
    THROW;
  END CATCH
END;
GO
