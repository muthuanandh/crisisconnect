import React, { useState } from 'react';
import type { Notification, Incident, User } from '../db/types';
import { Send, Search, RefreshCw, RotateCw } from 'lucide-react';

interface NotificationCenterProps {
  notifications: Notification[];
  incidents: Incident[];
  residents: User[];
  onRetryNotification: (notifId: string) => void;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  notifications,
  incidents,
  residents,
  onRetryNotification
}) => {
  const [filterQuery, setFilterQuery] = useState('');
  const [channelFilter, setChannelFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [retryingId, setRetryingId] = useState<string | null>(null);

  const handleRetry = (id: string) => {
    setRetryingId(id);
    setTimeout(() => {
      onRetryNotification(id);
      setRetryingId(null);
    }, 850);
  };

  const filteredNotifs = notifications.filter(notif => {
    const inc = incidents.find(i => i.id === notif.incidentId);
    const res = residents.find(r => r.id === notif.residentId);
    
    const matchesQuery =
      notif.id.toLowerCase().includes(filterQuery.toLowerCase()) ||
      (inc && inc.title.toLowerCase().includes(filterQuery.toLowerCase())) ||
      (res && res.name.toLowerCase().includes(filterQuery.toLowerCase()));

    const matchesChannel = channelFilter === 'all' || notif.channel === channelFilter;
    const matchesStatus = statusFilter === 'all' || notif.status === statusFilter;

    return matchesQuery && matchesChannel && matchesStatus;
  });

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden h-[calc(100vh-140px)] flex flex-col">
      {/* Filtering Header */}
      <div className="px-5 py-4 border-b border-gray-200 bg-gray-50 flex flex-wrap justify-between items-center shrink-0 gap-3">
        <h3 className="font-bold text-gray-800 text-sm flex items-center gap-1.5">
          <Send size={16} className="text-blue-500" /> Dispatch Transmission Logs
        </h3>

        <div className="flex flex-wrap items-center gap-3">
          {/* Query Search */}
          <div className="flex items-center gap-1.5 bg-white border rounded-lg px-2.5 py-1.5 shadow-inner text-xs">
            <Search size={13} className="text-gray-400" />
            <input
              type="text"
              placeholder="Search notifications..."
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              className="border-none outline-none text-xs bg-transparent max-w-[160px]"
            />
          </div>

          {/* Channel selector */}
          <select
            value={channelFilter}
            onChange={(e) => setChannelFilter(e.target.value)}
            className="text-xs border bg-white rounded-lg p-1.5 outline-none cursor-pointer"
          >
            <option value="all">All Channels</option>
            <option value="sms">SMS</option>
            <option value="email">Email</option>
            <option value="web">Web</option>
            <option value="push">Push</option>
          </select>

          {/* Status selector */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs border bg-white rounded-lg p-1.5 outline-none cursor-pointer"
          >
            <option value="all">All Statuses</option>
            <option value="delivered">Delivered</option>
            <option value="failed">Failed</option>
            <option value="pending">Pending</option>
          </select>
        </div>
      </div>

      {/* Log list */}
      <div className="flex-1 overflow-auto">
        {filteredNotifs.length === 0 ? (
          <div className="text-center text-gray-400 py-12 text-sm font-semibold">
            No notifications logged under matching criteria.
          </div>
        ) : (
          <table className="w-full text-left border-collapse text-xs font-semibold">
            <thead>
              <tr className="bg-gray-50 border-b text-gray-500 uppercase text-[9px] font-mono tracking-wider sticky top-0 z-10">
                <th className="p-3">ID</th>
                <th className="p-3">Incident context</th>
                <th className="p-3">Recipient</th>
                <th className="p-3 text-center">Channel</th>
                <th className="p-3 text-center">Status</th>
                <th className="p-3 text-right">Latency</th>
                <th className="p-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-gray-700 font-medium font-mono">
              {filteredNotifs.map(notif => {
                const inc = incidents.find(i => i.id === notif.incidentId);
                const res = residents.find(r => r.id === notif.residentId);
                
                const isDelivered = notif.status === 'delivered';
                const isFailed = notif.status === 'failed';

                return (
                  <tr key={notif.id} className="hover:bg-slate-50/50">
                    <td className="p-3 text-gray-400">{notif.id}</td>
                    <td className="p-3 font-sans truncate max-w-[200px] text-slate-800" title={inc?.title}>
                      {inc?.title || notif.incidentId}
                    </td>
                    <td className="p-3 font-sans text-slate-800">{res?.name || notif.residentId}</td>
                    <td className="p-3 text-center capitalize">{notif.channel}</td>
                    <td className="p-3 text-center">
                      <span className={`px-2 py-0.5 rounded text-[8px] font-extrabold uppercase inline-block ${
                        isDelivered 
                          ? 'bg-emerald-100 text-emerald-800' 
                          : isFailed 
                            ? 'bg-red-100 text-red-800 font-bold' 
                            : 'bg-amber-100 text-amber-800'
                      }`}>
                        {notif.status}
                      </span>
                    </td>
                    <td className="p-3 text-right text-gray-500 font-mono">
                      {isDelivered ? `${notif.deliveryTime} ms` : '-'}
                    </td>
                    <td className="p-3 text-center font-sans">
                      {isFailed && (
                        <button
                          onClick={() => handleRetry(notif.id)}
                          disabled={retryingId === notif.id}
                          className="px-2 py-1 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-700 rounded text-[10px] font-bold inline-flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          {retryingId === notif.id ? (
                            <>
                              <RefreshCw size={10} className="animate-spin" />
                              Retrying
                            </>
                          ) : (
                            <>
                              <RotateCw size={10} />
                              Retry
                            </>
                          )}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
