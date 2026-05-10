-- ============================================================================
-- 06. MIGRATION - Thêm cột GiaTien vào LoNongSan
-- Chạy file này nếu database đã tồn tại từ trước
-- ============================================================================
USE btl;
GO

IF NOT EXISTS (
    SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_NAME = 'LoNongSan' AND COLUMN_NAME = 'GiaTien'
)
BEGIN
    ALTER TABLE LoNongSan ADD GiaTien DECIMAL(18,2) NULL;
    PRINT N'Đã thêm cột GiaTien';
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

PRINT N'Migration hoàn tất';
GO
