const Payment = require('../models/payment.model');

const paymentController = {
  async processPayment(req, res) {
    try {
      const { order_id, user_id, amount, method } = req.body;
      if (!order_id || !user_id || !amount) {
        return res.status(400).json({ success: false, message: 'order_id, user_id, and amount are required' });
      }
      if (typeof amount !== 'number' || amount <= 0) {
        return res.status(400).json({ success: false, message: 'amount must be a positive number' });
      }
      const VALID_METHODS = ['credit_card', 'debit_card', 'paypal', 'bank_transfer', 'cash_on_delivery'];
      if (method && !VALID_METHODS.includes(method)) {
        return res.status(400).json({ success: false, message: `method must be one of: ${VALID_METHODS.join(', ')}` });
      }
      const result = await Payment.processPayment({ order_id, user_id, amount, method });
      const statusCode = result.status === 'success' ? 200 : 402;
      res.status(statusCode).json({ success: result.status === 'success', data: result });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  async getByTransaction(req, res) {
    try {
      const payment = await Payment.getByTransactionId(req.params.transactionId);
      if (!payment) return res.status(404).json({ success: false, message: 'Payment not found' });
      res.json({ success: true, data: payment });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  async getByOrder(req, res) {
    try {
      const payments = await Payment.getByOrderId(req.params.orderId);
      res.json({ success: true, data: payments });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  async getByUser(req, res) {
    try {
      const payments = await Payment.getByUserId(req.params.userId);
      res.json({ success: true, data: payments });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  async refund(req, res) {
    try {
      const result = await Payment.refund(req.params.transactionId);
      res.json({ success: true, data: result });
    } catch (err) {
      res.status(400).json({ success: false, message: err.message });
    }
  }
};

module.exports = paymentController;
