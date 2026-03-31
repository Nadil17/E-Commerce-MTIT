const db = require('../config/db');

const Inventory = {
  async getAll() {
    const [rows] = await db.query('SELECT * FROM inventory');
    return rows;
  },

  async getByProductId(product_id) {
    const [rows] = await db.query('SELECT * FROM inventory WHERE product_id = ?', [product_id]);
    return rows[0];
  },

  async updateById(id, quantity, reorder_level) {
    if (quantity !== undefined) {
      await db.query('UPDATE inventory SET quantity = ? WHERE id = ?', [quantity, id]);
    }
    if (reorder_level !== undefined) {
      await db.query('UPDATE inventory SET reorder_level = ? WHERE id = ?', [reorder_level, id]);
    }
    const [rows] = await db.query('SELECT * FROM inventory WHERE id = ?', [id]);
    return rows[0] || null;
  },

  async deleteById(id) {
    const [rows] = await db.query('SELECT * FROM inventory WHERE id = ?', [id]);
    const item = rows[0];
    if (item) {
      await db.query('DELETE FROM inventory WHERE id = ?', [id]);
    }
    return item || null;
  },

  async createOrUpdate(product_id, product_name, quantity, reorder_level = 5) {
    const existing = await this.getByProductId(product_id);
    if (existing) {
      await db.query(
        'UPDATE inventory SET quantity = quantity + ?, product_name = ? WHERE product_id = ?',
        [quantity, product_name, product_id]
      );
    } else {
      await db.query(
        'INSERT INTO inventory (product_id, product_name, quantity, reorder_level) VALUES (?, ?, ?, ?)',
        [product_id, product_name, quantity, reorder_level]
      );
    }
    await db.query(
      'INSERT INTO inventory_logs (product_id, action, quantity) VALUES (?, "restock", ?)',
      [product_id, quantity]
    );
    return this.getByProductId(product_id);
  },

  async deductStock(product_id, quantity, reference) {
    const item = await this.getByProductId(product_id);
    if (!item) throw new Error(`Product ${product_id} not found in inventory`);
    const available = item.quantity - item.reserved;
    if (available < quantity) {
      throw new Error(`Insufficient stock. Available: ${available}, Requested: ${quantity}`);
    }
    await db.query(
      'UPDATE inventory SET quantity = quantity - ? WHERE product_id = ?',
      [quantity, product_id]
    );
    await db.query(
      'INSERT INTO inventory_logs (product_id, action, quantity, reference) VALUES (?, "deduct", ?, ?)',
      [product_id, quantity, reference]
    );
    return this.getByProductId(product_id);
  },

  async checkStock(product_id, quantity) {
    const item = await this.getByProductId(product_id);
    if (!item) return { available: false, message: 'Product not found in inventory' };
    const available = item.quantity - item.reserved;
    return {
      available: available >= quantity,
      stock: item.quantity,
      reserved: item.reserved,
      requested: quantity,
      message: available >= quantity ? 'In stock' : 'Insufficient stock'
    };
  },

  async getLogs(product_id) {
    const [rows] = await db.query(
      'SELECT * FROM inventory_logs WHERE product_id = ? ORDER BY created_at DESC LIMIT 50',
      [product_id]
    );
    return rows;
  }
};

module.exports = Inventory;
