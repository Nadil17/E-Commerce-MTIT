const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  description: { type: String, default: '' },
  category: { type: String, default: '' },
  image_url: { type: String, default: '' },
  stock: { type: Number, default: 0 }
}, { timestamps: true });

const ProductModel = mongoose.model('Product', productSchema);

const mapDoc = (doc) => {
  if (!doc) return doc;
  const obj = doc.toObject ? doc.toObject() : { ...doc };
  obj.id = obj._id.toString();
  return obj;
};

const Product = {
  async getAll() {
    const products = await ProductModel.find().lean();
    return products.map(p => ({ ...p, id: p._id.toString() }));
  },

  async getById(id) {
    if (!mongoose.isValidObjectId(id)) return null;
    const product = await ProductModel.findById(id);
    return product ? mapDoc(product) : null;
  },

  async create({ name, price, description, category, image_url, stock }) {
    const product = await ProductModel.create({
      name, price, description, category, image_url, stock
    });
    return mapDoc(product);
  },

  async update(id, { name, price, description, category, image_url, stock }) {
    if (!mongoose.isValidObjectId(id)) return null;
    const product = await ProductModel.findByIdAndUpdate(
      id,
      { name, price, description, category, image_url, stock },
      { new: true }
    );
    return product ? mapDoc(product) : null;
  },

  async delete(id) {
    if (!mongoose.isValidObjectId(id)) return null;
    const product = await ProductModel.findByIdAndDelete(id);
    if (!product) return null;
    return { message: 'Product deleted successfully' };
  }
};

module.exports = Product;
