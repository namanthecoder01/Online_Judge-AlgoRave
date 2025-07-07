import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from './Navbar';
import './Leaderboard.css';
import { badgeColors } from '../theme';
import { BACKEND_URL } from '../utils/apiEndpoints';

const Leaderboard = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('leaderboard');
    const [user, setUser] = useState(null);
    const [timeRange, setTimeRange] = useState('all');
    const [sortBy, setSortBy] = useState('rating');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedUser, setSelectedUser] = useState(null);
    const [allLeaderboardData, setAllLeaderboardData] = useState([]);
    const [leaderboardData, setLeaderboardData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const token = localStorage.getItem('token');
        const userData = localStorage.getItem('user');
        if (!token || !userData) {
            navigate('/');
            return;
        }
        setUser(JSON.parse(userData));
    }, [navigate]);

    // Effect to fetch all leaderboard data once
    useEffect(() => {
        const fetchAllLeaderboardData = async () => {
            if (!user) return;

            try {
                setLoading(true);
                setError(null);
                const token = localStorage.getItem('token');
                // Fetch all users by setting limit=0. Sort by rating initially.
                const response = await fetch(`${BACKEND_URL}/api/leaderboard?sortBy=rating&limit=0`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (!response.ok) {
                    throw new Error('Failed to fetch leaderboard data');
                }

                const data = await response.json();
                if (data.success) {
                    setAllLeaderboardData(data.leaderboard);
                } else {
                    setError(data.message);
                }
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        
        fetchAllLeaderboardData();
    }, [user]);

    // Effect to handle all client-side filtering and sorting
    useEffect(() => {
        let filteredData = [...allLeaderboardData];

        // 1. Filter by timeRange
        if (timeRange !== 'all') {
            const now = new Date();
            let startDate;
            
            switch (timeRange) {
                case 'day':
                    startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                    break;
                case 'week':
                    const dayOfWeek = now.getDay();
                    const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
                    startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - daysToSubtract);
                    startDate.setHours(0, 0, 0, 0);
                    break;
                case 'month':
                    startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                    break;
                default:
                    startDate = null;
            }
            
            if (startDate) {
                filteredData = filteredData.filter(entry => entry.updatedAt && new Date(entry.updatedAt) >= startDate);
            }
        }

        // 2. Filter by searchQuery
        if (searchQuery) {
            filteredData = filteredData.filter(entry =>
                entry.user && entry.user.username &&
                entry.user.username.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        // 3. Sort by sortBy
        const sortOrder = -1; // always descending
        filteredData.sort((a, b) => {
            if (a[sortBy] < b[sortBy]) return -1 * sortOrder;
            if (a[sortBy] > b[sortBy]) return 1 * sortOrder;
            return 0;
        });

        setLeaderboardData(filteredData);

    }, [searchQuery, sortBy, timeRange, allLeaderboardData]);

    const getBadgeColor = (badge) => badgeColors[badge] || '#fff';

    const getActivityColor = (position) => {
        switch (position) {
            case 1: return '#ffd700'; // gold
            case 2: return '#c0c0c0'; // silver
            case 3: return '#cd7f32'; // bronze
            default: return '#666666';
        }
    };

    const renderUserStats = (userData) => {
        const user = userData.user || userData; // Handle both structures
        return (
            <div className="user-stats-modal" onClick={() => setSelectedUser(null)}>
                <div className="user-stats-content" onClick={e => e.stopPropagation()}>
                    <button className="close-btn" onClick={() => setSelectedUser(null)}>×</button>
                    <div className="user-stats-header">
                        <h2 style={{ color: getBadgeColor(userData.badge) }}>
                            {user.username || `${user.firstname} ${user.lastname}`}
                        </h2>
                        <span className="user-badge">{userData.badge}</span>
                    </div>
                    <div className="user-stats-grid">
                        <div className="stat-item">
                            <h4>Global Rank</h4>
                            <p>#{userData.rank}</p>
                        </div>
                        <div className="stat-item">
                            <h4>Rating</h4>
                            <p>{userData.rating}</p>
                        </div>
                        <div className="stat-item">
                            <h4>Problems Solved</h4>
                            <p>{userData.solved}</p>
                        </div>
                        <div className="stat-item">
                            <h4>Contests</h4>
                            <p>{userData.contests}</p>
                        </div>
                    </div>
                    <div className="recent-activity">
                        <h3>Recent Contest Performance</h3>
                        <div className="activity-graph">
                            {userData.recentActivity && userData.recentActivity.length > 0 ? (
                                userData.recentActivity.map((position, index) => (
                                    <div 
                                        key={index} 
                                        className="activity-bar"
                                        style={{ 
                                            backgroundColor: getActivityColor(position),
                                            height: `${Math.max(20, (6 - position) * 20)}px`
                                        }}
                                        title={`Position: ${position}`}
                                    />
                                ))
                            ) : (
                                <p>No recent contest data available</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="solve-problem-bg">
            <Navbar activeTab={activeTab} setActiveTab={setActiveTab} user={user} />
            <div className="leaderboard-container">
                <div className="leaderboard-header">
                    <h1>Global Rankings</h1>
                    <div className="leaderboard-filters">
                        <div className="filter-row">
                            <select 
                                value={timeRange} 
                                onChange={(e) => setTimeRange(e.target.value)}
                                className="filter-select"
                                style={{ color: getBadgeColor(user?.badge) }}
                            >
                                <option value="all">All Time</option>
                                <option value="month">This Month</option>
                                <option value="week">This Week</option>
                                <option value="day">Today</option>
                            </select>
                            <select 
                                value={sortBy} 
                                onChange={(e) => setSortBy(e.target.value)}
                                className="filter-select"
                                style={{ color: getBadgeColor(user?.badge) }}
                            >
                                <option value="rating">Rating</option>
                                <option value="solved">Problems Solved</option>
                                <option value="contests">Contest Count</option>
                                <option value="winRate">Win Rate</option>
                            </select>
                        </div>
                        <div className="search-row">
                            <input
                                type="text"
                                placeholder="Search users..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="search-input"
                            />
                        </div>
                    </div>
                </div>

                {error && (
                    <div className="error-message">Error: {error}</div>
                )}

                {loading ? (
                    <div className="loading-message">Loading leaderboard...</div>
                ) : (
                    <>
                        <div className="leaderboard-table">
                            <div className="table-header">
                                <div className="rank-col">Rank</div>
                                <div className="user-col">User</div>
                                <div className="rating-col">Rating</div>
                                <div className="solved-col">Solved</div>
                                <div className="contests-col">Contests</div>
                                <div className="winrate-col">Win Rate</div>
                            </div>
                            <div className="table-body">
                                {leaderboardData.length === 0 ? (
                                    <div className="no-results-message">
                                        {searchQuery ? 
                                            `No users found for "${searchQuery}"` :
                                            'No users found'
                                        }
                                    </div>
                                ) : (
                                    leaderboardData.map((userData, index) => {
                                        const user = userData.user || userData; // Handle both structures
                                        return (
                                            <div 
                                                key={userData._id} 
                                                className="table-row"
                                                onClick={() => setSelectedUser(userData)}
                                            >
                                                <div className="rank-col">
                                                    <span className={`rank rank-${index + 1 <= 3 ? index + 1 : 'other'}`}>
                                                        #{index + 1}
                                                    </span>
                                                </div>
                                                <div className="user-col" style={{ color: getBadgeColor(userData.badge) }}>
                                                    <span className="username">
                                                        {user.username || `${user.firstname} ${user.lastname}`}
                                                    </span>
                                                    <span className="country">{userData.country}</span>
                                                </div>
                                                <div className="rating-col" style={{ color: getBadgeColor(userData.badge) }}>{userData.rating}</div>
                                                <div className="solved-col" style={{ color: getBadgeColor(userData.badge) }}>{userData.solved}</div>
                                                <div className="contests-col" style={{ color: getBadgeColor(userData.badge) }}>{userData.contests}</div>
                                                <div className="winrate-col" style={{ color: getBadgeColor(userData.badge) }}>{userData.winRate}%</div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                    </>
                )}

                {selectedUser && renderUserStats(selectedUser)}
            </div>
        </div>
    );
};

export default Leaderboard;