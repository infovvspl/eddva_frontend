import React, { useState, useMemo } from 'react';
import { 
  Shield, 
  User, 
  Bell, 
  Globe, 
  Lock, 
  Sparkles, 
  CreditCard, 
  Save, 
  ChevronRight, 
  Smartphone,
  Mail,
  Zap,
  Cloud,
  CheckCircle2,
  TrendingUp
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/SchoolAuthContext';
import { cn } from '@/components/school/admin/Skeleton';
import { InstituteLogo, StatusBadge } from '@/components/school/admin/Brand';

const tabs = [
  { id: 'workspace', label: 'Workspace', icon: Globe, description: 'Manage your institute domain and visibility' },
  { id: 'profile', label: 'Account', icon: User, description: 'Update your personal information' },
  { id: 'security', label: 'Security', icon: Shield, description: 'Manage passwords and authentication' },
  { id: 'notifications', label: 'Alerts', icon: Bell, description: 'Configure system notifications' },
  { id: 'ai', label: 'AI Intelligence', icon: Sparkles, description: 'Enable and configure AI modules' },
  { id: 'billing', label: 'Financial', icon: CreditCard, description: 'Manage plans and subscriptions' },
];

export default function Settings() {
  const { user, institute } = useAuth();
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';

  const visibleTabs = useMemo(() => {
    return tabs.filter(tab => {
      if (isSuperAdmin && (tab.id === 'workspace' || tab.id === 'billing')) return false;
      return true;
    });
  }, [isSuperAdmin]);

  const [activeTab, setActiveTab] = useState(isSuperAdmin ? 'profile' : 'workspace');
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }, 1200);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-20 px-4 sm:px-6">
      <header className="relative py-12 px-8 rounded-[3rem] bg-gradient-to-br from-slate-900 to-slate-800 text-white overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/20 rounded-full blur-[100px] -mr-20 -mt-20" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-[80px] -ml-10 -mb-10" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="flex items-center gap-6">
            <div className="relative">
              <InstituteLogo institute={institute} size="lg" className="rounded-3xl border-4 border-white/10 shadow-2xl" />
              <div className="absolute -bottom-2 -right-2 bg-emerald-500 p-2 rounded-xl shadow-lg border-2 border-slate-900">
                <CheckCircle2 size={16} className="text-white" />
              </div>
            </div>
            <div>
              <h1 className="text-4xl font-bold tracking-tight tracking-tight">{institute?.name || 'Eddva Institute'}</h1>
              <div className="mt-2 flex items-center gap-3">
                <span className="text-sm font-bold text-slate-400 uppercase tracking-widest">Workspace Settings</span>
                <div className="h-1 w-1 rounded-full bg-slate-600" />
                <StatusBadge status={institute?.status || 'ACTIVE'} />
              </div>
            </div>
          </div>
          
          <button 
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-3 px-8 py-4 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold tracking-tight text-sm uppercase tracking-widest shadow-xl shadow-blue-600/20 transition-all active:scale-95 disabled:opacity-50"
          >
            {isSaving ? (
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              <Save size={18} />
            )}
            {isSaving ? 'Synchronizing...' : 'Save Changes'}
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-8">
        <aside className="space-y-2">
          {visibleTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "w-full flex items-center gap-4 p-5 rounded-3xl transition-all duration-300 border text-left group",
                activeTab === tab.id 
                  ? "border-blue-600 bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-xl shadow-blue-600/20 translate-x-2" 
                  : "border-transparent bg-white/70 dark:bg-slate-900/60 text-slate-500 hover:border-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800"
              )}
            >
              <div className={cn(
                "w-12 h-12 rounded-2xl flex items-center justify-center transition-colors",
                activeTab === tab.id 
                  ? "bg-white/15 text-white shadow-lg shadow-black/10" 
                  : "bg-slate-100 dark:bg-slate-800 text-slate-500 group-hover:bg-blue-50 group-hover:text-blue-600"
              )}>
                <tab.icon size={22} />
              </div>
              <div className="min-w-0">
                <p className={cn(
                  "font-bold tracking-tight text-xs uppercase tracking-widest",
                  activeTab === tab.id ? "text-slate-900 dark:text-white" : "text-slate-500"
                )}>
                  {tab.label}
                </p>
                <p className="text-[10px] font-medium text-slate-400 mt-0.5 truncate">{tab.description}</p>
              </div>
              {activeTab === tab.id && (
                <ChevronRight size={16} className="ml-auto text-blue-600" />
              )}
            </button>
          ))}
        </aside>

        <main className="glass-premium rounded-[3rem] border border-slate-100 dark:border-slate-800 p-8 sm:p-12 min-h-[600px] overflow-hidden relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            >
              {activeTab === 'workspace' && <WorkspaceTab institute={institute} />}
              {activeTab === 'profile' && <ProfileTab user={user} />}
              {activeTab === 'security' && <SecurityTab />}
              {activeTab === 'notifications' && <NotificationsTab />}
              {activeTab === 'ai' && <AiTab />}
              {activeTab === 'billing' && <BillingTab />}
            </motion.div>
          </AnimatePresence>

          {saved && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className="absolute bottom-8 right-8 flex items-center gap-3 px-6 py-4 rounded-2xl bg-emerald-500 text-white font-bold tracking-tight text-xs uppercase tracking-widest shadow-2xl shadow-emerald-500/20"
            >
              <Zap size={16} />
              Settings Updated Successfully
            </motion.div>
          )}
        </main>
      </div>
    </div>
  );
}

function WorkspaceTab({ institute }) {
  return (
    <div className="space-y-10">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white tracking-tight">Workspace Identity</h2>
        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 text-[10px] font-bold tracking-tight uppercase tracking-widest">
          <Globe size={14} />
          {institute?.tenantDomain}.eddva.io
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <SettingsField label="Institute Name" value={institute?.name} />
        <SettingsField label="Tenant Domain" value={institute?.tenantDomain} suffix=".eddva.io" />
        <SettingsField label="Principal Name" value={institute?.principalName} />
        <SettingsField label="Registration No" value={institute?.registrationNo} />
        <div className="md:col-span-2">
          <SettingsField label="Institute Address" value={institute?.address} isTextarea />
        </div>
      </div>

      <div className="p-8 rounded-[2rem] bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center">
            <Cloud size={20} />
          </div>
          <div>
            <h3 className="font-bold tracking-tight text-slate-900 dark:text-white text-sm uppercase tracking-widest">Cloud Deployment</h3>
            <p className="text-xs text-slate-400 font-medium">Server location and network status</p>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatusIndicator label="API Status" status="Healthy" isPositive />
          <StatusIndicator label="DB Latency" status="12ms" isPositive />
          <StatusIndicator label="Region" status="Mumbai-1" />
          <StatusIndicator label="Tier" status="Enterprise" />
        </div>
      </div>
    </div>
  );
}

function ProfileTab({ user }) {
  return (
    <div className="space-y-10">
      <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white tracking-tight">Personal Information</h2>
      <div className="flex items-center gap-8 mb-10 p-8 rounded-[2rem] bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800">
        <div className="relative group">
          <div className="w-24 h-24 rounded-[2rem] overflow-hidden border-4 border-white dark:border-slate-800 shadow-xl">
            {user?.profileImage ? (
              <img src={user.profileImage} alt={user.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-blue-600 text-white text-3xl font-bold tracking-tight">
                {user?.name?.[0].toUpperCase()}
              </div>
            )}
          </div>
          <button className="absolute -bottom-2 -right-2 w-10 h-10 rounded-xl bg-white dark:bg-slate-800 shadow-lg border border-slate-100 dark:border-slate-700 flex items-center justify-center text-slate-500 hover:text-blue-600 transition-colors">
            <Smartphone size={18} />
          </button>
        </div>
        <div>
          <h3 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">{user?.name}</h3>
          <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-1">{user?.role?.replace('_', ' ')}</p>
          <div className="mt-4 flex gap-2">
            <button className="px-4 py-2 rounded-xl bg-blue-600 text-white text-[10px] font-bold tracking-tight uppercase tracking-widest shadow-lg shadow-blue-600/20">Change Photo</button>
            <button className="px-4 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-[10px] font-bold tracking-tight uppercase tracking-widest">Remove</button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <SettingsField label="Full Name" value={user?.name} />
        <SettingsField label="Email Address" value={user?.email} />
        <SettingsField label="Phone Number" value={user?.phone || '+91 00000 00000'} />
        <SettingsField label="Designation" value="Administrative Head" />
      </div>
    </div>
  );
}

function SecurityTab() {
  return (
    <div className="space-y-10">
      <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white tracking-tight">Security & Privacy</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="p-8 rounded-[2rem] border border-slate-100 dark:border-slate-800 space-y-6">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 flex items-center justify-center">
            <Lock size={24} />
          </div>
          <div>
            <h3 className="font-bold tracking-tight text-slate-900 dark:text-white text-sm uppercase tracking-widest">Password Management</h3>
            <p className="text-xs text-slate-400 font-medium mt-1">Change your login credentials</p>
          </div>
          <button className="w-full py-4 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold tracking-tight uppercase tracking-widest">Update Password</button>
        </div>

        <div className="p-8 rounded-[2rem] border border-slate-100 dark:border-slate-800 space-y-6">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <Shield size={24} />
          </div>
          <div>
            <h3 className="font-bold tracking-tight text-slate-900 dark:text-white text-sm uppercase tracking-widest">2FA Authentication</h3>
            <p className="text-xs text-slate-400 font-medium mt-1">Add an extra layer of security</p>
          </div>
          <button className="w-full py-4 rounded-2xl bg-blue-600 text-white text-xs font-bold tracking-tight uppercase tracking-widest shadow-xl shadow-blue-600/20">Enable Two-Factor</button>
        </div>
      </div>
    </div>
  );
}

function NotificationsTab() {
  return (
    <div className="space-y-10">
      <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white tracking-tight">Notification Alerts</h2>
      <div className="space-y-4">
        <ToggleField title="Email Notifications" description="Receive daily reports and emergency alerts via email" checked />
        <ToggleField title="SMS Alerts" description="Get instant SMS for critical infrastructure updates" />
        <ToggleField title="Browser Push" description="Show live notifications on your dashboard" checked />
        <ToggleField title="AI Insight Nudges" description="Get proactive suggestions from the EDDVA AI engine" checked />
      </div>
    </div>
  );
}

function AiTab() {
  return (
    <div className="space-y-10">
      <div className="flex items-center gap-4">
        <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white tracking-tight">AI Intelligence Hub</h2>
        <div className="px-3 py-1 rounded-full bg-blue-600 text-white text-[10px] font-bold tracking-tight uppercase tracking-widest animate-pulse">Enterprise</div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <AiFeatureCard 
          title="Predictive Attendance" 
          description="Identify students at risk of dropping out based on attendance patterns" 
          icon={TrendingUp}
          enabled
        />
        <AiFeatureCard 
          title="Automated Fee Nudges" 
          description="Send smart payment reminders based on parent's interaction history" 
          icon={Mail}
          enabled
        />
        <AiFeatureCard 
          title="Curriculum Optimization" 
          description="AI suggestions for class schedules based on teacher workload" 
          icon={Zap}
        />
      </div>
    </div>
  );
}

function BillingTab() {
  return (
    <div className="space-y-10">
      <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white tracking-tight">Financial & Subscription</h2>
      
      <div className="p-10 rounded-[3rem] bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-32 -mt-32" />
        <div className="relative z-10 flex flex-col md:flex-row justify-between gap-8">
          <div>
            <p className="text-xs font-bold tracking-tight uppercase tracking-[0.2em] opacity-60">Current Plan</p>
            <h3 className="text-4xl font-bold tracking-tight mt-2">Enterprise Pro</h3>
            <p className="mt-4 text-blue-100 font-medium">Valid until Dec 2026 · Unlimited users & AI modules</p>
          </div>
          <div className="flex flex-col items-end">
            <p className="text-xs font-bold tracking-tight uppercase tracking-[0.2em] opacity-60">Annual Payment</p>
            <h3 className="text-4xl font-bold tracking-tight mt-2">₹1,45,000</h3>
            <button className="mt-6 px-8 py-3 rounded-2xl bg-white text-blue-700 font-bold tracking-tight text-xs uppercase tracking-widest shadow-xl transition-transform active:scale-95">Upgrade Plan</button>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-sm font-bold tracking-tight text-slate-900 dark:text-white uppercase tracking-widest px-2">Recent Invoices</h3>
        {[
          { id: 'INV-2024-001', date: 'May 10, 2024', amount: '₹12,400', status: 'PAID' },
          { id: 'INV-2024-002', date: 'Apr 10, 2024', amount: '₹12,400', status: 'PAID' },
        ].map(inv => (
          <div key={inv.id} className="flex items-center justify-between p-6 rounded-3xl border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500">
                <CreditCard size={18} />
              </div>
              <div>
                <p className="text-sm font-bold tracking-tight text-slate-900 dark:text-white">{inv.id}</p>
                <p className="text-xs font-medium text-slate-400">{inv.date}</p>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <p className="text-sm font-bold tracking-tight text-slate-900 dark:text-white">{inv.amount}</p>
              <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 text-[10px] font-bold tracking-tight">{inv.status}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SettingsField({ label, value, suffix, isTextarea }) {
  return (
    <div className="space-y-2">
      <label className="text-[10px] font-bold tracking-tight text-slate-400 uppercase tracking-widest ml-1">{label}</label>
      <div className="relative">
        {isTextarea ? (
          <textarea 
            defaultValue={value}
            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl px-5 py-4 text-sm font-bold text-slate-900 dark:text-white outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-500/5 h-32"
          />
        ) : (
          <div className="relative flex items-center">
            <input 
              defaultValue={value}
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl px-5 py-4 text-sm font-bold text-slate-900 dark:text-white outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-500/5"
            />
            {suffix && (
              <span className="absolute right-5 text-xs font-bold tracking-tight text-slate-400 uppercase tracking-widest">{suffix}</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function StatusIndicator({ label, status, isPositive }) {
  return (
    <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 shadow-sm border border-slate-50 dark:border-slate-700">
      <p className="text-[9px] font-bold tracking-tight text-slate-400 uppercase tracking-widest">{label}</p>
      <p className={cn(
        "text-xs font-bold tracking-tight mt-1",
        isPositive ? "text-emerald-600" : "text-slate-900 dark:text-white"
      )}>{status}</p>
    </div>
  );
}

function ToggleField({ title, description, checked }) {
  return (
    <div className="flex items-center justify-between p-6 rounded-3xl border border-slate-100 dark:border-slate-800">
      <div>
        <p className="text-sm font-bold tracking-tight text-slate-900 dark:text-white uppercase tracking-tight">{title}</p>
        <p className="text-xs font-medium text-slate-400 mt-0.5">{description}</p>
      </div>
      <button className={cn(
        "w-12 h-6 rounded-full relative transition-colors duration-300",
        checked ? "bg-blue-600" : "bg-slate-200 dark:bg-slate-700"
      )}>
        <div className={cn(
          "absolute top-1 w-4 h-4 rounded-full bg-white transition-all duration-300",
          checked ? "left-7" : "left-1"
        )} />
      </button>
    </div>
  );
}

function AiFeatureCard({ title, description, icon: Icon, enabled }) {
  return (
    <div className="p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 flex items-start gap-6 relative overflow-hidden group">
      {enabled && (
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/5 rounded-full blur-3xl -mr-16 -mt-16" />
      )}
      <div className={cn(
        "w-14 h-14 rounded-3xl flex items-center justify-center transition-all",
        enabled ? "bg-blue-600 text-white shadow-xl shadow-blue-600/20" : "bg-slate-100 dark:bg-slate-800 text-slate-400"
      )}>
        <Icon size={28} />
      </div>
      <div className="flex-1">
        <div className="flex items-center justify-between">
          <h3 className="font-bold tracking-tight text-slate-900 dark:text-white text-sm uppercase tracking-widest">{title}</h3>
          <span className={cn(
            "text-[9px] font-bold tracking-tight uppercase tracking-widest px-3 py-1 rounded-full",
            enabled ? "bg-emerald-500/10 text-emerald-600" : "bg-slate-100 dark:bg-slate-800 text-slate-400"
          )}>{enabled ? 'Active' : 'Disabled'}</span>
        </div>
        <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">{description}</p>
        <button className="mt-6 text-[10px] font-bold tracking-tight text-blue-600 uppercase tracking-widest hover:underline transition-all">Configure Parameters</button>
      </div>
    </div>
  );
}
