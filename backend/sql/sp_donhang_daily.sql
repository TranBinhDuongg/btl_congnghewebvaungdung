USE BTL_HDV1;
GO

-- 1. Lấy tất cả đơn hàng đại lý
CREATE OR ALTER PROCEDURE sp_GetAllDonHangDaiLy
AS
BEGIN
    SELECT dh.*, dhd.MaDaiLy, dl.TenDaiLy, dhd.MaNongDan, nd.HoTen AS TenNongDan
    FROM DonHang dh
    JOIN DonHangDaiLy dhd ON dh.MaDonHang = dhd.MaDonHang
    JOIN DaiLy dl ON dhd.MaDaiLy = dl.MaDaiLy
    JOIN NongDan nd ON dhd.MaNongDan = nd.MaNongDan
    ORDER BY dh.NgayDat DESC
END
GO

-- 2. Lấy chi tiết đơn hàng theo ID
CREATE OR ALTER PROCEDURE sp_GetDonHangDaiLyById
    @MaDonHang INT
AS
BEGIN
    SELECT dh.*, dhd.MaDaiLy, dl.TenDaiLy, dhd.MaNongDan, nd.HoTen AS TenNongDan,
           ct.MaLo, ct.SoLuong, ct.DonGia, ct.ThanhTien,
           sp.TenSanPham, sp.DonViTinh
    FROM DonHang dh
    JOIN DonHangDaiLy dhd ON dh.MaDonHang = dhd.MaDonHang
    JOIN DaiLy dl ON dhd.MaDaiLy = dl.MaDaiLy
    JOIN NongDan nd ON dhd.MaNongDan = nd.MaNongDan
    JOIN ChiTietDonHang ct ON dh.MaDonHang = ct.MaDonHang
    JOIN LoNongSan lo ON ct.MaLo = lo.MaLo
    JOIN SanPham sp ON lo.MaSanPham = sp.MaSanPham
    WHERE dh.MaDonHang = @MaDonHang
END
GO

-- 3. Lấy đơn hàng theo nông dân
CREATE OR ALTER PROCEDURE sp_GetDonHangDaiLyByNongDan
    @MaNongDan INT
AS
BEGIN
    SELECT dh.MaDonHang, dh.TrangThai, dh.NgayDat, dh.NgayGiao,
           dh.TongSoLuong, dh.TongGiaTri, dh.GhiChu,
           dhd.MaDaiLy, dl.TenDaiLy,
           -- Gộp tên sản phẩm từ chi tiết
           STUFF((
               SELECT DISTINCT N', ' + sp.TenSanPham
               FROM ChiTietDonHang ct2
               JOIN LoNongSan lo2 ON ct2.MaLo = lo2.MaLo
               JOIN SanPham sp ON lo2.MaSanPham = sp.MaSanPham
               WHERE ct2.MaDonHang = dh.MaDonHang
               FOR XML PATH(''), TYPE
           ).value('.','NVARCHAR(MAX)'), 1, 2, '') AS DanhSachSanPham
    FROM DonHang dh
    JOIN DonHangDaiLy dhd ON dh.MaDonHang = dhd.MaDonHang
    JOIN DaiLy dl ON dhd.MaDaiLy = dl.MaDaiLy
    WHERE dhd.MaNongDan = @MaNongDan
    ORDER BY dh.NgayDat DESC
END
GO

-- 4. Lấy đơn hàng theo đại lý
CREATE OR ALTER PROCEDURE sp_GetDonHangByDaiLy
    @MaDaiLy INT
AS
BEGIN
    SELECT dh.*, dhd.MaNongDan, nd.HoTen AS TenNongDan
    FROM DonHang dh
    JOIN DonHangDaiLy dhd ON dh.MaDonHang = dhd.MaDonHang
    JOIN NongDan nd ON dhd.MaNongDan = nd.MaNongDan
    WHERE dhd.MaDaiLy = @MaDaiLy
    ORDER BY dh.NgayDat DESC
END
GO

-- 5. Tạo đơn hàng đại lý -> nông dân
CREATE OR ALTER PROCEDURE sp_CreateDonHangDaiLy
    @MaDaiLy INT,
    @MaNongDan INT,
    @GhiChu NVARCHAR(255) = NULL
AS
BEGIN
    INSERT INTO DonHang (LoaiDon, TrangThai, GhiChu)
    OUTPUT INSERTED.MaDonHang
    VALUES ('daily_to_nongdan', N'chua_nhan', @GhiChu)

    DECLARE @MaDonHang INT = SCOPE_IDENTITY()

    INSERT INTO DonHangDaiLy (MaDonHang, MaDaiLy, MaNongDan)
    VALUES (@MaDonHang, @MaDaiLy, @MaNongDan)
END
GO

-- 6. Cập nhật đơn hàng (ghi chú)
CREATE OR ALTER PROCEDURE sp_UpdateDonHangDaiLy
    @MaDonHang INT,
    @GhiChu NVARCHAR(255)
AS
BEGIN
    UPDATE DonHang SET GhiChu = @GhiChu WHERE MaDonHang = @MaDonHang
END
GO

-- 7. Xác nhận đơn hàng (da_nhan)
CREATE OR ALTER PROCEDURE sp_XacNhanDonHangDaiLy
    @MaDonHang INT
AS
BEGIN
    UPDATE DonHang SET TrangThai = N'da_nhan' WHERE MaDonHang = @MaDonHang
END
GO

-- 8. Xuất đơn (hoan_thanh)
CREATE OR ALTER PROCEDURE sp_XuatDonHangDaiLy
    @MaDonHang INT
AS
BEGIN
    UPDATE DonHang SET TrangThai = N'hoan_thanh', NgayGiao = SYSDATETIME() WHERE MaDonHang = @MaDonHang
END
GO

-- 9. Hủy đơn hàng
CREATE OR ALTER PROCEDURE sp_HuyDonHangDaiLy
    @MaDonHang INT
AS
BEGIN
    UPDATE DonHang SET TrangThai = N'da_huy' WHERE MaDonHang = @MaDonHang
END
GO

-- 10. Xóa đơn hàng (chỉ khi chưa nhận)
CREATE OR ALTER PROCEDURE sp_DeleteDonHangDaiLy
    @MaDonHang INT
AS
BEGIN
    IF EXISTS (SELECT 1 FROM DonHang WHERE MaDonHang = @MaDonHang AND TrangThai = N'chua_nhan')
    BEGIN
        DELETE FROM ChiTietDonHang WHERE MaDonHang = @MaDonHang
        DELETE FROM DonHangDaiLy WHERE MaDonHang = @MaDonHang
        DELETE FROM DonHang WHERE MaDonHang = @MaDonHang
    END
    ELSE
        RAISERROR(N'Chỉ có thể xóa đơn hàng chưa nhận', 16, 1)
END
GO

-- 11. Lấy chi tiết đơn hàng
CREATE OR ALTER PROCEDURE sp_GetChiTietDonHangDaiLy
    @MaDonHang INT
AS
BEGIN
    SELECT ct.*, lo.MaSanPham, sp.TenSanPham, sp.DonViTinh
    FROM ChiTietDonHang ct
    JOIN LoNongSan lo ON ct.MaLo = lo.MaLo
    JOIN SanPham sp ON lo.MaSanPham = sp.MaSanPham
    WHERE ct.MaDonHang = @MaDonHang
END
GO

-- 12. Thêm chi tiết đơn hàng
CREATE OR ALTER PROCEDURE sp_AddChiTietDonHangDaiLy
    @MaDonHang INT,
    @MaLo INT,
    @SoLuong DECIMAL(18,2),
    @DonGia DECIMAL(18,2)
AS
BEGIN
    INSERT INTO ChiTietDonHang (MaDonHang, MaLo, SoLuong, DonGia, ThanhTien)
    VALUES (@MaDonHang, @MaLo, @SoLuong, @DonGia, @SoLuong * @DonGia)

    UPDATE DonHang
    SET TongSoLuong = (SELECT SUM(SoLuong) FROM ChiTietDonHang WHERE MaDonHang = @MaDonHang),
        TongGiaTri  = (SELECT SUM(ThanhTien) FROM ChiTietDonHang WHERE MaDonHang = @MaDonHang)
    WHERE MaDonHang = @MaDonHang
END
GO

-- 13. Cập nhật chi tiết đơn hàng
CREATE OR ALTER PROCEDURE sp_UpdateChiTietDonHangDaiLy
    @MaDonHang INT,
    @MaLo INT,
    @SoLuong DECIMAL(18,2),
    @DonGia DECIMAL(18,2)
AS
BEGIN
    UPDATE ChiTietDonHang
    SET SoLuong = @SoLuong, DonGia = @DonGia, ThanhTien = @SoLuong * @DonGia
    WHERE MaDonHang = @MaDonHang AND MaLo = @MaLo

    UPDATE DonHang
    SET TongSoLuong = (SELECT SUM(SoLuong) FROM ChiTietDonHang WHERE MaDonHang = @MaDonHang),
        TongGiaTri  = (SELECT SUM(ThanhTien) FROM ChiTietDonHang WHERE MaDonHang = @MaDonHang)
    WHERE MaDonHang = @MaDonHang
END
GO

-- 14. Xóa chi tiết đơn hàng
CREATE OR ALTER PROCEDURE sp_DeleteChiTietDonHangDaiLy
    @MaDonHang INT,
    @MaLo INT
AS
BEGIN
    DELETE FROM ChiTietDonHang WHERE MaDonHang = @MaDonHang AND MaLo = @MaLo

    UPDATE DonHang
    SET TongSoLuong = (SELECT ISNULL(SUM(SoLuong),0) FROM ChiTietDonHang WHERE MaDonHang = @MaDonHang),
        TongGiaTri  = (SELECT ISNULL(SUM(ThanhTien),0) FROM ChiTietDonHang WHERE MaDonHang = @MaDonHang)
    WHERE MaDonHang = @MaDonHang
END
GO
