import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from './DataContext';
import GovernmentMapComponent from './GovernmentMapComponent';
import './Dashboard.css';

function GovernmentDashboard() {
  const [noticeTitle, setNoticeTitle] = useState('');
  const [noticeMessage, setNoticeMessage] = useState('');
  const navigate = useNavigate();
  const { notices, incidents, addNotice } = useData();

  useEffect(() => {
    const role = localStorage.getItem('userRole');
    if (!role || role !== 'Government') {
      navigate('/');
      return;
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('userRole');
    navigate('/');
  };

  const handlePublishNotice = () => {
    if (noticeTitle.trim() && noticeMessage.trim()) {
      addNotice(noticeTitle, noticeMessage);
      setNoticeTitle('');
      setNoticeMessage('');
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

  const handleMapMarkerClick = (item, type) => {
    console.log('Government clicked on:', item, type);
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Government Dashboard</h1>
        <button className="logout-button" onClick={handleLogout}>
          Logout
        </button>
      </div>
      
      <div className="dashboard-content">
        <div className="welcome-section">
          <h2>Welcome, Government Official!</h2>
          <p>Manage emergency response operations and coordinate resources.</p>
        </div>
        
        <div className="dashboard-grid">
          {/* Notice Posting Section */}
          <div className="dashboard-section">
            <h3>📢 Post Official Notice</h3>
            <div className="notice-form">
              <div className="form-group">
                <label>Title:</label>
                <input
                  type="text"
                  value={noticeTitle}
                  onChange={(e) => setNoticeTitle(e.target.value)}
                  placeholder="Enter notice title"
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label>Message:</label>
                <textarea
                  value={noticeMessage}
                  onChange={(e) => setNoticeMessage(e.target.value)}
                  placeholder="Enter notice message"
                  className="form-textarea"
                  rows="4"
                />
              </div>
              <button 
                className="publish-button"
                onClick={handlePublishNotice}
                disabled={!noticeTitle.trim() || !noticeMessage.trim()}
              >
                Publish Notice
              </button>
            </div>
          </div>

          {/* Posted Notices Section */}
          <div className="dashboard-section">
            <h3>📢 Posted Notices</h3>
            <div className="notices-list">
              {notices.length === 0 ? (
                <p className="no-data">No notices posted yet.</p>
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

          {/* Incident Monitoring Section */}
          <div className="dashboard-section full-width">
            <h3>🚨 Incident Monitoring</h3>
            <div className="incidents-list">
              {incidents.length === 0 ? (
                <p className="no-data">No incidents reported yet.</p>
              ) : (
                incidents.map(incident => (
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
                      <span className="reported-by">Reported by: {incident.reportedBy}</span>
                      <span className="timestamp">{incident.timestamp}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Map View Section */}
          <div className="dashboard-section full-width">
            <h3>🗺 Incident Map View</h3>
            <GovernmentMapComponent 
              incidents={incidents} 
              showResources={true}
              showUserLocation={false}
              onMarkerClick={handleMapMarkerClick}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default GovernmentDashboard;
