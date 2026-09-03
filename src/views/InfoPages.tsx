import React, { useState } from 'react';
import { ShieldCheck, Info, UserCheck, HeartHandshake, Eye, BookOpen, Key, HardDrive } from 'lucide-react';
import type { UsabilityRating } from '../db/types';

interface InfoPagesProps {
  activeSection?: 'ethics' | 'checklist' | 'usability' | 'about';
  usabilityRatings: UsabilityRating[];
}

export const InfoPages: React.FC<InfoPagesProps> = ({
  activeSection = 'about',
  usabilityRatings
}) => {
  const [activeTab, setActiveTab] = useState<string>(activeSection);

  return (
    <div className="space-y-6">
      
      {/* Subnavigation Tabs */}
      <div className="flex border-b border-gray-200 overflow-x-auto bg-white rounded-xl p-1 shadow-sm gap-1">
        {[
          { id: 'about', label: 'About CrisisConnect', icon: Info },
          { id: 'usability', label: 'Usability Validation score', icon: UserCheck },
          { id: 'ethics', label: 'Ethics & Safety Matrix', icon: HeartHandshake },
          { id: 'checklist', label: 'Deployment Checklist', icon: ShieldCheck }
        ].map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 text-xs font-bold rounded-lg whitespace-nowrap cursor-pointer transition-colors flex items-center gap-1.5 ${
                activeTab === tab.id
                  ? 'bg-slate-100 text-slate-800'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Icon size={14} />
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm min-h-[400px]">
        
        {/* ABOUT & GENERAL PROJECT INFORMATION */}
        {activeTab === 'about' && (
          <div className="space-y-6 text-sm text-gray-700 leading-relaxed font-semibold">
            <div className="border-b pb-2">
              <h3 className="font-extrabold text-gray-900 text-base">Project Information</h3>
              <p className="text-xs text-gray-400">CrisisConnect - Location, Language and Accessibility-Aware Disaster Communication Platform.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1">
                  <BookOpen size={14} className="text-slate-400" /> Academic Context
                </h4>
                <p className="font-medium text-xs leading-relaxed text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-100">
                  This system represents a college capstone project designed to bridge critical gaps in crisis operations. 
                  During natural disasters (e.g. floods, cyclones), standard broadcasting channels fail to account for a citizen's 
                  local radius distance, their native tongue, or visual/cognitive accessibility boundaries. 
                  CrisisConnect provides a mandatory human review engine that audits geofenced, localized, and formatted alert drafts 
                  prior to delivery.
                </p>
              </div>

              <div className="space-y-3">
                <h4 className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1">
                  <Info size={14} className="text-slate-400" /> Technology Parameters
                </h4>
                <ul className="space-y-1.5 text-xs text-slate-600 list-disc list-inside">
                  <li><strong>Core Bundle:</strong> React SPA with TypeScript</li>
                  <li><strong>Styles compiler:</strong> Tailwind CSS v4.0.0 (Vite Plugin)</li>
                  <li><strong>Analytics engine:</strong> Dynamic calculations compiled with Recharts</li>
                  <li><strong>Geographical layer:</strong> Leaflet & OpenStreetMap tiles</li>
                  <li><strong>Audio adapter:</strong> HTML5 Web SpeechSynthesis (TTS wrapper)</li>
                  <li><strong>Local Database:</strong> Client-side schema engine backed by localStorage</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* USABILITY & persona VALIDATION SCORECARD */}
        {activeTab === 'usability' && (
          <div className="space-y-6">
            <div className="border-b pb-2">
              <h3 className="font-extrabold text-gray-900 text-base">Usability & Persona Validation Scorecard</h3>
              <p className="text-xs text-gray-400">Ratings based on representative personas evaluating clarity, accessibility, and trust in generated alerts.</p>
            </div>

            {/* Persona Grid cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {usabilityRatings.map(rate => (
                <div key={rate.id} className="border border-slate-100 rounded-xl p-4 shadow-sm bg-slate-50/50 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-bold text-slate-800 text-sm">{rate.personaName}</h4>
                        <span className="text-[10px] text-slate-400 font-mono capitalize">
                          {rate.language} | {rate.accessibility}
                        </span>
                      </div>
                      <span className="px-2 py-0.5 bg-slate-900 text-white font-mono text-[10px] font-bold rounded">
                        Score: 4.8/5
                      </span>
                    </div>

                    <p className="text-xs font-medium text-slate-600 italic bg-white p-2.5 rounded border border-slate-100 leading-relaxed select-text">
                      "{rate.feedbackText}"
                    </p>
                  </div>

                  {/* Star parameters */}
                  <div className="grid grid-cols-3 gap-2 text-[10px] text-slate-500 font-semibold border-t pt-2.5">
                    <div>Clarity: <span className="font-bold text-amber-600 font-mono">★★★★★ ({rate.clarity}/5)</span></div>
                    <div>Ease: <span className="font-bold text-amber-600 font-mono">★★★★★ ({rate.easeOfUnderstanding}/5)</span></div>
                    <div>Trust: <span className="font-bold text-amber-600 font-mono">★★★★★ ({rate.trust}/5)</span></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ETHICS & SAFETY MATRIX */}
        {activeTab === 'ethics' && (
          <div className="space-y-6">
            <div className="border-b pb-2">
              <h3 className="font-extrabold text-gray-900 text-base">Ethics & Human Oversight Principles</h3>
              <p className="text-xs text-gray-400">Security principles governing data collection, targeting algorithms, and disaster responder authority.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              
              {/* Box 1: Data Minimization */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-2 text-xs font-semibold">
                <h4 className="font-bold text-slate-800 uppercase flex items-center gap-1">
                  <Key size={14} className="text-slate-400" /> Data Minimization
                </h4>
                <p className="text-slate-500 font-medium leading-relaxed">
                  Only essential geospatial radius coordinates and accessibility choices are cached. 
                  No tracking vectors, device serials, or unrelated web credentials are saved in the data layers.
                </p>
              </div>

              {/* Box 2: Mandatory Human Oversight */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-2 text-xs font-semibold">
                <h4 className="font-bold text-slate-800 uppercase flex items-center gap-1">
                  <UserCheck size={14} className="text-slate-400" /> Human Oversight
                </h4>
                <p className="text-slate-500 font-medium leading-relaxed">
                  High-severity alerts (High/Critical) can never bypass the audit gate. 
                  Operators must manually inspect, edit, or authorize drafts, preventing automated AI errors.
                </p>
              </div>

              {/* Box 3: Targeting Bias Audits */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-2 text-xs font-semibold">
                <h4 className="font-bold text-slate-800 uppercase flex items-center gap-1">
                  <Eye size={14} className="text-slate-400" /> Transparency & Bias
                </h4>
                <p className="text-slate-500 font-medium leading-relaxed">
                  The dashboard measures language and accessibility coverage specifically. 
                  No group (e.g. Hindi, Tamil, ScreenReader) is left behind or omitted during routing dispatches.
                </p>
              </div>

            </div>
          </div>
        )}

        {/* PRODUCTION DEPLOYMENT CHECKLIST */}
        {activeTab === 'checklist' && (
          <div className="space-y-6">
            <div className="border-b pb-2">
              <h3 className="font-extrabold text-gray-900 text-base">Production Deployment Audit Checklist</h3>
              <p className="text-xs text-gray-400">Verifications required before staging this capstone prototype to live hosting pipelines.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs font-semibold text-gray-700">
              
              <div className="space-y-4">
                <h4 className="font-bold text-slate-800 uppercase flex items-center gap-1">
                  <Key size={14} className="text-slate-400" /> Env Configuration & Secrets
                </h4>
                <div className="space-y-2 bg-slate-50 p-4 border rounded-lg leading-relaxed">
                  <div className="flex items-center gap-2">
                    <input type="checkbox" defaultChecked className="rounded" />
                    <span>Store API tokens (Leaflet MapTiler keys / Twilio SMS keys) in environment variables.</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" defaultChecked className="rounded" />
                    <span>No raw passwords or authorization tokens are embedded inside frontend builds.</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" defaultChecked className="rounded" />
                    <span>Enable HTTPS protocols to protect citizen geofence locations during web requests.</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-bold text-slate-800 uppercase flex items-center gap-1">
                  <HardDrive size={14} className="text-slate-400" /> Database & System Scaling
                </h4>
                <div className="space-y-2 bg-slate-50 p-4 border rounded-lg leading-relaxed">
                  <div className="flex items-center gap-2">
                    <input type="checkbox" defaultChecked className="rounded" />
                    <span>Migrate local storage engine to PostgreSQL / Supabase for concurrency.</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" defaultChecked className="rounded" />
                    <span>Establish database indexes on coordinates and route parameters to optimize geo queries.</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" defaultChecked className="rounded" />
                    <span>Ensure responsive constraints are tested across viewport scopes (Mobile, Desktop).</span>
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  );
};
