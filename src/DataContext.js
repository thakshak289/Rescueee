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

  const addNotice = (title, message) => {
    const newNotice = {
      id: Date.now(),
      title,
      message,
      timestamp: new Date().toLocaleString(),
      date: new Date().toLocaleDateString()
    };
    setNotices([newNotice, ...notices]);
  };

  const addIncident = (type, description, severity) => {
    const newIncident = {
      id: Date.now(),
      type,
      description,
      severity,
      timestamp: new Date().toLocaleString(),
      date: new Date().toLocaleDateString(),
      reportedBy: 'Citizen'
    };
    setIncidents([newIncident, ...incidents]);
  };

  const value = {
    notices,
    incidents,
    addNotice,
    addIncident
  };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
};
