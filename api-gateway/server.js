const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const { createProxyMiddleware } = require('http-proxy-middleware');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8080;

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(cors());
app.use(morgan('combined'));
// IMPORTANT:
// Do not parse JSON bodies in the gateway before proxying.
// If the body is consumed here, proxied POST/PUT/PATCH requests can hang
// (upstream service waits for a body that never arrives).

// Rate limiting — 200 requests per 15 minutes per IP
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { success: false, message: 'Too many requests, please slow down.' }
}));

// ── Request logger middleware ─────────────────────────────────────────────────
app.use((req, res, next) => {
  console.log(`[Gateway] ${new Date().toISOString()} → ${req.method} ${req.path}`);
  next();
});

// ── Service URLs ──────────────────────────────────────────────────────────────
const services = {
  products:  process.env.PRODUCT_SERVICE_URL,
  users:     process.env.USER_SERVICE_URL,
  cart:      process.env.CART_SERVICE_URL,
  inventory: process.env.INVENTORY_SERVICE_URL,
  payments:  process.env.PAYMENT_SERVICE_URL,
  orders:    process.env.ORDER_SERVICE_URL,
  comments:  process.env.COMMENT_RATING_SERVICE_URL,
};

// ── Proxy options factory ─────────────────────────────────────────────────────
const proxyOptions = (target, serviceName) => ({
  target,
  changeOrigin: true,
  on: {
    error: (err, req, res) => {
      console.error(`[Gateway] ❌ ${serviceName} unreachable: ${err.message}`);
      res.status(503).json({
        success: false,
        message: `${serviceName} is currently unavailable`,
        service: serviceName
      });
    }
  }
});

// ── Route Proxies ─────────────────────────────────────────────────────────────
//   /api/products  → product-service  (port 3001)
app.use('/api/products',  createProxyMiddleware(proxyOptions(services.products,  'product-service')));

//   /api/users     → user-service     (port 3002)
app.use('/api/users',     createProxyMiddleware(proxyOptions(services.users,     'user-service')));

//   /api/cart      → cart-service     (port 3003)
app.use('/api/cart',      createProxyMiddleware(proxyOptions(services.cart,      'cart-service')));

//   /api/inventory → inventory-service (port 3004)
app.use('/api/inventory', createProxyMiddleware(proxyOptions(services.inventory, 'inventory-service')));

//   /api/payments  → payment-service  (port 3005)
app.use('/api/payments',  createProxyMiddleware(proxyOptions(services.payments,  'payment-service')));

//   /api/orders    → order-service    (port 3006)
app.use('/api/orders',    createProxyMiddleware(proxyOptions(services.orders,    'order-service')));

//   /api/comments  → comment-rating-service (port 3007)
app.use('/api/comments',  createProxyMiddleware(proxyOptions(services.comments,  'comment-rating-service')));

// ── Swagger docs proxy ────────────────────────────────────────────────────────
// Access any service swagger via:  /docs/products, /docs/users, etc.
const docsMap = {
  products:  services.products,
  users:     services.users,
  cart:      services.cart,
  inventory: services.inventory,
  payments:  services.payments,
  orders:    services.orders,
  comments:  services.comments,
};

Object.entries(docsMap).forEach(([name, target]) => {
  app.use(
    `/docs/${name}`,
    createProxyMiddleware({
      target,
      changeOrigin: true,
      pathRewrite: { [`^/docs/${name}`]: '/api-docs' },
      on: {
        error: (err, req, res) => {
          res.status(503).send(`<h2>${name} swagger unavailable</h2>`);
        }
      }
    })
  );
});

// ── Gateway root & health ─────────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({
    message: '🛒 E-Commerce Microservices API Gateway',
    version: '1.0.0',
    port: PORT,
    routes: {
      products:  `http://localhost:${PORT}/api/products`,
      users:     `http://localhost:${PORT}/api/users`,
      cart:      `http://localhost:${PORT}/api/cart`,
      inventory: `http://localhost:${PORT}/api/inventory`,
      payments:  `http://localhost:${PORT}/api/payments`,
      orders:    `http://localhost:${PORT}/api/orders`,
    },
    swagger_docs: {
      products:  `http://localhost:${PORT}/docs/products`,
      users:     `http://localhost:${PORT}/docs/users`,
      cart:      `http://localhost:${PORT}/docs/cart`,
      inventory: `http://localhost:${PORT}/docs/inventory`,
      payments:  `http://localhost:${PORT}/docs/payments`,
      orders:    `http://localhost:${PORT}/docs/orders`,
    }
  });
});

// Aggregate health check — pings all services
app.get('/health', async (req, res) => {
  const http = require('http');
  const checks = await Promise.allSettled(
    Object.entries(services).map(([name, url]) =>
      new Promise((resolve, reject) => {
        const req = http.get(`${url}/health`, (r) => {
          let data = '';
          r.on('data', d => data += d);
          r.on('end', () => resolve({ name, status: 'UP', url }));
        });
        req.on('error', () => resolve({ name, status: 'DOWN', url }));
        req.setTimeout(3000, () => { req.destroy(); resolve({ name, status: 'TIMEOUT', url }); });
      })
    )
  );
  const results = checks.map(c => c.value || c.reason);
  const allUp = results.every(r => r.status === 'UP');
  res.status(allUp ? 200 : 207).json({
    gateway: 'UP',
    port: PORT,
    timestamp: new Date().toISOString(),
    services: results
  });
});

app.listen(PORT, () => {
  console.log(`\n🚀 API Gateway running on http://localhost:${PORT}`);
  console.log(`📋 Health check: http://localhost:${PORT}/health`);
  console.log('\n📡 Routing table:');
  Object.entries(services).forEach(([name, url]) => {
    console.log(`   /api/${name.padEnd(10)} → ${url}`);
  });
  console.log('\n📚 Swagger docs via gateway:');
  Object.keys(docsMap).forEach(name => {
    console.log(`   /docs/${name.padEnd(10)} → ${services[name]}/api-docs`);
  });
});
