const db = require('../config/db');
const { v4: uuidv4 } = require('uuid');

const Payment = {
  async processPayment({ order_id, user_id, amount, method = 'credit_card' }) {
    const transaction_id = uuidv4();
    const successRate = parseFloat(process.env.PAYMENT_SUCCESS_RATE) || 0.95;
    const isSuccess = Math.random() < successRate;
    const status = isSuccess ? 'success' : 'failed';
    const gateway_response = JSON.stringify({
      gateway: 'SimulatedGateway',
      message: isSuccess ? 'Payment approved' : 'Payment declined',
      code: isSuccess ? 'APPROVED' : 'DECLINED',
      timestamp: new Date().toISOString()
    });

    await db.query(
      'INSERT INTO payments (transaction_id, order_id, user_id, amount, method, status, gateway_response) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [transaction_id, order_id, user_id, amount, method, status, gateway_response]
    );

    return {
      transaction_id,
      order_id,
      user_id,
      amount,
      method,
      status,
      message: isSuccess ? 'Payment processed successfully' : 'Payment failed',
      gateway_response: JSON.parse(gateway_response)
    };
  },

  async getByTransactionId(transaction_id) {
    const [rows] = await db.query('SELECT * FROM payments WHERE transaction_id = ?', [transaction_id]);
    return rows[0];
  },

  async getByOrderId(order_id) {
    const [rows] = await db.query('SELECT * FROM payments WHERE order_id = ?', [order_id]);
    return rows;
  },

  async getByUserId(user_id) {
    const [rows] = await db.query('SELECT * FROM payments WHERE user_id = ? ORDER BY created_at DESC', [user_id]);
    return rows;
  },

  async refund(transaction_id) {
    const payment = await this.getByTransactionId(transaction_id);
    if (!payment) throw new Error('Payment not found');
    if (payment.status !== 'success') throw new Error('Only successful payments can be refunded');
    await db.query("UPDATE payments SET status = 'refunded' WHERE transaction_id = ?", [transaction_id]);
    return { ...payment, status: 'refunded', message: 'Refund processed successfully' };
  }
};

module.exports = Payment;
