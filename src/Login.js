import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Login.css';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // Hardcoded credentials
  const credentials = {
    citizen: {
      email: 'citizen@emergency.gov',
      password: 'citizen123'
    },
    government: {
      email: 'gov@emergency.gov', 
      password: 'gov123'
    }
  };

  const handleLogin = () => {
    setError('');
    
    // Check citizen credentials
    if (email === credentials.citizen.email && password === credentials.citizen.password) {
      localStorage.setItem('userRole', 'Citizen');
      navigate('/citizen-dashboard');
      return;
    }
    
    // Check government credentials
    if (email === credentials.government.email && password === credentials.government.password) {
      localStorage.setItem('userRole', 'Government');
      navigate('/government-dashboard');
      return;
    }
    
    setError('Invalid email or password');
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h1>Emergency Response System</h1>
        <h2>Login</h2>
        
        <div className="form-group">
          <label htmlFor="email">Email:</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            className="form-input"
          />
        </div>

        <div className="form-group">
          <label htmlFor="password">Password:</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            className="form-input"
          />
        </div>

        {error && <div className="error-message">{error}</div>}

        <button 
          className="login-button" 
          onClick={handleLogin}
          disabled={!email || !password}
        >
          Login
        </button>

        
      </div>
    </div>
  );
}

export default Login;
