const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/kiemdinhh.controller');

/**
 * @swagger
 * tags:
 *   name: KiemDinh
 *   description: API quản lý kiểm định
 */

/**
 * @swagger
 * /api/kiem-dinh/get-all:
 *   get:
 *     summary: Lấy tất cả kiểm định
 *     tags: [KiemDinh]
 *     responses:
 *       200:
 *         description: Danh sách kiểm định
 */
router.get('/get-all', ctrl.getAll);

/**
 * @swagger
 * /api/kiem-dinh/dai-ly/{maDaiLy}:
 *   get:
 *     summary: Lấy kiểm định theo đại lý
 *     tags: [KiemDinh]
 *     parameters:
 *       - in: path
 *         name: maDaiLy
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Danh sách kiểm định
 */
router.get('/dai-ly/:maDaiLy', ctrl.getByDaiLy);
router.get('/don-hang/:maDonHang', ctrl.getByDonHang);

/**
 * @swagger
 * /api/kiem-dinh/create:
 *   post:
 *     summary: Tạo kiểm định mới
 *     tags: [KiemDinh]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [MaLo, NguoiKiemDinh, KetQua]
 *             properties:
 *               MaLo:
 *                 type: integer
 *               NguoiKiemDinh:
 *                 type: string
 *               MaDaiLy:
 *                 type: integer
 *               MaSieuThi:
 *                 type: integer
 *               KetQua:
 *                 type: string
 *                 enum: [dat, khong_dat, A, B, C]
 *               BienBan:
 *                 type: string
 *               GhiChu:
 *                 type: string
 *     responses:
 *       201:
 *         description: Tạo thành công
 */
router.post('/create', ctrl.create);

/**
 * @swagger
 * /api/kiem-dinh/update/{id}:
 *   put:
 *     summary: Cập nhật kiểm định
 *     tags: [KiemDinh]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [KetQua, TrangThai]
 *             properties:
 *               KetQua:
 *                 type: string
 *                 enum: [dat, khong_dat, A, B, C]
 *               BienBan:
 *                 type: string
 *               GhiChu:
 *                 type: string
 *               TrangThai:
 *                 type: string
 *                 enum: [hoan_thanh, cho_duyet]
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 */
router.put('/update/:id', ctrl.update);

/**
 * @swagger
 * /api/kiem-dinh/delete/{id}:
 *   delete:
 *     summary: Xóa kiểm định
 *     tags: [KiemDinh]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Xóa thành công
 */
router.delete('/delete/:id', ctrl.remove);

/**
 * @swagger
 * /api/kiem-dinh/{id}:
 *   get:
 *     summary: Lấy chi tiết kiểm định
 *     tags: [KiemDinh]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Chi tiết kiểm định
 */
router.get('/:id', ctrl.getById);

module.exports = router;
