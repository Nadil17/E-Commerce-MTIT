import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { userAPI } from '../services/api';
import { useApp } from '../App';
import './LoginPage.css';

export default function LoginPage() {
  const { login } = useApp();
  const navigate = useNavigate();
  const [mode, setMode] = useState('login');
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '' });

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === 'login') {
        const res = await userAPI.login({ email: form.email, password: form.password });
        login(res.data.data.user, res.data.data.token);
        toast.success(`Welcome back, ${res.data.data.user.name}!`);
        navigate('/');
      } else {
        await userAPI.register({ name: form.name, email: form.email, password: form.password, phone: form.phone });
        toast.success('Account created! Please sign in.');
        setMode('login');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || (mode === 'login' ? 'Login failed' : 'Registration failed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card fade-up">
        <div className="login-header">
          <div className="login-logo">⬡</div>
          <h2 className="login-title">NEXUS<em>SHOP</em></h2>
          <p className="login-sub">{mode === 'login' ? 'Sign in to your account' : 'Create an account'}</p>
        </div>

        <div className="mode-toggle">
          <button className={mode === 'login' ? 'active' : ''} onClick={() => setMode('login')}>Sign In</button>
          <button className={mode === 'register' ? 'active' : ''} onClick={() => setMode('register')}>Register</button>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          {mode === 'register' && (
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input name="name" placeholder="John Doe" value={form.name} onChange={handleChange} required />
            </div>
          )}
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input name="email" type="email" placeholder="you@example.com" value={form.email} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input name="password" type="password" placeholder="••••••••" value={form.password} onChange={handleChange} required />
          </div>
          {mode === 'register' && (
            <div className="form-group">
              <label className="form-label">Phone (optional)</label>
              <input name="phone" placeholder="077 123 4567" value={form.phone} onChange={handleChange} />
            </div>
          )}
          <button type="submit" className="btn-primary login-btn" disabled={loading}>
            {loading ? 'Please wait...' : mode === 'login' ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        {mode === 'login' && (
          <div className="demo-hint">
            <span>Demo:</span> admin@shop.com / password123
          </div>
        )}

        <Link to="/" className="back-link">← Back to shop</Link>
      </div>
    </div>
  );
}
