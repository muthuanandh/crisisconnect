import React, { useState } from 'react';
import type { Incident, Notification, Feedback, User } from '../db/types';
import { Bell, Check, Volume2, HelpCircle, Square, Eye, AlertTriangle, X, Send } from 'lucide-react';
import { generateBaselineMessage, generateMessageContent } from '../utils/messageGen';
import { api } from '../services/api';

interface CitizenAlertsProps {
  citizen: User;
  incidents: Incident[];
  notifications: Notification[];
  onSubmitFeedback: (fb: Feedback) => void;
}

export const CitizenAlerts: React.FC<CitizenAlertsProps> = ({
  citizen,
  incidents,
  notifications,
  onSubmitFeedback
}) => {
  // Get notifications delivered to this citizen
  const citizenNotifs = notifications.filter(
    n => n.residentId === citizen.id && n.status === 'delivered'
  );

  const [selectedNotif, setSelectedNotif] = useState<Notification | null>(citizenNotifs[0] || null);
  const [showBaselineCompare, setShowBaselineCompare] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  
  // Feedback form states
  const [understandable, setUnderstandable] = useState(true);
  const [timely, setTimely] = useState(true);
  const [rating, setRating] = useState(5);
  const [comments, setComments] = useState('');
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);

  // Citizen Field Report state
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportType, setReportType] = useState('Flood');
  const [reportDesc, setReportDesc] = useState('');
  const [reportLocation, setReportLocation] = useState(citizen.area || 'Singanallur');
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [reportSuccess, setReportSuccess] = useState(false);

  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportDesc) return;

    setReportSubmitting(true);
    await api.addCitizenReport({
      citizenId: citizen.id,
      citizenName: citizen.name,
      reportType,
      description: reportDesc,
      lat: citizen.lat || 11.00,
      lng: citizen.lng || 77.00,
      locationName: reportLocation,
      severity: 'high'
    });

    setReportSubmitting(false);
    setReportSuccess(true);
    setTimeout(() => {
      setReportSuccess(false);
      setShowReportModal(false);
      setReportDesc('');
    }, 1800);
  };

  const incident = selectedNotif
    ? incidents.find(i => i.id === selectedNotif.incidentId)
    : undefined;

  // Compile active tailored message content dynamically
  const tailoredMsg = incident
    ? generateMessageContent(incident, citizen.language, citizen.accessibility, citizen)
    : { subject: '', content: '' };

  const baselineMsg = generateBaselineMessage();

  const handleSpeak = (text: string) => {
    if (!('speechSynthesis' in window)) {
      alert('Text-to-speech is not supported on this browser.');
      return;
    }

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    
    // Attempt to set matching voice locale
    if (citizen.language === 'ta') {
      utterance.lang = 'ta-IN';
    } else if (citizen.language === 'hi') {
      utterance.lang = 'hi-IN';
    } else {
      utterance.lang = 'en-IN';
    }

    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    
    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  const stopSpeaking = () => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  };

  const handleFeedbackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedNotif || !incident) return;

    const newFb: Feedback = {
      id: `fb-${Date.now()}`,
      notificationId: selectedNotif.id,
      incidentId: incident.id,
      citizenId: citizen.id,
      understandable,
      timely,
      rating,
      comments,
      submittedAt: new Date().toISOString(),
      systemType: selectedNotif.systemType
    };

    onSubmitFeedback(newFb);
    setFeedbackSubmitted(true);
  };

  const selectNotification = (notif: Notification) => {
    setSelectedNotif(notif);
    setFeedbackSubmitted(false);
    setComments('');
    stopSpeaking();
  };

  // Accessibility formatting mappings
  const isLargeText = citizen.accessibility === 'large_text';
  const isHighContrast = citizen.accessibility === 'high_contrast';

  return (
    <div className={`grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-140px)] ${isHighContrast ? 'high-contrast' : ''}`}>
      
      {/* Citizens Alerts Feed Sidebar */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm flex flex-col overflow-hidden h-full">
        <div className="px-5 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center shrink-0">
          <h3 className="font-bold text-gray-800 text-sm flex items-center gap-1.5">
            <Bell size={16} className="text-red-500 animate-swing" /> Active Alerts Affecting Me
          </h3>
          <button
            onClick={() => setShowReportModal(true)}
            className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white rounded-md text-xs font-bold flex items-center gap-1 shadow-sm transition-colors cursor-pointer"
          >
            <AlertTriangle size={12} /> Submit Report
          </button>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-gray-100 p-2 space-y-1">
          {citizenNotifs.length === 0 ? (
            <div className="text-center text-gray-400 py-12 text-xs font-semibold">
              No active alerts in your immediate sector or routes.
            </div>
          ) : (
            citizenNotifs.map(notif => {
              const inc = incidents.find(i => i.id === notif.incidentId);
              const isSelected = selectedNotif?.id === notif.id;

              return (
                <button
                  key={notif.id}
                  onClick={() => selectNotification(notif)}
                  className={`w-full text-left p-3 rounded-lg border transition-all ${
                    isSelected
                      ? 'bg-red-50/40 border-red-500/30'
                      : 'border-transparent hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-gray-900 text-xs truncate leading-tight pr-2">
                      {inc?.title || 'Emergency Disruption'}
                    </h4>
                    <span className="w-2.5 h-2.5 bg-red-500 rounded-full animate-ping inline-block shrink-0"></span>
                  </div>
                  <div className="mt-2 text-[10px] text-gray-400">
                    Received: {new Date(notif.sentAt).toLocaleTimeString()}
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Main Alert Detail & Interaction Pane */}
      <div className="lg:col-span-2 bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden h-full flex flex-col">
        {selectedNotif && incident ? (
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            
            {/* Subject and Action tools */}
            <div className="border-b pb-4 flex justify-between items-start flex-wrap gap-4">
              <div>
                <h2 className={`font-extrabold text-gray-900 ${isLargeText ? 'text-2xl' : 'text-base'}`}>
                  {tailoredMsg.subject}
                </h2>
                <p className="text-xs text-gray-400 font-mono mt-1">
                  Alert ID: {selectedNotif.id} | Timestamp: {new Date(selectedNotif.sentAt).toLocaleString()}
                </p>
              </div>

              {/* Text-To-Speech Play controls (Accessibility Audio feature) */}
              <div className="flex items-center gap-2">
                {isSpeaking ? (
                  <button
                    onClick={stopSpeaking}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-red-100 hover:bg-red-200 text-red-700 border border-red-200 rounded-lg font-bold cursor-pointer transition-colors"
                  >
                    <Square size={13} fill="currentColor" /> Stop Audio
                  </button>
                ) : (
                  <button
                    onClick={() => handleSpeak(tailoredMsg.content)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 border border-blue-200 rounded-lg font-bold cursor-pointer transition-colors"
                    aria-label="Read alert aloud"
                  >
                    <Volume2 size={13} /> Play Audio Readout
                  </button>
                )}

                <button
                  onClick={() => setShowBaselineCompare(!showBaselineCompare)}
                  className="flex items-center gap-1 text-xs text-slate-600 hover:text-slate-800 font-bold border px-2.5 py-1.5 rounded-lg hover:bg-slate-50 cursor-pointer"
                >
                  <Eye size={12} /> {showBaselineCompare ? 'Hide Comparison' : 'Show Baseline Comparison'}
                </button>
              </div>
            </div>

            {/* Side-by-side Comparison panel if toggled */}
            {showBaselineCompare ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-4 border rounded-xl shadow-inner">
                
                {/* Proposed adaptive message */}
                <div className="space-y-2">
                  <span className="px-2 py-0.5 bg-green-100 text-green-800 text-[10px] font-bold rounded-full font-mono uppercase">
                    Proposed Adaptive Alert
                  </span>
                  <div className={`p-3 bg-white border border-green-200 rounded-lg shadow-sm leading-relaxed whitespace-pre-wrap select-text font-semibold ${
                    isLargeText ? 'text-xl' : 'text-xs'
                  }`}>
                    {tailoredMsg.content}
                  </div>
                </div>

                {/* Baseline generic message */}
                <div className="space-y-2">
                  <span className="px-2 py-0.5 bg-gray-200 text-gray-700 text-[10px] font-bold rounded-full font-mono uppercase">
                    Baseline Generic Alert
                  </span>
                  <div className="p-3 bg-white border border-gray-200 rounded-lg shadow-sm text-xs leading-relaxed text-gray-500 whitespace-pre-wrap select-text font-mono">
                    {baselineMsg.content}
                  </div>
                </div>
              </div>
            ) : (
              /* Single Tailored Message Render box */
              <div className={`p-5 bg-slate-50/50 border rounded-xl shadow-inner leading-relaxed whitespace-pre-wrap select-text ${
                isLargeText ? 'text-2xl font-bold' : 'text-xs font-semibold text-slate-800'
              }`}>
                {tailoredMsg.content}
              </div>
            )}

            {/* Explainability Block: "Why this alert was generated?" */}
            <div className="border border-blue-100 rounded-xl overflow-hidden shadow-sm">
              <div className="bg-blue-50/50 px-4 py-2 border-b border-blue-100 text-xs font-bold text-blue-800 uppercase flex items-center gap-1.5">
                <HelpCircle size={13} /> Why did I receive this alert? (Citizens Explainability)
              </div>
              <div className="p-4 text-xs font-semibold text-slate-700 space-y-2.5">
                <p>
                  Our system determines target communications based on your registered details:
                </p>
                <ul className="space-y-1.5 list-disc list-inside bg-white p-3 rounded-lg border border-slate-100 font-mono text-[10px]">
                  <li>Language match: Selected <span className="text-blue-700 uppercase font-bold">{citizen.language}</span> version based on your preferred profiles.</li>
                  <li>Accessibility: Scaled output layout matches <span className="text-purple-700 uppercase font-bold">{citizen.accessibility}</span> preference.</li>
                  {incident && (
                    <>
                      <li>Geographical link: Incident severity is <span className="text-red-700 uppercase font-bold">{incident.severity}</span>, which triggers targeted geofence dispatches.</li>
                      {citizen.route && incident.affectedRoutes.includes(citizen.route) && (
                        <li>Route match: Your transit path (<span className="text-amber-700 font-bold">{citizen.route}</span>) is directly impacted.</li>
                      )}
                    </>
                  )}
                </ul>
              </div>
            </div>

            {/* Feedback Submission Form */}
            <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm">
              <div className="bg-gray-50 border-b px-4 py-2.5 text-xs font-bold text-gray-700 uppercase flex items-center justify-between">
                <span>Alert Comprehensibility Feedback</span>
                <span className="text-[10px] text-gray-400 font-normal">Calculates dynamic benchmarks</span>
              </div>
              
              {feedbackSubmitted ? (
                <div className="p-6 text-center space-y-2 bg-emerald-50/20">
                  <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 mb-1">
                    <Check size={20} />
                  </div>
                  <h4 className="font-bold text-emerald-900 text-sm">Thank You for Your Feedback!</h4>
                  <p className="text-xs text-emerald-700 font-medium">Your response has been logged to update the benchmark database.</p>
                </div>
              ) : (
                <form onSubmit={handleFeedbackSubmit} className="p-4 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    
                    {/* Understandable check */}
                    <div className="space-y-2">
                      <label className="block text-xs font-bold text-gray-700 uppercase">Was this alert easy to understand?</label>
                      <div className="flex gap-4">
                        <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                          <input
                            type="radio"
                            name="understandable"
                            checked={understandable === true}
                            onChange={() => setUnderstandable(true)}
                          /> Yes
                        </label>
                        <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                          <input
                            type="radio"
                            name="understandable"
                            checked={understandable === false}
                            onChange={() => setUnderstandable(false)}
                          /> No
                        </label>
                      </div>
                    </div>

                    {/* Timely check */}
                    <div className="space-y-2">
                      <label className="block text-xs font-bold text-gray-700 uppercase">Did this alert arrive on time?</label>
                      <div className="flex gap-4">
                        <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                          <input
                            type="radio"
                            name="timely"
                            checked={timely === true}
                            onChange={() => setTimely(true)}
                          /> Yes
                        </label>
                        <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                          <input
                            type="radio"
                            name="timely"
                            checked={timely === false}
                            onChange={() => setTimely(false)}
                          /> No
                        </label>
                      </div>
                    </div>

                  </div>

                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-gray-700 uppercase">Rate the quality of the message (1 to 5 Stars)</label>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setRating(star)}
                          className={`text-xl focus:outline-none transition-colors cursor-pointer ${
                            rating >= star ? 'text-amber-500' : 'text-gray-300 hover:text-amber-400'
                          }`}
                          aria-label={`Rate ${star} stars`}
                        >
                          ★
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-gray-700 uppercase">Additional Comments (Optional)</label>
                    <input
                      type="text"
                      placeholder="e.g., Font size was highly readable, translation was accurate."
                      value={comments}
                      onChange={(e) => setComments(e.target.value)}
                      className="w-full text-xs border border-gray-300 rounded-lg p-2.5 outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow cursor-pointer transition-colors"
                    >
                      Submit Feedback Log
                    </button>
                  </div>
                </form>
              )}
            </div>

          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400 p-12">
            <Bell size={40} className="mb-2" />
            <p className="text-sm font-semibold">Select an active alert from the feed to view localized adaptations, listen to playbacks, and submit feedback.</p>
          </div>
        )}
      </div>

      {/* Citizen Field Report Submission Modal */}
      {showReportModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl border border-gray-200 animate-in fade-in zoom-in duration-150">
            <div className="flex justify-between items-center pb-3 border-b border-gray-100">
              <h3 className="font-bold text-gray-900 text-base flex items-center gap-2">
                <AlertTriangle className="text-red-600" size={20} />
                Submit Citizen Field Report
              </h3>
              <button
                onClick={() => setShowReportModal(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>

            {reportSuccess ? (
              <div className="py-8 text-center space-y-2">
                <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                  <Check size={24} />
                </div>
                <h4 className="font-bold text-gray-900 text-sm">Report Saved to SQLite Database!</h4>
                <p className="text-xs text-gray-500">Report ID: CR-{Date.now().toString().slice(-5)}. Control Room Officers notified.</p>
              </div>
            ) : (
              <form onSubmit={handleReportSubmit} className="space-y-4 pt-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Disruption Type</label>
                  <select
                    value={reportType}
                    onChange={(e) => setReportType(e.target.value)}
                    className="w-full text-xs border border-gray-300 rounded-lg p-2.5 outline-none focus:border-red-500"
                  >
                    <option value="Flood">Flood / Waterlogging</option>
                    <option value="Road Blocked">Road Blocked</option>
                    <option value="Fallen Tree">Fallen Tree / Debris</option>
                    <option value="Power Outage">Power Outage / Transformer Fire</option>
                    <option value="Water Shortage">Water Shortage</option>
                    <option value="Fire">Fire Hazard</option>
                    <option value="Medical Emergency">Medical Emergency</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Sector / Location Name</label>
                  <input
                    type="text"
                    value={reportLocation}
                    onChange={(e) => setReportLocation(e.target.value)}
                    placeholder="e.g. Singanallur Bus Stand"
                    className="w-full text-xs border border-gray-300 rounded-lg p-2.5 outline-none focus:border-red-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Description & Immediate Hazard</label>
                  <textarea
                    rows={3}
                    value={reportDesc}
                    onChange={(e) => setReportDesc(e.target.value)}
                    placeholder="Describe the issue (e.g. Over 2 feet of water accumulation, cars stranded)."
                    className="w-full text-xs border border-gray-300 rounded-lg p-2.5 outline-none focus:border-red-500"
                    required
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setShowReportModal(false)}
                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={reportSubmitting}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold shadow flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <Send size={14} />
                    {reportSubmitting ? 'Saving to Database...' : 'Submit Field Report'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

    </div>
  );
};
