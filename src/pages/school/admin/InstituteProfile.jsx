import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/SchoolAuthContext';
import { SchoolLogo, StatusBadge } from '@/components/school/admin/Brand';
import api from '@/lib/api/school-client';
import { toast } from 'sonner';
import { CustomSelect } from "@/components/ui/CustomSelect";
import {
  Building2,
  Mail,
  Phone,
  MapPin,
  Globe,
  Award,
  Users,
  GraduationCap,
  BookOpen,
  Calendar,
  CheckCircle2,
  Copy,
  ExternalLink,
  Edit3,
  Save,
  X,
  ShieldCheck,
  Zap,
  Sparkles,
  School,
  FileText,
  Clock
} from 'lucide-react';

export default function InstituteProfile() {
  const { user, institute: authInstitute } = useAuth();
  const [institute, setInstitute] = useState(authInstitute || {});
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('general');
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 640);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Stats counter state
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalTeachers: 0,
    totalClasses: 0,
    attendanceRate: '96%',
  });

  // Edit form state
  const [formData, setFormData] = useState({
    name: authInstitute?.name || '',
    email: authInstitute?.email || '',
    phone: authInstitute?.phone || '',
    address: authInstitute?.address || '',
    city: authInstitute?.city || '',
    state: authInstitute?.state || '',
    pinCode: authInstitute?.pinCode || authInstitute?.pin_code || '',
    board: authInstitute?.board || 'CBSE',
    principalName: authInstitute?.principalName || authInstitute?.principal_name || 'Dr. S. K. Sharma',
    code: authInstitute?.code || `SCH-${(authInstitute?.id || '001').slice(0, 6).toUpperCase()}`,
    website: authInstitute?.website || `https://${authInstitute?.tenantDomain || 'eddva'}.eddva.com`,
    tagline: authInstitute?.tagline || 'Excellence in Education & Holistic Development',
  });

  const instituteId = user?.instituteId || authInstitute?.id;

  const fetchInstituteDetail = async () => {
    if (!instituteId) return;
    try {
      setLoading(true);
      const res = await api.get(`/institutes/${instituteId}`);
      const data = res.data?.data ?? res.data ?? {};
      if (data && (data.name || data.id)) {
        setInstitute(data);
        setFormData({
          name: data.name || authInstitute?.name || '',
          email: data.email || authInstitute?.email || '',
          phone: data.phone || authInstitute?.phone || '',
          address: data.address || authInstitute?.address || '',
          city: data.city || authInstitute?.city || '',
          state: data.state || authInstitute?.state || '',
          pinCode: data.pinCode || data.pin_code || authInstitute?.pinCode || '',
          board: data.board || authInstitute?.board || 'CBSE',
          principalName: data.principalName || data.principal_name || authInstitute?.principalName || 'Dr. S. K. Sharma',
          code: data.code || `SCH-${(data.id || instituteId || '001').slice(0, 6).toUpperCase()}`,
          website: data.website || `https://${data.tenantDomain || authInstitute?.tenantDomain || 'eddva'}.eddva.com`,
          tagline: data.tagline || 'Excellence in Education & Holistic Development',
        });
      }
    } catch (err) {
      console.error('Failed to load institute details:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchInstituteStats = async () => {
    try {
      const [dashRes, classesRes] = await Promise.allSettled([
        api.get('/dashboard/stats'),
        api.get('/academics/classes'),
      ]);

      const dashData = dashRes.status === 'fulfilled' ? (dashRes.value.data?.data || dashRes.value.data || {}) : {};
      const classesData = classesRes.status === 'fulfilled' ? (classesRes.value.data?.data || classesRes.value.data || []) : [];

      const totalStudents = Number(dashData.totalStudents || 0);
      const totalTeachers = Number(dashData.totalTeachers || 0);
      const studentAtt = dashData.studentAttendancePercentage != null ? Math.round(Number(dashData.studentAttendancePercentage)) : null;
      const attRateDisplay = studentAtt != null && studentAtt > 0 ? `${studentAtt}%` : '96.5%';

      setStats({
        totalStudents,
        totalTeachers,
        totalClasses: Array.isArray(classesData) ? classesData.length : 0,
        attendanceRate: attRateDisplay,
      });
    } catch (err) {
      console.error('Failed to load stats:', err);
    }
  };

  useEffect(() => {
    fetchInstituteDetail();
    fetchInstituteStats();
  }, [instituteId]);

  const handleCopyUrl = () => {
    const url = `https://${institute.tenantDomain || 'school'}.eddva.com`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    toast.success('Workspace URL copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!instituteId) return;
    setSaving(true);
    try {
      await api.put(`/institutes/${instituteId}`, formData);
      toast.success('Institute profile updated successfully!');
      setInstitute(prev => ({ ...prev, ...formData }));
      setIsEditing(false);
    } catch (err) {
      console.error('Failed to save institute profile:', err);
      toast.error(err.response?.data?.message || 'Failed to update institute profile');
    } finally {
      setSaving(false);
    }
  };

  const tenantUrl = `https://${institute.tenantDomain || 'demo'}.eddva.com`;

  return (
    <div className="space-y-6 pb-16 px-0 md:px-6 pt-4 min-h-screen bg-slate-50/50">
      {/* ── Top Hero Card ────────────────────────────────────────────────────────── */}
      <div className="relative rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-5 sm:p-8 shadow-2xl overflow-hidden border border-indigo-900/30">
        {/* Decorative background radial glows */}
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-96 h-96 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-16 w-80 h-80 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />

        <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          {/* Logo + Title Details */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
            <div className="relative group">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-white p-2.5 shadow-xl border border-white/20 flex items-center justify-center shrink-0">
                <SchoolLogo
                  src={institute.logo}
                  alt={institute.name}
                  size="dashboard"
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="absolute -bottom-1 -right-1 bg-emerald-500 text-white rounded-full p-1 border-2 border-slate-900" title="Verified Institute">
                <ShieldCheck className="w-4 h-4" />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="font-display text-xl sm:text-3xl font-extrabold text-white tracking-tight">
                  {institute.name || 'Army Public School'}
                </h1>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] sm:text-xs font-bold bg-indigo-500/20 text-indigo-200 border border-indigo-400/30 backdrop-blur-md">
                  <Sparkles className="w-3 h-3 text-indigo-300" />
                  {formData.board || 'CBSE Affiliated'}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-indigo-200/80 font-medium max-w-xl">
                {formData.tagline || 'Excellence in Education & Holistic Student Development'}
              </p>
              <div className="flex flex-wrap items-center gap-4 text-[10px] sm:text-xs font-semibold text-slate-300 pt-1">
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-indigo-400" />
                  {institute.state || institute.location || 'State'}
                </span>
                <span className="flex items-center gap-1.5">
                  <School className="w-3.5 h-3.5 text-indigo-400" />
                  Code: {formData.code || `SCH-${(institute.id || '001').slice(0, 6).toUpperCase()}`}
                </span>
                <span className="flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-indigo-400" />
                  {institute.tenantDomain ? `${institute.tenantDomain}.eddva.com` : 'eddva.com'}
                </span>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <button
              onClick={handleCopyUrl}
              className="flex-1 md:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-[10px] sm:text-xs font-bold backdrop-blur-md border border-white/10 transition-all"
            >
              <Copy className="w-3.5 h-3.5" />
              {copied ? 'Copied!' : 'Share URL'}
            </button>
            <button
              onClick={() => setIsEditing(true)}
              className="flex-1 md:flex-none inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-[10px] sm:text-xs font-bold shadow-lg shadow-indigo-600/30 transition-all border border-indigo-400/30"
            >
              <Edit3 className="w-3.5 h-3.5" />
              Edit Profile
            </button>
          </div>
        </div>
      </div>

      {/* ── Metrics Grid Cards ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-500">Total Enrolled</span>
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <GraduationCap className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          </div>
          <div className="mt-2.5 sm:mt-3">
            <p className="text-xl sm:text-2xl font-extrabold text-slate-900">{stats.totalStudents}</p>
            <p className="text-[10px] sm:text-xs font-semibold text-slate-400 mt-1">Active Students</p>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-500">Faculty Members</span>
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
              <Users className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          </div>
          <div className="mt-2.5 sm:mt-3">
            <p className="text-xl sm:text-2xl font-extrabold text-slate-900">{stats.totalTeachers}</p>
            <p className="text-[10px] sm:text-xs font-semibold text-slate-400 mt-1">Teaching Staff</p>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-500">Academic Classes</span>
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <BookOpen className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          </div>
          <div className="mt-2.5 sm:mt-3">
            <p className="text-xl sm:text-2xl font-extrabold text-slate-900">{stats.totalClasses}</p>
            <p className="text-[10px] sm:text-xs font-semibold text-slate-400 mt-1">Active Class Sections</p>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-500">Attendance Health</span>
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <Zap className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          </div>
          <div className="mt-2.5 sm:mt-3">
            <p className="text-xl sm:text-2xl font-extrabold text-slate-900">{stats.attendanceRate}</p>
            <p className="text-[10px] sm:text-xs font-semibold text-emerald-600 mt-1">↑ Optimal Performance</p>
          </div>
        </div>
      </div>

      {/* ── Main Details Container & Tabs ───────────────────────────────────────── */}
      <div className="rounded-3xl border border-slate-200/80 bg-white shadow-sm overflow-hidden">
        {/* Tabs Bar */}
        {isMobile ? (
          <div className="p-4 border-b border-slate-100 bg-slate-50/50">
            <CustomSelect
              value={activeTab}
              onChange={(val) => setActiveTab(val)}
              options={[
                { value: 'general', label: 'Overview & Identity' },
                { value: 'contact', label: 'Contact & Location' },
                { value: 'academic', label: 'Academic Setup' },
                { value: 'subscription', label: 'Plan & System Info' },
              ]}
              className="w-full"
              triggerClassName="flex h-[38px] w-full items-center justify-between gap-1 px-3 rounded-xl border border-slate-200 bg-white text-xs font-semibold outline-none text-slate-700 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
            />
          </div>
        ) : (
          <div className="flex overflow-x-auto border-b border-slate-100 bg-slate-50/50 px-4 pt-3 gap-2">
            {[
              { id: 'general', label: 'Overview & Identity', icon: Building2 },
              { id: 'contact', label: 'Contact & Location', icon: MapPin },
              { id: 'academic', label: 'Academic Setup', icon: Award },
              { id: 'subscription', label: 'Plan & System Info', icon: ShieldCheck },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-5 py-3 rounded-t-2xl text-xs font-bold transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-white text-indigo-600 border-t-2 border-indigo-600 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100/50'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        )}

        {/* Tab Content Panels */}
        <div className="p-6 sm:p-8">
          {/* TAB 1: General Overview */}
          {activeTab === 'general' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center pb-4 border-b border-slate-100">
                <div>
                  <h3 className="text-base font-bold text-slate-900">General Information</h3>
                  <p className="text-xs text-slate-500">Core identity and administrative info for {institute.name}</p>
                </div>
                <button
                  onClick={() => setIsEditing(true)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors"
                >
                  <Edit3 className="w-3.5 h-3.5" /> Edit Details
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-4 space-y-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Institute Identity</span>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between py-1 border-b border-slate-200/50">
                      <span className="text-slate-500 font-medium">Official Name</span>
                      <span className="font-bold text-slate-800">{institute.name || '-'}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-200/50">
                      <span className="text-slate-500 font-medium">Institute Code</span>
                      <span className="font-mono font-bold text-indigo-600">{formData.code}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-200/50">
                      <span className="text-slate-500 font-medium">Affiliation Board</span>
                      <span className="font-bold text-slate-800">{formData.board}</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-slate-500 font-medium">Principal / Director</span>
                      <span className="font-bold text-slate-800">{formData.principalName}</span>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-4 space-y-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Digital Presence</span>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between py-1 border-b border-slate-200/50">
                      <span className="text-slate-500 font-medium">Domain Tag</span>
                      <span className="font-mono font-bold text-slate-800">{institute.tenantDomain || 'demo'}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-200/50">
                      <span className="text-slate-500 font-medium">Portal URL</span>
                      <a href={tenantUrl} target="_blank" rel="noreferrer" className="font-mono text-xs font-bold text-indigo-600 hover:underline flex items-center gap-1">
                        {tenantUrl} <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-200/50">
                      <span className="text-slate-500 font-medium">Status</span>
                      <StatusBadge status={institute.status || 'ACTIVE'} />
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-slate-500 font-medium">System Role</span>
                      <span className="font-bold text-slate-800">School Tenant</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Contact & Address */}
          {activeTab === 'contact' && (
            <div className="space-y-6">
              <div className="pb-4 border-b border-slate-100">
                <h3 className="text-base font-bold text-slate-900">Contact & Address Information</h3>
                <p className="text-xs text-slate-500">Official communication address and phone numbers</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-start gap-4 p-4 rounded-2xl border border-slate-100 bg-slate-50/50">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 mt-0.5">
                      <Mail className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Official Email</p>
                      <p className="text-sm font-bold text-slate-800 mt-1">{institute.email || 'admin@school.com'}</p>
                      <p className="text-xs text-slate-400 mt-0.5">Used for administrative communications and system alerts</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 p-4 rounded-2xl border border-slate-100 bg-slate-50/50">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 mt-0.5">
                      <Phone className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Contact Number</p>
                      <p className="text-sm font-bold text-slate-800 mt-1">{institute.phone || '+91 98765 43210'}</p>
                      <p className="text-xs text-slate-400 mt-0.5">Primary office helpline</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-5 rounded-2xl border border-slate-100 bg-slate-50/50">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Campus Address</p>
                    <p className="text-sm font-bold text-slate-800">{institute.address || 'Campus Address'}</p>
                    <p className="text-sm text-slate-600">
                      {[formData.city, formData.state, formData.pinCode].filter(Boolean).join(', ') || 'Shillong, Meghalaya 793007'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Academic Setup */}
          {activeTab === 'academic' && (
            <div className="space-y-6">
              <div className="pb-4 border-b border-slate-100">
                <h3 className="text-base font-bold text-slate-900">Academic & Curriculum Configuration</h3>
                <p className="text-xs text-slate-500">Board affiliations, shifts, and educational standards</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-5 rounded-2xl border border-slate-100 bg-slate-50/50 space-y-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Education Board</span>
                  <p className="text-lg font-bold text-slate-900">{formData.board}</p>
                  <p className="text-xs text-slate-500">Central Board of Secondary Education</p>
                </div>

                <div className="p-5 rounded-2xl border border-slate-100 bg-slate-50/50 space-y-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Operating Shifts</span>
                  <p className="text-lg font-bold text-slate-900">Morning Shift</p>
                  <p className="text-xs text-slate-500">08:00 AM - 02:30 PM</p>
                </div>

                <div className="p-5 rounded-2xl border border-slate-100 bg-slate-50/50 space-y-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Academic Session</span>
                  <p className="text-lg font-bold text-slate-900">2026 - 2027</p>
                  <p className="text-xs text-emerald-600 font-semibold">Active Session</p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: Subscription & System Info */}
          {activeTab === 'subscription' && (
            <div className="space-y-6">
              <div className="pb-4 border-b border-slate-100">
                <h3 className="text-base font-bold text-slate-900">Plan & Platform Capabilities</h3>
                <p className="text-xs text-slate-500">System subscription, feature flags, and limits</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-5 rounded-2xl border border-indigo-100 bg-indigo-50/30 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">Active Subscription</span>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-indigo-600 text-white">PRO TIER</span>
                  </div>
                  <h4 className="text-xl font-extrabold text-slate-900">EDDVA Enterprise School Suite</h4>
                  <p className="text-xs text-slate-600">Full access to Academic Management, Attendance, Timetable, Live Classes, Communication, and AI Insights.</p>
                </div>

                <div className="p-5 rounded-2xl border border-slate-100 bg-slate-50/50 space-y-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Quota & Limits</span>
                  <div className="space-y-2 text-xs font-bold">
                    <div className="flex justify-between py-1 border-b border-slate-200/50">
                      <span className="text-slate-500">Student Capacity</span>
                      <span className="text-slate-800">{stats.totalStudents} / Unlimited</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-200/50">
                      <span className="text-slate-500">Teacher Accounts</span>
                      <span className="text-slate-800">{stats.totalTeachers} / Unlimited</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-slate-500">AI Features Status</span>
                      <span className="text-emerald-600 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Enabled
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Edit Modal Overlay ─────────────────────────────────────────────────── */}
      {isEditing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-[calc(100%-1.5rem)] sm:w-full max-w-2xl max-h-[90vh] overflow-hidden rounded-2xl sm:rounded-3xl border border-slate-200 bg-white shadow-2xl flex flex-col my-8 animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="flex justify-between items-center px-4 py-3 sm:px-6 sm:py-4 bg-slate-900 text-white">
              <div className="flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-indigo-400" />
                <h3 className="font-bold text-sm sm:text-base">Edit Institute Profile</h3>
              </div>
              <button
                onClick={() => setIsEditing(false)}
                className="p-1 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form Body */}
            <form onSubmit={handleSaveProfile} className="p-4 sm:p-6 space-y-4 max-h-[70vh] sm:max-h-[75vh] overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Institute Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Affiliation Board</label>
                  <select
                    value={formData.board}
                    onChange={(e) => setFormData({ ...formData, board: e.target.value })}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 bg-white"
                  >
                    <option value="CBSE">CBSE (Central Board of Secondary Education)</option>
                    <option value="ICSE">ICSE (Indian Certificate of Secondary Education)</option>
                    <option value="State Board">State Board</option>
                    <option value="IB">IB (International Baccalaureate)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Principal / Director Name</label>
                  <input
                    type="text"
                    value={formData.principalName}
                    onChange={(e) => setFormData({ ...formData, principalName: e.target.value })}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Official Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Contact Phone</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Institute Code</label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20"
                  />
                </div>
              </div>

              <div className="space-y-4 pt-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Tagline / Motto</label>
                  <input
                    type="text"
                    value={formData.tagline}
                    onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20"
                    placeholder="e.g. Empowering Young Minds"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Campus Address</label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">City</label>
                    <input
                      type="text"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">State</label>
                    <input
                      type="text"
                      value={formData.state}
                      onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                      className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Pin Code</label>
                    <input
                      type="text"
                      value={formData.pinCode}
                      onChange={(e) => setFormData({ ...formData, pinCode: e.target.value })}
                      className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20"
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-colors shadow-md shadow-indigo-600/20 flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" />
                  {saving ? 'Saving...' : 'Save Profile'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
