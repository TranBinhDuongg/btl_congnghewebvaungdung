const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/truyxuat.controller');

/**
 * @swagger
 * tags:
 *   name: TruyXuat
 *   description: API truy xuất nguồn gốc nông sản
 */

/**
 * @swagger
 * /api/truy-xuat/tim-kiem:
 *   get:
 *     summary: Tìm kiếm lô nông sản
 *     tags: [TruyXuat]
 *     parameters:
 *       - in: query
 *         name: keyword
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Danh sách lô nông sản
 */
router.get('/tim-kiem', ctrl.timKiemLo);

/**
 * @swagger
 * /api/truy-xuat/{maLo}:
 *   get:
 *     summary: Truy xuất nguồn gốc lô nông sản
 *     tags: [TruyXuat]
 *     parameters:
 *       - in: path
 *         name: maLo
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Thông tin truy xuất nguồn gốc đầy đủ
 */
router.get('/:maLo', ctrl.truyXuatNguonGoc);

module.exports = router;
