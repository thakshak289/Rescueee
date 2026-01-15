import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from './DataContext';
import CitizenMapComponent from './CitizenMapComponent';

import './Dashboard.css';

function CitizenDashboard() {
  const [incidentType, setIncidentType] = useState('');
  const [incidentDescription, setIncidentDescription] = useState('');
  const [incidentSeverity, setIncidentSeverity] = useState('Low');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const navigate = useNavigate();
  const { notices, incidents, addIncident } = useData();

  useEffect(() => {
    const role = localStorage.getItem('userRole');
    if (!role || role !== 'Citizen') {
      navigate('/');
      return;
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('userRole');
    navigate('/');
  };

  const handleLocationUpdate = (location) => {
    setUserLocation(location);
    console.log('📍 Location updated in dashboard:', location);
  };

  const handleReportIncident = () => {
    if (incidentType && incidentDescription.trim() && !isSubmitting) {
      setIsSubmitting(true);
      
      // Use location from map component if available, otherwise try to get it
      if (userLocation) {
        console.log('📍 Reporting incident using tracked location:', userLocation);
        addIncident(incidentType, incidentDescription, incidentSeverity, userLocation);
        setIncidentType('');
        setIncidentDescription('');
        setIncidentSeverity('Low');
        setIsSubmitting(false);
      } else {
        // Fallback: try to get location if not available from map
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              const { latitude, longitude } = position.coords;
              const location = { lat: latitude, lng: longitude };
              
              console.log('📍 Reporting incident from fresh location:', location);
              addIncident(incidentType, incidentDescription, incidentSeverity, location);
              
              setIncidentType('');
              setIncidentDescription('');
              setIncidentSeverity('Low');
              setIsSubmitting(false);
            },
            (error) => {
              console.error('❌ Failed to get location for incident:', error);
              
              // Provide helpful error message based on error type
              let errorMessage = '⚠️ Could not get your location. ';
              switch(error.code) {
                case error.PERMISSION_DENIED:
                  errorMessage += 'Please enable location access in your browser settings and try again.';
                  break;
                case error.POSITION_UNAVAILABLE:
                  errorMessage += 'Location information is unavailable. Please check your device settings.';
                  break;
                case error.TIMEOUT:
                  errorMessage += 'Location request timed out. Please try again.';
                  break;
                default:
                  errorMessage += 'Please ensure location services are enabled.';
              }
              
              const proceed = window.confirm(errorMessage + '\n\nDo you want to submit the incident anyway? (It will use an approximate location)');
              
              if (proceed) {
                addIncident(incidentType, incidentDescription, incidentSeverity, null);
                setIncidentType('');
                setIncidentDescription('');
                setIncidentSeverity('Low');
              }
              setIsSubmitting(false);
            },
            {
              enableHighAccuracy: true,
              timeout: 10000,
              maximumAge: 0
            }
          );
        } else {
          // Geolocation not supported
          const proceed = window.confirm('⚠️ Geolocation is not supported in your browser. Do you want to submit the incident anyway? (It will use an approximate location)');
          if (proceed) {
            addIncident(incidentType, incidentDescription, incidentSeverity, null);
            setIncidentType('');
            setIncidentDescription('');
            setIncidentSeverity('Low');
          }
          setIsSubmitting(false);
        }
      }
    }
  };

  const handleMapMarkerClick = (item, type) => {
    console.log('Citizen clicked on:', item, type);
  };

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
            <h3>📢 View Notices</h3>
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
            <h3>🚨 Report Incident</h3>
            <div className="incident-form">
              <div className="form-group">
                <label>Incident Type:</label>
                <select
                  value={incidentType}
                  onChange={(e) => setIncidentType(e.target.value)}
                  className="form-input"
                >
                  <option value="">Select incident type</option>
                  <option value="Accident">Accident</option>
                  <option value="Fire">Fire</option>
                  <option value="Medical">Medical</option>
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
                  placeholder="Describe incident"
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
                disabled={!incidentType || !incidentDescription.trim() || isSubmitting}
              >
                {isSubmitting ? 'Getting Location...' : 'Submit Incident'}
              </button>
            </div>
          </div>

          {/* Live Map Section */}
          <div className="dashboard-section full-width">
            <h3>🗺 Live Emergency Map</h3>
            <CitizenMapComponent 
              incidents={incidents} 
              showResources={true}
              showUserLocation={true}
              onMarkerClick={handleMapMarkerClick}
              onLocationUpdate={handleLocationUpdate}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default CitizenDashboard;
