import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from './DataContext';
import VolunteerMapComponent from './VolunteerMapComponent';
import './Dashboard.css';

const VolunteerDashboard = ({ onLogout }) => {
  const navigate = useNavigate();
  const { incidents, addVolunteerResponse, getVolunteerResponse, getIncidentResponders } = useData();
  const [user, setUser] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [notifiedIncidentIds, setNotifiedIncidentIds] = useState(new Set()); // Track which incidents have been notified

  // Get user info from localStorage on mount
  useEffect(() => {
    const userRole = localStorage.getItem('userRole');
    const userEmail = localStorage.getItem('userEmail');
    
    if (userRole !== 'Volunteer' || !userEmail) {
      navigate('/');
      return;
    }
    
    setUser({ role: userRole, email: userEmail });
  }, [navigate]);

  // Update notifications when new incidents are added (prevent duplicates)
  useEffect(() => {
    // Check each incident and add notification only if not already notified
    incidents.forEach(incident => {
      if (incident && incident.id && !notifiedIncidentIds.has(incident.id)) {
        addNotification(incident);
        setNotifiedIncidentIds(prev => new Set([...prev, incident.id]));
      }
    });
  }, [incidents]);

  const addNotification = (incident) => {
    // Check if notification already exists for this incident
    setNotifications(prev => {
      const exists = prev.some(n => n.incidentId === incident.id);
      if (exists) {
        return prev; // Don't add duplicate
      }
      
      const notification = {
        id: Date.now(),
        message: `🚨 New ${incident.severity} ${incident.type} reported by ${incident.reportedBy}`,
        timestamp: new Date().toLocaleString(),
        incidentId: incident.id,
        severity: incident.severity,
        incident: incident // Store full incident data
      };

      return [notification, ...prev].slice(0, 10); // Keep last 10 notifications
    });
  };

  const handleRespondToIncident = (incidentId) => {
    if (!user || !user.email) return;
    
    const responded = addVolunteerResponse(incidentId, user.email);
    if (responded) {
      alert(`✅ You are now responding to this incident!`);
    } else {
      alert(`ℹ️ You are no longer responding to this incident.`);
    }
  };

  const removeNotification = (notificationId) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
  };

  const handleLogout = () => {
    localStorage.removeItem('userRole');
    localStorage.removeItem('userEmail');
    navigate('/');
  };

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h1>🚑 Volunteer Dashboard</h1>
        <div className="user-info">
          <span>Welcome, {user.email}</span>
          <button onClick={handleLogout} className="logout-btn">Logout</button>
        </div>
      </header>

      <div className="dashboard-content">
        {/* Real-time Notifications */}
        <div className="notifications-panel">
          <h3>🚨 Real-time Notifications</h3>
          <div className="notifications-list">
            {notifications.length === 0 ? (
              <p className="no-notifications">No new notifications</p>
            ) : (
              notifications.map(notification => {
                const isResponding = notification.incidentId && user ? 
                  getVolunteerResponse(notification.incidentId, user.email) : false;
                const responders = notification.incidentId ? 
                  getIncidentResponders(notification.incidentId) : [];
                
                return (
                  <div 
                    key={notification.id} 
                    className={`notification-item ${notification.severity.toLowerCase()}`}
                  >
                    <div className="notification-content">
                      <p>{notification.message}</p>
                      <small>{notification.timestamp}</small>
                      {notification.incidentId && (
                        <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                          <button
                            onClick={() => handleRespondToIncident(notification.incidentId)}
                            style={{
                              padding: '0.4rem 0.8rem',
                              background: isResponding ? '#27ae60' : '#667eea',
                              color: 'white',
                              border: 'none',
                              borderRadius: '5px',
                              cursor: 'pointer',
                              fontSize: '0.85rem',
                              fontWeight: '500'
                            }}
                          >
                            {isResponding ? '✓ Responding' : '→ Respond to Incident'}
                          </button>
                          {responders.length > 0 && (
                            <span style={{ fontSize: '0.8rem', color: '#666' }}>
                              {responders.length} volunteer{responders.length > 1 ? 's' : ''} responding
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    <button 
                      onClick={() => removeNotification(notification.id)}
                      className="notification-close"
                    >
                      ×
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Volunteer Map */}
        <div className="map-section">
          <VolunteerMapComponent 
            incidents={incidents}
            volunteerEmail={user?.email}
            onMarkerClick={(incident) => {
              console.log('Volunteer clicked on incident:', incident);
            }}
            onRespondToIncident={handleRespondToIncident}
            getVolunteerResponse={getVolunteerResponse}
            getIncidentResponders={getIncidentResponders}
          />
        </div>
      </div>

      {/* Incident Summary */}
      <div className="incident-summary">
        <h3>📊 Incident Summary</h3>
        <div className="summary-stats">
          <div className="stat-item">
            <span className="stat-number">{incidents.filter(i => i.severity === 'Critical').length}</span>
            <span className="stat-label">Critical</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">{incidents.filter(i => i.severity === 'Medium').length}</span>
            <span className="stat-label">Medium</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">{incidents.filter(i => i.severity === 'Low').length}</span>
            <span className="stat-label">Low</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">{incidents.length}</span>
            <span className="stat-label">Total</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VolunteerDashboard;
