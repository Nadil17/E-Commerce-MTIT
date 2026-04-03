const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  product_id: { type: String, required: true },
  user_id: { type: String, required: true },
  user_name: { type: String, default: 'Anonymous' },
  rating: { type: Number, min: 1, max: 5, default: null },
  comment: { type: String, default: '' },
  helpful_count: { type: Number, default: 0 }
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

const CommentModel = mongoose.model('Comment', commentSchema);

const mapDoc = (doc) => {
  if (!doc) return null;
  const obj = doc.toObject ? doc.toObject() : { ...doc };
  obj.id = obj._id.toString();
  return obj;
};

const Comment = {
  async getAll() {
    const docs = await CommentModel.find().sort({ created_at: -1 }).lean();
    return docs.map(d => ({ ...d, id: d._id.toString() }));
  },

  async getByProductId(product_id) {
    const docs = await CommentModel.find({ product_id }).sort({ created_at: -1 }).lean();
    return docs.map(d => ({ ...d, id: d._id.toString() }));
  },

  async getById(id) {
    if (!mongoose.isValidObjectId(id)) return null;
    const doc = await CommentModel.findById(id);
    return mapDoc(doc);
  },

  async getAverageRating(product_id) {
    const result = await CommentModel.aggregate([
      { $match: { product_id: String(product_id), rating: { $ne: null } } },
      { $group: { _id: null, avg_rating: { $avg: '$rating' }, total_ratings: { $sum: 1 } } }
    ]);
    if (!result.length) return { avg_rating: null, total_ratings: 0 };
    return {
      avg_rating: parseFloat(result[0].avg_rating.toFixed(2)),
      total_ratings: result[0].total_ratings
    };
  },

  async create({ product_id, user_id, user_name, rating, comment }) {
    const doc = await CommentModel.create({
      product_id, user_id, user_name, rating, comment
    });
    return mapDoc(doc);
  },

  async update(id, { rating, comment }) {
    if (!mongoose.isValidObjectId(id)) return null;
    const doc = await CommentModel.findByIdAndUpdate(
      id,
      { rating, comment },
      { new: true }
    );
    return mapDoc(doc);
  },

  async delete(id) {
    if (!mongoose.isValidObjectId(id)) return null;
    await CommentModel.findByIdAndDelete(id);
    return { message: 'Comment deleted' };
  },

  async markHelpful(id) {
    if (!mongoose.isValidObjectId(id)) return null;
    const doc = await CommentModel.findByIdAndUpdate(
      id,
      { $inc: { helpful_count: 1 } },
      { new: true }
    );
    return mapDoc(doc);
  }
};

module.exports = Comment;
