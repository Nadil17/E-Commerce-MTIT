const db = require('../config/db');

const Product = {
  async getAll() {
    const [rows] = await db.query('SELECT * FROM products');
    return rows;
  },

  async getById(id) {
    const [rows] = await db.query('SELECT * FROM products WHERE id = ?', [id]);
    return rows[0];
  },

  async create({ name, price, description, category, image_url, stock }) {
    const [result] = await db.query(
      'INSERT INTO products (name, price, description, category, image_url, stock) VALUES (?, ?, ?, ?, ?, ?)',
      [name, price, description, category, image_url, stock]
    );
    return { id: result.insertId, name, price, description, category, image_url, stock };
  },

  async update(id, payload) {
    const allowedFields = ['name', 'price', 'description', 'category', 'image_url', 'stock'];
    const fields = [];
    const values = [];

    allowedFields.forEach((key) => {
      if (payload[key] !== undefined) {
        fields.push(`${key} = ?`);
        values.push(payload[key]);
      }
    });

    if (fields.length === 0) {
      return this.getById(id);
    }

    values.push(id);
    await db.query(`UPDATE products SET ${fields.join(', ')} WHERE id = ?`, values);
    return this.getById(id);
  },

  async delete(id) {
    await db.query('DELETE FROM products WHERE id = ?', [id]);
    return { message: 'Product deleted successfully' };
  }
};

module.exports = Product;
