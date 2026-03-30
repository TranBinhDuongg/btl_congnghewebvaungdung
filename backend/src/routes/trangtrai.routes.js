const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/nongdan.controller');

/**
 * @swagger
 * tags:
 *   name: TrangTrai
 *   description: API quản lý trang trại
 */

/**
 * @swagger
 * /api/trang-trai/get-all:
 *   get:
 *     summary: Lấy tất cả trang trại
 *     tags: [TrangTrai]
 *     responses:
 *       200:
 *         description: Danh sách trang trại
 */
router.get('/get-all', ctrl.getAllTrangTrai);

/**
 * @swagger
 * /api/trang-trai/get-by-id/{id}:
 *   get:
 *     summary: Lấy trang trại theo ID
 *     tags: [TrangTrai]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Thông tin trang trại
 */
router.get('/get-by-id/:id', ctrl.getTrangTraiById);

/**
 * @swagger
 * /api/trang-trai/get-by-nong-dan/{maNongDan}:
 *   get:
 *     summary: Lấy trang trại theo nông dân
 *     tags: [TrangTrai]
 *     parameters:
 *       - in: path
 *         name: maNongDan
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Danh sách trang trại
 */
router.get('/get-by-nong-dan/:maNongDan', ctrl.getTrangTraiByNongDan);

/**
 * @swagger
 * /api/trang-trai/create:
 *   post:
 *     summary: Tạo trang trại mới
 *     tags: [TrangTrai]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [MaNongDan, TenTrangTrai]
 *             properties:
 *               MaNongDan:
 *                 type: integer
 *               TenTrangTrai:
 *                 type: string
 *               DiaChi:
 *                 type: string
 *               SoChungNhan:
 *                 type: string
 *     responses:
 *       201:
 *         description: Tạo thành công
 */
router.post('/create', ctrl.createTrangTrai);

/**
 * @swagger
 * /api/trang-trai/update/{id}:
 *   put:
 *     summary: Cập nhật trang trại
 *     tags: [TrangTrai]
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
 *               TenTrangTrai:
 *                 type: string
 *               DiaChi:
 *                 type: string
 *               SoChungNhan:
 *                 type: string
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 */
router.put('/update/:id', ctrl.updateTrangTrai);

/**
 * @swagger
 * /api/trang-trai/delete/{id}:
 *   delete:
 *     summary: Xóa trang trại
 *     tags: [TrangTrai]
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
router.delete('/delete/:id', ctrl.deleteTrangTrai);

module.exports = router;
