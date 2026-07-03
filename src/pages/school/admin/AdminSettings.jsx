import React, { useMemo, useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Bell, Globe, Save, Shield, SlidersHorizontal, User, Plus, Trash2, Edit2 } from 'lucide-react';
import { EddvaLogo, InstituteLogo, SchoolLogo, StatusBadge } from '@/components/school/admin/Brand';
import { useAuth } from '@/context/SchoolAuthContext';
import { formatTenantUrl, getBaseAppUrl } from '@/lib/school/tenantRedirect';
import { useSchoolNotification } from '@/context/SchoolNotificationContext';
import api from '@/lib/api/school-client';
import { toast } from 'sonner';
import { useConfirm } from '@/context/ConfirmContext';
import { CustomSelect } from "@/components/ui/CustomSelect";

const baseTabs = [
  { id: 'workspace', label: 'Workspace', icon: Globe },
  { id: 'security', label: 'Security', icon: Shield },
  { id: 'notifications', label: 'Alerts', icon: Bell },
  { id: 'profile', label: 'Profile', icon: User },
];

export default function Settings() {
  const { user, institute } = useAuth();
  const { settings, toggleSetting } = useSchoolNotification();
  const [searchParams, setSearchParams] = useSearchParams();
  const tabFromUrl = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState(tabFromUrl || 'workspace');
  const [saved, setSaved] = useState(false);
  const isInstituteAdmin = user?.role === 'INSTITUTE_ADMIN';

  useEffect(() => {
    if (tabFromUrl && ['workspace', 'security', 'notifications', 'profile'].includes(tabFromUrl)) {
      setActiveTab(tabFromUrl);
    }
  }, [tabFromUrl]);

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    setSearchParams({ tab: tabId }, { replace: true });
  };


  const availableTabs = useMemo(() => {
    return [...baseTabs];
  }, []);

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
          {availableTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
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
                {isInstituteAdmin ? <SchoolLogo src={institute?.logo} alt={institute?.name} size="dashboard" /> : <EddvaLogo compact />}
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
              <h2 className="font-display text-xl font-bold text-surface-950">System & Communication Alerts</h2>
              {[
                ['desktopNotificationsEnabled', 'Desktop Notifications', 'Receive real-time desktop notifications.'],
                ['chatNotificationsEnabled', 'Chat Notifications', 'Get alerts when a teacher/parent sends you a message.'],
                ['announcementAlerts', 'Announcement Alerts', 'Get alerts for new announcements/notices.'],
                ['assignmentAlerts', 'Assignment Alerts', 'Deadlines and grading reminders.'],
                ['attendanceAlerts', 'Attendance Alerts', 'Attendance status notifications.'],
                ['soundEnabled', 'Notification Sounds', 'Play a sound alert when a message arrives.'],
                ['doNotDisturb', 'Do Not Disturb Mode', 'Mute all system and desktop notifications.'],
              ].map(([key, label, description]) => (
                <div key={key} className="flex items-center justify-between gap-4 rounded-lg border border-surface-200 bg-surface-50 p-4">
                  <div>
                    <span className="block text-sm font-bold text-surface-950">{label}</span>
                    <span className="mt-1 block text-xs text-surface-500">{description}</span>
                  </div>
                  <input 
                    type="checkbox" 
                    checked={settings[key] || false} 
                    onChange={() => toggleSetting(key)} 
                    className="h-5 w-5 rounded border-surface-300 text-brand-700 focus:ring-brand-200 cursor-pointer" 
                  />
                </div>
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
            <button className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-blue-600/25 transition hover:brightness-110 active:scale-[0.99]">
              <Save className="h-4 w-4" />
              Save Settings
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function PeriodSettings() {
  const [periods, setPeriods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingPeriod, setEditingPeriod] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const confirm = useConfirm();

  const [formData, setFormData] = useState({
    periodName: '',
    startTime: '08:00',
    endTime: '08:45',
    periodType: 'Academic',
    sequenceNo: '',
    isActive: true,
  });

  useEffect(() => {
    fetchPeriods();
  }, []);

  const fetchPeriods = async () => {
    setLoading(true);
    try {
      const res = await api.get('/academic/periods');
      setPeriods(res.data?.data || []);
    } catch (err) {
      console.error(err);
      toast.error('Failed to fetch academic periods.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddClick = () => {
    setEditingPeriod(null);
    setFormError('');
    const maxSeq = periods.reduce((max, p) => p.sequenceNo > max ? p.sequenceNo : max, 0);
    setFormData({
      periodName: '',
      startTime: '08:00',
      endTime: '08:45',
      periodType: 'Academic',
      sequenceNo: String(maxSeq + 1),
      isActive: true,
    });
    setShowForm(true);
  };

  const handleEditClick = (period) => {
    setEditingPeriod(period);
    setFormError('');
    setFormData({
      periodName: period.periodName,
      startTime: period.startTime,
      endTime: period.endTime,
      periodType: period.periodType,
      sequenceNo: String(period.sequenceNo),
      isActive: period.isActive,
    });
    setShowForm(true);
  };

  const handleDeleteClick = async (period) => {
    const ok = await confirm({
      title: 'Delete Period',
      message: `Are you sure you want to delete ${period.periodName}? This cannot be undone.`,
      confirmLabel: 'Delete',
      cancelLabel: 'Cancel',
    });
    if (!ok) return;

    try {
      await api.delete(`/academic/periods/${period.id}`);
      toast.success('Period deleted successfully.');
      fetchPeriods();
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.message || 'Failed to delete period.';
      toast.error(msg);
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setIsSubmitting(true);

    if (formData.startTime >= formData.endTime) {
      setFormError('Start time must be before end time.');
      setIsSubmitting(false);
      return;
    }

    const payload = {
      periodName: formData.periodName,
      startTime: formData.startTime,
      endTime: formData.endTime,
      periodType: formData.periodType,
      sequenceNo: parseInt(formData.sequenceNo, 10),
      isActive: formData.isActive,
    };

    try {
      if (editingPeriod) {
        await api.put(`/academic/periods/${editingPeriod.id}`, payload);
        toast.success('Period updated successfully.');
      } else {
        await api.post('/academic/periods', payload);
        toast.success('Period created successfully.');
      }
      setShowForm(false);
      fetchPeriods();
    } catch (err) {
      console.error(err);
      setFormError(err.response?.data?.message || 'Failed to save period.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <div className="p-4 text-slate-500 font-semibold animate-pulse">Loading periods...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Period Management</h2>
          <p className="text-sm text-slate-500 mt-1">Configure your school's daily timetable periods and breaks.</p>
        </div>
        {!showForm && (
          <button
            type="button"
            onClick={handleAddClick}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 px-4 py-2 text-sm font-bold text-white transition-all shadow-md shadow-blue-500/20"
          >
            <Plus size={16} /> Add Period
          </button>
        )}
      </div>

      {showForm ? (
        <div className="rounded-2xl border border-slate-200 p-5 space-y-4 bg-slate-50/50">
          <h3 className="text-lg font-bold text-slate-900">{editingPeriod ? 'Edit Period' : 'Add Period'}</h3>
          {formError && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-750 text-sm font-semibold rounded-xl">
              {formError}
            </div>
          )}
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Period Name *</label>
              <input
                type="text"
                required
                value={formData.periodName}
                onChange={e => setFormData(prev => ({ ...prev, periodName: e.target.value }))}
                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold outline-none focus:border-blue-500"
                placeholder="e.g. Period 1, Lunch Break"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Sequence Number *</label>
              <input
                type="number"
                required
                value={formData.sequenceNo}
                onChange={e => setFormData(prev => ({ ...prev, sequenceNo: e.target.value }))}
                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold outline-none focus:border-blue-500"
                placeholder="e.g. 1, 2"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Start Time *</label>
              <input
                type="time"
                required
                value={formData.startTime}
                onChange={e => setFormData(prev => ({ ...prev, startTime: e.target.value }))}
                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">End Time *</label>
              <input
                type="time"
                required
                value={formData.endTime}
                onChange={e => setFormData(prev => ({ ...prev, endTime: e.target.value }))}
                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Period Type *</label>
              <CustomSelect
          onChange={(val) => setFormData(prev => ({ ...prev, periodType: val }))}
                value={formData.periodType}
                options={[
                { value: "Academic", label: "Academic" },
                { value: "Break", label: "Break" },
                { value: "Assembly", label: "Assembly" },
                { value: "Sports", label: "Sports" },
                { value: "Activity", label: "Activity" },
                { value: "Extra Class", label: "Extra Class" },
              ]}
                className="w-full"
              />
            </div>
            <div className="flex items-center pt-6">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={e => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                  className="h-5 w-5 rounded border-slate-350 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm font-bold text-slate-700">Is Active</span>
              </label>
            </div>
          </div>
          <div className="flex gap-3 pt-3">
            <button
              type="button"
              onClick={handleFormSubmit}
              disabled={isSubmitting}
              className="flex-1 rounded-xl bg-blue-600 hover:bg-blue-700 py-2.5 text-sm font-bold text-white shadow-lg shadow-blue-500/20 active:scale-[0.98] transition-all disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : 'Save Period'}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-450 uppercase tracking-widest text-[10px] font-black">
              <tr>
                <th className="px-5 py-3.5 w-16 text-center">Seq</th>
                <th className="px-5 py-3.5">Period Name</th>
                <th className="px-5 py-3.5">Timings</th>
                <th className="px-5 py-3.5">Type</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5 w-24 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-semibold text-slate-755">
              {periods.map(p => (
                <tr key={p.id} className="hover:bg-slate-50/50">
                  <td className="px-5 py-4 text-center font-bold text-slate-400">{p.sequenceNo}</td>
                  <td className="px-5 py-4 font-black text-slate-900">{p.periodName}</td>
                  <td className="px-5 py-4 font-mono text-xs">{p.startTime} - {p.endTime}</td>
                  <td className="px-5 py-4">
                    <span className={`inline-flex rounded-lg px-2 py-0.5 text-[10px] font-black uppercase ${
                      (p.periodType === 'Break' || (p.periodName && p.periodName.toLowerCase().includes('break'))) ? 'bg-amber-100 text-amber-700' :
                      p.periodType === 'Academic' ? 'bg-blue-100 text-blue-700' :
                      p.periodType === 'Assembly' ? 'bg-purple-100 text-purple-700' :
                      p.periodType === 'Sports' ? 'bg-emerald-100 text-emerald-700' :
                      'bg-slate-100 text-slate-600'
                    }`}>
                      {(p.periodType === 'Break' || (p.periodName && p.periodName.toLowerCase().includes('break'))) ? 'BREAK' : p.periodType}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    {p.isActive ? (
                      <span className="text-emerald-600 text-xs font-bold flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full" /> Active
                      </span>
                    ) : (
                      <span className="text-slate-400 text-xs font-bold flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 bg-slate-300 rounded-full" /> Inactive
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-4 text-right">
                    <div className="flex gap-2 justify-end">
                      <button
                        type="button"
                        onClick={() => handleEditClick(p)}
                        className="rounded-lg border border-slate-200 bg-white p-2 text-slate-500 hover:bg-slate-50 hover:text-blue-600 transition"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteClick(p)}
                        className="rounded-lg border border-slate-200 bg-white p-2 text-slate-500 hover:bg-red-50 hover:text-red-600 transition"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {periods.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-slate-400 font-bold">
                    No periods configured. Click "Add Period" to get started.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
