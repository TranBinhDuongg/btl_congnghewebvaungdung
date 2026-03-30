const swaggerJsdoc = require('swagger-jsdoc');

const base = {
  openapi: '3.0.0',
  servers: [{ url: 'http://localhost:5000' }],
};

const nongDanSpec = swaggerJsdoc({
  definition: { ...base, info: { title: 'Nông Dân API', version: '1.0.0', description: 'API quản lý nông dân' } },
  apis: [
    './src/routes/nongdan.routes.js',
    './src/routes/sanpham.routes.js',
    './src/routes/trangtrai.routes.js',
    './src/routes/lonongsan.routes.js',
    './src/routes/donhang_daily.routes.js',
  ],
});

const daiLySpec = swaggerJsdoc({
  definition: { ...base, info: { title: 'Đại Lý API', version: '1.0.0', description: 'API quản lý đại lý' } },
  apis: ['./src/routes/daily.routes.js', './src/routes/donhang_daily.routes.js', './src/routes/donhang_sieuthi.routes.js', './src/routes/kho_daily.routes.js', './src/routes/kiemdinhh.routes.js'],
});

const sieuThiSpec = swaggerJsdoc({
  definition: { ...base, info: { title: 'Siêu Thị API', version: '1.0.0', description: 'API quản lý siêu thị' } },
  apis: ['./src/routes/sieuthi.routes.js', './src/routes/khohang.routes.js'],
});

module.exports = { nongDanSpec, daiLySpec, sieuThiSpec };
