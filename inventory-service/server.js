const express = require('express');
const cors = require('cors');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const connectDB = require('./config/db');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3004;

app.use(cors());
app.use(express.json());

const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: { title: 'Inventory Service API', version: '1.0.0', description: 'Microservice for stock management' },
    servers: [{ url: `http://localhost:${PORT}` }],
  },
  apis: ['./routes/*.js'],
};
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerJsdoc(swaggerOptions)));
app.use('/api/inventory', require('./routes/inventory.routes'));
app.get('/health', (req, res) => res.json({ service: 'inventory-service', status: 'UP', port: PORT }));

app.use((err, req, res, next) => {
  console.error('Unhandled request error:', {
    message: err?.message,
    code: err?.code,
    sqlMessage: err?.sqlMessage
  });
  res.status(500).json({
    success: false,
    message: err?.message || err?.sqlMessage || err?.code || 'Internal server error',
    error: err?.code || null
  });
});

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Promise Rejection:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

async function startServer() {
  try {
    await connectDB();

    app.listen(PORT, () => {
      console.log(`✅ Inventory Service running on http://localhost:${PORT}`);
      console.log(`📚 Swagger docs at http://localhost:${PORT}/api-docs`);
    });
  } catch (err) {
    console.error('❌ Failed to connect to Database:', err);
    process.exit(1);
  }
}

startServer();
