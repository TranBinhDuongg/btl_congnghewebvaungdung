USE BTL_HDV1;
GO

-- ===================== NONG DAN =====================

CREATE OR ALTER PROCEDURE sp_GetAllNongDan
AS
BEGIN
    SELECT nd.*, tk.TenDangNhap, tk.TrangThai AS TrangThaiTK
    FROM NongDan nd
    JOIN TaiKhoan tk ON nd.MaTaiKhoan = tk.MaTaiKhoan
    ORDER BY nd.MaNongDan
END
GO

CREATE OR ALTER PROCEDURE sp_GetNongDanById
    @MaNongDan INT
AS
BEGIN
    SELECT nd.*, tk.TenDangNhap, tk.TrangThai AS TrangThaiTK
    FROM NongDan nd
    JOIN TaiKhoan tk ON nd.MaTaiKhoan = tk.MaTaiKhoan
    WHERE nd.MaNongDan = @MaNongDan
END
GO

CREATE OR ALTER PROCEDURE sp_CreateNongDan
    @TenDangNhap NVARCHAR(50),
    @MatKhauHash NVARCHAR(255),
    @HoTen NVARCHAR(100),
    @SoDienThoai NVARCHAR(20),
    @Email NVARCHAR(100),
    @DiaChi NVARCHAR(255)
AS
BEGIN
    BEGIN TRANSACTION
    BEGIN TRY
        INSERT INTO TaiKhoan (TenDangNhap, MatKhauHash, LoaiTaiKhoan)
        VALUES (@TenDangNhap, @MatKhauHash, 'nongdan')

        DECLARE @MaTaiKhoan INT = SCOPE_IDENTITY()

        INSERT INTO NongDan (MaTaiKhoan, HoTen, SoDienThoai, Email, DiaChi)
        OUTPUT INSERTED.MaNongDan
        VALUES (@MaTaiKhoan, @HoTen, @SoDienThoai, @Email, @DiaChi)

        COMMIT
    END TRY
    BEGIN CATCH
        ROLLBACK
        DECLARE @ErrMsg NVARCHAR(4000) = ERROR_MESSAGE()
        RAISERROR(@ErrMsg, 16, 1)
    END CATCH
END
GO

CREATE OR ALTER PROCEDURE sp_UpdateNongDan
    @MaNongDan INT,
    @HoTen NVARCHAR(100),
    @SoDienThoai NVARCHAR(20),
    @Email NVARCHAR(100),
    @DiaChi NVARCHAR(255)
AS
BEGIN
    UPDATE NongDan
    SET HoTen = @HoTen, SoDienThoai = @SoDienThoai,
        Email = @Email, DiaChi = @DiaChi
    WHERE MaNongDan = @MaNongDan
END
GO

CREATE OR ALTER PROCEDURE sp_DeleteNongDan
    @MaNongDan INT
AS
BEGIN
    UPDATE TaiKhoan SET TrangThai = N'khoa'
    WHERE MaTaiKhoan = (SELECT MaTaiKhoan FROM NongDan WHERE MaNongDan = @MaNongDan)
END
GO

-- ===================== TRANG TRAI =====================

CREATE OR ALTER PROCEDURE sp_GetAllTrangTrai
AS
BEGIN
    SELECT tt.*, nd.HoTen AS TenNongDan
    FROM TrangTrai tt
    JOIN NongDan nd ON tt.MaNongDan = nd.MaNongDan
    ORDER BY tt.NgayTao DESC
END
GO

CREATE OR ALTER PROCEDURE sp_GetTrangTraiById
    @MaTrangTrai INT
AS
BEGIN
    SELECT tt.*, nd.HoTen AS TenNongDan
    FROM TrangTrai tt
    JOIN NongDan nd ON tt.MaNongDan = nd.MaNongDan
    WHERE tt.MaTrangTrai = @MaTrangTrai
END
GO

CREATE OR ALTER PROCEDURE sp_GetTrangTraiByNongDan
    @MaNongDan INT
AS
BEGIN
    SELECT * FROM TrangTrai
    WHERE MaNongDan = @MaNongDan
    ORDER BY NgayTao DESC
END
GO

CREATE OR ALTER PROCEDURE sp_CreateTrangTraiV2
    @MaNongDan INT,
    @TenTrangTrai NVARCHAR(100),
    @DiaChi NVARCHAR(255),
    @SoChungNhan NVARCHAR(50)
AS
BEGIN
    INSERT INTO TrangTrai (MaNongDan, TenTrangTrai, DiaChi, SoChungNhan)
    OUTPUT INSERTED.MaTrangTrai
    VALUES (@MaNongDan, @TenTrangTrai, @DiaChi, @SoChungNhan)
END
GO

CREATE OR ALTER PROCEDURE sp_UpdateTrangTraiV2
    @MaTrangTrai INT,
    @TenTrangTrai NVARCHAR(100),
    @DiaChi NVARCHAR(255),
    @SoChungNhan NVARCHAR(50)
AS
BEGIN
    UPDATE TrangTrai
    SET TenTrangTrai = @TenTrangTrai, DiaChi = @DiaChi, SoChungNhan = @SoChungNhan
    WHERE MaTrangTrai = @MaTrangTrai
END
GO

CREATE OR ALTER PROCEDURE sp_DeleteTrangTrai
    @MaTrangTrai INT
AS
BEGIN
    DELETE FROM TrangTrai WHERE MaTrangTrai = @MaTrangTrai
END
GO
