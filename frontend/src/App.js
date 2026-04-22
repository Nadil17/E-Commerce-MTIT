import React, { createContext, useContext, useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import { Toaster, toast } from 'react-hot-toast';
import ProductsPage from './pages/ProductsPage';
import ProductDetailPage from './pages/ProductDetailPage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import OrdersPage from './pages/OrdersPage';
import LoginPage from './pages/LoginPage';
import AdminProductsPage from './pages/AdminProductsPage';
import AdminInventoryPage from './pages/AdminInventoryPage';
import './App.css';

export const AppContext = createContext(null);

export function useApp() { return useContext(AppContext); }

function App() {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('user')); } catch { return null; }
  });
  const [cartCount, setCartCount] = useState(0);

  const login = (userData) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
    toast.success('Logged out');
  };

  return (
    <AppContext.Provider value={{ user, login, logout, cartCount, setCartCount }}>
      <BrowserRouter>
        <Toaster
          position="top-right"
          toastOptions={{
            style: { background: '#1a1a24', color: '#f0ede8', border: '1px solid #2a2a38' },
            success: { iconTheme: { primary: '#c9a84c', secondary: '#0a0a0f' } },
          }}
        />
        <NavBar />
        <main style={{ minHeight: 'calc(100vh - 64px)', paddingTop: '80px' }}>
          <Routes>
            <Route path="/"                element={<ProductsPage />} />
            <Route path="/product/:id"     element={<ProductDetailPage />} />
            <Route path="/cart"            element={<CartPage />} />
            <Route path="/checkout"        element={<CheckoutPage />} />
            <Route path="/orders"          element={<OrdersPage />} />
            <Route path="/login"           element={<LoginPage />} />
            <Route path="/admin/products"  element={<AdminProductsPage />} />
            <Route path="/admin/inventory" element={<AdminInventoryPage />} />
          </Routes>
        </main>
      </BrowserRouter>
    </AppContext.Provider>
  );
}

function NavBar() {
  const { user, logout, cartCount } = useApp();
  const location = useLocation();
  const isActive = (path) => location.pathname === path;

  return (
    <nav className="navbar">
      <Link to="/" className="nav-brand">
        <span className="nav-logo">⬡</span>
        <span>NEXUS<em>SHOP</em></span>
      </Link>
      <div className="nav-links">
        <Link to="/"       className={`nav-link ${isActive('/') ? 'active' : ''}`}>Products</Link>
        <Link to="/orders" className={`nav-link ${isActive('/orders') ? 'active' : ''}`}>Orders</Link>
        {user?.role === 'admin' && (
          <>
            <Link to="/admin/products"  className={`nav-link ${isActive('/admin/products') ? 'active' : ''}`}>Manage Products</Link>
            <Link to="/admin/inventory" className={`nav-link ${isActive('/admin/inventory') ? 'active' : ''}`}>Manage Inventory</Link>
          </>
        )}
      </div>
      <div className="nav-actions">
        <Link to="/cart" className="cart-btn">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
          </svg>
          {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
        </Link>
        {user ? (
          <div className="user-menu">
            <span className="user-name">{user.name}</span>
            <button onClick={logout} className="btn-outline">Logout</button>
          </div>
        ) : (
          <Link to="/login" className="btn-gold">Sign In</Link>
        )}
      </div>
    </nav>
  );
}

export default App;
