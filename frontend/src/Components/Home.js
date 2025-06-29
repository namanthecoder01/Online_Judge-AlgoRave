import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from './Navbar';
import './Home.css';
import { difficultyColors, badgeLogos } from '../theme';
import { MOTIVATIONS } from '../utils/motivations';

// Hack-themed animated bar chart component
const HackBarChart = ({ easy, medium, hard, totalEasy, totalMedium, totalHard, easyLabel, mediumLabel, hardLabel }) => {
    // Find the max for scaling
    const max = Math.max(easy, medium, hard, 1);
    return (
        <div className="hack-bar-chart">
            <div className="hack-bar-label" style={{ color: difficultyColors.easy }}>Easy</div>
            <div className="hack-bar hack-bar-easy" style={{ width: `${(easy / max) * 100}%`, borderColor: difficultyColors.easy, background: `linear-gradient(90deg, ${difficultyColors.easy} 60%, #003f1f 100%)`, color: difficultyColors.easy, boxShadow: `0 0 18px ${difficultyColors.easy}` }}>
                <span>{easyLabel}</span>
            </div>
            <div className="hack-bar-label" style={{ color: difficultyColors.medium }}>Medium</div>
            <div className="hack-bar hack-bar-medium" style={{ width: `${(medium / max) * 100}%`, borderColor: difficultyColors.medium, background: `linear-gradient(90deg, ${difficultyColors.medium} 60%, #3f3f00 100%)`, color: difficultyColors.medium, boxShadow: `0 0 18px ${difficultyColors.medium}` }}>
                <span>{mediumLabel}</span>
            </div>
            <div className="hack-bar-label" style={{ color: difficultyColors.hard }}>Hard</div>
            <div className="hack-bar hack-bar-hard" style={{ width: `${(hard / max) * 100}%`, borderColor: difficultyColors.hard, background: `linear-gradient(90deg, ${difficultyColors.hard} 60%, #3f0030 100%)`, color: difficultyColors.hard, boxShadow: `0 0 18px ${difficultyColors.hard}` }}>
                <span>{hardLabel}</span>
            </div>
        </div>
    );
};

const Home = () => {
    const [user, setUser] = useState(null);
    const [problems, setProblems] = useState([]);
    const [problemsLoading, setProblemsLoading] = useState(true);
    const [problemsError, setProblemsError] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [difficultyFilter, setDifficultyFilter] = useState('');
    const [userStats, setUserStats] = useState(null);
    const [leaderboardStats, setLeaderboardStats] = useState(null);
    const [userRank, setUserRank] = useState(null);
    const navigate = useNavigate();
    const [motivation, setMotivation] = useState("");

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/');
            return;
        }
        fetch('http://localhost:5000/api/user/profile', {
            headers: { 'Authorization': `Bearer ${token}` }
        })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    setUser(data.user);
                } else {
                    navigate('/');
                }
            })
            .catch(() => navigate('/'));
    }, [navigate]);

    // Always refresh user stats when Home is visited
    useEffect(() => {
        const fetchUserStats = async () => {
            try {
                const token = localStorage.getItem('token');
                const response = await fetch('http://localhost:5000/api/user/stats', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const data = await response.json();
                if (data.success) {
                    setUserStats(data.stats);
                }
            } catch (err) {
                console.error('Error fetching user stats:', err);
            }
        };
        fetchUserStats();
    }, [user]);

    useEffect(() => {
        const fetchProblems = async () => {
            try {
                const response = await fetch('http://localhost:5000/api/problems');
                const data = await response.json();
                if (data.success) {
                    setProblems(data.problems);
                } else {
                    setProblemsError('Failed to fetch problems');
                }
            } catch (err) {
                setProblemsError('Error connecting to server');
            } finally {
                setProblemsLoading(false);
            }
        };
        fetchProblems();
    }, []);

    useEffect(() => {
        // Set a random motivation on mount or when problem list is shown
        setMotivation(MOTIVATIONS[Math.floor(Math.random() * MOTIVATIONS.length)]);
    }, []);

    // Fetch leaderboard stats for user
    useEffect(() => {
        if (user) {
            fetch(`http://localhost:5000/api/leaderboard?limit=1000`)
                .then(res => res.json())
                .then(data => {
                    if (data.success && Array.isArray(data.leaderboard)) {
                        const entry = data.leaderboard.find(e => e.user && e.user._id === user._id);
                        if (entry) setUserRank(entry.rank);
                    }
                });
            fetch(`http://localhost:5000/api/leaderboard/user/${user._id}`)
                .then(res => res.json())
                .then(data => {
                    if (data.success) setLeaderboardStats(data.userStats);
                });
        }
    }, [user]);

    // Filter problems by difficulty
    const filteredProblems = problems.filter(problem =>
        (!difficultyFilter || problem.difficulty === difficultyFilter) &&
        (!searchQuery || problem.name.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    // Compute solved problems by difficulty
    let solvedByDifficulty = { easy: 0, medium: 0, hard: 0 };
    let totalByDifficulty = { easy: 0, medium: 0, hard: 0 };
    if (problems.length > 0) {
        problems.forEach(problem => {
            if (problem.difficulty === 'easy') totalByDifficulty.easy++;
            else if (problem.difficulty === 'medium') totalByDifficulty.medium++;
            else if (problem.difficulty === 'hard') totalByDifficulty.hard++;
        });
        if (user && user.solvedProblems && user.solvedProblems.length > 0) {
            const solvedSet = new Set(user.solvedProblems.map(id => id.toString()));
            problems.forEach(problem => {
                if (solvedSet.has(problem._id.toString())) {
                    if (problem.difficulty === 'easy') solvedByDifficulty.easy++;
                    else if (problem.difficulty === 'medium') solvedByDifficulty.medium++;
                    else if (problem.difficulty === 'hard') solvedByDifficulty.hard++;
                }
            });
        }
    }
    const easyLabel = `${solvedByDifficulty.easy}/${totalByDifficulty.easy}`;
    const mediumLabel = `${solvedByDifficulty.medium}/${totalByDifficulty.medium}`;
    const hardLabel = `${solvedByDifficulty.hard}/${totalByDifficulty.hard}`;

    if (!user) return <div className="loading">Loading...</div>;

    return (
        <div className="oj-home-bg">
            <Navbar user={user} />
            <div className="oj-dashboard oj-content-below-navbar">
                <div className="oj-welcome-banner">
                    <div className="oj-welcome-icon">💻</div>
                    <div>
                        <h1>Welcome, {user.firstname}!</h1>
                        <div className="oj-welcome-sub">Ready to solve some problems today?</div>
                    </div>
                </div>

                <div className="oj-main-content">
                    <div className="oj-sidebar">
                        <div className={`oj-profile-card oj-hacker-theme`}>
                            <div className="oj-profile-header">
                                <div className="oj-profile-badge-logo">
                                    <img 
                                        src={badgeLogos[user.badge] || badgeLogos['Code Novice']} 
                                        alt={user.badge} 
                                        style={{ width: 48, height: 48 }} 
                                    />
                                </div>
                                <div className="oj-profile-info">
                                    <div className="oj-profile-bio-badge">
                                        <span className="oj-badge">{user.badge || 'No Badge'}</span>
                                        <span className="oj-bio">{user.bio || 'No bio set.'}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="oj-profile-stats">
                                <div className="oj-stat-item">
                                    <span className="oj-stat-label">Rating</span>
                                    <span className="oj-stat-value" style={{ color: 'var(--glow-color, #00FF00)' }}>{leaderboardStats ? leaderboardStats.rating : 1500}</span>
                                </div>
                                <div className="oj-stat-item">
                                    <span className="oj-stat-label">Solved</span>
                                    <span className="oj-stat-value" style={{ color: 'var(--glow-color, #00FF00)' }}>{userStats?.problemsSolved || 0}</span>
                                </div>
                                <div className="oj-stat-item">
                                    <span className="oj-stat-label">Rank</span>
                                    <span className="oj-stat-value" style={{ color: 'var(--glow-color, #00FF00)' }}>{userRank ? `#${userRank}` : '#N/A'}</span>
                                </div>
                            </div>
                        </div>

                        <div className="hack-bar-chart-container">
                            <h3 className="hack-bar-title">Problems Solved</h3>
                            <HackBarChart
                                easy={solvedByDifficulty.easy}
                                medium={solvedByDifficulty.medium}
                                hard={solvedByDifficulty.hard}
                                totalEasy={totalByDifficulty.easy}
                                totalMedium={totalByDifficulty.medium}
                                totalHard={totalByDifficulty.hard}
                                easyLabel={easyLabel}
                                mediumLabel={mediumLabel}
                                hardLabel={hardLabel}
                            />
                        </div>
                    </div>

                    <div className="oj-content-area">
                        <div className="oj-section-card fade-in-problems">
                            <h2>Problem Set</h2>
                            <div className="oj-motivation">{motivation}</div>
                            <div className="oj-problem-filters">
                                <input type="text" placeholder="Search problems..." className="oj-search-input" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}/>
                                <select className="oj-difficulty-select" value={difficultyFilter} onChange={e => setDifficultyFilter(e.target.value)}>
                                    <option value="">All Difficulties</option>
                                    <option value="easy">Easy</option>
                                    <option value="medium">Medium</option>
                                    <option value="hard">Hard</option>
                                </select>
                            </div>
                            <div className="oj-problems-list">
                                {problemsLoading && <div>Loading problems...</div>}
                                {problemsError && <div className="error">{problemsError}</div>}
                                {!problemsLoading && !problemsError && filteredProblems.length === 0 && (
                                    <div>No problems found.</div>
                                )}
                                {!problemsLoading && !problemsError && filteredProblems.map((problem) => {
                                    const isSolved = user.solvedProblems && user.solvedProblems.includes(problem._id);
                                    // Set tag color from theme
                                    let tagStyle = {};
                                    if (problem.difficulty === 'easy') tagStyle = { background: difficultyColors.easy, color: '#000', boxShadow: `0 0 6px ${difficultyColors.easy}` };
                                    if (problem.difficulty === 'medium') tagStyle = { background: difficultyColors.medium, color: '#000', boxShadow: `0 0 6px ${difficultyColors.medium}` };
                                    if (problem.difficulty === 'hard') tagStyle = { background: difficultyColors.hard, color: '#000', boxShadow: `0 0 6px ${difficultyColors.hard}` };
                                    return (
                                        <div className="oj-problem-item" key={problem._id} onClick={() => navigate(`/solve/${problem.code}`)} style={{cursor: 'pointer', position: 'relative'}}>
                                            <span className="oj-problem-title">{problem.name}</span>
                                            <span className={`oj-problem-difficulty ${problem.difficulty}`} style={tagStyle}>{problem.difficulty}</span>
                                            {isSolved && (
                                                <span style={{
                                                    color: '#fff',
                                                    fontWeight: 'bold',
                                                    fontSize: 22,
                                                    position: 'absolute',
                                                    right: 16,
                                                    top: '50%',
                                                    transform: 'translateY(-50%)',
                                                    textShadow: '0 0 8px #fff'
                                                }}>✔</span>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Home;