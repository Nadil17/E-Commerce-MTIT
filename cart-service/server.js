const express = require('express');
const cors = require('cors');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3003;

app.use(cors());
app.use(express.json());

const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: { title: 'Cart Service API', version: '1.0.0', description: 'Microservice for shopping cart management' },
    servers: [{ url: `http://localhost:8080` }],
    components: {
      securitySchemes: {
        bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }
      }
    },
    security: [{ bearerAuth: [] }],
  },
  apis: ['./routes/*.js'],
};
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerJsdoc(swaggerOptions)));
app.use('/api/cart', require('./routes/cart.routes'));
app.get('/health', (req, res) => res.json({ service: 'cart-service', status: 'UP', port: PORT }));

app.listen(PORT, () => {
  console.log(`✅ Cart Service running on http://localhost:${PORT}`);
  console.log(`📚 Swagger docs at http://localhost:${PORT}/api-docs`);
});
