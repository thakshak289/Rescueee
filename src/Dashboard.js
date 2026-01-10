import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css';

function Dashboard() {
  const [userRole, setUserRole] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const role = localStorage.getItem('userRole');
    if (!role) {
      navigate('/');
      return;
    }
    setUserRole(role);
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('userRole');
    navigate('/');
  };

  const getDashboardTitle = () => {
    switch (userRole) {
      case 'Citizen':
        return 'Citizen Dashboard';
      case 'Volunteer':
        return 'Volunteer Dashboard';
      case 'Agency':
        return 'Agency Dashboard';
      case 'Admin':
        return 'Admin Dashboard';
      default:
        return 'Dashboard';
    }
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>{getDashboardTitle()}</h1>
        <button className="logout-button" onClick={handleLogout}>
          Logout
        </button>
      </div>
      
      <div className="dashboard-content">
        <div className="welcome-section">
          <h2>Welcome, {userRole}!</h2>
          <p>This is your personalized emergency response dashboard.</p>
        </div>
        
        <div className="dashboard-cards">
          <div className="dashboard-card">
            <h3>Emergency Status</h3>
            <p>All systems operational</p>
          </div>
          <div className="dashboard-card">
            <h3>Active Alerts</h3>
            <p>No active alerts in your area</p>
          </div>
          <div className="dashboard-card">
            <h3>Resources</h3>
            <p>Emergency contacts and resources available</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
