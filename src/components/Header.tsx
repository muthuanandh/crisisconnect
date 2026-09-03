import React from 'react';
import { ShieldAlert, Users, RotateCcw } from 'lucide-react';
import type { UserRole } from '../db/types';

interface HeaderProps {
  currentUser: { id: string; name: string; role: UserRole };
  allUsers: { id: string; name: string; role: UserRole }[];
  onUserSwitch: (userId: string) => void;
  onResetDb: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  allUsers,
  onUserSwitch,
  onResetDb
}) => {
  
  // Filter key users for quick switching
  const demoUsers = [
    { id: 'usr-admin', name: 'Commander R. Srinivasan (Admin)', role: 'admin' },
    { id: 'usr-op1', name: 'Operator Priya Nair (Agency Op)', role: 'operator' },
    { id: 'res-1', name: 'Resident 1 (Adyar - Eng/Std)', role: 'citizen' },
    { id: 'res-2', name: 'Resident 2 (Anna Nagar - Tamil/Large)', role: 'citizen' },
    { id: 'res-3', name: 'Resident 3 (Tambaram - Hindi/Audio)', role: 'citizen' },
    { id: 'res-4', name: 'Resident 4 (Guindy - Tamil/Simplified)', role: 'citizen' },
    { id: 'res-6', name: 'Resident 6 (T. Nagar - Tamil/ScreenReader)', role: 'citizen' }
  ];

  return (
    <header className="flex flex-col border-b border-gray-200 bg-white sticky top-0 z-[2000]">
      {/* CAPSTONE ACADEMIC DISCLAIMER BANNER */}
      <div className="bg-red-700 text-white px-4 py-2 text-xs font-semibold flex items-center justify-center gap-2 text-center shadow-inner">
        <ShieldAlert size={14} className="animate-pulse shrink-0" />
        <span>
          <strong>Academic Capstone Disclaimer:</strong> This application is a research prototype using simulated data. 
          It must not be used as the sole source for real emergency decisions or public safety communication.
        </span>
      </div>

      {/* Main Header Bar */}
      <div className="flex items-center justify-between px-6 py-3.5 shadow-sm">
        <div>
          <h2 className="text-lg font-bold text-gray-800 tracking-tight flex items-center gap-1.5">
            CrisisConnect Operations Console
          </h2>
          <p className="text-xs text-gray-500 font-mono">
            Current system local time: <span className="font-semibold text-gray-700">2026-08-25 19:02:30</span>
          </p>
        </div>

        {/* Demo Controller tools */}
        <div className="flex items-center gap-3">
          {/* Reset Database Trigger */}
          <button
            onClick={() => {
              if (window.confirm('Reset local database state to initial seed data?')) {
                onResetDb();
              }
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-amber-700 hover:text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg font-medium transition-colors cursor-pointer"
            title="Reset storage to initial seeded residents and incidents"
          >
            <RotateCcw size={13} />
            <span>Reset Demo State</span>
          </button>

          {/* Quick User Role Switcher Dropdown */}
          <div className="flex items-center gap-2 bg-slate-50 border border-gray-200 rounded-lg px-2.5 py-1.5 shadow-sm">
            <Users size={14} className="text-slate-500" />
            <span className="text-xs font-semibold text-slate-700 hidden sm:inline">Role Switcher:</span>
            <select
              value={currentUser.id}
              onChange={(e) => onUserSwitch(e.target.value)}
              className="text-xs font-medium text-slate-700 bg-transparent border-none outline-none focus:ring-0 cursor-pointer max-w-[220px]"
              aria-label="Select demo user profile"
            >
              <optgroup label="Emergency Responders">
                {demoUsers.filter(u => u.role !== 'citizen').map(u => (
                  <option key={u.id} value={u.id}>{u.name}</option>
                ))}
              </optgroup>
              <optgroup label="Citizen Profiles (100+ Seeded)">
                {demoUsers.filter(u => u.role === 'citizen').map(u => (
                  <option key={u.id} value={u.id}>{u.name}</option>
                ))}
                {allUsers.filter(u => u.role === 'citizen' && !demoUsers.some(d => d.id === u.id)).slice(0, 15).map(u => (
                  <option key={u.id} value={u.id}>{u.name} (Chennai)</option>
                ))}
              </optgroup>
            </select>
          </div>
        </div>
      </div>
    </header>
  );
};
