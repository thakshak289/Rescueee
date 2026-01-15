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

const CitizenMapComponent = ({ incidents, showResources = false, showUserLocation = false, onMarkerClick, onLocationUpdate }) => {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const userMarkerRef = useRef(null);
  const markersRef = useRef(new Map());
  const [mapInitialized, setMapInitialized] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [locationError, setLocationError] = useState(null);
  const [watchId, setWatchId] = useState(null);
  const tileLayerRef = useRef(null);

  // Create separate layers
  const userLocationLayer = useRef(null);
  const resourceLayer = useRef(null);
  const citizenIncidentLayer = useRef(null);

  // Sample resource data (static) - ONLY for Citizen Dashboard
  const resources = [
    { id: 1, name: 'City Hospital', type: 'Hospital', coordinates: [20.5937, 78.9629], address: '123 Main St', phone: '555-0101' },
    { id: 2, name: 'Emergency Medical Center', type: 'Hospital', coordinates: [20.5937, 78.9629], address: '456 Oak Ave', phone: '555-0102' },
    { id: 3, name: 'Fire Station #1', type: 'Fire Station', coordinates: [20.5937, 78.9629], address: '789 Elm St', phone: '555-0103' },
    { id: 4, name: 'Police Department', type: 'Police Station', coordinates: [20.5937, 78.9629], address: '321 Pine Rd', phone: '555-0104' },
    { id: 5, name: 'Auto Repair Shop', type: 'Mechanic', coordinates: [20.5937, 78.9629], address: '654 Maple Dr', phone: '555-0105' },
    { id: 6, name: 'Quick Care Clinic', type: 'Hospital', coordinates: [20.5937, 78.9629], address: '987 Cedar Ln', phone: '555-0106' },
    { id: 7, name: 'Central Police Station', type: 'Police Station', coordinates: [20.5937, 78.9629], address: '159 Broadway', phone: '555-0107' },
    { id: 8, name: 'East Side Hospital', type: 'Hospital', coordinates: [20.5937, 78.9629], address: '200 East 42nd St', phone: '555-0108' },
    { id: 9, name: 'Downtown Mechanic', type: 'Mechanic', coordinates: [20.5937, 78.9629], address: '100 Wall St', phone: '555-0109' },
    { id: 10, name: 'North Fire Station', type: 'Fire Station', coordinates: [20.5937, 78.9629], address: '250 Central Park West', phone: '555-0110' }
  ];

  const getResourceColor = (type) => {
    switch (type) {
      case 'Hospital': return '#3498db'; // Blue
      case 'Fire Station': return '#e67e22'; // Orange
      case 'Police Station': return '#9b59b6'; // Purple
      case 'Mechanic': return '#34495e'; // Dark Gray
      default: return '#95a5a6';
    }
  };

  const createResourceMarker = (type, coordinates) => {
    // Use default Leaflet markers with standard colors
    const marker = L.marker(coordinates);
    
    // Create popup content
    const popupContent = `
      <div style="min-width: 200px;">
        <h4 style="margin: 0 0 10px 0; color: #333;">
          ${type}
        </h4>
        <p><strong>Type:</strong> ${type}</p>
        <p><strong>Services:</strong> Emergency services available</p>
        ${type === 'Hospital' ? '<p><strong>Emergency Room:</strong> 24/7 Available</p>' : ''}
        ${type === 'Fire Station' ? '<p><strong>Fire & Rescue:</strong> 24/7 Available</p>' : ''}
        ${type === 'Police Station' ? '<p><strong>Emergency Response:</strong> Always Available</p>' : ''}
        ${type === 'Mechanic' ? '<p><strong>Towing Service:</strong> Available</p>' : ''}
      </div>
    `;

    marker.bindPopup(popupContent);
    return marker;
  };

  // Create citizen incident markers using default Leaflet icons
  const createCitizenIncidentMarker = (coordinates, incident) => {
    // Validate coordinates before creating marker
    if (!coordinates || !Array.isArray(coordinates) || coordinates.length !== 2) {
      console.warn('Invalid coordinates for citizen incident:', coordinates);
      return null;
    }

    const [lat, lng] = coordinates;
    if (!lat || !lng || typeof lat !== 'number' || typeof lng !== 'number' || 
        isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      console.warn('Invalid coordinate values for citizen incident:', { lat, lng });
      return null;
    }

    // Use default Leaflet marker for citizen incidents
    const marker = L.marker(coordinates);
    
    // Create popup content with defensive checks
    const popupContent = `
      <div style="min-width: 200px;">
        <h4 style="margin: 0 0 10px 0; color: #e74c3c;">
          Citizen Location
        </h4>
        <p><strong>Incident Type:</strong> ${incident.type || 'Unknown'}</p>
        <p><strong>Description:</strong> ${incident.description || 'No description'}</p>
        <p><strong>Latitude:</strong> ${lat.toFixed(6)}</p>
        <p><strong>Longitude:</strong> ${lng.toFixed(6)}</p>
      </div>
    `;

    marker.bindPopup(popupContent);
    return marker;
  };

  // Create user location marker using default Leaflet icon
  const createUserLocationIcon = (coordinates) => {
    // Use default Leaflet marker for user location
    const marker = L.marker(coordinates);
    
    // Create popup content with defensive checks
    const popupContent = `
      <div style="min-width: 200px;">
        <h4 style="margin: 0 0 10px 0; color: #2196F3;">
          Your Location
        </h4>
        <p><strong>Latitude:</strong> ${coordinates[0] ? coordinates[0].toFixed(6) : 'N/A'}</p>
        <p><strong>Longitude:</strong> ${coordinates[1] ? coordinates[1].toFixed(6) : 'N/A'}</p>
        <p><strong>Status:</strong> Live tracking active</p>
      </div>
    `;

    marker.bindPopup(popupContent);
    return marker;
  };

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    console.log('🗺 Initializing Citizen map...');

    // Initialize map with India center (neutral default) - render immediately
    map.current = L.map(mapContainer.current, {
      center: [20.5937, 78.9629],
      zoom: 13,
      zoomControl: true,
      dragging: true,
      touchZoom: true,
      doubleClickZoom: true,
      scrollWheelZoom: true,
      boxZoom: true,
      keyboard: true,
      tap: true
    });

    console.log('🗺 Map created, adding tile layer...');

    // Add OpenStreetMap tiles immediately and store reference
    tileLayerRef.current = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
      errorTileUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
    }).addTo(map.current);

    // Add tile load event listener
    tileLayerRef.current.on('tileload', function(e) {
      console.log('🗺 Tile loaded successfully:', e.tile);
    });

    tileLayerRef.current.on('tileerror', function(e) {
      console.error('🗺 Tile load error:', e.tile);
    });

    console.log('🗺 Tile layer added to map');

    // Create separate layers in correct order
    userLocationLayer.current = L.layerGroup().addTo(map.current);
    resourceLayer.current = L.layerGroup().addTo(map.current);
    citizenIncidentLayer.current = L.layerGroup().addTo(map.current);

    console.log('🗺 Layers added to map');

    // Handle map resize after component mounts
    setTimeout(() => {
      if (map.current) {
        map.current.invalidateSize();
        console.log('🗺 Map size invalidated');
      }
    }, 100);

    setMapInitialized(true);
    console.log('🗺 Citizen map initialization complete');

    return () => {
      if (watchId) {
        navigator.geolocation.clearWatch(watchId);
      }
      if (map.current) {
        console.log('🗺 Cleaning up Citizen map');
        map.current.remove();
        map.current = null;
        tileLayerRef.current = null;
      }
    };
  }, []);

  // Start geolocation tracking
  useEffect(() => {
    if (!showUserLocation || !map.current || !mapInitialized) return;

    const startGeolocation = () => {
      if (!navigator.geolocation) {
        console.error('Geolocation is not supported by your browser');
        setLocationError('Geolocation not supported by your browser');
        setUserLocation({ lat: 20.5937, lng: 78.9629 });
        alert('Geolocation is not supported by your browser. Using default location (India center).');
        return;
      }

      const options = {
        enableHighAccuracy: true,
        timeout: 30000,
        maximumAge: 300000
      };

      console.log('Requesting geolocation permission...');

      // Get initial position
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const newLocation = { lat: latitude, lng: longitude };
          setUserLocation(newLocation);
          setLocationError(null);
          
          // Notify parent component of location update
          if (onLocationUpdate) {
            onLocationUpdate(newLocation);
          }
          
          // Center map on user location ONLY on initial load
          if (!userLocation && map.current) {
            map.current.flyTo([latitude, longitude], 15, {
              duration: 2
            });
          }
          
          console.log('✅ Successfully got user location:', newLocation);
        },
        (error) => {
          console.error('❌ Geolocation error:', error);
          setLocationError(error.message);
          setUserLocation({ lat: 20.5937, lng: 78.9629 });
          
          // Show specific alert based on error type
          switch(error.code) {
            case error.PERMISSION_DENIED:
              alert('❌ Location access was denied. Please enable location access in your browser settings and refresh the page. Using default location (India center).');
              break;
            case error.POSITION_UNAVAILABLE:
              alert('❌ Location information is unavailable. Using default location (India center).');
              break;
            case error.TIMEOUT:
              alert('❌ Location request timed out. Using default location (India center).');
              break;
            default:
              alert('❌ Unable to get your location. Using default location (India center).');
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
          
          // Notify parent component of location update
          if (onLocationUpdate) {
            onLocationUpdate(newLocation);
          }
          
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
  }, [showUserLocation, mapInitialized]);

  // Update user location marker
  useEffect(() => {
    if (!map.current || !showUserLocation || !userLocation || !userLocationLayer.current) return;

    // Remove existing user marker (ensure only one exists)
    if (userMarkerRef.current) {
      userLocationLayer.current.removeLayer(userMarkerRef.current);
    }

    // Add new user location marker to userLocationLayer
    userMarkerRef.current = createUserLocationIcon([userLocation.lat, userLocation.lng])
      .addTo(userLocationLayer.current);

    // Add popup with coordinates
    const popupContent = `
      <div style="min-width: 150px;">
        <p><strong>Lat:</strong> ${userLocation.lat.toFixed(6)}</p>
        <p><strong>Lng:</strong> ${userLocation.lng.toFixed(6)}</p>
      </div>
    `;
    userMarkerRef.current.bindPopup(popupContent);
    
    // Open popup automatically when marker is created
    userMarkerRef.current.openPopup();
  }, [userLocation, showUserLocation, mapInitialized]);

  // Update citizen incident markers
  useEffect(() => {
    if (!map.current || !citizenIncidentLayer.current || !mapInitialized) return;

    // Defensive checks for incident data
    if (!incidents || !Array.isArray(incidents)) {
      console.warn('Incidents data is not valid:', incidents);
      return;
    }

    // Clear citizen incident layer
    citizenIncidentLayer.current.clearLayers();

    // Add citizen incident markers
    incidents.forEach(incident => {
      // Skip incidents with invalid coordinates
      if (!incident.coordinates || !Array.isArray(incident.coordinates) || incident.coordinates.length !== 2) {
        console.warn('Invalid incident coordinates:', incident);
        return;
      }

      const [lat, lng] = incident.coordinates;
      
      // Validate coordinates
      if (typeof lat !== 'number' || typeof lng !== 'number' || 
          isNaN(lat) || isNaN(lng) ||
          lat < -90 || lat > 90 || 
          lng < -180 || lng > 180) {
        console.warn('Invalid coordinates for incident:', incident);
        return;
      }

      const marker = createCitizenIncidentMarker([lat, lng], incident);
      if (!marker) {
        console.warn('Failed to create citizen incident marker due to invalid coordinates');
        return;
      }
      marker.addTo(citizenIncidentLayer.current);

      // Create popup content
      const popupContent = `
        <div style="min-width: 200px;">
          <h4 style="margin: 0 0 10px 0; color: #e74c3c;">
            Citizen Location
          </h4>
          <p><strong>Incident Type:</strong> ${incident.type}</p>
          <p><strong>Latitude:</strong> ${lat.toFixed(6)}</p>
          <p><strong>Longitude:</strong> ${lng.toFixed(6)}</p>
        </div>
      `;

      marker.bindPopup(popupContent);

      // Add click handler
      marker.on('click', () => {
        if (onMarkerClick) {
          onMarkerClick(incident, 'citizen-incident');
        }
      });
    });
  }, [incidents, onMarkerClick, mapInitialized]);

  // Update resource markers (Citizen Dashboard - ONLY show resources, no incidents)
  useEffect(() => {
    if (!map.current || !showResources || !resourceLayer.current || !mapInitialized) return;

    // Clear resource layer
    resourceLayer.current.clearLayers();

    // Add new resource markers to resourceLayer
    resources.forEach(resource => {
      const marker = createResourceMarker(resource.type, resource.coordinates)
        .addTo(resourceLayer.current);

      // Create popup content
      const popupContent = `
        <div style="min-width: 200px;">
          <h4 style="margin: 0 0 10px 0; color: ${getResourceColor(resource.type)};">
            ${resource.name}
          </h4>
          <p><strong>Type:</strong> ${resource.type}</p>
          <p><strong>Address:</strong> ${resource.address}</p>
          <p><strong>Phone:</strong> ${resource.phone}</p>
        </div>
      `;

      marker.bindPopup(popupContent);

      // Add click handler
      marker.on('click', () => {
        if (onMarkerClick) {
          onMarkerClick(resource, 'resource');
        }
      });
    });
  }, [showResources, onMarkerClick, mapInitialized]);

  return (
    <div className="map-container">
      <div className="map-header">
        <h3>Live Emergency Map</h3>
        <div className="map-legend">
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
                <span>🏥 Hospital</span>
              </div>
              <div className="legend-item">
                <span className="legend-dot mechanic"></span>
                <span>🔧 Mechanic</span>
              </div>
              <div className="legend-item">
                <span className="legend-dot police-station"></span>
                <span>🚓 Police</span>
              </div>
              <div className="legend-item">
                <span className="legend-dot fire-station"></span>
                <span>🚒 Fire Station</span>
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
                      
                      // Notify parent component of location update
                      if (onLocationUpdate) {
                        onLocationUpdate(newLocation);
                      }
                      
                      map.current.flyTo([latitude, longitude], 15, { duration: 2 });
                      console.log('✅ Manual location request successful:', newLocation);
                    },
                    (error) => {
                      console.error('❌ Manual location request failed:', error);
                      alert('❌ Still unable to get your location. Please check your browser settings and ensure location access is enabled.');
                    },
                    { enableHighAccuracy: true, timeout: 30000 }
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

export default CitizenMapComponent;
