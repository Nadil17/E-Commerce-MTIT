const express = require('express');
const router = express.Router();
const controller = require('../controllers/order.controller');

/**
 * @swagger
 * /api/orders:
 *   get:
 *     summary: Get all orders
 *     tags: [Orders]
 *     responses:
 *       200:
 *         description: List of all orders
 */
router.get('/', controller.getAll);

/**
 * @swagger
 * /api/orders/{id}:
 *   get:
 *     summary: Get order by ID
 *     tags: [Orders]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Order with items
 */
router.get('/:id', controller.getById);

/**
 * @swagger
 * /api/orders/user/{userId}:
 *   get:
 *     summary: Get orders by user
 *     tags: [Orders]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: User's orders
 */
router.get('/user/:userId', controller.getByUser);

/**
 * @swagger
 * /api/orders:
 *   post:
 *     summary: Create a new order (checkout flow)
 *     tags: [Orders]
 *     description: |
 *       Full checkout orchestration:
 *       1. Fetches cart from Cart Service
 *       2. Checks stock via Inventory Service
 *       3. Creates order record
 *       4. Processes payment via Payment Service
 *       5. Deducts inventory on success
 *       6. Clears cart on success
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [user_id]
 *             properties:
 *               user_id:
 *                 type: integer
 *               payment_method:
 *                 type: string
 *                 enum: [credit_card, debit_card, paypal, bank_transfer]
 *               shipping_address:
 *                 type: string
 *               notes:
 *                 type: string
 *               items:
 *                 type: array
 *                 description: Optional - provide items directly instead of using cart
 *                 items:
 *                   type: object
 *                   properties:
 *                     product_id:
 *                       type: integer
 *                     product_name:
 *                       type: string
 *                     unit_price:
 *                       type: number
 *                     quantity:
 *                       type: integer
 *     responses:
 *       201:
 *         description: Order created
 */
router.post('/', controller.createOrder);

/**
 * @swagger
 * /api/orders/{id}/status:
 *   patch:
 *     summary: Update order status
 *     tags: [Orders]
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
 *               status:
 *                 type: string
 *                 enum: [pending, confirmed, processing, shipped, delivered, cancelled, refunded]
 *     responses:
 *       200:
 *         description: Status updated
 */
router.patch('/:id/status', controller.updateStatus);

module.exports = router;
