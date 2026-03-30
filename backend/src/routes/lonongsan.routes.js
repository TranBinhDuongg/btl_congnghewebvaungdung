const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/lonongsan.controller');

/**
 * @swagger
 * tags:
 *   name: LoNongSan
 *   description: API quản lý lô nông sản
 */

/**
 * @swagger
 * /api/lo-nong-san/get-all:
 *   get:
 *     summary: Lấy tất cả lô nông sản
 *     tags: [LoNongSan]
 *     responses:
 *       200:
 *         description: Danh sách lô
 */
router.get('/get-all', ctrl.getAll);

/**
 * @swagger
 * /api/lo-nong-san/get-by-id/{id}:
 *   get:
 *     summary: Lấy chi tiết lô theo ID
 *     tags: [LoNongSan]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Chi tiết lô
 */
router.get('/get-by-id/:id', ctrl.getById);

/**
 * @swagger
 * /api/lo-nong-san/get-by-trang-trai/{maTrangTrai}:
 *   get:
 *     summary: Lấy lô theo trang trại
 *     tags: [LoNongSan]
 *     parameters:
 *       - in: path
 *         name: maTrangTrai
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Danh sách lô
 */
router.get('/get-by-trang-trai/:maTrangTrai', ctrl.getByTrangTrai);

/**
 * @swagger
 * /api/lo-nong-san/get-by-nong-dan/{maNongDan}:
 *   get:
 *     summary: Lấy lô theo nông dân
 *     tags: [LoNongSan]
 *     parameters:
 *       - in: path
 *         name: maNongDan
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Danh sách lô
 */
router.get('/get-by-nong-dan/:maNongDan', ctrl.getByNongDan);

/**
 * @swagger
 * /api/lo-nong-san/create:
 *   post:
 *     summary: Tạo lô nông sản mới
 *     tags: [LoNongSan]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [MaTrangTrai, MaSanPham, SoLuongBanDau]
 *             properties:
 *               MaTrangTrai:
 *                 type: integer
 *               MaSanPham:
 *                 type: integer
 *               SoLuongBanDau:
 *                 type: number
 *               NgayThuHoach:
 *                 type: string
 *                 format: date
 *               HanSuDung:
 *                 type: string
 *                 format: date
 *               SoChungNhanLo:
 *                 type: string
 *               MaQR:
 *                 type: string
 *     responses:
 *       201:
 *         description: Tạo thành công
 */
router.post('/create', ctrl.create);

/**
 * @swagger
 * /api/lo-nong-san/update/{id}:
 *   put:
 *     summary: Cập nhật lô nông sản
 *     tags: [LoNongSan]
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
 *             properties:
 *               SoLuongHienTai:
 *                 type: number
 *               HanSuDung:
 *                 type: string
 *                 format: date
 *               TrangThai:
 *                 type: string
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 */
router.put('/update/:id', ctrl.update);

/**
 * @swagger
 * /api/lo-nong-san/delete/{id}:
 *   delete:
 *     summary: Xóa lô nông sản
 *     tags: [LoNongSan]
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

module.exports = router;
