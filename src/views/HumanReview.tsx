import React, { useState } from 'react';
import type { Message, Incident } from '../db/types';
import { CheckSquare, ShieldAlert, CheckCircle, XCircle, Edit3, HelpCircle, AlertTriangle } from 'lucide-react';

interface HumanReviewProps {
  messages: Message[];
  incidents: Incident[];
  onApproveMessage: (messageId: string, approvedBy: string) => void;
  onRejectMessage: (messageId: string, approvedBy: string) => void;
  onEditMessage: (messageId: string, newContent: string, editor: string) => void;
  currentUserName: string;
}

export const HumanReview: React.FC<HumanReviewProps> = ({
  messages,
  incidents,
  onApproveMessage,
  onRejectMessage,
  onEditMessage,
  currentUserName
}) => {
  const pendingMessages = messages.filter(m => m.status === 'pending_review');
  const [selectedMsg, setSelectedMsg] = useState<Message | null>(pendingMessages[0] || null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState('');

  const incident = selectedMsg 
    ? incidents.find(i => i.id === selectedMsg.incidentId) 
    : undefined;


  const handleSelectMessage = (msg: Message) => {
    setSelectedMsg(msg);
    setEditedContent(msg.content);
    setIsEditing(false);
  };

  const handleApprove = () => {
    if (!selectedMsg) return;
    onApproveMessage(selectedMsg.id, currentUserName);
    setSelectedMsg(null);
    setIsEditing(false);
  };

  const handleReject = () => {
    if (!selectedMsg) return;
    onRejectMessage(selectedMsg.id, currentUserName);
    setSelectedMsg(null);
    setIsEditing(false);
  };

  const handleSaveEdit = () => {
    if (!selectedMsg) return;
    onEditMessage(selectedMsg.id, editedContent, currentUserName);
    setIsEditing(false);
    // update local state
    setSelectedMsg({ ...selectedMsg, content: editedContent });
  };

  // Check Failure Case Warnings
  const hasConflict = incident?.agenciesConflicting === true;
  // Outdated checks: lastUpdated older than 12 hours ago
  const isOutdated = incident 
    ? (Date.now() - new Date(incident.lastUpdated).getTime()) > (3600 * 1000 * 12)
    : false;

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 h-[calc(100vh-140px)]">
      
      {/* Pending Drafts List Sidebar */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm flex flex-col overflow-hidden h-full">
        <div className="px-5 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center shrink-0">
          <h3 className="font-bold text-gray-800 text-sm">Review Queue</h3>
          <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full font-mono">
            {pendingMessages.length} PENDING
          </span>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-gray-100 p-2 space-y-1">
          {pendingMessages.length === 0 ? (
            <div className="text-center text-gray-400 py-12 text-xs font-semibold">
              No alert messages awaiting review.
            </div>
          ) : (
            pendingMessages.map(msg => {
              const inc = incidents.find(i => i.id === msg.incidentId);
              const isSelected = selectedMsg?.id === msg.id;

              return (
                <button
                  key={msg.id}
                  onClick={() => handleSelectMessage(msg)}
                  className={`w-full text-left p-3 rounded-lg border transition-all ${
                    isSelected
                      ? 'bg-amber-50/40 border-amber-500/30'
                      : 'border-transparent hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-bold text-gray-900 text-xs truncate leading-tight pr-2">
                      {inc?.title || 'Unknown Incident'}
                    </h4>
                    <span className="px-1.5 py-0.5 bg-amber-100 text-amber-800 text-[8px] font-extrabold uppercase shrink-0 rounded">
                      Draft
                    </span>
                  </div>
                  
                  <div className="mt-2.5 flex items-center justify-between text-[9px] font-mono text-gray-500">
                    <span className="capitalize">Lang: {msg.language}</span>
                    <span className="capitalize">Format: {msg.accessibilityFormat.replace('_', ' ')}</span>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Review Details Pane */}
      <div className="xl:col-span-2 bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden h-full flex flex-col">
        {selectedMsg && incident ? (
          <div className="flex-1 overflow-y-auto flex flex-col h-full">
            
            {/* MANDATORY REVIEW WARNING HEADER BANNER */}
            <div className="bg-red-50 border-b border-red-100 px-6 py-4 flex items-start gap-3 shrink-0">
              <ShieldAlert size={20} className="text-red-600 animate-pulse shrink-0 mt-0.5" />
              <div>
                <h4 className="font-extrabold text-red-900 text-sm uppercase tracking-wide">
                  Human approval required before high-impact alert delivery.
                </h4>
                <p className="text-[11px] text-red-700 font-medium">
                  This safety protocol ensures no automatic dispatches occur without manual oversight and validation.
                </p>
              </div>
            </div>

            <div className="flex-1 p-6 space-y-6 overflow-y-auto">
              
              {/* Failure Case Warnings block */}
              {(hasConflict || isOutdated) && (
                <div className="space-y-2">
                  
                  {/* Failure Case 3: Conflicting Agency Reports */}
                  {hasConflict && (
                    <div className="p-4 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 flex gap-2.5">
                      <AlertTriangle size={18} className="shrink-0 text-rose-600 mt-0.5" />
                      <div className="text-xs font-semibold">
                        <div className="font-bold uppercase tracking-wider text-rose-900">Failure Case 3: Conflicting Incident Information Blocked</div>
                        <p className="mt-1 font-medium leading-relaxed">
                          Agencies are report discrepant closure status (e.g. Traffic vs DRF). Geofence alerts locked. Verify operational clearance status before approving.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Failure Case 4: Outdated information warning */}
                  {isOutdated && (
                    <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 flex gap-2.5">
                      <AlertTriangle size={18} className="shrink-0 text-amber-600 mt-0.5" />
                      <div className="text-xs font-semibold">
                        <div className="font-bold uppercase tracking-wider text-amber-900">Failure Case 4: Information May Be Outdated</div>
                        <p className="mt-1 font-medium leading-relaxed">
                          This incident log has not been updated in over 12 hours (Last updated: {new Date(incident.lastUpdated).toLocaleString()}). Re-verify current status.
                        </p>
                      </div>
                    </div>
                  )}

                </div>
              )}

              {/* Draft Message Details Card */}
              <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                <div className="bg-gray-50 border-b px-4 py-2 text-xs font-bold text-gray-700 uppercase flex items-center justify-between">
                  <span>Draft Alert Preview</span>
                  <div className="flex gap-2">
                    <span className="bg-gray-200 px-2 py-0.5 rounded text-[9px] font-bold uppercase font-mono">LANG: {selectedMsg.language}</span>
                    <span className="bg-purple-100 text-purple-800 px-2 py-0.5 rounded text-[9px] font-bold uppercase font-mono">FORMAT: {selectedMsg.accessibilityFormat}</span>
                  </div>
                </div>
                
                <div className="p-4 space-y-4">
                  <div className="text-sm font-bold text-slate-800 border-b pb-1.5 font-mono">
                    Subject: {selectedMsg.subject}
                  </div>
                  
                  {isEditing ? (
                    <div className="space-y-2">
                      <textarea
                        value={editedContent}
                        onChange={(e) => setEditedContent(e.target.value)}
                        rows={6}
                        className="w-full text-xs font-mono border border-gray-300 rounded-lg p-2.5 outline-none focus:border-red-500"
                      />
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => { setIsEditing(false); setEditedContent(selectedMsg.content); }}
                          className="px-2.5 py-1.5 border rounded-lg text-xs font-bold text-gray-500 cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleSaveEdit}
                          className="px-2.5 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg cursor-pointer"
                        >
                          Save Changes
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-xs bg-slate-50 border p-3 rounded-lg font-mono leading-relaxed whitespace-pre-wrap select-text">
                      {selectedMsg.content}
                    </div>
                  )}

                  {!isEditing && (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="flex items-center gap-1.5 text-xs text-slate-600 hover:text-slate-800 font-bold border border-slate-200 px-2.5 py-1.5 rounded-lg hover:bg-slate-50 cursor-pointer"
                    >
                      <Edit3 size={12} /> Edit Alert Text
                    </button>
                  )}
                </div>
              </div>

              {/* Explainability Segment (Why this message?) */}
              <div className="border border-blue-100 rounded-xl overflow-hidden shadow-sm">
                <div className="bg-blue-50/50 px-4 py-2 border-b border-blue-100 text-xs font-bold text-blue-800 uppercase flex items-center gap-1.5">
                  <HelpCircle size={13} /> Why this message? (Explainability Engine)
                </div>
                <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-semibold text-gray-700">
                  <div className="space-y-2">
                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Targeting Criteria</div>
                    <ul className="space-y-1.5 list-disc list-inside">
                      <li className={selectedMsg.explanation.locationMatch ? 'text-green-700 font-bold' : 'text-gray-500'}>
                        {selectedMsg.explanation.locationMatch 
                          ? `Resident is inside matching geofence radius (${selectedMsg.explanation.distance?.toFixed(2)} km)` 
                          : 'Resident is outside the geographical radius circle'}
                      </li>
                      <li className={selectedMsg.explanation.routeMatch ? 'text-green-700 font-bold' : 'text-gray-500'}>
                        {selectedMsg.explanation.routeMatch 
                          ? 'Resident registered route matches affected transit routes' 
                          : 'Resident registered route is unaffected'}
                      </li>
                    </ul>
                  </div>

                  <div className="space-y-2">
                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Adaptation Rationale</div>
                    <ul className="space-y-1.5 list-disc list-inside text-slate-600">
                      <li>{selectedMsg.explanation.severityReason}</li>
                      <li>{selectedMsg.explanation.languageReason}</li>
                      <li>{selectedMsg.explanation.accessibilityReason}</li>
                    </ul>
                  </div>
                </div>
              </div>

            </div>

            {/* Actions footer */}
            <div className="p-4 border-t border-gray-100 bg-gray-50/50 flex justify-end gap-3 shrink-0">
              <button
                onClick={handleReject}
                className="px-4 py-2 border border-red-200 text-red-600 hover:bg-red-50 text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
                title="Reject this notification draft"
              >
                <XCircle size={14} /> Reject Alert
              </button>
              <button
                onClick={handleApprove}
                disabled={hasConflict}
                className={`px-4 py-2 text-white text-xs font-bold rounded-lg shadow transition-colors flex items-center gap-1.5 ${
                  hasConflict
                    ? 'bg-gray-400 border-gray-400 cursor-not-allowed'
                    : 'bg-emerald-600 hover:bg-emerald-700 cursor-pointer'
                }`}
                title={hasConflict ? 'Alert blocked due to agency conflicts' : 'Approve and deliver alert to the citizen'}
              >
                <CheckCircle size={14} /> Approve & Dispatch Alert
              </button>
            </div>

          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400 p-12">
            <CheckSquare size={40} className="mb-2" />
            <p className="text-sm font-semibold">Select a draft alert message from the queue to audit targeting explanation and translations.</p>
          </div>
        )}
      </div>

    </div>
  );
};
