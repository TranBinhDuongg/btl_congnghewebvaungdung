const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/khohang.controller');

/**
 * @swagger
 * tags:
 *   name: Kho
 *   description: API quản lý kho hàng đại lý
 */

/**
 * @swagger
 * /api/kho/get-all:
 *   get:
 *     summary: Lấy tất cả kho
 *     tags: [Kho]
 *     responses:
 *       200:
 *         description: Danh sách kho
 */
router.get('/get-all', ctrl.getAllKho);

/**
 * @swagger
 * /api/kho/dai-ly/{maDaiLy}:
 *   get:
 *     summary: Lấy kho theo đại lý
 *     tags: [Kho]
 *     parameters:
 *       - in: path
 *         name: maDaiLy
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Danh sách kho
 */
router.get('/dai-ly/:maDaiLy', ctrl.getKhoByDaiLy);

/**
 * @swagger
 * /api/kho/create:
 *   post:
 *     summary: Tạo kho mới
 *     tags: [Kho]
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
router.post('/create', ctrl.taoKho);

/**
 * @swagger
 * /api/kho/update/{id}:
 *   put:
 *     summary: Cập nhật kho
 *     tags: [Kho]
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
router.put('/update/:id', (req, res) => {
  req.body.MaKho = req.params.id;
  ctrl.capNhatKho(req, res);
});

/**
 * @swagger
 * /api/kho/delete/{id}:
 *   delete:
 *     summary: Xóa kho
 *     tags: [Kho]
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
  req.params.maKho = req.params.id;
  ctrl.xoaKho(req, res);
});

/**
 * @swagger
 * /api/kho/{id}:
 *   get:
 *     summary: Lấy chi tiết kho
 *     tags: [Kho]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Chi tiết kho
 */
router.get('/:id', (req, res) => {
  req.params.maKho = req.params.id;
  ctrl.getKhoById(req, res);
});

module.exports = router;
