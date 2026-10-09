import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, AlertCircle, Clock, CheckCircle2, IndianRupee, Users, ArrowUp, ArrowDown, Flag, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import api from '@/lib/api/school-client';
import { getResponseList } from '@/lib/school/apiData';

const FLAG_PRIORITY_STYLE = {
  urgent: { color: 'text-rose-600', bg: 'bg-rose-50' },
  high: { color: 'text-orange-600', bg: 'bg-orange-50' },
  medium: { color: 'text-blue-600', bg: 'bg-blue-50' },
  low: { color: 'text-slate-600', bg: 'bg-slate-100' },
};

const MotionCard = motion(Card);

export function AttentionRequiredWidget({ className }) {
  const navigate = useNavigate();
  const [flags, setFlags] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await api.get('/notifications', { params: { category: 'flag', isRead: 'false', limit: 5 } });
        if (active) setFlags(getResponseList(res));
      } catch (err) {
        console.error('Failed to load flagged notifications:', err);
        if (active) setFlags([]);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, []);

  const openFlag = (flag) => {
    if (flag.actionUrl) navigate(flag.actionUrl);
    else navigate('/school/admin/notifications?tab=flag');
  };

  return (
    <MotionCard
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/40 shadow-[0_8px_30px_rgb(0,0,0,0.015)] flex min-w-0 flex-col p-5",
        className
      )}
      style={{ borderRadius: 'clamp(1.25rem, 1.8vw, 1.75rem)' }}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <AlertCircle className="w-4.5 h-4.5 text-rose-500" />
          <h3 className="font-display font-bold text-slate-800 dark:text-white text-sm">Attention Required</h3>
        </div>
        <button
          onClick={() => navigate('/school/admin/notifications?tab=flag')}
          className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 flex items-center gap-1 shrink-0"
        >
          View All <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-6">
          <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
        </div>
      ) : flags.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-5 text-center">
          <CheckCircle2 className="w-7 h-7 text-emerald-400 mb-2" />
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">No flags need attention right now.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {flags.map((flag) => {
            const style = FLAG_PRIORITY_STYLE[flag.priority] || FLAG_PRIORITY_STYLE.medium;
            return (
              <button
                key={flag.id}
                onClick={() => openFlag(flag)}
                className="flex items-center justify-between gap-3 p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-left"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className={cn("w-9 h-9 rounded-full flex items-center justify-center shrink-0", style.bg, style.color)}>
                    <Flag className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold text-slate-700 dark:text-slate-200 leading-snug truncate">{flag.title}</span>
                    <span className="block text-xs text-slate-400 dark:text-slate-500 truncate">{flag.message}</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-600 shrink-0" />
              </button>
            );
          })}
        </div>
      )}
    </MotionCard>
  );
}

function formatCurrencyCompact(amount) {
  const n = Number(amount) || 0;
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(1)}Cr`;
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
  if (n >= 1000) return `₹${(n / 1000).toFixed(1)}K`;
  return `₹${Math.round(n)}`;
}

export function FeeOverviewWidget({ className, collected = 0, pending = 0, overdue = 0, percentage = 0 }) {
  const navigate = useNavigate();
  const hasData = collected + pending + overdue > 0;

  const openFeesReport = () => {
    localStorage.setItem('selectedReport', 'Fees Collection');
    navigate('/school/admin/reports');
  };

  return (
    <MotionCard
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn("bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/40 shadow-[0_8px_30px_rgb(0,0,0,0.015)] flex min-w-0 flex-col p-5", className)}
      style={{ borderRadius: 'clamp(1.25rem, 1.8vw, 1.75rem)' }}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display font-bold text-slate-800 dark:text-white text-sm">Fee Overview</h3>
        <button
          onClick={openFeesReport}
          className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 flex items-center gap-1"
        >
          View Reports <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {!hasData ? (
        <div className="flex flex-col items-center justify-center py-6 text-center">
          <IndianRupee className="w-7 h-7 text-slate-300 dark:text-slate-600 mb-2" />
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">No fee records yet.</p>
        </div>
      ) : (
        <>
          <div className="flex items-end justify-between mb-4">
            <div>
              <p className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">{formatCurrencyCompact(collected)}</p>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mt-1">Total Collected</p>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-blue-600 dark:text-blue-400">{percentage}%</p>
              <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">of Billed</p>
            </div>
          </div>

          <div className="h-3 w-full bg-slate-100 dark:bg-slate-800 rounded-full mb-5 overflow-hidden flex">
            <div className="h-full bg-blue-600 rounded-full" style={{ width: `${Math.min(100, percentage)}%` }}></div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                <span className="text-sm font-semibold text-slate-600 dark:text-slate-400">Collected</span>
              </div>
              <span className="text-sm font-bold text-slate-900 dark:text-white">{formatCurrencyCompact(collected)}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                <span className="text-sm font-semibold text-slate-600 dark:text-slate-400">Pending</span>
              </div>
              <span className="text-sm font-bold text-slate-900 dark:text-white">{formatCurrencyCompact(pending)}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-rose-500"></div>
                <span className="text-sm font-semibold text-slate-600 dark:text-slate-400">Overdue</span>
              </div>
              <span className="text-sm font-bold text-slate-900 dark:text-white">{formatCurrencyCompact(overdue)}</span>
            </div>
          </div>
        </>
      )}

      <div className="mt-5">
        <button
          onClick={openFeesReport}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl transition-colors text-sm"
        >
          View Fees Report
        </button>
      </div>
    </MotionCard>
  );
}

function relativeTime(dateStr) {
  if (!dateStr) return 'Just now';
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return 'Recently';
  const diffSec = Math.floor((Date.now() - d.getTime()) / 1000);
  if (diffSec < 60) return 'Just now';
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
  return `${Math.floor(diffSec / 86400)}d ago`;
}

const ACTIVITY_CATEGORY_STYLE = {
  attendance: { icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
  fee: { icon: IndianRupee, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  assignment: { icon: Clock, color: 'text-purple-600', bg: 'bg-purple-50' },
  announcement: { icon: AlertCircle, color: 'text-rose-600', bg: 'bg-rose-50' },
  default: { icon: Clock, color: 'text-slate-600', bg: 'bg-slate-100' },
};

export function RecentActivityWidget({ className, activities: providedActivities, loading: providedLoading }) {
  const navigate = useNavigate();
  const isControlled = Array.isArray(providedActivities);
  const [fetchedActivities, setFetchedActivities] = useState([]);
  const [fetchedLoading, setFetchedLoading] = useState(!isControlled);

  useEffect(() => {
    if (isControlled) return undefined;
    let active = true;
    (async () => {
      try {
        const res = await api.get('/notifications', { params: { limit: 5 } });
        if (active) setFetchedActivities(getResponseList(res));
      } catch (err) {
        console.error('Failed to load recent activity:', err);
        if (active) setFetchedActivities([]);
      } finally {
        if (active) setFetchedLoading(false);
      }
    })();
    return () => { active = false; };
  }, [isControlled]);

  const activities = isControlled ? providedActivities : fetchedActivities;
  const loading = isControlled ? Boolean(providedLoading) : fetchedLoading;

  return (
    <MotionCard
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn("bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/40 shadow-[0_8px_30px_rgb(0,0,0,0.015)] flex min-w-0 flex-col p-5", className)}
      style={{ borderRadius: 'clamp(1.25rem, 1.8vw, 1.75rem)' }}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Clock className="w-4.5 h-4.5 text-blue-500" />
          <h3 className="font-display font-bold text-slate-800 dark:text-white text-sm">Recent Activity</h3>
        </div>
        <button
          onClick={() => navigate('/school/admin/notifications')}
          className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 flex items-center gap-1 shrink-0"
        >
          View All <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-6">
          <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
        </div>
      ) : activities.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-6 text-center">
          <Clock className="w-7 h-7 text-slate-300 dark:text-slate-600 mb-2" />
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">No recent activity yet.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {activities.map((act) => {
            const style = ACTIVITY_CATEGORY_STYLE[act.category] || ACTIVITY_CATEGORY_STYLE.default;
            return (
              <button
                key={act.id}
                onClick={() => (act.actionUrl ? navigate(act.actionUrl) : navigate('/school/admin/notifications'))}
                className="flex gap-3 text-left"
              >
                <div className={cn("w-9 h-9 rounded-full flex items-center justify-center shrink-0 mt-0.5", style.bg, style.color)}>
                  <style.icon className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">{act.title}</p>
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-500 mt-1">{relativeTime(act.createdAt)}</p>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </MotionCard>
  );
}
