const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/sieuthi.controller');
const dhCtrl = require('../controllers/donhang_sieuthi.controller');

/**
 * @swagger
 * tags:
 *   name: SieuThi
 *   description: API quản lý siêu thị
 */

/**
 * @swagger
 * /api/sieuthi:
 *   get:
 *     summary: Tìm kiếm siêu thị
 *     tags: [SieuThi]
 *     parameters:
 *       - in: query
 *         name: keyword
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Danh sách siêu thị
 *   post:
 *     summary: Thêm siêu thị mới
 *     tags: [SieuThi]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [TenDangNhap, MatKhauHash, TenSieuThi]
 *             properties:
 *               TenDangNhap:
 *                 type: string
 *               MatKhauHash:
 *                 type: string
 *               TenSieuThi:
 *                 type: string
 *               SoDienThoai:
 *                 type: string
 *               Email:
 *                 type: string
 *               DiaChi:
 *                 type: string
 *     responses:
 *       201:
 *         description: Tạo thành công
 */
router.get('/', ctrl.search);
router.post('/', ctrl.create);

/**
 * @swagger
 * /api/sieuthi/profile/{maTaiKhoan}:
 *   get:
 *     summary: Lấy thông tin siêu thị theo tài khoản
 *     tags: [SieuThi]
 *     parameters:
 *       - in: path
 *         name: maTaiKhoan
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Thông tin siêu thị
 */
router.get('/profile/:maTaiKhoan', ctrl.getProfile);

/**
 * @swagger
 * /api/sieuthi/{maSieuThi}:
 *   put:
 *     summary: Cập nhật siêu thị
 *     tags: [SieuThi]
 *     parameters:
 *       - in: path
 *         name: maSieuThi
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               TenSieuThi:
 *                 type: string
 *               SoDienThoai:
 *                 type: string
 *               Email:
 *                 type: string
 *               DiaChi:
 *                 type: string
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *   delete:
 *     summary: Xóa siêu thị (khóa tài khoản)
 *     tags: [SieuThi]
 *     parameters:
 *       - in: path
 *         name: maSieuThi
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Xóa thành công
 */
router.put('/:maSieuThi', ctrl.update);
router.delete('/:maSieuThi', ctrl.remove);

/**
 * @swagger
 * tags:
 *   name: DonHangSieuThi
 *   description: API đơn hàng siêu thị -> đại lý
 */

/**
 * @swagger
 * /api/sieuthi/donhang/tao-don-hang:
 *   post:
 *     summary: Tạo đơn hàng mới
 *     tags: [DonHangSieuThi]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [MaSieuThi, MaDaiLy]
 *             properties:
 *               MaSieuThi:
 *                 type: integer
 *               MaDaiLy:
 *                 type: integer
 *               GhiChu:
 *                 type: string
 *     responses:
 *       201:
 *         description: Tạo thành công
 */
router.post('/donhang/tao-don-hang', dhCtrl.taoDonHang);

/**
 * @swagger
 * /api/sieuthi/donhang/them-chi-tiet:
 *   post:
 *     summary: Thêm chi tiết đơn hàng
 *     tags: [DonHangSieuThi]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [MaDonHang, MaLo, SoLuong, DonGia]
 *             properties:
 *               MaDonHang:
 *                 type: integer
 *               MaLo:
 *                 type: integer
 *               SoLuong:
 *                 type: number
 *               DonGia:
 *                 type: number
 *     responses:
 *       201:
 *         description: Thêm thành công
 */
router.post('/donhang/them-chi-tiet', dhCtrl.themChiTiet);

/**
 * @swagger
 * /api/sieuthi/donhang/cap-nhat-chi-tiet:
 *   put:
 *     summary: Cập nhật chi tiết đơn hàng
 *     tags: [DonHangSieuThi]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [MaDonHang, MaLo, SoLuong, DonGia]
 *             properties:
 *               MaDonHang:
 *                 type: integer
 *               MaLo:
 *                 type: integer
 *               SoLuong:
 *                 type: number
 *               DonGia:
 *                 type: number
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 */
router.put('/donhang/cap-nhat-chi-tiet', dhCtrl.capNhatChiTiet);

/**
 * @swagger
 * /api/sieuthi/donhang/xoa-chi-tiet:
 *   delete:
 *     summary: Xóa chi tiết đơn hàng
 *     tags: [DonHangSieuThi]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [MaDonHang, MaLo]
 *             properties:
 *               MaDonHang:
 *                 type: integer
 *               MaLo:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Xóa thành công
 */
router.delete('/donhang/xoa-chi-tiet', dhCtrl.xoaChiTiet);

/**
 * @swagger
 * /api/sieuthi/donhang/nhan-hang/{id}:
 *   put:
 *     summary: Nhận đơn hàng
 *     tags: [DonHangSieuThi]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Nhận thành công
 */
router.put('/donhang/nhan-hang/:id', dhCtrl.nhanDonHang);

/**
 * @swagger
 * /api/sieuthi/donhang/huy-don-hang/{id}:
 *   put:
 *     summary: Hủy đơn hàng
 *     tags: [DonHangSieuThi]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Hủy thành công
 */
router.put('/donhang/huy-don-hang/:id', dhCtrl.huyDonHang);

/**
 * @swagger
 * /api/sieuthi/donhang/sieu-thi/{maSieuThi}:
 *   get:
 *     summary: Danh sách đơn hàng theo siêu thị
 *     tags: [DonHangSieuThi]
 *     parameters:
 *       - in: path
 *         name: maSieuThi
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Danh sách đơn hàng
 */
router.get('/donhang/sieu-thi/:maSieuThi', dhCtrl.getDonHangBySieuThi);

router.put('/donhang/:id/trang-thai', dhCtrl.updateTrangThai);
router.delete('/donhang/:id', dhCtrl.deleteDonHang);
router.get('/donhang/:id/chi-tiet', dhCtrl.getChiTiet);
router.put('/donhang/:id/ghi-chu', dhCtrl.updateGhiChu);
router.get('/tonkho-daily/:maDaiLy', dhCtrl.getTonKhoDaiLy);

/**
 * @swagger
 * /api/sieuthi/donhang/{id}:
 *   get:
 *     summary: Lấy chi tiết đơn hàng
 *     tags: [DonHangSieuThi]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Chi tiết đơn hàng
 */
router.get('/donhang/:id', dhCtrl.getById);

module.exports = router;
