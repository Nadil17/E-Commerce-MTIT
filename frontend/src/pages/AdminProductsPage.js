import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { productAPI } from '../services/api';
import { useApp } from '../App';
import './AdminProductsPage.css';

export default function AdminProductsPage() {
  const { user } = useApp();
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({
    name: '',
    price: '',
    description: '',
    category: '',
    image_url: '',
    stock: ''
  });

  useEffect(() => {
    if (!user || user.role !== 'admin') { navigate('/login'); return; }
    loadProducts();
  }, [user, navigate]);

  const loadProducts = async () => {
    try {
      const res = await productAPI.getAll();
      setProducts(res.data.data || []);
    } catch (err) {
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.price || !form.category) {
      toast.error('Name, price, and category are required');
      return;
    }
    try {
      if (editId) {
        await productAPI.update(editId, form);
        toast.success('Product updated');
      } else {
        await productAPI.create(form);
        toast.success('Product created');
      }
      setShowModal(false);
      setForm({ name: '', price: '', description: '', category: '', image_url: '', stock: '' });
      setEditId(null);
      loadProducts();
    } catch (err) {
      toast.error(editId ? 'Update failed' : 'Create failed');
    }
  };

  const openEdit = (product) => {
    setEditId(product.id);
    setForm({
      name: product.name,
      price: product.price,
      description: product.description,
      category: product.category,
      image_url: product.image_url,
      stock: product.stock
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this product?')) return;
    try {
      await productAPI.delete(id);
      toast.success('Product deleted');
      loadProducts();
    } catch (err) {
      toast.error('Delete failed');
    }
  };

  if (!user || user.role !== 'admin') return null;

  return (
    <div className="admin-page">
      <div className="admin-header">
        <h1>Manage Products</h1>
        <button className="btn-primary" onClick={() => { setEditId(null); setForm({ name: '', price: '', description: '', category: '', image_url: '', stock: '' }); setShowModal(true); }}>
          + Add Product
        </button>
      </div>

      {loading ? (
        <div className="loading">Loading...</div>
      ) : products.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📦</div>
          <div className="empty-title">No products</div>
          <button className="btn-primary" onClick={() => setShowModal(true)}>Add first product</button>
        </div>
      ) : (
        <div className="admin-table">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Price</th>
                <th>Category</th>
                <th>Stock</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map(p => (
                <tr key={p.id}>
                  <td>{p.id}</td>
                  <td>{p.name}</td>
                  <td>${parseFloat(p.price).toFixed(2)}</td>
                  <td>{p.category}</td>
                  <td>{p.stock}</td>
                  <td className="actions">
                    <button className="btn-sm edit" onClick={() => openEdit(p)}>Edit</button>
                    <button className="btn-sm delete" onClick={() => handleDelete(p.id)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2>{editId ? 'Edit Product' : 'Add Product'}</h2>
            <form onSubmit={handleSubmit}>
              <input
                name="name"
                placeholder="Product name"
                value={form.name}
                onChange={handleChange}
                required
              />
              <input
                name="price"
                type="number"
                placeholder="Price"
                step="0.01"
                value={form.price}
                onChange={handleChange}
                required
              />
              <textarea
                name="description"
                placeholder="Description"
                value={form.description}
                onChange={handleChange}
              />
              <input
                name="category"
                placeholder="Category"
                value={form.category}
                onChange={handleChange}
                required
              />
              <input
                name="image_url"
                placeholder="Image URL (optional)"
                value={form.image_url}
                onChange={handleChange}
              />
              <input
                name="stock"
                type="number"
                placeholder="Stock quantity"
                value={form.stock}
                onChange={handleChange}
              />
              <div className="modal-actions">
                <button type="submit" className="btn-primary">Save</button>
                <button type="button" className="btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
