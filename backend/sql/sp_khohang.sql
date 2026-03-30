USE BTL_HDV1;
GO

-- 1. Lấy danh sách kho theo siêu thị
CREATE OR ALTER PROCEDURE sp_GetKhoBySieuThi
    @MaSieuThi INT
AS
BEGIN
    SELECT k.*, tk.SoLuong, tk.CapNhatCuoi,
           lo.MaSanPham, sp.TenSanPham, sp.DonViTinh
    FROM Kho k
    LEFT JOIN TonKho tk ON k.MaKho = tk.MaKho
    LEFT JOIN LoNongSan lo ON tk.MaLo = lo.MaLo
    LEFT JOIN SanPham sp ON lo.MaSanPham = sp.MaSanPham
    WHERE k.MaSieuThi = @MaSieuThi AND k.TrangThai = N'hoat_dong'
    ORDER BY k.MaKho
END
GO

-- 2. Lấy chi tiết kho
CREATE OR ALTER PROCEDURE sp_GetKhoById
    @MaKho INT
AS
BEGIN
    SELECT k.*,
           tk.MaLo, tk.SoLuong, tk.CapNhatCuoi,
           lo.MaSanPham, sp.TenSanPham, sp.DonViTinh
    FROM Kho k
    LEFT JOIN TonKho tk ON k.MaKho = tk.MaKho
    LEFT JOIN LoNongSan lo ON tk.MaLo = lo.MaLo
    LEFT JOIN SanPham sp ON lo.MaSanPham = sp.MaSanPham
    WHERE k.MaKho = @MaKho
END
GO

-- 3. Tạo kho mới
CREATE OR ALTER PROCEDURE sp_TaoKho
    @LoaiKho NVARCHAR(20),
    @MaDaiLy INT = NULL,
    @MaSieuThi INT = NULL,
    @TenKho NVARCHAR(100),
    @DiaChi NVARCHAR(255)
AS
BEGIN
    INSERT INTO Kho (LoaiKho, MaDaiLy, MaSieuThi, TenKho, DiaChi)
    OUTPUT INSERTED.MaKho
    VALUES (@LoaiKho, @MaDaiLy, @MaSieuThi, @TenKho, @DiaChi)
END
GO

-- 4. Cập nhật kho
CREATE OR ALTER PROCEDURE sp_CapNhatKho
    @MaKho INT,
    @TenKho NVARCHAR(100),
    @DiaChi NVARCHAR(255),
    @TrangThai NVARCHAR(20)
AS
BEGIN
    UPDATE Kho
    SET TenKho = @TenKho, DiaChi = @DiaChi, TrangThai = @TrangThai
    WHERE MaKho = @MaKho
END
GO

-- 5. Xóa kho (đánh dấu ngừng hoạt động)
CREATE OR ALTER PROCEDURE sp_XoaKho
    @MaKho INT
AS
BEGIN
    UPDATE Kho SET TrangThai = N'ngung_hoat_dong' WHERE MaKho = @MaKho
END
GO

-- 6. Xóa tồn kho
CREATE OR ALTER PROCEDURE sp_XoaTonKho
    @MaKho INT,
    @MaLo INT
AS
BEGIN
    DELETE FROM TonKho WHERE MaKho = @MaKho AND MaLo = @MaLo
END
GO

-- 7. Lấy tất cả kho
CREATE OR ALTER PROCEDURE sp_GetAllKho
AS
BEGIN
    SELECT k.*, dl.TenDaiLy, st.TenSieuThi
    FROM Kho k
    LEFT JOIN DaiLy dl ON k.MaDaiLy = dl.MaDaiLy
    LEFT JOIN SieuThi st ON k.MaSieuThi = st.MaSieuThi
    WHERE k.TrangThai = N'hoat_dong'
    ORDER BY k.MaKho
END
GO

-- 8. Lấy kho theo đại lý
CREATE OR ALTER PROCEDURE sp_GetKhoByDaiLy
    @MaDaiLy INT
AS
BEGIN
    SELECT k.*, tk.MaLo, tk.SoLuong, tk.CapNhatCuoi,
           lo.MaSanPham, sp.TenSanPham, sp.DonViTinh
    FROM Kho k
    LEFT JOIN TonKho tk ON k.MaKho = tk.MaKho
    LEFT JOIN LoNongSan lo ON tk.MaLo = lo.MaLo
    LEFT JOIN SanPham sp ON lo.MaSanPham = sp.MaSanPham
    WHERE k.MaDaiLy = @MaDaiLy AND k.TrangThai = N'hoat_dong'
    ORDER BY k.MaKho
END
GO
