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
        <div style={{ display: "flex", justifyContent: "center", marginTop: "25px", marginBottom: "30px" }}>
  <div
    style={{
      width: "300px",
      padding: "18px",
      borderRadius: "14px",
      color: "white",
      background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      boxShadow: "0 10px 25px rgba(0,0,0,0.25)",
      textAlign: "center",
      fontFamily: "Arial"
    }}
  >
    <h3 style={{ marginBottom: "12px" }}>Demo Login</h3>

    <div>
      <strong>Citizen</strong><br />
      Username: <span style={{ color: "#ffeaa7" }}>citizen</span><br />
      Password: <span style={{ color: "#ffeaa7" }}>123</span>
    </div>

    <hr style={{ margin: "12px 0", border: "0.5px solid rgba(255,255,255,0.4)" }} />

    <div>
      <strong>Government</strong><br />
      Username: <span style={{ color: "#ffeaa7" }}>government</span><br />
      Password: <span style={{ color: "#ffeaa7" }}>123</span>
    </div>

    <hr style={{ margin: "12px 0", border: "0.5px solid rgba(255,255,255,0.4)" }} />

    <div>
      <strong>Volunteer</strong><br />
      Username: <span style={{ color: "#ffeaa7" }}>volunteer</span><br />
      Password: <span style={{ color: "#ffeaa7" }}>123</span>
    </div>
  </div>
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
