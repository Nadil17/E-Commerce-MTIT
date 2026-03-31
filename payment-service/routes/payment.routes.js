const express = require('express');
const router = express.Router();
const controller = require('../controllers/payment.controller');

/**
 * @swagger
 * /api/payments/process:
 *   post:
 *     summary: Process a payment
 *     tags: [Payments]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [order_id, user_id, amount]
 *             properties:
 *               order_id:
 *                 type: string
 *               user_id:
 *                 type: integer
 *               amount:
 *                 type: number
 *               method:
 *                 type: string
 *                 enum: [credit_card, debit_card, paypal, bank_transfer]
 *     responses:
 *       200:
 *         description: Payment successful
 *       402:
 *         description: Payment failed
 */
router.post('/process', controller.processPayment);

/**
 * @swagger
 * /api/payments/transaction/{transactionId}:
 *   get:
 *     summary: Get payment by transaction ID
 *     tags: [Payments]
 *     parameters:
 *       - in: path
 *         name: transactionId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Payment details
 */
router.get('/transaction/:transactionId', controller.getByTransaction);

/**
 * @swagger
 * /api/payments/order/{orderId}:
 *   get:
 *     summary: Get payments by order ID
 *     tags: [Payments]
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Payments for order
 */
router.get('/order/:orderId', controller.getByOrder);

/**
 * @swagger
 * /api/payments/user/{userId}:
 *   get:
 *     summary: Get payments by user ID
 *     tags: [Payments]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: User payment history
 */
router.get('/user/:userId', controller.getByUser);

/**
 * @swagger
 * /api/payments/refund/{transactionId}:
 *   post:
 *     summary: Refund a payment
 *     tags: [Payments]
 *     parameters:
 *       - in: path
 *         name: transactionId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Refund successful
 */
router.post('/refund/:transactionId', controller.refund);

module.exports = router;
