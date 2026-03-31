const db = require('../config/db');

const Order = {
  async getAll() {
    const [orders] = await db.query('SELECT * FROM orders ORDER BY created_at DESC');
    return orders;
  },

  async getById(id) {
    const [orders] = await db.query('SELECT * FROM orders WHERE id = ?', [id]);
    if (!orders[0]) return null;
    const [items] = await db.query('SELECT * FROM order_items WHERE order_id = ?', [id]);
    return { ...orders[0], items };
  },

  async getByOrderNumber(order_number) {
    const [orders] = await db.query('SELECT * FROM orders WHERE order_number = ?', [order_number]);
    if (!orders[0]) return null;
    const [items] = await db.query('SELECT * FROM order_items WHERE order_id = ?', [orders[0].id]);
    return { ...orders[0], items };
  },

  async getByUserId(user_id) {
    const [orders] = await db.query(
      'SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC', [user_id]
    );
    for (let order of orders) {
      const [items] = await db.query('SELECT * FROM order_items WHERE order_id = ?', [order.id]);
      order.items = items;
    }
    return orders;
  },

  async create({ order_number, user_id, items, total_amount, payment_method, shipping_address, notes }) {
    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();
      const [result] = await conn.query(
        `INSERT INTO orders (order_number, user_id, total_amount, payment_method, shipping_address, notes)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [order_number, user_id, total_amount, payment_method, shipping_address, notes]
      );
      const orderId = result.insertId;
      for (const item of items) {
        await conn.query(
          `INSERT INTO order_items (order_id, product_id, product_name, unit_price, quantity, subtotal)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [orderId, item.product_id, item.product_name, item.unit_price || item.product_price,
           item.quantity, (item.unit_price || item.product_price) * item.quantity]
        );
      }
      await conn.commit();
      return this.getById(orderId);
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  },

  async updateStatus(id, status) {
    await db.query('UPDATE orders SET status = ? WHERE id = ?', [status, id]);
    return this.getById(id);
  },

  async updatePayment(id, { payment_status, transaction_id }) {
    await db.query(
      'UPDATE orders SET payment_status = ?, transaction_id = ? WHERE id = ?',
      [payment_status, transaction_id, id]
    );
    return this.getById(id);
  }
};

module.exports = Order;
