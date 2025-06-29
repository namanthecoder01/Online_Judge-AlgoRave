import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from './Navbar';
import { syncUserProfile } from '../utils/userSync';
import './Profile.css';
import { badgeColors, badgeLogos } from '../theme';

const Profile = () => {
    const [user, setUser] = useState(null);
    const [form, setForm] = useState({ bio: '', college: '', country: '', preferredLanguages: '' });
    const [editMode, setEditMode] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [activeTab, setActiveTab] = useState('profile');
    const [userStats, setUserStats] = useState(null);
    const navigate = useNavigate();

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
                    setForm({
                        bio: data.user.bio || '',
                        college: data.user.college || '',
                        country: data.user.country || '',
                        preferredLanguages: (data.user.preferredLanguages || []).join(', ')
                    });
                } else {
                    setError(data.message || 'Failed to fetch profile');
                }
                setLoading(false);
            })
            .catch(() => {
                setError('Error connecting to server');
                setLoading(false);
            });
    }, [navigate]);

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

        if (user && activeTab === 'profile') {
            fetchUserStats();
        }
    }, [user, activeTab]);

    const handleChange = e => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async e => {
        e.preventDefault();
        setSuccess(null);
        setError(null);
        const token = localStorage.getItem('token');
        try {
            const res = await fetch('http://localhost:5000/api/user/profile', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    ...form,
                    preferredLanguages: form.preferredLanguages.split(',').map(l => l.trim()).filter(Boolean)
                })
            });
            const data = await res.json();
            if (data.success) {
                setUser(data.user);
                setEditMode(false);
                setSuccess('Profile updated successfully!');
                await syncUserProfile(token);
            } else {
                setError(data.message || 'Failed to update profile');
            }
        } catch {
            setError('Error updating profile');
        }
    };

    // Badge color class logic
    const getBadgeClass = (badge) => {
        if (!badge) return 'oj-badge-default';
        const b = badge.toLowerCase();
        if (b.includes('gold')) return 'oj-badge-gold';
        if (b.includes('silver')) return 'oj-badge-silver';
        if (b.includes('bronze')) return 'oj-badge-bronze';
        return 'oj-badge-default';
    };

    const getBadgeColor = (badge) => badgeColors[badge] || '#fff';

    if (loading) return <div className="loading">Loading profile...</div>;
    if (error) return <div className="error">{error}</div>;
    if (!user) return null;

    // Get badge color for current user
    const badgeGlowColor = getBadgeColor(user.badge);

    return (
        <div className="oj-profile-bg" style={{ '--oj-badge-glow': badgeGlowColor }}>
            <Navbar activeTab={activeTab} setActiveTab={setActiveTab} user={user} />
            <div className="oj-profile-page oj-profile-page-padded oj-content-below-navbar">
                {/* Header Card */}
                <div className="oj-profile-header-card">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
                        <img 
                            src={badgeLogos[user.badge] || badgeLogos['Code Novice']} 
                            alt={user.badge} 
                            style={{ width: 64, height: 64 }} 
                        />
                        <div>
                            <div className="oj-profile-header-name">{user.firstname} {user.lastname}</div>
                            <div className="oj-profile-header-username">@{user.username}</div>
                            <div className="oj-profile-header-email">{user.email}</div>
                            <div className="oj-profile-header-badges">
                                <span className={`oj-badge ${getBadgeClass(user.badge)}`}>{user.badge || 'No Badge'}</span>
                                <span className="oj-solved">Problems Solved: <b>{userStats?.problemsSolved || 0}</b></span>
                            </div>
                        </div>
                    </div>
                </div>
                {/* Statistics Card */}
                {userStats && (
                    <div className="oj-stats-card">
                        <div className="oj-profile-section-title">Statistics</div>
                        <div className="oj-stats-grid">
                            <div className="oj-stat-card">
                                <div className="oj-stat-value">{userStats.totalSubmissions}</div>
                                <div className="oj-stat-label">Total Submissions</div>
                            </div>
                            <div className="oj-stat-card">
                                <div className="oj-stat-value">{userStats.correctSubmissions}</div>
                                <div className="oj-stat-label">Correct Submissions</div>
                            </div>
                            <div className="oj-stat-card">
                                <div className="oj-stat-value">{userStats.contestsParticipated}</div>
                                <div className="oj-stat-label">Contests Participated</div>
                            </div>
                            <div className="oj-stat-card">
                                <div className="oj-stat-value" style={{ color: getBadgeColor(userStats.badge) }}>
                                    {userStats.rating || 1500}
                                </div>
                                <div className="oj-stat-label">Rating</div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Main Details */}
                <div style={{ background: 'rgba(0,0,0,0.6)', padding: '2rem', borderRadius: '16px', marginTop: '2rem', boxShadow: '0 0 24px var(--oj-badge-glow, #00ff41), 0 0 4px var(--oj-badge-glow, #00ff41)', border: '2px solid var(--oj-badge-glow, #00ff41)' }}>
                    <form className="oj-profile-form" onSubmit={handleSubmit}>
                        <div className="oj-profile-section-title">Profile Details</div>
                        <label>Bio:<br/>
                            <textarea name="bio" value={form.bio} onChange={handleChange} disabled={!editMode} maxLength={300} />
                        </label>
                        <label>College:<br/>
                            <input name="college" value={form.college} onChange={handleChange} disabled={!editMode} maxLength={100} />
                        </label>
                        <label>Country:<br/>
                            <input name="country" value={form.country} onChange={handleChange} disabled={!editMode} maxLength={56} />
                        </label>
                        <label>Preferred Languages (comma separated):<br/>
                            <input name="preferredLanguages" value={form.preferredLanguages} onChange={handleChange} disabled={!editMode} />
                        </label>
                        {editMode && (
                            <div className="oj-profile-actions">
                                <button type="submit" className="oj-save-btn">Save</button>
                                <button type="button" className="oj-cancel-btn" onClick={() => { setEditMode(false); setForm({
                                    bio: user.bio || '',
                                    college: user.college || '',
                                    country: user.country || '',
                                    preferredLanguages: (user.preferredLanguages || []).join(', ')
                                }); }}>Cancel</button>
                            </div>
                        )}
                        {success && <div className="success">{success}</div>}
                        {error && <div className="error">{error}</div>}
                    </form>
                    {!editMode && (
                        <div className="oj-profile-actions">
                            <button type="button" className="oj-edit-btn" onClick={() => setEditMode(true)}>Edit Profile</button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Profile; 