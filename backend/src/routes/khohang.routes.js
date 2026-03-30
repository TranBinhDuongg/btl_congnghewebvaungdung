const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/khohang.controller');

/**
 * @swagger
 * tags:
 *   name: KhoHang
 *   description: API quản lý kho hàng
 */

/**
 * @swagger
 * /api/KhoHang/sieu-thi/{maSieuThi}:
 *   get:
 *     summary: Lấy danh sách kho theo siêu thị
 *     tags: [KhoHang]
 *     parameters:
 *       - in: path
 *         name: maSieuThi
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Danh sách kho
 */
router.get('/sieu-thi/:maSieuThi', ctrl.getKhoBySieuThi);

/**
 * @swagger
 * /api/KhoHang/{maKho}:
 *   get:
 *     summary: Lấy chi tiết kho
 *     tags: [KhoHang]
 *     parameters:
 *       - in: path
 *         name: maKho
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Chi tiết kho
 */
router.get('/:maKho', ctrl.getKhoById);

/**
 * @swagger
 * /api/KhoHang/tao-kho:
 *   post:
 *     summary: Tạo kho mới
 *     tags: [KhoHang]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [LoaiKho, TenKho]
 *             properties:
 *               LoaiKho:
 *                 type: string
 *                 enum: [daily, sieuthi]
 *               MaDaiLy:
 *                 type: integer
 *               MaSieuThi:
 *                 type: integer
 *               TenKho:
 *                 type: string
 *               DiaChi:
 *                 type: string
 *     responses:
 *       201:
 *         description: Tạo thành công
 */
router.post('/tao-kho', ctrl.taoKho);

/**
 * @swagger
 * /api/KhoHang/cap-nhat-kho:
 *   put:
 *     summary: Cập nhật kho
 *     tags: [KhoHang]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [MaKho, TenKho, TrangThai]
 *             properties:
 *               MaKho:
 *                 type: integer
 *               TenKho:
 *                 type: string
 *               DiaChi:
 *                 type: string
 *               TrangThai:
 *                 type: string
 *                 enum: [hoat_dong, ngung_hoat_dong]
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 */
router.put('/cap-nhat-kho', ctrl.capNhatKho);

/**
 * @swagger
 * /api/KhoHang/xoa-kho/{maKho}:
 *   delete:
 *     summary: Xóa kho
 *     tags: [KhoHang]
 *     parameters:
 *       - in: path
 *         name: maKho
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Xóa thành công
 */
router.delete('/xoa-kho/:maKho', ctrl.xoaKho);

/**
 * @swagger
 * /api/KhoHang/xoa-ton-kho:
 *   delete:
 *     summary: Xóa tồn kho
 *     tags: [KhoHang]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [MaKho, MaLo]
 *             properties:
 *               MaKho:
 *                 type: integer
 *               MaLo:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Xóa thành công
 */
router.delete('/xoa-ton-kho', ctrl.xoaTonKho);

module.exports = router;
