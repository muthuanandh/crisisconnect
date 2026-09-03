import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import type { Incident, User } from '../db/types';

// Fix Leaflet default icon path issues in compiled bundlers
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom markers for visual hierarchy
const redIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const orangeIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-orange.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const greenIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const blueIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [15, 25],
  iconAnchor: [7, 25],
  popupAnchor: [1, -20],
  shadowSize: [25, 25]
});

interface MapProps {
  incidents: Incident[];
  residents?: User[];
  selectedIncident?: Incident | null;
  onMapClick?: (lat: number, lng: number) => void;
  interactive?: boolean;
}

export const Map: React.FC<MapProps> = ({
  incidents,
  residents = [],
  selectedIncident,
  onMapClick,
  interactive = true
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerGroupRef = useRef<L.LayerGroup | null>(null);

  // Initialize map object once
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    // Center on Chennai
    const initialLat = selectedIncident ? selectedIncident.lat : 13.0418;
    const initialLng = selectedIncident ? selectedIncident.lng : 80.2341;
    const initialZoom = selectedIncident ? 13 : 11.5;

    const map = L.map(mapContainerRef.current, {
      center: [initialLat, initialLng],
      zoom: initialZoom,
      zoomControl: interactive,
      scrollWheelZoom: interactive,
      dragging: interactive,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    if (interactive && onMapClick) {
      map.on('dblclick', (e: L.LeafletMouseEvent) => {
        const { lat, lng } = e.latlng;
        onMapClick(Number(lat.toFixed(5)), Number(lng.toFixed(5)));
      });
      // Disable default double click zoom if we use it for pinning
      map.doubleClickZoom.disable();
    }

    layerGroupRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Sync Map view and layers on data updates
  useEffect(() => {
    const map = mapRef.current;
    const layerGroup = layerGroupRef.current;
    if (!map || !layerGroup) return;

    // Clear previous dynamic layers
    layerGroup.clearLayers();

    // Adjust map center if selected incident changes
    if (selectedIncident) {
      map.setView([selectedIncident.lat, selectedIncident.lng], 13.5, { animate: true });
    }

    // 1. Draw Residents as blue points
    residents.forEach(res => {
      if (res.lat === undefined || res.lng === undefined) return;
      
      const popupText = `
        <div class="p-1">
          <h4 class="font-bold text-gray-800 text-sm">${res.name}</h4>
          <p class="text-xs text-gray-600">Location: ${res.area || 'Unknown'}</p>
          <p class="text-xs text-gray-600">Route: ${res.route || 'None'}</p>
          <div class="mt-1 flex gap-1">
            <span class="px-1 py-0.5 text-[10px] font-semibold bg-blue-100 text-blue-800 rounded capitalize">${res.language}</span>
            <span class="px-1 py-0.5 text-[10px] font-semibold bg-purple-100 text-purple-800 rounded capitalize">${res.accessibility.replace('_', ' ')}</span>
          </div>
        </div>
      `;

      L.marker([res.lat, res.lng], { icon: blueIcon })
        .bindPopup(popupText)
        .addTo(layerGroup);
    });

    // 2. Draw Incidents & affected radius circles
    incidents.forEach(inc => {
      const isSelected = selectedIncident?.id === inc.id;
      const isCritical = inc.severity === 'critical';
      const isHigh = inc.severity === 'high';
      const isResolved = inc.status === 'resolved';

      let markerIcon = orangeIcon;
      let circleColor = '#f97316'; // orange

      if (isResolved) {
        markerIcon = greenIcon;
        circleColor = '#10b981'; // green
      } else if (isCritical) {
        markerIcon = redIcon;
        circleColor = '#ef4444'; // red
      } else if (isHigh) {
        markerIcon = redIcon;
        circleColor = '#f43f5e'; // rose
      }

      const popupText = `
        <div class="p-2 min-w-48">
          <div class="flex items-center justify-between gap-2 border-b pb-1 mb-1">
            <h3 class="font-bold text-gray-900 text-sm">${inc.title}</h3>
            <span class="px-1.5 py-0.5 text-[9px] uppercase font-bold rounded ${
              isResolved ? 'bg-green-100 text-green-800' : isCritical ? 'bg-red-100 text-red-800' : 'bg-orange-100 text-orange-800'
            }">${inc.severity}</span>
          </div>
          <p class="text-xs text-gray-700 leading-tight mb-2">${inc.description}</p>
          <div class="text-[10px] text-gray-500 space-y-0.5">
            <p><strong>Radius:</strong> ${inc.radius} km</p>
            <p><strong>Affected Routes:</strong> ${inc.affectedRoutes.join(', ') || 'None'}</p>
            <p><strong>Emergency:</strong> ${inc.emergencyContact}</p>
          </div>
        </div>
      `;

      // Main marker
      L.marker([inc.lat, inc.lng], { icon: markerIcon })
        .bindPopup(popupText)
        .addTo(layerGroup);

      // Affected zone radius circle
      L.circle([inc.lat, inc.lng], {
        radius: inc.radius * 1000, // convert km to meters
        color: circleColor,
        fillColor: circleColor,
        fillOpacity: isSelected ? 0.25 : 0.1,
        weight: isSelected ? 3 : 1.5,
        dashArray: isSelected ? '5, 5' : undefined
      }).addTo(layerGroup);
    });

  }, [incidents, residents, selectedIncident]);

  return (
    <div className="relative w-full h-full min-h-[300px] border border-gray-200 rounded-xl overflow-hidden shadow-inner bg-slate-50">
      <div ref={mapContainerRef} className="w-full h-full absolute inset-0" style={{ outline: 'none' }} />
      {interactive && (
        <div className="absolute bottom-2 left-2 z-[1000] bg-white/95 backdrop-blur px-2.5 py-1.5 rounded-lg border border-gray-200/80 shadow-md text-[10px] text-gray-600 flex flex-col gap-1 pointer-events-none select-none">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block border border-white"></span>
            <span>Critical / High Incident</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-orange-500 inline-block border border-white"></span>
            <span>Medium / Low Incident</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-green-500 inline-block border border-white"></span>
            <span>Resolved Incident</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-blue-500 inline-block"></span>
            <span>Citizen Profile Location</span>
          </div>
          <div className="mt-1 border-t pt-1 font-semibold text-gray-500 text-center">
            Double-click map to copy coordinates
          </div>
        </div>
      )}
    </div>
  );
};
