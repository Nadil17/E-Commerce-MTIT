import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { orderAPI } from '../services/api';
import { useApp } from '../App';
import './OrdersPage.css';

const STATUS_BADGE = {
  pending:    'badge-gold',
  confirmed:  'badge-success',
  processing: 'badge-muted',
  shipped:    'badge-muted',
  delivered:  'badge-success',
  cancelled:  'badge-danger',
  refunded:   'badge-danger',
};

export default function OrdersPage() {
  const { user } = useApp();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    orderAPI.getByUser(user.id)
      .then(r => setOrders(r.data.data || []))
      .catch(() => toast.error('Could not load orders'))
      .finally(() => setLoading(false));
  }, [user, navigate]);

  if (!user) return null;
  if (loading) return <div className="page"><div className="spinner" /></div>;

  return (
    <div className="page">
      <div className="page-header fade-up">
        <h1 className="page-title">My Orders</h1>
        <p className="page-subtitle">{orders.length} order{orders.length !== 1 ? 's' : ''} found</p>
      </div>

      {orders.length === 0 ? (
        <div className="empty-state fade-up">
          <div className="empty-icon">📦</div>
          <div className="empty-title">No orders yet</div>
          <div className="empty-desc">Start shopping and your orders will appear here</div>
          <Link to="/" className="btn-primary">Browse Products</Link>
        </div>
      ) : (
        <div className="orders-list fade-up">
          {orders.map((order, i) => (
            <div key={order.id} className="order-card" style={{ animationDelay: `${i * 0.05}s` }}>
              <div className="order-header" onClick={() => setExpanded(expanded === order.id ? null : order.id)}>
                <div className="order-left">
                  <div className="order-number">{order.order_number}</div>
                  <div className="order-date">{new Date(order.created_at).toLocaleDateString('en-GB', {
                    day: '2-digit', month: 'short', year: 'numeric'
                  })}</div>
                </div>
                <div className="order-right">
                  <span className={`badge ${STATUS_BADGE[order.status] || 'badge-muted'}`}>
                    {order.status}
                  </span>
                  <span className={`badge ${order.payment_status === 'paid' ? 'badge-success' : 'badge-danger'}`}>
                    {order.payment_status}
                  </span>
                  <div className="order-total">${parseFloat(order.total_amount).toFixed(2)}</div>
                  <svg
                    className={`chevron ${expanded === order.id ? 'open' : ''}`}
                    viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                    width="16" height="16"
                  >
                    <polyline points="6 9 12 15 18 9"/>
                  </svg>
                </div>
              </div>

              {expanded === order.id && (
                <div className="order-details">
                  <div className="order-items-list">
                    {(order.items || []).map(item => (
                      <div key={item.id} className="order-item-row">
                        <img
                          src={`https://picsum.photos/seed/${item.product_id}/48/48`}
                          alt={item.product_name}
                        />
                        <div className="order-item-info">
                          <div className="order-item-name">{item.product_name}</div>
                          <div className="order-item-meta">
                            ${parseFloat(item.unit_price).toFixed(2)} × {item.quantity}
                          </div>
                        </div>
                        <div className="order-item-sub">
                          ${parseFloat(item.subtotal).toFixed(2)}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="order-meta-grid">
                    {order.shipping_address && (
                      <div className="order-meta-item">
                        <div className="meta-label">Shipping To</div>
                        <div className="meta-value">{order.shipping_address}</div>
                      </div>
                    )}
                    <div className="order-meta-item">
                      <div className="meta-label">Payment Method</div>
                      <div className="meta-value">{order.payment_method?.replace('_', ' ')}</div>
                    </div>
                    {order.transaction_id && (
                      <div className="order-meta-item">
                        <div className="meta-label">Transaction ID</div>
                        <div className="meta-value txn">{order.transaction_id}</div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
