import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  User, GraduationCap, Calendar, BarChart2, DollarSign, 
  Mail, Smartphone, MapPin, ArrowLeft, Download, Users, Phone, Shield,
  Edit2, Clock, CheckCircle, AlertCircle, TrendingUp, HeartPulse, Briefcase, FileText, Printer, Share2, Loader2, Send, Key, X
} from 'lucide-react';
import api from '@/lib/api/school-client';
import Modal from '@/components/school/admin/Modal';
import StudentForm from '@/components/school/admin/forms/StudentForm';
import { mapStudentFormToApiUpdate } from '@/lib/school/onboardPayload';
import { exportToPDF } from "@/lib/school/pdfExport";
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

const getInitials = (name) => {
  if (!name) return '??';
  const parts = name.split(' ');
  if (parts.length >= 2) return (parts[parts.length - 2][0] + parts[parts.length - 1][0]).toUpperCase();
  return name.substring(0, 2).toUpperCase();
};

const TabButton = ({ active, onClick, icon: Icon, label }) => (
  <button
    onClick={onClick}
    className={`
      flex items-center gap-2 rounded-2xl border px-5 py-3 text-sm font-semibold transition-all duration-200
      ${active 
        ? 'border-blue-600 bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-600/20' 
        : 'border-transparent bg-transparent text-slate-500 hover:border-slate-100 hover:bg-slate-50 hover:text-slate-900 dark:hover:bg-slate-900/70 dark:hover:text-white'}
    `}
  >
    <Icon size={18} />
    {label}
  </button>
);

const DetailItem = ({ label, value, icon: Icon }) => (
  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800">
    <div className="flex items-center gap-2 text-[10px] font-bold tracking-tight text-slate-400 uppercase tracking-widest mb-1">
      {Icon && <Icon size={12} />}
      {label}
    </div>
    <div className="text-sm font-bold text-slate-900 dark:text-white">{value || '—'}</div>
  </div>
);

export default function StudentProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('personal');
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [sendCredsOpen, setSendCredsOpen] = useState(false);
  const [sendCredsForm, setSendCredsForm] = useState({ parentEmail: '', tempPassword: '' });
  const [isSendingCreds, setIsSendingCreds] = useState(false);
  const [attendance, setAttendance] = useState([]);
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [attendanceMonth, setAttendanceMonth] = useState(
    new Date().toISOString().slice(0, 7) // YYYY-MM
  );
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [teachingMap, setTeachingMap] = useState(null);

  const toggleActiveStatus = async () => {
    setUpdatingStatus(true);
    try {
      const newActive = !student.isActive;
      await api.put(`/students/${student.id}`, { 
        name: student.name,
        isActive: newActive 
      });
      setStudent(prev => ({ ...prev, isActive: newActive }));
      toast.success(`Student account ${newActive ? 'activated' : 'deactivated'} successfully`);
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.error || 'Failed to update student status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  useEffect(() => {
    fetchStudent();
  }, [id]);

  useEffect(() => {
    if (activeTab === 'attendance' && student?.id) {
      fetchAttendance();
    }
  }, [activeTab, attendanceMonth, student?.id]);

  useEffect(() => {
    const sectionId = student?.studentProfile?.sectionId || student?.studentProfile?.section?.id;
    if (activeTab !== 'academic' || !sectionId) {
      setTeachingMap(null);
      return;
    }
    api.get(`/academic/sections/${sectionId}/teaching-map`)
      .then((res) => setTeachingMap(res.data?.data ?? res.data))
      .catch(() => setTeachingMap(null));
  }, [activeTab, student?.studentProfile?.sectionId, student?.studentProfile?.section?.id]);

  const fetchAttendance = async () => {
    setAttendanceLoading(true);
    try {
      const [year, month] = attendanceMonth.split('-');
      const startDate = `${year}-${month}-01`;
      const lastDay = new Date(Number(year), Number(month), 0).getDate();
      const endDate = `${year}-${month}-${String(lastDay).padStart(2, '0')}`;
      const res = await api.get('/attendance', {
        params: { userId: student.id, startDate, endDate },
      });
      const list = res.data?.data ?? res.data ?? [];
      setAttendance(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error('Attendance fetch error:', err);
      setAttendance([]);
    } finally {
      setAttendanceLoading(false);
    }
  };

  const [exporting, setExporting] = useState(false);

  const handleExportPDF = async () => {
    setExporting(true);
    try {
      await exportToPDF('student-profile-content', `Student_Profile_${student.name.replace(/\s+/g, '_')}.pdf`);
      toast.success('PDF report generated successfully');
    } catch (err) {
      console.error(err);
      toast.error('Failed to generate PDF report');
    } finally {
      setExporting(false);
    }
  };

  /** The backend returns flat snake_case fields — normalize to camelCase for the UI */
  const normalizeStudent = (raw) => {
    if (!raw) return raw;
    const nestedProfile = raw.studentProfile || {};
    return {
      ...raw,
      // top-level camelCase aliases
      isActive: raw.is_active ?? raw.isActive,
      createdAt: raw.created_at ?? raw.createdAt,
      // build the studentProfile object the UI expects
      studentProfile: {
        ...nestedProfile,
        id:              nestedProfile.id ?? raw.profile_id ?? raw.id,
        enrollmentNo:      nestedProfile.enrollmentNo ?? nestedProfile.enrollment_no ?? raw.enrollment_no ?? raw.enrollmentNo,
        rollNo:            nestedProfile.rollNo ?? nestedProfile.roll_no ?? raw.roll_no ?? raw.rollNo,
        sectionId:         nestedProfile.sectionId ?? nestedProfile.section_id ?? raw.section_id ?? raw.sectionId,
        dob:               nestedProfile.dob ?? raw.dob,
        gender:            nestedProfile.gender ?? raw.gender,
        bloodGroup:        nestedProfile.bloodGroup ?? nestedProfile.blood_group ?? raw.blood_group ?? raw.bloodGroup,
        nationalId:        nestedProfile.nationalId ?? nestedProfile.national_id ?? raw.national_id ?? raw.nationalId,
        fatherName:        nestedProfile.fatherName ?? nestedProfile.father_name ?? raw.father_name ?? raw.fatherName,
        motherName:        nestedProfile.motherName ?? nestedProfile.mother_name ?? raw.mother_name ?? raw.motherName,
        parentPhone:       nestedProfile.parentPhone ?? nestedProfile.parent_phone ?? raw.parent_phone ?? raw.parentPhone,
        parentEmail:       nestedProfile.parentEmail ?? nestedProfile.parent_email ?? raw.parent_email ?? raw.parentEmail,
        parentOccupation:  nestedProfile.parentOccupation ?? nestedProfile.parent_occupation ?? raw.parent_occupation ?? raw.parentOccupation,
        admissionDate:     nestedProfile.admissionDate ?? nestedProfile.admission_date ?? raw.admission_date ?? raw.admissionDate,
        medicalConditions: nestedProfile.medicalConditions ?? nestedProfile.medical_conditions ?? raw.medical_conditions ?? raw.medicalConditions,
        allergies:         nestedProfile.allergies ?? raw.allergies,
        address:           nestedProfile.address ?? raw.address,
        city:              nestedProfile.city ?? raw.city,
        state:             nestedProfile.state ?? raw.state,
        pinCode:           nestedProfile.pinCode ?? nestedProfile.pin_code ?? raw.pin_code ?? raw.pinCode,
        documents:         nestedProfile.documents ?? raw.documents,
        section: nestedProfile.section || {
          name:  raw.section_name ?? nestedProfile.section?.name,
          class: { name: raw.class_name ?? nestedProfile.section?.class?.name },
        },
      },
      // build parentDetails from flat fields if not returned as nested
      parentDetails: raw.parentDetails ?? raw.parent_details ?? nestedProfile.parentDetails ?? {
        primaryContact:  nestedProfile.primaryContact ?? raw.primary_contact   ?? 'father',
        fatherName:      nestedProfile.fatherName ?? raw.father_name        ?? raw.fatherName,
        fatherPhone:     nestedProfile.fatherPhone ?? raw.father_phone       ?? raw.fatherPhone,
        motherName:      nestedProfile.motherName ?? raw.mother_name        ?? raw.motherName,
        motherPhone:     nestedProfile.motherPhone ?? raw.mother_phone       ?? raw.motherPhone,
        email:           nestedProfile.parentEmail ?? raw.parent_email       ?? raw.parentEmail,
        whatsappNumber:  nestedProfile.whatsappNumber ?? raw.whatsapp_number    ?? raw.whatsappNumber,
        occupation:      nestedProfile.parentOccupation ?? raw.parent_occupation  ?? raw.parentOccupation,
        guardianName:    nestedProfile.guardianName ?? raw.guardian_name      ?? raw.guardianName,
        guardianRelation:nestedProfile.guardianRelation ?? raw.guardian_relation  ?? raw.guardianRelation,
        guardianPhone:   nestedProfile.guardianPhone ?? raw.guardian_phone     ?? raw.guardianPhone,
        createLogin:     nestedProfile.createLogin ?? raw.create_login       ?? raw.createLogin,
        sendViaSms:      nestedProfile.sendViaSms ?? raw.send_via_sms       ?? raw.sendViaSms,
        sendViaEmail:    nestedProfile.sendViaEmail ?? raw.send_via_email     ?? raw.sendViaEmail,
      },
    };
  };

  const fetchStudent = async () => {
    try {
      const res = await api.get(`/students/${id}`);
      const raw = res.data?.data ?? res.data;
      setStudent(normalizeStudent(raw));
    } catch (err) {
      console.error(err);
      setStudent({ error: err.response?.data?.error || "Student not found." });
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-slate-500 font-bold animate-pulse">Loading Profile...</div>;
  if (!student || student.error) {
    return (
      <div className="p-12 text-center">
        <div className="max-w-md mx-auto p-8 rounded-3xl bg-red-50 border border-red-100 shadow-xl shadow-red-200/20">
          <AlertCircle size={48} className="mx-auto mb-4 text-red-500" />
          <h2 className="text-xl font-bold tracking-tight text-red-900 mb-2">Student Not Found</h2>
          <p className="text-sm font-bold text-red-600 mb-6">{student?.error || "We couldn't find the student profile you're looking for."}</p>
          <button 
            onClick={() => navigate(-1)}
            className="px-6 py-2 rounded-xl bg-red-600 text-white font-bold text-sm hover:bg-red-700 transition-all"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const handleSendCredentials = async () => {
    const parentEmail = sendCredsForm.parentEmail || student.parent_email || student.parentEmail;
    if (!parentEmail) {
      toast.error('No parent email found. Please set parent email first.');
      return;
    }
    setIsSendingCreds(true);
    try {
      const payload = {
        parentEmail,
        tempPassword: sendCredsForm.tempPassword || undefined,
        loginUrl: window.location.origin + '/login',
      };
      await api.post(`/students/${student.id}/send-credentials`, payload);
      toast.success('Credentials sent successfully to parent!');
      setSendCredsOpen(false);
      setSendCredsForm({ parentEmail: '', tempPassword: '' });
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.error || err.response?.data?.message || 'Failed to send credentials');
    } finally {
      setIsSendingCreds(false);
    }
  };

  const profile = student.studentProfile || {};
  const parents = student.parentDetails || {};

  return (
    <div className="max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-900 font-bold transition-colors"
        >
          <ArrowLeft size={20} />
          Back to List
        </button>
        <div className="flex gap-3">
          <button 
            onClick={handleExportPDF}
            disabled={exporting}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-100 text-slate-600 font-bold text-sm hover:bg-slate-50 transition-all disabled:opacity-50"
          >
            {exporting ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
            Export PDF
          </button>
          <button
            onClick={() => {
              setSendCredsForm({
                parentEmail: student.parent_email || student.parentEmail || '',
                tempPassword: '',
              });
              setSendCredsOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-indigo-200 bg-indigo-50 text-indigo-700 font-bold text-sm hover:bg-indigo-100 transition-all"
          >
            <Send size={18} />
            Send Credentials
          </button>
        </div>
      </div>

      {/* Send Credentials Modal */}
      {sendCredsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}>
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-indigo-600 to-blue-600 px-8 py-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                    <Send size={20} className="text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">Send Parent Credentials</h3>
                    <p className="text-xs text-indigo-200 font-bold">Email login details to the parent</p>
                  </div>
                </div>
                <button onClick={() => setSendCredsOpen(false)} className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center text-white hover:bg-white/30 transition-all">
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-8 space-y-5">
              {/* Student info card */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center text-lg font-bold">
                  {getInitials(student.name)}
                </div>
                <div>
                  <div className="font-bold text-slate-900 dark:text-white">{student.name}</div>
                  <div className="text-xs font-bold text-slate-400">{student.email}</div>
                </div>
              </div>

              {/* Parent email */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
                  <Mail size={12} className="inline mr-1" /> Parent Email
                </label>
                <input
                  type="email"
                  value={sendCredsForm.parentEmail}
                  onChange={e => setSendCredsForm(f => ({ ...f, parentEmail: e.target.value }))}
                  placeholder="parent@example.com"
                  className="w-full rounded-2xl border-2 border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-3 text-sm font-bold text-slate-900 dark:text-white outline-none focus:border-blue-500 transition-colors"
                />
                {!sendCredsForm.parentEmail && (
                  <p className="mt-1.5 text-[10px] font-bold text-amber-500 uppercase">⚠ No parent email on record — enter one above</p>
                )}
              </div>

              {/* Temp password */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
                  <Key size={12} className="inline mr-1" /> Temporary Password
                </label>
                <input
                  type="text"
                  value={sendCredsForm.tempPassword}
                  onChange={e => setSendCredsForm(f => ({ ...f, tempPassword: e.target.value }))}
                  placeholder="Leave blank to auto-generate"
                  className="w-full rounded-2xl border-2 border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-3 text-sm font-bold text-slate-900 dark:text-white outline-none focus:border-blue-500 transition-colors"
                />
                <p className="mt-1.5 text-[10px] font-bold text-slate-400 uppercase">Leave blank to auto-generate a secure password</p>
              </div>

              {/* Info box */}
              <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/30">
                <p className="text-xs font-bold text-blue-700 dark:text-blue-400 leading-relaxed">
                  📧 A beautiful welcome email will be sent to the parent with their login credentials and a link to the parent portal.
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setSendCredsOpen(false)}
                  className="flex-1 py-3 rounded-2xl border-2 border-slate-100 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-bold text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSendCredentials}
                  disabled={isSendingCreds || !sendCredsForm.parentEmail}
                  className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-indigo-600 to-blue-600 text-white font-bold text-sm shadow-lg shadow-blue-600/25 hover:shadow-xl hover:shadow-blue-600/30 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSendingCreds ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                  {isSendingCreds ? 'Sending...' : 'Send Email'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <Modal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} title="Edit Student" size="full">
        <StudentForm
          student={student}
          onCancel={() => setIsEditOpen(false)}
          isLoading={isSaving}
          onSubmit={async (formData) => {
            setIsSaving(true);
            try {
              const payload = mapStudentFormToApiUpdate(formData);
              await api.put(`/students/${student.id}`, payload);
              toast.success('Profile updated');
              await fetchStudent();
              setIsEditOpen(false);
            } catch (err) {
              console.error(err);
              toast.error(err.response?.data?.error || 'Failed to save profile');
            } finally {
              setIsSaving(false);
            }
          }}
        />
      </Modal>

      {/* Main Profile Card */}
      <div id="student-profile-content" className="bg-white dark:bg-slate-950 rounded-[2.5rem] shadow-2xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-800 overflow-hidden mb-8">
        <div className="h-32 bg-gradient-to-r from-blue-600 to-indigo-700" />
        <div className="px-12 pb-12 -mt-16">
          <div className="flex flex-col md:flex-row items-end gap-8 mb-8">
            <div className="w-40 h-40 rounded-[2.5rem] border-8 border-white dark:border-slate-950 overflow-hidden bg-slate-100 shadow-xl">
              {student.profileImage ? (
                <img src={student.profileImage} alt={student.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-blue-600/10 text-4xl font-bold tracking-tight text-blue-700">
                  {getInitials(student.name)}
                </div>
              )}
            </div>
            <div className="flex-1 pb-4">
              <div className="flex items-center gap-4 mb-2 flex-wrap">
                <h1 className="text-4xl font-bold tracking-tight text-slate-900 dark:text-white tracking-tight">{student.name}</h1>
                <button
                  onClick={toggleActiveStatus}
                  disabled={updatingStatus}
                  className="flex items-center gap-2 outline-none group cursor-pointer"
                  title="Click to toggle account status"
                >
                  <div className={cn(
                    "relative w-11 h-6 rounded-full transition-colors duration-300 flex items-center px-1 border",
                    student.isActive 
                      ? "bg-emerald-500 border-emerald-600" 
                      : "bg-slate-300 border-slate-400 dark:bg-slate-800 dark:border-slate-700"
                  )}>
                    <div className={cn(
                      "w-4 h-4 rounded-full bg-white transition-transform duration-300 shadow-md",
                      student.isActive ? "translate-x-5" : "translate-x-0"
                    )} />
                  </div>
                  <span className={cn(
                    "text-[10px] font-bold tracking-tight uppercase tracking-widest",
                    student.isActive ? "text-emerald-600" : "text-slate-400"
                  )}>
                    {student.isActive ? 'Active' : 'Inactive'}
                  </span>
                </button>
              </div>
              <div className="flex flex-wrap gap-6 text-sm font-bold text-slate-500">
                <div className="flex items-center gap-2"><GraduationCap size={18} className="text-blue-500" /> Class {profile.section?.class?.name || '—'} - {profile.section?.name || '—'}</div>
                <div className="flex items-center gap-2"><Smartphone size={18} className="text-blue-500" /> {student.phone || '—'}</div>
                <div className="flex items-center gap-2"><Mail size={18} className="text-blue-500" /> {student.email}</div>
              </div>
            </div>
            <div className="pb-4 hidden lg:block text-right">
              <div className="text-[10px] font-bold tracking-tight text-slate-400 uppercase tracking-widest mb-1">Enrollment No</div>
              <div className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white tracking-tighter">{profile.enrollmentNo || '—'}</div>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 border-b border-slate-100 dark:border-slate-800 -mx-12 mb-8 px-12 pb-6 overflow-x-auto no-scrollbar">
            <TabButton active={activeTab === 'personal'} onClick={() => setActiveTab('personal')} icon={User} label="Personal" />
            <TabButton active={activeTab === 'family'} onClick={() => setActiveTab('family')} icon={Users} label="Family Details" />
            <TabButton active={activeTab === 'academic'} onClick={() => setActiveTab('academic')} icon={GraduationCap} label="Academic" />
            <TabButton active={activeTab === 'attendance'} onClick={() => setActiveTab('attendance')} icon={Calendar} label="Attendance" />
            <TabButton active={activeTab === 'performance'} onClick={() => setActiveTab('performance')} icon={BarChart2} label="Performance" />
            <TabButton active={activeTab === 'fees'} onClick={() => setActiveTab('fees')} icon={DollarSign} label="Fees & Payments" />
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === 'personal' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="md:col-span-2 space-y-8">
                    <div>
                      <h3 className="text-sm font-bold tracking-tight text-slate-900 dark:text-white uppercase tracking-widest mb-4">Identity Details</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <DetailItem label="Full Name" value={student.name} icon={User} />
                        <DetailItem label="Date of Birth" value={profile.dob ? new Date(profile.dob).toLocaleDateString() : '—'} icon={Calendar} />
                        <DetailItem label="Gender" value={profile.gender} icon={User} />
                        <DetailItem label="Blood Group" value={profile.bloodGroup} icon={HeartPulse} />
                        <DetailItem label="National ID" value={profile.nationalId || 'Verified'} icon={CheckCircle} />
                      </div>
                    </div>
                    <div>
                      <h3 className="text-sm font-bold tracking-tight text-slate-900 dark:text-white uppercase tracking-widest mb-4">Contact Information</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <DetailItem label="Primary Email" value={student.email} icon={Mail} />
                        <DetailItem label="Phone Number" value={student.phone} icon={Smartphone} />
                        <DetailItem label="Address" value={profile.address} icon={MapPin} className="col-span-2" />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-6">
                    {/* Credentials Card */}
                    <div className="p-6 rounded-3xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800">
                      <h4 className="text-xs font-bold tracking-tight uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
                        <Key size={14} className="text-blue-500" />
                        Login Credentials
                      </h4>
                      <div className="space-y-3">
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase">Username / Email</span>
                          <div className="text-sm font-extrabold text-slate-700 dark:text-slate-200 mt-1 select-all">{student.email}</div>
                        </div>
                        <div className="p-3 rounded-2xl bg-blue-50 dark:bg-blue-900/10 border border-blue-100/50 dark:border-blue-900/30 text-[10px] font-bold text-blue-600 leading-relaxed mt-2">
                          🔒 Password can be reset by sending a reset link or updating via user management.
                        </div>
                      </div>
                    </div>

                    <div className="p-6 rounded-3xl bg-blue-600 text-white shadow-xl shadow-blue-600/20">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-xs font-bold tracking-tight uppercase tracking-widest opacity-80">Medical Alert</h4>
                        <AlertCircle size={20} />
                      </div>
                      <p className="text-sm font-bold leading-relaxed mb-4">
                        {profile.medicalConditions || 'No significant medical conditions reported.'}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <span className="px-2 py-1 rounded-lg bg-white/20 text-[10px] font-bold tracking-tight uppercase">Blood: {profile.bloodGroup || '—'}</span>
                        <span className="px-2 py-1 rounded-lg bg-white/20 text-[10px] font-bold tracking-tight uppercase">Allergy: {profile.allergies || 'None'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'family' && (
                <div className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-3">
                      <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                          <h3 className="text-sm font-bold tracking-tight text-slate-900 dark:text-white uppercase tracking-widest">Primary Contact Information</h3>
                          <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-[10px] font-bold tracking-tight uppercase border border-blue-200 capitalize">
                            {parents.primaryContact || 'Father'}
                          </span>
                        </div>
                        <button
                          onClick={() => {
                            setSendCredsForm({
                              parentEmail: parents.email || profile.parentEmail || '',
                              tempPassword: '',
                            });
                            setSendCredsOpen(true);
                          }}
                          className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-indigo-200 bg-indigo-50 text-indigo-700 font-bold text-xs hover:bg-indigo-100 transition-all"
                        >
                          <Send size={14} />
                          Send Credentials
                        </button>
                      </div>
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                        <DetailItem label="Parent Email" value={parents.email || profile.parentEmail} icon={Mail} />
                        <DetailItem label="WhatsApp Number" value={parents.whatsappNumber || parents.fatherPhone || profile.parentPhone} icon={Phone} />
                        <DetailItem label="Primary Occupation" value={parents.occupation || profile.parentOccupation} icon={Briefcase} />
                      </div>
                    </div>

                    <div className="p-6 rounded-3xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
                          <User size={20} />
                        </div>
                        <h4 className="font-bold text-slate-900 dark:text-white">Father's Details</h4>
                      </div>
                      <div className="space-y-4">
                        <div>
                          <div className="text-[10px] font-bold tracking-tight text-slate-400 uppercase tracking-widest mb-1">Name</div>
                          <div className="text-sm font-bold text-slate-900 dark:text-white">{parents.fatherName || profile.fatherName || '—'}</div>
                        </div>
                        <div>
                          <div className="text-[10px] font-bold tracking-tight text-slate-400 uppercase tracking-widest mb-1">Phone Number</div>
                          <div className="text-sm font-bold text-slate-900 dark:text-white">{parents.fatherPhone || '—'}</div>
                        </div>
                      </div>
                    </div>

                    <div className="p-6 rounded-3xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-xl bg-pink-100 text-pink-600 flex items-center justify-center">
                          <User size={20} />
                        </div>
                        <h4 className="font-bold text-slate-900 dark:text-white">Mother's Details</h4>
                      </div>
                      <div className="space-y-4">
                        <div>
                          <div className="text-[10px] font-bold tracking-tight text-slate-400 uppercase tracking-widest mb-1">Name</div>
                          <div className="text-sm font-bold text-slate-900 dark:text-white">{parents.motherName || profile.motherName || '—'}</div>
                        </div>
                        <div>
                          <div className="text-[10px] font-bold tracking-tight text-slate-400 uppercase tracking-widest mb-1">Phone Number</div>
                          <div className="text-sm font-bold text-slate-900 dark:text-white">{parents.motherPhone || '—'}</div>
                        </div>
                      </div>
                    </div>

                    {(parents.guardianName || parents.primaryContact === 'guardian' || profile.guardianName) && (
                      <div className="p-6 rounded-3xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
                            <Shield size={20} />
                          </div>
                          <h4 className="font-bold text-slate-900 dark:text-white">Guardian's Details</h4>
                        </div>
                        <div className="space-y-4">
                          <div>
                            <div className="text-[10px] font-bold tracking-tight text-slate-400 uppercase tracking-widest mb-1">Name & Relation</div>
                            <div className="text-sm font-bold text-slate-900 dark:text-white">{parents.guardianName || profile.guardianName || '—'} ({parents.guardianRelation || '—'})</div>
                          </div>
                          <div>
                            <div className="text-[10px] font-bold tracking-tight text-slate-400 uppercase tracking-widest mb-1">Phone Number</div>
                            <div className="text-sm font-bold text-slate-900 dark:text-white">{parents.guardianPhone || '—'}</div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {parents.createLogin && (
                    <div className="p-5 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800/30 flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
                        <Smartphone size={24} />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-indigo-900 dark:text-indigo-300">Parent App Access Enabled</h4>
                        <p className="text-xs font-bold text-indigo-700/70 dark:text-indigo-400/70 mt-0.5">
                          Login credentials have been sent via {[parents.sendViaSms && 'SMS', parents.sendViaEmail && 'Email'].filter(Boolean).join(' and ') || 'SMS'}.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'academic' && (
                <div className="space-y-8">
                  <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                    <DetailItem label="Current Class" value={profile.section?.class?.name || '—'} icon={GraduationCap} />
                    <DetailItem label="Section" value={profile.section?.name || '—'} />
                    <DetailItem label="Roll Number" value={profile.rollNo || '—'} />
                    <DetailItem label="Admission Date" value={profile.admissionDate ? new Date(profile.admissionDate).toLocaleDateString() : '—'} icon={Clock} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold tracking-tight text-slate-900 dark:text-white uppercase tracking-widest mb-4">
                      Subjects & assigned teachers
                    </h3>
                    {teachingMap?.subjects?.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {teachingMap.subjects.map((row) => (
                          <div key={row.subjectId || row.subjectName} className="p-4 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-900 flex items-center justify-center font-bold text-blue-600 shrink-0">
                                {(row.subjectName || '?').charAt(0)}
                              </div>
                              <div className="min-w-0">
                                <div className="text-sm font-bold text-slate-700 dark:text-slate-200 truncate">{row.subjectName}</div>
                                <div className="text-xs font-medium text-slate-500 truncate">
                                  {row.teachers?.length
                                    ? row.teachers.map((t) => t.name).join(', ')
                                    : 'No teacher assigned'}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-slate-500">No subject–teacher mapping for this section yet.</p>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'attendance' && (
                <div className="space-y-6">
                  {/* Month Picker */}
                  <div className="flex items-center justify-between flex-wrap gap-4">
                    <h3 className="text-sm font-bold tracking-tight text-slate-900 dark:text-white uppercase tracking-widest">Attendance Record</h3>
                    <div className="flex items-center gap-3">
                      <label className="text-xs font-bold text-slate-400 uppercase">Month</label>
                      <input
                        type="month"
                        value={attendanceMonth}
                        onChange={(e) => setAttendanceMonth(e.target.value)}
                        className="rounded-xl border-2 border-slate-100 dark:border-slate-700 px-3 py-2 text-sm font-bold text-slate-700 dark:text-white bg-white dark:bg-slate-900 outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>

                  {attendanceLoading ? (
                    <div className="flex items-center justify-center py-16">
                      <Loader2 size={32} className="animate-spin text-blue-500" />
                    </div>
                  ) : (() => {
                    const total   = attendance.length;
                    const present = attendance.filter(r => (r.status || '').toUpperCase() === 'PRESENT').length;
                    const absent  = attendance.filter(r => (r.status || '').toUpperCase() === 'ABSENT').length;
                    const late    = attendance.filter(r => (r.status || '').toUpperCase() === 'LATE').length;
                    const pct     = total > 0 ? Math.round((present / total) * 100) : 0;

                    const statusStyle = (status) => {
                      const s = (status || '').toUpperCase();
                      if (s === 'PRESENT') return 'bg-emerald-500/10 text-emerald-600';
                      if (s === 'ABSENT')  return 'bg-red-500/10 text-red-500';
                      if (s === 'LATE')    return 'bg-amber-400/10 text-amber-600';
                      if (s === 'LEAVE')   return 'bg-blue-500/10 text-blue-600';
                      return 'bg-slate-100 text-slate-500';
                    };

                    return (
                      <>
                        {/* Stats */}
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                          <div className="p-6 rounded-[2rem] bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 text-center">
                            <div className={`text-4xl font-bold tracking-tight mb-1 ${pct >= 75 ? 'text-blue-600' : 'text-red-500'}`}>{total > 0 ? `${pct}%` : '—'}</div>
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Attendance %</div>
                          </div>
                          <div className="p-6 rounded-[2rem] bg-emerald-500/10 border border-emerald-500/20 text-center text-emerald-600">
                            <div className="text-4xl font-bold tracking-tight mb-1">{present}</div>
                            <div className="text-[10px] font-bold uppercase tracking-widest">Present</div>
                          </div>
                          <div className="p-6 rounded-[2rem] bg-red-500/10 border border-red-500/20 text-center text-red-500">
                            <div className="text-4xl font-bold tracking-tight mb-1">{absent}</div>
                            <div className="text-[10px] font-bold uppercase tracking-widest">Absent</div>
                          </div>
                          <div className="p-6 rounded-[2rem] bg-amber-400/10 border border-amber-400/20 text-center text-amber-600">
                            <div className="text-4xl font-bold tracking-tight mb-1">{late}</div>
                            <div className="text-[10px] font-bold uppercase tracking-widest">Late</div>
                          </div>
                        </div>

                        {/* Records Table */}
                        <div className="rounded-3xl border border-slate-100 dark:border-slate-800 overflow-hidden">
                          <table className="w-full text-left">
                            <thead className="bg-slate-50 dark:bg-slate-900/60 border-b border-slate-100 dark:border-slate-800">
                              <tr>
                                <th className="p-4 text-[10px] font-bold tracking-tight text-slate-400 uppercase tracking-widest">Date</th>
                                <th className="p-4 text-[10px] font-bold tracking-tight text-slate-400 uppercase tracking-widest">Day</th>
                                <th className="p-4 text-[10px] font-bold tracking-tight text-slate-400 uppercase tracking-widest">Status</th>
                                <th className="p-4 text-[10px] font-bold tracking-tight text-slate-400 uppercase tracking-widest">Remarks</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 dark:divide-slate-800 text-sm">
                              {attendance.length === 0 ? (
                                <tr>
                                  <td colSpan={4} className="p-10 text-center text-slate-400 font-bold">
                                    No attendance records for this month.
                                  </td>
                                </tr>
                              ) : (
                                [...attendance]
                                  .sort((a, b) => new Date(b.date) - new Date(a.date))
                                  .map((record, i) => {
                                    const d = new Date(record.date);
                                    return (
                                      <tr key={record.id || i} className="hover:bg-slate-50 dark:hover:bg-slate-900/30 transition-colors">
                                        <td className="p-4 font-bold text-slate-700 dark:text-slate-200">
                                          {d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                        </td>
                                        <td className="p-4 font-bold text-slate-400">
                                          {d.toLocaleDateString('en-IN', { weekday: 'short' })}
                                        </td>
                                        <td className="p-4">
                                          <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${statusStyle(record.status)}`}>
                                            {record.status || 'Unknown'}
                                          </span>
                                        </td>
                                        <td className="p-4 text-slate-400 font-bold">{record.remarks || '—'}</td>
                                      </tr>
                                    );
                                  })
                              )}
                            </tbody>
                          </table>
                        </div>
                      </>
                    );
                  })()}
                </div>
              )}

              {activeTab === 'performance' && (() => {
                const sessions = student.performance || [];
                const totalSessions = sessions.length;
                const avgAccuracy = totalSessions > 0
                  ? Math.round(sessions.reduce((sum, s) => sum + (s.accuracy || 0), 0) / totalSessions)
                  : 0;

                return (
                  <div className="space-y-8">
                    {/* Stats */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      <div className="p-6 rounded-[2rem] bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 text-center">
                        <div className="text-4xl font-bold tracking-tight text-blue-600 mb-1">{totalSessions}</div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Completed Assessments</div>
                      </div>
                      <div className="p-6 rounded-[2rem] bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 text-center">
                        <div className="text-4xl font-bold tracking-tight text-emerald-500 mb-1">{totalSessions > 0 ? `${avgAccuracy}%` : '—'}</div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Average Accuracy</div>
                      </div>
                      <div className="p-6 rounded-[2rem] bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 text-center">
                        <div className="text-4xl font-bold tracking-tight text-indigo-600 mb-1">
                          {totalSessions > 0 ? (sessions.reduce((sum, s) => sum + (s.score || 0), 0) / totalSessions).toFixed(1) : '—'}
                        </div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Average Score</div>
                      </div>
                    </div>

                    {/* Test Sessions Table */}
                    <div className="rounded-[2rem] border border-slate-100 dark:border-slate-800 overflow-hidden bg-white dark:bg-slate-950">
                      <div className="px-8 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-widest">Assessment History</h4>
                      </div>
                      <table className="w-full text-left">
                        <thead className="bg-slate-50 dark:bg-slate-900/60 border-b border-slate-100 dark:border-slate-800">
                          <tr>
                            <th className="p-4 text-[10px] font-bold tracking-tight text-slate-400 uppercase tracking-widest">Mock Test Name</th>
                            <th className="p-4 text-[10px] font-bold tracking-tight text-slate-400 uppercase tracking-widest">Submitted Date</th>
                            <th className="p-4 text-[10px] font-bold tracking-tight text-slate-400 uppercase tracking-widest text-center">Accuracy</th>
                            <th className="p-4 text-[10px] font-bold tracking-tight text-slate-400 uppercase tracking-widest text-center">Score</th>
                            <th className="p-4 text-[10px] font-bold tracking-tight text-slate-400 uppercase tracking-widest text-center">Correct/Wrong</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 dark:divide-slate-800/40 text-sm">
                          {sessions.length === 0 ? (
                            <tr>
                              <td colSpan={5} className="p-10 text-center text-slate-400 font-bold">
                                No test sessions completed yet.
                              </td>
                            </tr>
                          ) : (
                            sessions.map((s, idx) => (
                              <tr key={s.id || idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors font-bold text-slate-700 dark:text-slate-200">
                                <td className="p-4 text-slate-900 dark:text-white font-extrabold">{s.mockTestTitle || '—'}</td>
                                <td className="p-4 text-slate-400">
                                  {s.submittedAt ? new Date(s.submittedAt).toLocaleDateString(undefined, {
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric'
                                  }) : '—'}
                                </td>
                                <td className="p-4 text-center">
                                  <span className={cn(
                                    "px-2 py-1 rounded-lg text-xs font-extrabold",
                                    (s.accuracy || 0) >= 80 ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400" :
                                    (s.accuracy || 0) >= 50 ? "bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400" :
                                    "bg-rose-50 text-rose-600 dark:bg-rose-950/30 dark:text-rose-400"
                                  )}>
                                    {s.accuracy ? `${Math.round(s.accuracy)}%` : '0%'}
                                  </span>
                                </td>
                                <td className="p-4 text-center font-extrabold text-blue-600 dark:text-blue-400">{s.score ?? 0}</td>
                                <td className="p-4 text-center text-[11px]">
                                  <span className="text-emerald-600 dark:text-emerald-400">{s.correctCount ?? 0} ✅</span>
                                  <span className="mx-1.5 text-slate-300">/</span>
                                  <span className="text-rose-600 dark:text-rose-400">{s.wrongCount ?? 0} ❌</span>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })()}

              {activeTab === 'fees' && (
                <div className="space-y-8">
                  <div className="p-8 rounded-[2.5rem] bg-indigo-600 text-white flex flex-col md:flex-row items-center justify-between gap-8">
                    <div>
                      <div className="text-xs font-bold tracking-tight uppercase tracking-widest opacity-70 mb-1">Total Outstanding</div>
                      <div className="text-5xl font-bold tracking-tight tracking-tighter">₹ 12,500</div>
                    </div>
                    <button className="px-8 py-4 rounded-2xl bg-white text-indigo-600 font-bold tracking-tight uppercase tracking-widest hover:scale-105 active:scale-95 transition-all">
                      Pay Now
                    </button>
                  </div>
                  <div className="rounded-3xl border border-slate-100 overflow-hidden">
                    <table className="w-full text-left">
                      <thead className="bg-slate-50 border-b border-slate-100">
                        <tr>
                          <th className="p-4 text-[10px] font-bold tracking-tight text-slate-400 uppercase tracking-widest">Invoice</th>
                          <th className="p-4 text-[10px] font-bold tracking-tight text-slate-400 uppercase tracking-widest">Due Date</th>
                          <th className="p-4 text-[10px] font-bold tracking-tight text-slate-400 uppercase tracking-widest">Amount</th>
                          <th className="p-4 text-[10px] font-bold tracking-tight text-slate-400 uppercase tracking-widest">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50 text-sm font-bold">
                        {[1, 2, 3].map(i => (
                          <tr key={i}>
                            <td className="p-4 text-slate-900">#INV-2026-00{i}</td>
                            <td className="p-4 text-slate-500">June 15, 2026</td>
                            <td className="p-4 text-slate-900">₹ 4,500</td>
                            <td className="p-4">
                              <span className={`px-2 py-1 rounded-lg text-[10px] font-bold tracking-tight uppercase ${i === 1 ? 'bg-red-500/10 text-red-500' : 'bg-emerald-500/10 text-emerald-600'}`}>
                                {i === 1 ? 'Pending' : 'Paid'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
