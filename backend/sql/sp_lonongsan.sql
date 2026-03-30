USE BTL_HDV1;
GO

-- 1. Lấy tất cả lô nông sản
CREATE OR ALTER PROCEDURE sp_GetAllLoNongSan
AS
BEGIN
    SELECT lo.*, sp.TenSanPham, sp.DonViTinh, tt.TenTrangTrai, nd.HoTen AS TenNongDan
    FROM LoNongSan lo
    JOIN SanPham sp ON lo.MaSanPham = sp.MaSanPham
    JOIN TrangTrai tt ON lo.MaTrangTrai = tt.MaTrangTrai
    JOIN NongDan nd ON tt.MaNongDan = nd.MaNongDan
    ORDER BY lo.NgayTao DESC
END
GO

-- 2. Lấy chi tiết lô theo ID
CREATE OR ALTER PROCEDURE sp_GetLoNongSanById
    @MaLo INT
AS
BEGIN
    SELECT lo.*, sp.TenSanPham, sp.DonViTinh, tt.TenTrangTrai, nd.HoTen AS TenNongDan
    FROM LoNongSan lo
    JOIN SanPham sp ON lo.MaSanPham = sp.MaSanPham
    JOIN TrangTrai tt ON lo.MaTrangTrai = tt.MaTrangTrai
    JOIN NongDan nd ON tt.MaNongDan = nd.MaNongDan
    WHERE lo.MaLo = @MaLo
END
GO

-- 3. Lấy lô theo trang trại
CREATE OR ALTER PROCEDURE sp_GetLoNongSanByTrangTrai
    @MaTrangTrai INT
AS
BEGIN
    SELECT lo.*, sp.TenSanPham, sp.DonViTinh
    FROM LoNongSan lo
    JOIN SanPham sp ON lo.MaSanPham = sp.MaSanPham
    WHERE lo.MaTrangTrai = @MaTrangTrai
    ORDER BY lo.NgayTao DESC
END
GO

-- 4. Lấy lô theo nông dân
CREATE OR ALTER PROCEDURE sp_GetLoNongSanByNongDan
    @MaNongDan INT
AS
BEGIN
    SELECT lo.*, sp.TenSanPham, sp.DonViTinh, tt.TenTrangTrai
    FROM LoNongSan lo
    JOIN SanPham sp ON lo.MaSanPham = sp.MaSanPham
    JOIN TrangTrai tt ON lo.MaTrangTrai = tt.MaTrangTrai
    WHERE tt.MaNongDan = @MaNongDan
    ORDER BY lo.NgayTao DESC
END
GO

-- 5. Tạo lô nông sản
CREATE OR ALTER PROCEDURE sp_CreateLoNongSan
    @MaTrangTrai INT,
    @MaSanPham INT,
    @SoLuongBanDau DECIMAL(18,2),
    @NgayThuHoach DATE,
    @HanSuDung DATE,
    @SoChungNhanLo NVARCHAR(50),
    @MaQR NVARCHAR(255)
AS
BEGIN
    INSERT INTO LoNongSan (MaTrangTrai, MaSanPham, SoLuongBanDau, SoLuongHienTai, NgayThuHoach, HanSuDung, SoChungNhanLo, MaQR)
    OUTPUT INSERTED.MaLo
    VALUES (@MaTrangTrai, @MaSanPham, @SoLuongBanDau, @SoLuongBanDau, @NgayThuHoach, @HanSuDung, @SoChungNhanLo, @MaQR)
END
GO

-- 6. Cập nhật lô nông sản
CREATE OR ALTER PROCEDURE sp_UpdateLoNongSan
    @MaLo INT,
    @SoLuongHienTai DECIMAL(18,2),
    @HanSuDung DATE,
    @TrangThai NVARCHAR(30)
AS
BEGIN
    UPDATE LoNongSan
    SET SoLuongHienTai = @SoLuongHienTai, HanSuDung = @HanSuDung, TrangThai = @TrangThai
    WHERE MaLo = @MaLo
END
GO

-- 7. Xóa lô nông sản
CREATE OR ALTER PROCEDURE sp_DeleteLoNongSan
    @MaLo INT
AS
BEGIN
    DELETE FROM LoNongSan WHERE MaLo = @MaLo
END
GO
