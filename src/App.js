import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { DataProvider } from './DataContext';
import Login from './Login';
import CitizenDashboard from './CitizenDashboard';
import GovernmentDashboard from './GovernmentDashboard';
import './App.css';

function App() {
  return (
    <DataProvider>
      <Router>
        <div className="App">
          <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/citizen-dashboard" element={<CitizenDashboard />} />
            <Route path="/government-dashboard" element={<GovernmentDashboard />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </Router>
    </DataProvider>
  );
}

export default App;
