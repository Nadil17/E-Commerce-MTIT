const db = require('../config/db');

const Comment = {
  async getAll() {
    const [rows] = await db.query('SELECT * FROM comments ORDER BY created_at DESC');
    return rows;
  },

  async getByProductId(product_id) {
    const [rows] = await db.query(
      'SELECT * FROM comments WHERE product_id = ? ORDER BY created_at DESC', [product_id]
    );
    return rows;
  },

  async getById(id) {
    const [rows] = await db.query('SELECT * FROM comments WHERE id = ?', [id]);
    return rows[0];
  },

  async getAverageRating(product_id) {
    const [rows] = await db.query(
      'SELECT AVG(rating) as avg_rating, COUNT(*) as total_ratings FROM comments WHERE product_id = ? AND rating IS NOT NULL',
      [product_id]
    );
    return rows[0] || { avg_rating: null, total_ratings: 0 };
  },

  async create({ product_id, user_id, user_name, rating, comment }) {
    const [result] = await db.query(
      'INSERT INTO comments (product_id, user_id, user_name, rating, comment) VALUES (?, ?, ?, ?, ?)',
      [product_id, user_id, user_name, rating, comment]
    );
    return this.getById(result.insertId);
  },

  async update(id, { rating, comment }) {
    await db.query(
      'UPDATE comments SET rating = ?, comment = ? WHERE id = ?',
      [rating, comment, id]
    );
    return this.getById(id);
  },

  async delete(id) {
    await db.query('DELETE FROM comments WHERE id = ?', [id]);
    return { message: 'Comment deleted' };
  },

  async markHelpful(id) {
    await db.query('UPDATE comments SET helpful_count = helpful_count + 1 WHERE id = ?', [id]);
    return this.getById(id);
  }
};

module.exports = Comment;
