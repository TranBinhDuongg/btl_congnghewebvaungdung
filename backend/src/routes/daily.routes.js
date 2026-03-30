const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/daily.controller');

/**
 * @swagger
 * tags:
 *   name: DaiLy
 *   description: API quản lý đại lý
 */

/**
 * @swagger
 * /api/dai-ly/get-all:
 *   get:
 *     summary: Lấy tất cả đại lý
 *     tags: [DaiLy]
 *     responses:
 *       200:
 *         description: Danh sách đại lý
 */
router.get('/get-all', ctrl.search);

/**
 * @swagger
 * /api/dai-ly/search:
 *   get:
 *     summary: Tìm kiếm đại lý
 *     tags: [DaiLy]
 *     parameters:
 *       - in: query
 *         name: keyword
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Danh sách đại lý
 */
router.get('/search', ctrl.search);

/**
 * @swagger
 * /api/dai-ly/{id}:
 *   get:
 *     summary: Lấy thông tin đại lý theo ID
 *     tags: [DaiLy]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Thông tin đại lý
 */
router.get('/:id', ctrl.getById);

/**
 * @swagger
 * /api/dai-ly/create:
 *   post:
 *     summary: Thêm đại lý mới
 *     tags: [DaiLy]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [TenDangNhap, MatKhauHash, TenDaiLy]
 *             properties:
 *               TenDangNhap:
 *                 type: string
 *               MatKhauHash:
 *                 type: string
 *               TenDaiLy:
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
 * /api/dai-ly/update/{id}:
 *   put:
 *     summary: Cập nhật đại lý
 *     tags: [DaiLy]
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
 *               TenDaiLy:
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
router.put('/update/:id', (req, res) => {
  req.params.maDaiLy = req.params.id;
  ctrl.update(req, res);
});

/**
 * @swagger
 * /api/dai-ly/delete/{id}:
 *   delete:
 *     summary: Xóa đại lý (khóa tài khoản)
 *     tags: [DaiLy]
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
router.delete('/delete/:id', (req, res) => {
  req.params.maDaiLy = req.params.id;
  ctrl.remove(req, res);
});

module.exports = router;
