import React, { useState } from 'react';
import type { Incident, Notification, User } from '../db/types';
import { ShieldAlert, RotateCw, RefreshCw } from 'lucide-react';
import { checkCitizenStatus } from '../utils/locationMatch';
import { generateMessageContent } from '../utils/messageGen';

interface ErrorAnalysisProps {
  incidents: Incident[];
  notifications: Notification[];
  residents: User[];
  onRetryNotification: (notifId: string) => void;
}

export const ErrorAnalysis: React.FC<ErrorAnalysisProps> = ({
  incidents,
  notifications,
  residents,
  onRetryNotification
}) => {
  const [activeCase, setActiveCase] = useState<number>(1);
  const [retryingId, setRetryingId] = useState<string | null>(null);

  // 1. Missing Location Sandbox State
  const [testUserNoLoc] = useState<User>({
    id: 'test-noloc',
    name: 'Test Resident (Missing GPS)',
    role: 'citizen',
    language: 'en',
    accessibility: 'standard',
    lat: undefined,
    lng: undefined,
    area: undefined,
    route: 'Route 18'
  });

  // 2. Unsupported Language Sandbox State
  const [testLang, setTestLang] = useState<string>('fr'); // French
  
  // 5. Failed Notifications List
  const failedNotifs = notifications.filter(n => n.status === 'failed');

  const handleRetry = (id: string) => {
    setRetryingId(id);
    setTimeout(() => {
      onRetryNotification(id);
      setRetryingId(null);
    }, 800); // 800ms delay simulation
  };

  // Run matching logic for Case 1
  const testIncident = incidents[0]; // Anna Nagar Flood
  const matchResult = testIncident ? checkCitizenStatus(testUserNoLoc, testIncident) : null;

  // Run translation logic for Case 2
  const fallbackResult = testIncident 
    ? generateMessageContent(testIncident, testLang as any, 'standard', residents[0])
    : null;

  return (
    <div className="space-y-6">
      
      {/* Sandbox Header */}
      <div className="p-4 bg-rose-900 border border-rose-800 text-white rounded-xl shadow flex items-center gap-3">
        <ShieldAlert size={24} className="text-rose-200 animate-pulse shrink-0" />
        <div>
          <h3 className="font-bold text-sm">Failure-Mode Sandbox & Error Log Analysis</h3>
          <p className="text-xs text-rose-200">
            Interactive playground to test and audit critical system failure modes.
          </p>
        </div>
      </div>

      {/* Selector Tabs */}
      <div className="flex border-b border-gray-200 overflow-x-auto bg-white rounded-xl p-1 shadow-sm gap-1">
        {[
          { id: 1, label: '1. Missing Location' },
          { id: 2, label: '2. Unsupported Language' },
          { id: 3, label: '3. Conflicting Agencies' },
          { id: 4, label: '4. Outdated Incident' },
          { id: 5, label: '5. Notification Delivery Retry' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveCase(tab.id)}
            className={`px-4 py-2 text-xs font-bold rounded-lg whitespace-nowrap cursor-pointer transition-colors ${
              activeCase === tab.id
                ? 'bg-rose-100 text-rose-800'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Case Sandboxes */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 min-h-[300px]">
        
        {/* CASE 1: MISSING LOCATION */}
        {activeCase === 1 && (
          <div className="space-y-4">
            <div className="border-b pb-2">
              <h4 className="font-bold text-gray-800 text-sm uppercase">Failure Case 1 – Missing Coordinate Coordinates</h4>
              <p className="text-xs text-gray-400">If a citizen profile has no registered coordinates, do not assume containment. Mark for review.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs font-semibold">
              <div className="space-y-3 bg-slate-50 p-4 border rounded-lg">
                <div className="text-[10px] font-bold text-gray-400 uppercase">Input Citizen Profile</div>
                <div className="space-y-1 bg-white p-3 rounded border">
                  <p><strong>Name:</strong> {testUserNoLoc.name}</p>
                  <p><strong>Latitude:</strong> <span className="text-red-500 italic">undefined</span></p>
                  <p><strong>Longitude:</strong> <span className="text-red-500 italic">undefined</span></p>
                  <p><strong>Route:</strong> {testUserNoLoc.route}</p>
                </div>
              </div>

              <div className="space-y-3 bg-rose-50/50 p-4 border border-rose-100 rounded-lg">
                <div className="text-[10px] font-bold text-rose-700 uppercase">System Assertion Status</div>
                <div className="space-y-2 bg-white p-3 rounded border border-rose-200">
                  <div className="flex justify-between items-center">
                    <span>Target Classified:</span>
                    <span className="bg-rose-100 text-rose-800 text-[10px] font-bold px-2 py-0.5 rounded uppercase">Blocked</span>
                  </div>
                  <div className="mt-2 border-t pt-2">
                    <span className="text-[10px] font-bold text-red-500 uppercase">Assertion Output:</span>
                    <p className="font-mono text-red-700 mt-1 font-bold">
                      "{matchResult?.reason}"
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* CASE 2: UNSUPPORTED LANGUAGE */}
        {activeCase === 2 && (
          <div className="space-y-4">
            <div className="border-b pb-2">
              <h4 className="font-bold text-gray-800 text-sm uppercase">Failure Case 2 – Unsupported Language Fallback</h4>
              <p className="text-xs text-gray-400">If translation files for the user preferred language do not exist, use a safe fallback and highlight it.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs font-semibold">
              <div className="space-y-3 bg-slate-50 p-4 border rounded-lg">
                <div className="text-[10px] font-bold text-gray-400 uppercase">Configure Input Language</div>
                <div className="flex gap-2">
                  <select
                    value={testLang}
                    onChange={(e) => setTestLang(e.target.value)}
                    className="text-xs border rounded p-2 bg-white outline-none"
                  >
                    <option value="fr">French (fr)</option>
                    <option value="de">German (de)</option>
                    <option value="ja">Japanese (ja)</option>
                  </select>
                </div>
                <div className="space-y-1 bg-white p-3 rounded border">
                  <p><strong>Incident Title:</strong> {testIncident?.title}</p>
                  <p><strong>Requested Lang:</strong> {testLang.toUpperCase()}</p>
                </div>
              </div>

              <div className="space-y-3 bg-rose-50/50 p-4 border border-rose-100 rounded-lg">
                <div className="text-[10px] font-bold text-rose-700 uppercase font-mono">System Translation Output</div>
                <div className="space-y-2 bg-white p-3 rounded border border-rose-200">
                  <div className="flex justify-between items-center text-[10px]">
                    <span>Fallback Triggered:</span>
                    <span className="bg-amber-100 text-amber-800 font-bold px-1.5 py-0.5 rounded">TRUE (Fall back to EN)</span>
                  </div>
                  <div className="text-[10px] text-amber-700 bg-amber-50 p-2 rounded font-medium border border-amber-200 leading-tight">
                    {fallbackResult?.warningText}
                  </div>
                  <div className="border-t pt-2">
                    <p className="font-bold text-[10px] text-gray-500 uppercase">Draft content (Subject):</p>
                    <p className="font-mono mt-1 text-slate-800 text-[11px] leading-tight">{fallbackResult?.subject}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* CASE 3: CONFLICTING INCIDENT INFO */}
        {activeCase === 3 && (
          <div className="space-y-4">
            <div className="border-b pb-2">
              <h4 className="font-bold text-gray-800 text-sm uppercase">Failure Case 3 – Conflicting Agency Reports</h4>
              <p className="text-xs text-gray-400">If multiple responding agencies publish conflicting data (e.g. roads closed vs. open), automatically block dispatching alerts.</p>
            </div>

            <div className="p-4 bg-slate-50 border rounded-lg text-xs space-y-3 font-semibold">
              <div className="flex items-center justify-between border-b pb-2">
                <span className="text-gray-700 font-bold">Conflict Demonstration:</span>
                <span className="bg-red-100 text-red-800 text-[10px] font-bold px-2 py-0.5 rounded uppercase">Review Queue Lock Active</span>
              </div>
              <div className="bg-white p-3 border rounded space-y-2 font-mono text-[11px] text-slate-700 leading-relaxed">
                <p><strong>Incident ID:</strong> inc-6 (Conflicting clearance routes)</p>
                <p><strong>Agency A (Traffic):</strong> "Route 18 tree cleared. Bus flows open."</p>
                <p><strong>Agency B (DRF Rescue):</strong> "Water log still active. Route 18 completely closed."</p>
                <p className="text-red-600 font-bold mt-1">
                  System Reaction: Conflicting reports detected. Alert drafted locked. Operator manual resolution required.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* CASE 4: OUTDATED INCIDENT */}
        {activeCase === 4 && (
          <div className="space-y-4">
            <div className="border-b pb-2">
              <h4 className="font-bold text-gray-800 text-sm uppercase">Failure Case 4 – Outdated Log Verification Warning</h4>
              <p className="text-xs text-gray-400">If a disruption report has not been updated in over 12 hours, highlight the log as "Outdated" and prompt verification before approving alerts.</p>
            </div>

            <div className="p-4 bg-slate-50 border rounded-lg text-xs space-y-3 font-semibold">
              <div className="flex items-center justify-between border-b pb-2">
                <span className="text-gray-700 font-bold">Outdated Log Simulation:</span>
                <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded uppercase">Stale Alert Flag</span>
              </div>
              <div className="bg-white p-3 border rounded space-y-2 font-mono text-[11px] text-slate-700 leading-relaxed">
                <p><strong>Incident ID:</strong> inc-7 (Mylapore pipe rupture)</p>
                <p><strong>Last Updated Timestamp:</strong> {new Date(Date.now() - 3600000 * 20).toLocaleString()} (&gt; 12 hours ago)</p>
                <p className="text-amber-700 font-bold mt-1">
                  System Action: Marks alert preview with "Warning: Information may be outdated – verification required".
                </p>
              </div>
            </div>
          </div>
        )}

        {/* CASE 5: NOTIFICATION DELIVERY FAILURE RETRY */}
        {activeCase === 5 && (
          <div className="space-y-4">
            <div className="border-b pb-2">
              <h4 className="font-bold text-gray-800 text-sm uppercase">Failure Case 5 – Delivery Failures & Retry Sandbox</h4>
              <p className="text-xs text-gray-400">Simulate network drops. Failed notifications are logged in the dashboard, and operators can retry dispatches manually.</p>
            </div>

            {failedNotifs.length === 0 ? (
              <div className="text-center text-gray-400 py-12 text-xs font-semibold">
                No active delivery failures logged.
              </div>
            ) : (
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <table className="w-full text-left text-xs font-semibold">
                  <thead>
                    <tr className="bg-gray-50 border-b text-gray-500 uppercase text-[10px]">
                      <th className="p-3">Notif ID</th>
                      <th className="p-3">Incident</th>
                      <th className="p-3">Resident ID</th>
                      <th className="p-3">Channel</th>
                      <th className="p-3">Failure Reason</th>
                      <th className="p-3 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-gray-700 font-medium font-mono">
                    {failedNotifs.slice(0, 5).map(notif => (
                      <tr key={notif.id}>
                        <td className="p-3">{notif.id}</td>
                        <td className="p-3 text-gray-600 truncate max-w-[150px]">{notif.incidentId}</td>
                        <td className="p-3">{notif.residentId}</td>
                        <td className="p-3 capitalize">{notif.channel}</td>
                        <td className="p-3 text-red-600 font-bold font-sans">{notif.errorMessage}</td>
                        <td className="p-3 text-center">
                          <button
                            onClick={() => handleRetry(notif.id)}
                            disabled={retryingId === notif.id}
                            className="px-2 py-1 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-700 rounded font-sans font-bold flex items-center gap-1 mx-auto cursor-pointer"
                          >
                            {retryingId === notif.id ? (
                              <>
                                <RefreshCw size={11} className="animate-spin" />
                                Retrying...
                              </>
                            ) : (
                              <>
                                <RotateCw size={11} />
                                Retry Dispatch
                              </>
                            )}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};
