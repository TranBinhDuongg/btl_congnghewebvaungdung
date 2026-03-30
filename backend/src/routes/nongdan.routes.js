const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/nongdan.controller');

/**
 * @swagger
 * tags:
 *   name: NongDan
 *   description: API quản lý nông dân
 */

/**
 * @swagger
 * /api/nong-dan/get-all:
 *   get:
 *     summary: Lấy tất cả nông dân
 *     tags: [NongDan]
 *     responses:
 *       200:
 *         description: Danh sách nông dân
 */
router.get('/get-all', ctrl.getAll);

/**
 * @swagger
 * /api/nong-dan/get-by-id/{id}:
 *   get:
 *     summary: Lấy nông dân theo ID
 *     tags: [NongDan]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Thông tin nông dân
 */
router.get('/get-by-id/:id', ctrl.getById);

/**
 * @swagger
 * /api/nong-dan/create:
 *   post:
 *     summary: Thêm nông dân mới
 *     tags: [NongDan]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [TenDangNhap, MatKhauHash, HoTen]
 *             properties:
 *               TenDangNhap:
 *                 type: string
 *               MatKhauHash:
 *                 type: string
 *               HoTen:
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
router.post('/create', ctrl.create);

/**
 * @swagger
 * /api/nong-dan/update/{id}:
 *   put:
 *     summary: Cập nhật nông dân
 *     tags: [NongDan]
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
 *               HoTen:
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
 */
router.put('/update/:id', ctrl.update);

/**
 * @swagger
 * /api/nong-dan/delete/{id}:
 *   delete:
 *     summary: Xóa nông dân
 *     tags: [NongDan]
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
