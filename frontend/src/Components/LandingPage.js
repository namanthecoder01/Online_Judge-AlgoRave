import React from 'react';
import { useNavigate } from 'react-router-dom';
import './LandingPage.css';
import logo from './Assets/logo.jpg';

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="landing-container">
      <div className="landing-content">
        <div className="logo-container">
          <img src={logo} alt="AlgoRave Logo" className="logo-img" />
          <h1>AlgoRave</h1>
        </div>
        <h2>Your Ultimate Online Judge Platform</h2>
        <p className="subtitle">Sharpen your coding skills, compete with others, and become a problem-solving pro!</p>

        <div className="features">
          <div className="feature-card">
            <h3>Practice Problems</h3>
            <p>Access a vast collection of algorithmic problems to enhance your coding skills</p>
          </div>
          <div className="feature-card">
            <h3>Real-time Evaluation</h3>
            <p>Get instant feedback on your solutions with our powerful online judge system</p>
          </div>
          <div className="feature-card">
            <h3>Track Progress</h3>
            <p>Monitor your improvement with detailed statistics and performance metrics</p>
          </div>
        </div>

        <div className="cta-section">
          <p>Ready to start your coding journey?</p>
          <button 
            className="login-button prominent"
            onClick={() => navigate('/login')}
          >
            Get Started Now
          </button>
        </div>
      </div>
    </div>
  );
};

export default LandingPage; 