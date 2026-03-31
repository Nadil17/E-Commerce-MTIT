const db = require('../config/db');

const Cart = {
  async getOrCreateCart(user_id) {
    let [rows] = await db.query(
      "SELECT * FROM carts WHERE user_id = ? AND status = 'active'", [user_id]
    );
    if (rows.length === 0) {
      const [result] = await db.query('INSERT INTO carts (user_id) VALUES (?)', [user_id]);
      return { id: result.insertId, user_id, status: 'active' };
    }
    return rows[0];
  },

  async getCartWithItems(user_id) {
    const cart = await this.getOrCreateCart(user_id);
    const [items] = await db.query(
      'SELECT * FROM cart_items WHERE cart_id = ?', [cart.id]
    );
    const total = items.reduce((sum, item) => sum + (item.product_price * item.quantity), 0);
    return { ...cart, items, total: parseFloat(total.toFixed(2)) };
  },

  async addItem(user_id, { product_id, product_name, product_price, quantity = 1 }) {
    const cart = await this.getOrCreateCart(user_id);
    const [existing] = await db.query(
      'SELECT * FROM cart_items WHERE cart_id = ? AND product_id = ?',
      [cart.id, product_id]
    );
    if (existing.length > 0) {
      await db.query(
        'UPDATE cart_items SET quantity = quantity + ? WHERE cart_id = ? AND product_id = ?',
        [quantity, cart.id, product_id]
      );
    } else {
      await db.query(
        'INSERT INTO cart_items (cart_id, product_id, product_name, product_price, quantity) VALUES (?, ?, ?, ?, ?)',
        [cart.id, product_id, product_name, product_price, quantity]
      );
    }
    return this.getCartWithItems(user_id);
  },

  async removeItem(user_id, product_id) {
    const cart = await this.getOrCreateCart(user_id);
    await db.query('DELETE FROM cart_items WHERE cart_id = ? AND product_id = ?', [cart.id, product_id]);
    return this.getCartWithItems(user_id);
  },

  async updateItemQuantity(user_id, product_id, quantity) {
    const cart = await this.getOrCreateCart(user_id);
    if (quantity <= 0) {
      await db.query('DELETE FROM cart_items WHERE cart_id = ? AND product_id = ?', [cart.id, product_id]);
    } else {
      await db.query(
        'UPDATE cart_items SET quantity = ? WHERE cart_id = ? AND product_id = ?',
        [quantity, cart.id, product_id]
      );
    }
    return this.getCartWithItems(user_id);
  },

  async clearCart(user_id) {
    const cart = await this.getOrCreateCart(user_id);
    await db.query('DELETE FROM cart_items WHERE cart_id = ?', [cart.id]);
    await db.query("UPDATE carts SET status = 'checked_out' WHERE id = ?", [cart.id]);
    return { message: 'Cart cleared and checked out' };
  }
};

module.exports = Cart;
