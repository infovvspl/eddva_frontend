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
} from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api/school-client';
import { apiClient } from '@/lib/api/client';
import { InstituteLogo, StatusBadge } from '@/components/school/admin/Brand';
import { Skeleton } from '@/components/school/admin/Skeleton';
import { formatTenantUrl } from '@/lib/school/tenantRedirect';

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
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
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
        modulesPermissions: item.modulesPermissions || item.modules_permissions,
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
    const term = search.trim().toLowerCase();
    if (!term) return list;
    return list.filter((item) =>
      [item.name, item.email, item.tenantDomain, item.city, item.state].some((value) => String(value || '').toLowerCase().includes(term))
    );
  }, [list, search]);

  const stats = {
    total: list.length,
    active: list.filter((item) => item.status === 'ACTIVE').length,
    pending: list.filter((item) => item.status === 'PENDING').length,
    suspended: list.filter((item) => item.status === 'SUSPENDED').length,
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

  async function deleteInstitute(instituteId) {
    if (!window.confirm("Are you sure you want to permanently delete this institute? This action cannot be undone.")) return;
    try {
      setSaving(true);
      await api.delete(`/institutes/${instituteId}`);
      toast.success("Institute deleted successfully");
      dispatchDataChanged('institutes');
      if (selectedInstitute?.id === instituteId) {
        setSelectedInstitute(null);
      }
      await loadInstitutes();
    } catch (err) {
      const message = err.response?.data?.message || err.response?.data?.error || 'Unable to delete institute.';
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

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-surface-950">Institute Management</h1>
          <p className="mt-2 text-sm font-medium text-surface-500">Approve registrations, create internal institutes, and open tenant workspaces.</p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative min-w-0 sm:w-72">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-surface-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && loadInstitutes()}
              placeholder="Search institutes"
              className="w-full rounded-lg border border-surface-200 bg-white py-2.5 pl-10 pr-4 text-sm font-medium outline-none transition focus:border-brand-300 focus:ring-4 focus:ring-brand-100"
            />
          </div>
          <button onClick={() => setCreateOpen(true)} className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white shadow-lg hover:bg-indigo-700 transition-colors">
            <Plus className="h-4 w-4" />
            Add Institute
          </button>
        </div>
      </div>

      {error && <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">{error}</div>}

      <div className="grid gap-3 sm:grid-cols-1 xl:grid-cols-4">
        <div className="rounded-lg border border-brand-300 bg-brand-50 text-brand-800 shadow-sm p-4 text-left">
          <p className="text-sm font-bold">All Institutes</p>
          <p className="mt-1 font-display text-3xl font-bold">{stats.total}</p>
        </div>
      </div>

      <div className="glass-panel overflow-hidden rounded-lg shadow-soft">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-surface-50 text-xs font-bold uppercase text-surface-500">
                <th className="p-4 pl-5">Institute</th>
                <th className="p-4">Contact</th>
                <th className="p-4">Tenant</th>
                <th className="p-4">Users</th>
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
                    <td className="p-4"><Skeleton className="ml-auto h-8 w-20" /></td>
                  </tr>
                ))
              ) : filteredList.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-10 text-center text-sm font-semibold text-surface-500">
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
                      <p className="text-sm font-semibold text-surface-700">{item.email}</p>
                      <p className="text-xs font-medium text-surface-500">{item.phone || 'No phone'}</p>
                    </td>
                    <td className="p-4 font-mono text-sm font-bold text-brand-700">{item.tenantDomain}.localhost</td>
                    <td className="p-4 text-sm font-bold text-surface-700">{item._count?.users || 0}</td>
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
                        <button
                          onClick={(event) => {
                            event.stopPropagation();
                            deleteInstitute(item.id);
                          }}
                          className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold text-red-700 hover:bg-red-100 transition-colors"
                        >
                          <Trash2 className="h-3 w-3" /> Delete
                        </button>
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
                      <input className={inputClass} value={editForm.instituteName} onChange={(e) => setEditForm({ ...editForm, instituteName: e.target.value })} placeholder="Institute name" />
                      <input className={inputClass} value={editForm.principalName} onChange={(e) => setEditForm({ ...editForm, principalName: e.target.value })} placeholder="Admin / Principal name" />
                      <input className={inputClass} value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} placeholder="Institute email" />
                      <input className={inputClass} value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} placeholder="Phone number" />
                      <input className={inputClass} value={editForm.alternatePhone} onChange={(e) => setEditForm({ ...editForm, alternatePhone: e.target.value })} placeholder="Alternate number" />
                      <input className={inputClass} value={editForm.website} onChange={(e) => setEditForm({ ...editForm, website: e.target.value })} placeholder="Website" />
                      <input className={inputClass} value={editForm.tenantDomain} onChange={(e) => setEditForm({ ...editForm, tenantDomain: e.target.value })} placeholder="Subdomain" />
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

                    <div className="flex gap-3 pt-2">
                      <button type="button" onClick={() => setEditMode(false)} className="rounded-lg border border-surface-200 bg-white px-4 py-2.5 text-sm font-bold text-surface-700 hover:bg-surface-100">
                        Cancel
                      </button>
                      <button disabled={saving} className="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white shadow-md hover:bg-indigo-700 transition-colors disabled:opacity-60">
                        {saving ? 'Saving...' : 'Save Changes'}
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="space-y-5">
                    <div className="rounded-lg border border-surface-200 bg-surface-50 p-4">
                      <p className="mb-3 text-xs font-bold uppercase text-surface-500">Contact</p>
                      <div className="space-y-3 text-sm font-medium text-surface-700">
                        <p className="flex items-center gap-3"><Mail className="h-4 w-4 text-brand-600" /> {selectedInstitute.email}</p>
                        <p className="flex items-center gap-3"><ShieldCheck className="h-4 w-4 text-brand-600" /> {selectedInstitute.principalName || 'Principal not provided'}</p>
                      </div>
                    </div>

                    <div className="rounded-lg border border-surface-200 bg-surface-50 p-4">
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

                    <div className="rounded-lg border border-brand-100 bg-brand-50 p-4">
                      <p className="text-xs font-bold uppercase text-brand-700">Tenant Workspace</p>
                      <p className="mt-1 font-mono text-sm font-bold text-surface-950">{selectedInstitute.tenantDomain}.localhost:8080</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="grid gap-3 border-t border-surface-200 bg-surface-50 p-5 sm:grid-cols-1">
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
            <motion.div initial={{ opacity: 0, scale: 0.96, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96, y: 16 }} className="fixed inset-x-4 top-6 z-50 mx-auto max-h-[calc(100vh-3rem)] max-w-4xl overflow-y-auto rounded-lg border border-surface-200 bg-white shadow-2xl">
              <form onSubmit={createInstitute}>
                <div className="flex items-center justify-between border-b border-surface-200 p-5">
                  <div>
                    <h2 className="font-display text-xl font-bold text-surface-950">Create Institute</h2>
                    <p className="text-sm font-medium text-surface-500">Super Admin-created institutes are approved automatically.</p>
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
                      <input required className={inputClass} name="instituteName" value={createForm.instituteName} onChange={(e) => setCreateForm({ ...createForm, instituteName: e.target.value })} placeholder="Institute name" />
                      <div className="relative">
                        <input required className={inputClass + ' pr-24'} name="tenantDomain" value={createForm.tenantDomain} onChange={(e) => setCreateForm({ ...createForm, tenantDomain: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })} placeholder="Subdomain" />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">.localhost</span>
                      </div>
                      <input required className={inputClass} name="principalName" value={createForm.principalName} onChange={(e) => setCreateForm({ ...createForm, principalName: e.target.value })} placeholder="Principal / Admin name" />
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
                      <input className={inputClass} name="registrationNo" value={createForm.registrationNo} onChange={(e) => setCreateForm({ ...createForm, registrationNo: e.target.value })} placeholder="Registration no." />
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
