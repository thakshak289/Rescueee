import React, { createContext, useState, useContext } from 'react';

const DataContext = createContext();

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};

export const DataProvider = ({ children }) => {
  const [notices, setNotices] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [volunteerResponses, setVolunteerResponses] = useState([]); // Track which volunteers are responding to which incidents

  const addNotice = (title, message) => {
    const newNotice = {
      id: Date.now(),
      title,
      message,
      timestamp: new Date().toLocaleString(),
      date: new Date().toLocaleDateString(),
      postedBy: 'Government'
    };
    setNotices([newNotice, ...notices]);
  };

  const addIncident = (type, description, severity, location = null) => {
    const newIncident = {
      id: Date.now(),
      type,
      description,
      severity,
      timestamp: new Date().toLocaleString(),
      date: new Date().toLocaleDateString(),
      reportedBy: 'Citizen',
      coordinates: location ? [location.lat, location.lng] : [
        40.7128 + (Math.random() - 0.5) * 0.1,  // Random lat around NYC
        -74.0060 + (Math.random() - 0.5) * 0.1  // Random lng around NYC
      ],
      location: location || 'Unknown location'
    };
    setIncidents([newIncident, ...incidents]);
  };

  const addVolunteerResponse = (incidentId, volunteerEmail) => {
    // Check if volunteer is already responding to this incident
    const existingResponse = volunteerResponses.find(
      r => r.incidentId === incidentId && r.volunteerEmail === volunteerEmail
    );
    
    if (existingResponse) {
      // Remove response if already responding (toggle off)
      setVolunteerResponses(prev => prev.filter(
        r => !(r.incidentId === incidentId && r.volunteerEmail === volunteerEmail)
      ));
      return false; // Removed
    } else {
      // Add new response
      const newResponse = {
        id: Date.now(),
        incidentId,
        volunteerEmail,
        timestamp: new Date().toLocaleString(),
        status: 'responding'
      };
      setVolunteerResponses(prev => [...prev, newResponse]);
      return true; // Added
    }
  };

  const getVolunteerResponse = (incidentId, volunteerEmail) => {
    return volunteerResponses.find(
      r => r.incidentId === incidentId && r.volunteerEmail === volunteerEmail
    );
  };

  const getIncidentResponders = (incidentId) => {
    return volunteerResponses.filter(r => r.incidentId === incidentId);
  };

  const value = {
    notices,
    incidents,
    volunteerResponses,
    addNotice,
    addIncident,
    addVolunteerResponse,
    getVolunteerResponse,
    getIncidentResponders
  };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
};
