import React from 'react';
import { MessageCircle, Calendar, AlertTriangle } from 'lucide-react';

export default function CommunicationMobile({
  activeTab,
  setActiveTab,
  MessagesTab,
  MeetingsTab,
  GrievancesTab,
}) {
  return (
    <div className="flex h-[calc(100vh-80px)] flex-col space-y-4 pb-20 overflow-hidden">
      {/* Header */}
      <div className="shrink-0">
        <h2 className="text-xl font-black text-slate-800 dark:text-white">Communication</h2>
        <p className="text-[10px] font-semibold text-slate-400 mt-0.5 uppercase tracking-wider">Connect with Institute</p>
      </div>

      {/* Tabs */}
      <div className="flex overflow-x-auto rounded-2xl bg-white p-1 shadow-xs border border-slate-100 dark:bg-slate-900 dark:border-slate-800 shrink-0 scrollbar-none snap-x">
        {[
          { id: "messages", label: "Messages" },
          { id: "meetings", label: "Meetings" },
          { id: "grievances", label: "Grievances" },
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-2 rounded-xl text-xs font-black transition-all snap-start ${
                isActive
                  ? "bg-blue-600 text-white shadow-md shadow-blue-500/10"
                  : "text-slate-500 dark:text-slate-400"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* View Container */}
      <div className="flex-1 min-h-0 overflow-y-auto rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
        {activeTab === "messages" && <MessagesTab />}
        {activeTab === "meetings" && <MeetingsTab />}
        {activeTab === "grievances" && <GrievancesTab />}
      </div>
    </div>
  );
}
