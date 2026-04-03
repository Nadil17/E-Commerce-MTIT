const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const paymentSchema = new mongoose.Schema({
  transaction_id: { type: String, required: true, unique: true },
  order_id: { type: String, required: true },
  user_id: { type: String, required: true },
  amount: { type: Number, required: true },
  method: { type: String, default: 'credit_card' },
  status: { type: String, enum: ['success', 'failed', 'refunded'], default: 'failed' },
  gateway_response: { type: mongoose.Schema.Types.Mixed }
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

const PaymentModel = mongoose.model('Payment', paymentSchema);

const mapDoc = (doc) => {
  if (!doc) return null;
  const obj = doc.toObject ? doc.toObject() : { ...doc };
  obj.id = obj._id.toString();
  return obj;
};

const Payment = {
  async processPayment({ order_id, user_id, amount, method = 'credit_card' }) {
    const transaction_id = uuidv4();
    const successRate = parseFloat(process.env.PAYMENT_SUCCESS_RATE) || 0.95;
    const isSuccess = Math.random() < successRate;
    const status = isSuccess ? 'success' : 'failed';
    const gateway_response = {
      gateway: 'SimulatedGateway',
      message: isSuccess ? 'Payment approved' : 'Payment declined',
      code: isSuccess ? 'APPROVED' : 'DECLINED',
      timestamp: new Date().toISOString()
    };

    await PaymentModel.create({
      transaction_id, order_id, user_id, amount, method, status, gateway_response
    });

    return {
      transaction_id,
      order_id,
      user_id,
      amount,
      method,
      status,
      message: isSuccess ? 'Payment processed successfully' : 'Payment failed',
      gateway_response
    };
  },

  async getByTransactionId(transaction_id) {
    const doc = await PaymentModel.findOne({ transaction_id });
    return mapDoc(doc);
  },

  async getByOrderId(order_id) {
    const docs = await PaymentModel.find({ order_id }).lean();
    return docs.map(d => ({ ...d, id: d._id.toString() }));
  },

  async getByUserId(user_id) {
    const docs = await PaymentModel.find({ user_id }).sort({ created_at: -1 }).lean();
    return docs.map(d => ({ ...d, id: d._id.toString() }));
  },

  async refund(transaction_id) {
    const payment = await PaymentModel.findOne({ transaction_id });
    if (!payment) throw new Error('Payment not found');
    if (payment.status !== 'success') throw new Error('Only successful payments can be refunded');
    payment.status = 'refunded';
    await payment.save();
    return { ...mapDoc(payment), status: 'refunded', message: 'Refund processed successfully' };
  }
};

module.exports = Payment;
