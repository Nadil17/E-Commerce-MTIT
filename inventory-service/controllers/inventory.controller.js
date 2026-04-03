const Inventory = require('../models/inventory.model');

function normalizeError(err) {
  return {
    message: err?.message || err?.sqlMessage || err?.code || 'Internal server error',
    error: err?.code || null
  };
}

function sendError(res, statusCode, err) {
  const payload = normalizeError(err);
  return res.status(statusCode).json({ success: false, ...payload });
}

const inventoryController = {
  async getAll(req, res) {
    try {
      const items = await Inventory.getAll();
      res.json({ success: true, data: items });
    } catch (err) {
      return sendError(res, 500, err);
    }
  },

  async getByProductId(req, res) {
    try {
      const item = await Inventory.getByProductId(req.params.productId);
      if (!item) return res.status(404).json({ success: false, message: 'Product not found in inventory' });
      res.json({ success: true, data: item });
    } catch (err) {
      return sendError(res, 500, err);
    }
  },

  async create(req, res) {
    try {
      const { product_id, quantity, reorder_level } = req.body;
      if (product_id === undefined || quantity === undefined) {
        return res.status(400).json({ success: false, message: 'product_id and quantity are required' });
      }
      const item = await Inventory.createOrUpdate(product_id, 'Product', quantity, reorder_level || 10);
      res.status(201).json({ success: true, data: item });
    } catch (err) {
      return sendError(res, 500, err);
    }
  },

  async update(req, res) {
    try {
      const { quantity, reorder_level } = req.body;
      const item = await Inventory.updateByProductId(req.params.id, quantity, reorder_level);
      if (!item) return res.status(404).json({ success: false, message: 'Inventory not found' });
      res.json({ success: true, data: item });
    } catch (err) {
      return sendError(res, 500, err);
    }
  },

  async delete(req, res) {
    try {
      const result = await Inventory.deleteByProductId(req.params.id);
      if (!result) return res.status(404).json({ success: false, message: 'Inventory not found' });
      res.json({ success: true, data: { message: 'Inventory deleted' } });
    } catch (err) {
      return sendError(res, 500, err);
    }
  },

  async restock(req, res) {
    try {
      const { product_id, product_name, quantity, reorder_level } = req.body;
      if (product_id === undefined || quantity === undefined) {
        return res.status(400).json({ success: false, message: 'product_id and quantity required' });
      }
      const item = await Inventory.createOrUpdate(product_id, product_name || 'Unknown', quantity, reorder_level);
      res.json({ success: true, data: item });
    } catch (err) {
      return sendError(res, 500, err);
    }
  },

  async deductStock(req, res) {
    try {
      const { product_id, quantity, reference } = req.body;
      const item = await Inventory.deductStock(product_id, quantity, reference);
      res.json({ success: true, data: item });
    } catch (err) {
      return sendError(res, 400, err);
    }
  },

  async checkStock(req, res) {
    try {
      const result = await Inventory.checkStock(req.params.productId, parseInt(req.query.quantity) || 1);
      res.json({ success: true, data: result });
    } catch (err) {
      return sendError(res, 500, err);
    }
  },

  async getLogs(req, res) {
    try {
      const logs = await Inventory.getLogs(req.params.productId);
      res.json({ success: true, data: logs });
    } catch (err) {
      return sendError(res, 500, err);
    }
  }
};

module.exports = inventoryController;
