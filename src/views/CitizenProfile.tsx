import React, { useState } from 'react';
import type { User, LanguageCode, AccessibilityFormat } from '../db/types';
import { MapPin, Globe, Eye } from 'lucide-react';
import { Map } from '../components/Map';

interface CitizenProfileProps {
  citizen: User;
  onUpdateProfile: (updated: User) => void;
}

export const CitizenProfile: React.FC<CitizenProfileProps> = ({
  citizen,
  onUpdateProfile
}) => {
  const [name, setName] = useState(citizen.name);
  const [email, setEmail] = useState(citizen.email || '');
  const [phone, setPhone] = useState(citizen.phone || '');
  const [language, setLanguage] = useState<LanguageCode>(citizen.language);
  const [accessibility, setAccessibility] = useState<AccessibilityFormat>(citizen.accessibility);
  
  // Coordinates (fallback to Chennai center if missing)
  const [lat, setLat] = useState<number>(citizen.lat ?? 13.0418);
  const [lng, setLng] = useState<number>(citizen.lng ?? 80.2341);
  const [area, setArea] = useState(citizen.area || 'Adyar');
  const [route, setRoute] = useState(citizen.route || 'Route 18');
  
  const [profileUpdated, setProfileUpdated] = useState(false);

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();

    const updatedUser: User = {
      ...citizen,
      name,
      email,
      phone,
      language,
      accessibility,
      lat: Number(lat),
      lng: Number(lng),
      area,
      route
    };

    onUpdateProfile(updatedUser);
    setProfileUpdated(true);
    setTimeout(() => setProfileUpdated(false), 3000);
  };

  const handleMapClick = (selectedLat: number, selectedLng: number) => {
    setLat(selectedLat);
    setLng(selectedLng);
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 h-[calc(100vh-140px)]">
      
      {/* Profile Form Pane */}
      <div className="xl:col-span-1 bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden h-full flex flex-col justify-between">
        <form onSubmit={handleUpdate} className="flex-1 overflow-y-auto p-6 space-y-5">
          <div className="border-b pb-2 mb-4">
            <h3 className="font-bold text-gray-800 text-base">My Profile Settings</h3>
            <p className="text-xs text-gray-400">Configure preferences and geofence coordinates to customize alerts.</p>
          </div>

          {profileUpdated && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs font-bold text-center">
              Preferences updated successfully! Alerts adjusted.
            </div>
          )}

          <div className="space-y-3 text-xs font-semibold text-gray-700">
            
            {/* Identity details */}
            <div>
              <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:border-blue-500"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg p-2 outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">Phone</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg p-2 outline-none font-mono"
                />
              </div>
            </div>

            {/* Language Selection */}
            <div>
              <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1 flex items-center gap-1">
                <Globe size={11} /> Preferred Language
              </label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as LanguageCode)}
                className="w-full border border-gray-300 rounded-lg p-2.5 outline-none"
              >
                <option value="en">English (default)</option>
                <option value="ta">Tamil (தமிழ்)</option>
                <option value="hi">Hindi (हिन्दी)</option>
              </select>
            </div>

            {/* Accessibility Preferences */}
            <div>
              <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1 flex items-center gap-1">
                <Eye size={11} /> Accessibility Requirement
              </label>
              <select
                value={accessibility}
                onChange={(e) => setAccessibility(e.target.value as AccessibilityFormat)}
                className="w-full border border-gray-300 rounded-lg p-2.5 outline-none"
              >
                <option value="standard">Standard Text Output</option>
                <option value="simplified">Simplified Language (Short Sentences)</option>
                <option value="large_text">Large Type Size (Low Vision)</option>
                <option value="high_contrast">High Contrast Mode</option>
                <option value="screen_reader">Screen Reader Layout (ARIA landmarks)</option>
                <option value="audio">Text-To-Speech Playback Optimization</option>
              </select>
            </div>

            {/* Coordinate values */}
            <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-lg border">
              <div>
                <label className="block text-[9px] font-bold text-gray-400 uppercase">Latitude</label>
                <input
                  type="number"
                  step="0.00001"
                  value={lat}
                  onChange={(e) => setLat(Number(e.target.value))}
                  className="w-full text-xs border border-gray-200 rounded-md p-1.5 outline-none font-mono"
                />
              </div>
              <div>
                <label className="block text-[9px] font-bold text-gray-400 uppercase">Longitude</label>
                <input
                  type="number"
                  step="0.00001"
                  value={lng}
                  onChange={(e) => setLng(Number(e.target.value))}
                  className="w-full text-xs border border-gray-200 rounded-md p-1.5 outline-none font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">Current Sector/Area</label>
                <input
                  type="text"
                  value={area}
                  onChange={(e) => setArea(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg p-2 outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">Transit Route Path</label>
                <input
                  type="text"
                  value={route}
                  onChange={(e) => setRoute(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg p-2 outline-none font-mono"
                />
              </div>
            </div>

          </div>
          
          <div className="pt-4 border-t flex justify-end">
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow cursor-pointer transition-colors"
            >
              Update Preferences & Relocate
            </button>
          </div>
        </form>
      </div>

      {/* Map Pane for coordinates pinning */}
      <div className="xl:col-span-2 bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden h-full flex flex-col p-6 space-y-4">
        <div>
          <h4 className="text-sm font-bold text-gray-800 flex items-center gap-1.5">
            <MapPin size={16} className="text-blue-500" /> Relocate on Interactive Map
          </h4>
          <p className="text-xs text-gray-400 mt-1">
            Double-click on the Chennai map below to shift your coordinates and check if active incident radii enclose your sector.
          </p>
        </div>
        
        <div className="flex-1 min-h-[350px] border border-gray-200 rounded-xl overflow-hidden shadow-inner">
          <Map
            incidents={[]}
            residents={[{ ...citizen, lat, lng }]}
            selectedIncident={null}
            onMapClick={handleMapClick}
            interactive={true}
          />
        </div>
      </div>

    </div>
  );
};
