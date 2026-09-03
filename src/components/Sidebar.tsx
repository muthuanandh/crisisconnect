import React from 'react';
import {
  LayoutDashboard,
  AlertTriangle,
  PlusCircle,
  CheckSquare,
  Send,
  BarChart3,
  ShieldAlert,
  UserCheck,
  FileSpreadsheet,
  Bell,
  User,
  Info,
  LogOut
} from 'lucide-react';
import type { UserRole } from '../db/types';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  userRole: UserRole;
  userName: string;
  onLogout: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  userRole,
  userName,
  onLogout
}) => {
  const isAdmin = userRole === 'admin';
  const isOperator = userRole === 'operator';

  const menuItems = [
    // Control Room views
    { id: 'dashboard', label: 'Control Room Dashboard', icon: LayoutDashboard, roles: ['admin', 'operator'] },
    { id: 'incidents', label: 'Active Disruption Logs', icon: AlertTriangle, roles: ['admin', 'operator'] },
    { id: 'create-incident', label: 'Log New Disruption', icon: PlusCircle, roles: ['admin', 'operator'] },
    { id: 'review-queue', label: 'Human Review Queue', icon: CheckSquare, roles: ['admin', 'operator'] },
    { id: 'notifications', label: 'Notification Center', icon: Send, roles: ['admin', 'operator'] },
    
    // Citizen views
    { id: 'citizen-alerts', label: 'My Alert Feed', icon: Bell, roles: ['citizen'] },
    { id: 'citizen-profile', label: 'Location & Settings', icon: User, roles: ['citizen'] },

    // Research / Benchmark / Edge cases (Always visible to admins/operators, but highlights system design)
    { id: 'analytics', label: 'Benchmark Analytics', icon: BarChart3, roles: ['admin', 'operator'] },
    { id: 'errors', label: 'Failure Case Sandbox', icon: ShieldAlert, roles: ['admin', 'operator'] },
    { id: 'usability', label: 'Usability Validation', icon: UserCheck, roles: ['admin', 'operator'] },
    { id: 'audit-logs', label: 'System Audit Logs', icon: FileSpreadsheet, roles: ['admin', 'operator'] },
    
    // Common Info
    { id: 'about', label: 'About & Ethics Check', icon: Info, roles: ['admin', 'operator', 'citizen'] }
  ];

  return (
    <aside className="w-72 bg-slate-900 text-slate-100 flex flex-col h-screen border-r border-slate-800 shrink-0 select-none">
      {/* Brand Header */}
      <div className="p-6 border-b border-slate-800 flex flex-col gap-1.5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-red-600 flex items-center justify-center font-bold text-white shadow-lg shadow-red-900/50 animate-pulse">
            C
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-1">
              CrisisConnect
            </h1>
            <span className="text-[9px] font-mono tracking-widest text-red-500 uppercase font-bold">
              Emergency Control
            </span>
          </div>
        </div>
      </div>

      {/* User Status Badge */}
      <div className="px-6 py-4 bg-slate-950 border-b border-slate-800/60 flex items-center justify-between">
        <div className="truncate pr-2">
          <div className="text-xs font-semibold text-slate-200 truncate">{userName}</div>
          <div className="text-[10px] text-slate-400 font-mono capitalize mt-0.5 flex items-center gap-1">
            <span className={`w-1.5 h-1.5 rounded-full inline-block ${
              isAdmin ? 'bg-red-500' : isOperator ? 'bg-yellow-500' : 'bg-green-500'
            }`}></span>
            {userRole === 'admin' ? 'Control Room Admin' : userRole === 'operator' ? 'Agency Operator' : 'Citizen Resident'}
          </div>
        </div>
        <button
          onClick={onLogout}
          className="text-slate-400 hover:text-red-400 p-1.5 rounded-lg hover:bg-slate-900 transition-colors"
          title="Switch User Role"
          aria-label="Logout/Switch user"
        >
          <LogOut size={16} />
        </button>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 overflow-y-auto p-4 space-y-1 scrollbar-thin scrollbar-thumb-slate-800">
        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-3 mb-2 font-mono">
          Operations & Research
        </div>
        {menuItems
          .filter(item => item.roles.includes(userRole))
          .map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group border ${
                  isActive
                    ? 'bg-red-600/10 text-red-400 border-red-500/20 font-semibold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border-transparent'
                }`}
              >
                <Icon
                  size={18}
                  className={`transition-colors ${
                    isActive ? 'text-red-400' : 'text-slate-500 group-hover:text-slate-400'
                  }`}
                />
                <span>{item.label}</span>
                {item.id === 'review-queue' && (
                  <span className="ml-auto bg-red-600/25 border border-red-500/30 text-red-400 text-[10px] font-bold px-1.5 py-0.5 rounded-full font-mono">
                    MANDATORY
                  </span>
                )}
              </button>
            );
          })}
      </nav>

      {/* Footer Info */}
      <div className="p-4 border-t border-slate-800/80 bg-slate-950/40 text-[10px] text-slate-500 font-mono space-y-1 text-center">
        <div>CRISISCONNECT v1.0.0-PROT</div>
        <div className="text-[8px] text-red-500 font-semibold px-2 leading-tight">
          Simulated Data - Academic Demo Use Only
        </div>
      </div>
    </aside>
  );
};
