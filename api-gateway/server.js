const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const { createProxyMiddleware } = require('http-proxy-middleware');
const swaggerUi = require('swagger-ui-express');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 9090;

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(cors());
app.use(morgan('combined'));

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

// ── Unified Swagger UI ───────────────────────────────────────────────────────
const swaggerDocument = {
  openapi: '3.0.0',
  info: {
    title: '🛒 E-Commerce API Gateway',
    version: '1.0.0',
    description: 'Unified API documentation for all E-Commerce microservices.\n\nAll requests are routed through this gateway to the appropriate microservice.',
  },
  servers: [{ url: `http://localhost:${PORT}`, description: 'API Gateway' }],
  tags: [
    { name: 'Products', description: 'Product management (port 3001)' },
    { name: 'Users', description: 'User management & authentication (port 3002)' },
    { name: 'Cart', description: 'Shopping cart management (port 3003)' },
    { name: 'Inventory', description: 'Stock & inventory management (port 3004)' },
    { name: 'Payments', description: 'Payment processing (port 3005)' },
    { name: 'Orders', description: 'Order management & checkout (port 3006)' },
    { name: 'Comments', description: 'Product comments & ratings (port 3007)' },
    { name: 'Gateway', description: 'API Gateway endpoints' },
  ],
  paths: {
    // ── Products ──
    '/api/products': {
      get: { summary: 'Get all products', tags: ['Products'], responses: { 200: { description: 'List of products' } } },
      post: {
        summary: 'Create a product', tags: ['Products'],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/Product' } } } },
        responses: { 201: { description: 'Product created' } }
      }
    },
    '/api/products/{id}': {
      get: { summary: 'Get product by ID', tags: ['Products'], parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { 200: { description: 'Product found' } } },
      put: { summary: 'Update a product', tags: ['Products'], parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/Product' } } } }, responses: { 200: { description: 'Product updated' } } },
      delete: { summary: 'Delete a product', tags: ['Products'], parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { 200: { description: 'Product deleted' } } }
    },
    // ── Users ──
    '/api/users': {
      get: { summary: 'Get all users', tags: ['Users'], responses: { 200: { description: 'List of users' } } }
    },
    '/api/users/register': {
      post: {
        summary: 'Register a new user', tags: ['Users'],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/UserRegister' } } } },
        responses: { 201: { description: 'User registered' } }
      }
    },
    '/api/users/login': {
      post: {
        summary: 'Login', tags: ['Users'],
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', properties: { email: { type: 'string' }, password: { type: 'string' } } } } } },
        responses: { 200: { description: 'JWT token returned' } }
      }
    },
    '/api/users/{id}': {
      get: { summary: 'Get user by ID', tags: ['Users'], parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { 200: { description: 'User found' } } },
      put: { summary: 'Update user', tags: ['Users'], parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', properties: { name: { type: 'string' }, phone: { type: 'string' }, address: { type: 'string' } } } } } }, responses: { 200: { description: 'User updated' } } },
      delete: { summary: 'Delete user', tags: ['Users'], parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { 200: { description: 'User deleted' } } }
    },
    // ── Cart ──
    '/api/cart/{userId}': {
      get: { summary: 'Get cart for user', tags: ['Cart'], parameters: [{ name: 'userId', in: 'path', required: true, schema: { type: 'string' } }], responses: { 200: { description: 'Cart with items' } } }
    },
    '/api/cart/{userId}/items': {
      post: {
        summary: 'Add item to cart', tags: ['Cart'],
        parameters: [{ name: 'userId', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['product_id'], properties: { product_id: { type: 'integer' }, quantity: { type: 'integer' } } } } } },
        responses: { 200: { description: 'Item added' } }
      }
    },
    '/api/cart/{userId}/items/{productId}': {
      put: { summary: 'Update item quantity', tags: ['Cart'], parameters: [{ name: 'userId', in: 'path', required: true, schema: { type: 'string' } }, { name: 'productId', in: 'path', required: true, schema: { type: 'string' } }], requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', properties: { quantity: { type: 'integer' } } } } } }, responses: { 200: { description: 'Quantity updated' } } },
      delete: { summary: 'Remove item from cart', tags: ['Cart'], parameters: [{ name: 'userId', in: 'path', required: true, schema: { type: 'string' } }, { name: 'productId', in: 'path', required: true, schema: { type: 'string' } }], responses: { 200: { description: 'Item removed' } } }
    },
    '/api/cart/{userId}/clear': {
      delete: { summary: 'Clear entire cart', tags: ['Cart'], parameters: [{ name: 'userId', in: 'path', required: true, schema: { type: 'string' } }], responses: { 200: { description: 'Cart cleared' } } }
    },
    // ── Inventory ──
    '/api/inventory': {
      get: { summary: 'Get all inventory', tags: ['Inventory'], responses: { 200: { description: 'List of inventory' } } },
      post: {
        summary: 'Create inventory entry', tags: ['Inventory'],
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['product_id', 'quantity'], properties: { product_id: { type: 'integer' }, quantity: { type: 'integer' }, reorder_level: { type: 'integer' } } } } } },
        responses: { 201: { description: 'Inventory created' } }
      }
    },
    '/api/inventory/product/{productId}': {
      get: { summary: 'Get inventory by product ID', tags: ['Inventory'], parameters: [{ name: 'productId', in: 'path', required: true, schema: { type: 'string' } }], responses: { 200: { description: 'Inventory item for product' } } }
    },
    '/api/inventory/{id}': {
      put: { summary: 'Update inventory', tags: ['Inventory'], parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', properties: { quantity: { type: 'integer' }, reorder_level: { type: 'integer' } } } } } }, responses: { 200: { description: 'Updated' } } },
      delete: { summary: 'Delete inventory', tags: ['Inventory'], parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { 200: { description: 'Deleted' } } }
    },
    '/api/inventory/restock': {
      post: { summary: 'Restock a product', tags: ['Inventory'], requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['product_id', 'quantity'], properties: { product_id: { type: 'integer' }, product_name: { type: 'string' }, quantity: { type: 'integer' } } } } } }, responses: { 200: { description: 'Restocked' } } }
    },
    '/api/inventory/deduct': {
      post: { summary: 'Deduct stock', tags: ['Inventory'], requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['product_id', 'quantity'], properties: { product_id: { type: 'integer' }, quantity: { type: 'integer' }, reference: { type: 'string' } } } } } }, responses: { 200: { description: 'Stock deducted' } } }
    },
    '/api/inventory/{productId}/check': {
      get: { summary: 'Check stock availability', tags: ['Inventory'], parameters: [{ name: 'productId', in: 'path', required: true, schema: { type: 'string' } }, { name: 'quantity', in: 'query', schema: { type: 'integer' } }], responses: { 200: { description: 'Stock availability' } } }
    },
    '/api/inventory/{productId}/logs': {
      get: { summary: 'Get inventory logs', tags: ['Inventory'], parameters: [{ name: 'productId', in: 'path', required: true, schema: { type: 'string' } }], responses: { 200: { description: 'Inventory logs' } } }
    },
    // ── Payments ──
    '/api/payments/process': {
      post: {
        summary: 'Process a payment', tags: ['Payments'],
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['order_id', 'user_id', 'amount'], properties: { order_id: { type: 'string' }, user_id: { type: 'string' }, amount: { type: 'number' }, method: { type: 'string', default: 'credit_card' } } } } } },
        responses: { 200: { description: 'Payment processed' } }
      }
    },
    '/api/payments/transaction/{transactionId}': {
      get: { summary: 'Get payment by transaction ID', tags: ['Payments'], parameters: [{ name: 'transactionId', in: 'path', required: true, schema: { type: 'string' } }], responses: { 200: { description: 'Payment details' } } }
    },
    '/api/payments/order/{orderId}': {
      get: { summary: 'Get payments by order ID', tags: ['Payments'], parameters: [{ name: 'orderId', in: 'path', required: true, schema: { type: 'string' } }], responses: { 200: { description: 'Payment list' } } }
    },
    '/api/payments/user/{userId}': {
      get: { summary: 'Get payments by user ID', tags: ['Payments'], parameters: [{ name: 'userId', in: 'path', required: true, schema: { type: 'string' } }], responses: { 200: { description: 'Payment list' } } }
    },
    '/api/payments/refund/{transactionId}': {
      post: { summary: 'Refund a payment', tags: ['Payments'], parameters: [{ name: 'transactionId', in: 'path', required: true, schema: { type: 'string' } }], responses: { 200: { description: 'Refund processed' } } }
    },
    // ── Orders ──
    '/api/orders': {
      get: { summary: 'Get all orders', tags: ['Orders'], responses: { 200: { description: 'List of orders' } } },
      post: {
        summary: 'Create order (checkout flow)', tags: ['Orders'],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/CreateOrder' } } } },
        responses: { 201: { description: 'Order created' } }
      }
    },
    '/api/orders/{id}': {
      get: { summary: 'Get order by ID', tags: ['Orders'], parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { 200: { description: 'Order details' } } }
    },
    '/api/orders/user/{userId}': {
      get: { summary: 'Get orders by user', tags: ['Orders'], parameters: [{ name: 'userId', in: 'path', required: true, schema: { type: 'string' } }], responses: { 200: { description: 'User orders' } } }
    },
    '/api/orders/{id}/status': {
      patch: { summary: 'Update order status', tags: ['Orders'], parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', properties: { status: { type: 'string', enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'] } } } } } }, responses: { 200: { description: 'Status updated' } } }
    },
    // ── Comments ──
    '/api/comments': {
      get: { summary: 'Get all comments', tags: ['Comments'], responses: { 200: { description: 'List of comments' } } },
      post: {
        summary: 'Create a comment/rating', tags: ['Comments'],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/Comment' } } } },
        responses: { 201: { description: 'Comment created' } }
      }
    },
    '/api/comments/{id}': {
      get: { summary: 'Get comment by ID', tags: ['Comments'], parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { 200: { description: 'Comment found' } } },
      put: { summary: 'Update comment', tags: ['Comments'], parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', properties: { rating: { type: 'integer', minimum: 1, maximum: 5 }, comment: { type: 'string' } } } } } }, responses: { 200: { description: 'Comment updated' } } },
      delete: { summary: 'Delete comment', tags: ['Comments'], parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { 200: { description: 'Comment deleted' } } }
    },
    '/api/comments/product/{productId}': {
      get: { summary: 'Get comments by product', tags: ['Comments'], parameters: [{ name: 'productId', in: 'path', required: true, schema: { type: 'string' } }], responses: { 200: { description: 'Comments with avg rating' } } }
    },
    '/api/comments/{id}/helpful': {
      post: { summary: 'Mark comment as helpful', tags: ['Comments'], parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { 200: { description: 'Helpful count incremented' } } }
    },
    // ── Gateway ──
    '/health': {
      get: { summary: 'Aggregate health check', tags: ['Gateway'], responses: { 200: { description: 'All services UP' }, 207: { description: 'Some services DOWN' } } }
    }
  },
  components: {
    schemas: {
      Product: {
        type: 'object', required: ['name', 'price'],
        properties: { name: { type: 'string' }, price: { type: 'number' }, description: { type: 'string' }, category: { type: 'string' }, image_url: { type: 'string' }, stock: { type: 'integer' } }
      },
      UserRegister: {
        type: 'object', required: ['name', 'email', 'password'],
        properties: { name: { type: 'string' }, email: { type: 'string' }, password: { type: 'string' }, phone: { type: 'string' }, address: { type: 'string' } }
      },
      CreateOrder: {
        type: 'object', required: ['user_id'],
        properties: {
          user_id: { type: 'string' },
          payment_method: { type: 'string', default: 'credit_card' },
          shipping_address: { type: 'string' },
          notes: { type: 'string' },
          items: { type: 'array', description: 'Optional — if empty, pulls from cart', items: { type: 'object', properties: { product_id: { type: 'string' }, product_name: { type: 'string' }, unit_price: { type: 'number' }, quantity: { type: 'integer' } } } }
        }
      },
      Comment: {
        type: 'object', required: ['product_id', 'user_id', 'rating'],
        properties: { product_id: { type: 'string' }, user_id: { type: 'string' }, user_name: { type: 'string' }, rating: { type: 'integer', minimum: 1, maximum: 5 }, comment: { type: 'string' } }
      }
    }
  }
};

// Serve Swagger UI at /api-docs
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'E-Commerce API Gateway Docs'
}));

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
app.use('/api/products',  createProxyMiddleware(proxyOptions(services.products,  'product-service')));
app.use('/api/users',     createProxyMiddleware(proxyOptions(services.users,     'user-service')));
app.use('/api/cart',      createProxyMiddleware(proxyOptions(services.cart,      'cart-service')));
app.use('/api/inventory', createProxyMiddleware(proxyOptions(services.inventory, 'inventory-service')));
app.use('/api/payments',  createProxyMiddleware(proxyOptions(services.payments,  'payment-service')));
app.use('/api/orders',    createProxyMiddleware(proxyOptions(services.orders,    'order-service')));
app.use('/api/comments',  createProxyMiddleware(proxyOptions(services.comments,  'comment-rating-service')));

// ── Gateway root & health ─────────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({
    message: '🛒 E-Commerce Microservices API Gateway',
    version: '1.0.0',
    port: PORT,
    swagger: `http://localhost:${PORT}/api-docs`,
    routes: {
      products:  `http://localhost:${PORT}/api/products`,
      users:     `http://localhost:${PORT}/api/users`,
      cart:      `http://localhost:${PORT}/api/cart`,
      inventory: `http://localhost:${PORT}/api/inventory`,
      payments:  `http://localhost:${PORT}/api/payments`,
      orders:    `http://localhost:${PORT}/api/orders`,
      comments:  `http://localhost:${PORT}/api/comments`,
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
  console.log(`📚 Swagger UI:    http://localhost:${PORT}/api-docs`);
  console.log(`📋 Health check:  http://localhost:${PORT}/health`);
  console.log('\n📡 Routing table:');
  Object.entries(services).forEach(([name, url]) => {
    console.log(`   /api/${name.padEnd(10)} → ${url}`);
  });
});
