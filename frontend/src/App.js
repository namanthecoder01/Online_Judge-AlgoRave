import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import AuthForm from './Components/AuthForm';
import Home from './Components/Home';
import LandingPage from './Components/LandingPage';
import SolveProblem from './Components/SolveProblem';
import Compiler from './Components/Compiler';
import Contests from './Components/Contests';
import Leaderboard from './Components/Leaderboard';
import Profile from './Components/Profile';
import AdminLogin from './Components/AdminLogin';
import AdminDashboard from './Components/AdminDashboard';
import './App.css';
import { badgeColors } from './theme';

function App() {
  const [user, setUser] = useState(() => {
    const userData = localStorage.getItem('user');
    return userData ? JSON.parse(userData) : {};
  });

  // Update user state when localStorage changes (polling every second)
  useEffect(() => {
    const interval = setInterval(() => {
      const userData = localStorage.getItem('user');
      if (userData) {
        const parsed = JSON.parse(userData);
        setUser(prev => (JSON.stringify(prev) !== userData ? parsed : prev));
      }
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Change glow color based on badge
  useEffect(() => {
    const glow = badgeColors[user.badge] || '#00FF00'; // Default color
    document.documentElement.style.setProperty('--glow-color', glow);
  }, [user.badge]);

  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<AuthForm />} />
          <Route path="/home" element={<Home />} />
          <Route path="/solve/:code" element={<SolveProblem />} />
          <Route path="/compiler" element={<Compiler />} />
          <Route path="/contests" element={<Contests />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;