const Cart = require('../models/cart.model');
const axios = require('axios');

const cartController = {
  async getCart(req, res) {
    try {
      const cart = await Cart.getCartWithItems(req.params.userId);
      res.json({ success: true, data: cart });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  async addItem(req, res) {
    try {
      const { userId } = req.params;
      const { product_id, quantity } = req.body;
      if (!product_id) {
        return res.status(400).json({ success: false, message: 'product_id is required' });
      }
      const qty = quantity === undefined ? 1 : quantity;
      if (!Number.isInteger(qty) || qty < 1) {
        return res.status(400).json({ success: false, message: 'quantity must be a positive integer' });
      }
      // Fetch product details from product service
      let product_name = req.body.product_name;
      let product_price = req.body.product_price;
      try {
        const response = await axios.get(`${process.env.PRODUCT_SERVICE_URL}/api/products/${product_id}`);
        product_name = response.data.data.name;
        product_price = response.data.data.price;
      } catch (e) {
        if (!product_name || !product_price) {
          return res.status(400).json({ success: false, message: 'product_name and product_price required (product-service unavailable)' });
        }
      }
      const cart = await Cart.addItem(userId, { product_id, product_name, product_price, quantity: qty });
      res.json({ success: true, data: cart });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  async removeItem(req, res) {
    try {
      const cart = await Cart.removeItem(req.params.userId, req.params.productId);
      res.json({ success: true, data: cart });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  async updateQuantity(req, res) {
    try {
      const { quantity } = req.body;
      if (!Number.isInteger(quantity) || quantity < 1) {
        return res.status(400).json({ success: false, message: 'quantity must be a positive integer' });
      }
      const cart = await Cart.updateItemQuantity(req.params.userId, req.params.productId, quantity);
      res.json({ success: true, data: cart });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  async clearCart(req, res) {
    try {
      const result = await Cart.clearCart(req.params.userId);
      res.json({ success: true, data: result });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
};

module.exports = cartController;
