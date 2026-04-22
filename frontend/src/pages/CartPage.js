import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { cartAPI } from '../services/api';
import { useApp } from '../App';
import './CartPage.css';

export default function CartPage() {
  const { user, setCartCount } = useApp();
  const navigate = useNavigate();
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState({});

  const fetchCart = useCallback(async () => {
    if (!user) return;
    try {
      const res = await cartAPI.getCart(user.id);
      setCart(res.data.data);
      setCartCount(res.data.data.items?.length || 0);
    } catch {
      toast.error('Could not load cart');
    } finally {
      setLoading(false);
    }
  }, [user, setCartCount]);

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    fetchCart();
  }, [user, navigate, fetchCart]);

  const updateQty = async (productId, newQty) => {
    setUpdating(u => ({ ...u, [productId]: true }));
    try {
      const res = await cartAPI.updateQty(user.id, productId, newQty);
      setCart(res.data.data);
      setCartCount(res.data.data.items?.length || 0);
    } catch {
      toast.error('Update failed');
    } finally {
      setUpdating(u => ({ ...u, [productId]: false }));
    }
  };

  const removeItem = async (productId, name) => {
    try {
      const res = await cartAPI.removeItem(user.id, productId);
      setCart(res.data.data);
      setCartCount(res.data.data.items?.length || 0);
      toast.success(`${name} removed`);
    } catch {
      toast.error('Remove failed');
    }
  };

  const clearCart = async () => {
    if (!window.confirm('Clear your entire cart?')) return;
    try {
      await cartAPI.clearCart(user.id);
      setCart(prev => ({ ...prev, items: [], total: 0 }));
      setCartCount(0);
      toast.success('Cart cleared');
    } catch {
      toast.error('Could not clear cart');
    }
  };

  if (!user) return null;
  if (loading) return <div className="page"><div className="spinner" /></div>;

  const items = cart?.items || [];

  return (
    <div className="page">
      <div className="page-header fade-up">
        <h1 className="page-title">Your Cart</h1>
        <p className="page-subtitle">{items.length} {items.length === 1 ? 'item' : 'items'}</p>
      </div>

      {items.length === 0 ? (
        <div className="empty-state fade-up">
          <div className="empty-icon">🛒</div>
          <div className="empty-title">Your cart is empty</div>
          <div className="empty-desc">Add some products to get started</div>
          <Link to="/" className="btn-primary">Browse Products</Link>
        </div>
      ) : (
        <div className="cart-layout fade-up">
          <div className="cart-items">
            <div className="cart-items-header">
              <span>Product</span>
              <span>Qty</span>
              <span>Subtotal</span>
              <span />
            </div>
            {items.map(item => (
              <div key={item.product_id} className="cart-item">
                <div className="cart-item-info">
                  <div className="cart-item-img">
                    <img
                      src={`https://picsum.photos/seed/${item.product_id}/80/80`}
                      alt={item.product_name}
                    />
                  </div>
                  <div>
                    <div className="cart-item-name">{item.product_name}</div>
                    <div className="cart-item-price">${parseFloat(item.product_price).toFixed(2)} each</div>
                  </div>
                </div>

                <div className="qty-control">
                  <button
                    className="qty-btn"
                    onClick={() => updateQty(item.product_id, item.quantity - 1)}
                    disabled={updating[item.product_id]}
                  >−</button>
                  <span className="qty-num">{item.quantity}</span>
                  <button
                    className="qty-btn"
                    onClick={() => updateQty(item.product_id, item.quantity + 1)}
                    disabled={updating[item.product_id]}
                  >+</button>
                </div>

                <div className="cart-item-subtotal">
                  ${(parseFloat(item.product_price) * item.quantity).toFixed(2)}
                </div>

                <button
                  className="remove-btn"
                  onClick={() => removeItem(item.product_id, item.product_name)}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                    <polyline points="3 6 5 6 21 6"/>
                    <path d="M19 6l-1 14H6L5 6"/>
                    <path d="M10 11v6M14 11v6"/>
                    <path d="M9 6V4h6v2"/>
                  </svg>
                </button>
              </div>
            ))}

            <div className="cart-actions">
              <button className="btn-ghost" onClick={clearCart}>Clear Cart</button>
              <Link to="/" className="btn-ghost">← Continue Shopping</Link>
            </div>
          </div>

          <div className="cart-summary card">
            <h3 className="summary-title">Order Summary</h3>
            <hr className="divider" />
            {items.map(item => (
              <div key={item.product_id} className="summary-line">
                <span className="summary-item-name">{item.product_name} ×{item.quantity}</span>
                <span>${(parseFloat(item.product_price) * item.quantity).toFixed(2)}</span>
              </div>
            ))}
            <hr className="divider" />
            <div className="summary-line summary-total">
              <span>Total</span>
              <span className="total-amount">${parseFloat(cart.total || 0).toFixed(2)}</span>
            </div>
            <button className="btn-primary" style={{ width: '100%', marginTop: 20 }}
              onClick={() => navigate('/checkout')}>
              Proceed to Checkout →
            </button>
            <p className="secure-note">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="12" height="12">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
              Secure checkout via API Gateway
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
