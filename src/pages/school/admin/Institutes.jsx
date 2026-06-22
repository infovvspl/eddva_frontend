import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  CheckCircle,
  Eye,
  EyeOff,
  ExternalLink,
  ImagePlus,
  Mail,
  MapPin,
  Plus,
  Search,
  ShieldCheck,
  UploadCloud,
  X,
  XCircle,
  Trash2,
  MessageCircleQuestion,
  FileText,
  ClipboardList,
  CalendarCheck,
  CheckSquare,
  TrendingUp,
  FileBarChart,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api/school-client';
import { apiClient } from '@/lib/api/client';
import { InstituteLogo, StatusBadge } from '@/components/school/admin/Brand';
import { Skeleton } from '@/components/school/admin/Skeleton';
import { formatTenantUrl } from '@/lib/school/tenantRedirect';
import { AI_FEATURES } from '@/lib/constants/aiFeatures';
import { useConfirm } from '@/context/ConfirmContext';

const BoardBadge = ({ board }) => {
  const colors = {
    CBSE: 'bg-blue-100 text-blue-800',
    ICSE: 'bg-green-100 text-green-800',
    STATE: 'bg-gray-100 text-gray-800',
    IB: 'bg-purple-100 text-purple-800',
  };
  return (
    <span className={`px-2 py-0.5 rounded text-xs font-medium ${colors[board] || 'bg-gray-100 text-gray-600'}`}>
      {board || '—'}
    </span>
  );
};

const StatusBadgeCustom = ({ status, isSuspended }) => {
  const isSup = isSuspended || status === 'suspended' || status === 'SUSPENDED';
  const isTrial = status === 'trial' || status === 'TRIAL';

  if (isSup) return (
    <span className="flex items-center gap-1 text-xs text-red-600">
      <span className="w-1.5 h-1.5 rounded-full bg-red-500 inline-block"/>
      Suspended
    </span>
  );
  if (isTrial) return (
    <span className="flex items-center gap-1 text-xs text-amber-600">
      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block"/>
      Trial
    </span>
  );
  return (
    <span className="flex items-center gap-1 text-xs text-green-600">
      <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block"/>
      Active
    </span>
  );
};

const StatCard = ({ label, value, color }) => {
  const colors = {
    blue: 'border-blue-300 bg-blue-50 text-blue-800',
    green: 'border-green-300 bg-green-50 text-green-800',
    amber: 'border-amber-300 bg-amber-50 text-amber-800',
    red: 'border-red-300 bg-red-50 text-red-800',
    purple: 'border-purple-300 bg-purple-50 text-purple-800',
  };
  return (
    <div className={`rounded-lg border shadow-sm p-4 text-left ${colors[color] || 'border-gray-300 bg-gray-50 text-gray-800'}`}>
      <p className="text-sm font-bold">{label}</p>
      <p className="mt-1 font-display text-3xl font-bold">{value}</p>
    </div>
  );
};

const Toggle = ({ enabled, onChange, disabled, size = 'md' }) => {
  return (
    <button
      type="button"
      onClick={() => !disabled && onChange(!enabled)}
      className={`relative inline-flex items-center rounded-full transition-colors duration-200 focus:outline-none shrink-0 ${size === 'sm' ? 'w-8 h-4' : 'w-11 h-6'} ${enabled ? 'bg-blue-600' : 'bg-surface-200'} ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
    >
      <span className={`inline-block rounded-full bg-white shadow transform transition-transform duration-200 ${size === 'sm' ? 'w-3 h-3' : 'w-4 h-4'} ${enabled ? (size === 'sm' ? 'translate-x-4' : 'translate-x-6') : 'translate-x-1'}`} />
    </button>
  );
};

const AiIconMap = {
  MessageCircleQuestion,
  FileText,
  ClipboardList,
  CalendarCheck,
  CheckSquare,
  TrendingUp,
  FileBarChart,
  Sparkles,
};

const emptyForm = {
  instituteName: '',
  principalName: '',
  registrationNo: '',
  email: '',
  phone: '',
  alternatePhone: '',
  adminPassword: '',
  plotNo: '',
  streetName: '',
  landMark: '',
  city: '',
  district: '',
  state: '',
  pinCode: '',
  website: '',
  tenantDomain: '',
  schoolType: '',
  board: '',
  establishedYear: '',
  affiliationNo: '',
  totalClasses: '',
  totalStudents: '',
  totalTeachers: '',
  academicSession: '',
  timezone: 'Asia/Kolkata',
  language: 'en',
  currency: 'INR',
  subscriptionPlan: 'FREE',
  adminName: '',
  adminEmail: '',
  status: 'PENDING',
  logo: '',
  modulesPermissions: {
    dashboard: true,
    academics: true,
    calendar: true,
    timetable: true,
    fees: true,
    communications: true,
    reports: true,
    liveClasses: true,
  },
  aiEnabled: false,
  aiFeatures: {
    ai_doubt_solver: true,
    ai_notes_generator: true,
    ai_quiz_generator: true,
    ai_study_planner: true,
    ai_career_guidance: true,
  },
};

const moduleOptions = [
  ['dashboard', 'Dashboard'],
  ['academics', 'Academics'],
  ['calendar', 'Calendar'],
  ['timetable', 'Timetable'],
  ['fees', 'Fees'],
  ['communications', 'Communications'],
  ['reports', 'Reports'],
  ['liveClasses', 'Live Classes'],
];

const inputClass =
  'w-full rounded-lg border border-surface-200 bg-surface-50 px-4 py-2.5 text-sm font-medium text-surface-950 outline-none transition focus:border-brand-400 focus:bg-white focus:ring-4 focus:ring-brand-100';

function readLogoFile(file) {
  return new Promise((resolve, reject) => {
    if (!file) return resolve(null);
    if (!file.type.startsWith('image/')) return reject(new Error('Please upload an image file.'));
    if (file.size > 2 * 1024 * 1024) return reject(new Error('Logo must be smaller than 2MB.'));

    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('Logo could not be read.'));
    reader.readAsDataURL(file);
  });
}

export default function Institutes() {
  const confirm = useConfirm();
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [boardFilter, setBoardFilter] = useState('');
  const [selectedInstitute, setSelectedInstitute] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState(emptyForm);
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState(emptyForm);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  
  const [panelAiEnabled, setPanelAiEnabled] = useState(false);
  const [panelAiFeatures, setPanelAiFeatures] = useState({});
  const [savingAi, setSavingAi] = useState(false);

  useEffect(() => {
    if (selectedInstitute) {
      setPanelAiEnabled(selectedInstitute.aiEnabled || false);
      setPanelAiFeatures(normalizeAiFeatures(selectedInstitute.aiFeatures));
    }
  }, [selectedInstitute]);

  function dispatchDataChanged(resource = 'institutes') {
    window.dispatchEvent(new CustomEvent('eddva:data-changed', { detail: { resource } }));
  }

  function normalizeModulesPermissions(value) {
    if (!value) return { ...emptyForm.modulesPermissions };
    if (typeof value === 'string') {
      try {
        return { ...emptyForm.modulesPermissions, ...JSON.parse(value) };
      } catch {
        return { ...emptyForm.modulesPermissions };
      }
    }
    return { ...emptyForm.modulesPermissions, ...(value || {}) };
  }

  function normalizeAiFeatures(value) {
    const defaults = { ...emptyForm.aiFeatures };
    // Array (DB default '[]') or falsy → use defaults
    if (!value || Array.isArray(value)) return defaults;
    if (typeof value === 'string') {
      try { value = JSON.parse(value); } catch { return defaults; }
    }
    if (typeof value !== 'object' || Array.isArray(value)) return defaults;
    // Merge saved values on top of defaults so any new features get their defaultEnabled
    return { ...defaults, ...value };
  }

  function toEditForm(institute) {
    return {
      instituteName: institute?.name || '',
      principalName: institute?.principalName || '',
      registrationNo: institute?.registrationNo || '',
      email: institute?.email || '',
      phone: institute?.phone || '',
      alternatePhone: institute?.alternatePhone || '',
      adminPassword: '',
      plotNo: institute?.plotNo || '',
      streetName: institute?.streetName || '',
      landMark: institute?.landMark || '',
      city: institute?.city || '',
      district: institute?.district || '',
      state: institute?.state || '',
      pinCode: institute?.pinCode || '',
      website: institute?.website || '',
      tenantDomain: institute?.tenantDomain || '',
      schoolType: institute?.schoolType || institute?.school_type || '',
      board: institute?.board || '',
      establishedYear: institute?.establishedYear || institute?.established_year || '',
      affiliationNo: institute?.affiliationNo || institute?.affiliation_no || '',
      totalClasses: institute?.totalClasses || institute?.total_classes || '',
      totalStudents: institute?.totalStudents || institute?.total_students || '',
      totalTeachers: institute?.totalTeachers || institute?.total_teachers || '',
      academicSession: institute?.academicSession || '',
      timezone: institute?.timezone || 'Asia/Kolkata',
      language: institute?.language || 'en',
      currency: institute?.currency || 'INR',
      subscriptionPlan: institute?.subscriptionPlan || 'FREE',
      adminName: institute?.adminName || institute?.principalName || '',
      adminEmail: institute?.adminEmail || institute?.email || '',
      status: institute?.status || 'PENDING',
      logo: institute?.logo || '',
      modulesPermissions: normalizeModulesPermissions(institute?.modulesPermissions),
      aiEnabled: institute?.aiEnabled ?? false,
      aiFeatures: normalizeAiFeatures(institute?.aiFeatures),
    };
  }

  async function loadInstitutes(showLoader = true) {
    try {
      if (showLoader) setLoading(true);
      const res = await api.get('/institutes', {
        params: {
          perPage: 1000,
          status: statusFilter,
          search: search || undefined,
        },
      });

      const data = res.data?.data;
      const rawList = Array.isArray(data) ? data : (data?.items || res.data?.items || []);

      const mappedList = rawList.map(item => ({
        ...item,
        tenantDomain: item.tenantDomain || item.tenant_domain,
        principalName: item.principalName || item.principal_name,
        registrationNo: item.registrationNo || item.registration_no,
        plotNo: item.plotNo || item.plot_no,
        streetName: item.streetName || item.street_name,
        landMark: item.landMark || item.land_mark,
        pinCode: item.pinCode || item.pin_code,
        academicSession: item.academicSession || item.academic_session,
        adminName: item.adminName || item.admin_name,
        adminEmail: item.adminEmail || item.admin_email,
        totalClasses: item.totalClasses ?? item.total_classes ?? 0,
        totalStudents: item.totalStudents ?? item.total_students ?? 0,
        totalTeachers: item.totalTeachers ?? item.total_teachers ?? 0,
        totalParents: item.totalParents ?? item.total_parents ?? 0,
        activeUsers: item.activeUsers ?? item.active_users ?? 0,
        createdAt: item.createdAt || item.created_at,
        updatedAt: item.updatedAt || item.updated_at,
        modulesPermissions: item.modulesPermissions || item.modules_permissions,
        aiEnabled: item.aiEnabled ?? item.ai_enabled ?? false,
        aiFeatures: normalizeAiFeatures(item.aiFeatures ?? item.ai_features),
      }));

      setList(mappedList);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || err.response?.data?.error || 'Unable to load institutes.');
    } finally {
      if (showLoader) setLoading(false);
    }
  }

  useEffect(() => {
    loadInstitutes(true);
  }, [statusFilter]);

  const filteredList = useMemo(() => {
    return list.filter((inst) => {
      if (boardFilter && inst.board !== boardFilter) return false;
      if (statusFilter && inst.status?.toLowerCase() !== statusFilter.toLowerCase()) return false;
      if (search && !inst.name?.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [list, search, boardFilter, statusFilter]);

  const stats = {
    total: list.length,
    active: list.filter((item) => item.status === 'ACTIVE' || item.status === 'active').length,
    trial: list.filter((item) => item.status === 'TRIAL' || item.status === 'trial').length,
    suspended: list.filter((item) => item.status === 'SUSPENDED' || item.status === 'suspended').length,
    totalStudents: list.reduce((acc, item) => acc + (parseInt(item.totalStudents || item.total_students || item._count?.users || 0) || 0), 0),
  };

  async function setStatus(instituteId, action) {
    try {
      setSaving(true);
      const res = await api.put(`/institutes/${instituteId}/${action}`);
      setSelectedInstitute(res.data.institute);
      toast.success(`Institute ${action === 'approve' ? 'activated' : 'suspended'} successfully`);
      dispatchDataChanged('institutes');
      await loadInstitutes();
    } catch (err) {
      const message = err.response?.data?.message || err.response?.data?.error || 'Unable to update institute.';
      setError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  }

  async function handleSuspend(instituteId) {
    const ok = await confirm({
      title: 'Suspend School',
      message: 'Are you sure you want to suspend this school? This will temporarily restrict workspace access.',
      confirmLabel: 'Suspend',
      cancelLabel: 'Cancel',
      variant: 'destructive',
    });
    if (!ok) return;
    
    try {
      await api.post(`/institutes/${instituteId}/suspend`, { reason: 'Suspended by super administrator' });
      toast.success('School suspended successfully');
      await loadInstitutes();
    } catch (err) {
      toast.error('Failed to suspend school');
    }
  }

  async function handleReactivate(instituteId) {
    const ok = await confirm({
      title: 'Reactivate School',
      message: 'Are you sure you want to reactivate this school? This will restore workspace access.',
      confirmLabel: 'Reactivate',
      cancelLabel: 'Cancel',
    });
    if (!ok) return;
    
    try {
      await api.post(`/institutes/${instituteId}/reactivate`);
      toast.success('School reactivated successfully');
      await loadInstitutes();
    } catch (err) {
      toast.error('Failed to reactivate school');
    }
  }

  async function deleteInstitute(instituteId) {
    const confirm1 = await confirm({
      title: 'Confirm Delete',
      message: 'Are you sure you want to delete this school? This will permanently delete ALL data for this school. This action cannot be undone.',
      confirmLabel: 'Delete',
      cancelLabel: 'Cancel',
      variant: 'destructive',
    });
    if (!confirm1) return;

    try {
      setSaving(true);
      await api.delete(`/institutes/${instituteId}`);
      toast.success("School deleted");
      dispatchDataChanged('institutes');
      if (selectedInstitute?.id === instituteId) {
        setSelectedInstitute(null);
      }
      await loadInstitutes();
    } catch (err) {
      const message = err.response?.data?.message || err.response?.data?.error || 'Failed to delete school.';
      setError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  }

  function openEdit(institute) {
    setSelectedInstitute(institute);
    setEditForm(toEditForm(institute));
    setEditMode(true);
  }

  async function saveInstitute(event) {
    event.preventDefault();
    if (!selectedInstitute?.id) return;

    setSaving(true);
    setError('');

    try {
      const payload = {
        name: editForm.instituteName,
        principalName: editForm.principalName,
        registrationNo: editForm.registrationNo,
        email: editForm.email,
        phone: editForm.phone,
        alternatePhone: editForm.alternatePhone,
        plotNo: editForm.plotNo,
        streetName: editForm.streetName,
        landMark: editForm.landMark,
        city: editForm.city,
        district: editForm.district,
        state: editForm.state,
        pinCode: editForm.pinCode,
        website: editForm.website,
        tenantDomain: editForm.tenantDomain,
        schoolType: editForm.schoolType,
        board: editForm.board,
        establishedYear: editForm.establishedYear,
        affiliationNo: editForm.affiliationNo,
        totalClasses: editForm.totalClasses,
        totalStudents: editForm.totalStudents,
        totalTeachers: editForm.totalTeachers,
        academicSession: editForm.academicSession,
        timezone: editForm.timezone,
        language: editForm.language,
        currency: editForm.currency,
        subscriptionPlan: editForm.subscriptionPlan,
        status: editForm.status,
        logo: editForm.logo,
        adminName: editForm.adminName,
        adminEmail: editForm.adminEmail,
        adminPassword: editForm.adminPassword || undefined,
        modulesPermissions: editForm.modulesPermissions,
      };

      const res = await api.put(`/institutes/${selectedInstitute.id}`, payload);
      setSelectedInstitute(res.data);
      setEditForm(toEditForm(res.data));
      setEditMode(false);
      toast.success('Institute updated successfully');
      dispatchDataChanged('institutes');
      await loadInstitutes();
    } catch (err) {
      const message = err.response?.data?.message || err.response?.data?.error || 'Unable to update institute.';
      setError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  }

  async function handleLogo(event) {
    try {
      const logo = await readLogoFile(event.target.files?.[0]);
      setCreateForm((prev) => ({ ...prev, logo: logo || '' }));
      setError('');
    } catch (err) {
      setError(err.message);
    }
  }

  async function createInstitute(event) {
    event.preventDefault();
    setError('');

    if (!createForm.adminPassword) {
      setError('Please enter a temporary password.');
      return;
    }
    if (createForm.adminPassword.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (createForm.adminPassword !== confirmPassword) {
      setError('Passwords do not match. Please check and try again.');
      return;
    }

    setSaving(true);
    try {
      // 1. Create the institute using the Auth Registration endpoint
      // This is REQUIRED so the backend properly hashes the adminPassword!
      const res = await apiClient.post('/school/auth/register', {
        instituteName: createForm.instituteName || createForm.name,
        name: createForm.principalName || createForm.name || 'Admin',
        email: createForm.email,
        password: createForm.adminPassword,
        tenantDomain: createForm.tenantDomain,
        tenant_domain: createForm.tenantDomain, // Send both just to be safe
        phone: createForm.phone,
        alternatePhone: createForm.alternatePhone,
        registrationNo: createForm.registrationNo,
        plotNo: createForm.plotNo,
        streetName: createForm.streetName,
        landMark: createForm.landMark,
        city: createForm.city,
        district: createForm.district,
        state: createForm.state,
        pinCode: createForm.pinCode,
        logo: createForm.logo,
        schoolType: createForm.schoolType,
        board: createForm.board,
        establishedYear: createForm.establishedYear,
        affiliationNo: createForm.affiliationNo,
        totalClasses: createForm.totalClasses,
        totalStudents: createForm.totalStudents,
        totalTeachers: createForm.totalTeachers,
        aiEnabled: createForm.aiEnabled,
        aiFeatures: createForm.aiFeatures,
      });

      let newInstitute = res.data?.institute || res.data?.data || res.data;
      if (Array.isArray(newInstitute)) newInstitute = newInstitute[0];

      // 2. Immediately approve it since the user wants it auto-approved
      if (newInstitute?.id) {
        await api.put(`/institutes/${newInstitute.id}/approve`).catch(e => console.error("Auto-approve failed:", e));
      }

      toast.success('Institute created successfully!');
      dispatchDataChanged('institutes');
      setCreateForm(emptyForm);
      setConfirmPassword('');
      setShowPassword(false);
      setShowConfirmPassword(false);
      setCreateOpen(false);
      await loadInstitutes();
    } catch (err) {
      const rawMsg = err.response?.data?.message || err.response?.data?.error || '';

      // Map known DB / backend constraint errors to human-friendly messages
      let friendlyMsg = 'Unable to create institute. Please try again.';
      if (rawMsg.includes('tenant_domain') || rawMsg.includes('tenantDomain') || rawMsg.includes('subdomain')) {
        friendlyMsg = 'This subdomain / tenant domain is already taken. Please choose a different one.';
      } else if (rawMsg.includes('email') && rawMsg.includes('duplicate')) {
        friendlyMsg = 'An institute with this email already exists. Please use a different email.';
      } else if (rawMsg.includes('duplicate key') || rawMsg.includes('unique constraint')) {
        // Generic unique constraint — try to find which field
        const match = rawMsg.match(/\"institutes_(.+?)_key\"/);
        const field = match ? match[1].replace(/_/g, ' ') : 'field';
        friendlyMsg = `A duplicate value was found for "${field}". Please update and try again.`;
      } else if (rawMsg) {
        friendlyMsg = rawMsg;
      }

      setError(friendlyMsg);
      toast.error(friendlyMsg, { duration: 5000 });
    } finally {
      setSaving(false);
    }
  }

  const openWorkspace = (tenantDomain) => {
    const url = formatTenantUrl(tenantDomain);
    if (url) window.location.assign(url);
  };

  const toggleModulePermission = (key) => {
    setEditForm((prev) => ({
      ...prev,
      modulesPermissions: {
        ...(prev.modulesPermissions || {}),
        [key]: !prev.modulesPermissions?.[key],
      },
    }));
  };

  async function saveAiSettings() {
    setSavingAi(true);
    try {
      await api.put(`/institutes/${selectedInstitute.id}`, {
        aiEnabled: panelAiEnabled,
        aiFeatures: panelAiFeatures,
      });
      toast.success('AI settings saved');
      dispatchDataChanged('institutes');
      setSelectedInstitute({
        ...selectedInstitute,
        aiEnabled: panelAiEnabled,
        aiFeatures: panelAiFeatures,
      });
      loadInstitutes(false);
    } catch (err) {
      toast.error('Failed to save AI settings');
    } finally {
      setSavingAi(false);
    }
  }

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-surface-950">School Management</h1>
          <p className="mt-2 text-sm font-medium text-surface-500">Manage schools, approve registrations, control access.</p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <button onClick={() => setCreateOpen(true)} className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white shadow-lg hover:bg-indigo-700 transition-colors">
            <Plus className="h-4 w-4" />
            Add School
          </button>
        </div>
      </div>

      {error && <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">{error}</div>}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard label="Total Schools" value={stats.total} color="blue" />
        <StatCard label="Active" value={stats.active} color="green" />
        <StatCard label="Trial" value={stats.trial} color="amber" />
        <StatCard label="Suspended" value={stats.suspended} color="red" />
        <StatCard label="Total Students" value={stats.totalStudents} color="purple" />
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative min-w-0 flex-1 sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-surface-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search schools"
            className="w-full rounded-lg border border-surface-200 bg-white py-2.5 pl-10 pr-4 text-sm font-medium outline-none transition focus:border-brand-300 focus:ring-4 focus:ring-brand-100"
          />
        </div>
        <select value={boardFilter} onChange={(e) => setBoardFilter(e.target.value)} className="rounded-lg border border-surface-200 bg-white px-3 py-2.5 text-sm font-medium outline-none focus:border-brand-300 focus:ring-4 focus:ring-brand-100">
          <option value="">All Boards</option>
          <option value="CBSE">CBSE</option>
          <option value="ICSE">ICSE</option>
          <option value="State Board">State Board</option>
          <option value="IB">IB</option>
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="rounded-lg border border-surface-200 bg-white px-3 py-2.5 text-sm font-medium outline-none focus:border-brand-300 focus:ring-4 focus:ring-brand-100">
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="trial">Trial</option>
          <option value="suspended">Suspended</option>
        </select>
      </div>

      <div className="glass-panel overflow-hidden rounded-lg shadow-soft">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-surface-50 text-xs font-bold uppercase text-surface-500">
                <th className="p-4 pl-5">School</th>
                <th className="p-4">Board</th>
                <th className="p-4">Contact</th>
                <th className="p-4">Tenant</th>
                <th className="p-4">Students</th>
                <th className="p-4">Status</th>
                <th className="p-4">AI</th>
                <th className="p-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, index) => (
                  <tr key={index} className="border-t border-surface-100">
                    <td className="p-4 pl-5"><Skeleton className="h-11 w-52" /></td>
                    <td className="p-4"><Skeleton className="h-8 w-40" /></td>
                    <td className="p-4"><Skeleton className="h-8 w-36" /></td>
                    <td className="p-4"><Skeleton className="h-8 w-12" /></td>
                    <td className="p-4"><Skeleton className="h-8 w-12" /></td>
                    <td className="p-4"><Skeleton className="ml-auto h-8 w-20" /></td>
                  </tr>
                ))
              ) : filteredList.length === 0 ? (
                <tr>
                  <td colSpan="8" className="p-10 text-center text-sm font-semibold text-surface-500">
                    No institutes match this view.
                  </td>
                </tr>
              ) : (
                filteredList.map((item) => (
                  <tr key={item.id} onClick={() => { setSelectedInstitute(item); setEditMode(false); }} className="cursor-pointer border-t border-surface-100 transition hover:bg-surface-50">
                    <td className="p-4 pl-5">
                      <div className="flex items-center gap-3">
                        <InstituteLogo institute={item} size="md" />
                        <div>
                          <p className="font-bold text-surface-950">{item.name}</p>
                          <p className="text-xs font-medium text-surface-500">{item.city || 'No city'}, {item.state || 'No state'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <BoardBadge board={item.board} />
                    </td>
                    <td className="p-4">
                      <p className="text-sm font-semibold text-surface-700">{item.email}</p>
                      <p className="text-xs font-medium text-surface-500">{item.phone || 'No phone'}</p>
                    </td>
                    <td className="p-4 font-mono text-sm font-bold text-brand-700">{item.tenantDomain}.localhost</td>
                    <td className="p-4 text-sm font-bold text-surface-700">
                      {item.totalStudents || item.total_students || item._count?.users || 0}
                    </td>
                    <td className="p-4">
                      <StatusBadgeCustom status={item.status} isSuspended={item.isSuspended} />
                    </td>
                    <td className="p-4">
                      {item.aiEnabled ? (
                        <span className="flex items-center gap-1 text-xs text-blue-600 font-medium">
                          <Sparkles className="w-3 h-3"/>
                          AI On
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">No AI</span>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={(event) => {
                            event.stopPropagation();
                            openEdit(item);
                          }}
                          className="inline-flex items-center gap-2 rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-2 text-xs font-bold text-indigo-700 hover:bg-indigo-100 transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={(event) => {
                            event.stopPropagation();
                            setSelectedInstitute(item);
                            setEditMode(false);
                          }}
                          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:border-indigo-300 hover:text-indigo-700 transition-colors"
                        >
                          View
                        </button>
                        {item.status?.toLowerCase() === 'suspended' || item.isSuspended ? (
                          <button
                            onClick={(event) => {
                              event.stopPropagation();
                              handleReactivate(item.id);
                            }}
                            className="text-green-600 text-xs font-bold hover:underline"
                          >
                            Reactivate
                          </button>
                        ) : (
                          <button
                            onClick={(event) => {
                              event.stopPropagation();
                              handleSuspend(item.id);
                            }}
                            className="text-amber-600 text-xs font-bold hover:underline"
                          >
                            Suspend
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AnimatePresence>
        {selectedInstitute && (
          <>
            <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedInstitute(null)} className="fixed inset-0 z-40 bg-surface-950/40 backdrop-blur-sm" aria-label="Close institute details" />
            <motion.aside
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', bounce: 0, duration: 0.36 }}
              className="fixed right-0 top-0 z-50 flex h-full w-full max-w-lg flex-col border-l border-surface-200 bg-white shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-surface-200 p-5">
                <h2 className="font-display text-xl font-bold text-surface-950">Institute Details</h2>
                <div className="flex items-center gap-2">
                  <button onClick={() => { setEditForm(toEditForm(selectedInstitute)); setEditMode((value) => !value); }} className="rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-2 text-xs font-bold text-indigo-700 hover:bg-indigo-100 transition-colors">
                    {editMode ? 'View Profile' : 'Edit Institute'}
                  </button>
                  <button onClick={() => setSelectedInstitute(null)} className="rounded-lg p-2 text-surface-500 hover:bg-surface-100">
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6">
                <div className="mb-8 flex items-center gap-4">
                  <InstituteLogo institute={selectedInstitute} size="lg" />
                  <div className="min-w-0">
                    <h3 className="font-display text-2xl font-bold text-surface-950">{selectedInstitute.name}</h3>
                  </div>
                </div>

                {editMode ? (
                  <form className="space-y-5" onSubmit={saveInstitute}>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <input className={inputClass} value={editForm.instituteName} onChange={(e) => setEditForm({ ...editForm, instituteName: e.target.value })} placeholder="School name" />
                      <input className={inputClass} value={editForm.principalName} onChange={(e) => setEditForm({ ...editForm, principalName: e.target.value })} placeholder="Principal name" />
                      
                      <select className={inputClass} value={editForm.schoolType} onChange={(e) => setEditForm({ ...editForm, schoolType: e.target.value })}>
                        <option value="">Select School Type</option>
                        <option value="Primary">Primary</option>
                        <option value="Secondary">Secondary</option>
                        <option value="Senior Secondary">Senior Secondary</option>
                        <option value="K-12">K-12</option>
                      </select>
                      <select className={inputClass} value={editForm.board} onChange={(e) => setEditForm({ ...editForm, board: e.target.value })}>
                        <option value="">Select Board</option>
                        <option value="CBSE">CBSE</option>
                        <option value="ICSE">ICSE</option>
                        <option value="State Board">State Board</option>
                        <option value="IB">IB</option>
                      </select>
                      <input className={inputClass} type="number" value={editForm.establishedYear} onChange={(e) => setEditForm({ ...editForm, establishedYear: e.target.value })} placeholder="Established year" />

                      <input className={inputClass} value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} placeholder="Institute email" />
                      <input className={inputClass} value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} placeholder="Phone number" />
                      <input className={inputClass} value={editForm.alternatePhone} onChange={(e) => setEditForm({ ...editForm, alternatePhone: e.target.value })} placeholder="Alternate number" />
                      <input className={inputClass} value={editForm.website} onChange={(e) => setEditForm({ ...editForm, website: e.target.value })} placeholder="Website" />
                      <input className={inputClass} value={editForm.tenantDomain} onChange={(e) => setEditForm({ ...editForm, tenantDomain: e.target.value })} placeholder="Subdomain" />
                      
                      <input className={inputClass} value={editForm.affiliationNo} onChange={(e) => setEditForm({ ...editForm, affiliationNo: e.target.value })} placeholder="Affiliation no." />
                      <input className={inputClass} value={editForm.totalClasses} onChange={(e) => setEditForm({ ...editForm, totalClasses: e.target.value })} placeholder="Total classes (e.g. 1-10)" />
                      <input className={inputClass} type="number" value={editForm.totalStudents} onChange={(e) => setEditForm({ ...editForm, totalStudents: e.target.value })} placeholder="Total students (approx)" />
                      <input className={inputClass} type="number" value={editForm.totalTeachers} onChange={(e) => setEditForm({ ...editForm, totalTeachers: e.target.value })} placeholder="Total teachers (approx)" />
                      
                      <input className={inputClass} value={editForm.academicSession} onChange={(e) => setEditForm({ ...editForm, academicSession: e.target.value })} placeholder="Academic session" />
                      <input className={inputClass} value={editForm.timezone} onChange={(e) => setEditForm({ ...editForm, timezone: e.target.value })} placeholder="Timezone" />
                      <input className={inputClass} value={editForm.language} onChange={(e) => setEditForm({ ...editForm, language: e.target.value })} placeholder="Language" />
                      <input className={inputClass} value={editForm.currency} onChange={(e) => setEditForm({ ...editForm, currency: e.target.value })} placeholder="Currency" />
                      <input className={inputClass} value={editForm.adminEmail} onChange={(e) => setEditForm({ ...editForm, adminEmail: e.target.value })} placeholder="Admin email" />
                      <input className={inputClass} value={editForm.adminName} onChange={(e) => setEditForm({ ...editForm, adminName: e.target.value })} placeholder="Admin name" />
                      <input className={inputClass} type="password" value={editForm.adminPassword} onChange={(e) => setEditForm({ ...editForm, adminPassword: e.target.value })} placeholder="Reset admin password" />
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <input className={inputClass} value={editForm.plotNo} onChange={(e) => setEditForm({ ...editForm, plotNo: e.target.value })} placeholder="Plot no." />
                      <input className={inputClass} value={editForm.streetName} onChange={(e) => setEditForm({ ...editForm, streetName: e.target.value })} placeholder="Street name" />
                      <input className={inputClass} value={editForm.landMark} onChange={(e) => setEditForm({ ...editForm, landMark: e.target.value })} placeholder="Landmark" />
                      <input className={inputClass} value={editForm.city} onChange={(e) => setEditForm({ ...editForm, city: e.target.value })} placeholder="City" />
                      <input className={inputClass} value={editForm.district} onChange={(e) => setEditForm({ ...editForm, district: e.target.value })} placeholder="District" />
                      <input className={inputClass} value={editForm.state} onChange={(e) => setEditForm({ ...editForm, state: e.target.value })} placeholder="State" />
                      <input className={inputClass} value={editForm.pinCode} onChange={(e) => setEditForm({ ...editForm, pinCode: e.target.value })} placeholder="PIN code" />
                    </div>

                    <div className="rounded-lg border border-surface-200 bg-surface-50 p-4">
                      <p className="mb-3 text-xs font-bold uppercase text-surface-500">Assigned Modules & Permissions</p>
                      <div className="flex flex-wrap gap-2">
                        {moduleOptions.map(([key, label]) => {
                          const active = !!editForm.modulesPermissions?.[key];
                          return (
                            <button key={key} type="button" onClick={() => toggleModulePermission(key)} className={`rounded-full border px-3 py-2 text-xs font-bold transition ${active ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-slate-200 bg-white text-slate-600 hover:border-indigo-300 hover:text-indigo-700'}`}>
                              {label}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-dashed border-brand-200 bg-brand-50 p-4 text-sm font-semibold text-brand-700">
                      <input type="file" accept="image/*" className="hidden" onChange={async (event) => {
                        try {
                          const logo = await readLogoFile(event.target.files?.[0]);
                          setEditForm((prev) => ({ ...prev, logo: logo || '' }));
                          setError('');
                        } catch (err) {
                          setError(err.message);
                          toast.error(err.message);
                        }
                      }} />
                      <UploadCloud className="h-5 w-5" />
                      Upload or replace logo
                    </label>

                    <div className="flex items-center justify-between border-t border-surface-200 pt-5">
                      <button
                        type="button"
                        onClick={() => deleteInstitute(selectedInstitute.id)}
                        className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-bold text-red-700 hover:bg-red-100 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" /> Delete School
                      </button>
                      <button className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white shadow-md hover:bg-indigo-700 transition-colors disabled:opacity-60">
                        {saving ? 'Saving...' : 'Save Changes'}
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="space-y-5">
                    <div className="border border-surface-200 rounded-xl p-4 space-y-3 bg-surface-50">
                      <p className="text-xs font-semibold text-surface-500 uppercase tracking-wide">
                        School Info
                      </p>
                      <div className="grid grid-cols-2 gap-3">
                        {selectedInstitute.board && (
                          <div>
                            <p className="text-xs text-surface-400">Board</p>
                            <p className="text-sm font-medium text-surface-800">{selectedInstitute.board}</p>
                          </div>
                        )}
                        {selectedInstitute.schoolType && (
                          <div>
                            <p className="text-xs text-surface-400">Type</p>
                            <p className="text-sm font-medium text-surface-800">{selectedInstitute.schoolType}</p>
                          </div>
                        )}
                        {selectedInstitute.affiliationNo && (
                          <div>
                            <p className="text-xs text-surface-400">Affiliation No.</p>
                            <p className="text-sm font-medium text-surface-800">{selectedInstitute.affiliationNo}</p>
                          </div>
                        )}
                        {selectedInstitute.establishedYear && (
                          <div>
                            <p className="text-xs text-surface-400">Established</p>
                            <p className="text-sm font-medium text-surface-800">{selectedInstitute.establishedYear}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="border border-surface-200 rounded-xl p-4 bg-surface-50">
                      <p className="text-xs font-semibold text-surface-500 uppercase tracking-wide mb-3">
                        Stats
                      </p>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-white rounded-lg p-3 text-center border border-surface-100">
                          <p className="text-xl font-bold text-surface-800">{selectedInstitute.totalStudents || selectedInstitute.total_students || selectedInstitute._count?.users || 0}</p>
                          <p className="text-xs text-surface-500">Students</p>
                        </div>
                        <div className="bg-white rounded-lg p-3 text-center border border-surface-100">
                          <p className="text-xl font-bold text-surface-800">{selectedInstitute.totalTeachers || selectedInstitute.total_teachers || 0}</p>
                          <p className="text-xs text-surface-500">Teachers</p>
                        </div>
                        <div className="bg-white rounded-lg p-3 text-center border border-surface-100">
                          <p className="text-xl font-bold text-surface-800">{selectedInstitute.totalClasses || selectedInstitute.total_classes || 0}</p>
                          <p className="text-xs text-surface-500">Classes</p>
                        </div>
                        <div className="bg-white rounded-lg p-3 text-center border border-surface-100">
                          <p className="text-xl font-bold text-surface-800">
                            {selectedInstitute.createdAt
                              ? new Date(selectedInstitute.createdAt).toLocaleDateString('en-IN', {
                                  month: 'short', year: 'numeric'
                                })
                              : '—'}
                          </p>
                          <p className="text-xs text-surface-500">Joined</p>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-xl border border-surface-200 bg-surface-50 p-4">
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-xs font-bold uppercase text-surface-500">Contact</p>
                        {selectedInstitute.isSuspended || selectedInstitute.status?.toLowerCase() === 'suspended' ? (
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-red-500"/>
                            <span className="text-sm text-red-600 font-medium">Suspended</span>
                            {selectedInstitute.suspensionReason && (
                              <span className="text-xs text-red-400">
                                — {selectedInstitute.suspensionReason}
                              </span>
                            )}
                          </div>
                        ) : selectedInstitute.status?.toLowerCase() === 'trial' ? (
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-amber-500"/>
                            <span className="text-sm text-amber-600 font-medium">Trial</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-green-500"/>
                            <span className="text-sm text-green-600 font-medium">Active</span>
                          </div>
                        )}
                      </div>
                      <div className="space-y-3 text-sm font-medium text-surface-700">
                        <p className="flex items-center gap-3"><Mail className="h-4 w-4 text-brand-600" /> {selectedInstitute.email}</p>
                        <p className="flex items-center gap-3"><ShieldCheck className="h-4 w-4 text-brand-600" /> {selectedInstitute.principalName || 'Principal not provided'}</p>
                      </div>
                    </div>

                    <div className="rounded-xl border border-surface-200 bg-surface-50 p-4">
                      <p className="mb-3 text-xs font-bold uppercase text-surface-500">Location</p>
                      <p className="flex gap-3 text-sm font-medium leading-6 text-surface-700">
                        <MapPin className="mt-1 h-4 w-4 flex-shrink-0 text-brand-600" />
                        <span>
                          {[selectedInstitute.plotNo, selectedInstitute.streetName, selectedInstitute.landMark, selectedInstitute.city, selectedInstitute.district, selectedInstitute.state, selectedInstitute.pinCode]
                            .filter(Boolean)
                            .join(', ') || 'Address not provided'}
                        </span>
                      </p>
                    </div>

                    <div className="rounded-xl border border-brand-100 bg-brand-50 p-4">
                      <p className="text-xs font-bold uppercase text-brand-700">Tenant Workspace</p>
                      <p className="mt-1 font-mono text-sm font-bold text-surface-950">{selectedInstitute.tenantDomain}.localhost:8080</p>
                    </div>

                    <div className="rounded-xl border border-surface-200 bg-surface-50 p-4">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="font-display text-sm font-bold text-surface-950">AI Features</h3>
                          <p className="text-xs text-surface-500">Control AI capabilities for this school</p>
                        </div>
                        <Toggle
                          enabled={panelAiEnabled}
                          onChange={setPanelAiEnabled}
                        />
                      </div>

                      {panelAiEnabled && (
                        <div className="space-y-2 border-t border-surface-200 pt-4 mt-2">
                          {AI_FEATURES.map((feature) => {
                            const IconComp = AiIconMap[feature.icon] || Sparkles;
                            return (
                              <div key={feature.key} className="flex items-center justify-between py-2">
                                <div className="flex items-center gap-3">
                                  <div className={`p-1.5 rounded-lg ${panelAiFeatures?.[feature.key] ? 'bg-blue-100 text-blue-600' : 'bg-surface-200 text-surface-400'}`}>
                                    <IconComp className="w-4 h-4" />
                                  </div>
                                  <div>
                                    <p className={`text-sm font-medium ${panelAiFeatures?.[feature.key] ? 'text-surface-800' : 'text-surface-400'}`}>{feature.label}</p>
                                    <p className="text-xs text-surface-400">{feature.description}</p>
                                  </div>
                                </div>
                                <Toggle
                                  enabled={panelAiFeatures?.[feature.key] ?? false}
                                  onChange={(val) => setPanelAiFeatures({ ...panelAiFeatures, [feature.key]: val })}
                                  size="sm"
                                />
                              </div>
                            );
                          })}
                        </div>
                      )}
                      
                      <button
                        type="button"
                        onClick={saveAiSettings}
                        disabled={savingAi}
                        className="w-full mt-4 py-2 px-4 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                      >
                        {savingAi ? 'Saving...' : 'Save AI Settings'}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="grid gap-3 border-t border-surface-200 bg-surface-50 p-5 sm:grid-cols-1">
                {!editMode && selectedInstitute && (
                  <div className="border border-red-100 rounded-xl p-4 bg-white mb-2">
                    <p className="text-xs font-semibold text-red-400 uppercase tracking-wide mb-3">
                      Danger Zone
                    </p>
                    <div className="flex gap-2">
                      {selectedInstitute.isSuspended || selectedInstitute.status?.toLowerCase() === 'suspended' ? (
                        <button
                          onClick={() => { handleReactivate(selectedInstitute.id); setSelectedInstitute(null); }}
                          className="flex-1 py-2 px-3 rounded-lg border border-green-300 text-green-700 text-sm font-medium hover:bg-green-50 transition-colors"
                        >
                          Reactivate School
                        </button>
                      ) : (
                        <button
                          onClick={() => { handleSuspend(selectedInstitute.id); setSelectedInstitute(null); }}
                          className="flex-1 py-2 px-3 rounded-lg border border-amber-300 text-amber-700 text-sm font-medium hover:bg-amber-50 transition-colors"
                        >
                          Suspend School
                        </button>
                      )}
                      <button
                        onClick={() => deleteInstitute(selectedInstitute.id)}
                        className="flex-1 py-2 px-3 rounded-lg border border-red-300 text-red-700 text-sm font-medium hover:bg-red-50 transition-colors"
                      >
                        Delete School
                      </button>
                    </div>
                  </div>
                )}
                <button onClick={() => openWorkspace(selectedInstitute.tenantDomain)} className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-3 font-bold text-white shadow-md hover:bg-indigo-700 transition-colors">
                  Open Workspace
                  <ExternalLink className="h-5 w-5" />
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {createOpen && (
          <>
            <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setCreateOpen(false)} className="fixed inset-0 z-40 bg-surface-950/40 backdrop-blur-sm" aria-label="Close create institute" />
            <motion.div initial={{ opacity: 0, scale: 0.96, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96, y: 16 }} className="fixed inset-x-4 top-6 z-50 mx-auto max-h-[calc(100vh-3rem)] max-w-6xl overflow-y-auto rounded-lg border border-surface-200 bg-white shadow-2xl">
              <form onSubmit={createInstitute}>
                <div className="flex items-center justify-between border-b border-surface-200 p-5">
                  <div>
                    <h2 className="font-display text-xl font-bold text-surface-950">Create School</h2>
                    <p className="text-sm font-medium text-surface-500">Super Admin-created schools are approved automatically.</p>
                  </div>
                  <button type="button" onClick={() => setCreateOpen(false)} className="rounded-lg p-2 text-surface-500 hover:bg-surface-100">
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="grid gap-6 p-5 lg:grid-cols-[180px_1fr]">
                  <div>
                    <div className="rounded-lg border border-surface-200 bg-surface-50 p-5 text-center">
                      <InstituteLogo institute={{ name: createForm.instituteName, logo: createForm.logo }} size="lg" className="mx-auto" />
                      <label className="mt-4 inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-white px-3 py-2 text-xs font-bold text-brand-700 shadow-sm">
                        <input type="file" accept="image/*" className="hidden" onChange={handleLogo} />
                        <ImagePlus className="h-4 w-4" />
                        Logo
                      </label>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <input required className={inputClass} name="instituteName" value={createForm.instituteName} onChange={(e) => setCreateForm({ ...createForm, instituteName: e.target.value })} placeholder="School name" />
                      <div className="relative">
                        <input required className={inputClass + ' pr-24'} name="tenantDomain" value={createForm.tenantDomain} onChange={(e) => setCreateForm({ ...createForm, tenantDomain: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })} placeholder="Subdomain" />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">.localhost</span>
                      </div>
                      
                      <select className={inputClass} value={createForm.schoolType} onChange={(e) => setCreateForm({ ...createForm, schoolType: e.target.value })}>
                        <option value="">Select School Type</option>
                        <option value="Primary">Primary</option>
                        <option value="Secondary">Secondary</option>
                        <option value="Senior Secondary">Senior Secondary</option>
                        <option value="K-12">K-12</option>
                      </select>
                      <select className={inputClass} value={createForm.board} onChange={(e) => setCreateForm({ ...createForm, board: e.target.value })}>
                        <option value="">Select Board</option>
                        <option value="CBSE">CBSE</option>
                        <option value="ICSE">ICSE</option>
                        <option value="State Board">State Board</option>
                        <option value="IB">IB</option>
                      </select>
                      <input className={inputClass} type="number" value={createForm.establishedYear} onChange={(e) => setCreateForm({ ...createForm, establishedYear: e.target.value })} placeholder="Established year" />

                      <input required className={inputClass} name="principalName" value={createForm.principalName} onChange={(e) => setCreateForm({ ...createForm, principalName: e.target.value })} placeholder="Principal name" />
                      <input required className={inputClass} name="email" type="email" value={createForm.email} onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })} placeholder="Admin email" />
                      {/* Temporary Password with show/hide */}
                      <div className="relative">
                        <input
                          required
                          name="adminPassword"
                          type={showPassword ? 'text' : 'password'}
                          value={createForm.adminPassword}
                          onChange={(e) => setCreateForm({ ...createForm, adminPassword: e.target.value })}
                          placeholder="Temporary password"
                          className={inputClass + ' pr-10'}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword((v) => !v)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition-colors"
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                      {/* Confirm Password with match indicator */}
                      <div className="relative">
                        <input
                          required
                          name="confirmPassword"
                          type={showConfirmPassword ? 'text' : 'password'}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Confirm password"
                          className={`${inputClass} pr-10 ${confirmPassword.length > 0
                              ? createForm.adminPassword === confirmPassword
                                ? 'border-emerald-400 focus:border-emerald-400 focus:ring-emerald-100'
                                : 'border-red-400 focus:border-red-400 focus:ring-red-100'
                              : ''
                            }`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword((v) => !v)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition-colors"
                        >
                          {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                      {confirmPassword.length > 0 && (
                        <p className={`text-xs font-semibold flex items-center gap-1.5 col-span-2 -mt-2 ${createForm.adminPassword === confirmPassword ? 'text-emerald-600' : 'text-red-500'
                          }`}>
                          {createForm.adminPassword === confirmPassword
                            ? <><CheckCircle className="h-3.5 w-3.5" /> Passwords match</>
                            : <><XCircle className="h-3.5 w-3.5" /> Passwords do not match</>
                          }
                        </p>
                      )}
                      <input className={inputClass} name="phone" value={createForm.phone} onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })} placeholder="Phone" />
                      <input className={inputClass} name="registrationNo" value={createForm.registrationNo} onChange={(e) => setCreateForm({ ...createForm, registrationNo: e.target.value })} placeholder="Registration no. (UDISE code)" />
                      
                      <input className={inputClass} value={createForm.affiliationNo} onChange={(e) => setCreateForm({ ...createForm, affiliationNo: e.target.value })} placeholder="Affiliation no." />
                      <input className={inputClass} value={createForm.totalClasses} onChange={(e) => setCreateForm({ ...createForm, totalClasses: e.target.value })} placeholder="Total classes (e.g. 1-10)" />
                      <input className={inputClass} type="number" value={createForm.totalStudents} onChange={(e) => setCreateForm({ ...createForm, totalStudents: e.target.value })} placeholder="Total students (approx)" />
                      <input className={inputClass} type="number" value={createForm.totalTeachers} onChange={(e) => setCreateForm({ ...createForm, totalTeachers: e.target.value })} placeholder="Total teachers (approx)" />
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <input className={inputClass} name="plotNo" value={createForm.plotNo} onChange={(e) => setCreateForm({ ...createForm, plotNo: e.target.value })} placeholder="Plot no." />
                      <input className={inputClass} name="streetName" value={createForm.streetName} onChange={(e) => setCreateForm({ ...createForm, streetName: e.target.value })} placeholder="Street name" />
                      <input className={inputClass} name="city" value={createForm.city} onChange={(e) => setCreateForm({ ...createForm, city: e.target.value })} placeholder="City" />
                      <input className={inputClass} name="district" value={createForm.district} onChange={(e) => setCreateForm({ ...createForm, district: e.target.value })} placeholder="District" />
                      <input className={inputClass} name="state" value={createForm.state} onChange={(e) => setCreateForm({ ...createForm, state: e.target.value })} placeholder="State" />
                      <input className={inputClass} name="pinCode" value={createForm.pinCode} onChange={(e) => setCreateForm({ ...createForm, pinCode: e.target.value })} placeholder="PIN Code" />
                    </div>

                    <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-dashed border-brand-200 bg-brand-50 p-4 text-sm font-semibold text-brand-700">
                      <input type="file" accept="image/*" className="hidden" onChange={handleLogo} />
                      <UploadCloud className="h-5 w-5" />
                      Upload or replace logo
                    </label>

                    <div className="rounded-xl border border-surface-200 bg-surface-50 p-5 mt-4">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="font-display text-sm font-bold text-surface-950">AI Features</h3>
                          <p className="text-xs text-surface-500">Control which AI features this school can access</p>
                        </div>
                        <Toggle
                          enabled={createForm.aiEnabled}
                          onChange={(val) => setCreateForm({ ...createForm, aiEnabled: val })}
                        />
                      </div>

                      {createForm.aiEnabled && (
                        <div className="space-y-2 border-t border-surface-200 pt-4 mt-2">
                          {AI_FEATURES.map((feature) => {
                            const IconComp = AiIconMap[feature.icon] || Sparkles;
                            return (
                              <div key={feature.key} className="flex items-center justify-between py-2">
                                <div className="flex items-center gap-3">
                                  <div className={`p-1.5 rounded-lg ${createForm.aiFeatures?.[feature.key] ? 'bg-blue-100 text-blue-600' : 'bg-surface-200 text-surface-400'}`}>
                                    <IconComp className="w-4 h-4" />
                                  </div>
                                  <div>
                                    <p className={`text-sm font-medium ${createForm.aiFeatures?.[feature.key] ? 'text-surface-800' : 'text-surface-400'}`}>{feature.label}</p>
                                    <p className="text-xs text-surface-400">{feature.description}</p>
                                  </div>
                                </div>
                                <Toggle
                                  enabled={createForm.aiFeatures?.[feature.key] ?? false}
                                  onChange={(val) => setCreateForm({ ...createForm, aiFeatures: { ...createForm.aiFeatures, [feature.key]: val } })}
                                  size="sm"
                                />
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-3 border-t border-surface-200 bg-surface-50 p-5">
                  <button type="button" onClick={() => setCreateOpen(false)} className="rounded-lg border border-surface-200 bg-white px-4 py-2.5 text-sm font-bold text-surface-700 hover:bg-surface-100">
                    Cancel
                  </button>
                  <button disabled={saving} className="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white shadow-md hover:bg-indigo-700 transition-colors disabled:opacity-60">
                    {saving ? 'Creating...' : 'Create and Approve'}
                  </button>
                </div>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
