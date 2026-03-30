const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/donhang_daily.controller');

/**
 * @swagger
 * tags:
 *   name: DonHangDaiLy
 *   description: API đơn hàng đại lý -> nông dân
 */

/**
 * @swagger
 * /api/don-hang-dai-ly/get-all:
 *   get:
 *     summary: Lấy tất cả đơn hàng
 *     tags: [DonHangDaiLy]
 *     responses:
 *       200:
 *         description: Danh sách đơn hàng
 */
router.get('/get-all', ctrl.getAll);

/**
 * @swagger
 * /api/don-hang-dai-ly/get-by-nong-dan/{maNongDan}:
 *   get:
 *     summary: Lấy đơn hàng theo nông dân
 *     tags: [DonHangDaiLy]
 *     parameters:
 *       - in: path
 *         name: maNongDan
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Danh sách đơn hàng
 */
router.get('/get-by-nong-dan/:maNongDan', ctrl.getByNongDan);

/**
 * @swagger
 * /api/don-hang-dai-ly/get-by-dai-ly/{maDaiLy}:
 *   get:
 *     summary: Lấy đơn hàng theo đại lý
 *     tags: [DonHangDaiLy]
 *     parameters:
 *       - in: path
 *         name: maDaiLy
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Danh sách đơn hàng
 */
router.get('/get-by-dai-ly/:maDaiLy', ctrl.getByDaiLy);

/**
 * @swagger
 * /api/don-hang-dai-ly/create:
 *   post:
 *     summary: Tạo đơn hàng mới
 *     tags: [DonHangDaiLy]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [MaDaiLy, MaNongDan]
 *             properties:
 *               MaDaiLy:
 *                 type: integer
 *               MaNongDan:
 *                 type: integer
 *               GhiChu:
 *                 type: string
 *     responses:
 *       201:
 *         description: Tạo thành công
 */
router.post('/create', ctrl.create);

/**
 * @swagger
 * /api/don-hang-dai-ly/update/{id}:
 *   put:
 *     summary: Cập nhật đơn hàng
 *     tags: [DonHangDaiLy]
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
 *               GhiChu:
 *                 type: string
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 */
router.put('/update/:id', ctrl.update);

/**
 * @swagger
 * /api/don-hang-dai-ly/xac-nhan/{id}:
 *   put:
 *     summary: Xác nhận đơn hàng
 *     tags: [DonHangDaiLy]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Xác nhận thành công
 */
router.put('/xac-nhan/:id', ctrl.xacNhan);

/**
 * @swagger
 * /api/don-hang-dai-ly/xuat-don/{id}:
 *   put:
 *     summary: Xuất đơn hàng (hoàn thành)
 *     tags: [DonHangDaiLy]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Xuất đơn thành công
 */
router.put('/xuat-don/:id', ctrl.xuatDon);

/**
 * @swagger
 * /api/don-hang-dai-ly/huy-don/{id}:
 *   put:
 *     summary: Hủy đơn hàng
 *     tags: [DonHangDaiLy]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Hủy thành công
 */
router.put('/huy-don/:id', ctrl.huyDon);

/**
 * @swagger
 * /api/don-hang-dai-ly/delete/{id}:
 *   delete:
 *     summary: Xóa đơn hàng
 *     tags: [DonHangDaiLy]
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
 * /api/don-hang-dai-ly/{maDonHang}/chi-tiet:
 *   get:
 *     summary: Lấy chi tiết đơn hàng
 *     tags: [DonHangDaiLy]
 *     parameters:
 *       - in: path
 *         name: maDonHang
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Chi tiết đơn hàng
 *   post:
 *     summary: Thêm chi tiết đơn hàng
 *     tags: [DonHangDaiLy]
 *     parameters:
 *       - in: path
 *         name: maDonHang
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [MaLo, SoLuong, DonGia]
 *             properties:
 *               MaLo:
 *                 type: integer
 *               SoLuong:
 *                 type: number
 *               DonGia:
 *                 type: number
 *     responses:
 *       201:
 *         description: Thêm thành công
 */
router.get('/:maDonHang/chi-tiet', ctrl.getChiTiet);
router.post('/:maDonHang/chi-tiet', ctrl.addChiTiet);

/**
 * @swagger
 * /api/don-hang-dai-ly/{maDonHang}/chi-tiet/{maLo}:
 *   put:
 *     summary: Cập nhật chi tiết đơn hàng
 *     tags: [DonHangDaiLy]
 *     parameters:
 *       - in: path
 *         name: maDonHang
 *         required: true
 *         schema:
 *           type: integer
 *       - in: path
 *         name: maLo
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [SoLuong, DonGia]
 *             properties:
 *               SoLuong:
 *                 type: number
 *               DonGia:
 *                 type: number
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *   delete:
 *     summary: Xóa chi tiết đơn hàng
 *     tags: [DonHangDaiLy]
 *     parameters:
 *       - in: path
 *         name: maDonHang
 *         required: true
 *         schema:
 *           type: integer
 *       - in: path
 *         name: maLo
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Xóa thành công
 */
router.put('/:maDonHang/chi-tiet/:maLo', ctrl.updateChiTiet);
router.delete('/:maDonHang/chi-tiet/:maLo', ctrl.deleteChiTiet);

/**
 * @swagger
 * /api/don-hang-dai-ly/get-by-id/{id}:
 *   get:
 *     summary: Lấy đơn hàng theo ID
 *     tags: [DonHangDaiLy]
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
router.get('/get-by-id/:id', ctrl.getById);

module.exports = router;
