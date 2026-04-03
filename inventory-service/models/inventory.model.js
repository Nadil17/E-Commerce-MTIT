const mongoose = require('mongoose');

const inventorySchema = new mongoose.Schema({
  product_id: { type: String, required: true, unique: true },
  product_name: { type: String, default: 'Unknown' },
  quantity: { type: Number, required: true, default: 0 },
  reorder_level: { type: Number, default: 5 },
  reserved: { type: Number, default: 0 }
});

const InventoryModel = mongoose.model('Inventory', inventorySchema);

const inventoryLogSchema = new mongoose.Schema({
  product_id: { type: String, required: true },
  action: { type: String, required: true },
  quantity: { type: Number, required: true },
  reference: { type: String },
  created_at: { type: Date, default: Date.now }
});

const InventoryLogModel = mongoose.model('InventoryLog', inventoryLogSchema);

const mapId = (doc) => {
  if (!doc) return doc;
  doc.id = doc._id.toString();
  return doc;
};

const InventoryService = {
  async getAll() {
    const items = await InventoryModel.find().lean();
    return items.map(mapId);
  },

  async getByProductId(product_id) {
    const item = await InventoryModel.findOne({ product_id }).lean();
    return mapId(item);
  },

  async updateByProductId(product_id, quantity, reorder_level) {
    const updateData = {};
    if (quantity !== undefined) updateData.quantity = quantity;
    if (reorder_level !== undefined) updateData.reorder_level = reorder_level;
    
    const item = await InventoryModel.findOneAndUpdate({ product_id }, updateData, { new: true }).lean();
    return mapId(item);
  },

  async deleteByProductId(product_id) {
    const item = await InventoryModel.findOneAndDelete({ product_id }).lean();
    return mapId(item);
  },

  async createOrUpdate(product_id, product_name, quantity, reorder_level = 5) {
    const existing = await InventoryModel.findOne({ product_id });
    if (existing) {
      existing.quantity += quantity;
      existing.product_name = product_name || existing.product_name;
      await existing.save();
    } else {
      await InventoryModel.create({
        product_id,
        product_name,
        quantity,
        reorder_level
      });
    }

    await InventoryLogModel.create({
      product_id,
      action: 'restock',
      quantity
    });

    return await this.getByProductId(product_id);
  },

  async deductStock(product_id, quantity, reference) {
    const item = await InventoryModel.findOne({ product_id });
    if (!item) throw new Error(`Product ${product_id} not found in inventory`);
    
    const available = item.quantity - item.reserved;
    if (available < quantity) {
      throw new Error(`Insufficient stock. Available: ${available}, Requested: ${quantity}`);
    }

    item.quantity -= quantity;
    await item.save();

    await InventoryLogModel.create({
      product_id,
      action: 'deduct',
      quantity,
      reference
    });

    return await this.getByProductId(product_id);
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
    const items = await InventoryLogModel.find({ product_id })
      .sort({ created_at: -1 })
      .limit(50)
      .lean();
    return items.map(mapId);
  }
};

module.exports = InventoryService;
