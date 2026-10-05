import React, { useState, useEffect } from 'react';
import * as LucideIcons from 'lucide-react';
import { apiClient as api } from '@/lib/api/client';

export default function ERPWorkspace() {
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchModules = async () => {
      try {
        const res = await api.get('/school/institute-admin/erp-modules');
        setModules(res.data?.data || []);
      } catch (err) {
        console.error('Failed to load ERP modules', err);
      } finally {
        setLoading(false);
      }
    };
    fetchModules();
  }, []);

  return (
    <div className="p-4 sm:p-6 lg:p-8 w-full space-y-8">
      <div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white">ERP Dashboard</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">
          Manage your school's business and operational activities from one centralized ERP platform.
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center p-12">
          <LucideIcons.Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {modules.map(mod => {
            const Icon = LucideIcons[mod.icon] || LucideIcons.Box;
            const colorClass = mod.color || 'slate';

            const content = (
              <>
                <div className="absolute inset-0 bg-slate-50 dark:bg-slate-800 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className={`p-4 rounded-full bg-${colorClass}-50 text-${colorClass}-600 dark:bg-${colorClass}-950/30 dark:text-${colorClass}-400 mb-4 relative z-10`}>
                  <Icon className="h-8 w-8" />
                </div>
                <h3 className="font-bold text-slate-900 dark:text-white text-lg relative z-10">{mod.name}</h3>
                {!mod.path && (
                  <span className="mt-2 text-xs font-bold uppercase tracking-widest text-slate-400 bg-slate-100 dark:bg-slate-800 dark:text-slate-500 px-3 py-1 rounded-full relative z-10">
                    Coming Soon
                  </span>
                )}
              </>
            );

            // Every module with a path lives in the ERP frontend, a separate app —
            // hand off via SSO instead of an in-app <Link>, which would try (and
            // fail) to resolve mod.path against this app's own router.
            if (mod.path) {
              const token =
                localStorage.getItem('eddva_access_token') ||
                localStorage.getItem('school_token') ||
                localStorage.getItem('token') ||
                '';
              // The token goes in the URL fragment so it is never sent to a server
              // or written to logs; the ERP page removes it on arrival.
              const erpFrontendUrl = import.meta.env.VITE_ERP_FRONTEND_URL || 'http://localhost:5173';
              const targetSsoUrl = `${erpFrontendUrl}/sso#token=${encodeURIComponent(token)}&next=${encodeURIComponent(mod.path)}`;

              return (
                <button
                  key={mod.key}
                  type="button"
                  onClick={() => window.open(targetSsoUrl, '_blank', 'noopener')}
                  className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 flex flex-col items-center justify-center text-center shadow-sm relative overflow-hidden group hover:border-blue-500 dark:hover:border-blue-500 hover:shadow-lg transition-all cursor-pointer w-full text-left"
                >
                  {content}
                </button>
              );
            }

            return (
              <div key={mod.key} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 flex flex-col items-center justify-center text-center shadow-sm relative overflow-hidden group">
                {content}
              </div>
            );
          })}
          
          {modules.length === 0 && (
            <div className="col-span-full py-12 text-center text-slate-500 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 border-dashed">
              <LucideIcons.PackageOpen className="mx-auto h-12 w-12 text-slate-300 mb-3" />
              <p className="font-bold">No ERP Modules Active</p>
              <p className="text-sm mt-1">Please contact your administrator to enable modules for your school.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
