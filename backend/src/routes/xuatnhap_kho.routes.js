const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/xuatnhap_kho.controller');

/**
 * @swagger
 * tags:
 *   name: XuatNhapKhoDaiLy
 *   description: API xuất nhập kho đại lý
 */

/**
 * @swagger
 * /api/xuat-nhap-kho/ton-kho/{maDaiLy}:
 *   get:
 *     summary: Xem tồn kho theo đại lý
 *     tags: [XuatNhapKhoDaiLy]
 *     parameters:
 *       - in: path
 *         name: maDaiLy
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Danh sách tồn kho
 */
router.get('/ton-kho/:maDaiLy', ctrl.getTonKho);

/**
 * @swagger
 * /api/xuat-nhap-kho/nhap:
 *   post:
 *     summary: Nhập hàng vào kho đại lý (thủ công)
 *     tags: [XuatNhapKhoDaiLy]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [MaKho, MaLo, SoLuong]
 *             properties:
 *               MaKho:
 *                 type: integer
 *               MaLo:
 *                 type: integer
 *               SoLuong:
 *                 type: number
 *               MaDonHang:
 *                 type: integer
 *                 description: Tùy chọn - liên kết với đơn hàng
 *     responses:
 *       200:
 *         description: Nhập kho thành công
 */
router.post('/nhap', ctrl.nhapKho);

/**
 * @swagger
 * /api/xuat-nhap-kho/xuat:
 *   post:
 *     summary: Xuất hàng khỏi kho đại lý (thủ công)
 *     tags: [XuatNhapKhoDaiLy]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [MaKho, MaLo, SoLuong]
 *             properties:
 *               MaKho:
 *                 type: integer
 *               MaLo:
 *                 type: integer
 *               SoLuong:
 *                 type: number
 *               MaDonHang:
 *                 type: integer
 *                 description: Tùy chọn - liên kết với đơn hàng
 *     responses:
 *       200:
 *         description: Xuất kho thành công
 */
router.post('/xuat', ctrl.xuatKho);

/**
 * @swagger
 * /api/xuat-nhap-kho/nhap-tu-don-hang:
 *   post:
 *     summary: Nhập kho hàng loạt từ đơn hàng đại lý -> nông dân (da_nhan)
 *     tags: [XuatNhapKhoDaiLy]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [MaDonHang, MaKho]
 *             properties:
 *               MaDonHang:
 *                 type: integer
 *               MaKho:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Nhập kho thành công
 */
router.post('/nhap-tu-don-hang', ctrl.nhapKhoTuDonHang);

/**
 * @swagger
 * /api/xuat-nhap-kho/xuat-tu-don-hang:
 *   post:
 *     summary: Xuất kho hàng loạt từ đơn hàng siêu thị -> đại lý (da_nhan/dang_xu_ly)
 *     tags: [XuatNhapKhoDaiLy]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [MaDonHang, MaKho]
 *             properties:
 *               MaDonHang:
 *                 type: integer
 *               MaKho:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Xuất kho thành công
 */
router.post('/xuat-tu-don-hang', ctrl.xuatKhoTuDonHang);

module.exports = router;
