import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { productAPI, cartAPI } from '../services/api';
import CommentsSection from '../components/CommentsSection';
import { useApp } from '../App';
import './ProductDetailPage.css';

export default function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, setCartCount } = useApp();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    if (!id) return;
    productAPI.getById(id)
      .then(r => {
        setProduct(r.data.data);
      })
      .catch(() => toast.error('Could not load product'))
      .finally(() => setLoading(false));
  }, [id]);

  const addToCart = async () => {
    if (!user) { 
      toast.error('Please sign in to add items'); 
      navigate('/login'); 
      return; 
    }
    setAdding(true);
    try {
      const res = await cartAPI.addItem(user.id, { 
        product_id: product.id, 
        quantity: parseInt(quantity) 
      });
      const count = res.data.data.items?.length || 0;
      setCartCount(count);
      toast.success(`${product.name} added to cart`);
      setQuantity(1);
    } catch (err) {
      toast.error('Failed to add to cart');
    } finally {
      setAdding(false);
    }
  };

  if (loading) {
    return (
      <div className="page">
        <div className="loading-state">Loading product...</div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="page">
        <div className="empty-state">
          <div className="empty-icon">🛍️</div>
          <div className="empty-title">Product not found</div>
          <button 
            className="btn-primary"
            onClick={() => navigate('/products')}
          >
            Back to Products
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <button 
        className="back-btn"
        onClick={() => navigate('/products')}
      >
        ← Back to Products
      </button>

      <div className="product-detail fade-up">
        <div className="product-detail-img">
          <img
            src={product.image_url || `https://picsum.photos/seed/${product.id}/600/500`}
            alt={product.name}
            className="detail-img"
            onError={e => { e.target.src = `https://picsum.photos/seed/${product.id + 10}/600/500`; }}
          />
          {product.stock === 0 && (
            <div className="sold-out-overlay">OUT OF STOCK</div>
          )}
        </div>

        <div className="product-detail-info">
          {product.category && (
            <span className="detail-category">{product.category}</span>
          )}
          <h1 className="detail-title">{product.name}</h1>
          <p className="detail-desc">{product.description}</p>

          <div className="detail-specs">
            <div className="spec-item">
              <span className="spec-label">Price</span>
              <span className="spec-value price">${parseFloat(product.price).toFixed(2)}</span>
            </div>
            <div className="spec-item">
              <span className="spec-label">Stock</span>
              <span className={`spec-value ${product.stock > 5 ? 'in-stock' : product.stock > 0 ? 'low-stock' : 'out-stock'}`}>
                {product.stock > 0 ? `${product.stock} available` : 'Out of Stock'}
              </span>
            </div>
          </div>

          <div className="detail-actions">
            {product.stock > 0 ? (
              <>
                <div className="qty-selector">
                  <label>Quantity:</label>
                  <input
                    type="number"
                    min="1"
                    max={product.stock}
                    value={quantity}
                    onChange={e => setQuantity(Math.max(1, Math.min(product.stock, parseInt(e.target.value) || 1)))}
                    className="qty-input"
                  />
                </div>
                <button
                  className="btn-primary btn-large"
                  onClick={addToCart}
                  disabled={adding}
                >
                  {adding ? 'Adding...' : '🛒 Add to Cart'}
                </button>
              </>
            ) : (
              <button
                className="btn-secondary"
                disabled
              >
                Out of Stock
              </button>
            )}
          </div>

          {product.stock > 0 && product.stock <= 5 && (
            <div className="low-stock-warning">
              ⚠️ Only {product.stock} item{product.stock > 1 ? 's' : ''} left in stock
            </div>
          )}
        </div>
      </div>

      <CommentsSection 
        productId={product.id}
        productName={product.name}
      />
    </div>
  );
}
