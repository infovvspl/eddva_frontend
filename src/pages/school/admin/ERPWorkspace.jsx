import React from 'react';
import { TrendingUp, Shield } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function ERPWorkspace() {
  const modules = [
    { name: 'Roles & Permissions', path: '/school/admin/roles', icon: Shield, color: 'text-indigo-600', bg: 'bg-indigo-50', active: true },
    { name: 'Sales & Purchase', icon: TrendingUp, color: 'text-brand-600', bg: 'bg-brand-50', active: false },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-black text-surface-950">ERP Dashboard</h1>
        <p className="text-surface-500 mt-1">
          Manage your school's business and operational activities from one centralized ERP platform.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {modules.map(mod => {
          const Icon = mod.icon;
          const content = (
            <>
              <div className="absolute inset-0 bg-surface-50 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className={`p-4 rounded-full ${mod.bg} ${mod.color} mb-4 relative z-10`}>
                <Icon className="h-8 w-8" />
              </div>
              <h3 className="font-bold text-surface-900 text-lg relative z-10">{mod.name}</h3>
              {!mod.active && (
                <span className="mt-2 text-xs font-bold uppercase tracking-widest text-surface-400 bg-surface-100 px-3 py-1 rounded-full relative z-10">
                  Coming Soon
                </span>
              )}
            </>
          );

          if (mod.path) {
            return (
              <Link to={mod.path} key={mod.name} className="bg-white rounded-xl border border-surface-200 p-6 flex flex-col items-center justify-center text-center shadow-sm relative overflow-hidden group hover:border-indigo-200 hover:shadow-md transition-all">
                {content}
              </Link>
            );
          }

          return (
            <div key={mod.name} className="bg-white rounded-xl border border-surface-200 p-6 flex flex-col items-center justify-center text-center shadow-sm relative overflow-hidden group">
              {content}
            </div>
          );
        })}
      </div>
    </div>
  );
}
