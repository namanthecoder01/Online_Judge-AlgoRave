import React from 'react';
import { useNavigate } from 'react-router-dom';
import './LandingPage.css';

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="landing-container">
      <div className="landing-content">
        <h1>Welcome to AlgoRave</h1>
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

        <div className="how-it-works">
          <h2>How It Works</h2>
          <div className="steps">
            <div className="step">
              <span className="step-icon" role="img" aria-label="signup">📝</span>
              <p>Sign up or log in to your account</p>
            </div>
            <div className="step">
              <span className="step-icon" role="img" aria-label="solve">💡</span>
              <p>Pick problems and submit your solutions</p>
            </div>
            <div className="step">
              <span className="step-icon" role="img" aria-label="trophy">🏆</span>
              <p>Climb the leaderboard and track your progress</p>
            </div>
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