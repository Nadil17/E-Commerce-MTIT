import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { productAPI, cartAPI } from '../services/api';
import { useApp } from '../App';
import './ProductsPage.css';

export default function ProductsPage() {
  const { user, setCartCount } = useApp();
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState({});
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');

  useEffect(() => {
    productAPI.getAll()
      .then(r => setProducts(r.data.data || []))
      .catch(() => toast.error('Could not load products'))
      .finally(() => setLoading(false));
  }, []);

  const categories = ['All', ...new Set(products.map(p => p.category).filter(Boolean))];

  const filtered = products.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchCat = category === 'All' || p.category === category;
    return matchSearch && matchCat;
  });

  const addToCart = async (product) => {
    if (!user) { toast.error('Please sign in to add items'); navigate('/login'); return; }
    setAdding(a => ({ ...a, [product.id]: true }));
    try {
      const res = await cartAPI.addItem(user.id, { product_id: product.id, quantity: 1 });
      const count = res.data.data.items?.length || 0;
      setCartCount(count);
      toast.success(`${product.name} added to cart`);
    } catch (err) {
      toast.error('Failed to add to cart');
    } finally {
      setAdding(a => ({ ...a, [product.id]: false }));
    }
  };

  return (
    <div className="page">
      <div className="page-header fade-up">
        <h1 className="page-title">Our Collection</h1>
        <p className="page-subtitle">Premium products, curated for you</p>
      </div>

      <div className="products-filters fade-up">
        <div className="search-wrap">
          <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input
            placeholder="Search products..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="search-input"
          />
        </div>
        <div className="cat-tabs">
          {categories.map(c => (
            <button
              key={c}
              className={`cat-tab ${category === c ? 'active' : ''}`}
              onClick={() => setCategory(c)}
            >{c}</button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="products-grid">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="product-skeleton">
              <div className="skeleton" style={{ height: 200 }} />
              <div style={{ padding: 20 }}>
                <div className="skeleton" style={{ height: 20, marginBottom: 10, width: '70%' }} />
                <div className="skeleton" style={{ height: 14, width: '50%' }} />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🔍</div>
          <div className="empty-title">No products found</div>
          <div className="empty-desc">Try a different search or category</div>
        </div>
      ) : (
        <div className="products-grid">
          {filtered.map((product, i) => (
            <div key={product.id} className="product-card fade-up" style={{ animationDelay: `${i * 0.05}s` }}>
              <div className="product-img-wrap">
                <img
                  src={product.image_url || `https://picsum.photos/seed/${product.id}/400/300`}
                  alt={product.name}
                  className="product-img"
                  onClick={() => navigate(`/product/${product.id}`)}
                  style={{ cursor: 'pointer' }}
                  onError={e => { e.target.src = `https://picsum.photos/seed/${product.id + 10}/400/300`; }}
                />
                {product.stock <= 5 && product.stock > 0 && (
                  <span className="stock-badge low">Only {product.stock} left</span>
                )}
                {product.stock === 0 && (
                  <span className="stock-badge out">Out of Stock</span>
                )}
                {product.category && (
                  <span className="cat-badge">{product.category}</span>
                )}
              </div>
              <div className="product-info">
                <h3 
                  className="product-name"
                  onClick={() => navigate(`/product/${product.id}`)}
                  style={{ cursor: 'pointer' }}
                >
                  {product.name}
                </h3>
                <p className="product-desc">{product.description}</p>
                <div className="product-footer">
                  <span className="product-price">${parseFloat(product.price).toFixed(2)}</span>
                  <button
                    className="add-btn"
                    onClick={() => addToCart(product)}
                    disabled={adding[product.id] || product.stock === 0}
                  >
                    {adding[product.id] ? '...' : product.stock === 0 ? 'Sold Out' : '+ Cart'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
