import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import logo from './Assets/logo.jpg';
import './AdminLogin.css';
import { BACKEND_URL } from '../utils/apiEndpoints';

const AdminLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await fetch(`${BACKEND_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.message || 'Login failed');
        return;
      }
      if (!data.user.isAdmin) {
        setError('You are not an admin!');
        return;
      }
      localStorage.setItem('adminToken', data.token);
      navigate('/admin/dashboard');
    } catch (err) {
      setError('Login failed. Please try again.');
    }
  };

  return (
    <div className="admin-bg-container">
      <div className="admin-login-card">
        <div className="admin-logo">
          <img src={logo} alt="AlgoRave Logo" />
        </div>
        <h2 className="admin-title">Admin Login</h2>
        <form onSubmit={handleSubmit} className="admin-form">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />
          <button type="submit">Login</button>
        </form>
        {error && <div className="error-message">{error}</div>}
      </div>
    </div>
  );
};

export default AdminLogin;