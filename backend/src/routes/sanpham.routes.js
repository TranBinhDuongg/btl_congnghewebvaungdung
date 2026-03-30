const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/sanpham.controller');

/**
 * @swagger
 * tags:
 *   name: SanPham
 *   description: API quản lý sản phẩm
 */

/**
 * @swagger
 * /api/san-pham/get-all:
 *   get:
 *     summary: Lấy tất cả sản phẩm
 *     tags: [SanPham]
 *     responses:
 *       200:
 *         description: Danh sách sản phẩm
 */
router.get('/get-all', ctrl.getAll);

/**
 * @swagger
 * /api/san-pham/get-by-id/{id}:
 *   get:
 *     summary: Lấy sản phẩm theo ID
 *     tags: [SanPham]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Thông tin sản phẩm
 */
router.get('/get-by-id/:id', ctrl.getById);

/**
 * @swagger
 * /api/san-pham/create:
 *   post:
 *     summary: Thêm sản phẩm mới
 *     tags: [SanPham]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [TenSanPham]
 *             properties:
 *               TenSanPham:
 *                 type: string
 *               DonVi:
 *                 type: string
 *               MoTa:
 *                 type: string
 *     responses:
 *       201:
 *         description: Tạo thành công
 */
router.post('/create', ctrl.create);

/**
 * @swagger
 * /api/san-pham/update/{id}:
 *   put:
 *     summary: Cập nhật sản phẩm
 *     tags: [SanPham]
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
 *               TenSanPham:
 *                 type: string
 *               DonVi:
 *                 type: string
 *               MoTa:
 *                 type: string
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 */
router.put('/update/:id', ctrl.update);

/**
 * @swagger
 * /api/san-pham/delete/{id}:
 *   delete:
 *     summary: Xóa sản phẩm
 *     tags: [SanPham]
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
