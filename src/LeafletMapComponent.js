import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './Dashboard.css';

// Fix for default markers in Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const LeafletMapComponent = ({ incidents, showResources = false, showUserLocation = false, onMarkerClick }) => {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const userMarkerRef = useRef(null);
  const markersRef = useRef(new Map());
  const [userLocation, setUserLocation] = useState(null);
  const [locationError, setLocationError] = useState(null);
  const [watchId, setWatchId] = useState(null);

  // Sample resource data (static)
  const resources = [
    { id: 1, name: 'City Hospital', type: 'Hospital', coordinates: [40.7128, -74.0060], address: '123 Main St', phone: '555-0101' },
    { id: 2, name: 'Emergency Medical Center', type: 'Hospital', coordinates: [40.7580, -73.9855], address: '456 Oak Ave', phone: '555-0102' },
    { id: 3, name: 'Fire Station #1', type: 'Fire Station', coordinates: [40.7489, -73.9680], address: '789 Elm St', phone: '555-0103' },
    { id: 4, name: 'Police Department', type: 'Police Station', coordinates: [40.7614, -73.9776], address: '321 Pine Rd', phone: '555-0104' },
    { id: 5, name: 'Auto Repair Shop', type: 'Mechanic', coordinates: [40.7282, -73.9942], address: '654 Maple Dr', phone: '555-0105' },
    { id: 6, name: 'Quick Care Clinic', type: 'Hospital', coordinates: [40.7350, -73.9900], address: '987 Cedar Ln', phone: '555-0106' },
    { id: 7, name: 'Central Police Station', type: 'Police Station', coordinates: [40.7505, -73.9934], address: '159 Broadway', phone: '555-0107' },
    { id: 8, name: 'East Side Hospital', type: 'Hospital', coordinates: [40.7489, -73.9680], address: '200 East 42nd St', phone: '555-0108' },
    { id: 9, name: 'Downtown Mechanic', type: 'Mechanic', coordinates: [40.7260, -73.9897], address: '100 Wall St', phone: '555-0109' },
    { id: 10, name: 'North Fire Station', type: 'Fire Station', coordinates: [40.7794, -73.9632], address: '250 Central Park West', phone: '555-0110' }
  ];

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'Critical': return '#e74c3c';
      case 'Medium': return '#f39c12';
      case 'Low': return '#27ae60';
      default: return '#666';
    }
  };

  const getResourceColor = (type) => {
    switch (type) {
      case 'Hospital': return '#3498db';
      case 'Fire Station': return '#e67e22';
      case 'Police Station': return '#9b59b6';
      case 'Mechanic': return '#34495e';
      default: return '#95a5a6';
    }
  };

  // Create custom icon for markers
  const createCustomIcon = (color, symbol) => {
    return L.divIcon({
      html: `
        <div style="
          background-color: ${color};
          width: 30px;
          height: 30px;
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          border: 2px solid white;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.3s ease;
        ">
          <span style="
            color: white;
            font-weight: bold;
            font-size: 12px;
            text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
            transform: rotate(45deg);
          ">${symbol}</span>
        </div>
      `,
      className: 'custom-marker',
      iconSize: [30, 30],
      iconAnchor: [15, 30],
      popupAnchor: [0, -30]
    });
  };

  // Create user location icon
  const createUserIcon = () => {
    return L.divIcon({
      html: `
        <div style="
          background-color: #2196F3;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          border: 3px solid white;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        ">
          <span style="font-size: 12px;">📍</span>
        </div>
      `,
      className: 'user-location-marker',
      iconSize: [24, 24],
      iconAnchor: [12, 12]
    });
  };

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    // Initialize map with default center (NYC)
    map.current = L.map(mapContainer.current).setView([40.7128, -74.0060], 13);

    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19
    }).addTo(map.current);

    // Handle map resize
    setTimeout(() => {
      map.current.invalidateSize();
    }, 100);

    return () => {
      if (watchId) {
        navigator.geolocation.clearWatch(watchId);
      }
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  // Start geolocation tracking
  useEffect(() => {
    if (!showUserLocation || !map.current) return;

    const startGeolocation = () => {
      if (!navigator.geolocation) {
        console.error('Geolocation is not supported by your browser');
        setLocationError('Geolocation not supported by your browser');
        setUserLocation({ lat: 40.7128, lng: -74.0060 });
        alert('Geolocation is not supported by your browser. Using default location (New York City).');
        return;
      }

      const options = {
        enableHighAccuracy: true,
        timeout: 30000, // Increased to 30 seconds
        maximumAge: 300000 // Allow cached position up to 5 minutes old
      };

      console.log('Requesting geolocation permission...');

      // Get initial position
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const newLocation = { lat: latitude, lng: longitude };
          setUserLocation(newLocation);
          setLocationError(null);
          
          // Center map on user location ONLY on initial load
          if (!userLocation) {
            map.current.flyTo([latitude, longitude], 15, {
              duration: 2
            });
          }
          
          console.log('✅ Successfully got user location:', newLocation);
        },
        (error) => {
          console.error('❌ Geolocation error:', error);
          setLocationError(error.message);
          setUserLocation({ lat: 40.7128, lng: -74.0060 });
          
          // Show specific alert based on error type
          switch(error.code) {
            case error.PERMISSION_DENIED:
              alert('❌ Location access was denied. Please enable location access in your browser settings and refresh the page. Using default location (New York City).');
              break;
            case error.POSITION_UNAVAILABLE:
              alert('❌ Location information is unavailable. Using default location (New York City).');
              break;
            case error.TIMEOUT:
              alert('❌ Location request timed out. Using default location (New York City).');
              break;
            default:
              alert('❌ Unable to get your location. Using default location (New York City).');
              break;
          }
        },
        options
      );

      // Watch position for continuous updates
      const id = navigator.geolocation.watchPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const newLocation = { lat: latitude, lng: longitude };
          setUserLocation(newLocation);
          setLocationError(null);
          
          // DO NOT re-center map - just update marker position
          console.log('📍 Updated user location:', newLocation);
        },
        (error) => {
          console.error('❌ Geolocation watch error:', error);
          setLocationError(error.message);
        },
        {
          enableHighAccuracy: true,
          timeout: 30000,
          maximumAge: 300000
        }
      );

      setWatchId(id);
    };

    startGeolocation();

    return () => {
      if (watchId) {
        navigator.geolocation.clearWatch(watchId);
        console.log('🛑 Stopped geolocation watching');
      }
    };
  }, [showUserLocation, userLocation]);

  // Update user location marker
  useEffect(() => {
    if (!map.current || !showUserLocation || !userLocation) return;

    // Remove existing user marker (ensure only one exists)
    if (userMarkerRef.current) {
      map.current.removeLayer(userMarkerRef.current);
    }

    // Add new user location marker
    userMarkerRef.current = L.marker([userLocation.lat, userLocation.lng], {
      icon: createUserIcon()
    }).addTo(map.current);

    // Add popup with "You are here" label
    userMarkerRef.current.bindPopup('<strong>You are here</strong>');
    
    // Open popup automatically when marker is created
    userMarkerRef.current.openPopup();
  }, [userLocation, showUserLocation]);

  // Update incident markers
  useEffect(() => {
    if (!map.current) return;

    // Remove existing incident markers
    markersRef.current.forEach((marker, key) => {
      if (key.startsWith('incident-')) {
        map.current.removeLayer(marker);
        markersRef.current.delete(key);
      }
    });

    // Add new incident markers
    incidents.forEach(incident => {
      const coordinates = incident.coordinates || [
        40.7128 + (Math.random() - 0.5) * 0.1,
        -74.0060 + (Math.random() - 0.5) * 0.1
      ];

      const marker = L.marker(coordinates, {
        icon: createCustomIcon(getSeverityColor(incident.severity), '!')
      }).addTo(map.current);

      // Create popup content
      const popupContent = `
        <div style="min-width: 200px;">
          <h4 style="margin: 0 0 10px 0; color: ${getSeverityColor(incident.severity)};">
            ${incident.type}
          </h4>
          <p><strong>Severity:</strong> 
            <span style="
              background-color: ${getSeverityColor(incident.severity)};
              color: white;
              padding: 2px 6px;
              border-radius: 3px;
              font-size: 12px;
            ">${incident.severity}</span>
          </p>
          <p><strong>Description:</strong> ${incident.description}</p>
          <p><strong>Reported by:</strong> ${incident.reportedBy}</p>
          <p><strong>Time:</strong> ${incident.timestamp}</p>
        </div>
      `;

      marker.bindPopup(popupContent);

      // Add click handler
      marker.on('click', () => {
        if (onMarkerClick) {
          onMarkerClick(incident, 'incident');
        }
      });

      markersRef.current.set(`incident-${incident.id}`, marker);
    });
  }, [incidents, onMarkerClick]);

  // Update resource markers
  useEffect(() => {
    if (!map.current || !showResources) return;

    // Remove existing resource markers
    markersRef.current.forEach((marker, key) => {
      if (key.startsWith('resource-')) {
        map.current.removeLayer(marker);
        markersRef.current.delete(key);
      }
    });

    // Add new resource markers
    resources.forEach(resource => {
      const symbol = resource.type === 'Hospital' ? 'H' : 
                     resource.type === 'Fire Station' ? 'F' : 
                     resource.type === 'Police Station' ? 'P' : 'M';

      const marker = L.marker(resource.coordinates, {
        icon: createCustomIcon(getResourceColor(resource.type), symbol)
      }).addTo(map.current);

      // Create popup content
      const popupContent = `
        <div style="min-width: 200px;">
          <h4 style="margin: 0 0 10px 0; color: ${getResourceColor(resource.type)};">
            ${resource.name}
          </h4>
          <p><strong>Type:</strong> ${resource.type}</p>
          <p><strong>Address:</strong> ${resource.address}</p>
          <p><strong>Phone:</strong> ${resource.phone}</p>
          <p><strong>Services:</strong> Emergency services available</p>
          ${resource.type === 'Hospital' ? '<p><strong>Emergency Room:</strong> 24/7 Available</p>' : ''}
          ${resource.type === 'Police Station' ? '<p><strong>Emergency Response:</strong> Always Available</p>' : ''}
          ${resource.type === 'Fire Station' ? '<p><strong>Fire & Rescue:</strong> 24/7 Available</p>' : ''}
          ${resource.type === 'Mechanic' ? '<p><strong>Towing Service:</strong> Available</p>' : ''}
        </div>
      `;

      marker.bindPopup(popupContent);

      // Add click handler
      marker.on('click', () => {
        if (onMarkerClick) {
          onMarkerClick(resource, 'resource');
        }
      });

      markersRef.current.set(`resource-${resource.id}`, marker);
    });
  }, [showResources, onMarkerClick]);

  return (
    <div className="map-container">
      <div className="map-header">
        <h3>Live Emergency Map</h3>
        <div className="map-legend">
          <div className="legend-item">
            <span className="legend-dot critical"></span>
            <span>Critical</span>
          </div>
          <div className="legend-item">
            <span className="legend-dot medium"></span>
            <span>Medium</span>
          </div>
          <div className="legend-item">
            <span className="legend-dot low"></span>
            <span>Low</span>
          </div>
          {showUserLocation && (
            <div className="legend-item">
              <span className="legend-dot user-location"></span>
              <span>Your Location</span>
            </div>
          )}
          {showResources && (
            <>
              <div className="legend-item">
                <span className="legend-dot hospital"></span>
                <span>Hospital</span>
              </div>
              <div className="legend-item">
                <span className="legend-dot fire-station"></span>
                <span>Fire Station</span>
              </div>
              <div className="legend-item">
                <span className="legend-dot police-station"></span>
                <span>Police Station</span>
              </div>
              <div className="legend-item">
                <span className="legend-dot mechanic"></span>
                <span>Mechanic</span>
              </div>
            </>
          )}
        </div>
      </div>
      
      <div className="map-view">
        {locationError && (
          <div className="map-error">
            <h3>🗺 Location Error</h3>
            <p>{locationError}</p>
            <p>Using default location (New York City)</p>
          </div>
        )}
        <div ref={mapContainer} className="leaflet-map-container" />
        
        {/* Manual location request button */}
        {showUserLocation && !userLocation && (
          <div style={{
            position: 'absolute',
            top: '10px',
            right: '10px',
            zIndex: 1000,
            background: '#2196F3',
            color: 'white',
            border: 'none',
            padding: '10px 15px',
            borderRadius: '5px',
            cursor: 'pointer',
            fontWeight: 'bold',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)'
          }}>
            <button 
              onClick={() => {
                console.log('🔄 Manually requesting location...');
                if (navigator.geolocation) {
                  navigator.geolocation.getCurrentPosition(
                    (position) => {
                      const { latitude, longitude } = position.coords;
                      const newLocation = { lat: latitude, lng: longitude };
                      setUserLocation(newLocation);
                      setLocationError(null);
                      map.current.flyTo([latitude, longitude], 15, { duration: 2 });
                      console.log('✅ Manual location request successful:', newLocation);
                    },
                    (error) => {
                      console.error('❌ Manual location request failed:', error);
                      alert('❌ Still unable to get your location. Please check your browser settings and ensure location access is enabled.');
                    },
                    { enableHighAccuracy: true, timeout: 10000 }
                  );
                } else {
                  alert('❌ Geolocation is not supported in your browser.');
                }
              }}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'white',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              📍 Get My Location
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default LeafletMapComponent;
