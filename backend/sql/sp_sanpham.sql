-- sp_GetAllSanPham
CREATE OR ALTER PROCEDURE sp_GetAllSanPham
AS
BEGIN
    SELECT MaSanPham, TenSanPham, DonViTinh, MoTa FROM SanPham ORDER BY TenSanPham
END
GO

-- sp_GetSanPhamById
CREATE OR ALTER PROCEDURE sp_GetSanPhamById
    @MaSanPham INT
AS
BEGIN
    SELECT MaSanPham, TenSanPham, DonViTinh, MoTa FROM SanPham WHERE MaSanPham = @MaSanPham
END
GO

-- sp_CreateSanPham
CREATE OR ALTER PROCEDURE sp_CreateSanPham
    @TenSanPham NVARCHAR(100),
    @DonViTinh  NVARCHAR(20),
    @MoTa       NVARCHAR(255)
AS
BEGIN
    INSERT INTO SanPham (TenSanPham, DonViTinh, MoTa)
    OUTPUT INSERTED.MaSanPham
    VALUES (@TenSanPham, @DonViTinh, @MoTa)
END
GO

-- sp_UpdateSanPham
CREATE OR ALTER PROCEDURE sp_UpdateSanPham
    @MaSanPham  INT,
    @TenSanPham NVARCHAR(100),
    @DonViTinh  NVARCHAR(20),
    @MoTa       NVARCHAR(255)
AS
BEGIN
    UPDATE SanPham SET TenSanPham = @TenSanPham, DonViTinh = @DonViTinh, MoTa = @MoTa
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
