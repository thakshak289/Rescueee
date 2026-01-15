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

const VolunteerMapComponent = ({ incidents, onMarkerClick, volunteerEmail, onRespondToIncident, getVolunteerResponse, getIncidentResponders }) => {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const markersRef = useRef(new Map());
  const tileLayerRef = useRef(null);
  const [mapInitialized, setMapInitialized] = useState(false);
  const [tilesLoaded, setTilesLoaded] = useState(false);

  // Create standard markers for volunteer incidents (no country-specific styling)
  const createIncidentMarker = (severity, coordinates) => {
    // Validate coordinates before creating marker
    if (!coordinates || !Array.isArray(coordinates) || coordinates.length !== 2) {
      console.warn('Invalid coordinates for volunteer incident:', coordinates);
      return null;
    }

    const [lat, lng] = coordinates;
    if (!lat || !lng || typeof lat !== 'number' || typeof lng !== 'number' || 
        isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      console.warn('Invalid coordinate values for volunteer incident:', { lat, lng });
      return null;
    }

    // Use standard Leaflet marker (neutral, no country-specific styling)
    return L.marker(coordinates);
  };

  // Initialize map - ONLY ONCE
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    // Ensure container has dimensions before initializing
    const container = mapContainer.current;
    if (container.offsetWidth === 0 || container.offsetHeight === 0) {
      console.warn('🚑 Map container has zero dimensions, waiting...');
      return;
    }

    console.log('🚑 Initializing Volunteer map - TILES FIRST');

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

    console.log('🚑 Map created, adding neutral OpenStreetMap tile layer IMMEDIATELY...');

    // Add neutral OpenStreetMap tile layer IMMEDIATELY during initialization (not conditional)
    tileLayerRef.current = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { 
      maxZoom: 19 
    }).addTo(map.current);

    console.log('🚑 Neutral OpenStreetMap tile layer added - ALWAYS VISIBLE');

    // Wait for map to fully load before marking as initialized
    map.current.whenReady(() => {
      console.log('🚑 Map is ready, tiles should be loading...');
      
      // Listen for map load event (fires when tiles are loaded)
      map.current.on('load', () => {
        console.log('🚑 Map load event fired - tiles loaded');
        setTilesLoaded(true);
      });

      // Also listen for tile layer load events
      tileLayerRef.current.on('tileload', () => {
        console.log('🚑 Tile loaded');
      });

      // Fallback: mark as loaded after tiles have had time to render
      // This ensures tiles are visible before markers are added
      setTimeout(() => {
        console.log('🚑 Tiles should be loaded (timeout fallback)');
        setTilesLoaded(true);
      }, 800);
    });

    // Handle map resize after component mounts
    setTimeout(() => {
      if (map.current) {
        map.current.invalidateSize();
        console.log('🚑 Map size invalidated after mount');
      }
    }, 100);

    setMapInitialized(true);
    console.log('🚑 Volunteer map initialization complete - TILES LOADED FIRST');

    return () => {
      if (map.current) {
        console.log('🚑 Cleaning up Volunteer map');
        map.current.remove();
        map.current = null;
        tileLayerRef.current = null;
      }
      setTilesLoaded(false);
    };
  }, []); // Empty dependency array - ONLY RUNS ONCE

  // Handle incident updates - DO NOT RECREATE MAP
  useEffect(() => {
    // Only process markers after map is initialized
    if (!map.current || !mapInitialized) {
      if (!map.current || !mapInitialized) {
        console.log('🚑 Map not initialized yet, skipping marker update');
      }
      return;
    }

    // Ensure tile layer is always present and visible
    if (!tileLayerRef.current || !map.current.hasLayer(tileLayerRef.current)) {
      console.log('🚑 Tile layer missing, recreating...');
      tileLayerRef.current = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { 
        maxZoom: 19 
      }).addTo(map.current);
    }

    // If tiles haven't loaded initially, wait a bit but don't block forever
    if (!tilesLoaded) {
      console.log('🚑 Tiles not loaded yet, but proceeding with markers (tiles will load)...');
      // Set a timeout to mark as loaded if it takes too long
      setTimeout(() => {
        if (!tilesLoaded) {
          setTilesLoaded(true);
        }
      }, 1000);
    }

    console.log('🚑 Processing volunteer incident updates - ADDING MARKERS...');

    // Defensive check for incidents array
    if (!incidents || !Array.isArray(incidents) || incidents.length === 0) {
      console.log('🚑 No incidents to process');
      return;
    }

    // Clear existing markers only
    markersRef.current.forEach((marker, key) => {
      if (key.startsWith('incident-')) {
        const markerToRemove = markersRef.current.get(key);
        if (markerToRemove && map.current.hasLayer(markerToRemove)) {
          map.current.removeLayer(markerToRemove);
        }
        markersRef.current.delete(key);
      }
    });

    // Process incidents
    incidents.forEach((incident, index) => {
      if (incident && incident.coordinates && Array.isArray(incident.coordinates) && incident.coordinates.length === 2) {
        const [incidentLat, incidentLng] = incident.coordinates;
        
        // Strict validation: both must be non-null valid numbers
        if (incidentLat != null && incidentLng != null && 
            typeof incidentLat === 'number' && typeof incidentLng === 'number' && 
            !isNaN(incidentLat) && !isNaN(incidentLng) &&
            incidentLat >= -90 && incidentLat <= 90 && 
            incidentLng >= -180 && incidentLng <= 180) {
          
          console.log('🚑 Adding volunteer incident marker:', { incidentLat, incidentLng, severity: incident.severity });

          // Add the incident marker
          const marker = createIncidentMarker(incident.severity, [incidentLat, incidentLng]);
          if (!marker) {
            console.warn('🚑 Failed to create volunteer incident marker due to invalid coordinates');
            return;
          }
          marker.addTo(map.current);

          // Function to create popup content (captures incident in closure)
          const createPopupContent = (incidentData) => {
            const isResponding = volunteerEmail && getVolunteerResponse ? 
              getVolunteerResponse(incidentData.id, volunteerEmail) : false;
            const responders = getIncidentResponders ? 
              getIncidentResponders(incidentData.id) : [];
            
            const popupDiv = document.createElement('div');
            popupDiv.style.minWidth = '250px';
            popupDiv.innerHTML = `
              <div>
                <h4 style="margin: 0 0 10px 0; color: ${incidentData.severity === 'Critical' ? '#e74c3c' : incidentData.severity === 'Medium' ? '#f39c12' : '#27ae60'};">
                  ${incidentData.type}
                </h4>
                <p><strong>Severity:</strong> ${incidentData.severity}</p>
                <p><strong>Description:</strong> ${incidentData.description}</p>
                <p><strong>Reported by:</strong> ${incidentData.reportedBy}</p>
                <p><strong>Time:</strong> ${incidentData.timestamp}</p>
                <p><strong>Latitude:</strong> ${incidentLat.toFixed(6)}</p>
                <p><strong>Longitude:</strong> ${incidentLng.toFixed(6)}</p>
                ${responders.length > 0 ? `<p style="margin-top: 8px; color: #666; font-size: 0.9rem;"><strong>${responders.length}</strong> volunteer${responders.length > 1 ? 's' : ''} responding</p>` : ''}
                ${volunteerEmail && onRespondToIncident ? `
                  <button 
                    id="respond-btn-${incidentData.id}"
                    style="
                      margin-top: 10px;
                      padding: 8px 16px;
                      background: ${isResponding ? '#27ae60' : '#667eea'};
                      color: white;
                      border: none;
                      border-radius: 5px;
                      cursor: pointer;
                      font-size: 0.9rem;
                      font-weight: 500;
                      width: 100%;
                    "
                  >
                    ${isResponding ? '✓ I\'m Responding' : '→ Respond to This Incident'}
                  </button>
                ` : ''}
              </div>
            `;
            
            // Add click handler for respond button
            if (volunteerEmail && onRespondToIncident) {
              setTimeout(() => {
                const respondBtn = document.getElementById(`respond-btn-${incidentData.id}`);
                if (respondBtn) {
                  respondBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    onRespondToIncident(incidentData.id);
                    // Update popup content after response
                    setTimeout(() => {
                      const newContent = createPopupContent(incidentData);
                      marker.setPopupContent(newContent);
                    }, 100);
                  });
                }
              }, 100);
            }
            
            return popupDiv;
          };

          marker.bindPopup(createPopupContent(incident));
          markersRef.current.set(`incident-${incident.id}`, marker);

          // Center on first incident (citizen reported location)
          if (index === 0 && incidentLat != null && incidentLng != null) {
            console.log('🚑 Centering volunteer map on citizen incident:', [incidentLat, incidentLng]);
            
            // Ensure tile layer is visible before recentering
            if (tileLayerRef.current) {
              tileLayerRef.current.addTo(map.current);
            }
            
            map.current.setView([incidentLat, incidentLng], 14);

            // Force tile rendering and wait for tiles to load after centering
            setTimeout(() => {
              if (map.current) {
                map.current.invalidateSize();
                console.log('🚑 Map size invalidated after centering');
                
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
                
                console.log('🚑 Tiles refreshed after recentering');
              }
            }, 100);
            
            // Additional refresh after tiles have time to load
            setTimeout(() => {
              if (map.current && tileLayerRef.current) {
                tileLayerRef.current.redraw();
                map.current.invalidateSize();
                console.log('🚑 Final tile refresh after recentering');
              }
            }, 600);
          }
        } else {
          console.warn('🚑 Skipping marker creation - invalid coordinates:', { incidentLat, incidentLng });
        }
      }
    });

  }, [incidents, mapInitialized, tilesLoaded]);

  return (
    <div className="map-container">
      <div className="map-header">
        <h3>🚑 Volunteer Response Map</h3>
      </div>
      <div ref={mapContainer} className="leaflet-map-container"></div>
    </div>
  );
};

export default VolunteerMapComponent;
