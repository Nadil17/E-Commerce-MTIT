const mongoose = require('mongoose');

// --- Schemas ---

const cartItemSchema = new mongoose.Schema({
  product_id: { type: String, required: true },
  product_name: { type: String, default: 'Unknown' },
  product_price: { type: Number, required: true, default: 0 },
  quantity: { type: Number, required: true, default: 1 }
});

const cartSchema = new mongoose.Schema({
  user_id: { type: String, required: true },
  status: { type: String, default: 'active' },
  items: [cartItemSchema]
}, { timestamps: true });

const CartModel = mongoose.model('Cart', cartSchema);

// --- Service ---

const Cart = {
  async getOrCreateCart(user_id) {
    let cart = await CartModel.findOne({ user_id, status: 'active' });
    if (!cart) {
      cart = await CartModel.create({ user_id, status: 'active', items: [] });
    }
    return cart;
  },

  async getCartWithItems(user_id) {
    const cart = await this.getOrCreateCart(user_id);
    const items = cart.items || [];
    const total = items.reduce((sum, item) => sum + (item.product_price * item.quantity), 0);
    return {
      id: cart._id.toString(),
      user_id: cart.user_id,
      status: cart.status,
      items: items.map(i => ({
        id: i._id.toString(),
        product_id: i.product_id,
        product_name: i.product_name,
        product_price: i.product_price,
        quantity: i.quantity
      })),
      total: parseFloat(total.toFixed(2))
    };
  },

  async addItem(user_id, { product_id, product_name, product_price, quantity = 1 }) {
    const cart = await this.getOrCreateCart(user_id);
    const existing = cart.items.find(i => String(i.product_id) === String(product_id));
    if (existing) {
      existing.quantity += quantity;
    } else {
      cart.items.push({ product_id, product_name, product_price, quantity });
    }
    await cart.save();
    return this.getCartWithItems(user_id);
  },

  async removeItem(user_id, product_id) {
    const cart = await this.getOrCreateCart(user_id);
    cart.items = cart.items.filter(i => String(i.product_id) !== String(product_id));
    await cart.save();
    return this.getCartWithItems(user_id);
  },

  async updateItemQuantity(user_id, product_id, quantity) {
    const cart = await this.getOrCreateCart(user_id);
    if (quantity <= 0) {
      cart.items = cart.items.filter(i => String(i.product_id) !== String(product_id));
    } else {
      const item = cart.items.find(i => String(i.product_id) === String(product_id));
      if (item) item.quantity = quantity;
    }
    await cart.save();
    return this.getCartWithItems(user_id);
  },

  async clearCart(user_id) {
    const cart = await this.getOrCreateCart(user_id);
    cart.items = [];
    cart.status = 'checked_out';
    await cart.save();
    return { message: 'Cart cleared and checked out' };
  }
};

module.exports = Cart;
