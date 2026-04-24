const Comment = require('../models/comment.model');

const commentController = {
  async getAll(req, res) {
    try {
      const comments = await Comment.getAll();
      res.json({ success: true, data: comments });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  async getByProductId(req, res) {
    try {
      const comments = await Comment.getByProductId(req.params.productId);
      const stats = await Comment.getAverageRating(req.params.productId);
      res.json({ success: true, data: { comments, stats } });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  async getById(req, res) {
    try {
      const comment = await Comment.getById(req.params.id);
      if (!comment) return res.status(404).json({ success: false, message: 'Comment not found' });
      res.json({ success: true, data: comment });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  async create(req, res) {
    try {
      const { product_id, user_id, user_name, rating, comment } = req.body;
      if (!product_id || !user_id || !rating) {
        return res.status(400).json({ success: false, message: 'product_id, user_id, and rating are required' });
      }
      if (typeof rating !== 'number' || rating < 1 || rating > 5) {
        return res.status(400).json({ success: false, message: 'rating must be a number between 1 and 5' });
      }
      const result = await Comment.create({ product_id, user_id, user_name, rating, comment });
      res.status(201).json({ success: true, data: result });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  async update(req, res) {
    try {
      const { rating, comment } = req.body;
      if (rating !== undefined && (typeof rating !== 'number' || rating < 1 || rating > 5)) {
        return res.status(400).json({ success: false, message: 'rating must be a number between 1 and 5' });
      }
      const result = await Comment.update(req.params.id, { rating, comment });
      if (!result) return res.status(404).json({ success: false, message: 'Comment not found' });
      res.json({ success: true, data: result });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  async delete(req, res) {
    try {
      const comment = await Comment.getById(req.params.id);
      if (!comment) return res.status(404).json({ success: false, message: 'Comment not found' });
      await Comment.delete(req.params.id);
      res.json({ success: true, data: { message: 'Comment deleted' } });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  async markHelpful(req, res) {
    try {
      const result = await Comment.markHelpful(req.params.id);
      if (!result) return res.status(404).json({ success: false, message: 'Comment not found' });
      res.json({ success: true, data: result });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
};

module.exports = commentController;
