const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  phone: { type: String, default: '' },
  address: { type: String, default: '' },
  role: { type: String, default: 'customer' }
}, { timestamps: true });

const UserModel = mongoose.model('User', userSchema);

const mapDoc = (doc) => {
  if (!doc) return null;
  const obj = doc.toObject ? doc.toObject() : { ...doc };
  obj.id = obj._id.toString();
  delete obj.password; // never expose password
  return obj;
};

const User = {
  async getAll() {
    const users = await UserModel.find().lean();
    return users.map(u => {
      const { password, ...rest } = u;
      return { ...rest, id: u._id.toString() };
    });
  },

  async getById(id) {
    if (!mongoose.isValidObjectId(id)) return null;
    const user = await UserModel.findById(id);
    return user ? mapDoc(user) : null;
  },

  async getByEmail(email) {
    // Returns full doc including password (needed for login comparison)
    return await UserModel.findOne({ email: email.toLowerCase() });
  },

  async create({ name, email, password, phone, address }) {
    const hashed = await bcrypt.hash(password, 10);
    const user = await UserModel.create({
      name, email, password: hashed, phone, address
    });
    return mapDoc(user);
  },

  async update(id, { name, phone, address }) {
    if (!mongoose.isValidObjectId(id)) return null;
    const user = await UserModel.findByIdAndUpdate(
      id,
      { name, phone, address },
      { new: true }
    );
    return user ? mapDoc(user) : null;
  },

  async delete(id) {
    if (!mongoose.isValidObjectId(id)) return null;
    const user = await UserModel.findByIdAndDelete(id);
    if (!user) return null;
    return { message: 'User deleted successfully' };
  }
};

module.exports = User;
