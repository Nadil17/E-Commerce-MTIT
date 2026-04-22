const Order = require('../models/order.model');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

const CART_URL = process.env.CART_SERVICE_URL;
const INVENTORY_URL = process.env.INVENTORY_SERVICE_URL;
const PAYMENT_URL = process.env.PAYMENT_SERVICE_URL;

const orderController = {
  async getAll(req, res) {
    try {
      const orders = await Order.getAll();
      res.json({ success: true, data: orders });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  async getById(req, res) {
    try {
      const order = await Order.getById(req.params.id);
      if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
      res.json({ success: true, data: order });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  async getByUser(req, res) {
    try {
      const orders = await Order.getByUserId(req.params.userId);
      res.json({ success: true, data: orders });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  // ─── Main checkout flow ────────────────────────────────────────────────────
  async createOrder(req, res) {
    const { user_id, payment_method = 'credit_card', shipping_address, notes, items: directItems } = req.body;

    if (!user_id) {
      return res.status(400).json({ success: false, message: 'user_id is required' });
    }

    try {
      // ── Step 1: Get cart items (or accept direct items) ──
      let orderItems = [];

      if (directItems && directItems.length > 0) {
        orderItems = directItems;
      } else {
        try {
          const cartRes = await axios.get(`${CART_URL}/api/cart/${user_id}`);
          const cart = cartRes.data.data;
          if (!cart.items || cart.items.length === 0) {
            return res.status(400).json({ success: false, message: 'Cart is empty' });
          }
          orderItems = cart.items.map(i => ({
            product_id: i.product_id,
            product_name: i.product_name,
            unit_price: i.product_price,
            quantity: i.quantity
          }));
        } catch (e) {
          return res.status(503).json({ success: false, message: 'Cart service unavailable', error: e.message });
        }
      }

      const total_amount = orderItems.reduce(
        (sum, item) => sum + ((item.unit_price || item.product_price) * item.quantity), 0
      );

      // ── Step 2: Check & deduct inventory ──
      const inventoryErrors = [];
      for (const item of orderItems) {
        try {
          const stockRes = await axios.get(
            `${INVENTORY_URL}/api/inventory/${item.product_id}/check?quantity=${item.quantity}`
          );
          if (!stockRes.data.data.available) {
            inventoryErrors.push(`${item.product_name}: ${stockRes.data.data.message}`);
          }
        } catch (e) {
          // If inventory service down, proceed with warning
          console.warn(`Inventory check failed for product ${item.product_id}: ${e.message}`);
        }
      }

      if (inventoryErrors.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Stock unavailable for some items',
          errors: inventoryErrors
        });
      }

      // ── Step 3: Create the order record ──
      const order_number = `ORD-${Date.now()}-${uuidv4().slice(0, 6).toUpperCase()}`;
      const order = await Order.create({
        order_number,
        user_id,
        items: orderItems,
        total_amount: parseFloat(total_amount.toFixed(2)),
        payment_method,
        shipping_address,
        notes
      });

      // ── Step 4: Process payment ──
      let paymentResult = null;
      try {
        const payRes = await axios.post(`${PAYMENT_URL}/api/payments/process`, {
          order_id: order.order_number,
          user_id,
          amount: total_amount,
          method: payment_method
        });
        paymentResult = payRes.data.data;
      } catch (e) {
        // Payment service down — mark as unpaid
        await Order.updateStatus(order.id, 'pending');
        return res.status(503).json({
          success: false,
          message: 'Payment service unavailable',
          order
        });
      }

      // ── Step 5: Update order with payment result ──
      if (paymentResult.status === 'success') {
        await Order.updatePayment(order.id, {
          payment_status: 'paid',
          transaction_id: paymentResult.transaction_id
        });
        await Order.updateStatus(order.id, 'confirmed');

        // Deduct inventory
        for (const item of orderItems) {
          try {
            await axios.post(`${INVENTORY_URL}/api/inventory/deduct`, {
              product_id: item.product_id,
              quantity: item.quantity,
              reference: order.order_number
            });
          } catch (e) {
            console.warn(`Inventory deduct failed for product ${item.product_id}`);
          }
        }

        // Clear cart
        try {
          await axios.delete(`${CART_URL}/api/cart/${user_id}/clear`);
        } catch (e) {
          console.warn('Could not clear cart after order');
        }
      } else {
        await Order.updatePayment(order.id, {
          payment_status: 'failed',
          transaction_id: paymentResult.transaction_id
        });
        await Order.updateStatus(order.id, 'cancelled');
      }

      const finalOrder = await Order.getById(order.id);
      res.status(201).json({
        success: paymentResult.status === 'success',
        data: { order: finalOrder, payment: paymentResult }
      });

    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  async updateStatus(req, res) {
    try {
      const { status } = req.body;
      const validStatuses = ['pending','confirmed','processing','shipped','delivered','cancelled','refunded'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ success: false, message: `Invalid status. Use: ${validStatuses.join(', ')}` });
      }
      const order = await Order.getById(req.params.id);
      if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
      const updated = await Order.updateStatus(req.params.id, status);
      res.json({ success: true, data: updated });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
};

module.exports = orderController;
