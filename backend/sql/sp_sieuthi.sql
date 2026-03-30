USE BTL_HDV1;
GO

-- 1. Lấy thông tin siêu thị
CREATE OR ALTER PROCEDURE sp_GetSieuThiProfile
    @MaTaiKhoan INT
AS
BEGIN
    SELECT st.*, tk.TenDangNhap, tk.TrangThai AS TrangThaiTK
    FROM SieuThi st
    JOIN TaiKhoan tk ON st.MaTaiKhoan = tk.MaTaiKhoan
    WHERE st.MaTaiKhoan = @MaTaiKhoan
END
GO

-- 2. Tìm kiếm siêu thị
CREATE OR ALTER PROCEDURE sp_SearchSieuThi
    @Keyword NVARCHAR(100) = NULL
AS
BEGIN
    SELECT st.*, tk.TenDangNhap, tk.TrangThai AS TrangThaiTK
    FROM SieuThi st
    JOIN TaiKhoan tk ON st.MaTaiKhoan = tk.MaTaiKhoan
    WHERE @Keyword IS NULL
       OR st.TenSieuThi LIKE N'%' + @Keyword + '%'
       OR st.Email LIKE N'%' + @Keyword + '%'
       OR st.SoDienThoai LIKE N'%' + @Keyword + '%'
    ORDER BY st.MaSieuThi
END
GO

-- 3. Thêm siêu thị mới
CREATE OR ALTER PROCEDURE sp_CreateSieuThi
    @TenDangNhap NVARCHAR(50),
    @MatKhauHash NVARCHAR(255),
    @TenSieuThi NVARCHAR(100),
    @SoDienThoai NVARCHAR(20),
    @Email NVARCHAR(100),
    @DiaChi NVARCHAR(255)
AS
BEGIN
    BEGIN TRANSACTION
    BEGIN TRY
        INSERT INTO TaiKhoan (TenDangNhap, MatKhauHash, LoaiTaiKhoan)
        VALUES (@TenDangNhap, @MatKhauHash, 'sieuthi')

        DECLARE @MaTaiKhoan INT = SCOPE_IDENTITY()

        INSERT INTO SieuThi (MaTaiKhoan, TenSieuThi, SoDienThoai, Email, DiaChi)
        OUTPUT INSERTED.MaSieuThi
        VALUES (@MaTaiKhoan, @TenSieuThi, @SoDienThoai, @Email, @DiaChi)

        COMMIT
    END TRY
    BEGIN CATCH
        ROLLBACK
        DECLARE @ErrMsg NVARCHAR(4000) = ERROR_MESSAGE()
        RAISERROR(@ErrMsg, 16, 1)
    END CATCH
END
GO

-- 4. Cập nhật siêu thị
CREATE OR ALTER PROCEDURE sp_UpdateSieuThi
    @MaSieuThi INT,
    @TenSieuThi NVARCHAR(100),
    @SoDienThoai NVARCHAR(20),
    @Email NVARCHAR(100),
    @DiaChi NVARCHAR(255)
AS
BEGIN
    UPDATE SieuThi
    SET TenSieuThi = @TenSieuThi, SoDienThoai = @SoDienThoai,
        Email = @Email, DiaChi = @DiaChi
    WHERE MaSieuThi = @MaSieuThi
END
GO

-- 5. Xóa siêu thị (khóa tài khoản)
CREATE OR ALTER PROCEDURE sp_DeleteSieuThi
    @MaSieuThi INT
AS
BEGIN
    UPDATE TaiKhoan SET TrangThai = N'khoa'
    WHERE MaTaiKhoan = (SELECT MaTaiKhoan FROM SieuThi WHERE MaSieuThi = @MaSieuThi)
END
GO

-- 6. Tạo đơn hàng siêu thị -> đại lý
CREATE OR ALTER PROCEDURE sp_TaoDonHangSieuThi
    @MaSieuThi INT,
    @MaDaiLy INT,
    @GhiChu NVARCHAR(255) = NULL
AS
BEGIN
    INSERT INTO DonHang (LoaiDon, TrangThai, GhiChu)
    OUTPUT INSERTED.MaDonHang
    VALUES ('sieuthi_to_daily', N'chua_nhan', @GhiChu)

    DECLARE @MaDonHang INT = SCOPE_IDENTITY()

    INSERT INTO DonHangSieuThi (MaDonHang, MaSieuThi, MaDaiLy)
    VALUES (@MaDonHang, @MaSieuThi, @MaDaiLy)
END
GO

-- 7. Thêm chi tiết đơn hàng
CREATE OR ALTER PROCEDURE sp_ThemChiTietDonHangSieuThi
    @MaDonHang INT,
    @MaLo INT,
    @SoLuong DECIMAL(18,2),
    @DonGia DECIMAL(18,2)
AS
BEGIN
    INSERT INTO ChiTietDonHang (MaDonHang, MaLo, SoLuong, DonGia, ThanhTien)
    VALUES (@MaDonHang, @MaLo, @SoLuong, @DonGia, @SoLuong * @DonGia)

    -- Cập nhật tổng đơn hàng
    UPDATE DonHang
    SET TongSoLuong = (SELECT SUM(SoLuong) FROM ChiTietDonHang WHERE MaDonHang = @MaDonHang),
        TongGiaTri  = (SELECT SUM(ThanhTien) FROM ChiTietDonHang WHERE MaDonHang = @MaDonHang)
    WHERE MaDonHang = @MaDonHang
END
GO

-- 8. Cập nhật chi tiết đơn hàng
CREATE OR ALTER PROCEDURE sp_CapNhatChiTietDonHangSieuThi
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

-- 9. Xóa chi tiết đơn hàng
CREATE OR ALTER PROCEDURE sp_XoaChiTietDonHangSieuThi
    @MaDonHang INT,
    @MaLo INT
AS
BEGIN
    DELETE FROM ChiTietDonHang WHERE MaDonHang = @MaDonHang AND MaLo = @MaLo

    UPDATE DonHang
    SET TongSoLuong = (SELECT ISNULL(SUM(SoLuong), 0) FROM ChiTietDonHang WHERE MaDonHang = @MaDonHang),
        TongGiaTri  = (SELECT ISNULL(SUM(ThanhTien), 0) FROM ChiTietDonHang WHERE MaDonHang = @MaDonHang)
    WHERE MaDonHang = @MaDonHang
END
GO

-- 10. Nhận đơn hàng
CREATE OR ALTER PROCEDURE sp_NhanDonHangSieuThi
    @MaDonHang INT
AS
BEGIN
    UPDATE DonHang SET TrangThai = N'da_nhan' WHERE MaDonHang = @MaDonHang
END
GO

-- 11. Hủy đơn hàng
CREATE OR ALTER PROCEDURE sp_HuyDonHangSieuThi
    @MaDonHang INT
AS
BEGIN
    UPDATE DonHang SET TrangThai = N'da_huy' WHERE MaDonHang = @MaDonHang
END
GO

-- 12. Lấy chi tiết đơn hàng
CREATE OR ALTER PROCEDURE sp_GetDonHangSieuThiById
    @MaDonHang INT
AS
BEGIN
    SELECT dh.*, dst.MaSieuThi, st.TenSieuThi, dst.MaDaiLy, dl.TenDaiLy,
           ct.MaLo, ct.SoLuong, ct.DonGia, ct.ThanhTien,
           sp.TenSanPham, sp.DonViTinh
    FROM DonHang dh
    JOIN DonHangSieuThi dst ON dh.MaDonHang = dst.MaDonHang
    JOIN SieuThi st ON dst.MaSieuThi = st.MaSieuThi
    JOIN DaiLy dl ON dst.MaDaiLy = dl.MaDaiLy
    JOIN ChiTietDonHang ct ON dh.MaDonHang = ct.MaDonHang
    JOIN LoNongSan lo ON ct.MaLo = lo.MaLo
    JOIN SanPham sp ON lo.MaSanPham = sp.MaSanPham
    WHERE dh.MaDonHang = @MaDonHang
END
GO

-- 13. Lấy danh sách đơn hàng theo siêu thị
CREATE OR ALTER PROCEDURE sp_GetDonHangBySieuThi
    @MaSieuThi INT
AS
BEGIN
    SELECT dh.*, dst.MaDaiLy, dl.TenDaiLy
    FROM DonHang dh
    JOIN DonHangSieuThi dst ON dh.MaDonHang = dst.MaDonHang
    JOIN DaiLy dl ON dst.MaDaiLy = dl.MaDaiLy
    WHERE dst.MaSieuThi = @MaSieuThi
    ORDER BY dh.NgayDat DESC
END
GO

-- 14. Lấy đơn hàng siêu thị theo đại lý
CREATE OR ALTER PROCEDURE sp_GetDonHangSieuThiByDaiLy
    @MaDaiLy INT
AS
BEGIN
    SELECT dh.*, dst.MaSieuThi, st.TenSieuThi
    FROM DonHang dh
    JOIN DonHangSieuThi dst ON dh.MaDonHang = dst.MaDonHang
    JOIN SieuThi st ON dst.MaSieuThi = st.MaSieuThi
    WHERE dst.MaDaiLy = @MaDaiLy
    ORDER BY dh.NgayDat DESC
END
GO

-- 15. Cập nhật trạng thái đơn hàng siêu thị
CREATE OR ALTER PROCEDURE sp_UpdateTrangThaiDonHangSieuThi
    @MaDonHang INT,
    @TrangThai NVARCHAR(30)
AS
BEGIN
    UPDATE DonHang SET TrangThai = @TrangThai WHERE MaDonHang = @MaDonHang
END
GO
