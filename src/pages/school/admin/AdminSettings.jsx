import React, { useMemo, useState } from 'react';
import { Bell, Globe, Save, Shield, SlidersHorizontal, User } from 'lucide-react';
import { EddvaLogo, InstituteLogo, StatusBadge } from '@/components/school/admin/Brand';

const tabs = [
  { id: 'workspace', label: 'Workspace', icon: Globe },
  { id: 'security', label: 'Security', icon: Shield },
  { id: 'notifications', label: 'Alerts', icon: Bell },
  { id: 'profile', label: 'Profile', icon: User },
];

export default function Settings() {
  const user = getStoredUser();
  const institute = getStoredInstitute();
  const [activeTab, setActiveTab] = useState('workspace');
  const [saved, setSaved] = useState(false);
  const isInstituteAdmin = user?.role === 'INSTITUTE_ADMIN';

  const workspaceRows = useMemo(() => {
    if (isInstituteAdmin) {
      return [
        ['Workspace URL', formatTenantUrl(institute?.tenantDomain) || '-'],
        ['Tenant Domain', `${institute?.tenantDomain || '-'}.localhost:8080`],
        ['Institute Email', institute?.email || '-'],
        ['Status', institute?.status || '-'],
      ];
    }

    return [
      ['Super Admin URL', getBaseAppUrl()],
      ['Tenant Pattern', '{tenant}.localhost:8080'],
      ['Billing Features', 'Disabled for internal company use'],
      ['Approval Mode', 'Manual approval for self-registration'],
    ];
  }, [institute, isInstituteAdmin]);

  function fakeSave(event) {
    event.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2200);
  }

  return (
    <div className="space-y-6 pb-12">
      <div>
        <h1 className="font-display text-3xl font-bold text-surface-950">System Settings</h1>
        <p className="mt-2 text-sm font-medium text-surface-500">
          {isInstituteAdmin ? 'Review your tenant workspace and account controls.' : 'Configure the internal multi-tenant Super Admin console.'}
        </p>
      </div>

      {saved && <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm font-bold text-emerald-700">Settings saved for this session.</div>}

      <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
        <div className="glass-panel rounded-lg p-2 shadow-soft">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left text-sm font-bold transition ${
                activeTab === tab.id ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-600/20' : 'text-surface-600 hover:bg-surface-50 hover:text-surface-950'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </div>

        <form onSubmit={fakeSave} className="glass-panel rounded-lg p-6 shadow-soft">
          {activeTab === 'workspace' && (
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                {isInstituteAdmin ? <InstituteLogo institute={institute} size="lg" /> : <EddvaLogo compact />}
                <div>
                  <h2 className="font-display text-xl font-bold text-surface-950">{isInstituteAdmin ? institute?.name || 'Institute Workspace' : 'EDDVA Super Admin'}</h2>
                  <div className="mt-2">{isInstituteAdmin ? <StatusBadge status={institute?.status} /> : <StatusBadge status="ACTIVE" />}</div>
                </div>
              </div>
              <div className="grid gap-3">
                {workspaceRows.map(([label, value]) => (
                  <div key={label} className="grid gap-2 rounded-lg border border-surface-200 bg-surface-50 p-4 sm:grid-cols-[180px_1fr]">
                    <p className="text-sm font-bold text-surface-500">{label}</p>
                    <p className="break-all text-sm font-semibold text-surface-950">{value}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="space-y-6">
              <div>
                <h2 className="font-display text-xl font-bold text-surface-950">Role-Based Access</h2>
                <p className="mt-2 text-sm font-medium text-surface-500">The app supports Super Admin and Institute Admin access boundaries.</p>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                {[
                  ['Super Admin', 'Root domain only. Manages approvals, analytics, institutes, and settings.'],
                  ['Institute Admin', 'Tenant domain only. Sees institute logo, dashboard, and scoped support data.'],
                ].map(([title, copy]) => (
                  <div key={title} className="rounded-lg border border-surface-200 bg-surface-50 p-5">
                    <Shield className="mb-4 h-6 w-6 text-brand-700" />
                    <p className="font-bold text-surface-950">{title}</p>
                    <p className="mt-2 text-sm font-medium leading-6 text-surface-600">{copy}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="space-y-6">
              <h2 className="font-display text-xl font-bold text-surface-950">Operational Alerts</h2>
              {[
                ['New institute registrations', true],
                ['Pending approval reminders', true],
                ['Support ticket changes', isInstituteAdmin],
              ].map(([label, enabled]) => (
                <label key={label} className="flex items-center justify-between gap-4 rounded-lg border border-surface-200 bg-surface-50 p-4">
                  <span className="text-sm font-bold text-surface-700">{label}</span>
                  <input type="checkbox" defaultChecked={enabled} className="h-5 w-5 rounded border-surface-300 text-brand-700 focus:ring-brand-200" />
                </label>
              ))}
            </div>
          )}

          {activeTab === 'profile' && (
            <div className="space-y-6">
              <h2 className="font-display text-xl font-bold text-surface-950">Profile</h2>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="block">
                  <span className="mb-1.5 block text-sm font-bold text-surface-700">Name</span>
                  <input defaultValue={user?.name || 'Admin'} className="w-full rounded-lg border border-surface-200 bg-surface-50 px-4 py-3 text-sm font-medium outline-none focus:border-brand-300 focus:bg-white focus:ring-4 focus:ring-brand-100" />
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-sm font-bold text-surface-700">Email</span>
                  <input defaultValue={user?.email || ''} className="w-full rounded-lg border border-surface-200 bg-surface-50 px-4 py-3 text-sm font-medium outline-none focus:border-brand-300 focus:bg-white focus:ring-4 focus:ring-brand-100" />
                </label>
              </div>
            </div>
          )}

          <div className="mt-8 flex justify-end border-t border-surface-200 pt-5">
            <button className="inline-flex items-center gap-2 rounded-lg bg-eddva-gradient px-5 py-2.5 text-sm font-bold text-white shadow-blue">
              <Save className="h-4 w-4" />
              Save Settings
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
