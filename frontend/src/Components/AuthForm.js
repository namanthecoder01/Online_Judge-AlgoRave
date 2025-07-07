import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './AuthForm.css';
import logo from '../Components/Assets/logo.jpg';
import { syncUserProfile } from '../utils/userSync';
import { BACKEND_URL } from '../utils/apiEndpoints';

const api = axios.create({
    baseURL: BACKEND_URL,
    withCredentials: true,
    headers: { 'Content-Type': 'application/json' }
});

const AuthForm = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [formData, setFormData] = useState({ username: '', firstname: '', lastname: '', email: '', password: '' });
    const [message, setMessage] = useState({ text: '', type: '' });
    const [loading, setLoading] = useState(false);
    const [passwordStrength, setPasswordStrength] = useState('');
    const navigate = useNavigate();

    const checkPasswordStrength = (password) => {
        let strength = '';
        if (password.length === 0) {
            strength = '';
        } else if (password.length < 6) {
            strength = 'weak';
        } else {
            const hasLetters = /[a-zA-Z]/.test(password);
            const hasNumbers = /[0-9]/.test(password);
            const hasSymbols = /[!@#$%^&*(),.?":{}|<>]/.test(password);
            const strengthValue = [hasLetters, hasNumbers, hasSymbols].reduce((acc, val) => acc + (val ? 1 : 0), 0);
            
            if (strengthValue === 3 && password.length >= 8) {
                strength = 'strong';
            } else if (strengthValue >= 2 && password.length >= 6) {
                strength = 'medium';
            } else {
                strength = 'weak';
            }
        }
        return strength;
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });

        if (name === 'password') {
            const strength = checkPasswordStrength(value);
            setPasswordStrength(strength);
        }

        if (message.text) setMessage({ text: '', type: '' });
    };

    const validateForm = () => {
        const { username, firstname, lastname, email, password } = formData;
        if (!email || !password) {
            setMessage({ text: 'Email and password are required.', type: 'error' });
            return false;
        }
        if (!isLogin && (!username || !firstname || !lastname)) {
            setMessage({ text: 'Username, first name, and last name are required.', type: 'error' });
            return false;
        }
        if (!isLogin && username.length < 3) {
            setMessage({ text: 'Username must be at least 3 characters long.', type: 'error' });
            return false;
        }
        if (!isLogin && !/^[a-zA-Z0-9_]+$/.test(username)) {
            setMessage({ text: 'Username can only contain letters, numbers, and underscores.', type: 'error' });
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
                if (isLogin) {
                  await syncUserProfile(data.token);
                }
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

                {message.text && <div className={`message ${message.type}`}>{message.text}</div>}

                <form onSubmit={handleSubmit}>
                    {!isLogin && (
                        <div className="form-group">
                            <input
                                type="text"
                                name="username"
                                placeholder="Username"
                                value={formData.username}
                                onChange={handleChange}
                                disabled={loading}
                                minLength={3}
                                maxLength={30}
                                pattern="[a-zA-Z0-9_]+"
                            />
                        </div>
                    )}
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
                         {!isLogin && formData.password && (
                            <div className="password-strength-container">
                                <div className={`password-strength-bar ${passwordStrength}`}></div>
                            </div>
                        )}
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