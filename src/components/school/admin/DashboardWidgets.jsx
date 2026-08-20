import React from 'react';
import { motion } from 'framer-motion';
import { ChevronRight, AlertCircle, Clock, CheckCircle2, AlertTriangle, FileText, IndianRupee, Users, ArrowUp, ArrowDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export function AttentionRequiredWidget({ className }) {
  const tasks = [
    { label: 'Pending Admissions', count: 12, action: 'Review', color: 'text-rose-600', bg: 'bg-rose-50', btn: 'text-blue-600 bg-blue-50 hover:bg-blue-100', icon: Users },
    { label: 'Students with Low Attendance', count: 18, action: 'View', color: 'text-emerald-600', bg: 'bg-emerald-50', btn: 'text-blue-600 bg-blue-50 hover:bg-blue-100', icon: AlertTriangle },
    { label: 'Pending Fee Payments', count: 37, action: 'Manage', color: 'text-amber-600', bg: 'bg-amber-50', btn: 'text-white bg-blue-600 hover:bg-blue-700', icon: IndianRupee },
    { label: 'Teacher Leave Requests', count: 4, action: 'Approve', color: 'text-purple-600', bg: 'bg-purple-50', btn: 'text-blue-600 bg-blue-50 hover:bg-blue-100', icon: FileText },
    { label: 'ID Cards Pending', count: 26, action: 'Generate', color: 'text-indigo-600', bg: 'bg-indigo-50', btn: 'text-blue-600 bg-blue-50 hover:bg-blue-100', icon: CheckCircle2 },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn("bg-white border border-slate-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.02)] flex flex-col p-5", className)}
      style={{ borderRadius: '1.5rem' }}
    >
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-rose-500" />
          <h3 className="font-display font-bold text-slate-800 text-base">Attention Required</h3>
        </div>
        <button className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1">
          View All <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="flex flex-col gap-3">
        {tasks.map((task, i) => (
          <div key={i} className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 transition-colors">
            <div className="flex items-center gap-3">
              <div className={cn("w-9 h-9 rounded-full flex items-center justify-center shrink-0", task.bg, task.color)}>
                <task.icon className="w-4 h-4" />
              </div>
              <span className="text-sm font-semibold text-slate-700">{task.label}</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="font-bold text-rose-600">{task.count}</span>
              <button className={cn("px-4 py-1.5 rounded-full text-xs font-bold transition-colors w-20 text-center", task.btn)}>
                {task.action}
              </button>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

export function FeeOverviewWidget({ className }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn("bg-white border border-slate-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.02)] flex flex-col p-5", className)}
      style={{ borderRadius: '1.5rem' }}
    >
      <div className="flex items-center justify-between mb-5">
        <h3 className="font-display font-bold text-slate-800 text-base">Fee Overview</h3>
        <button className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1">
          View Reports <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="flex items-end justify-between mb-4">
        <div>
          <p className="text-3xl font-black text-slate-900 tracking-tight">₹18,40,000</p>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-1">Total Collected</p>
        </div>
        <div className="text-right">
          <p className="text-lg font-bold text-blue-600">82%</p>
          <p className="text-[10px] font-bold text-slate-400 uppercase">Target Achieved</p>
        </div>
      </div>

      <div className="h-3 w-full bg-slate-100 rounded-full mb-6 overflow-hidden flex">
        <div className="h-full bg-blue-600 rounded-full" style={{ width: '82%' }}></div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
            <span className="text-sm font-semibold text-slate-600">Collected</span>
          </div>
          <span className="text-sm font-bold text-slate-900">₹18.4L</span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-amber-500"></div>
            <span className="text-sm font-semibold text-slate-600">Pending</span>
          </div>
          <span className="text-sm font-bold text-slate-900">₹4.2L</span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-rose-500"></div>
            <span className="text-sm font-semibold text-slate-600">Overdue</span>
          </div>
          <span className="text-sm font-bold text-slate-900">₹1.1L</span>
        </div>
      </div>

      <div className="mt-6 flex gap-3">
        <button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl transition-colors text-sm">
          Collect Fee
        </button>
        <button className="flex-1 bg-white border border-slate-200 text-blue-600 hover:bg-slate-50 font-bold py-2.5 rounded-xl transition-colors text-sm">
          View Reports
        </button>
      </div>
    </motion.div>
  );
}

export function RecentActivityWidget({ className }) {
  const activities = [
    { title: 'New student admission approved', time: '2 hours ago', icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
    { title: 'Fee payment received', time: '3 hours ago', icon: IndianRupee, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { title: 'Teacher added to Science department', time: '5 hours ago', icon: Users, color: 'text-purple-600', bg: 'bg-purple-50' },
    { title: 'Notice published: Parent-Teacher Meeting', time: '6 hours ago', icon: AlertCircle, color: 'text-rose-600', bg: 'bg-rose-50' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn("bg-white border border-slate-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.02)] flex flex-col p-5", className)}
      style={{ borderRadius: '1.5rem' }}
    >
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-blue-500" />
          <h3 className="font-display font-bold text-slate-800 text-base">Recent Activity</h3>
        </div>
        <button className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1">
          View All <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="flex flex-col gap-4">
        {activities.map((act, i) => (
          <div key={i} className="flex gap-3">
            <div className={cn("w-10 h-10 rounded-full flex items-center justify-center shrink-0 mt-0.5", act.bg, act.color)}>
              <act.icon className="w-4.5 h-4.5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-800">{act.title}</p>
              <p className="text-xs font-medium text-slate-500 mt-1">{act.time}</p>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
