import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './AuthForm.css';
import logo from '../Components/Assets/logo.jpg';

const api = axios.create({
    baseURL: 'http://localhost:5000',
    withCredentials: true,
    headers: { 'Content-Type': 'application/json' }
});

const AuthForm = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [formData, setFormData] = useState({ firstname: '', lastname: '', email: '', password: '' });
    const [message, setMessage] = useState({ text: '', type: '' });
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        if (message.text) setMessage({ text: '', type: '' });
    };

    const validateForm = () => {
        const { firstname, lastname, email, password } = formData;
        if (!email || !password) {
            setMessage({ text: 'Email and password are required.', type: 'error' });
            return false;
        }
        if (!isLogin && (!firstname || !lastname)) {
            setMessage({ text: 'Name fields are required.', type: 'error' });
            return false;
        }
        if (password.length < 6) {
            setMessage({ text: 'Password must be at least 6 characters.', type: 'error' });
            return false;
        }
        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;
        setLoading(true);
        try {
            const endpoint = isLogin ? '/login' : '/register';
            const { data } = await api.post(endpoint, formData);

            if (data.success) {
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));
                navigate('/home');
            }
        } catch (error) {
            const errMsg =
                error.response?.data?.message ||
                (error.code === 'ERR_NETWORK' ? 'Unable to connect to the server.' :
                error.request ? 'No response from server.' :
                'An unexpected error occurred.');
            setMessage({ text: errMsg, type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-form">
                <div className="logo">
                    <img src={logo} alt="AlgoRave Logo" style={{ width: 56, height: 56, borderRadius: '50%' }} />
                </div>
                <h1 className="oj-title">AlgoRave</h1>
                <div className="oj-tagline">Code. Compete. Conquer.</div>
                <h2>{isLogin ? 'Login' : 'Register'}</h2>

                {message.text && <div className={`message ${message.type}`}>{message.text}</div>}

                <form onSubmit={handleSubmit}>
                    {!isLogin && ['firstname', 'lastname'].map((field) => (
                        <div className="form-group" key={field}>
                            <input
                                type="text"
                                name={field}
                                placeholder={field === 'firstname' ? 'First Name' : 'Last Name'}
                                value={formData[field]}
                                onChange={handleChange}
                                disabled={loading}
                            />
                        </div>
                    ))}
                    <div className="form-group">
                        <input
                            type="email"
                            name="email"
                            placeholder="Email"
                            value={formData.email}
                            onChange={handleChange}
                            disabled={loading}
                        />
                    </div>
                    <div className="form-group">
                        <input
                            type="password"
                            name="password"
                            placeholder="Password"
                            value={formData.password}
                            onChange={handleChange}
                            minLength={6}
                            disabled={loading}
                        />
                    </div>
                    <button type="submit" className="submit-btn" disabled={loading}>
                        {loading ? 'Processing...' : isLogin ? 'Login' : 'Register'}
                    </button>
                </form>

                <p className="toggle-form">
                    {isLogin ? "Don't have an account? " : 'Already have an account? '}
                    <button className="toggle-btn" onClick={() => setIsLogin(!isLogin)} disabled={loading}>
                        {isLogin ? 'Register' : 'Login'}
                    </button>
                </p>
            </div>
        </div>
    );
};

export default AuthForm;