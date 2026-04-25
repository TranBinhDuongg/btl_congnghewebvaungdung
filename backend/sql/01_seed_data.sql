-- ============================================================================
-- 01. DỮ LIỆU MẪU
-- Chạy sau 00_create_database.sql
-- ============================================================================
USE btl;
GO

INSERT INTO TaiKhoan (TenDangNhap, MatKhau, LoaiTaiKhoan) VALUES
('admin01',   'admin123',   'admin'),
('nongdan01', 'nongdan123', 'nongdan'),
('nongdan02', 'nongdan123', 'nongdan'),
('daily01',   'daily123',   'daily'),
('sieuthi01', 'sieuthi123', 'sieuthi');
GO

INSERT INTO Admin (MaTaiKhoan, HoTen, SoDienThoai, Email) VALUES
(1, N'Nguyễn Văn Admin', '0912345678', 'admin@example.com');
GO

INSERT INTO NongDan (MaTaiKhoan, HoTen, SoDienThoai, Email, DiaChi) VALUES
(2, N'Bùi Văn Tâm',      '0967890123', 'tam@farm.com',   N'Hà Nội'),
(3, N'Đặng Thị Lan',     '0978901234', 'lan@farm.com',   N'Hải Phòng');
GO

INSERT INTO DaiLy (MaTaiKhoan, TenDaiLy, SoDienThoai, Email, DiaChi) VALUES
(4, N'Đại Lý Nông Sản An Phú', '0912111111', 'anphu@daily.com', N'52 Nguyễn Huệ, Q1, TP.HCM'),
(4, N'Đại Lý Nông Sản Hùng',   '0913222222', 'hung@daily.com',  N'45 Lý Thường Kiệt, Q10, TP.HCM'),
(4, N'Đại Lý Nông Sản Đức',    '0914333333', 'duc@daily.com',   N'38 Pasteur, Q1, TP.HCM');
GO

INSERT INTO SieuThi (MaTaiKhoan, TenSieuThi, SoDienThoai, Email, DiaChi) VALUES
(5, N'Siêu Thị Co.opmart',    '0917666666', 'coopmart@supermarket.com', N'Tô Ký, Q12, TP.HCM'),
(5, N'Siêu Thị Saigon Co.op', '0918777777', 'saigon@supermarket.com',   N'Cộng Hòa, Tân Bình, TP.HCM');
GO

INSERT INTO TrangTrai (MaNongDan, TenTrangTrai, DiaChi, SoChungNhan) VALUES
(1, N'Trang Trại Xanh Sạch Tâm', N'Hà Nội',    'CC001'),
(2, N'Trang Trại Lan Hương',      N'Hải Phòng', 'CC002');
GO

INSERT INTO SanPham (TenSanPham, DonViTinh, MoTa) VALUES
(N'Cà Chua',   N'kg', N'Cà chua tươi, đỏ'),
(N'Dưa Chuột', N'kg', N'Dưa chuột xanh, tươi'),
(N'Cà Rốt',    N'kg', N'Cà rốt cam, ngọt'),
(N'Bắp Cây',   N'kg', N'Bắp ngô tươi'),
(N'Hành Tây',  N'kg', N'Hành tây tím, ngon');
GO

INSERT INTO LoNongSan (MaTrangTrai, MaSanPham, SoLuongBanDau, SoLuongHienTai, NgayThuHoach, HanSuDung, SoChungNhanLo, MaQR) VALUES
(1, 1, 1000, 950,  '2025-01-01', '2025-01-15', 'LOT001', 'QR001'),
(2, 2,  800, 750,  '2025-01-02', '2025-01-10', 'LOT002', 'QR002'),
(1, 3, 1200, 1100, '2025-01-03', '2025-01-20', 'LOT003', 'QR003'),
(2, 4,  600, 550,  '2025-01-04', '2025-01-12', 'LOT004', 'QR004'),
(1, 5,  900, 850,  '2025-01-05', '2025-01-18', 'LOT005', 'QR005');
GO

INSERT INTO Kho (LoaiKho, MaDaiLy, MaSieuThi, TenKho, DiaChi) VALUES
('daily',   1,    NULL, N'Kho Đại Lý An Phú',  N'52 Nguyễn Huệ, Q1'),
('daily',   2,    NULL, N'Kho Đại Lý Hùng',    N'45 Lý Thường Kiệt, Q10'),
('sieuthi', NULL, 1,    N'Kho Co.opmart',       N'Tô Ký, Q12'),
('sieuthi', NULL, 2,    N'Kho Saigon Co.op',    N'Cộng Hòa, Tân Bình'),
('daily',   3,    NULL, N'Kho Đại Lý Đức',      N'38 Pasteur, Q1');
GO

INSERT INTO TonKho (MaKho, MaLo, SoLuong) VALUES
(1, 1, 200), (1, 2, 150), (2, 3, 300), (3, 4, 100), (4, 5, 250);
GO

INSERT INTO DonHang (LoaiDon, NgayDat, NgayGiao, TrangThai, TongSoLuong, TongGiaTri, GhiChu) VALUES
('daily_to_nongdan', '2025-01-05 08:00', '2025-01-06 14:00', N'hoan_thanh', 500, 5000000, N'Đơn cà chua'),
('sieuthi_to_daily', '2025-01-06 09:00', '2025-01-07 16:00', N'hoan_thanh', 300, 3500000, N'Đơn dưa chuột'),
('daily_to_nongdan', '2025-01-07 10:00', NULL,               N'da_nhan',    400, 4200000, N'Đơn cà rốt'),
('sieuthi_to_daily', '2025-01-08 11:00', NULL,               N'chua_nhan',  600, 7200000, N'Đơn bắp cây'),
('daily_to_nongdan', '2025-01-09 12:00', NULL,               N'chua_nhan',  350, 3500000, N'Đơn hành tây');
GO

INSERT INTO DonHangDaiLy (MaDonHang, MaDaiLy, MaNongDan) VALUES
(1, 1, 1), (3, 2, 2), (5, 3, 1);
GO

INSERT INTO DonHangSieuThi (MaDonHang, MaSieuThi, MaDaiLy) VALUES
(2, 1, 1), (4, 2, 2);
GO

INSERT INTO ChiTietDonHang (MaDonHang, MaLo, SoLuong, DonGia, ThanhTien) VALUES
(1, 1, 100, 10000, 1000000),
(2, 2,  80, 15000, 1200000),
(3, 3, 150, 12000, 1800000),
(4, 4, 120, 18000, 2160000),
(5, 5, 100, 10000, 1000000);
GO

INSERT INTO KiemDinh (MaLo, NguoiKiemDinh, MaDaiLy, MaSieuThi, KetQua, BienBan, GhiChu) VALUES
(1, N'Trần Quý',   1,    NULL, N'dat',       N'Chất lượng tốt',           N'Đạt tiêu chuẩn'),
(2, N'Lê Minh',    2,    NULL, N'dat',       N'Tươi ngon, đúng chuẩn',    N'Đạt tiêu chuẩn'),
(3, N'Nguyễn Sơn', NULL, 1,    N'dat',       N'Độ tươi 100%',             N'Đạt tiêu chuẩn'),
(4, N'Phạm Dũng',  NULL, 2,    N'khong_dat', N'Không đạt vệ sinh',        N'Từ chối nhập kho'),
(5, N'Hoàng Tùng', 3,    NULL, N'dat',       N'Chất lượng cao, tươi mới', N'Đạt tiêu chuẩn');
GO
