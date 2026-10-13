import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, ChevronLeft, ChevronRight, CheckCircle2, Loader2 } from 'lucide-react';
import api from '@/lib/api/school-client';
import { getResponseData } from '@/lib/school/apiData';
import { cn } from '@/lib/utils';

export default function AttentionRequiredPage() {
  const navigate = useNavigate();
  const [flags, setFlags] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    api.get('/admin/attention-flags')
      .then((res) => {
        if (!alive) return;
        const data = getResponseData(res);
        setFlags(Array.isArray(data) ? data : []);
      })
      .catch(() => { if (alive) setFlags([]); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, []);

  return (
    <div className="p-4 sm:p-6 lg:p-8 w-full space-y-6">
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/school/admin')}
          className="flex items-center gap-1 text-sm font-semibold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
        >
          <ChevronLeft className="w-4 h-4" /> Dashboard
        </button>
      </div>

      <div className="flex items-center gap-2">
        <AlertCircle className="w-6 h-6 text-rose-500" />
        <h1 className="text-xl font-semibold text-slate-900 dark:text-white">Attention Required</h1>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      ) : flags.length > 0 ? (
        <ul className="space-y-2">
          {flags.map((fl) => (
            <li key={fl.id}>
              <button
                type="button"
                onClick={() => navigate(fl.actionUrl || '/school/admin/students')}
                className="w-full text-left flex items-start gap-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 px-4 py-3 transition-colors"
              >
                <span className={cn('mt-1.5 size-2 shrink-0 rounded-full', String(fl.priority).toUpperCase() === 'HIGH' ? 'bg-rose-500' : 'bg-amber-400')} />
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold text-slate-900 dark:text-white">{fl.title}</span>
                  <span className="block text-xs text-slate-500 dark:text-slate-400 mt-0.5">{fl.message}</span>
                </span>
                <ChevronRight className="w-4 h-4 text-slate-400 shrink-0 mt-1" />
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <div className="py-16 flex flex-col items-center justify-center text-center">
          <CheckCircle2 className="w-10 h-10 text-emerald-500 mb-2" />
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">No flags need attention right now.</p>
        </div>
      )}
    </div>
  );
}
