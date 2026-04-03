const mongoose = require('mongoose');

// Embedded order item schema
const orderItemSchema = new mongoose.Schema({
  product_id: { type: String, required: true },
  product_name: { type: String, default: 'Unknown' },
  unit_price: { type: Number, required: true },
  quantity: { type: Number, required: true },
  subtotal: { type: Number, required: true }
});

const orderSchema = new mongoose.Schema({
  order_number: { type: String, required: true, unique: true },
  user_id: { type: String, required: true },
  items: [orderItemSchema],
  total_amount: { type: Number, required: true },
  payment_method: { type: String, default: 'credit_card' },
  payment_status: { type: String, enum: ['pending', 'paid', 'failed', 'refunded'], default: 'pending' },
  transaction_id: { type: String, default: null },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'],
    default: 'pending'
  },
  shipping_address: { type: String, default: '' },
  notes: { type: String, default: '' }
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

const OrderModel = mongoose.model('Order', orderSchema);

const mapDoc = (doc) => {
  if (!doc) return null;
  const obj = doc.toObject ? doc.toObject() : { ...doc };
  obj.id = obj._id.toString();
  return obj;
};

const Order = {
  async getAll() {
    const docs = await OrderModel.find().sort({ created_at: -1 }).lean();
    return docs.map(d => ({ ...d, id: d._id.toString() }));
  },

  async getById(id) {
    if (!mongoose.isValidObjectId(id)) return null;
    const doc = await OrderModel.findById(id);
    return mapDoc(doc);
  },

  async getByOrderNumber(order_number) {
    const doc = await OrderModel.findOne({ order_number });
    return mapDoc(doc);
  },

  async getByUserId(user_id) {
    const docs = await OrderModel.find({ user_id }).sort({ created_at: -1 }).lean();
    return docs.map(d => ({ ...d, id: d._id.toString() }));
  },

  async create({ order_number, user_id, items, total_amount, payment_method, shipping_address, notes }) {
    const orderItems = items.map(item => ({
      product_id: item.product_id,
      product_name: item.product_name,
      unit_price: item.unit_price || item.product_price,
      quantity: item.quantity,
      subtotal: (item.unit_price || item.product_price) * item.quantity
    }));

    const doc = await OrderModel.create({
      order_number,
      user_id,
      items: orderItems,
      total_amount,
      payment_method,
      shipping_address,
      notes
    });

    return mapDoc(doc);
  },

  async updateStatus(id, status) {
    if (!mongoose.isValidObjectId(id)) return null;
    const doc = await OrderModel.findByIdAndUpdate(id, { status }, { new: true });
    return mapDoc(doc);
  },

  async updatePayment(id, { payment_status, transaction_id }) {
    if (!mongoose.isValidObjectId(id)) return null;
    const doc = await OrderModel.findByIdAndUpdate(
      id,
      { payment_status, transaction_id },
      { new: true }
    );
    return mapDoc(doc);
  }
};

module.exports = Order;
