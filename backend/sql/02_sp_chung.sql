-- ============================================================================
-- 02. STORED PROCEDURES DÙNG CHUNG
-- Auth (login, register, reset password, update profile) + SanPham
-- ============================================================================
USE btl;
GO

-- ===================== AUTH =====================

CREATE OR ALTER PROCEDURE sp_Login
    @TenDangNhap NVARCHAR(50),
    @MatKhau     NVARCHAR(255),
    @LoaiYeuCau  NVARCHAR(20)
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @MaTaiKhoan INT, @LoaiTaiKhoan NVARCHAR(20), @TrangThai NVARCHAR(20);

    SELECT @MaTaiKhoan = MaTaiKhoan, @LoaiTaiKhoan = LoaiTaiKhoan, @TrangThai = TrangThai
    FROM TaiKhoan
    WHERE TenDangNhap = @TenDangNhap AND MatKhau = @MatKhau;

    IF @MaTaiKhoan IS NULL  RAISERROR(N'Sai ten dang nhap hoac mat khau', 16, 1);
    IF @TrangThai != N'hoat_dong' RAISERROR(N'Tai khoan da bi khoa', 16, 2);
    IF @LoaiTaiKhoan != @LoaiYeuCau RAISERROR(N'Loai tai khoan khong dung', 16, 3);

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
        IF EXISTS (SELECT 1 FROM TaiKhoan WHERE TenDangNhap = @TenDangNhap)
            RAISERROR(N'Tên đăng nhập đã tồn tại', 16, 1);

        INSERT INTO TaiKhoan (TenDangNhap, MatKhau, LoaiTaiKhoan)
        VALUES (@TenDangNhap, @MatKhau, @LoaiTaiKhoan);

        DECLARE @MaTaiKhoan INT = SCOPE_IDENTITY();

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
        ROLLBACK; THROW;
    END CATCH
END;
GO

CREATE OR ALTER PROCEDURE sp_ResetPassword
    @LoaiTaiKhoan NVARCHAR(20),
    @Email        NVARCHAR(100),
    @MatKhauMoi   NVARCHAR(255)
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @MaTaiKhoan INT;

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

    IF @MaTaiKhoan IS NULL BEGIN SELECT 0 AS Success; RETURN; END

    UPDATE TaiKhoan SET MatKhau = @MatKhauMoi WHERE MaTaiKhoan = @MaTaiKhoan;
    SELECT 1 AS Success;
END;
GO

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

-- ===================== SAN PHAM =====================

CREATE OR ALTER PROCEDURE sp_GetAllSanPham
AS BEGIN
    SELECT MaSanPham, TenSanPham, DonViTinh, MoTa FROM SanPham ORDER BY TenSanPham
END
GO

CREATE OR ALTER PROCEDURE sp_GetSanPhamById
    @MaSanPham INT
AS BEGIN
    SELECT MaSanPham, TenSanPham, DonViTinh, MoTa FROM SanPham WHERE MaSanPham = @MaSanPham
END
GO

CREATE OR ALTER PROCEDURE sp_CreateSanPham
    @TenSanPham NVARCHAR(100), @DonViTinh NVARCHAR(20), @MoTa NVARCHAR(255)
AS BEGIN
    INSERT INTO SanPham (TenSanPham, DonViTinh, MoTa)
    OUTPUT INSERTED.MaSanPham
    VALUES (@TenSanPham, @DonViTinh, @MoTa)
END
GO

CREATE OR ALTER PROCEDURE sp_UpdateSanPham
    @MaSanPham INT, @TenSanPham NVARCHAR(100), @DonViTinh NVARCHAR(20), @MoTa NVARCHAR(255)
AS BEGIN
    UPDATE SanPham SET TenSanPham=@TenSanPham, DonViTinh=@DonViTinh, MoTa=@MoTa
    WHERE MaSanPham = @MaSanPham
END
GO

CREATE OR ALTER PROCEDURE sp_DeleteSanPham
    @MaSanPham INT
AS BEGIN
    DELETE FROM SanPham WHERE MaSanPham = @MaSanPham
END
GO
