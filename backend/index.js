require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { nongDanSpec, daiLySpec, sieuThiSpec } = require('./src/config/swagger');

const app = express();
app.use(cors());
app.use(express.json());

// Swagger UI - tự build HTML để tránh conflict của swagger-ui-express
const swaggerUiDist = require('swagger-ui-dist');
const swaggerUiAssetPath = swaggerUiDist.getAbsoluteFSPath();

const makeSwaggerHtml = (specUrl) => `<!DOCTYPE html>
<html><head>
  <title>Swagger UI</title>
  <meta charset="utf-8"/>
  <link rel="stylesheet" type="text/css" href="/swagger-assets/swagger-ui.css">
</head><body>
<div id="swagger-ui"></div>
<script src="/swagger-assets/swagger-ui-bundle.js"></script>
<script src="/swagger-assets/swagger-ui-standalone-preset.js"></script>
<script>
window.onload = function() {
  SwaggerUIBundle({
    url: "${specUrl}",
    dom_id: '#swagger-ui',
    presets: [SwaggerUIBundle.presets.apis, SwaggerUIStandalonePreset],
    layout: "StandaloneLayout"
  });
};
</script>
</body></html>`;

// Serve swagger-ui static assets
app.use('/swagger-assets', require('express').static(swaggerUiAssetPath));

// Spec JSON
app.get('/specs/nongdan.json', (_req, res) => res.json(nongDanSpec));
app.get('/specs/daily.json',   (_req, res) => res.json(daiLySpec));
app.get('/specs/sieuthi.json', (_req, res) => res.json(sieuThiSpec));

// Docs pages
app.get('/api-docs/nongdan', (_req, res) => res.send(makeSwaggerHtml('/specs/nongdan.json')));
app.get('/api-docs/daily',   (_req, res) => res.send(makeSwaggerHtml('/specs/daily.json')));
app.get('/api-docs/sieuthi', (_req, res) => res.send(makeSwaggerHtml('/specs/sieuthi.json')));

// Auth
app.use('/api/auth', require('./src/routes/auth.routes'));

// Routes
app.use('/api/nong-dan',         require('./src/routes/nongdan.routes'));
app.use('/api/san-pham',         require('./src/routes/sanpham.routes'));
app.use('/api/trang-trai',       require('./src/routes/trangtrai.routes'));
app.use('/api/lo-nong-san',      require('./src/routes/lonongsan.routes'));
app.use('/api/dai-ly',           require('./src/routes/daily.routes'));
app.use('/api/don-hang-dai-ly',  require('./src/routes/donhang_daily.routes'));
app.use('/api/don-hang-sieu-thi',require('./src/routes/donhang_sieuthi.routes'));
app.use('/api/kho',              require('./src/routes/kho_daily.routes'));
app.use('/api/kiem-dinh',        require('./src/routes/kiemdinhh.routes'));
app.use('/api/sieuthi',          require('./src/routes/sieuthi.routes'));
app.use('/api/KhoHang',          require('./src/routes/khohang.routes'));

// Serve React frontend
const frontendBuild = path.join(__dirname, '../frontend/build');
app.use(express.static(frontendBuild, {
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.html')) {
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
    } else if (filePath.endsWith('.js')) {
      res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
    }
  }
}));
app.use((_req, res) => {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.sendFile(path.join(frontendBuild, 'index.html'));
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Docs Nông Dân : http://localhost:${PORT}/api-docs/nongdan`);
  console.log(`Docs Đại Lý   : http://localhost:${PORT}/api-docs/daily`);
  console.log(`Docs Siêu Thị : http://localhost:${PORT}/api-docs/sieuthi`);
});
