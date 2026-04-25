-- ============================================================================
-- 05. STORED PROCEDURES - SIÊU THỊ
-- Quản lý siêu thị, đơn hàng sieuthi->đại lý, kho siêu thị, kiểm định
-- ============================================================================
USE btl;
GO

-- ===================== SIEU THI =====================

CREATE OR ALTER PROCEDURE sp_GetSieuThiProfile
    @MaTaiKhoan INT
AS BEGIN
    SELECT st.*, tk.TenDangNhap, tk.TrangThai AS TrangThaiTK
    FROM SieuThi st JOIN TaiKhoan tk ON st.MaTaiKhoan = tk.MaTaiKhoan
    WHERE st.MaTaiKhoan = @MaTaiKhoan
END
GO

CREATE OR ALTER PROCEDURE sp_SearchSieuThi
    @Keyword NVARCHAR(100) = NULL
AS BEGIN
    SELECT st.*, tk.TenDangNhap, tk.TrangThai AS TrangThaiTK
    FROM SieuThi st JOIN TaiKhoan tk ON st.MaTaiKhoan = tk.MaTaiKhoan
    WHERE @Keyword IS NULL
       OR st.TenSieuThi  LIKE N'%' + @Keyword + '%'
       OR st.Email       LIKE N'%' + @Keyword + '%'
       OR st.SoDienThoai LIKE N'%' + @Keyword + '%'
    ORDER BY st.MaSieuThi
END
GO

CREATE OR ALTER PROCEDURE sp_UpdateSieuThi
    @MaSieuThi INT, @TenSieuThi NVARCHAR(100), @SoDienThoai NVARCHAR(20),
    @Email NVARCHAR(100), @DiaChi NVARCHAR(255)
AS BEGIN
    UPDATE SieuThi SET TenSieuThi=@TenSieuThi, SoDienThoai=@SoDienThoai, Email=@Email, DiaChi=@DiaChi
    WHERE MaSieuThi = @MaSieuThi
END
GO

CREATE OR ALTER PROCEDURE sp_DeleteSieuThi
    @MaSieuThi INT
AS BEGIN
    UPDATE TaiKhoan SET TrangThai = N'khoa'
    WHERE MaTaiKhoan = (SELECT MaTaiKhoan FROM SieuThi WHERE MaSieuThi = @MaSieuThi)
END
GO

-- ===================== DON HANG SIEU THI -> DAI LY =====================

CREATE OR ALTER PROCEDURE sp_GetAllDonHangSieuThi
AS BEGIN
    SELECT dh.*, dst.MaSieuThi, st.TenSieuThi, dst.MaDaiLy, dl.TenDaiLy
    FROM DonHang dh
    JOIN DonHangSieuThi dst ON dh.MaDonHang = dst.MaDonHang
    JOIN SieuThi st ON dst.MaSieuThi = st.MaSieuThi
    JOIN DaiLy dl ON dst.MaDaiLy = dl.MaDaiLy
    ORDER BY dh.NgayDat DESC
END
GO

CREATE OR ALTER PROCEDURE sp_GetDonHangSieuThiById
    @MaDonHang INT
AS BEGIN
    SELECT dh.*, dst.MaSieuThi, st.TenSieuThi, dst.MaDaiLy, dl.TenDaiLy,
           ct.MaLo, ct.SoLuong, ct.DonGia, ct.ThanhTien, sp.TenSanPham, sp.DonViTinh
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

CREATE OR ALTER PROCEDURE sp_GetDonHangBySieuThi
    @MaSieuThi INT
AS BEGIN
    SELECT dh.*, dst.MaDaiLy, dl.TenDaiLy
    FROM DonHang dh
    JOIN DonHangSieuThi dst ON dh.MaDonHang = dst.MaDonHang
    JOIN DaiLy dl ON dst.MaDaiLy = dl.MaDaiLy
    WHERE dst.MaSieuThi = @MaSieuThi
    ORDER BY dh.NgayDat DESC
END
GO

CREATE OR ALTER PROCEDURE sp_GetDonHangSieuThiByDaiLy
    @MaDaiLy INT
AS BEGIN
    SELECT dh.*, dst.MaSieuThi, st.TenSieuThi
    FROM DonHang dh
    JOIN DonHangSieuThi dst ON dh.MaDonHang = dst.MaDonHang
    JOIN SieuThi st ON dst.MaSieuThi = st.MaSieuThi
    WHERE dst.MaDaiLy = @MaDaiLy
    ORDER BY dh.NgayDat DESC
END
GO

CREATE OR ALTER PROCEDURE sp_TaoDonHangSieuThi
    @MaSieuThi INT, @MaDaiLy INT, @GhiChu NVARCHAR(255) = NULL
AS BEGIN
    INSERT INTO DonHang (LoaiDon, TrangThai, GhiChu)
    OUTPUT INSERTED.MaDonHang
    VALUES ('sieuthi_to_daily', N'chua_nhan', @GhiChu)

    DECLARE @MaDonHang INT = SCOPE_IDENTITY()
    INSERT INTO DonHangSieuThi (MaDonHang, MaSieuThi, MaDaiLy) VALUES (@MaDonHang, @MaSieuThi, @MaDaiLy)
END
GO

CREATE OR ALTER PROCEDURE sp_UpdateTrangThaiDonHangSieuThi
    @MaDonHang INT, @TrangThai NVARCHAR(30)
AS BEGIN
    UPDATE DonHang SET TrangThai = @TrangThai WHERE MaDonHang = @MaDonHang
END
GO

CREATE OR ALTER PROCEDURE sp_NhanDonHangSieuThi
    @MaDonHang INT
AS BEGIN
    UPDATE DonHang SET TrangThai = N'da_nhan' WHERE MaDonHang = @MaDonHang
END
GO

CREATE OR ALTER PROCEDURE sp_HuyDonHangSieuThi
    @MaDonHang INT
AS BEGIN
    UPDATE DonHang SET TrangThai = N'da_huy' WHERE MaDonHang = @MaDonHang
END
GO

CREATE OR ALTER PROCEDURE sp_ThemChiTietDonHangSieuThi
    @MaDonHang INT, @MaLo INT, @SoLuong DECIMAL(18,2), @DonGia DECIMAL(18,2)
AS BEGIN
    INSERT INTO ChiTietDonHang (MaDonHang, MaLo, SoLuong, DonGia, ThanhTien)
    VALUES (@MaDonHang, @MaLo, @SoLuong, @DonGia, @SoLuong * @DonGia)

    UPDATE DonHang
    SET TongSoLuong=(SELECT SUM(SoLuong) FROM ChiTietDonHang WHERE MaDonHang=@MaDonHang),
        TongGiaTri =(SELECT SUM(ThanhTien) FROM ChiTietDonHang WHERE MaDonHang=@MaDonHang)
    WHERE MaDonHang=@MaDonHang
END
GO

CREATE OR ALTER PROCEDURE sp_CapNhatChiTietDonHangSieuThi
    @MaDonHang INT, @MaLo INT, @SoLuong DECIMAL(18,2), @DonGia DECIMAL(18,2)
AS BEGIN
    UPDATE ChiTietDonHang SET SoLuong=@SoLuong, DonGia=@DonGia, ThanhTien=@SoLuong*@DonGia
    WHERE MaDonHang=@MaDonHang AND MaLo=@MaLo

    UPDATE DonHang
    SET TongSoLuong=(SELECT SUM(SoLuong) FROM ChiTietDonHang WHERE MaDonHang=@MaDonHang),
        TongGiaTri =(SELECT SUM(ThanhTien) FROM ChiTietDonHang WHERE MaDonHang=@MaDonHang)
    WHERE MaDonHang=@MaDonHang
END
GO

CREATE OR ALTER PROCEDURE sp_XoaChiTietDonHangSieuThi
    @MaDonHang INT, @MaLo INT
AS BEGIN
    DELETE FROM ChiTietDonHang WHERE MaDonHang=@MaDonHang AND MaLo=@MaLo

    UPDATE DonHang
    SET TongSoLuong=(SELECT ISNULL(SUM(SoLuong),0) FROM ChiTietDonHang WHERE MaDonHang=@MaDonHang),
        TongGiaTri =(SELECT ISNULL(SUM(ThanhTien),0) FROM ChiTietDonHang WHERE MaDonHang=@MaDonHang)
    WHERE MaDonHang=@MaDonHang
END
GO

-- ===================== KHO SIEU THI =====================

CREATE OR ALTER PROCEDURE sp_GetKhoBySieuThi
    @MaSieuThi INT
AS BEGIN
    SELECT k.*, tk.SoLuong, tk.CapNhatCuoi, lo.MaSanPham, sp.TenSanPham, sp.DonViTinh
    FROM Kho k
    LEFT JOIN TonKho tk ON k.MaKho = tk.MaKho
    LEFT JOIN LoNongSan lo ON tk.MaLo = lo.MaLo
    LEFT JOIN SanPham sp ON lo.MaSanPham = sp.MaSanPham
    WHERE k.MaSieuThi = @MaSieuThi AND k.TrangThai = N'hoat_dong'
    ORDER BY k.MaKho
END
GO

-- ===================== KIEM DINH =====================

CREATE OR ALTER PROCEDURE sp_GetAllKiemDinh
AS BEGIN
    SELECT kd.*, lo.MaTrangTrai, sp.TenSanPham, dl.TenDaiLy, st.TenSieuThi
    FROM KiemDinh kd
    JOIN LoNongSan lo ON kd.MaLo = lo.MaLo
    JOIN SanPham sp ON lo.MaSanPham = sp.MaSanPham
    LEFT JOIN DaiLy dl ON kd.MaDaiLy = dl.MaDaiLy
    LEFT JOIN SieuThi st ON kd.MaSieuThi = st.MaSieuThi
    ORDER BY kd.NgayKiemDinh DESC
END
GO

CREATE OR ALTER PROCEDURE sp_GetKiemDinhById
    @MaKiemDinh INT
AS BEGIN
    SELECT kd.*, lo.MaTrangTrai, sp.TenSanPham, dl.TenDaiLy, st.TenSieuThi
    FROM KiemDinh kd
    JOIN LoNongSan lo ON kd.MaLo = lo.MaLo
    JOIN SanPham sp ON lo.MaSanPham = sp.MaSanPham
    LEFT JOIN DaiLy dl ON kd.MaDaiLy = dl.MaDaiLy
    LEFT JOIN SieuThi st ON kd.MaSieuThi = st.MaSieuThi
    WHERE kd.MaKiemDinh = @MaKiemDinh
END
GO

CREATE OR ALTER PROCEDURE sp_GetKiemDinhByDaiLy
    @MaDaiLy INT
AS BEGIN
    SELECT kd.*, sp.TenSanPham
    FROM KiemDinh kd
    JOIN LoNongSan lo ON kd.MaLo = lo.MaLo
    JOIN SanPham sp ON lo.MaSanPham = sp.MaSanPham
    WHERE kd.MaDaiLy = @MaDaiLy
    ORDER BY kd.NgayKiemDinh DESC
END
GO

CREATE OR ALTER PROCEDURE sp_CreateKiemDinh
    @MaLo INT, @NguoiKiemDinh NVARCHAR(100),
    @MaDaiLy INT = NULL, @MaSieuThi INT = NULL,
    @KetQua NVARCHAR(20), @BienBan NVARCHAR(MAX) = NULL, @GhiChu NVARCHAR(255) = NULL
AS BEGIN
    INSERT INTO KiemDinh (MaLo, NguoiKiemDinh, MaDaiLy, MaSieuThi, KetQua, BienBan, GhiChu)
    OUTPUT INSERTED.MaKiemDinh
    VALUES (@MaLo, @NguoiKiemDinh, @MaDaiLy, @MaSieuThi, @KetQua, @BienBan, @GhiChu)
END
GO

CREATE OR ALTER PROCEDURE sp_UpdateKiemDinh
    @MaKiemDinh INT, @KetQua NVARCHAR(20),
    @BienBan NVARCHAR(MAX) = NULL, @GhiChu NVARCHAR(255) = NULL, @TrangThai NVARCHAR(20)
AS BEGIN
    UPDATE KiemDinh SET KetQua=@KetQua, BienBan=@BienBan, GhiChu=@GhiChu, TrangThai=@TrangThai
    WHERE MaKiemDinh = @MaKiemDinh
END
GO

CREATE OR ALTER PROCEDURE sp_DeleteKiemDinh
    @MaKiemDinh INT
AS BEGIN
    DELETE FROM KiemDinh WHERE MaKiemDinh = @MaKiemDinh
END
GO
