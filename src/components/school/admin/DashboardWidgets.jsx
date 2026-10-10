import React from 'react';
import { motion } from 'framer-motion';
import { ChevronRight, AlertCircle, Clock, CheckCircle2, AlertTriangle, FileText, IndianRupee, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export function AttentionRequiredWidget({ className }) {
  const tasks = [
    { label: 'Pending Admissions', count: 12, action: 'Review', color: 'text-rose-600', bg: 'bg-rose-50', btn: 'text-blue-600 bg-blue-50 hover:bg-blue-100', icon: Users },
    { label: 'Low Attendance Alert', count: 18, action: 'View', color: 'text-emerald-600', bg: 'bg-emerald-50', btn: 'text-blue-600 bg-blue-50 hover:bg-blue-100', icon: AlertTriangle },
    { label: 'Pending Fee Payments', count: 37, action: 'Manage', color: 'text-amber-600', bg: 'bg-amber-50', btn: 'text-white bg-blue-600 hover:bg-blue-700', icon: IndianRupee },
    { label: 'Teacher Leave Requests', count: 4, action: 'Approve', color: 'text-purple-600', bg: 'bg-purple-50', btn: 'text-blue-600 bg-blue-50 hover:bg-blue-100', icon: FileText },
    { label: 'ID Cards Pending', count: 26, action: 'Generate', color: 'text-indigo-600', bg: 'bg-indigo-50', btn: 'text-blue-600 bg-blue-50 hover:bg-blue-100', icon: CheckCircle2 },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn("h-full", className)}
    >
      <Card className="rounded-[1.75rem] border border-slate-200/70 shadow-sm bg-white dark:bg-slate-900 p-5 flex flex-col justify-between h-full font-semibold">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <AlertCircle className="size-5 text-rose-500" />
            <CardTitle className="font-display font-semibold text-slate-800 dark:text-white text-base">Attention Required</CardTitle>
          </div>
          <button className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1">
            View All <ChevronRight className="size-3.5" />
          </button>
        </div>

        <div className="flex flex-col gap-3">
          {tasks.map((task, i) => (
            <div key={i} className="flex items-center justify-between gap-3 p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className={cn("size-9 rounded-full flex items-center justify-center shrink-0", task.bg, task.color)}>
                  <task.icon className="size-4" />
                </div>
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-200 leading-snug truncate">{task.label}</span>
              </div>
              <div className="flex items-center gap-2 sm:gap-4 shrink-0">
                <Badge variant="destructive" className="bg-rose-100 text-rose-700 hover:bg-rose-100 font-semibold px-2 py-0.5">
                  {task.count}
                </Badge>
                <button className={cn("px-3 sm:px-4 py-1.5 rounded-full text-xs font-semibold transition-colors text-center", task.btn)}>
                  {task.action}
                </button>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </motion.div>
  );
}

export function FeeOverviewWidget({ className }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn("h-full", className)}
    >
      <Card className="rounded-[1.75rem] border border-slate-200/70 shadow-sm bg-white dark:bg-slate-900 p-5 flex flex-col justify-between h-full font-semibold">
        <div className="flex items-center justify-between mb-5">
          <CardTitle className="font-display font-semibold text-slate-800 dark:text-white text-base">Fee Overview</CardTitle>
          <button className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1">
            View Reports <ChevronRight className="size-3.5" />
          </button>
        </div>

        <div className="flex items-end justify-between mb-4">
          <div>
            <p className="text-3xl font-semibold text-slate-900 dark:text-white tracking-tight">₹18,40,000</p>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-1">Total Collected</p>
          </div>
          <div className="text-right">
            <Badge variant="secondary" className="bg-blue-50 text-blue-600 font-semibold text-sm px-2.5 py-0.5">82%</Badge>
            <p className="text-[10px] font-semibold text-slate-400 uppercase mt-1">Target Achieved</p>
          </div>
        </div>

        <div className="h-3 w-full bg-slate-100 dark:bg-slate-800 rounded-full mb-6 overflow-hidden flex">
          <div className="h-full bg-blue-600 rounded-full" style={{ width: '82%' }}></div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="size-2 rounded-full bg-emerald-500"></div>
              <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">Collected</span>
            </div>
            <span className="text-sm font-semibold text-slate-900 dark:text-white">₹18.4L</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="size-2 rounded-full bg-amber-500"></div>
              <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">Pending</span>
            </div>
            <span className="text-sm font-semibold text-slate-900 dark:text-white">₹4.2L</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="size-2 rounded-full bg-rose-500"></div>
              <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">Overdue</span>
            </div>
            <span className="text-sm font-semibold text-slate-900 dark:text-white">₹1.1L</span>
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          <button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-xl transition-colors text-sm">
            Collect Fee
          </button>
          <button className="flex-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-blue-600 dark:text-blue-400 hover:bg-slate-50 font-semibold py-2.5 rounded-xl transition-colors text-sm">
            View Reports
          </button>
        </div>
      </Card>
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
      className={cn("h-full", className)}
    >
      <Card className="rounded-[1.75rem] border border-slate-200/70 shadow-sm bg-white dark:bg-slate-900 p-5 flex flex-col justify-between h-full font-semibold">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Clock className="size-5 text-blue-500" />
            <CardTitle className="font-display font-semibold text-slate-800 dark:text-white text-base">Recent Activity</CardTitle>
          </div>
          <button className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1">
            View All <ChevronRight className="size-3.5" />
          </button>
        </div>

        <div className="flex flex-col gap-4">
          {activities.map((act, i) => (
            <div key={i} className="flex gap-3">
              <div className={cn("size-10 rounded-full flex items-center justify-center shrink-0 mt-0.5", act.bg, act.color)}>
                <act.icon className="size-4.5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{act.title}</p>
                <p className="text-xs font-semibold text-slate-500 mt-1">{act.time}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </motion.div>
  );
}
