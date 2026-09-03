import React, { useState } from 'react';
import type { Incident, IncidentType, SeverityLevel, User } from '../db/types';
import { AlertTriangle, Info, MapPin, Compass, PhoneCall, Clock } from 'lucide-react';
import { Map } from '../components/Map';
import { getAffectedResidents } from '../utils/locationMatch';

interface IncidentsViewProps {
  incidents: Incident[];
  residents: User[];
  onAddIncident: (inc: Incident) => void;
  onUpdateIncident: (inc: Incident) => void;
  onGenerateAlerts: (incident: Incident) => void;
}

export const IncidentsView: React.FC<IncidentsViewProps> = ({
  incidents,
  residents,
  onAddIncident,
  onUpdateIncident,
  onGenerateAlerts
}) => {
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(incidents[0] || null);
  const [isCreating, setIsCreating] = useState(false);

  // New Incident Form State
  const [title, setTitle] = useState('');
  const [type, setType] = useState<IncidentType>('flood');
  const [severity, setSeverity] = useState<SeverityLevel>('medium');
  const [description, setDescription] = useState('');
  const [lat, setLat] = useState<number>(13.0827);
  const [lng, setLng] = useState<number>(80.2707);
  const [radius, setRadius] = useState<number>(2.5);
  const [routesInput, setRoutesInput] = useState('');
  const [servicesInput, setServicesInput] = useState('');
  const [recommendedAction, setRecommendedAction] = useState('');
  const [emergencyContact, setEmergencyContact] = useState('');
  const [isStaleSim, setIsStaleSim] = useState(false);

  const affectedResData = selectedIncident 
    ? getAffectedResidents(residents, selectedIncident) 
    : [];

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description || !recommendedAction || !emergencyContact) {
      alert('Please fill out all fields.');
      return;
    }

    const newInc: Incident = {
      id: `inc-${Date.now()}`,
      title,
      type,
      description,
      severity,
      status: 'active',
      lat: Number(lat),
      lng: Number(lng),
      radius: Number(radius),
      affectedRoutes: routesInput ? routesInput.split(',').map(r => r.trim()) : [],
      affectedServices: servicesInput ? servicesInput.split(',').map(s => s.trim()) : ['General Public Safety'],
      recommendedAction,
      emergencyContact,
      startTime: new Date().toISOString(),
      lastUpdated: isStaleSim 
        ? new Date(Date.now() - 3600000 * 20).toISOString() // 20 hours ago (Stale for Failure Case 4)
        : new Date().toISOString()
    };

    onAddIncident(newInc);
    setSelectedIncident(newInc);
    setIsCreating(false);
    resetForm();
  };

  const resetForm = () => {
    setTitle('');
    setType('flood');
    setSeverity('medium');
    setDescription('');
    setLat(13.0827);
    setLng(80.2707);
    setRadius(2.5);
    setRoutesInput('');
    setServicesInput('');
    setRecommendedAction('');
    setEmergencyContact('');
    setIsStaleSim(false);
  };

  const toggleIncidentStatus = (inc: Incident) => {
    const updated = {
      ...inc,
      status: inc.status === 'active' ? ('resolved' as const) : ('active' as const),
      lastUpdated: new Date().toISOString()
    };
    onUpdateIncident(updated);
    setSelectedIncident(updated);
  };

  const handleMapPin = (selectedLat: number, selectedLng: number) => {
    setLat(selectedLat);
    setLng(selectedLng);
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 h-[calc(100vh-140px)]">
      
      {/* Incidents Sidebar List */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm flex flex-col overflow-hidden h-full">
        <div className="px-5 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center shrink-0">
          <h3 className="font-bold text-gray-800 text-sm">Disruption Logs</h3>
          <button
            onClick={() => { setIsCreating(true); setSelectedIncident(null); }}
            className="px-2.5 py-1 text-[11px] font-bold bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors cursor-pointer"
          >
            + Log New
          </button>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-gray-100 p-2 space-y-1">
          {incidents.map(inc => {
            const isSelected = selectedIncident?.id === inc.id;
            const isCritical = inc.severity === 'critical';
            const isHigh = inc.severity === 'high';
            const isActive = inc.status === 'active';

            return (
              <button
                key={inc.id}
                onClick={() => { setSelectedIncident(inc); setIsCreating(false); }}
                className={`w-full text-left p-3 rounded-lg border transition-all ${
                  isSelected
                    ? 'bg-red-50/40 border-red-500/30'
                    : 'border-transparent hover:bg-slate-50'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <h4 className="font-bold text-gray-900 text-xs truncate leading-tight pr-2">
                    {inc.title}
                  </h4>
                  <span className={`px-1.5 py-0.5 rounded text-[8px] font-extrabold uppercase shrink-0 ${
                    isActive ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                  }`}>
                    {inc.status}
                  </span>
                </div>
                
                <p className="text-[10px] text-gray-500 line-clamp-1 mt-1">{inc.description}</p>
                
                <div className="mt-2 flex items-center justify-between">
                  <span className={`px-1 py-0.2 rounded text-[9px] font-bold ${
                    isCritical ? 'bg-red-600 text-white' : isHigh ? 'bg-rose-500 text-white' : 'bg-orange-100 text-orange-800'
                  }`}>
                    {inc.severity.toUpperCase()}
                  </span>
                  <span className="text-[9px] text-gray-400 font-mono">
                    {new Date(inc.startTime).toLocaleDateString()}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Details Pane / Creation Pane */}
      <div className="xl:col-span-2 bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden h-full flex flex-col">
        {isCreating ? (
          /* CREATE DISRUPTION FORM */
          <form onSubmit={handleCreate} className="flex-1 overflow-y-auto p-6 space-y-4">
            <div className="border-b pb-2 mb-4">
              <h3 className="font-bold text-gray-800 text-base">Log New Emergency Disruption</h3>
              <p className="text-xs text-gray-400">Specify geographical coordinate bounds, affected lines, and safety actions.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Incident Title</label>
                <input
                  type="text"
                  placeholder="e.g., Waterlogging Usman Road"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full text-xs border border-gray-300 rounded-lg p-2.5 outline-none focus:border-red-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Incident Type</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as IncidentType)}
                    className="w-full text-xs border border-gray-300 rounded-lg p-2.5 outline-none"
                  >
                    <option value="flood">Flood</option>
                    <option value="cyclone">Cyclone</option>
                    <option value="earthquake">Earthquake</option>
                    <option value="fire">Fire</option>
                    <option value="landslide">Landslide</option>
                    <option value="road_closure">Road Closure</option>
                    <option value="public_transport_disruption">Transit Disruption</option>
                    <option value="power_outage">Power Outage</option>
                    <option value="water_supply_disruption">Water Outage</option>
                    <option value="communication_outage">Comms Outage</option>
                    <option value="evacuation">Evacuation</option>
                    <option value="extreme_weather">Severe Weather</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Severity</label>
                  <select
                    value={severity}
                    onChange={(e) => setSeverity(e.target.value as SeverityLevel)}
                    className="w-full text-xs border border-gray-300 rounded-lg p-2.5 outline-none"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical (Mandatory Review)</option>
                  </select>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Disruption Description</label>
              <textarea
                placeholder="Describe current disruption details..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full text-xs border border-gray-300 rounded-lg p-2.5 outline-none focus:border-red-500"
                required
              />
            </div>

            {/* Geographical settings */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-lg border">
              <div className="md:col-span-4 flex justify-between items-center text-xs">
                <span className="font-bold text-gray-700 uppercase">Geographical Bounds</span>
                <span className="text-gray-400 font-mono">Tip: Double-click map to place marker coordinates</span>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase">Latitude</label>
                <input
                  type="number"
                  step="0.00001"
                  value={lat}
                  onChange={(e) => setLat(Number(e.target.value))}
                  className="w-full text-xs border border-gray-300 rounded-lg p-2 outline-none font-mono"
                  required
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase">Longitude</label>
                <input
                  type="number"
                  step="0.00001"
                  value={lng}
                  onChange={(e) => setLng(Number(e.target.value))}
                  className="w-full text-xs border border-gray-300 rounded-lg p-2 outline-none font-mono"
                  required
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase">Radius (km)</label>
                <input
                  type="number"
                  step="0.1"
                  value={radius}
                  onChange={(e) => setRadius(Number(e.target.value))}
                  className="w-full text-xs border border-gray-300 rounded-lg p-2 outline-none font-mono"
                  required
                />
              </div>
              <div className="h-40 md:col-span-4">
                <Map incidents={[]} residents={[]} selectedIncident={null} onMapClick={handleMapPin} interactive={true} />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Affected Routes (Comma separated)</label>
                <input
                  type="text"
                  placeholder="e.g., Route 18, Route 5C"
                  value={routesInput}
                  onChange={(e) => setRoutesInput(e.target.value)}
                  className="w-full text-xs border border-gray-300 rounded-lg p-2.5 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Affected Services (Comma separated)</label>
                <input
                  type="text"
                  placeholder="e.g., Bus Transport, Electricity Grid"
                  value={servicesInput}
                  onChange={(e) => setServicesInput(e.target.value)}
                  className="w-full text-xs border border-gray-300 rounded-lg p-2.5 outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Recommended Safety Actions</label>
                <input
                  type="text"
                  placeholder="e.g., Evacuate to local school shelters"
                  value={recommendedAction}
                  onChange={(e) => setRecommendedAction(e.target.value)}
                  className="w-full text-xs border border-gray-300 rounded-lg p-2.5 outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Emergency Help Contact Line</label>
                <input
                  type="text"
                  placeholder="e.g., +91 44 2464 1234"
                  value={emergencyContact}
                  onChange={(e) => setEmergencyContact(e.target.value)}
                  className="w-full text-xs border border-gray-300 rounded-lg p-2.5 outline-none"
                  required
                />
              </div>
            </div>

            {/* Outdated failure case tester selector */}
            <div className="flex items-center gap-2 py-2">
              <input
                type="checkbox"
                id="outdatedSim"
                checked={isStaleSim}
                onChange={(e) => setIsStaleSim(e.target.checked)}
                className="rounded"
              />
              <label htmlFor="outdatedSim" className="text-xs font-semibold text-gray-600">
                Simulate Outdated/Stale Log (Forces Last Updated Timestamp &gt; 12 hours ago)
              </label>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <button
                type="button"
                onClick={() => { setIsCreating(false); setSelectedIncident(incidents[0] || null); }}
                className="px-4 py-2 border rounded-lg text-xs font-semibold text-gray-500 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-semibold shadow transition-colors cursor-pointer"
              >
                Log Disruption & Generate Alerts
              </button>
            </div>
          </form>
        ) : selectedIncident ? (
          /* INCIDENT DETAIL PANE */
          <div className="flex-1 overflow-y-auto flex flex-col h-full">
            
            {/* Detail Header */}
            <div className="p-6 border-b border-gray-200 bg-gray-50 flex items-start justify-between flex-wrap gap-4">
              <div>
                <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                  selectedIncident.severity === 'critical' ? 'bg-red-600 text-white animate-pulse' : 'bg-orange-100 text-orange-800'
                }`}>
                  {selectedIncident.severity} Severity
                </span>
                <h3 className="font-bold text-gray-900 text-lg mt-1">{selectedIncident.title}</h3>
                <p className="text-xs text-gray-500 flex items-center gap-1 mt-1 font-mono">
                  <Clock size={12} /> Last updated: {new Date(selectedIncident.lastUpdated).toLocaleString()}
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => toggleIncidentStatus(selectedIncident)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer border ${
                    selectedIncident.status === 'active' 
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                      : 'bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100'
                  }`}
                >
                  {selectedIncident.status === 'active' ? 'Mark Resolved' : 'Mark Active'}
                </button>
                
                {selectedIncident.status === 'active' && (
                  <button
                    onClick={() => {
                      onGenerateAlerts(selectedIncident);
                      alert(`Personalized alerts drafted for ${affectedResData.length} affected residents. Awaiting human review.`);
                    }}
                    className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-lg shadow cursor-pointer"
                  >
                    Compile Alert Drafts
                  </button>
                )}
              </div>
            </div>

            {/* Detail Body split: stats vs map */}
            <div className="flex-1 p-6 grid grid-cols-1 md:grid-cols-2 gap-6 overflow-y-auto">
              
              {/* Left Column: Stats & Metadata */}
              <div className="space-y-5">
                
                {/* Description block */}
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-gray-500 uppercase">Description</h4>
                  <p className="text-sm text-gray-800 leading-relaxed font-medium bg-slate-50 p-3 rounded-lg border border-slate-100">
                    {selectedIncident.description}
                  </p>
                </div>

                {/* Operations Checklist info */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-50 border p-3 rounded-lg">
                    <div className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1">
                      <Compass size={12} className="text-slate-400" /> Affected Roads
                    </div>
                    <div className="text-xs font-semibold text-slate-800 mt-1 font-mono">
                      {selectedIncident.affectedRoutes.join(', ') || 'None'}
                    </div>
                  </div>
                  <div className="bg-slate-50 border p-3 rounded-lg">
                    <div className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1">
                      <PhoneCall size={12} className="text-slate-400" /> Command Line
                    </div>
                    <div className="text-xs font-semibold text-slate-800 mt-1 font-mono">
                      {selectedIncident.emergencyContact}
                    </div>
                  </div>
                </div>

                {/* Impact statistics */}
                <div className="border border-red-100 rounded-lg overflow-hidden">
                  <div className="bg-red-50/50 px-4 py-2 border-b border-red-100 text-xs font-bold text-red-800 uppercase flex items-center gap-1.5">
                    <AlertTriangle size={13} /> Geospatial Demographics Impact
                  </div>
                  
                  <div className="p-4 space-y-3.5 text-xs font-semibold">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500">Total Residents inside affected radius/routes:</span>
                      <span className="font-bold text-red-700 bg-red-100/50 px-2 py-0.5 rounded-full font-mono text-sm">
                        {affectedResData.length}
                      </span>
                    </div>

                    <div className="border-t pt-2 space-y-1.5">
                      <div className="text-[10px] font-bold text-gray-400 uppercase">Preferred Languages Needed:</div>
                      <div className="flex flex-wrap gap-2 text-[10px]">
                        <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-mono">
                          Tamil: {affectedResData.filter(item => item.resident.language === 'ta').length}
                        </span>
                        <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-mono">
                          English: {affectedResData.filter(item => item.resident.language === 'en').length}
                        </span>
                        <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-mono">
                          Hindi: {affectedResData.filter(item => item.resident.language === 'hi').length}
                        </span>
                      </div>
                    </div>

                    <div className="border-t pt-2 space-y-1.5">
                      <div className="text-[10px] font-bold text-gray-400 uppercase">Accessibility Formats Required:</div>
                      <div className="flex flex-wrap gap-1.5 text-[9px] font-mono">
                        <span className="bg-purple-50 text-purple-700 border border-purple-100 px-1.5 py-0.5 rounded">
                          Std Text: {affectedResData.filter(item => item.resident.accessibility === 'standard').length}
                        </span>
                        <span className="bg-purple-50 text-purple-700 border border-purple-100 px-1.5 py-0.5 rounded">
                          Simplified: {affectedResData.filter(item => item.resident.accessibility === 'simplified').length}
                        </span>
                        <span className="bg-purple-50 text-purple-700 border border-purple-100 px-1.5 py-0.5 rounded">
                          Large Text: {affectedResData.filter(item => item.resident.accessibility === 'large_text').length}
                        </span>
                        <span className="bg-purple-50 text-purple-700 border border-purple-100 px-1.5 py-0.5 rounded">
                          ScreenReader: {affectedResData.filter(item => item.resident.accessibility === 'screen_reader').length}
                        </span>
                        <span className="bg-purple-50 text-purple-700 border border-purple-100 px-1.5 py-0.5 rounded">
                          Audio Format: {affectedResData.filter(item => item.resident.accessibility === 'audio').length}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

              </div>

              {/* Right Column: Zone Map */}
              <div className="space-y-2 h-full flex flex-col">
                <h4 className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1">
                  <MapPin size={12} className="text-red-500" /> Zone Coverage Map
                </h4>
                <div className="flex-1 min-h-[250px] border border-gray-200 rounded-lg overflow-hidden shadow-inner">
                  <Map incidents={[selectedIncident]} residents={residents} selectedIncident={selectedIncident} interactive={true} />
                </div>
              </div>

            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400 p-12">
            <Info size={40} className="mb-2" />
            <p className="text-sm font-semibold">Select an incident to view coordinates, map bounds, and affected demographics.</p>
          </div>
        )}
      </div>

    </div>
  );
};
