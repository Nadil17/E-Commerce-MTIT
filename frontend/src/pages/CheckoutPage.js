import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { cartAPI, orderAPI } from '../services/api';
import { useApp } from '../App';
import './CheckoutPage.css';

const STEPS = ['Cart Review', 'Shipping', 'Payment', 'Confirm'];

export default function CheckoutPage() {
  const { user, setCartCount } = useApp();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [placing, setPlacing] = useState(false);
  const [result, setResult] = useState(null);

  const [form, setForm] = useState({
    shipping_address: '',
    notes: '',
    payment_method: 'credit_card',
  });

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    cartAPI.getCart(user.id)
      .then(r => {
        setCart(r.data.data);
        if (!r.data.data.items?.length) { toast.error('Cart is empty'); navigate('/cart'); }
      })
      .catch(() => toast.error('Could not load cart'))
      .finally(() => setLoading(false));
  }, [user, navigate]);

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const placeOrder = async () => {
    if (!form.shipping_address.trim()) { toast.error('Shipping address is required'); return; }
    setPlacing(true);
    try {
      const res = await orderAPI.create({
        user_id: user.id,
        payment_method: form.payment_method,
        shipping_address: form.shipping_address,
        notes: form.notes,
      });
      setResult(res.data);
      setCartCount(0);
      setStep(4);
    } catch (err) {
      const msg = err.response?.data?.message || 'Order failed';
      toast.error(msg);
    } finally {
      setPlacing(false);
    }
  };

  if (!user) return null;
  if (loading) return <div className="page"><div className="spinner" /></div>;

  const items = cart?.items || [];
  const total = cart?.total || 0;

  // Success screen
  if (step === 4 && result) {
    const success = result.success;
    const order = result.data?.order;
    const payment = result.data?.payment;
    return (
      <div className="page">
        <div className={`order-result fade-up ${success ? 'success' : 'failed'}`}>
          <div className="result-icon">{success ? '✓' : '✗'}</div>
          <h2 className="result-title">
            {success ? 'Order Confirmed!' : 'Payment Failed'}
          </h2>
          <p className="result-subtitle">
            {success
              ? `Order ${order?.order_number} has been placed successfully.`
              : 'Your payment could not be processed. Please try again.'}
          </p>
          {order && (
            <div className="result-details">
              <div className="result-row"><span>Order #</span><strong>{order.order_number}</strong></div>
              <div className="result-row"><span>Total</span><strong>${parseFloat(order.total_amount).toFixed(2)}</strong></div>
              <div className="result-row"><span>Payment</span>
                <strong className={success ? 'status-confirmed' : 'status-cancelled'}>
                  {payment?.status?.toUpperCase()}
                </strong>
              </div>
              {payment?.transaction_id && (
                <div className="result-row">
                  <span>Transaction</span>
                  <strong style={{ fontSize: 12, color: 'var(--muted)' }}>{payment.transaction_id}</strong>
                </div>
              )}
            </div>
          )}
          <div className="result-actions">
            <button className="btn-primary" onClick={() => navigate('/orders')}>View Orders</button>
            <button className="btn-ghost" onClick={() => navigate('/')}>Back to Shop</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-header fade-up">
        <h1 className="page-title">Checkout</h1>
      </div>

      {/* Stepper */}
      <div className="stepper fade-up">
        {STEPS.map((s, i) => (
          <React.Fragment key={s}>
            <div className={`step ${i === step ? 'active' : i < step ? 'done' : ''}`}>
              <div className="step-circle">{i < step ? '✓' : i + 1}</div>
              <span className="step-label">{s}</span>
            </div>
            {i < STEPS.length - 1 && <div className={`step-line ${i < step ? 'done' : ''}`} />}
          </React.Fragment>
        ))}
      </div>

      <div className="checkout-layout fade-up">
        <div className="checkout-main">

          {/* Step 0: Review */}
          {step === 0 && (
            <div className="card">
              <h3 className="step-heading">Review Cart</h3>
              {items.map(item => (
                <div key={item.product_id} className="checkout-item">
                  <img src={`https://picsum.photos/seed/${item.product_id}/60/60`} alt={item.product_name} />
                  <div className="checkout-item-info">
                    <div className="checkout-item-name">{item.product_name}</div>
                    <div className="checkout-item-meta">Qty: {item.quantity}</div>
                  </div>
                  <div className="checkout-item-price">
                    ${(parseFloat(item.product_price) * item.quantity).toFixed(2)}
                  </div>
                </div>
              ))}
              <button className="btn-primary" style={{ marginTop: 20 }} onClick={() => setStep(1)}>
                Continue to Shipping →
              </button>
            </div>
          )}

          {/* Step 1: Shipping */}
          {step === 1 && (
            <div className="card">
              <h3 className="step-heading">Shipping Information</h3>
              <div className="form-group">
                <label className="form-label">Full Shipping Address *</label>
                <textarea
                  name="shipping_address"
                  rows={3}
                  placeholder="123 Main St, Colombo 03, Western Province, Sri Lanka"
                  value={form.shipping_address}
                  onChange={handleChange}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Order Notes (optional)</label>
                <textarea
                  name="notes"
                  rows={2}
                  placeholder="Special delivery instructions..."
                  value={form.notes}
                  onChange={handleChange}
                />
              </div>
              <div className="step-buttons">
                <button className="btn-ghost" onClick={() => setStep(0)}>← Back</button>
                <button className="btn-primary"
                  onClick={() => {
                    if (!form.shipping_address.trim()) { toast.error('Address required'); return; }
                    setStep(2);
                  }}>
                  Continue to Payment →
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Payment */}
          {step === 2 && (
            <div className="card">
              <h3 className="step-heading">Payment Method</h3>
              <div className="payment-methods">
                {[
                  { value: 'credit_card', label: 'Credit Card', icon: '💳' },
                  { value: 'debit_card', label: 'Debit Card', icon: '🏦' },
                  { value: 'paypal', label: 'PayPal', icon: '🅿️' },
                  { value: 'bank_transfer', label: 'Bank Transfer', icon: '🏛️' },
                ].map(m => (
                  <label key={m.value} className={`payment-option ${form.payment_method === m.value ? 'selected' : ''}`}>
                    <input
                      type="radio"
                      name="payment_method"
                      value={m.value}
                      checked={form.payment_method === m.value}
                      onChange={handleChange}
                    />
                    <span className="pay-icon">{m.icon}</span>
                    <span>{m.label}</span>
                  </label>
                ))}
              </div>
              <p className="sim-note">⚡ Payments are simulated — no real charge occurs</p>
              <div className="step-buttons">
                <button className="btn-ghost" onClick={() => setStep(1)}>← Back</button>
                <button className="btn-primary" onClick={() => setStep(3)}>Review Order →</button>
              </div>
            </div>
          )}

          {/* Step 3: Confirm */}
          {step === 3 && (
            <div className="card">
              <h3 className="step-heading">Order Confirmation</h3>
              <div className="confirm-section">
                <div className="confirm-label">Shipping To</div>
                <div className="confirm-value">{form.shipping_address}</div>
              </div>
              <div className="confirm-section">
                <div className="confirm-label">Payment Method</div>
                <div className="confirm-value">{form.payment_method.replace('_', ' ')}</div>
              </div>
              {form.notes && (
                <div className="confirm-section">
                  <div className="confirm-label">Notes</div>
                  <div className="confirm-value">{form.notes}</div>
                </div>
              )}
              <div className="step-buttons">
                <button className="btn-ghost" onClick={() => setStep(2)}>← Back</button>
                <button className="btn-primary" onClick={placeOrder} disabled={placing}>
                  {placing ? 'Processing...' : `Place Order · $${parseFloat(total).toFixed(2)}`}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Order Summary sidebar */}
        <div className="card checkout-summary">
          <h3 className="summary-title">Summary</h3>
          <hr className="divider" />
          {items.map(item => (
            <div key={item.product_id} className="summary-line">
              <span className="summary-item-name">{item.product_name} ×{item.quantity}</span>
              <span>${(parseFloat(item.product_price) * item.quantity).toFixed(2)}</span>
            </div>
          ))}
          <hr className="divider" />
          <div className="summary-line" style={{ color: 'var(--muted)', fontSize: 13 }}>
            <span>Subtotal</span><span>${parseFloat(total).toFixed(2)}</span>
          </div>
          <div className="summary-line" style={{ color: 'var(--muted)', fontSize: 13 }}>
            <span>Shipping</span><span className="status-confirmed">Free</span>
          </div>
          <div className="summary-line summary-total" style={{ marginTop: 8 }}>
            <span>Total</span>
            <span className="total-amount">${parseFloat(total).toFixed(2)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
