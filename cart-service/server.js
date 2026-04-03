const express = require('express');
const cors = require('cors');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const connectDB = require('./config/db');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3003;

app.use(cors());
app.use(express.json());

const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: { title: 'Cart Service API', version: '1.0.0', description: 'Microservice for shopping cart management' },
    servers: [{ url: `http://localhost:${PORT}` }],
  },
  apis: ['./routes/*.js'],
};
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerJsdoc(swaggerOptions)));
app.use('/api/cart', require('./routes/cart.routes'));
app.get('/health', (req, res) => res.json({ service: 'cart-service', status: 'UP', port: PORT }));

async function startServer() {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`✅ Cart Service running on http://localhost:${PORT}`);
      console.log(`📚 Swagger docs at http://localhost:${PORT}/api-docs`);
    });
  } catch (err) {
    console.error('❌ Failed to connect to Database:', err);
    process.exit(1);
  }
}

startServer();
