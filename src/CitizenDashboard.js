import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from './DataContext';
import './Dashboard.css';

function CitizenDashboard() {
  const [userRole, setUserRole] = useState('');
  const [incidentType, setIncidentType] = useState('');
  const [incidentDescription, setIncidentDescription] = useState('');
  const [incidentSeverity, setIncidentSeverity] = useState('Low');
  const navigate = useNavigate();
  const { notices, incidents, addIncident } = useData();

  useEffect(() => {
    const role = localStorage.getItem('userRole');
    if (!role || role !== 'Citizen') {
      navigate('/');
      return;
    }
    setUserRole(role);
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('userRole');
    navigate('/');
  };

  const handleReportIncident = () => {
    if (incidentType && incidentDescription.trim()) {
      addIncident(incidentType, incidentDescription, incidentSeverity);
      setIncidentType('');
      setIncidentDescription('');
      setIncidentSeverity('Low');
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'Critical': return '#e74c3c';
      case 'Medium': return '#f39c12';
      case 'Low': return '#27ae60';
      default: return '#666';
    }
  };

  const citizenIncidents = incidents.filter(incident => incident.reportedBy === 'Citizen');

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Citizen Dashboard</h1>
        <button className="logout-button" onClick={handleLogout}>
          Logout
        </button>
      </div>
      
      <div className="dashboard-content">
        <div className="welcome-section">
          <h2>Welcome, Citizen!</h2>
          <p>Access emergency services and stay informed about your community.</p>
        </div>
        
        <div className="dashboard-grid">
          {/* Government Notices Section */}
          <div className="dashboard-section">
            <h3>Government Notices</h3>
            <div className="notices-list">
              {notices.length === 0 ? (
                <p className="no-data">No government notices available.</p>
              ) : (
                notices.map(notice => (
                  <div key={notice.id} className="notice-item">
                    <h4>{notice.title}</h4>
                    <p>{notice.message}</p>
                    <span className="timestamp">{notice.timestamp}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Report Incident Section */}
          <div className="dashboard-section">
            <h3>Report an Incident</h3>
            <div className="incident-form">
              <div className="form-group">
                <label>Incident Type:</label>
                <select
                  value={incidentType}
                  onChange={(e) => setIncidentType(e.target.value)}
                  className="form-input"
                >
                  <option value="">Select incident type</option>
                  <option value="Fire">Fire</option>
                  <option value="Medical Emergency">Medical Emergency</option>
                  <option value="Accident">Accident</option>
                  <option value="Crime">Crime</option>
                  <option value="Natural Disaster">Natural Disaster</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div className="form-group">
                <label>Description:</label>
                <textarea
                  value={incidentDescription}
                  onChange={(e) => setIncidentDescription(e.target.value)}
                  placeholder="Describe the incident"
                  className="form-textarea"
                  rows="4"
                />
              </div>
              <div className="form-group">
                <label>Severity:</label>
                <div className="severity-options">
                  <label className="severity-option">
                    <input
                      type="radio"
                      name="severity"
                      value="Low"
                      checked={incidentSeverity === 'Low'}
                      onChange={(e) => setIncidentSeverity(e.target.value)}
                    />
                    Low
                  </label>
                  <label className="severity-option">
                    <input
                      type="radio"
                      name="severity"
                      value="Medium"
                      checked={incidentSeverity === 'Medium'}
                      onChange={(e) => setIncidentSeverity(e.target.value)}
                    />
                    Medium
                  </label>
                  <label className="severity-option">
                    <input
                      type="radio"
                      name="severity"
                      value="Critical"
                      checked={incidentSeverity === 'Critical'}
                      onChange={(e) => setIncidentSeverity(e.target.value)}
                    />
                    Critical
                  </label>
                </div>
              </div>
              <button 
                className="submit-button"
                onClick={handleReportIncident}
                disabled={!incidentType || !incidentDescription.trim()}
              >
                Submit Incident
              </button>
            </div>
          </div>

          {/* My Reported Incidents Section */}
          <div className="dashboard-section full-width">
            <h3>My Reported Incidents</h3>
            <div className="incidents-list">
              {citizenIncidents.length === 0 ? (
                <p className="no-data">You haven't reported any incidents yet.</p>
              ) : (
                citizenIncidents.map(incident => (
                  <div key={incident.id} className="incident-item">
                    <div className="incident-header">
                      <span className="incident-type">{incident.type}</span>
                      <span 
                        className="severity-badge"
                        style={{ backgroundColor: getSeverityColor(incident.severity) }}
                      >
                        {incident.severity}
                      </span>
                    </div>
                    <p className="incident-description">{incident.description}</p>
                    <div className="incident-footer">
                      <span className="reported-by">Reported by: You</span>
                      <span className="timestamp">{incident.timestamp}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CitizenDashboard;
