USE btl;
GO



-- 1. Láº¥y thÃ´ng tin Ä‘áº¡i lÃ½
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

-- 2. Láº¥y táº¥t cáº£ Ä‘áº¡i lÃ½ (tÃ¬m kiáº¿m)
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

-- 2b. Láº¥y Ä‘áº¡i lÃ½ theo MaDaiLy
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

-- 3. Cáº­p nháº­t thÃ´ng tin Ä‘áº¡i lÃ½
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

-- 4. XÃ³a Ä‘áº¡i lÃ½ (xÃ³a má»m - khÃ³a tÃ i khoáº£n)
CREATE OR ALTER PROCEDURE sp_DeleteDaiLy
    @MaDaiLy INT
AS
BEGIN
    UPDATE TaiKhoan SET TrangThai = N'khoa'
    WHERE MaTaiKhoan = (SELECT MaTaiKhoan FROM DaiLy WHERE MaDaiLy = @MaDaiLy)
END
GO

-- 5. ThÃªm Ä‘áº¡i lÃ½ má»›i
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

GO


-- 1. Láº¥y táº¥t cáº£ Ä‘Æ¡n hÃ ng Ä‘áº¡i lÃ½
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

-- 2. Láº¥y chi tiáº¿t Ä‘Æ¡n hÃ ng theo ID
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

-- 3. Láº¥y Ä‘Æ¡n hÃ ng theo nÃ´ng dÃ¢n
CREATE OR ALTER PROCEDURE sp_GetDonHangDaiLyByNongDan
    @MaNongDan INT
AS
BEGIN
    SELECT dh.*, dhd.MaDaiLy, dl.TenDaiLy
    FROM DonHang dh
    JOIN DonHangDaiLy dhd ON dh.MaDonHang = dhd.MaDonHang
    JOIN DaiLy dl ON dhd.MaDaiLy = dl.MaDaiLy
    WHERE dhd.MaNongDan = @MaNongDan
    ORDER BY dh.NgayDat DESC
END
GO

-- 4. Láº¥y Ä‘Æ¡n hÃ ng theo Ä‘áº¡i lÃ½
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

-- 5. Táº¡o Ä‘Æ¡n hÃ ng Ä‘áº¡i lÃ½ -> nÃ´ng dÃ¢n
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

-- 6. Cáº­p nháº­t Ä‘Æ¡n hÃ ng (ghi chÃº)
CREATE OR ALTER PROCEDURE sp_UpdateDonHangDaiLy
    @MaDonHang INT,
    @GhiChu NVARCHAR(255)
AS
BEGIN
    UPDATE DonHang SET GhiChu = @GhiChu WHERE MaDonHang = @MaDonHang
END
GO

-- 7. XÃ¡c nháº­n Ä‘Æ¡n hÃ ng (da_nhan)
CREATE OR ALTER PROCEDURE sp_XacNhanDonHangDaiLy
    @MaDonHang INT
AS
BEGIN
    UPDATE DonHang SET TrangThai = N'da_nhan' WHERE MaDonHang = @MaDonHang
END
GO

-- 8. Xuáº¥t Ä‘Æ¡n (hoan_thanh)
CREATE OR ALTER PROCEDURE sp_XuatDonHangDaiLy
    @MaDonHang INT
AS
BEGIN
    UPDATE DonHang SET TrangThai = N'hoan_thanh', NgayGiao = SYSDATETIME() WHERE MaDonHang = @MaDonHang
END
GO

-- 9. Há»§y Ä‘Æ¡n hÃ ng
CREATE OR ALTER PROCEDURE sp_HuyDonHangDaiLy
    @MaDonHang INT
AS
BEGIN
    UPDATE DonHang SET TrangThai = N'da_huy' WHERE MaDonHang = @MaDonHang
END
GO

-- 10. XÃ³a Ä‘Æ¡n hÃ ng (chá»‰ khi chÆ°a nháº­n)
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
        RAISERROR(N'Chá»‰ cÃ³ thá»ƒ xÃ³a Ä‘Æ¡n hÃ ng chÆ°a nháº­n', 16, 1)
END
GO

-- 11. Láº¥y chi tiáº¿t Ä‘Æ¡n hÃ ng
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

-- 12. ThÃªm chi tiáº¿t Ä‘Æ¡n hÃ ng
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

-- 13. Cáº­p nháº­t chi tiáº¿t Ä‘Æ¡n hÃ ng
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

-- 14. XÃ³a chi tiáº¿t Ä‘Æ¡n hÃ ng
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

GO


-- 1. Láº¥y danh sÃ¡ch kho theo siÃªu thá»‹
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

-- 2. Láº¥y chi tiáº¿t kho
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

-- 3. Táº¡o kho má»›i
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

-- 4. Cáº­p nháº­t kho
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

-- 5. XÃ³a kho (Ä‘Ã¡nh dáº¥u ngá»«ng hoáº¡t Ä‘á»™ng)
CREATE OR ALTER PROCEDURE sp_XoaKho
    @MaKho INT
AS
BEGIN
    UPDATE Kho SET TrangThai = N'ngung_hoat_dong' WHERE MaKho = @MaKho
END
GO

-- 6. XÃ³a tá»“n kho
CREATE OR ALTER PROCEDURE sp_XoaTonKho
    @MaKho INT,
    @MaLo INT
AS
BEGIN
    DELETE FROM TonKho WHERE MaKho = @MaKho AND MaLo = @MaLo
END
GO

-- 7. Láº¥y táº¥t cáº£ kho
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

-- 8. Láº¥y kho theo Ä‘áº¡i lÃ½
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

GO


-- 1. Láº¥y táº¥t cáº£ kiá»ƒm Ä‘á»‹nh
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

-- 2. Láº¥y chi tiáº¿t kiá»ƒm Ä‘á»‹nh
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

-- 3. Láº¥y kiá»ƒm Ä‘á»‹nh theo Ä‘áº¡i lÃ½
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

-- 4. Táº¡o kiá»ƒm Ä‘á»‹nh
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

-- 5. Cáº­p nháº­t kiá»ƒm Ä‘á»‹nh
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

-- 6. XÃ³a kiá»ƒm Ä‘á»‹nh
CREATE OR ALTER PROCEDURE sp_DeleteKiemDinh
    @MaKiemDinh INT
AS
BEGIN
    DELETE FROM KiemDinh WHERE MaKiemDinh = @MaKiemDinh
END
GO

GO
-- =============================================
-- SP Login dÃ¹ng báº£ng TaiKhoan táº­p trung + kiá»ƒm tra role
-- =============================================
CREATE OR ALTER PROCEDURE sp_Login
  @TenDangNhap NVARCHAR(50),
  @MatKhau     NVARCHAR(255),
  @LoaiYeuCau  NVARCHAR(20)  -- role ngÆ°á»i dÃ¹ng chá»n
AS
BEGIN
  SET NOCOUNT ON;

  DECLARE @MaTaiKhoan INT, @LoaiTaiKhoan NVARCHAR(20), @TrangThai NVARCHAR(20);

  SELECT @MaTaiKhoan   = MaTaiKhoan,
         @LoaiTaiKhoan = LoaiTaiKhoan,
         @TrangThai    = TrangThai
  FROM TaiKhoan
  WHERE TenDangNhap = @TenDangNhap
    AND MatKhau     = @MatKhau;

  IF @MaTaiKhoan IS NULL
  BEGIN
    RAISERROR(N'Sai tÃªn Ä‘Äƒng nháº­p hoáº·c máº­t kháº©u', 16, 1); RETURN;
  END

  IF @TrangThai != N'hoat_dong'
  BEGIN
    RAISERROR(N'TÃ i khoáº£n Ä‘Ã£ bá»‹ khÃ³a', 16, 1); RETURN;
  END

  -- Kiá»ƒm tra role cÃ³ khá»›p khÃ´ng
  IF @LoaiTaiKhoan != @LoaiYeuCau
  BEGIN
    RAISERROR(N'Loáº¡i tÃ i khoáº£n khÃ´ng Ä‘Ãºng', 16, 1); RETURN;
  END

  UPDATE TaiKhoan SET LanDangNhapCuoi = SYSDATETIME() WHERE MaTaiKhoan = @MaTaiKhoan;

  IF @LoaiTaiKhoan = N'nongdan'
    SELECT tk.MaTaiKhoan, tk.TenDangNhap, tk.LoaiTaiKhoan,
           nd.MaNongDan AS MaDoiTuong, nd.HoTen AS TenHienThi,
           nd.Email, nd.SoDienThoai, nd.DiaChi
    FROM TaiKhoan tk JOIN NongDan nd ON nd.MaTaiKhoan = tk.MaTaiKhoan
    WHERE tk.MaTaiKhoan = @MaTaiKhoan;

  ELSE IF @LoaiTaiKhoan = N'daily'
    SELECT tk.MaTaiKhoan, tk.TenDangNhap, tk.LoaiTaiKhoan,
           dl.MaDaiLy AS MaDoiTuong, dl.TenDaiLy AS TenHienThi,
           dl.Email, dl.SoDienThoai, dl.DiaChi
    FROM TaiKhoan tk JOIN DaiLy dl ON dl.MaTaiKhoan = tk.MaTaiKhoan
    WHERE tk.MaTaiKhoan = @MaTaiKhoan;

  ELSE IF @LoaiTaiKhoan = N'sieuthi'
    SELECT tk.MaTaiKhoan, tk.TenDangNhap, tk.LoaiTaiKhoan,
           st.MaSieuThi AS MaDoiTuong, st.TenSieuThi AS TenHienThi,
           st.Email, st.SoDienThoai, st.DiaChi
    FROM TaiKhoan tk JOIN SieuThi st ON st.MaTaiKhoan = tk.MaTaiKhoan
    WHERE tk.MaTaiKhoan = @MaTaiKhoan;

  ELSE IF @LoaiTaiKhoan = N'admin'
    SELECT tk.MaTaiKhoan, tk.TenDangNhap, tk.LoaiTaiKhoan,
           a.MaAdmin AS MaDoiTuong, a.HoTen AS TenHienThi,
           a.Email, a.SoDienThoai, NULL AS DiaChi
    FROM TaiKhoan tk JOIN Admin a ON a.MaTaiKhoan = tk.MaTaiKhoan
    WHERE tk.MaTaiKhoan = @MaTaiKhoan;
END;
GO

-- =============================================
-- SP Reset Password
-- =============================================
CREATE OR ALTER PROCEDURE sp_ResetPassword
  @LoaiTaiKhoan NVARCHAR(20),
  @Email        NVARCHAR(100),
  @MatKhauMoi   NVARCHAR(255)
AS
BEGIN
  SET NOCOUNT ON;
  DECLARE @MaTaiKhoan INT;

  -- TÃ¬m tÃ i khoáº£n theo email vÃ  loáº¡i
  IF @LoaiTaiKhoan = N'nongdan'
    SELECT @MaTaiKhoan = tk.MaTaiKhoan FROM TaiKhoan tk
    JOIN NongDan nd ON nd.MaTaiKhoan = tk.MaTaiKhoan
    WHERE nd.Email = @Email AND tk.LoaiTaiKhoan = @LoaiTaiKhoan;

  ELSE IF @LoaiTaiKhoan = N'daily'
    SELECT @MaTaiKhoan = tk.MaTaiKhoan FROM TaiKhoan tk
    JOIN DaiLy dl ON dl.MaTaiKhoan = tk.MaTaiKhoan
    WHERE dl.Email = @Email AND tk.LoaiTaiKhoan = @LoaiTaiKhoan;

  ELSE IF @LoaiTaiKhoan = N'sieuthi'
    SELECT @MaTaiKhoan = tk.MaTaiKhoan FROM TaiKhoan tk
    JOIN SieuThi st ON st.MaTaiKhoan = tk.MaTaiKhoan
    WHERE st.Email = @Email AND tk.LoaiTaiKhoan = @LoaiTaiKhoan;

  ELSE IF @LoaiTaiKhoan = N'admin'
    SELECT @MaTaiKhoan = tk.MaTaiKhoan FROM TaiKhoan tk
    JOIN Admin a ON a.MaTaiKhoan = tk.MaTaiKhoan
    WHERE a.Email = @Email AND tk.LoaiTaiKhoan = @LoaiTaiKhoan;

  IF @MaTaiKhoan IS NULL
  BEGIN
    SELECT 0 AS Success; RETURN;
  END

  UPDATE TaiKhoan SET MatKhau = @MatKhauMoi WHERE MaTaiKhoan = @MaTaiKhoan;
  SELECT 1 AS Success;
END;
GO

-- =============================================
-- SP Register - táº¡o TaiKhoan + báº£ng tÆ°Æ¡ng á»©ng
-- =============================================
CREATE OR ALTER PROCEDURE sp_Register
  @TenDangNhap  NVARCHAR(50),
  @MatKhau      NVARCHAR(255),
  @LoaiTaiKhoan NVARCHAR(20),
  @HoTen        NVARCHAR(100),
  @SoDienThoai  NVARCHAR(20)  = NULL,
  @Email        NVARCHAR(100) = NULL,
  @DiaChi       NVARCHAR(255) = NULL
AS
BEGIN
  SET NOCOUNT ON;
  BEGIN TRANSACTION;
  BEGIN TRY
    -- Kiá»ƒm tra trÃ¹ng tÃªn Ä‘Äƒng nháº­p
    IF EXISTS (SELECT 1 FROM TaiKhoan WHERE TenDangNhap = @TenDangNhap)
    BEGIN
      RAISERROR(N'TÃªn Ä‘Äƒng nháº­p Ä‘Ã£ tá»“n táº¡i', 16, 1); RETURN;
    END

    -- Táº¡o tÃ i khoáº£n
    INSERT INTO TaiKhoan (TenDangNhap, MatKhau, LoaiTaiKhoan)
    VALUES (@TenDangNhap, @MatKhau, @LoaiTaiKhoan);

    DECLARE @MaTaiKhoan INT = SCOPE_IDENTITY();

    -- Táº¡o báº£ng tÆ°Æ¡ng á»©ng
    IF @LoaiTaiKhoan = N'nongdan'
      INSERT INTO NongDan (MaTaiKhoan, HoTen, SoDienThoai, Email, DiaChi)
      VALUES (@MaTaiKhoan, @HoTen, @SoDienThoai, @Email, @DiaChi);

    ELSE IF @LoaiTaiKhoan = N'daily'
      INSERT INTO DaiLy (MaTaiKhoan, TenDaiLy, SoDienThoai, Email, DiaChi)
      VALUES (@MaTaiKhoan, @HoTen, @SoDienThoai, @Email, @DiaChi);

    ELSE IF @LoaiTaiKhoan = N'sieuthi'
      INSERT INTO SieuThi (MaTaiKhoan, TenSieuThi, SoDienThoai, Email, DiaChi)
      VALUES (@MaTaiKhoan, @HoTen, @SoDienThoai, @Email, @DiaChi);

    ELSE IF @LoaiTaiKhoan = N'admin'
      INSERT INTO Admin (MaTaiKhoan, HoTen, SoDienThoai, Email)
      VALUES (@MaTaiKhoan, @HoTen, @SoDienThoai, @Email);

    COMMIT;
    SELECT @MaTaiKhoan AS MaTaiKhoan;
  END TRY
  BEGIN CATCH
    ROLLBACK;
    THROW;
  END CATCH
END;
GO

GO


-- 1. Láº¥y táº¥t cáº£ lÃ´ nÃ´ng sáº£n
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

-- 2. Láº¥y chi tiáº¿t lÃ´ theo ID
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

-- 3. Láº¥y lÃ´ theo trang tráº¡i
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

-- 4. Láº¥y lÃ´ theo nÃ´ng dÃ¢n
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

-- 5. Táº¡o lÃ´ nÃ´ng sáº£n
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

-- 6. Cáº­p nháº­t lÃ´ nÃ´ng sáº£n
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

-- 7. XÃ³a lÃ´ nÃ´ng sáº£n
CREATE OR ALTER PROCEDURE sp_DeleteLoNongSan
    @MaLo INT
AS
BEGIN
    DELETE FROM LoNongSan WHERE MaLo = @MaLo
END
GO

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
    @MatKhau NVARCHAR(255),
    @HoTen NVARCHAR(100),
    @SoDienThoai NVARCHAR(20),
    @Email NVARCHAR(100),
    @DiaChi NVARCHAR(255)
AS
BEGIN
    BEGIN TRANSACTION
    BEGIN TRY
        INSERT INTO TaiKhoan (TenDangNhap, MatKhau, LoaiTaiKhoan)
        VALUES (@TenDangNhap, @MatKhau, 'nongdan')

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
      AND (TrangThai IS NULL OR TrangThai = N'hoat_dong')
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
    SET NOCOUNT ON;

    IF NOT EXISTS (SELECT 1 FROM TrangTrai WHERE MaTrangTrai = @MaTrangTrai)
    BEGIN
        RAISERROR(N'Trang tráº¡i khÃ´ng tá»“n táº¡i', 16, 1); RETURN;
    END

    -- CÃ²n lÃ´ hÃ ng â†’ chuyá»ƒn tráº¡ng thÃ¡i
    IF EXISTS (SELECT 1 FROM LoNongSan WHERE MaTrangTrai = @MaTrangTrai)
    BEGIN
        UPDATE TrangTrai SET TrangThai = N'ngung_hoat_dong' WHERE MaTrangTrai = @MaTrangTrai;
        SELECT 0 AS Deleted, N'Trang tráº¡i cÃ²n lÃ´ hÃ ng, Ä‘Ã£ chuyá»ƒn sang ngá»«ng hoáº¡t Ä‘á»™ng' AS Message;
    END
    ELSE
    BEGIN
        DELETE FROM TrangTrai WHERE MaTrangTrai = @MaTrangTrai;
        SELECT 1 AS Deleted, N'XÃ³a trang tráº¡i thÃ nh cÃ´ng' AS Message;
    END
END
GO

GO
-- sp_GetAllSanPham
CREATE OR ALTER PROCEDURE sp_GetAllSanPham
AS
BEGIN
    SELECT MaSanPham, TenSanPham, DonVi, MoTa FROM SanPham
END
GO

-- sp_GetSanPhamById
CREATE OR ALTER PROCEDURE sp_GetSanPhamById
    @MaSanPham INT
AS
BEGIN
    SELECT MaSanPham, TenSanPham, DonVi, MoTa FROM SanPham WHERE MaSanPham = @MaSanPham
END
GO

-- sp_CreateSanPham
CREATE OR ALTER PROCEDURE sp_CreateSanPham
    @TenSanPham NVARCHAR(100),
    @DonVi NVARCHAR(50),
    @MoTa NVARCHAR(255)
AS
BEGIN
    INSERT INTO SanPham (TenSanPham, DonVi, MoTa)
    OUTPUT INSERTED.MaSanPham
    VALUES (@TenSanPham, @DonVi, @MoTa)
END
GO

-- sp_UpdateSanPham
CREATE OR ALTER PROCEDURE sp_UpdateSanPham
    @MaSanPham INT,
    @TenSanPham NVARCHAR(100),
    @DonVi NVARCHAR(50),
    @MoTa NVARCHAR(255)
AS
BEGIN
    UPDATE SanPham SET TenSanPham = @TenSanPham, DonVi = @DonVi, MoTa = @MoTa
    WHERE MaSanPham = @MaSanPham
END
GO

-- sp_DeleteSanPham
CREATE OR ALTER PROCEDURE sp_DeleteSanPham
    @MaSanPham INT
AS
BEGIN
    DELETE FROM SanPham WHERE MaSanPham = @MaSanPham
END
GO

GO


-- 1. Láº¥y thÃ´ng tin siÃªu thá»‹
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

-- 2. TÃ¬m kiáº¿m siÃªu thá»‹
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

-- 3. ThÃªm siÃªu thá»‹ má»›i
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

-- 4. Cáº­p nháº­t siÃªu thá»‹
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

-- 5. XÃ³a siÃªu thá»‹ (khÃ³a tÃ i khoáº£n)
CREATE OR ALTER PROCEDURE sp_DeleteSieuThi
    @MaSieuThi INT
AS
BEGIN
    UPDATE TaiKhoan SET TrangThai = N'khoa'
    WHERE MaTaiKhoan = (SELECT MaTaiKhoan FROM SieuThi WHERE MaSieuThi = @MaSieuThi)
END
GO

-- 6. Táº¡o Ä‘Æ¡n hÃ ng siÃªu thá»‹ -> Ä‘áº¡i lÃ½
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

-- 7. ThÃªm chi tiáº¿t Ä‘Æ¡n hÃ ng
CREATE OR ALTER PROCEDURE sp_ThemChiTietDonHangSieuThi
    @MaDonHang INT,
    @MaLo INT,
    @SoLuong DECIMAL(18,2),
    @DonGia DECIMAL(18,2)
AS
BEGIN
    INSERT INTO ChiTietDonHang (MaDonHang, MaLo, SoLuong, DonGia, ThanhTien)
    VALUES (@MaDonHang, @MaLo, @SoLuong, @DonGia, @SoLuong * @DonGia)

    -- Cáº­p nháº­t tá»•ng Ä‘Æ¡n hÃ ng
    UPDATE DonHang
    SET TongSoLuong = (SELECT SUM(SoLuong) FROM ChiTietDonHang WHERE MaDonHang = @MaDonHang),
        TongGiaTri  = (SELECT SUM(ThanhTien) FROM ChiTietDonHang WHERE MaDonHang = @MaDonHang)
    WHERE MaDonHang = @MaDonHang
END
GO

-- 8. Cáº­p nháº­t chi tiáº¿t Ä‘Æ¡n hÃ ng
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

-- 9. XÃ³a chi tiáº¿t Ä‘Æ¡n hÃ ng
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

-- 10. Nháº­n Ä‘Æ¡n hÃ ng
CREATE OR ALTER PROCEDURE sp_NhanDonHangSieuThi
    @MaDonHang INT
AS
BEGIN
    UPDATE DonHang SET TrangThai = N'da_nhan' WHERE MaDonHang = @MaDonHang
END
GO

-- 11. Há»§y Ä‘Æ¡n hÃ ng
CREATE OR ALTER PROCEDURE sp_HuyDonHangSieuThi
    @MaDonHang INT
AS
BEGIN
    UPDATE DonHang SET TrangThai = N'da_huy' WHERE MaDonHang = @MaDonHang
END
GO

-- 12. Láº¥y chi tiáº¿t Ä‘Æ¡n hÃ ng
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

-- 13. Láº¥y danh sÃ¡ch Ä‘Æ¡n hÃ ng theo siÃªu thá»‹
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

-- 14. Láº¥y Ä‘Æ¡n hÃ ng siÃªu thá»‹ theo Ä‘áº¡i lÃ½
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

-- 15. Cáº­p nháº­t tráº¡ng thÃ¡i Ä‘Æ¡n hÃ ng siÃªu thá»‹
CREATE OR ALTER PROCEDURE sp_UpdateTrangThaiDonHangSieuThi
    @MaDonHang INT,
    @TrangThai NVARCHAR(30)
AS
BEGIN
    UPDATE DonHang SET TrangThai = @TrangThai WHERE MaDonHang = @MaDonHang
END
GO

GO
CREATE OR ALTER PROCEDURE sp_UpdateProfile
  @MaTaiKhoan  INT,
  @HoTen       NVARCHAR(100),
  @SoDienThoai NVARCHAR(20)  = NULL,
  @Email       NVARCHAR(100) = NULL,
  @DiaChi      NVARCHAR(255) = NULL
AS
BEGIN
  SET NOCOUNT ON;
  DECLARE @LoaiTaiKhoan NVARCHAR(20);
  SELECT @LoaiTaiKhoan = LoaiTaiKhoan FROM TaiKhoan WHERE MaTaiKhoan = @MaTaiKhoan;
  IF @LoaiTaiKhoan IS NULL RAISERROR(N'TÃ i khoáº£n khÃ´ng tá»“n táº¡i', 16, 1);

  IF @LoaiTaiKhoan = N'nongdan'
    UPDATE NongDan SET HoTen=@HoTen, SoDienThoai=@SoDienThoai, Email=@Email, DiaChi=@DiaChi
    WHERE MaTaiKhoan = @MaTaiKhoan;
  ELSE IF @LoaiTaiKhoan = N'daily'
    UPDATE DaiLy SET TenDaiLy=@HoTen, SoDienThoai=@SoDienThoai, Email=@Email, DiaChi=@DiaChi
    WHERE MaTaiKhoan = @MaTaiKhoan;
  ELSE IF @LoaiTaiKhoan = N'sieuthi'
    UPDATE SieuThi SET TenSieuThi=@HoTen, SoDienThoai=@SoDienThoai, Email=@Email, DiaChi=@DiaChi
    WHERE MaTaiKhoan = @MaTaiKhoan;
  ELSE IF @LoaiTaiKhoan = N'admin'
    UPDATE Admin SET HoTen=@HoTen, SoDienThoai=@SoDienThoai, Email=@Email
    WHERE MaTaiKhoan = @MaTaiKhoan;

  SELECT 1 AS Success;
END;
GO
