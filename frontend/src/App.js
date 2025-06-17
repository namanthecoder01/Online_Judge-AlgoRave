import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import AuthForm from './Components/AuthForm';
import Home from './Components/Home';
import LandingPage from './Components/LandingPage';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<AuthForm />} />
          <Route path="/home" element={<Home />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
