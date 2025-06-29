import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import logo from './Assets/logo.jpg';
import './Navbar.css';

const Navbar = ({ user }) => {
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (showProfileMenu && !event.target.closest('.oj-profile-dropdown')) {
                setShowProfileMenu(false);
            }
        };

        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, [showProfileMenu]);

    const handleLogout = () => {
        localStorage.clear();
        navigate('/');
    };

    const toggleProfileMenu = () => {
        setShowProfileMenu(!showProfileMenu);
    };

    const handleNav = (path) => {
        navigate(path);
    };

    if (!user) return null;

    return (
        <nav className="oj-navbar oj-navbar-hacker-theme">
            <div className="oj-nav-logo">
                <img src={logo} alt="AlgoRave Logo" />
                <span>AlgoRave</span>
            </div>
            <div className="oj-nav-links">
                <button
                    className={`oj-nav-btn ${location.pathname === '/home' ? 'active' : ''}`}
                    onClick={() => handleNav('/home')}>
                    Home
                </button>
                <button
                    className={`oj-nav-btn ${location.pathname === '/compiler' ? 'active' : ''}`}
                    onClick={() => handleNav('/compiler')}>
                    Compiler
                </button>
                <button
                    className={`oj-nav-btn ${location.pathname === '/contests' ? 'active' : ''}`}
                    onClick={() => handleNav('/contests')}>
                    Contests
                </button>
                <button
                    className={`oj-nav-btn ${location.pathname === '/leaderboard' ? 'active' : ''}`}
                    onClick={() => handleNav('/leaderboard')}>
                    Leaderboard
                </button>
            </div>
            <div className="oj-profile-dropdown">
                <button className="oj-profile-button" onClick={toggleProfileMenu}>
                    <div className="oj-profile-avatar" title={user.firstname + ' ' + user.lastname}>
                        {user.firstname[0].toUpperCase()}
                    </div>
                </button>
                <div className={`oj-profile-menu ${showProfileMenu ? 'show' : ''}`}>
                    <div className="oj-profile-menu-item">
                        <span>👤</span> {user.firstname} {user.lastname}
                    </div>
                    <div className="oj-profile-menu-divider"></div>
                    <div className="oj-profile-menu-item" onClick={() => handleNav('/profile')}>
                        <span>📊</span> My Profile
                    </div>
                    <div className="oj-profile-menu-item">
                        <span>⚙️</span> Settings
                    </div>
                    <div className="oj-profile-menu-divider"></div>
                    <div className="oj-profile-menu-item" onClick={handleLogout}>
                        <span>🚪</span> Logout
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navbar; 