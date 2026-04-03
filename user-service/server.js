const express = require('express');
const cors = require('cors');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const connectDB = require('./config/db');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3002;

app.use(cors());
app.use(express.json());

const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: { title: 'User Service API', version: '1.0.0', description: 'Microservice for managing users with JWT auth' },
    servers: [{ url: `http://localhost:${PORT}` }],
  },
  apis: ['./routes/*.js'],
};
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerJsdoc(swaggerOptions)));
app.use('/api/users', require('./routes/user.routes'));
app.get('/health', (req, res) => res.json({ service: 'user-service', status: 'UP', port: PORT }));

async function startServer() {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`✅ User Service running on http://localhost:${PORT}`);
      console.log(`📚 Swagger docs at http://localhost:${PORT}/api-docs`);
    });
  } catch (err) {
    console.error('❌ Failed to connect to Database:', err);
    process.exit(1);
  }
}

startServer();
