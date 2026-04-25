const Inventory = require('../models/inventory.model');
const axios = require('axios');

const PRODUCT_URL = process.env.PRODUCT_SERVICE_URL || 'http://localhost:3001';

const syncProductStock = async (productId, stock) => {
  try {
    await axios.put(`${PRODUCT_URL}/api/products/${productId}`, { stock });
  } catch (err) {
    console.warn(`Stock sync failed for product ${productId}: ${err.message}`);
  }
};

const shouldSyncProduct = (req) => req.headers['x-source-service'] !== 'product-service';

const inventoryController = {
  async getAll(req, res) {
    try {
      const items = await Inventory.getAll();
      res.json({ success: true, data: items });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  async getByProductId(req, res) {
    try {
      const item = await Inventory.getByProductId(req.params.productId);
      if (!item) return res.status(404).json({ success: false, message: 'Product not found in inventory' });
      res.json({ success: true, data: item });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  async create(req, res) {
    try {
      const { product_id, product_name, quantity, reorder_level } = req.body;
      if (!product_id || !quantity) {
        return res.status(400).json({ success: false, message: 'product_id and quantity are required' });
      }
      const item = await Inventory.createOrUpdate(product_id, product_name || `Product #${product_id}`, quantity, reorder_level ?? 5);
      if (shouldSyncProduct(req)) await syncProductStock(item.product_id, item.quantity);
      res.status(201).json({ success: true, data: item });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  async update(req, res) {
    try {
      const { quantity, reorder_level } = req.body;
      const item = await Inventory.updateById(req.params.id, quantity, reorder_level);
      if (!item) return res.status(404).json({ success: false, message: 'Inventory not found' });
      if (shouldSyncProduct(req)) await syncProductStock(item.product_id, item.quantity);
      res.json({ success: true, data: item });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  async delete(req, res) {
    try {
      const result = await Inventory.deleteById(req.params.id);
      if (!result) return res.status(404).json({ success: false, message: 'Inventory not found' });
      if (shouldSyncProduct(req)) await syncProductStock(result.product_id, 0);
      res.json({ success: true, data: { message: 'Inventory deleted' } });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  async restock(req, res) {
    try {
      const { product_id, product_name, quantity, reorder_level } = req.body;
      if (!product_id || !quantity) {
        return res.status(400).json({ success: false, message: 'product_id and quantity required' });
      }
      const item = await Inventory.createOrUpdate(product_id, product_name || 'Unknown', quantity, reorder_level);
      if (shouldSyncProduct(req)) await syncProductStock(item.product_id, item.quantity);
      res.json({ success: true, data: item });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  async deductStock(req, res) {
    try {
      const { product_id, quantity, reference } = req.body;
      const item = await Inventory.deductStock(product_id, quantity, reference);
      if (shouldSyncProduct(req)) await syncProductStock(item.product_id, item.quantity);
      res.json({ success: true, data: item });
    } catch (err) {
      res.status(400).json({ success: false, message: err.message });
    }
  },

  async syncStock(req, res) {
    try {
      const { product_id, product_name, quantity, reorder_level } = req.body;
      if (product_id === undefined || quantity === undefined) {
        return res.status(400).json({ success: false, message: 'product_id and quantity are required' });
      }

      const item = await Inventory.upsertExact(
        Number(product_id),
        product_name,
        Number(quantity),
        reorder_level
      );

      if (shouldSyncProduct(req)) await syncProductStock(item.product_id, item.quantity);
      res.json({ success: true, data: item });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  async checkStock(req, res) {
    try {
      const result = await Inventory.checkStock(req.params.productId, parseInt(req.query.quantity) || 1);
      res.json({ success: true, data: result });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  async getLogs(req, res) {
    try {
      const logs = await Inventory.getLogs(req.params.productId);
      res.json({ success: true, data: logs });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
};

module.exports = inventoryController;
