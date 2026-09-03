import React, { useState } from 'react';
import type { AuditLog } from '../db/types';
import { FileSpreadsheet, Search, Eye } from 'lucide-react';

interface AuditLogsViewProps {
  logs: AuditLog[];
}

export const AuditLogsView: React.FC<AuditLogsViewProps> = ({
  logs
}) => {
  const [filterQuery, setFilterQuery] = useState('');
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  const filteredLogs = logs.filter(
    log =>
      log.user.toLowerCase().includes(filterQuery.toLowerCase()) ||
      log.action.toLowerCase().includes(filterQuery.toLowerCase()) ||
      (log.incidentId && log.incidentId.toLowerCase().includes(filterQuery.toLowerCase()))
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-140px)]">
      
      {/* Logs Table Area */}
      <div className="lg:col-span-2 bg-white border border-gray-200 rounded-xl shadow-sm flex flex-col overflow-hidden h-full">
        {/* Search Header */}
        <div className="px-5 py-4 border-b border-gray-200 bg-gray-50 flex flex-wrap justify-between items-center shrink-0 gap-3">
          <h3 className="font-bold text-gray-800 text-sm flex items-center gap-1.5">
            <FileSpreadsheet size={16} className="text-slate-500" /> Security Audit Log Trail
          </h3>
          
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 bg-white border rounded-lg px-2.5 py-1 shadow-inner text-xs">
              <Search size={13} className="text-gray-400" />
              <input
                type="text"
                placeholder="Filter logs..."
                value={filterQuery}
                onChange={(e) => setFilterQuery(e.target.value)}
                className="border-none outline-none text-xs bg-transparent max-w-[150px]"
              />
            </div>
          </div>
        </div>

        {/* Audit Log Table */}
        <div className="flex-1 overflow-auto">
          {filteredLogs.length === 0 ? (
            <div className="text-center text-gray-400 py-12 text-xs font-semibold">
              No audit logs match filter criteria.
            </div>
          ) : (
            <table className="w-full text-left border-collapse text-xs font-semibold">
              <thead>
                <tr className="bg-gray-50 border-b text-gray-500 uppercase text-[9px] font-mono tracking-wider sticky top-0 z-10">
                  <th className="p-3">Timestamp</th>
                  <th className="p-3">Actor</th>
                  <th className="p-3">Action Completed</th>
                  <th className="p-3 text-center">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700 font-medium">
                {filteredLogs.map(log => (
                  <tr
                    key={log.id}
                    className={`hover:bg-slate-50/50 cursor-pointer ${
                      selectedLog?.id === log.id ? 'bg-slate-50 font-bold' : ''
                    }`}
                    onClick={() => setSelectedLog(log)}
                  >
                    <td className="p-3 font-mono text-[10px] text-gray-400">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="p-3 text-slate-800 font-mono text-[10px]">{log.user}</td>
                    <td className="p-3 truncate max-w-[280px] font-sans">{log.action}</td>
                    <td className="p-3 text-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedLog(log);
                        }}
                        className="text-slate-400 hover:text-slate-700 p-1 rounded transition-colors"
                        title="View log values diff"
                      >
                        <Eye size={13} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Log Details Diff Pane */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden h-full flex flex-col p-6 space-y-4">
        <div className="border-b pb-2">
          <h4 className="font-bold text-gray-800 text-sm uppercase">Log Entry Inspector</h4>
          <p className="text-xs text-gray-400">Review detailed database modifications, values, and audit trace paths.</p>
        </div>

        {selectedLog ? (
          <div className="space-y-4 text-xs font-semibold text-gray-700 overflow-y-auto flex-1 font-mono">
            <div className="space-y-1">
              <div className="text-[9px] font-bold text-gray-400 uppercase">Log ID</div>
              <p className="text-slate-800">{selectedLog.id}</p>
            </div>
            
            <div className="space-y-1">
              <div className="text-[9px] font-bold text-gray-400 uppercase">Actor Authority</div>
              <p className="text-slate-800">{selectedLog.user}</p>
            </div>

            <div className="space-y-1">
              <div className="text-[9px] font-bold text-gray-400 uppercase">Event Time</div>
              <p className="text-slate-800">{new Date(selectedLog.timestamp).toString()}</p>
            </div>

            <div className="space-y-1">
              <div className="text-[9px] font-bold text-gray-400 uppercase">Incident Target ID</div>
              <p className="text-slate-800">{selectedLog.incidentId || 'System Global / User Context'}</p>
            </div>

            {selectedLog.prevValue && (
              <div className="space-y-1">
                <div className="text-[9px] font-bold text-red-500 uppercase">Previous Value / Draft Context</div>
                <pre className="p-2.5 bg-slate-50 border border-slate-100 rounded-md overflow-x-auto text-[10px] text-red-600 whitespace-pre-wrap select-text leading-tight max-h-[140px]">
                  {selectedLog.prevValue}
                </pre>
              </div>
            )}

            {selectedLog.newValue && (
              <div className="space-y-1">
                <div className="text-[9px] font-bold text-green-700 uppercase font-mono">New Value / Modified Result</div>
                <pre className="p-2.5 bg-slate-50 border border-slate-100 rounded-md overflow-x-auto text-[10px] text-green-700 whitespace-pre-wrap select-text leading-tight max-h-[140px]">
                  {selectedLog.newValue}
                </pre>
              </div>
            )}
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400 p-6 text-center">
            <p className="text-xs font-semibold">Select a log line in the security trail table to audit database diff arrays.</p>
          </div>
        )}
      </div>

    </div>
  );
};
