-- ============================================================================
-- 03. STORED PROCEDURES - NÔNG DÂN
-- Quản lý nông dân, trang trại, lô nông sản
-- ============================================================================
USE btl;
GO

-- ===================== NONG DAN =====================

CREATE OR ALTER PROCEDURE sp_GetAllNongDan
AS BEGIN
    SELECT nd.*, tk.TenDangNhap, tk.TrangThai AS TrangThaiTK
    FROM NongDan nd JOIN TaiKhoan tk ON nd.MaTaiKhoan = tk.MaTaiKhoan
    ORDER BY nd.MaNongDan
END
GO

CREATE OR ALTER PROCEDURE sp_GetNongDanById
    @MaNongDan INT
AS BEGIN
    SELECT nd.*, tk.TenDangNhap, tk.TrangThai AS TrangThaiTK
    FROM NongDan nd JOIN TaiKhoan tk ON nd.MaTaiKhoan = tk.MaTaiKhoan
    WHERE nd.MaNongDan = @MaNongDan
END
GO

CREATE OR ALTER PROCEDURE sp_UpdateNongDan
    @MaNongDan INT, @HoTen NVARCHAR(100), @SoDienThoai NVARCHAR(20),
    @Email NVARCHAR(100), @DiaChi NVARCHAR(255)
AS BEGIN
    UPDATE NongDan SET HoTen=@HoTen, SoDienThoai=@SoDienThoai, Email=@Email, DiaChi=@DiaChi
    WHERE MaNongDan = @MaNongDan
END
GO

CREATE OR ALTER PROCEDURE sp_DeleteNongDan
    @MaNongDan INT
AS BEGIN
    UPDATE TaiKhoan SET TrangThai = N'khoa'
    WHERE MaTaiKhoan = (SELECT MaTaiKhoan FROM NongDan WHERE MaNongDan = @MaNongDan)
END
GO

-- ===================== TRANG TRAI =====================

CREATE OR ALTER PROCEDURE sp_GetAllTrangTrai
AS BEGIN
    SELECT tt.*, nd.HoTen AS TenNongDan
    FROM TrangTrai tt JOIN NongDan nd ON tt.MaNongDan = nd.MaNongDan
    ORDER BY tt.NgayTao DESC
END
GO

CREATE OR ALTER PROCEDURE sp_GetTrangTraiById
    @MaTrangTrai INT
AS BEGIN
    SELECT tt.*, nd.HoTen AS TenNongDan
    FROM TrangTrai tt JOIN NongDan nd ON tt.MaNongDan = nd.MaNongDan
    WHERE tt.MaTrangTrai = @MaTrangTrai
END
GO

CREATE OR ALTER PROCEDURE sp_GetTrangTraiByNongDan
    @MaNongDan INT
AS BEGIN
    SELECT * FROM TrangTrai
    WHERE MaNongDan = @MaNongDan AND (TrangThai IS NULL OR TrangThai = N'hoat_dong')
    ORDER BY NgayTao DESC
END
GO

CREATE OR ALTER PROCEDURE sp_CreateTrangTraiV2
    @MaNongDan INT, @TenTrangTrai NVARCHAR(100), @DiaChi NVARCHAR(255), @SoChungNhan NVARCHAR(50)
AS BEGIN
    INSERT INTO TrangTrai (MaNongDan, TenTrangTrai, DiaChi, SoChungNhan)
    OUTPUT INSERTED.MaTrangTrai
    VALUES (@MaNongDan, @TenTrangTrai, @DiaChi, @SoChungNhan)
END
GO

CREATE OR ALTER PROCEDURE sp_UpdateTrangTraiV2
    @MaTrangTrai INT, @TenTrangTrai NVARCHAR(100), @DiaChi NVARCHAR(255), @SoChungNhan NVARCHAR(50)
AS BEGIN
    UPDATE TrangTrai SET TenTrangTrai=@TenTrangTrai, DiaChi=@DiaChi, SoChungNhan=@SoChungNhan
    WHERE MaTrangTrai = @MaTrangTrai
END
GO

CREATE OR ALTER PROCEDURE sp_DeleteTrangTrai
    @MaTrangTrai INT
AS BEGIN
    SET NOCOUNT ON;
    IF NOT EXISTS (SELECT 1 FROM TrangTrai WHERE MaTrangTrai = @MaTrangTrai)
        RAISERROR(N'Trang trại không tồn tại', 16, 1);

    IF EXISTS (SELECT 1 FROM LoNongSan WHERE MaTrangTrai = @MaTrangTrai)
    BEGIN
        UPDATE TrangTrai SET TrangThai = N'ngung_hoat_dong' WHERE MaTrangTrai = @MaTrangTrai;
        SELECT 0 AS Deleted, N'Trang trại còn lô hàng, đã chuyển sang ngừng hoạt động' AS Message;
    END
    ELSE
    BEGIN
        DELETE FROM TrangTrai WHERE MaTrangTrai = @MaTrangTrai;
        SELECT 1 AS Deleted, N'Xóa trang trại thành công' AS Message;
    END
END
GO

-- ===================== LO NONG SAN =====================

CREATE OR ALTER PROCEDURE sp_GetAllLoNongSan
AS BEGIN
    SELECT lo.*, sp.TenSanPham, sp.DonViTinh, tt.TenTrangTrai, nd.HoTen AS TenNongDan
    FROM LoNongSan lo
    JOIN SanPham sp ON lo.MaSanPham = sp.MaSanPham
    JOIN TrangTrai tt ON lo.MaTrangTrai = tt.MaTrangTrai
    JOIN NongDan nd ON tt.MaNongDan = nd.MaNongDan
    ORDER BY lo.NgayTao DESC
END
GO

CREATE OR ALTER PROCEDURE sp_GetLoNongSanById
    @MaLo INT
AS BEGIN
    SELECT lo.*, sp.TenSanPham, sp.DonViTinh, tt.TenTrangTrai, nd.HoTen AS TenNongDan
    FROM LoNongSan lo
    JOIN SanPham sp ON lo.MaSanPham = sp.MaSanPham
    JOIN TrangTrai tt ON lo.MaTrangTrai = tt.MaTrangTrai
    JOIN NongDan nd ON tt.MaNongDan = nd.MaNongDan
    WHERE lo.MaLo = @MaLo
END
GO

CREATE OR ALTER PROCEDURE sp_GetLoNongSanByTrangTrai
    @MaTrangTrai INT
AS BEGIN
    SELECT lo.*, sp.TenSanPham, sp.DonViTinh
    FROM LoNongSan lo JOIN SanPham sp ON lo.MaSanPham = sp.MaSanPham
    WHERE lo.MaTrangTrai = @MaTrangTrai
    ORDER BY lo.NgayTao DESC
END
GO

CREATE OR ALTER PROCEDURE sp_GetLoNongSanByNongDan
    @MaNongDan INT
AS BEGIN
    SELECT lo.*, sp.TenSanPham, sp.DonViTinh, tt.TenTrangTrai
    FROM LoNongSan lo
    JOIN SanPham sp ON lo.MaSanPham = sp.MaSanPham
    JOIN TrangTrai tt ON lo.MaTrangTrai = tt.MaTrangTrai
    WHERE tt.MaNongDan = @MaNongDan
    ORDER BY lo.NgayTao DESC
END
GO

CREATE OR ALTER PROCEDURE sp_CreateLoNongSan
    @MaTrangTrai INT, @MaSanPham INT, @SoLuongBanDau DECIMAL(18,2),
    @NgayThuHoach DATE, @HanSuDung DATE, @SoChungNhanLo NVARCHAR(50),
    @MaQR NVARCHAR(255), @GiaTien DECIMAL(18,2) = NULL
AS BEGIN
    INSERT INTO LoNongSan (MaTrangTrai, MaSanPham, SoLuongBanDau, SoLuongHienTai, NgayThuHoach, HanSuDung, SoChungNhanLo, MaQR, GiaTien)
    OUTPUT INSERTED.MaLo
    VALUES (@MaTrangTrai, @MaSanPham, @SoLuongBanDau, @SoLuongBanDau, @NgayThuHoach, @HanSuDung, @SoChungNhanLo, @MaQR, @GiaTien)
END
GO

CREATE OR ALTER PROCEDURE sp_UpdateLoNongSan
    @MaLo INT, @SoLuongHienTai DECIMAL(18,2), @HanSuDung DATE,
    @TrangThai NVARCHAR(30), @GiaTien DECIMAL(18,2) = NULL
AS BEGIN
    UPDATE LoNongSan
    SET SoLuongHienTai = @SoLuongHienTai,
        HanSuDung      = @HanSuDung,
        TrangThai      = @TrangThai,
        GiaTien        = @GiaTien
    WHERE MaLo = @MaLo
END
GO

CREATE OR ALTER PROCEDURE sp_DeleteLoNongSan
    @MaLo INT
AS BEGIN
    DELETE FROM LoNongSan WHERE MaLo = @MaLo
END
GO
