import React, { useState } from 'react';
import {
  Calendar,
  FileText,
  CheckCircle2,
  XCircle,
  Clock,
  BookOpen,
  Plus,
  X,
} from 'lucide-react';
import { CustomSelect } from "@/components/ui/CustomSelect";

export default function ChildMobile({
  activeTab,
  setActiveTab,
  activeChildId,
  AttendanceTab,
  MarksTab,
  HomeworkTab,
  TestsTab,
}) {
  return (
    <div className="space-y-6 pb-24">
      {/* Header */}
      <div>
        <h2 className="text-xl font-black text-slate-800 dark:text-white">Child Academic Progress</h2>
        <p className="text-[10px] font-semibold text-slate-400 mt-0.5 uppercase tracking-wider">Reports, Marks & Homework</p>
      </div>

      {/* Tabs */}
      <div className="flex overflow-x-auto rounded-2xl bg-white p-1 shadow-xs border border-slate-100 dark:bg-slate-900 dark:border-slate-800 scrollbar-none snap-x">
        {[
          { id: "attendance", label: "Attendance" },
          { id: "marks", label: "Marks" },
          { id: "homework", label: "Homework" },
          { id: "tests", label: "Tests" },
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 text-center py-2.5 rounded-xl text-xs font-black transition-all snap-start ${
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

      {/* Tab Content Wrapper */}
      <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-xs dark:border-slate-850 dark:bg-slate-900">
        {activeTab === "attendance" && <AttendanceTab studentId={activeChildId} />}
        {activeTab === "marks" && <MarksTab studentId={activeChildId} />}
        {activeTab === "homework" && <HomeworkTab studentId={activeChildId} />}
        {activeTab === "tests" && <TestsTab studentId={activeChildId} />}
      </div>
    </div>
  );
}
