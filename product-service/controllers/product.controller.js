const Product = require('../models/product.model');

const productController = {
  async getAll(req, res) {
    try {
      const products = await Product.getAll();
      res.json({ success: true, data: products });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  async getById(req, res) {
    try {
      const product = await Product.getById(req.params.id);
      if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
      res.json({ success: true, data: product });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  async create(req, res) {
    try {
      const { name, price, description, category, image_url, stock } = req.body;
      if (!name || !price) {
        return res.status(400).json({ success: false, message: 'Name and price are required' });
      }
      const product = await Product.create({ name, price, description, category, image_url, stock: stock || 0 });
      res.status(201).json({ success: true, data: product });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  async update(req, res) {
    try {
      const product = await Product.getById(req.params.id);
      if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
      const updated = await Product.update(req.params.id, req.body);
      res.json({ success: true, data: updated });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  async delete(req, res) {
    try {
      const product = await Product.getById(req.params.id);
      if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
      const result = await Product.delete(req.params.id);
      res.json({ success: true, data: result });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
};

module.exports = productController;
