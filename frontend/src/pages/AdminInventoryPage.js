import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { inventoryAPI, productAPI } from '../services/api';
import { useApp } from '../App';
import './AdminInventoryPage.css';

export default function AdminInventoryPage() {
  const { user } = useApp();
  const navigate = useNavigate();
  const [inventory, setInventory] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({
    product_id: '',
    quantity: '',
    reorder_level: ''
  });

  useEffect(() => {
    if (!user || user.role !== 'admin') { navigate('/login'); return; }
    loadData();
  }, [user, navigate]);

  const loadData = async () => {
    try {
      const [invRes, prodRes] = await Promise.all([
        inventoryAPI.getAll(),
        productAPI.getAll()
      ]);
      setInventory(invRes.data.data || []);
      setProducts(prodRes.data.data || []);
    } catch (err) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.product_id || !form.quantity) {
      toast.error('Product and quantity are required');
      return;
    }
    try {
      const data = {
        product_id: parseInt(form.product_id),
        quantity: parseInt(form.quantity),
        reorder_level: form.reorder_level ? parseInt(form.reorder_level) : 10
      };
      
      if (editId) {
        await inventoryAPI.update(editId, data);
        toast.success('Inventory updated');
      } else {
        await inventoryAPI.create(data);
        toast.success('Inventory entry created');
      }
      setShowModal(false);
      setForm({ product_id: '', quantity: '', reorder_level: '' });
      setEditId(null);
      loadData();
    } catch (err) {
      toast.error(editId ? 'Update failed' : 'Create failed');
    }
  };

  const openEdit = (inv) => {
    setEditId(inv.id);
    setForm({
      product_id: inv.product_id.toString(),
      quantity: inv.quantity.toString(),
      reorder_level: inv.reorder_level?.toString() || '10'
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this inventory entry?')) return;
    try {
      await inventoryAPI.delete(id);
      toast.success('Inventory deleted');
      loadData();
    } catch (err) {
      toast.error('Delete failed');
    }
  };

  const getProductName = (productId) => {
    const prod = products.find(p => p.id === productId);
    return prod ? prod.name : `Product #${productId}`;
  };

  if (!user || user.role !== 'admin') return null;

  return (
    <div className="admin-page">
      <div className="admin-header">
        <h1>Manage Inventory</h1>
        <button className="btn-primary" onClick={() => { setEditId(null); setForm({ product_id: '', quantity: '', reorder_level: '' }); setShowModal(true); }}>
          + Add Stock
        </button>
      </div>

      {loading ? (
        <div className="loading">Loading...</div>
      ) : inventory.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📊</div>
          <div className="empty-title">No inventory</div>
          <button className="btn-primary" onClick={() => setShowModal(true)}>Add first entry</button>
        </div>
      ) : (
        <div className="admin-table">
          <table>
            <thead>
              <tr>
                <th>Product</th>
                <th>Quantity</th>
                <th>Reorder Level</th>
                <th>Last Updated</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {inventory.map(inv => (
                <tr key={inv.id}>
                  <td>{getProductName(inv.product_id)}</td>
                  <td>{inv.quantity}</td>
                  <td>{inv.reorder_level || 10}</td>
                  <td>{new Date(inv.updated_at).toLocaleDateString()}</td>
                  <td className="actions">
                    <button className="btn-sm edit" onClick={() => openEdit(inv)}>Edit</button>
                    <button className="btn-sm delete" onClick={() => handleDelete(inv.id)}>Delete</button>
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
            <h2>{editId ? 'Edit Inventory' : 'Add Inventory'}</h2>
            <form onSubmit={handleSubmit}>
              <select
                name="product_id"
                value={form.product_id}
                onChange={handleChange}
                required
              >
                <option value="">Select product</option>
                {products.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
              <input
                name="quantity"
                type="number"
                placeholder="Quantity"
                value={form.quantity}
                onChange={handleChange}
                required
              />
              <input
                name="reorder_level"
                type="number"
                placeholder="Reorder level (default: 10)"
                value={form.reorder_level}
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
