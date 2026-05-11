-- ============================================================================
-- 04. STORED PROCEDURES - ĐẠI LÝ
-- Quản lý đại lý, đơn hàng daily->nông dân, kho hàng, xuất nhập kho
-- ============================================================================
USE btl;
GO

-- ===================== DAI LY =====================

CREATE OR ALTER PROCEDURE sp_GetDaiLyProfile
    @MaTaiKhoan INT
AS BEGIN
    SELECT dl.*, tk.TenDangNhap, tk.TrangThai AS TrangThaiTK
    FROM DaiLy dl JOIN TaiKhoan tk ON dl.MaTaiKhoan = tk.MaTaiKhoan
    WHERE dl.MaTaiKhoan = @MaTaiKhoan
END
GO

CREATE OR ALTER PROCEDURE sp_GetDaiLyById
    @MaDaiLy INT
AS BEGIN
    SELECT dl.*, tk.TenDangNhap, tk.TrangThai AS TrangThaiTK
    FROM DaiLy dl JOIN TaiKhoan tk ON dl.MaTaiKhoan = tk.MaTaiKhoan
    WHERE dl.MaDaiLy = @MaDaiLy
END
GO

CREATE OR ALTER PROCEDURE sp_SearchDaiLy
    @Keyword NVARCHAR(100) = NULL
AS BEGIN
    SELECT dl.*, tk.TenDangNhap, tk.TrangThai AS TrangThaiTK
    FROM DaiLy dl JOIN TaiKhoan tk ON dl.MaTaiKhoan = tk.MaTaiKhoan
    WHERE @Keyword IS NULL
       OR dl.TenDaiLy    LIKE N'%' + @Keyword + '%'
       OR dl.Email       LIKE N'%' + @Keyword + '%'
       OR dl.SoDienThoai LIKE N'%' + @Keyword + '%'
       OR dl.DiaChi      LIKE N'%' + @Keyword + '%'
    ORDER BY dl.MaDaiLy
END
GO

CREATE OR ALTER PROCEDURE sp_UpdateDaiLy
    @MaDaiLy INT, @TenDaiLy NVARCHAR(100), @SoDienThoai NVARCHAR(20),
    @Email NVARCHAR(100), @DiaChi NVARCHAR(255)
AS BEGIN
    UPDATE DaiLy SET TenDaiLy=@TenDaiLy, SoDienThoai=@SoDienThoai, Email=@Email, DiaChi=@DiaChi
    WHERE MaDaiLy = @MaDaiLy
END
GO

CREATE OR ALTER PROCEDURE sp_DeleteDaiLy
    @MaDaiLy INT
AS BEGIN
    UPDATE TaiKhoan SET TrangThai = N'khoa'
    WHERE MaTaiKhoan = (SELECT MaTaiKhoan FROM DaiLy WHERE MaDaiLy = @MaDaiLy)
END
GO

-- ===================== DON HANG DAI LY -> NONG DAN =====================

CREATE OR ALTER PROCEDURE sp_GetAllDonHangDaiLy
AS BEGIN
    SELECT dh.*, dhd.MaDaiLy, dl.TenDaiLy, dhd.MaNongDan, nd.HoTen AS TenNongDan
    FROM DonHang dh
    JOIN DonHangDaiLy dhd ON dh.MaDonHang = dhd.MaDonHang
    JOIN DaiLy dl ON dhd.MaDaiLy = dl.MaDaiLy
    JOIN NongDan nd ON dhd.MaNongDan = nd.MaNongDan
    ORDER BY dh.NgayDat DESC
END
GO

CREATE OR ALTER PROCEDURE sp_GetDonHangDaiLyById
    @MaDonHang INT
AS BEGIN
    SELECT dh.*, dhd.MaDaiLy, dl.TenDaiLy, dhd.MaNongDan, nd.HoTen AS TenNongDan,
           ct.MaLo, ct.SoLuong, ct.DonGia, ct.ThanhTien, sp.TenSanPham, sp.DonViTinh
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

CREATE OR ALTER PROCEDURE sp_GetDonHangByDaiLy
    @MaDaiLy INT
AS BEGIN
    SELECT dh.*, dhd.MaNongDan, nd.HoTen AS TenNongDan
    FROM DonHang dh
    JOIN DonHangDaiLy dhd ON dh.MaDonHang = dhd.MaDonHang
    JOIN NongDan nd ON dhd.MaNongDan = nd.MaNongDan
    WHERE dhd.MaDaiLy = @MaDaiLy
    ORDER BY dh.NgayDat DESC
END
GO

CREATE OR ALTER PROCEDURE sp_GetDonHangDaiLyByNongDan
    @MaNongDan INT
AS BEGIN
    SELECT dh.MaDonHang, dh.TrangThai, dh.NgayDat, dh.NgayGiao,
           dh.TongSoLuong, dh.TongGiaTri, dh.GhiChu,
           dhd.MaDaiLy, dl.TenDaiLy,
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

CREATE OR ALTER PROCEDURE sp_CreateDonHangDaiLy
    @MaDaiLy INT, @MaNongDan INT, @GhiChu NVARCHAR(255) = NULL
AS BEGIN
    INSERT INTO DonHang (LoaiDon, TrangThai, GhiChu)
    OUTPUT INSERTED.MaDonHang
    VALUES ('daily_to_nongdan', N'chua_nhan', @GhiChu)

    DECLARE @MaDonHang INT = SCOPE_IDENTITY()
    INSERT INTO DonHangDaiLy (MaDonHang, MaDaiLy, MaNongDan) VALUES (@MaDonHang, @MaDaiLy, @MaNongDan)
END
GO

CREATE OR ALTER PROCEDURE sp_UpdateDonHangDaiLy
    @MaDonHang INT, @GhiChu NVARCHAR(255)
AS BEGIN
    UPDATE DonHang SET GhiChu = @GhiChu WHERE MaDonHang = @MaDonHang
END
GO

CREATE OR ALTER PROCEDURE sp_XacNhanDonHangDaiLy
    @MaDonHang INT
AS BEGIN
    SET NOCOUNT ON;
    -- Kiểm tra từng lô trong đơn có đủ tồn kho không
    IF EXISTS (
        SELECT 1 FROM ChiTietDonHang ct
        JOIN LoNongSan lo ON ct.MaLo = lo.MaLo
        WHERE ct.MaDonHang = @MaDonHang AND ct.SoLuong > lo.SoLuongHienTai
    )
        RAISERROR(N'Tồn kho không đủ cho một hoặc nhiều sản phẩm trong đơn', 16, 1)

    UPDATE DonHang SET TrangThai = N'da_nhan' WHERE MaDonHang = @MaDonHang
END
GO

CREATE OR ALTER PROCEDURE sp_XuatDonHangDaiLy
    @MaDonHang INT
AS BEGIN
    SET NOCOUNT ON;
    BEGIN TRANSACTION
    BEGIN TRY
        -- Trừ SoLuongHienTai trong LoNongSan cho từng lô trong đơn
        UPDATE lo
        SET lo.SoLuongHienTai = lo.SoLuongHienTai - ct.SoLuong
        FROM LoNongSan lo
        JOIN ChiTietDonHang ct ON lo.MaLo = ct.MaLo
        WHERE ct.MaDonHang = @MaDonHang

        UPDATE DonHang
        SET TrangThai = N'hoan_thanh', NgayGiao = SYSDATETIME()
        WHERE MaDonHang = @MaDonHang

        COMMIT
    END TRY
    BEGIN CATCH
        ROLLBACK
        DECLARE @Err NVARCHAR(4000) = N'Lỗi xuất hàng: ' + ERROR_MESSAGE()
        RAISERROR(@Err, 16, 1)
    END CATCH
END
GO

CREATE OR ALTER PROCEDURE sp_HuyDonHangDaiLy
    @MaDonHang INT
AS BEGIN
    UPDATE DonHang SET TrangThai = N'da_huy' WHERE MaDonHang = @MaDonHang
END
GO

CREATE OR ALTER PROCEDURE sp_DeleteDonHangDaiLy
    @MaDonHang INT
AS BEGIN
    IF EXISTS (SELECT 1 FROM DonHang WHERE MaDonHang = @MaDonHang AND TrangThai = N'chua_nhan')
    BEGIN
        DELETE FROM ChiTietDonHang WHERE MaDonHang = @MaDonHang
        DELETE FROM DonHangDaiLy WHERE MaDonHang = @MaDonHang
        DELETE FROM DonHang WHERE MaDonHang = @MaDonHang
    END
    ELSE RAISERROR(N'Chỉ có thể xóa đơn hàng chưa nhận', 16, 1)
END
GO

CREATE OR ALTER PROCEDURE sp_GetChiTietDonHangDaiLy
    @MaDonHang INT
AS BEGIN
    SELECT ct.*, lo.MaSanPham, sp.TenSanPham, sp.DonViTinh
    FROM ChiTietDonHang ct
    JOIN LoNongSan lo ON ct.MaLo = lo.MaLo
    JOIN SanPham sp ON lo.MaSanPham = sp.MaSanPham
    WHERE ct.MaDonHang = @MaDonHang
END
GO

CREATE OR ALTER PROCEDURE sp_AddChiTietDonHangDaiLy
    @MaDonHang INT, @MaLo INT, @SoLuong DECIMAL(18,2), @DonGia DECIMAL(18,2)
AS BEGIN
    SET NOCOUNT ON;
    -- Kiểm tra tồn kho nông dân
    DECLARE @TonHienTai DECIMAL(18,2)
    SELECT @TonHienTai = SoLuongHienTai FROM LoNongSan WHERE MaLo = @MaLo
    IF @TonHienTai IS NULL
        RAISERROR(N'Lô hàng không tồn tại', 16, 1)
    IF @SoLuong > @TonHienTai
        RAISERROR(N'Số lượng đặt vượt quá tồn kho của nông dân', 16, 1)

    INSERT INTO ChiTietDonHang (MaDonHang, MaLo, SoLuong, DonGia, ThanhTien)
    VALUES (@MaDonHang, @MaLo, @SoLuong, @DonGia, @SoLuong * @DonGia)

    UPDATE DonHang
    SET TongSoLuong = (SELECT SUM(SoLuong)   FROM ChiTietDonHang WHERE MaDonHang = @MaDonHang),
        TongGiaTri  = (SELECT SUM(ThanhTien) FROM ChiTietDonHang WHERE MaDonHang = @MaDonHang)
    WHERE MaDonHang = @MaDonHang
END
GO

CREATE OR ALTER PROCEDURE sp_UpdateChiTietDonHangDaiLy
    @MaDonHang INT, @MaLo INT, @SoLuong DECIMAL(18,2), @DonGia DECIMAL(18,2)
AS BEGIN
    UPDATE ChiTietDonHang
    SET SoLuong=@SoLuong, DonGia=@DonGia, ThanhTien=@SoLuong*@DonGia
    WHERE MaDonHang=@MaDonHang AND MaLo=@MaLo

    UPDATE DonHang
    SET TongSoLuong = (SELECT SUM(SoLuong)   FROM ChiTietDonHang WHERE MaDonHang = @MaDonHang),
        TongGiaTri  = (SELECT SUM(ThanhTien) FROM ChiTietDonHang WHERE MaDonHang = @MaDonHang)
    WHERE MaDonHang = @MaDonHang
END
GO

CREATE OR ALTER PROCEDURE sp_DeleteChiTietDonHangDaiLy
    @MaDonHang INT, @MaLo INT
AS BEGIN
    DELETE FROM ChiTietDonHang WHERE MaDonHang=@MaDonHang AND MaLo=@MaLo

    UPDATE DonHang
    SET TongSoLuong = (SELECT ISNULL(SUM(SoLuong),0)   FROM ChiTietDonHang WHERE MaDonHang = @MaDonHang),
        TongGiaTri  = (SELECT ISNULL(SUM(ThanhTien),0) FROM ChiTietDonHang WHERE MaDonHang = @MaDonHang)
    WHERE MaDonHang = @MaDonHang
END
GO

-- ===================== KHO HANG DAI LY =====================

CREATE OR ALTER PROCEDURE sp_GetAllKho
AS BEGIN
    SELECT k.*, dl.TenDaiLy, st.TenSieuThi
    FROM Kho k
    LEFT JOIN DaiLy dl ON k.MaDaiLy = dl.MaDaiLy
    LEFT JOIN SieuThi st ON k.MaSieuThi = st.MaSieuThi
    WHERE k.TrangThai = N'hoat_dong'
    ORDER BY k.MaKho
END
GO

CREATE OR ALTER PROCEDURE sp_GetKhoById
    @MaKho INT
AS BEGIN
    SELECT k.*, tk.MaLo, tk.SoLuong, tk.CapNhatCuoi, lo.MaSanPham, sp.TenSanPham, sp.DonViTinh
    FROM Kho k
    LEFT JOIN TonKho tk ON k.MaKho = tk.MaKho
    LEFT JOIN LoNongSan lo ON tk.MaLo = lo.MaLo
    LEFT JOIN SanPham sp ON lo.MaSanPham = sp.MaSanPham
    WHERE k.MaKho = @MaKho
END
GO

CREATE OR ALTER PROCEDURE sp_GetKhoByDaiLy
    @MaDaiLy INT
AS BEGIN
    SELECT k.*, tk.MaLo, tk.SoLuong, tk.CapNhatCuoi, lo.MaSanPham, sp.TenSanPham, sp.DonViTinh
    FROM Kho k
    LEFT JOIN TonKho tk ON k.MaKho = tk.MaKho
    LEFT JOIN LoNongSan lo ON tk.MaLo = lo.MaLo
    LEFT JOIN SanPham sp ON lo.MaSanPham = sp.MaSanPham
    WHERE k.MaDaiLy = @MaDaiLy AND k.TrangThai = N'hoat_dong'
    ORDER BY k.MaKho
END
GO

CREATE OR ALTER PROCEDURE sp_TaoKho
    @LoaiKho NVARCHAR(20), @MaDaiLy INT = NULL, @MaSieuThi INT = NULL,
    @TenKho NVARCHAR(100), @DiaChi NVARCHAR(255)
AS BEGIN
    INSERT INTO Kho (LoaiKho, MaDaiLy, MaSieuThi, TenKho, DiaChi)
    OUTPUT INSERTED.MaKho
    VALUES (@LoaiKho, @MaDaiLy, @MaSieuThi, @TenKho, @DiaChi)
END
GO

CREATE OR ALTER PROCEDURE sp_CapNhatKho
    @MaKho INT, @TenKho NVARCHAR(100), @DiaChi NVARCHAR(255), @TrangThai NVARCHAR(20)
AS BEGIN
    UPDATE Kho SET TenKho=@TenKho, DiaChi=@DiaChi, TrangThai=@TrangThai WHERE MaKho=@MaKho
END
GO

CREATE OR ALTER PROCEDURE sp_XoaKho
    @MaKho INT
AS BEGIN
    UPDATE Kho SET TrangThai = N'ngung_hoat_dong' WHERE MaKho = @MaKho
END
GO

CREATE OR ALTER PROCEDURE sp_XoaTonKho
    @MaKho INT, @MaLo INT
AS BEGIN
    DELETE FROM TonKho WHERE MaKho=@MaKho AND MaLo=@MaLo
END
GO

-- ===================== XUAT NHAP KHO DAI LY =====================

CREATE OR ALTER PROCEDURE sp_GetTonKhoDaiLy
    @MaDaiLy INT
AS BEGIN
    SELECT k.MaKho, k.TenKho, k.DiaChi,
           tk.MaLo, tk.SoLuong, tk.CapNhatCuoi,
           lo.MaSanPham, sp.TenSanPham, sp.DonViTinh,
           lo.NgayThuHoach, lo.HanSuDung, lo.TrangThai AS TrangThaiLo
    FROM Kho k
    JOIN TonKho tk ON k.MaKho = tk.MaKho
    JOIN LoNongSan lo ON tk.MaLo = lo.MaLo
    JOIN SanPham sp ON lo.MaSanPham = sp.MaSanPham
    WHERE k.MaDaiLy = @MaDaiLy AND k.TrangThai = N'hoat_dong'
    ORDER BY k.MaKho, sp.TenSanPham
END
GO

CREATE OR ALTER PROCEDURE sp_NhapKhoDaiLy
    @MaKho INT, @MaLo INT, @SoLuong DECIMAL(18,2), @MaDonHang INT = NULL
AS BEGIN
    SET NOCOUNT ON;
    BEGIN TRANSACTION
    BEGIN TRY
        IF NOT EXISTS (SELECT 1 FROM Kho WHERE MaKho=@MaKho AND LoaiKho='daily' AND TrangThai=N'hoat_dong')
            RAISERROR(N'Kho không tồn tại hoặc không phải kho đại lý', 16, 1)
        IF @SoLuong <= 0 RAISERROR(N'Số lượng nhập phải lớn hơn 0', 16, 1)

        IF EXISTS (SELECT 1 FROM TonKho WHERE MaKho=@MaKho AND MaLo=@MaLo)
            UPDATE TonKho SET SoLuong=SoLuong+@SoLuong, CapNhatCuoi=SYSDATETIME()
            WHERE MaKho=@MaKho AND MaLo=@MaLo
        ELSE
            INSERT INTO TonKho (MaKho, MaLo, SoLuong) VALUES (@MaKho, @MaLo, @SoLuong)

        UPDATE LoNongSan SET TrangThai = N'tai_kho_dai_ly' WHERE MaLo = @MaLo

        IF @MaDonHang IS NOT NULL
            UPDATE DonHang SET TrangThai=N'hoan_thanh', NgayGiao=SYSDATETIME()
            WHERE MaDonHang=@MaDonHang AND LoaiDon='daily_to_nongdan'

        COMMIT
        SELECT N'Nhập kho thành công' AS Message
    END TRY
    BEGIN CATCH
        ROLLBACK
        DECLARE @Err1 NVARCHAR(4000) = N'Lỗi nhập kho: ' + ERROR_MESSAGE()
        RAISERROR(@Err1, 16, 1)
    END CATCH
END
GO

CREATE OR ALTER PROCEDURE sp_XuatKhoDaiLy
    @MaKho INT, @MaLo INT, @SoLuong DECIMAL(18,2), @MaDonHang INT = NULL
AS BEGIN
    SET NOCOUNT ON;
    BEGIN TRANSACTION
    BEGIN TRY
        IF NOT EXISTS (SELECT 1 FROM Kho WHERE MaKho=@MaKho AND LoaiKho='daily' AND TrangThai=N'hoat_dong')
            RAISERROR(N'Kho không tồn tại hoặc không phải kho đại lý', 16, 1)
        IF @SoLuong <= 0 RAISERROR(N'Số lượng xuất phải lớn hơn 0', 16, 1)

        DECLARE @TonHienTai DECIMAL(18,2)
        SELECT @TonHienTai = SoLuong FROM TonKho WHERE MaKho=@MaKho AND MaLo=@MaLo
        IF @TonHienTai IS NULL OR @TonHienTai < @SoLuong
            RAISERROR(N'Tồn kho không đủ để xuất', 16, 1)

        UPDATE TonKho SET SoLuong=SoLuong-@SoLuong, CapNhatCuoi=SYSDATETIME()
        WHERE MaKho=@MaKho AND MaLo=@MaLo
        DELETE FROM TonKho WHERE MaKho=@MaKho AND MaLo=@MaLo AND SoLuong=0

        UPDATE LoNongSan SET SoLuongHienTai=SoLuongHienTai-@SoLuong WHERE MaLo=@MaLo

        IF @MaDonHang IS NOT NULL
            UPDATE DonHang SET TrangThai=N'hoan_thanh', NgayGiao=SYSDATETIME()
            WHERE MaDonHang=@MaDonHang AND LoaiDon='sieuthi_to_daily'

        COMMIT
        SELECT N'Xuất kho thành công' AS Message
    END TRY
    BEGIN CATCH
        ROLLBACK
        DECLARE @Err2 NVARCHAR(4000) = N'Lỗi xuất kho: ' + ERROR_MESSAGE()
        RAISERROR(@Err2, 16, 1)
    END CATCH
END
GO

CREATE OR ALTER PROCEDURE sp_NhapKhoTuDonHang
    @MaDonHang INT, @MaKho INT
AS BEGIN
    SET NOCOUNT ON;
    BEGIN TRANSACTION
    BEGIN TRY
        IF NOT EXISTS (
            SELECT 1 FROM DonHang
            WHERE MaDonHang=@MaDonHang AND LoaiDon='daily_to_nongdan' AND TrangThai=N'da_nhan'
        ) RAISERROR(N'Đơn hàng không hợp lệ hoặc chưa được xác nhận', 16, 1)

        MERGE TonKho AS target
        USING (SELECT MaLo, SoLuong FROM ChiTietDonHang WHERE MaDonHang=@MaDonHang) AS source
        ON target.MaKho=@MaKho AND target.MaLo=source.MaLo
        WHEN MATCHED THEN
            UPDATE SET SoLuong=target.SoLuong+source.SoLuong, CapNhatCuoi=SYSDATETIME()
        WHEN NOT MATCHED THEN
            INSERT (MaKho, MaLo, SoLuong) VALUES (@MaKho, source.MaLo, source.SoLuong);

        UPDATE LoNongSan SET TrangThai=N'tai_kho_dai_ly'
        WHERE MaLo IN (SELECT MaLo FROM ChiTietDonHang WHERE MaDonHang=@MaDonHang)

        UPDATE DonHang SET TrangThai=N'hoan_thanh', NgayGiao=SYSDATETIME() WHERE MaDonHang=@MaDonHang

        COMMIT
        SELECT N'Nhập kho từ đơn hàng thành công' AS Message
    END TRY
    BEGIN CATCH
        ROLLBACK
        DECLARE @Err3 NVARCHAR(4000) = N'Lỗi nhập kho từ đơn hàng: ' + ERROR_MESSAGE()
        RAISERROR(@Err3, 16, 1)
    END CATCH
END
GO

CREATE OR ALTER PROCEDURE sp_XuatKhoTuDonHang
    @MaDonHang INT, @MaKho INT
AS BEGIN
    SET NOCOUNT ON;
    BEGIN TRANSACTION
    BEGIN TRY
        IF NOT EXISTS (
            SELECT 1 FROM DonHang
            WHERE MaDonHang=@MaDonHang AND LoaiDon='sieuthi_to_daily'
              AND TrangThai IN (N'da_nhan', N'dang_xu_ly')
        ) RAISERROR(N'Đơn hàng không hợp lệ hoặc chưa được xác nhận', 16, 1)

        IF EXISTS (
            SELECT 1 FROM ChiTietDonHang ct
            LEFT JOIN TonKho tk ON tk.MaKho=@MaKho AND tk.MaLo=ct.MaLo
            WHERE ct.MaDonHang=@MaDonHang AND (tk.SoLuong IS NULL OR tk.SoLuong < ct.SoLuong)
        ) RAISERROR(N'Tồn kho không đủ cho một hoặc nhiều sản phẩm trong đơn', 16, 1)

        UPDATE tk SET tk.SoLuong=tk.SoLuong-ct.SoLuong, tk.CapNhatCuoi=SYSDATETIME()
        FROM TonKho tk JOIN ChiTietDonHang ct ON tk.MaLo=ct.MaLo
        WHERE tk.MaKho=@MaKho AND ct.MaDonHang=@MaDonHang

        DELETE FROM TonKho WHERE MaKho=@MaKho AND SoLuong=0

        UPDATE lo SET lo.SoLuongHienTai=lo.SoLuongHienTai-ct.SoLuong
        FROM LoNongSan lo JOIN ChiTietDonHang ct ON lo.MaLo=ct.MaLo
        WHERE ct.MaDonHang=@MaDonHang

        UPDATE DonHang SET TrangThai=N'hoan_thanh', NgayGiao=SYSDATETIME() WHERE MaDonHang=@MaDonHang

        COMMIT
        SELECT N'Xuất kho từ đơn hàng thành công' AS Message
    END TRY
    BEGIN CATCH
        ROLLBACK
        DECLARE @Err4 NVARCHAR(4000) = N'Lỗi xuất kho từ đơn hàng: ' + ERROR_MESSAGE()
        RAISERROR(@Err4, 16, 1)
    END CATCH
END
GO
