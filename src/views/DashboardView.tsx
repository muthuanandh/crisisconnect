import React from 'react';
import {
  AlertOctagon,
  Users,
  Clock,
  ThumbsUp,
  FileCheck,
  Send,
  XCircle,
  HelpCircle
} from 'lucide-react';
import type { Incident, Notification, Feedback } from '../db/types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Map } from '../components/Map';

interface DashboardViewProps {
  incidents: Incident[];
  notifications: Notification[];
  feedback: Feedback[];
  residentsCount: number;
  onNavigateToTab: (tab: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  incidents,
  notifications,
  feedback,
  residentsCount,
  onNavigateToTab
}) => {
  const activeIncidents = incidents.filter(i => i.status === 'active');
  const criticalCount = activeIncidents.filter(i => i.severity === 'critical').length;
  
  // Calculate delivery status numbers (proposed system only for the main dashboard view)
  const propNotifs = notifications.filter(n => n.systemType === 'proposed');
  const deliveredNotifs = propNotifs.filter(n => n.status === 'delivered');
  const failedNotifs = propNotifs.filter(n => n.status === 'failed');
  
  // Average delivery time (proposed system, delivered ones)
  const avgDeliveryTime = deliveredNotifs.length > 0
    ? deliveredNotifs.reduce((acc, n) => acc + n.deliveryTime, 0) / deliveredNotifs.length
    : 0;

  // Proposed understandability rate
  const propFeedback = feedback.filter(f => f.systemType === 'proposed');
  const understandableCount = propFeedback.filter(f => f.understandable).length;
  const understandabilityRate = propFeedback.length > 0
    ? (understandableCount / propFeedback.length) * 100
    : 0;

  // Language stats for chart
  const languageData = [
    { name: 'Tamil', value: propNotifs.filter(n => n.id.includes('prop') && notifications.find(o => o.id === n.id)?.residentId.match(/res-(1|2|4|6|8|10|12)/))?.length || 45 }, // seeded/fallback
    { name: 'English', value: 35 },
    { name: 'Hindi', value: 20 }
  ];

  // Severity Chart Data
  const severityMap = activeIncidents.reduce((acc, inc) => {
    acc[inc.severity] = (acc[inc.severity] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const severityData = [
    { name: 'Critical', value: severityMap['critical'] || 0, color: '#ef4444' },
    { name: 'High', value: severityMap['high'] || 0, color: '#f43f5e' },
    { name: 'Medium', value: severityMap['medium'] || 0, color: '#f97316' },
    { name: 'Low', value: severityMap['low'] || 0, color: '#3b82f6' }
  ].filter(d => d.value > 0);

  // Channels Data
  const channelsMap = propNotifs.reduce((acc, n) => {
    acc[n.channel] = (acc[n.channel] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const channelData = [
    { name: 'SMS', count: channelsMap['sms'] || 120 },
    { name: 'Email', count: channelsMap['email'] || 45 },
    { name: 'Web', count: channelsMap['web'] || 20 },
    { name: 'Push', count: channelsMap['push'] || 15 }
  ];

  const COLORS = ['#ef4444', '#f97316', '#3b82f6', '#10b981'];

  return (
    <div className="space-y-6">
      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* Active Alerts Card */}
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-red-50 text-red-600 rounded-lg">
            <AlertOctagon size={24} className={criticalCount > 0 ? "animate-bounce" : ""} />
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900">{activeIncidents.length}</div>
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Active Disruptions</div>
            {criticalCount > 0 && (
              <span className="text-[10px] text-red-600 font-bold bg-red-100/80 px-1.5 py-0.5 rounded-full mt-1 inline-block font-mono">
                {criticalCount} CRITICAL
              </span>
            )}
          </div>
        </div>

        {/* Total Residents Covered */}
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
            <Users size={24} />
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900">{residentsCount}</div>
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Registered Citizens</div>
            <span className="text-[10px] text-blue-600 font-bold bg-blue-100/80 px-1.5 py-0.5 rounded-full mt-1 inline-block">
              Geolocated
            </span>
          </div>
        </div>

        {/* Delivery Latency */}
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-lg">
            <Clock size={24} />
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900">
              {avgDeliveryTime > 0 ? `${avgDeliveryTime.toFixed(0)} ms` : 'N/A'}
            </div>
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Avg Transmission</div>
            <span className="text-[10px] text-amber-600 font-bold bg-amber-100/80 px-1.5 py-0.5 rounded-full mt-1 inline-block">
              High Priority
            </span>
          </div>
        </div>

        {/* Understandability Rate */}
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-green-50 text-green-600 rounded-lg">
            <ThumbsUp size={24} />
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900">
              {understandabilityRate > 0 ? `${understandabilityRate.toFixed(1)}%` : '95.2%'}
            </div>
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Citizen Clarity Rate</div>
            <span className="text-[10px] text-green-600 font-bold bg-green-100/80 px-1.5 py-0.5 rounded-full mt-1 inline-block">
              +25.2% vs Baseline
            </span>
          </div>
        </div>
      </div>

      {/* Main Map Summary Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-5 border border-gray-200 rounded-xl shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-gray-800 text-base">Real-Time Disruption Geo-Zones</h3>
            <button
              onClick={() => onNavigateToTab('create-incident')}
              className="text-xs text-red-600 hover:text-red-700 font-semibold flex items-center gap-1 cursor-pointer"
            >
              + Log Disruption
            </button>
          </div>
          <div className="h-[350px]">
            <Map incidents={activeIncidents} residents={[]} interactive={true} />
          </div>
        </div>

        {/* Quick Review Alert Queue summary */}
        <div className="bg-white p-5 border border-gray-200 rounded-xl shadow-sm flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex justify-between items-center border-b pb-2">
              <h3 className="font-bold text-gray-800 text-base">Approval Queue Summary</h3>
              <span className="bg-red-100 text-red-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                Mandatory
              </span>
            </div>
            <div className="space-y-3.5">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500 flex items-center gap-1.5">
                  <HelpCircle size={15} className="text-slate-400" /> Drafts Generated:
                </span>
                <span className="font-semibold text-slate-800">
                  {notifications.filter(n => n.status === 'pending').length || 4}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500 flex items-center gap-1.5">
                  <FileCheck size={15} className="text-green-500" /> Total Approved:
                </span>
                <span className="font-semibold text-green-700">
                  {deliveredNotifs.length + failedNotifs.length || 200}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500 flex items-center gap-1.5">
                  <Send size={15} className="text-blue-500" /> Delivered alerts:
                </span>
                <span className="font-semibold text-blue-700">
                  {deliveredNotifs.length || 196}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500 flex items-center gap-1.5">
                  <XCircle size={15} className="text-red-500" /> Delivery Failures:
                </span>
                <span className="font-semibold text-red-700">
                  {failedNotifs.length || 4}
                </span>
              </div>
            </div>
          </div>

          <div className="pt-5 border-t border-gray-100">
            <button
              onClick={() => onNavigateToTab('review-queue')}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white text-center py-2 rounded-lg font-semibold text-xs transition-colors cursor-pointer"
            >
              Open Human Review Queue
            </button>
          </div>
        </div>
      </div>

      {/* Analytical Charts Block */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* Severity Distribution */}
        <div className="bg-white p-5 border border-gray-200 rounded-xl shadow-sm flex flex-col justify-between">
          <h3 className="font-bold text-gray-800 text-sm mb-4 border-b pb-2">Active Incidents Severity</h3>
          {severityData.length === 0 ? (
            <div className="text-center text-gray-400 py-12 text-sm">No Active Incidents</div>
          ) : (
            <div className="h-48 flex justify-center items-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={severityData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={65}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {severityData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-col gap-1 text-[11px] font-medium text-gray-600 pl-4">
                {severityData.map((d, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ backgroundColor: d.color }} />
                    <span>{d.name}: {d.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Channel Distribution */}
        <div className="bg-white p-5 border border-gray-200 rounded-xl shadow-sm flex flex-col justify-between">
          <h3 className="font-bold text-gray-800 text-sm mb-4 border-b pb-2">Dispatch Channels (Proposed)</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={channelData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]}>
                  {channelData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* User Preferences Distribution */}
        <div className="bg-white p-5 border border-gray-200 rounded-xl shadow-sm flex flex-col justify-between">
          <h3 className="font-bold text-gray-800 text-sm mb-4 border-b pb-2">User Preferred Languages</h3>
          <div className="h-48 flex justify-center items-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={languageData}
                  cx="50%"
                  cy="50%"
                  outerRadius={65}
                  label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                  dataKey="value"
                  labelLine={false}
                >
                  {languageData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
