import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, GraduationCap, Calendar, CheckCircle2, AlertCircle, FileText, 
  ShieldCheck, Loader2, Save, Send, UserX, Award, Sparkles, Building, User, Phone, Mail
} from 'lucide-react';
import api from '@/lib/api/school-client';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

const getStudentClassName = (st) => {
  if (!st) return '';
  const prof = st.studentProfile || {};
  const sec = prof.section || {};
  const clsName = sec.class?.name || prof.className || st.className || '';
  const secName = sec.name || prof.sectionName || st.sectionName || '';
  if (clsName && secName) return `${clsName} - ${secName}`;
  if (clsName) return clsName;
  if (secName) return `Section ${secName}`;
  return prof.lastClassAttended || '';
};

export default function StudentExitWorkflowPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [student, setStudent] = useState(null);
  const [exitRecord, setExitRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    leavingDate: new Date().toISOString().split('T')[0],
    lastClassAttended: '',
    reasonForLeaving: 'Parent Request / School Transfer',
    destinationSchool: '',
    examResultStatus: 'PASSED',
    conductRemarks: 'Good & Satisfactory',
    feeClearanceStatus: 'CLEARED',
    libraryClearanceStatus: 'CLEARED',
    hostelClearanceStatus: 'NOT_APPLICABLE',
    transportClearanceStatus: 'NOT_APPLICABLE',
    documentsIssued: ['Transfer Certificate', 'Character Certificate', 'Report Card'],
    authorizedSignatoryName: 'Principal',
    authorizedSignatoryRole: 'Principal',
    tcNumber: '',
    tcIssueDate: new Date().toISOString().split('T')[0],
    issueTc: false
  });

  useEffect(() => {
    if (id) {
      loadData();
    }
  }, [id]);

  const loadData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Student Details
      const studentRes = await api.get(`/students/${id}`);
      const stData = studentRes.data?.data ?? studentRes.data;
      setStudent(stData);

      const defaultClass = getStudentClassName(stData);

      // 2. Fetch Exit Record
      try {
        const exitRes = await api.get(`/students/${id}/exit-record`);
        const exitData = exitRes.data?.data ?? exitRes.data;
        if (exitData) {
          setExitRecord(exitData);
          setForm(prev => ({
            ...prev,
            leavingDate: exitData.leavingDate ? new Date(exitData.leavingDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
            lastClassAttended: exitData.lastClassAttended || defaultClass,
            reasonForLeaving: exitData.reasonForLeaving || prev.reasonForLeaving,
            destinationSchool: exitData.destinationSchool || '',
            examResultStatus: exitData.examResultStatus || 'PASSED',
            conductRemarks: exitData.conductRemarks || 'Good & Satisfactory',
            feeClearanceStatus: exitData.feeClearanceStatus || 'CLEARED',
            libraryClearanceStatus: exitData.libraryClearanceStatus || 'CLEARED',
            hostelClearanceStatus: exitData.hostelClearanceStatus || 'NOT_APPLICABLE',
            transportClearanceStatus: exitData.transportClearanceStatus || 'NOT_APPLICABLE',
            documentsIssued: Array.isArray(exitData.documentsIssued) ? exitData.documentsIssued : prev.documentsIssued,
            authorizedSignatoryName: exitData.authorizedSignatoryName || 'Principal',
            authorizedSignatoryRole: exitData.authorizedSignatoryRole || 'Principal',
            tcNumber: exitData.tcNumber || '',
            tcIssueDate: exitData.tcIssueDate ? new Date(exitData.tcIssueDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
          }));
        } else {
          setForm(prev => ({ ...prev, lastClassAttended: defaultClass }));
        }
      } catch {
        setForm(prev => ({ ...prev, lastClassAttended: defaultClass }));
      }
    } catch (err) {
      console.error('Failed to load student details:', err);
      toast.error('Failed to load student profile');
    } finally {
      setLoading(false);
    }
  };

  const handleClearanceChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleDocumentToggle = (docName) => {
    setForm(prev => {
      const current = prev.documentsIssued || [];
      const updated = current.includes(docName)
        ? current.filter(d => d !== docName)
        : [...current, docName];
      return { ...prev, documentsIssued: updated };
    });
  };

  const handleSubmit = async (shouldIssueTc = false) => {
    setSubmitting(true);
    try {
      const payload = {
        ...form,
        issueTc: shouldIssueTc,
        status: shouldIssueTc ? 'TC_ISSUED' : 'DRAFT'
      };
      await api.post(`/students/${id}/exit-record`, payload);
      toast.success(shouldIssueTc 
        ? 'Withdrawal completed & Transfer Certificate issued successfully!' 
        : 'Exit record draft saved successfully!');
      navigate(`/school/admin/students/${id}`);
    } catch (err) {
      console.error('Failed to save exit record:', err);
      toast.error(err.response?.data?.message || 'Failed to save exit record');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <p className="text-sm font-bold text-slate-500">Loading Student Exit Workflow…</p>
        </div>
      </div>
    );
  }

  const prof = student?.studentProfile || {};
  const currentClassAndSection = getStudentClassName(student);

  return (
    <div className="w-full px-4 py-6 sm:px-6 lg:px-8 space-y-6">
      {/* Header & Navigation */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <button
            onClick={() => navigate(`/school/admin/students/${id}`)}
            className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-blue-600 transition-colors mb-2"
          >
            <ArrowLeft size={16} />
            Back to Student Profile
          </button>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
              Student Exit & TC Issuance Workflow
            </h1>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-black text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
              <Sparkles size={13} /> Official Clearance Portal
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => handleSubmit(false)}
            disabled={submitting}
            className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 transition-all disabled:opacity-50"
          >
            {submitting ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
            Save Draft
          </button>
          <button
            type="button"
            onClick={() => handleSubmit(true)}
            disabled={submitting}
            className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-blue-600/20 hover:brightness-110 transition-all disabled:opacity-50"
          >
            {submitting ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle2 size={15} />}
            Complete Withdrawal & Issue TC
          </button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid gap-8 lg:grid-cols-3">
        {/* Left 2 Columns: Main Exit Form & Clearances */}
        <div className="lg:col-span-2 space-y-6">
          {/* Student Overview Banner */}
          <div className="rounded-3xl border border-slate-200/80 bg-gradient-to-br from-white to-slate-50 p-6 shadow-sm dark:border-slate-800 dark:from-slate-900 dark:to-slate-950">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white font-extrabold text-xl shadow-md shadow-blue-600/20">
                  {student?.name?.charAt(0) || 'S'}
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">{student?.name || 'Student Name'}</h2>
                  <div className="mt-1 flex flex-wrap items-center gap-3 text-xs font-semibold text-slate-500 dark:text-slate-400">
                    <span className="flex items-center gap-1"><GraduationCap size={14} className="text-blue-600" /> {currentClassAndSection || 'Unassigned'}</span>
                    <span>•</span>
                    <span>Admission No: <strong className="text-slate-700 dark:text-slate-200">{prof.enrollmentNo || 'N/A'}</strong></span>
                  </div>
                </div>
              </div>
              <div className="rounded-2xl bg-blue-50/60 px-4 py-2 text-right dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/30">
                <p className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">Current Status</p>
                <p className="text-xs font-extrabold text-blue-950 dark:text-blue-100 uppercase">{prof.status || (student?.isActive ? 'ACTIVE' : 'INACTIVE')}</p>
              </div>
            </div>
          </div>

          {/* Section 1: Department Clearances */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-5">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="p-2 rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-900/30">
                <ShieldCheck size={20} />
              </div>
              <div>
                <h3 className="text-sm font-bold tracking-tight text-slate-900 dark:text-white uppercase tracking-wider">1. Department Clearances (No-Dues)</h3>
                <p className="text-xs text-slate-500">Verify department clearance statuses before issuing Transfer Certificate.</p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {/* Fee Clearance */}
              <div className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-200">Account / Fee Dues</span>
                  <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${form.feeClearanceStatus === 'CLEARED' ? 'bg-emerald-100 text-emerald-700' : form.feeClearanceStatus === 'PENDING' ? 'bg-amber-100 text-amber-700' : 'bg-slate-200 text-slate-700'}`}>
                    {form.feeClearanceStatus}
                  </span>
                </div>
                <div className="flex gap-1.5 pt-1">
                  {['CLEARED', 'PENDING', 'NOT_APPLICABLE'].map(status => (
                    <button
                      key={status}
                      type="button"
                      onClick={() => handleClearanceChange('feeClearanceStatus', status)}
                      className={`flex-1 py-1.5 rounded-xl text-[10px] font-bold transition-all ${form.feeClearanceStatus === status ? 'bg-blue-600 text-white shadow-sm' : 'bg-white dark:bg-slate-800 text-slate-600 border border-slate-200 dark:border-slate-700 hover:bg-slate-100'}`}
                    >
                      {status === 'NOT_APPLICABLE' ? 'N/A' : status}
                    </button>
                  ))}
                </div>
              </div>

              {/* Library Clearance */}
              <div className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-200">Library Books Return</span>
                  <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${form.libraryClearanceStatus === 'CLEARED' ? 'bg-emerald-100 text-emerald-700' : form.libraryClearanceStatus === 'PENDING' ? 'bg-amber-100 text-amber-700' : 'bg-slate-200 text-slate-700'}`}>
                    {form.libraryClearanceStatus}
                  </span>
                </div>
                <div className="flex gap-1.5 pt-1">
                  {['CLEARED', 'PENDING', 'NOT_APPLICABLE'].map(status => (
                    <button
                      key={status}
                      type="button"
                      onClick={() => handleClearanceChange('libraryClearanceStatus', status)}
                      className={`flex-1 py-1.5 rounded-xl text-[10px] font-bold transition-all ${form.libraryClearanceStatus === status ? 'bg-blue-600 text-white shadow-sm' : 'bg-white dark:bg-slate-800 text-slate-600 border border-slate-200 dark:border-slate-700 hover:bg-slate-100'}`}
                    >
                      {status === 'NOT_APPLICABLE' ? 'N/A' : status}
                    </button>
                  ))}
                </div>
              </div>

              {/* Hostel Clearance */}
              <div className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-200">Hostel & Mess Clearance</span>
                  <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${form.hostelClearanceStatus === 'CLEARED' ? 'bg-emerald-100 text-emerald-700' : form.hostelClearanceStatus === 'PENDING' ? 'bg-amber-100 text-amber-700' : 'bg-slate-200 text-slate-700'}`}>
                    {form.hostelClearanceStatus}
                  </span>
                </div>
                <div className="flex gap-1.5 pt-1">
                  {['CLEARED', 'PENDING', 'NOT_APPLICABLE'].map(status => (
                    <button
                      key={status}
                      type="button"
                      onClick={() => handleClearanceChange('hostelClearanceStatus', status)}
                      className={`flex-1 py-1.5 rounded-xl text-[10px] font-bold transition-all ${form.hostelClearanceStatus === status ? 'bg-blue-600 text-white shadow-sm' : 'bg-white dark:bg-slate-800 text-slate-600 border border-slate-200 dark:border-slate-700 hover:bg-slate-100'}`}
                    >
                      {status === 'NOT_APPLICABLE' ? 'N/A' : status}
                    </button>
                  ))}
                </div>
              </div>

              {/* Transport Clearance */}
              <div className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-200">Transport Clearance</span>
                  <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${form.transportClearanceStatus === 'CLEARED' ? 'bg-emerald-100 text-emerald-700' : form.transportClearanceStatus === 'PENDING' ? 'bg-amber-100 text-amber-700' : 'bg-slate-200 text-slate-700'}`}>
                    {form.transportClearanceStatus}
                  </span>
                </div>
                <div className="flex gap-1.5 pt-1">
                  {['CLEARED', 'PENDING', 'NOT_APPLICABLE'].map(status => (
                    <button
                      key={status}
                      type="button"
                      onClick={() => handleClearanceChange('transportClearanceStatus', status)}
                      className={`flex-1 py-1.5 rounded-xl text-[10px] font-bold transition-all ${form.transportClearanceStatus === status ? 'bg-blue-600 text-white shadow-sm' : 'bg-white dark:bg-slate-800 text-slate-600 border border-slate-200 dark:border-slate-700 hover:bg-slate-100'}`}
                    >
                      {status === 'NOT_APPLICABLE' ? 'N/A' : status}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Leaving & Academic Record Details */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-5">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="p-2 rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-900/30">
                <FileText size={20} />
              </div>
              <div>
                <h3 className="text-sm font-bold tracking-tight text-slate-900 dark:text-white uppercase tracking-wider">2. Leaving & Academic Record</h3>
                <p className="text-xs text-slate-500">Record last attended class, reason for transfer, and academic performance.</p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Date of Leaving *</label>
                <input
                  type="date"
                  value={form.leavingDate}
                  onChange={e => setForm(f => ({ ...f, leavingDate: e.target.value }))}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold outline-none focus:border-blue-600 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Last Class Attended *</label>
                <input
                  type="text"
                  value={form.lastClassAttended}
                  onChange={e => setForm(f => ({ ...f, lastClassAttended: e.target.value }))}
                  placeholder="e.g. Class 10 - A"
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold outline-none focus:border-blue-600 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Exam Result Status</label>
                <select
                  value={form.examResultStatus}
                  onChange={e => setForm(f => ({ ...f, examResultStatus: e.target.value }))}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold outline-none focus:border-blue-600 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                >
                  <option value="PASSED">Passed & Promoted</option>
                  <option value="FAILED">Failed</option>
                  <option value="DETAINED">Detained</option>
                  <option value="APPEARING">Appearing in Final Board</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Conduct & General Character</label>
                <input
                  type="text"
                  value={form.conductRemarks}
                  onChange={e => setForm(f => ({ ...f, conductRemarks: e.target.value }))}
                  placeholder="e.g. Good, Exemplary"
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold outline-none focus:border-blue-600 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Reason for Leaving School *</label>
                <input
                  type="text"
                  value={form.reasonForLeaving}
                  onChange={e => setForm(f => ({ ...f, reasonForLeaving: e.target.value }))}
                  placeholder="e.g. Parent Relocation, Higher Studies, Personal"
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold outline-none focus:border-blue-600 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">New Destination School / College (Optional)</label>
                <input
                  type="text"
                  value={form.destinationSchool}
                  onChange={e => setForm(f => ({ ...f, destinationSchool: e.target.value }))}
                  placeholder="Name of destination school or institute"
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold outline-none focus:border-blue-600 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Issued Documents Checklist */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-4">
            <h3 className="text-sm font-bold tracking-tight text-slate-900 dark:text-white uppercase tracking-wider">3. Documents Handed Over to Student / Parent</h3>
            <div className="grid gap-2 sm:grid-cols-2">
              {[
                'Transfer Certificate',
                'Character Certificate',
                'Report Card / Marksheet',
                'Migration Certificate',
                'Medical / Health Record',
                'Sports & Co-curricular Certificates'
              ].map(doc => {
                const isChecked = (form.documentsIssued || []).includes(doc);
                return (
                  <button
                    key={doc}
                    type="button"
                    onClick={() => handleDocumentToggle(doc)}
                    className={`flex items-center gap-3 rounded-2xl border p-3 text-xs font-bold text-left transition-all ${isChecked ? 'border-blue-600 bg-blue-50/50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300' : 'border-slate-200 dark:border-slate-800 text-slate-600 hover:bg-slate-50'}`}
                  >
                    <div className={`grid h-5 w-5 place-items-center rounded-lg ${isChecked ? 'bg-blue-600 text-white' : 'border border-slate-300 dark:border-slate-700'}`}>
                      {isChecked && <CheckCircle2 size={12} />}
                    </div>
                    <span>{doc}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right 1 Column: Signatory, Serial & Final Execution Card */}
        <div className="space-y-6">
          {/* Official TC & Authorization Card */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-5">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="p-2 rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-900/30">
                <Award size={20} />
              </div>
              <div>
                <h3 className="text-sm font-bold tracking-tight text-slate-900 dark:text-white uppercase tracking-wider">Official TC Details</h3>
                <p className="text-xs text-slate-500">Serial number & signatory credentials.</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">TC Serial Number</label>
                <input
                  type="text"
                  value={form.tcNumber}
                  onChange={e => setForm(f => ({ ...f, tcNumber: e.target.value }))}
                  placeholder="Auto-generated e.g. TC/2026/001"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs font-mono font-bold text-blue-700 outline-none focus:border-blue-600 dark:border-slate-800 dark:bg-slate-950 dark:text-blue-400"
                />
                <p className="text-[10px] text-slate-400 mt-1">Leave empty to auto-generate sequential TC serial number.</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">TC Issue Date</label>
                <input
                  type="date"
                  value={form.tcIssueDate}
                  onChange={e => setForm(f => ({ ...f, tcIssueDate: e.target.value }))}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold outline-none focus:border-blue-600 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Authorized Signatory Name</label>
                <input
                  type="text"
                  value={form.authorizedSignatoryName}
                  onChange={e => setForm(f => ({ ...f, authorizedSignatoryName: e.target.value }))}
                  placeholder="e.g. Dr. A. Sharma"
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold outline-none focus:border-blue-600 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Signatory Role / Designation</label>
                <input
                  type="text"
                  value={form.authorizedSignatoryRole}
                  onChange={e => setForm(f => ({ ...f, authorizedSignatoryRole: e.target.value }))}
                  placeholder="Principal / Vice Principal"
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold outline-none focus:border-blue-600 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* Action Execution Banner */}
          <div className="rounded-3xl bg-gradient-to-br from-blue-600 to-indigo-600 p-6 text-white shadow-xl shadow-blue-600/20 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-2xl bg-white/20">
                <UserX size={24} />
              </div>
              <div>
                <h4 className="text-base font-extrabold">Final Exit Approval</h4>
                <p className="text-xs text-blue-100">Updates student status to TRANSFERRED_LEFT and deactivates portal access.</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleSubmit(true)}
              disabled={submitting}
              className="w-full flex items-center justify-center gap-2 rounded-2xl bg-white px-4 py-3.5 text-xs font-extrabold text-blue-700 shadow-md hover:bg-blue-50 transition-all disabled:opacity-50 uppercase tracking-wider"
            >
              {submitting ? <Loader2 size={16} className="animate-spin text-blue-700" /> : <CheckCircle2 size={16} className="text-blue-700" />}
              Complete Withdrawal & Issue TC
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
