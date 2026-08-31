import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
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
            
            const isLibraryModule =
              mod.ssoKey === 'library' ||
              mod.key === 'library' ||
              (mod.name && mod.name.toLowerCase().includes('library'));

            const isSportsModule =
              mod.ssoKey === 'sports' ||
              mod.key === 'sports' ||
              (mod.name && mod.name.toLowerCase().includes('sports'));
            
            const content = (
              <>
                <div className="absolute inset-0 bg-slate-50 dark:bg-slate-800 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className={`p-4 rounded-full bg-${colorClass}-50 text-${colorClass}-600 dark:bg-${colorClass}-950/30 dark:text-${colorClass}-400 mb-4 relative z-10`}>
                  <Icon className="h-8 w-8" />
                </div>
                <h3 className="font-bold text-slate-900 dark:text-white text-lg relative z-10">{mod.name}</h3>
                {!mod.path && !isLibraryModule && !isSportsModule && (
                  <span className="mt-2 text-xs font-bold uppercase tracking-widest text-slate-400 bg-slate-100 dark:bg-slate-800 dark:text-slate-500 px-3 py-1 rounded-full relative z-10">
                    Coming Soon
                  </span>
                )}
              </>
            );

            // SSO redirect for Library Management Platform
            if (isLibraryModule) {
              const token =
                localStorage.getItem('eddva_access_token') ||
                localStorage.getItem('school_token') ||
                localStorage.getItem('token') ||
                '';
              const libraryBackendUrl = import.meta.env.VITE_LIBRARY_BACKEND_URL || 'http://localhost:3001';
              const targetSsoUrl = `${libraryBackendUrl}/api/v1/library/auth/sso?token=${encodeURIComponent(token)}`;
              
              return (
                <button
                  key={mod.key || 'library'}
                  type="button"
                  onClick={() => window.open(targetSsoUrl, '_blank')}
                  className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 flex flex-col items-center justify-center text-center shadow-sm relative overflow-hidden group hover:border-blue-500 dark:hover:border-blue-500 hover:shadow-lg transition-all cursor-pointer w-full text-left"
                >
                  {content}
                </button>
              );
            }

            // SSO redirect for Sports Management Platform
            if (isSportsModule) {
              const token =
                localStorage.getItem('eddva_access_token') ||
                localStorage.getItem('school_token') ||
                localStorage.getItem('token') ||
                '';
              const sportsBackendUrl = import.meta.env.VITE_SPORTS_BACKEND_URL || import.meta.env.VITE_LIBRARY_BACKEND_URL || 'http://localhost:3001';
              const targetSsoUrl = `${sportsBackendUrl}/api/v1/sports/auth/sso?token=${encodeURIComponent(token)}`;
              
              return (
                <button
                  key={mod.key || 'sports'}
                  type="button"
                  onClick={() => window.open(targetSsoUrl, '_blank')}
                  className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 flex flex-col items-center justify-center text-center shadow-sm relative overflow-hidden group hover:border-emerald-500 dark:hover:border-emerald-500 hover:shadow-lg transition-all cursor-pointer w-full text-left"
                >
                  {content}
                </button>
              );
            }

            if (mod.path) {
              return (
                <Link to={mod.path} key={mod.key} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 flex flex-col items-center justify-center text-center shadow-sm relative overflow-hidden group hover:border-blue-200 dark:hover:border-blue-900/50 hover:shadow-md transition-all">
                  {content}
                </Link>
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
