-- ============================================================================
-- 00. TẠO DATABASE & BẢNG
-- Chạy file này đầu tiên
-- ============================================================================
CREATE DATABASE btl;
GO

USE btl;
GO

CREATE TABLE TaiKhoan (
    MaTaiKhoan      INT IDENTITY(1,1) PRIMARY KEY,
    TenDangNhap     NVARCHAR(50) UNIQUE NOT NULL,
    MatKhau         NVARCHAR(255) NOT NULL,
    LoaiTaiKhoan    NVARCHAR(20) NOT NULL,
    TrangThai       NVARCHAR(20) DEFAULT N'hoat_dong',
    NgayTao         DATETIME2 DEFAULT SYSDATETIME(),
    LanDangNhapCuoi DATETIME2 NULL
);
GO

CREATE TABLE Admin (
    MaAdmin     INT IDENTITY(1,1) PRIMARY KEY,
    MaTaiKhoan  INT UNIQUE NOT NULL,
    HoTen       NVARCHAR(100),
    SoDienThoai NVARCHAR(20),
    Email       NVARCHAR(100),
    FOREIGN KEY (MaTaiKhoan) REFERENCES TaiKhoan(MaTaiKhoan)
);
GO

CREATE TABLE NongDan (
    MaNongDan   INT IDENTITY(1,1) PRIMARY KEY,
    MaTaiKhoan  INT UNIQUE NOT NULL,
    HoTen       NVARCHAR(100),
    SoDienThoai NVARCHAR(20),
    Email       NVARCHAR(100),
    DiaChi      NVARCHAR(255),
    FOREIGN KEY (MaTaiKhoan) REFERENCES TaiKhoan(MaTaiKhoan)
);
GO

CREATE TABLE DaiLy (
    MaDaiLy     INT IDENTITY(1,1) PRIMARY KEY,
    MaTaiKhoan  INT UNIQUE NOT NULL,
    TenDaiLy    NVARCHAR(100),
    SoDienThoai NVARCHAR(20),
    Email       NVARCHAR(100),
    DiaChi      NVARCHAR(255),
    FOREIGN KEY (MaTaiKhoan) REFERENCES TaiKhoan(MaTaiKhoan)
);
GO

CREATE TABLE SieuThi (
    MaSieuThi   INT IDENTITY(1,1) PRIMARY KEY,
    MaTaiKhoan  INT UNIQUE NOT NULL,
    TenSieuThi  NVARCHAR(100),
    SoDienThoai NVARCHAR(20),
    Email       NVARCHAR(100),
    DiaChi      NVARCHAR(255),
    FOREIGN KEY (MaTaiKhoan) REFERENCES TaiKhoan(MaTaiKhoan)
);
GO

CREATE TABLE TrangTrai (
    MaTrangTrai  INT IDENTITY(1,1) PRIMARY KEY,
    MaNongDan    INT NOT NULL,
    TenTrangTrai NVARCHAR(100) NOT NULL,
    DiaChi       NVARCHAR(255),
    SoChungNhan  NVARCHAR(50),
    TrangThai    NVARCHAR(20) DEFAULT N'hoat_dong',
    NgayTao      DATETIME2 DEFAULT SYSDATETIME(),
    FOREIGN KEY (MaNongDan) REFERENCES NongDan(MaNongDan)
);
GO

CREATE TABLE SanPham (
    MaSanPham  INT IDENTITY(1,1) PRIMARY KEY,
    TenSanPham NVARCHAR(100) NOT NULL,
    DonViTinh  NVARCHAR(20) NOT NULL,
    MoTa       NVARCHAR(255),
    NgayTao    DATETIME2 DEFAULT SYSDATETIME()
);
GO

CREATE TABLE LoNongSan (
    MaLo           INT IDENTITY(1,1) PRIMARY KEY,
    MaTrangTrai    INT NOT NULL,
    MaSanPham      INT NOT NULL,
    SoLuongBanDau  DECIMAL(18,2) NOT NULL,
    SoLuongHienTai DECIMAL(18,2) NOT NULL,
    NgayThuHoach   DATE,
    HanSuDung      DATE,
    SoChungNhanLo  NVARCHAR(50),
    MaQR           NVARCHAR(255),
    TrangThai      NVARCHAR(30) DEFAULT N'tai_trang_trai',
    NgayTao        DATETIME2 DEFAULT SYSDATETIME(),
    FOREIGN KEY (MaTrangTrai) REFERENCES TrangTrai(MaTrangTrai),
    FOREIGN KEY (MaSanPham)   REFERENCES SanPham(MaSanPham)
);
GO

CREATE TABLE Kho (
    MaKho     INT IDENTITY(1,1) PRIMARY KEY,
    LoaiKho   NVARCHAR(20) NOT NULL,
    MaDaiLy   INT NULL,
    MaSieuThi INT NULL,
    TenKho    NVARCHAR(100) NOT NULL,
    DiaChi    NVARCHAR(255),
    TrangThai NVARCHAR(20) DEFAULT N'hoat_dong',
    NgayTao   DATETIME2 DEFAULT SYSDATETIME(),
    FOREIGN KEY (MaDaiLy)   REFERENCES DaiLy(MaDaiLy),
    FOREIGN KEY (MaSieuThi) REFERENCES SieuThi(MaSieuThi)
);
GO

CREATE TABLE TonKho (
    MaKho       INT NOT NULL,
    MaLo        INT NOT NULL,
    SoLuong     DECIMAL(18,2) NOT NULL,
    CapNhatCuoi DATETIME2 DEFAULT SYSDATETIME(),
    PRIMARY KEY (MaKho, MaLo),
    FOREIGN KEY (MaKho) REFERENCES Kho(MaKho),
    FOREIGN KEY (MaLo)  REFERENCES LoNongSan(MaLo)
);
GO

CREATE TABLE DonHang (
    MaDonHang   INT IDENTITY(1,1) PRIMARY KEY,
    LoaiDon     NVARCHAR(30) NOT NULL,
    NgayDat     DATETIME2 DEFAULT SYSDATETIME(),
    NgayGiao    DATETIME2 NULL,
    TrangThai   NVARCHAR(30) DEFAULT N'chua_nhan',
    TongSoLuong DECIMAL(18,2) NULL,
    TongGiaTri  DECIMAL(18,2) NULL,
    GhiChu      NVARCHAR(255)
);
GO

CREATE TABLE DonHangDaiLy (
    MaDonHang INT PRIMARY KEY,
    MaDaiLy   INT NOT NULL,
    MaNongDan INT NOT NULL,
    FOREIGN KEY (MaDonHang) REFERENCES DonHang(MaDonHang),
    FOREIGN KEY (MaDaiLy)   REFERENCES DaiLy(MaDaiLy),
    FOREIGN KEY (MaNongDan) REFERENCES NongDan(MaNongDan)
);
GO

CREATE TABLE DonHangSieuThi (
    MaDonHang INT PRIMARY KEY,
    MaSieuThi INT NOT NULL,
    MaDaiLy   INT NOT NULL,
    FOREIGN KEY (MaDonHang) REFERENCES DonHang(MaDonHang),
    FOREIGN KEY (MaSieuThi) REFERENCES SieuThi(MaSieuThi),
    FOREIGN KEY (MaDaiLy)   REFERENCES DaiLy(MaDaiLy)
);
GO

CREATE TABLE ChiTietDonHang (
    MaDonHang INT NOT NULL,
    MaLo      INT NOT NULL,
    SoLuong   DECIMAL(18,2) NOT NULL,
    DonGia    DECIMAL(18,2) NULL,
    ThanhTien DECIMAL(18,2) NULL,
    PRIMARY KEY (MaDonHang, MaLo),
    FOREIGN KEY (MaDonHang) REFERENCES DonHang(MaDonHang),
    FOREIGN KEY (MaLo)      REFERENCES LoNongSan(MaLo)
);
GO

CREATE TABLE KiemDinh (
    MaKiemDinh    INT IDENTITY(1,1) PRIMARY KEY,
    MaLo          INT NOT NULL,
    NguoiKiemDinh NVARCHAR(100),
    MaDaiLy       INT NULL,
    MaSieuThi     INT NULL,
    NgayKiemDinh  DATETIME2 DEFAULT SYSDATETIME(),
    KetQua        NVARCHAR(20) NOT NULL,
    TrangThai     NVARCHAR(20) DEFAULT N'hoan_thanh',
    BienBan       NVARCHAR(MAX) NULL,
    ChuKySo       NVARCHAR(255) NULL,
    GhiChu        NVARCHAR(255),
    FOREIGN KEY (MaLo)      REFERENCES LoNongSan(MaLo),
    FOREIGN KEY (MaDaiLy)   REFERENCES DaiLy(MaDaiLy),
    FOREIGN KEY (MaSieuThi) REFERENCES SieuThi(MaSieuThi)
);
GO
