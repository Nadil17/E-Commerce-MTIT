const Product = require('../models/product.model');
const axios = require('axios');

const INVENTORY_URL = process.env.INVENTORY_SERVICE_URL || 'http://localhost:3004';

const shouldSyncInventory = (req) => req.headers['x-source-service'] !== 'inventory-service';

const syncInventoryStock = async ({ product_id, product_name, quantity }) => {
  await axios.post(
    `${INVENTORY_URL}/api/inventory/sync`,
    { product_id, product_name, quantity },
    { headers: { 'x-source-service': 'product-service' } }
  );
};

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

      if (shouldSyncInventory(req)) {
        await syncInventoryStock({
          product_id: product.id,
          product_name: product.name,
          quantity: Number(product.stock || 0)
        });
      }

      res.status(201).json({ success: true, data: product });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  async update(req, res) {
    try {
      const product = await Product.getById(req.params.id);
      if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

      const hasUpdatableField = ['name', 'price', 'description', 'category', 'image_url', 'stock']
        .some((key) => req.body[key] !== undefined);

      if (!hasUpdatableField) {
        return res.status(400).json({
          success: false,
          message: 'Provide at least one field to update: name, price, description, category, image_url, stock'
        });
      }

      const updated = await Product.update(req.params.id, req.body);

      if (shouldSyncInventory(req) && (req.body.stock !== undefined || req.body.name !== undefined)) {
        await syncInventoryStock({
          product_id: updated.id,
          product_name: updated.name,
          quantity: Number(updated.stock || 0)
        });
      }

      res.json({ success: true, data: updated });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  async delete(req, res) {
    try {
      const product = await Product.getById(req.params.id);
      if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

      if (shouldSyncInventory(req)) {
        await syncInventoryStock({
          product_id: product.id,
          product_name: product.name,
          quantity: 0
        });
      }

      const result = await Product.delete(req.params.id);
      res.json({ success: true, data: result });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
};

module.exports = productController;
