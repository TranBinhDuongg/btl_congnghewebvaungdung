USE BTL_HDV1;
GO

-- 1. Lấy tất cả kiểm định
CREATE OR ALTER PROCEDURE sp_GetAllKiemDinh
AS
BEGIN
    SELECT kd.*, lo.MaTrangTrai, sp.TenSanPham,
           dl.TenDaiLy, st.TenSieuThi
    FROM KiemDinh kd
    JOIN LoNongSan lo ON kd.MaLo = lo.MaLo
    JOIN SanPham sp ON lo.MaSanPham = sp.MaSanPham
    LEFT JOIN DaiLy dl ON kd.MaDaiLy = dl.MaDaiLy
    LEFT JOIN SieuThi st ON kd.MaSieuThi = st.MaSieuThi
    ORDER BY kd.NgayKiemDinh DESC
END
GO

-- 2. Lấy chi tiết kiểm định
CREATE OR ALTER PROCEDURE sp_GetKiemDinhById
    @MaKiemDinh INT
AS
BEGIN
    SELECT kd.*, lo.MaTrangTrai, sp.TenSanPham,
           dl.TenDaiLy, st.TenSieuThi
    FROM KiemDinh kd
    JOIN LoNongSan lo ON kd.MaLo = lo.MaLo
    JOIN SanPham sp ON lo.MaSanPham = sp.MaSanPham
    LEFT JOIN DaiLy dl ON kd.MaDaiLy = dl.MaDaiLy
    LEFT JOIN SieuThi st ON kd.MaSieuThi = st.MaSieuThi
    WHERE kd.MaKiemDinh = @MaKiemDinh
END
GO

-- 3. Lấy kiểm định theo đại lý
CREATE OR ALTER PROCEDURE sp_GetKiemDinhByDaiLy
    @MaDaiLy INT
AS
BEGIN
    SELECT kd.*, sp.TenSanPham
    FROM KiemDinh kd
    JOIN LoNongSan lo ON kd.MaLo = lo.MaLo
    JOIN SanPham sp ON lo.MaSanPham = sp.MaSanPham
    WHERE kd.MaDaiLy = @MaDaiLy
    ORDER BY kd.NgayKiemDinh DESC
END
GO

-- 4. Tạo kiểm định
CREATE OR ALTER PROCEDURE sp_CreateKiemDinh
    @MaLo INT,
    @NguoiKiemDinh NVARCHAR(100),
    @MaDaiLy INT = NULL,
    @MaSieuThi INT = NULL,
    @KetQua NVARCHAR(20),
    @BienBan NVARCHAR(MAX) = NULL,
    @GhiChu NVARCHAR(255) = NULL
AS
BEGIN
    INSERT INTO KiemDinh (MaLo, NguoiKiemDinh, MaDaiLy, MaSieuThi, KetQua, BienBan, GhiChu)
    OUTPUT INSERTED.MaKiemDinh
    VALUES (@MaLo, @NguoiKiemDinh, @MaDaiLy, @MaSieuThi, @KetQua, @BienBan, @GhiChu)
END
GO

-- 5. Cập nhật kiểm định
CREATE OR ALTER PROCEDURE sp_UpdateKiemDinh
    @MaKiemDinh INT,
    @KetQua NVARCHAR(20),
    @BienBan NVARCHAR(MAX) = NULL,
    @GhiChu NVARCHAR(255) = NULL,
    @TrangThai NVARCHAR(20)
AS
BEGIN
    UPDATE KiemDinh
    SET KetQua = @KetQua, BienBan = @BienBan,
        GhiChu = @GhiChu, TrangThai = @TrangThai
    WHERE MaKiemDinh = @MaKiemDinh
END
GO

-- 6. Xóa kiểm định
CREATE OR ALTER PROCEDURE sp_DeleteKiemDinh
    @MaKiemDinh INT
AS
BEGIN
    DELETE FROM KiemDinh WHERE MaKiemDinh = @MaKiemDinh
END
GO
