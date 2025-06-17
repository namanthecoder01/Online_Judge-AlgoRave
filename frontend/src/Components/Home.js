import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import logo from './Assets/logo.jpg';
import './Home.css';

const Home = () => {
    const [user, setUser] = useState(null);
    const [activeTab, setActiveTab] = useState('problems');
    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem('token');
        const userData = localStorage.getItem('user');
        if (!token || !userData) {
            navigate('/');
            return;
        }
        setUser(JSON.parse(userData));
    }, [navigate]);

    const handleLogout = () => {
        localStorage.clear();
        navigate('/');
    };

    if (!user) return <div className="loading">Loading...</div>;

    return (
        <div className="oj-home-bg">
            <nav className="oj-navbar">
                <div className="oj-nav-logo">
                    <img src={logo} alt="AlgoRave Logo" />
                    <span>AlgoRave</span>
                </div>
                <div className="oj-nav-links">
                    <button className={`oj-nav-btn ${activeTab === 'problems' ? 'active' : ''}`} 
                            onClick={() => setActiveTab('problems')}>Problems</button>
                    <button className={`oj-nav-btn ${activeTab === 'compiler' ? 'active' : ''}`}
                            onClick={() => setActiveTab('compiler')}>Compiler</button>
                    <button className={`oj-nav-btn ${activeTab === 'contests' ? 'active' : ''}`}
                            onClick={() => setActiveTab('contests')}>Contests</button>
                    <button className={`oj-nav-btn ${activeTab === 'leaderboard' ? 'active' : ''}`}
                            onClick={() => setActiveTab('leaderboard')}>Leaderboard</button>
                </div>
                <button className="oj-logout-btn" onClick={handleLogout}>Logout</button>
            </nav>

            <div className="oj-dashboard">
                <div className="oj-welcome-banner">
                    <div className="oj-welcome-icon">💻</div>
                    <div>
                        <h1>Welcome, {user.firstname}!</h1>
                        <div className="oj-welcome-sub">Ready to solve some problems today?</div>
                    </div>
                </div>

                <div className="oj-main-content">
                    <div className="oj-sidebar">
                        <div className="oj-profile-card">
                            <div className="oj-profile-header">
                                <div className="oj-profile-avatar">{user.firstname[0].toUpperCase()}</div>
                                <div className="oj-profile-info">
                                    <div className="oj-profile-name">{user.firstname} {user.lastname}</div>
                                    <div className="oj-profile-email">{user.email}</div>
                                </div>
                            </div>
                            <div className="oj-profile-stats">
                                <div className="oj-stat-item">
                                    <span className="oj-stat-label">Rating</span>
                                    <span className="oj-stat-value">1500</span>
                                </div>
                                <div className="oj-stat-item">
                                    <span className="oj-stat-label">Solved</span>
                                    <span className="oj-stat-value">0</span>
                                </div>
                                <div className="oj-stat-item">
                                    <span className="oj-stat-label">Rank</span>
                                    <span className="oj-stat-value">#1</span>
                                </div>
                            </div>
                        </div>

                        <div className="oj-quick-links">
                            <h3>Quick Links</h3>
                            <button className="oj-quick-link-btn">My Submissions</button>
                            <button className="oj-quick-link-btn">Practice Problems</button>
                            <button className="oj-quick-link-btn">Upcoming Contests</button>
                            <button className="oj-quick-link-btn">Discussion Forum</button>
                        </div>
                    </div>

                    <div className="oj-content-area">
                        {activeTab === 'problems' && (
                            <div className="oj-section-card">
                                <h2>Problem Set</h2>
                                <div className="oj-problem-filters">
                                    <input type="text" placeholder="Search problems..." className="oj-search-input" />
                                    <select className="oj-difficulty-select">
                                        <option value="">All Difficulties</option>
                                        <option value="easy">Easy</option>
                                        <option value="medium">Medium</option>
                                        <option value="hard">Hard</option>
                                    </select>
                                </div>
                                <div className="oj-problems-list">
                                    <div className="oj-problem-item">
                                        <span className="oj-problem-title">Two Sum</span>
                                        <span className="oj-problem-difficulty easy">Easy</span>
                                        <span className="oj-problem-solved">Solved by 1000+</span>
                                    </div>
                                    {/* Add more problem items here */}
                                </div>
                            </div>
                        )}

                        {activeTab === 'compiler' && (
                            <div className="oj-section-card">
                                <h2>Online Compiler</h2>
                                <div className="oj-compiler-container">
                                    <div className="oj-code-editor">
                                        <select className="oj-language-select">
                                            <option value="cpp">C++</option>
                                            <option value="java">Java</option>
                                            <option value="python">Python</option>
                                        </select>
                                        <textarea className="oj-code-textarea" placeholder="Write your code here..."></textarea>
                                    </div>
                                    <div className="oj-test-cases">
                                        <h3>Test Cases</h3>
                                        <textarea className="oj-input-textarea" placeholder="Input..."></textarea>
                                        <textarea className="oj-output-textarea" placeholder="Output..." readOnly></textarea>
                                        <button className="oj-run-btn">Run Code</button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'leaderboard' && (
                            <div className="oj-section-card">
                                <h2>Global Leaderboard</h2>
                                <div className="oj-leaderboard-filters">
                                    <select className="oj-time-select">
                                        <option value="all">All Time</option>
                                        <option value="month">This Month</option>
                                        <option value="week">This Week</option>
                                    </select>
                                </div>
                                <div className="oj-leaderboard-table">
                                    <div className="oj-leaderboard-header">
                                        <span>Rank</span>
                                        <span>User</span>
                                        <span>Rating</span>
                                        <span>Solved</span>
                                    </div>
                                    {/* Add leaderboard entries here */}
                                </div>
                            </div>
                        )}

                        {activeTab === 'contests' && (
                            <div className="oj-section-card">
                                <h2>Contests</h2>
                                <div className="oj-contests-container">
                                    <div className="oj-contest-filters">
                                        <button className="oj-contest-filter active">Upcoming</button>
                                        <button className="oj-contest-filter">Past</button>
                                        <button className="oj-contest-filter">My Contests</button>
                                    </div>
                                    <div className="oj-contests-list">
                                        {/* Add contest items here */}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Home; 