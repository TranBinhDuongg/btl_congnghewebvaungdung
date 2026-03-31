const express = require('express');
const router = express.Router();
const { login } = require('../controllers/auth.controller');

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Đăng nhập hệ thống
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [accountType, username, password]
 *             properties:
 *               accountType:
 *                 type: string
 *                 enum: [nongdan, daily, sieuthi, admin]
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Đăng nhập thành công, trả về thông tin user
 *       401:
 *         description: Sai tên đăng nhập hoặc mật khẩu
 */
router.post('/login', login);

module.exports = router;
