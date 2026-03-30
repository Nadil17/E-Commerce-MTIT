const db = require('../config/db');
const bcrypt = require('bcryptjs');

const User = {
  async getAll() {
    const [rows] = await db.query('SELECT id, name, email, phone, address, role, created_at FROM users');
    return rows;
  },

  async getById(id) {
    const [rows] = await db.query(
      'SELECT id, name, email, phone, address, role, created_at FROM users WHERE id = ?', [id]
    );
    return rows[0];
  },

  async getByEmail(email) {
    const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    return rows[0];
  },

  async create({ name, email, password, phone, address }) {
    const hashed = await bcrypt.hash(password, 10);
    const [result] = await db.query(
      'INSERT INTO users (name, email, password, phone, address) VALUES (?, ?, ?, ?, ?)',
      [name, email, hashed, phone, address]
    );
    return { id: result.insertId, name, email, phone, address, role: 'customer' };
  },

  async update(id, { name, phone, address }) {
    await db.query('UPDATE users SET name=?, phone=?, address=? WHERE id=?', [name, phone, address, id]);
    return this.getById(id);
  },

  async delete(id) {
    await db.query('DELETE FROM users WHERE id = ?', [id]);
    return { message: 'User deleted successfully' };
  }
};

module.exports = User;
