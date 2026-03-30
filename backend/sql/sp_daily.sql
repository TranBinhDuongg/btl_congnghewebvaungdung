USE BTL_HDV1;
GO

-- 1. Lấy thông tin đại lý
CREATE OR ALTER PROCEDURE sp_GetDaiLyProfile
    @MaTaiKhoan INT
AS
BEGIN
    SELECT dl.*, tk.TenDangNhap, tk.TrangThai AS TrangThaiTK
    FROM DaiLy dl
    JOIN TaiKhoan tk ON dl.MaTaiKhoan = tk.MaTaiKhoan
    WHERE dl.MaTaiKhoan = @MaTaiKhoan
END
GO

-- 2. Lấy tất cả đại lý (tìm kiếm)
CREATE OR ALTER PROCEDURE sp_SearchDaiLy
    @Keyword NVARCHAR(100) = NULL
AS
BEGIN
    SELECT dl.*, tk.TenDangNhap, tk.TrangThai AS TrangThaiTK
    FROM DaiLy dl
    JOIN TaiKhoan tk ON dl.MaTaiKhoan = tk.MaTaiKhoan
    WHERE @Keyword IS NULL
       OR dl.TenDaiLy LIKE N'%' + @Keyword + '%'
       OR dl.Email LIKE N'%' + @Keyword + '%'
       OR dl.SoDienThoai LIKE N'%' + @Keyword + '%'
       OR dl.DiaChi LIKE N'%' + @Keyword + '%'
    ORDER BY dl.MaDaiLy
END
GO

-- 2b. Lấy đại lý theo MaDaiLy
CREATE OR ALTER PROCEDURE sp_GetDaiLyById
    @MaDaiLy INT
AS
BEGIN
    SELECT dl.*, tk.TenDangNhap, tk.TrangThai AS TrangThaiTK
    FROM DaiLy dl
    JOIN TaiKhoan tk ON dl.MaTaiKhoan = tk.MaTaiKhoan
    WHERE dl.MaDaiLy = @MaDaiLy
END
GO

-- 3. Cập nhật thông tin đại lý
CREATE OR ALTER PROCEDURE sp_UpdateDaiLy
    @MaDaiLy INT,
    @TenDaiLy NVARCHAR(100),
    @SoDienThoai NVARCHAR(20),
    @Email NVARCHAR(100),
    @DiaChi NVARCHAR(255)
AS
BEGIN
    UPDATE DaiLy
    SET TenDaiLy = @TenDaiLy, SoDienThoai = @SoDienThoai,
        Email = @Email, DiaChi = @DiaChi
    WHERE MaDaiLy = @MaDaiLy
END
GO

-- 4. Xóa đại lý (xóa mềm - khóa tài khoản)
CREATE OR ALTER PROCEDURE sp_DeleteDaiLy
    @MaDaiLy INT
AS
BEGIN
    UPDATE TaiKhoan SET TrangThai = N'khoa'
    WHERE MaTaiKhoan = (SELECT MaTaiKhoan FROM DaiLy WHERE MaDaiLy = @MaDaiLy)
END
GO

-- 5. Thêm đại lý mới
CREATE OR ALTER PROCEDURE sp_CreateDaiLy
    @TenDangNhap NVARCHAR(50),
    @MatKhauHash NVARCHAR(255),
    @TenDaiLy NVARCHAR(100),
    @SoDienThoai NVARCHAR(20),
    @Email NVARCHAR(100),
    @DiaChi NVARCHAR(255)
AS
BEGIN
    BEGIN TRANSACTION
    BEGIN TRY
        INSERT INTO TaiKhoan (TenDangNhap, MatKhauHash, LoaiTaiKhoan)
        VALUES (@TenDangNhap, @MatKhauHash, 'daily')

        DECLARE @MaTaiKhoan INT = SCOPE_IDENTITY()

        INSERT INTO DaiLy (MaTaiKhoan, TenDaiLy, SoDienThoai, Email, DiaChi)
        OUTPUT INSERTED.MaDaiLy
        VALUES (@MaTaiKhoan, @TenDaiLy, @SoDienThoai, @Email, @DiaChi)

        COMMIT
    END TRY
    BEGIN CATCH
        ROLLBACK
        DECLARE @ErrMsg NVARCHAR(4000) = ERROR_MESSAGE()
        RAISERROR(@ErrMsg, 16, 1)
    END CATCH
END
GO
