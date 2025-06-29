import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from './Navbar';
import bgImg from './Assets/bg_img.jpg';
import './Contests.css'; // Import the CSS file
import './SolveProblem.css'; // Reusing some styles
import { difficultyColors } from '../theme';

const Contests = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('contests');
    const [contestFilter, setContestFilter] = useState('upcoming');
    const [selectedContest, setSelectedContest] = useState(null);
    const [registeredContests, setRegisteredContests] = useState([]);
    const [contestResults, setContestResults] = useState({});
    const [contests, setContests] = useState({
        upcoming: [],
        ongoing: [],
        past: []
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [user, setUser] = useState(null);

    useEffect(() => {
        const token = localStorage.getItem('token');
        const userData = localStorage.getItem('user');
        if (!token || !userData) {
            navigate('/');
            return;
        }
        fetchContests();
        fetchUserRegisteredContests();
        setUser(JSON.parse(userData));
    }, [navigate]);

    // Effect to fetch contest results when a past contest is selected
    useEffect(() => {
        if (selectedContest && selectedContest.status === 'past') {
            fetchContestResults(selectedContest._id);
        }
    }, [selectedContest]);

    const fetchContests = async () => {
        try {
            setLoading(true);
            const response = await fetch('http://localhost:5000/api/contests');
            if (!response.ok) {
                throw new Error('Failed to fetch contests');
            }
            const data = await response.json();
            
            // Group contests by status
            const groupedContests = {
                upcoming: data.contests.filter(contest => contest.status === 'upcoming'),
                ongoing: data.contests.filter(contest => contest.status === 'ongoing'),
                past: data.contests.filter(contest => contest.status === 'past')
            };
            
            setContests(groupedContests);
        } catch (error) {
            setError('Failed to load contests');
        } finally {
            setLoading(false);
        }
    };

    const fetchUserRegisteredContests = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('http://localhost:5000/api/user/contests', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (response.ok) {
                const data = await response.json();
                setRegisteredContests(data.contests.map(contest => contest._id));
            }
        } catch (error) {
            console.error('Error fetching user contests:', error);
        }
    };

    const handleRegister = async (contestId) => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:5000/api/contests/${contestId}/register`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (response.ok) {
                setRegisteredContests([...registeredContests, contestId]);
                // Refresh contests to update participant count
                fetchContests();
            } else {
                const errorData = await response.json();
                alert(errorData.message || 'Failed to register for contest');
            }
        } catch (error) {
            console.error('Error registering for contest:', error);
            alert('Failed to register for contest');
        }
    };

    const handleUnregister = async (contestId) => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:5000/api/contests/${contestId}/unregister`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (response.ok) {
                setRegisteredContests(registeredContests.filter(id => id !== contestId));
                // Refresh contests to update participant count
                fetchContests();
            } else {
                const errorData = await response.json();
                alert(errorData.message || 'Failed to unregister from contest');
            }
        } catch (error) {
            console.error('Error unregistering from contest:', error);
            alert('Failed to unregister from contest');
        }
    };

    const handleEndContest = async (contestId) => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:5000/api/contests/${contestId}/end`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (response.ok) {
                alert('Contest ended successfully! Leaderboards have been updated.');
                fetchContests(); // Refresh contests
            } else {
                const errorData = await response.json();
                alert(errorData.message || 'Failed to end contest');
            }
        } catch (error) {
            console.error('Error ending contest:', error);
            alert('Failed to end contest');
        }
    };

    const fetchContestResults = async (contestId) => {
        try {
            const response = await fetch(`http://localhost:5000/api/contests/${contestId}/results`);
            const data = await response.json();

            if (response.ok && data.success) {
                setContestResults(prev => {
                    const newState = {
                        ...prev,
                        [contestId]: data.contestResults
                    };
                    return newState;
                });
            } else {
            }
        } catch (error) {
        }
    };

    const formatDuration = (minutes) => {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        if (hours > 0) {
            return `${hours}h ${mins}m`;
        }
        return `${mins}m`;
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleString('en-US', {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getDifficultyColor = (difficulty) => {
        switch (difficulty) {
            case 'easy': return difficultyColors.easy;
            case 'medium': return difficultyColors.medium;
            case 'hard': return difficultyColors.hard;
            default: return '#fff';
        }
    };

    const renderContestCard = (contest) => {
        const isRegistered = registeredContests.includes(contest._id);
        const isPast = contest.status === 'past';
        const isOngoing = contest.status === 'ongoing';

        return (
            <div 
                key={contest._id} 
                className="contest-card" 
                onClick={() => {
                    setSelectedContest(contest);
                    if (isPast) {
                        fetchContestResults(contest._id);
                    }
                }}
            >
                <div className="contest-header">
                    <h3>{contest.title}</h3>
                    <span className="contest-type">{contest.type}</span>
                </div>
                <div className="contest-info">
                    <div className="info-row">
                        <span className="info-label">Start Time:</span>
                        <span className="info-value">{formatDate(contest.startTime)}</span>
                    </div>
                    <div className="info-row">
                        <span className="info-label">Duration:</span>
                        <span className="info-value">{formatDuration(contest.durationMinutes)}</span>
                    </div>
                    <div className="info-row">
                        <span className="info-label">Difficulty:</span>
                        <span className={`info-value difficulty-${contest.difficulty.toLowerCase()}`} style={{ color: getDifficultyColor(contest.difficulty) }}>
                            {contest.difficulty.charAt(0).toUpperCase() + contest.difficulty.slice(1)}
                        </span>
                    </div>
                    <div className="info-row">
                        <span className="info-label">Participants:</span>
                        <span className="info-value">{contest.participants}</span>
                    </div>
                </div>
                {!isPast && (
                    <button
                        className={`contest-action-btn ${isRegistered ? 'registered' : ''} ${isOngoing ? 'ongoing' : ''}`}
                        onClick={(e) => {
                            e.stopPropagation();
                            isRegistered ? handleUnregister(contest._id) : handleRegister(contest._id);
                        }}
                        disabled={isOngoing}
                    >
                        {isOngoing ? 'In Progress' : isRegistered ? 'Unregister' : 'Register'}
                    </button>
                )}
            </div>
        );
    };

    const renderContestDetails = () => {
        if (!selectedContest) return null;

        const isCreator = user && selectedContest.createdBy && selectedContest.createdBy._id === user._id;
        const results = contestResults[selectedContest._id] || [];
        // Get the color for the current contest's difficulty
        const difficultyKey = selectedContest.difficulty?.toLowerCase();
        const themeColor = difficultyColors[difficultyKey] || '#fff';

        return (
            <div className="contest-details-overlay" onClick={() => setSelectedContest(null)}>
                <div className="contest-details" onClick={e => e.stopPropagation()}>
                    {/* Close button with theme color */}
                    <button 
                        className="close-btn" 
                        onClick={() => setSelectedContest(null)}
                        style={{
                            border: `2px solid ${themeColor}`,
                            color: themeColor,
                            boxShadow: `0 0 10px ${themeColor}`
                        }}
                    >
                        ×
                    </button>
                    <h2>{selectedContest.title}</h2>
                    <div className="details-content">
                        <p className="contest-description">{selectedContest.description}</p>
                        <div className="details-grid">
                            <div className="detail-item">
                                <h4>Start Time</h4>
                                <p>{formatDate(selectedContest.startTime)}</p>
                            </div>
                            <div className="detail-item">
                                <h4>Duration</h4>
                                <p>{formatDuration(selectedContest.durationMinutes)}</p>
                            </div>
                            <div className="detail-item">
                                <h4>Difficulty</h4>
                                <p style={{ color: getDifficultyColor(selectedContest.difficulty) }}>
                                    {selectedContest.difficulty.charAt(0).toUpperCase() + selectedContest.difficulty.slice(1)}
                                </p>
                            </div>
                            <div className="detail-item">
                                <h4>Type</h4>
                                <p>{selectedContest.type}</p>
                            </div>
                        </div>
                        {/* Prizes section with theme color */}
                        <div className="prizes-section">
                            <h4 style={{ color: themeColor }}>Prizes</h4>
                            <div className="prizes-grid">
                                {selectedContest.prizes.map((prize, index) => (
                                    <div 
                                        key={index} 
                                        className={`prize-item prize-${index + 1}`}
                                        style={{
                                            border: `2px solid ${themeColor}`,
                                            color: themeColor,
                                            background: 'transparent'
                                        }}
                                    >
                                        <div className="prize-position">{index + 1}</div>
                                        <div className="prize-value">{prize}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        
                        {/* Contest Actions */}
                        {isCreator && selectedContest.status === 'ongoing' && (
                            <div className="contest-actions">
                                <button 
                                    className="end-contest-btn"
                                    onClick={() => handleEndContest(selectedContest._id)}
                                >
                                    End Contest
                                </button>
                            </div>
                        )}
                        
                        {/* Contest Results */}
                        {(selectedContest.status === 'past') && (
                            <div className="contest-results-section">
                                <div className="results-header">
                                    <h4 style={{ color: themeColor }}>Contest Results</h4>
                                    <button 
                                        className="refresh-results-btn"
                                        style={{
                                            border: `2px solid ${themeColor}`,
                                            color: themeColor,
                                            background: 'transparent'
                                        }}
                                        onClick={() => fetchContestResults(selectedContest._id)}
                                    >
                                        Refresh Results
                                    </button>
                                </div>
                                {results.length > 0 ? (
                                    <div className="results-table">
                                        <div className="results-header-row" style={{ color: themeColor }}>
                                            <div className="result-rank">Rank</div>
                                            <div className="result-user">User</div>
                                            <div className="result-score">Score</div>
                                            <div className="result-problems">Problems</div>
                                            <div className="result-time">Time</div>
                                        </div>
                                        {results.map((result, index) => (
                                            <div key={result._id} className="result-row" style={{ borderBottom: `1px solid ${themeColor}55` }}>
                                                <div className="result-rank">
                                                    <span 
                                                        className={`rank rank-${index + 1 <= 3 ? index + 1 : 'other'}`}
                                                    >
                                                        #{index + 1}
                                                    </span>
                                                </div>
                                                <div className="result-user">
                                                    {result.user.firstname} {result.user.lastname}
                                                </div>
                                                <div className="result-score" style={{ color: '#fff' }}>{result.score}</div>
                                                <div className="result-problems">
                                                    {result.problemsSolved}/{result.totalProblems}
                                                </div>
                                                <div className="result-time">{result.timeTaken}m</div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p style={{ color: themeColor }}>No results available yet.</p>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    if (loading) {
        return (
            <div className="solve-problem-bg" style={{backgroundImage: `url(${bgImg})`}}>
                <Navbar activeTab={activeTab} setActiveTab={setActiveTab} user={user} />
                <div className="contests-container">
                    <div className="loading-message">Loading contests...</div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="solve-problem-bg" style={{backgroundImage: `url(${bgImg})`}}>
                <Navbar activeTab={activeTab} setActiveTab={setActiveTab} user={user} />
                <div className="contests-container">
                    <div className="error-message">{error}</div>
                </div>
            </div>
        );
    }

    return (
        <div className="solve-problem-bg" style={{backgroundImage: `url(${bgImg})`}}>
            <Navbar activeTab={activeTab} setActiveTab={setActiveTab} user={user} />
            <div className="contests-container">
                <div className="contests-header">
                    <h1>Competitive Programming Contests</h1>
                    <div className="contest-filters">
                        <button
                            className={`filter-btn ${contestFilter === 'upcoming' ? 'active' : ''}`}
                            onClick={() => setContestFilter('upcoming')}
                        >
                            Upcoming
                        </button>
                        <button
                            className={`filter-btn ${contestFilter === 'ongoing' ? 'active' : ''}`}
                            onClick={() => setContestFilter('ongoing')}
                        >
                            Ongoing
                        </button>
                        <button
                            className={`filter-btn ${contestFilter === 'past' ? 'active' : ''}`}
                            onClick={() => setContestFilter('past')}
                        >
                            Past
                        </button>
                    </div>
                </div>
                <div className="contests-grid">
                    {contests[contestFilter].length > 0 ? (
                        contests[contestFilter].map(contest => renderContestCard(contest))
                    ) : (
                        <div className="no-contests-message">
                            No {contestFilter} contests available.
                        </div>
                    )}
                </div>
                {renderContestDetails()}
            </div>
        </div>
    );
};

export default Contests; 