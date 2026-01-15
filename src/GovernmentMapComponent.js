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

const GovernmentMapComponent = ({ incidents, showResources = false, showUserLocation = false, onMarkerClick }) => {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const markersRef = useRef(new Map());
  const tileLayerRef = useRef(null);
  const [mapInitialized, setMapInitialized] = useState(false);
  const [tilesLoaded, setTilesLoaded] = useState(false);

  // Create custom colored icons for incident severity
  const createIncidentMarker = (severity, coordinates) => {
    // Validate coordinates before creating marker
    if (!coordinates || !Array.isArray(coordinates) || coordinates.length !== 2) {
      console.warn('Invalid coordinates for government incident:', coordinates);
      return null;
    }

    const [lat, lng] = coordinates;
    if (!lat || !lng || typeof lat !== 'number' || typeof lng !== 'number' || 
        isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      console.warn('Invalid coordinate values for government incident:', { lat, lng });
      return null;
    }

    let iconColor;
    switch (severity) {
      case 'Critical':
        iconColor = '#e74c3c'; // 🔴 Red
        break;
      case 'Medium':
        iconColor = '#f39c12'; // 🟠 Orange
        break;
      case 'Low':
        iconColor = '#27ae60'; // 🟢 Green
        break;
      default:
        iconColor = '#3498db'; // Blue default
    }

    return L.circleMarker(coordinates, {
      radius: 10,
      fillColor: iconColor,
      color: iconColor,
      weight: 2,
      opacity: 1,
      fillOpacity: 1
    });
  };

  // Initialize map - ONLY ONCE WITH useEffect([])
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    // Ensure container has dimensions before initializing
    const container = mapContainer.current;
    if (container.offsetWidth === 0 || container.offsetHeight === 0) {
      console.warn('🏛️ Map container has zero dimensions, waiting...');
      return;
    }

    console.log('🏛️ Initializing Government map - TILES FIRST');

    // Initialize map with valid default center and zoom
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

    console.log('🏛️ Map created, adding OpenStreetMap tile layer IMMEDIATELY...');

    // Add OpenStreetMap tile layer IMMEDIATELY during initialization (not conditional)
    tileLayerRef.current = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { 
      maxZoom: 19 
    }).addTo(map.current);

    console.log('🏛️ OpenStreetMap tile layer added - ALWAYS VISIBLE');

    // Wait for map to fully load before marking as initialized
    map.current.whenReady(() => {
      console.log('🏛️ Map is ready, tiles should be loading...');
      
      // Listen for map load event (fires when tiles are loaded)
      map.current.on('load', () => {
        console.log('🏛️ Map load event fired - tiles loaded');
        setTilesLoaded(true);
      });

      // Also listen for tile layer load events
      tileLayerRef.current.on('tileload', () => {
        console.log('🏛️ Tile loaded');
      });

      // Fallback: mark as loaded after tiles have had time to render
      // This ensures tiles are visible before markers are added
      setTimeout(() => {
        console.log('🏛️ Tiles should be loaded (timeout fallback)');
        setTilesLoaded(true);
      }, 800);
    });

    // Handle map resize after component mounts
    setTimeout(() => {
      if (map.current) {
        map.current.invalidateSize();
        console.log('🏛️ Map size invalidated after mount');
      }
    }, 100);

    setMapInitialized(true);
    console.log('🏛️ Government map initialization complete - TILES LOADED FIRST');

    return () => {
      if (map.current) {
        console.log('🏛️ Cleaning up Government map');
        map.current.remove();
        map.current = null;
        tileLayerRef.current = null;
      }
      setTilesLoaded(false);
    };
  }, []); // Empty dependency array - ONLY RUNS ONCE

  // Handle citizen incident updates - DO NOT RECREATE MAP OR TILE LAYER
  useEffect(() => {
    // Only process markers after map is initialized
    if (!map.current || !mapInitialized) {
      if (!map.current || !mapInitialized) {
        console.log('🏛️ Map not initialized yet, skipping marker update');
      }
      return;
    }

    // Ensure tile layer is always present and visible
    if (!tileLayerRef.current || !map.current.hasLayer(tileLayerRef.current)) {
      console.log('🏛️ Tile layer missing, recreating...');
      tileLayerRef.current = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { 
        maxZoom: 19 
      }).addTo(map.current);
    }

    // If tiles haven't loaded initially, wait a bit but don't block forever
    if (!tilesLoaded) {
      console.log('🏛️ Tiles not loaded yet, but proceeding with markers (tiles will load)...');
      // Set a timeout to mark as loaded if it takes too long
      setTimeout(() => {
        if (!tilesLoaded) {
          setTilesLoaded(true);
        }
      }, 1000);
    }

    console.log('🏛️ Processing citizen incident updates - ADDING MARKERS...');

    // Defensive check for incidents array
    if (!incidents || !Array.isArray(incidents) || incidents.length === 0) {
      console.log('🏛️ No incidents to process');
      return;
    }

    // Clear existing markers only - NEVER CLEAR TILE LAYER
    markersRef.current.forEach((marker, key) => {
      if (key.startsWith('incident-')) {
        const markerToRemove = markersRef.current.get(key);
        if (markerToRemove && map.current.hasLayer(markerToRemove)) {
          map.current.removeLayer(markerToRemove);
        }
        markersRef.current.delete(key);
      }
    });

    // Process first incident for centering
    const firstIncident = incidents[0];
    if (firstIncident && firstIncident.coordinates && Array.isArray(firstIncident.coordinates) && firstIncident.coordinates.length === 2) {
      const [incidentLat, incidentLng] = firstIncident.coordinates;
      
      // Validate coordinates - strict check: both must be non-null valid numbers
      if (incidentLat != null && incidentLng != null && 
          typeof incidentLat === 'number' && typeof incidentLng === 'number' && 
          !isNaN(incidentLat) && !isNaN(incidentLng) &&
          incidentLat >= -90 && incidentLat <= 90 && 
          incidentLng >= -180 && incidentLng <= 180) {
        
        console.log('🏛️ Citizen incident detected:', { incidentLat, incidentLng });

        // Add the new incident marker
        const marker = createIncidentMarker(firstIncident.severity, [incidentLat, incidentLng]);
        if (!marker) {
          console.warn('🏛️ Failed to create government incident marker due to invalid coordinates');
          return;
        }
        marker.addTo(map.current);

        // Create popup content
        const popupContent = `
          <div style="min-width: 200px;">
            <h4 style="margin: 0 0 10px 0; color: ${firstIncident.severity === 'Critical' ? '#e74c3c' : firstIncident.severity === 'Medium' ? '#f39c12' : '#27ae60'};">
              ${firstIncident.type}
            </h4>
            <p><strong>Severity:</strong> ${firstIncident.severity}</p>
            <p><strong>Description:</strong> ${firstIncident.description}</p>
            <p><strong>Reported by:</strong> ${firstIncident.reportedBy}</p>
            <p><strong>Time:</strong> ${firstIncident.timestamp}</p>
            <p><strong>Latitude:</strong> ${incidentLat.toFixed(6)}</p>
            <p><strong>Longitude:</strong> ${incidentLng.toFixed(6)}</p>
          </div>
        `;

        marker.bindPopup(popupContent);
        markersRef.current.set(`incident-${firstIncident.id}`, marker);

        // Center map on citizen location - [lat, lng] order
        console.log('🏛️ Centering map on citizen incident:', [incidentLat, incidentLng]);
        
        // Ensure tile layer is visible before recentering
        if (tileLayerRef.current) {
          tileLayerRef.current.addTo(map.current);
        }
        
        map.current.setView([incidentLat, incidentLng], 14);

        // Force tile rendering and wait for tiles to load after centering
        setTimeout(() => {
          if (map.current) {
            map.current.invalidateSize();
            console.log('🏛️ Map size invalidated after centering');
            
            // Ensure tile layer is still visible and force refresh
            if (tileLayerRef.current) {
              tileLayerRef.current.addTo(map.current);
              tileLayerRef.current.redraw();
            }
            
            // Force all tile layers to redraw
            map.current.eachLayer((layer) => {
              if (layer instanceof L.TileLayer) {
                layer.redraw();
              }
            });
            
            console.log('🏛️ Tiles refreshed after recentering');
          }
        }, 100);
        
        // Additional refresh after tiles have time to load
        setTimeout(() => {
          if (map.current && tileLayerRef.current) {
            tileLayerRef.current.redraw();
            map.current.invalidateSize();
            console.log('🏛️ Final tile refresh after recentering');
          }
        }, 600);

        console.log('🏛️ Citizen incident processed - TILES PRESERVED, MARKER ADDED');
      } else {
        console.warn('🏛️ Skipping marker creation - invalid coordinates:', { incidentLat, incidentLng });
      }
    }

    // Process remaining incidents (markers only, no centering)
    incidents.slice(1).forEach(incident => {
      if (incident && incident.coordinates && Array.isArray(incident.coordinates) && incident.coordinates.length === 2) {
        const [lat, lng] = incident.coordinates;
        
        // Strict validation: both must be non-null valid numbers
        if (lat != null && lng != null && 
            typeof lat === 'number' && typeof lng === 'number' && 
            !isNaN(lat) && !isNaN(lng) &&
            lat >= -90 && lat <= 90 && 
            lng >= -180 && lng <= 180) {
          
          const marker = createIncidentMarker(incident.severity, [lat, lng]);
          if (!marker) {
            console.warn('🏛️ Failed to create government incident marker due to invalid coordinates');
            return;
          }
          marker.addTo(map.current);

          const popupContent = `
            <div style="min-width: 200px;">
              <h4 style="margin: 0 0 10px 0; color: ${incident.severity === 'Critical' ? '#e74c3c' : incident.severity === 'Medium' ? '#f39c12' : '#27ae60'};">
                ${incident.type}
              </h4>
              <p><strong>Severity:</strong> ${incident.severity}</p>
              <p><strong>Description:</strong> ${incident.description}</p>
              <p><strong>Reported by:</strong> ${incident.reportedBy}</p>
              <p><strong>Time:</strong> ${incident.timestamp}</p>
              <p><strong>Latitude:</strong> ${lat.toFixed(6)}</p>
              <p><strong>Longitude:</strong> ${lng.toFixed(6)}</p>
            </div>
          `;

          marker.bindPopup(popupContent);
          markersRef.current.set(`incident-${incident.id}`, marker);
        } else {
          console.warn('🏛️ Skipping marker creation - invalid coordinates:', { lat, lng });
        }
      }
    });

  }, [incidents, mapInitialized, tilesLoaded]);

  return (
    <div className="map-container">
      <div className="map-header">
        <h3>🏛️ Government Incident Monitor</h3>
        <div className="legend">
          <span className="legend-item">
            <span className="legend-color critical"></span> Critical
          </span>
          <span className="legend-item">
            <span className="legend-color medium"></span> Medium
          </span>
          <span className="legend-item">
            <span className="legend-color low"></span> Low
          </span>
        </div>
      </div>
      <div ref={mapContainer} className="leaflet-map-container"></div>
    </div>
  );
};

export default GovernmentMapComponent;
