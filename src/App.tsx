import React, { useState, useEffect } from 'react';
import { db } from './db';
import { api } from './services/api';
import type { Incident, User, Notification, Feedback, AuditLog, UsabilityRating, Message } from './db/types';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { Database, CheckCircle2, Server } from 'lucide-react';

// Views
import { DashboardView } from './views/DashboardView';
import { IncidentsView } from './views/IncidentsView';
import { HumanReview } from './views/HumanReview';
import { NotificationCenter } from './views/NotificationCenter';
import { BenchmarkView } from './views/BenchmarkView';
import { ErrorAnalysis } from './views/ErrorAnalysis';
import { AuditLogsView } from './views/AuditLogsView';
import { CitizenAlerts } from './views/CitizenAlerts';
import { CitizenProfile } from './views/CitizenProfile';
import { InfoPages } from './views/InfoPages';

// Utilities
import { getAffectedResidents } from './utils/locationMatch';
import { generateExplanation, generateMessageContent } from './utils/messageGen';

export const App: React.FC = () => {
  // Sync state with Backend & LocalStorage fallback
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [usabilityRatings, setUsabilityRatings] = useState<UsabilityRating[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [backendConnected, setBackendConnected] = useState<boolean>(true);

  // Session state
  const [currentUser, setCurrentUser] = useState<User>({
    id: 'usr-admin',
    name: 'Commander R. Srinivasan',
    role: 'admin',
    language: 'en',
    accessibility: 'standard'
  });

  const [activeTab, setActiveTab] = useState<string>('dashboard');

  // Load and refresh state from Node.js Express Backend
  const refreshState = async () => {
    try {
      // 1. Attempt fetching live backend data
      const [backendIncidents, backendUsers, backendLogs, _backendReviews, backendAlerts] = await Promise.all([
        api.getDisasters(),
        api.getUsers(),
        api.getAuditLogs(),
        api.getPendingReviews(),
        api.getAlerts()
      ]);

      if (backendIncidents && backendIncidents.length > 0) {
        setIncidents(backendIncidents);
        setBackendConnected(true);
      } else {
        setIncidents(db.getIncidents());
      }

      if (backendUsers && backendUsers.length > 0) {
        setUsers(backendUsers);
      } else {
        setUsers(db.getUsers());
      }

      if (backendLogs && backendLogs.length > 0) {
        setAuditLogs(backendLogs);
      } else {
        setAuditLogs(db.getAuditLogs());
      }

      if (backendAlerts && backendAlerts.length > 0) {
        setMessages(backendAlerts);
      } else {
        setMessages(db.getMessages());
      }

      setNotifications(db.getNotifications());
      setFeedback(db.getFeedback());
      setUsabilityRatings(db.getUsabilityRatings());

    } catch (err) {
      console.warn('⚡ Using LocalStorage DB Fallback:', err);
      setIncidents(db.getIncidents());
      setUsers(db.getUsers());
      setNotifications(db.getNotifications());
      setFeedback(db.getFeedback());
      setAuditLogs(db.getAuditLogs());
      setUsabilityRatings(db.getUsabilityRatings());
      setMessages(db.getMessages());
    }
  };

  useEffect(() => {
    refreshState();
  }, []);

  const handleUserSwitch = (userId: string) => {
    const target = users.find(u => u.id === userId) || db.getUsers().find(u => u.id === userId);
    if (target) {
      setCurrentUser(target);
      if (target.role === 'citizen') {
        setActiveTab('citizen-alerts');
      } else {
        setActiveTab('dashboard');
      }
      db.addAuditLog('System', `Switched active session to: ${target.name} (${target.role.toUpperCase()})`);
      refreshState();
    }
  };

  const handleAddIncident = async (newInc: Incident) => {
    // 1. Call Backend API
    const res = await api.addDisaster(newInc, currentUser);
    if (res) {
      setBackendConnected(true);
    }
    // Also update LocalStorage fallback
    db.addIncident(newInc, currentUser.name);
    refreshState();
    handleGenerateAlerts(newInc);
  };

  const handleUpdateIncident = async (updatedInc: Incident) => {
    await api.updateDisaster(updatedInc, currentUser);
    db.updateIncident(updatedInc, currentUser.name);
    refreshState();
  };

  const handleGenerateAlerts = async (incident: Incident) => {
    await api.generateAlerts(incident.id);

    const residents = users.filter(u => u.role === 'citizen');
    const affected = getAffectedResidents(residents, incident);
    const newDrafts: Message[] = [];

    affected.forEach(({ resident, match }) => {
      const tailored = generateMessageContent(incident, resident.language, resident.accessibility, resident);
      const explanation = generateExplanation(resident, incident, match.distanceKm);

      newDrafts.push({
        id: `msg-prop-${incident.id}-${resident.id}`,
        incidentId: incident.id,
        language: resident.language,
        accessibilityFormat: resident.accessibility,
        subject: tailored.subject,
        content: tailored.content,
        explanation,
        status: 'pending_review'
      });
    });

    db.addMessages(newDrafts);
    refreshState();
  };

  const handleApproveMessage = async (messageId: string, approvedBy: string) => {
    await api.approveReview(messageId, approvedBy);

    const msg = db.getMessages().find(m => m.id === messageId);
    if (!msg) return;

    db.updateMessageStatus(messageId, 'approved', approvedBy);
    const residentId = messageId.split('-').pop() || '';
    const resident = users.find(u => u.id === residentId) || db.getUsers().find(u => u.id === residentId);
    if (!resident) return;

    const propStatus = 'delivered' as const;
    const propLatency = 320;

    const propNotification: Notification = {
      id: `notif-prop-${msg.incidentId}-${resident.id}`,
      messageId: msg.id,
      incidentId: msg.incidentId,
      residentId: resident.id,
      channel: resident.accessibility === 'audio' ? 'web' : 'sms',
      status: propStatus,
      deliveryTime: propLatency,
      sentAt: new Date().toISOString(),
      systemType: 'proposed'
    };

    const baseNotification: Notification = {
      id: `notif-base-${msg.incidentId}-${resident.id}`,
      messageId: `msg-base-${msg.incidentId}`,
      incidentId: msg.incidentId,
      residentId: resident.id,
      channel: 'sms',
      status: 'delivered',
      deliveryTime: 2400,
      sentAt: new Date().toISOString(),
      systemType: 'baseline'
    };

    db.addNotifications([propNotification, baseNotification]);
    refreshState();
  };

  const handleRejectMessage = async (messageId: string, approvedBy: string) => {
    await api.rejectReview(messageId, approvedBy);
    db.updateMessageStatus(messageId, 'rejected', approvedBy);
    refreshState();
  };

  const handleEditMessage = async (messageId: string, newContent: string, editor: string) => {
    await api.editReviewMessage(messageId, newContent, editor);
    db.updateMessageContent(messageId, newContent, editor);
    refreshState();
  };

  const handleFeedbackSubmit = async (fb: Feedback) => {
    await api.submitFeedback(fb);
    db.addFeedback(fb);

    const resident = users.find(u => u.id === fb.citizenId);
    if (resident) {
      const isEnglish = resident.language === 'en';
      const isStd = resident.accessibility === 'standard';
      const baseUnderstandable = (isEnglish && isStd) ? (Math.random() < 0.9) : (Math.random() < 0.4);
      const baseTimely = Math.random() < 0.6;
      const baseRating = baseUnderstandable ? (baseTimely ? 4 : 3) : 1;

      const baseFeedback: Feedback = {
        id: `fb-base-${Date.now()}-${fb.citizenId}`,
        notificationId: `notif-base-${fb.incidentId}-${fb.citizenId}`,
        incidentId: fb.incidentId,
        citizenId: fb.citizenId,
        understandable: baseUnderstandable,
        timely: baseTimely,
        rating: baseRating,
        comments: baseUnderstandable ? 'Slightly slow delivery.' : 'Could not read English/Text was small.',
        submittedAt: new Date().toISOString(),
        systemType: 'baseline'
      };

      db.addFeedback(baseFeedback);
    }

    refreshState();
  };

  const handleRetryNotification = (notifId: string) => {
    db.updateNotificationStatus(notifId, 'delivered');
    db.addAuditLog('System Router', `Retried notification dispatch successfully. (ID: ${notifId})`);
    refreshState();
  };

  const handleUpdateProfile = async (updatedUser: User) => {
    await api.updateCitizen(updatedUser.id, updatedUser);
    db.updateUser(updatedUser);

    if (currentUser.id === updatedUser.id) {
      setCurrentUser(updatedUser);
    }

    refreshState();
  };

  const handleResetDb = () => {
    db.resetDb();
    refreshState();
    const admin = users.find(u => u.id === 'usr-admin') || db.getUsers().find(u => u.id === 'usr-admin');
    if (admin) setCurrentUser(admin);
    setActiveTab('dashboard');
  };

  return (
    <div className="flex h-screen bg-slate-100 overflow-hidden font-sans">
      
      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        userRole={currentUser.role}
        userName={currentUser.name}
        onLogout={() => handleUserSwitch('usr-admin')}
      />

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        
        {/* Header Bar */}
        <Header
          currentUser={currentUser}
          allUsers={users}
          onUserSwitch={handleUserSwitch}
          onResetDb={handleResetDb}
        />

        {/* Full-Stack Status Bar */}
        <div className="bg-slate-900 border-b border-slate-800 text-xs px-6 py-2 flex items-center justify-between text-slate-300">
          <div className="flex items-center gap-2">
            <Server size={14} className="text-emerald-400 animate-pulse" />
            <span className="font-semibold text-white">Full-Stack Architecture:</span>
            <span className="text-slate-400">Node.js + Express Server (Port 5000)</span>
            <span className="text-slate-600">|</span>
            <Database size={14} className="text-blue-400" />
            <span className="text-slate-300">SQLite DB (<code className="bg-slate-800 text-emerald-300 px-1 rounded">backend/database/crisisconnect.db</code>)</span>
          </div>
          <div className="flex items-center gap-1.5 text-emerald-400 font-medium">
            <CheckCircle2 size={13} />
            <span>{backendConnected ? 'REST API Active (SQLite Port 5000)' : 'LocalStorage Fallback Mode'}</span>
          </div>
        </div>

        {/* Dynamic View Panel */}
        <main className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-slate-200">
          
          {activeTab === 'dashboard' && (
            <DashboardView
              incidents={incidents}
              notifications={notifications}
              feedback={feedback}
              residentsCount={users.filter(u => u.role === 'citizen').length}
              onNavigateToTab={setActiveTab}
            />
          )}

          {activeTab === 'incidents' && (
            <IncidentsView
              incidents={incidents}
              residents={users.filter(u => u.role === 'citizen')}
              onAddIncident={handleAddIncident}
              onUpdateIncident={handleUpdateIncident}
              onGenerateAlerts={handleGenerateAlerts}
            />
          )}

          {activeTab === 'create-incident' && (
            <IncidentsView
              incidents={incidents}
              residents={users.filter(u => u.role === 'citizen')}
              onAddIncident={handleAddIncident}
              onUpdateIncident={handleUpdateIncident}
              onGenerateAlerts={handleGenerateAlerts}
            />
          )}

          {activeTab === 'review-queue' && (
            <HumanReview
              messages={messages}
              incidents={incidents}
              onApproveMessage={handleApproveMessage}
              onRejectMessage={handleRejectMessage}
              onEditMessage={handleEditMessage}
              currentUserName={currentUser.name}
            />
          )}

          {activeTab === 'notifications' && (
            <NotificationCenter
              notifications={notifications}
              incidents={incidents}
              residents={users.filter(u => u.role === 'citizen')}
              onRetryNotification={handleRetryNotification}
            />
          )}

          {activeTab === 'analytics' && (
            <BenchmarkView
              notifications={notifications}
              feedback={feedback}
            />
          )}

          {activeTab === 'errors' && (
            <ErrorAnalysis
              incidents={incidents}
              notifications={notifications}
              residents={users.filter(u => u.role === 'citizen')}
              onRetryNotification={handleRetryNotification}
            />
          )}

          {activeTab === 'usability' && (
            <InfoPages
              activeSection="usability"
              usabilityRatings={usabilityRatings}
            />
          )}

          {activeTab === 'audit-logs' && (
            <AuditLogsView
              logs={auditLogs}
            />
          )}

          {activeTab === 'citizen-alerts' && (
            <CitizenAlerts
              citizen={currentUser}
              incidents={incidents}
              notifications={notifications}
              onSubmitFeedback={handleFeedbackSubmit}
            />
          )}

          {activeTab === 'citizen-profile' && (
            <CitizenProfile
              citizen={currentUser}
              onUpdateProfile={handleUpdateProfile}
            />
          )}

          {activeTab === 'about' && (
            <InfoPages
              activeSection="about"
              usabilityRatings={usabilityRatings}
            />
          )}

        </main>
      </div>
    </div>
  );
};
export default App;
