const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/donhang_sieuthi.controller');

router.get('/get-all', ctrl.getAll);
router.get('/dai-ly/:maDaiLy', ctrl.getByDaiLy);

/**
 * @swagger
 * /api/don-hang-sieu-thi/{id}:
 *   get:
 *     summary: Lấy chi tiết đơn hàng siêu thị
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
router.get('/:id', ctrl.getById);

/**
 * @swagger
 * /api/don-hang-sieu-thi/update-trang-thai/{id}:
 *   put:
 *     summary: Cập nhật trạng thái đơn hàng siêu thị
 *     tags: [DonHangSieuThi]
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
 *             required: [TrangThai]
 *             properties:
 *               TrangThai:
 *                 type: string
 *                 enum: [chua_nhan, da_nhan, dang_xu_ly, hoan_thanh, da_huy]
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 */
router.put('/update-trang-thai/:id', ctrl.updateTrangThai);

module.exports = router;
