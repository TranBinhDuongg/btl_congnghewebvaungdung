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
