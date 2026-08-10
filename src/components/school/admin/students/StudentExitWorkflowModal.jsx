import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, AlertTriangle, CheckCircle2, Clock, Printer, FileText, 
  ShieldCheck, Loader2, UserX, ChevronRight, ChevronLeft, Building, HelpCircle, Check, Award
} from 'lucide-react';
import api from '@/lib/api/school-client';
import { toast } from 'sonner';

export default function StudentExitWorkflowModal({ student, isOpen, onClose, onSuccess }) {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [exitRecord, setExitRecord] = useState(null);

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

  const [form, setForm] = useState({
    leavingDate: new Date().toISOString().split('T')[0],
    lastClassAttended: '',
    reasonForLeaving: 'Parent Request / School Transfer',
    destinationSchool: '',
    examResultStatus: 'PASSED',
    conductRemarks: 'Good',
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
    if (isOpen && student?.id) {
      fetchExitRecord();
    }
  }, [isOpen, student?.id]);

  const fetchExitRecord = async () => {
    setLoading(true);
    const defaultClassName = getStudentClassName(student);
    try {
      const res = await api.get(`/students/${student.id}/exit-record`);
      const data = res.data?.data ?? res.data;
      if (data) {
        setExitRecord(data);
        setForm(prev => ({
          ...prev,
          leavingDate: data.leavingDate ? new Date(data.leavingDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          lastClassAttended: data.lastClassAttended || defaultClassName,
          reasonForLeaving: data.reasonForLeaving || prev.reasonForLeaving,
          destinationSchool: data.destinationSchool || '',
          examResultStatus: data.examResultStatus || 'PASSED',
          conductRemarks: data.conductRemarks || 'Good',
          feeClearanceStatus: data.feeClearanceStatus || 'CLEARED',
          libraryClearanceStatus: data.libraryClearanceStatus || 'CLEARED',
          hostelClearanceStatus: data.hostelClearanceStatus || 'NOT_APPLICABLE',
          transportClearanceStatus: data.transportClearanceStatus || 'NOT_APPLICABLE',
          documentsIssued: Array.isArray(data.documentsIssued) ? data.documentsIssued : prev.documentsIssued,
          authorizedSignatoryName: data.authorizedSignatoryName || 'Principal',
          authorizedSignatoryRole: data.authorizedSignatoryRole || 'Principal',
          tcNumber: data.tcNumber || '',
          tcIssueDate: data.tcIssueDate ? new Date(data.tcIssueDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
        }));
      } else {
        setForm(prev => ({ ...prev, lastClassAttended: defaultClassName }));
      }
    } catch (err) {
      console.error('Failed to load exit record:', err);
      setForm(prev => ({ ...prev, lastClassAttended: defaultClassName }));
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const handleSaveDraft = async () => {
    setIsSubmitting(true);
    try {
      await api.post(`/students/${student.id}/exit-record`, {
        ...form,
        issueTc: false
      });
      toast.success('Exit record draft saved successfully');
      onSuccess?.();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save exit record');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleIssueTc = async () => {
    setIsSubmitting(true);
    try {
      const res = await api.post(`/students/${student.id}/exit-record`, {
        ...form,
        issueTc: true
      });
      const data = res.data?.data ?? res.data;
      setExitRecord(data);
      toast.success('Transfer Certificate (TC) record saved & student status updated to Transferred/Left School!');
      onSuccess?.();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to issue Transfer Certificate');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(6px)' }}>
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-3xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 px-6 py-5 flex items-center justify-between text-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center">
              <UserX size={20} />
            </div>
            <div>
              <h3 className="text-lg font-bold">Student Exit & TC Issuance Workflow</h3>
              <p className="text-xs font-semibold text-amber-100">{student?.name} ({student?.studentProfile?.enrollmentNo || '—'})</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center hover:bg-white/30 transition-all">
            <X size={18} />
          </button>
        </div>

        {/* Steps Tab Bar */}
        <div className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-6 py-3 flex gap-2 shrink-0 overflow-x-auto">
          {[
            { id: 1, label: '1. Exit Request Info' },
            { id: 2, label: '2. Department Clearances' },
            { id: 3, label: '3. TC & Approval' },
          ].map(st => (
            <button
              key={st.id}
              onClick={() => setCurrentStep(st.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${currentStep === st.id ? 'bg-amber-500 text-white shadow-md' : 'text-slate-500 hover:bg-slate-200/60 dark:hover:bg-slate-800'}`}
            >
              {st.label}
            </button>
          ))}
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {loading ? (
            <div className="py-20 text-center text-slate-400 font-bold flex items-center justify-center gap-2">
              <Loader2 className="animate-spin" size={20} /> Loading exit workflow...
            </div>
          ) : (
            <>
              {currentStep === 1 && (
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-amber-50 border border-amber-100 flex items-center gap-3 text-xs text-amber-900 font-semibold">
                    <AlertTriangle className="text-amber-600 shrink-0" size={20} />
                    <span>Initiating student withdrawal. Please verify the exit request details below.</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Date of Leaving *</label>
                      <input
                        type="date"
                        value={form.leavingDate}
                        onChange={e => setForm(f => ({ ...f, leavingDate: e.target.value }))}
                        className="w-full rounded-2xl border border-slate-200 p-3 text-sm font-semibold outline-none focus:border-amber-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Last Class Attended</label>
                      <input
                        type="text"
                        value={form.lastClassAttended}
                        onChange={e => setForm(f => ({ ...f, lastClassAttended: e.target.value }))}
                        placeholder="e.g. Class X - Section A"
                        className="w-full rounded-2xl border border-slate-200 p-3 text-sm font-semibold outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Reason for Leaving *</label>
                      <input
                        type="text"
                        value={form.reasonForLeaving}
                        onChange={e => setForm(f => ({ ...f, reasonForLeaving: e.target.value }))}
                        placeholder="Parent request / relocation / completed course"
                        className="w-full rounded-2xl border border-slate-200 p-3 text-sm font-semibold outline-none focus:border-amber-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Next / Destination School</label>
                      <input
                        type="text"
                        value={form.destinationSchool}
                        onChange={e => setForm(f => ({ ...f, destinationSchool: e.target.value }))}
                        placeholder="Name of new school/college (if known)"
                        className="w-full rounded-2xl border border-slate-200 p-3 text-sm font-semibold outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Exam / Result Status</label>
                      <select
                        value={form.examResultStatus}
                        onChange={e => setForm(f => ({ ...f, examResultStatus: e.target.value }))}
                        className="w-full rounded-2xl border border-slate-200 p-3 text-sm font-semibold outline-none focus:border-amber-500 bg-white"
                      >
                        <option value="PASSED">Passed & Promoted</option>
                        <option value="FAILED">Failed / Detained</option>
                        <option value="APPEARED">Appeared in Exam</option>
                        <option value="NOT_APPEARED">Did Not Appear</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Conduct & Character</label>
                      <input
                        type="text"
                        value={form.conductRemarks}
                        onChange={e => setForm(f => ({ ...f, conductRemarks: e.target.value }))}
                        placeholder="e.g. Good / Exemplary"
                        className="w-full rounded-2xl border border-slate-200 p-3 text-sm font-semibold outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              {currentStep === 2 && (
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-blue-50 border border-blue-100 text-xs text-blue-900 font-semibold">
                    Verify no-dues status across all school departments before issuing Transfer Certificate.
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50 flex items-center justify-between">
                      <div>
                        <p className="text-xs font-bold text-slate-700">Fee No-Dues Clearance</p>
                        <p className="text-[11px] text-slate-400">Tuition & transport fee records</p>
                      </div>
                      <select
                        value={form.feeClearanceStatus}
                        onChange={e => setForm(f => ({ ...f, feeClearanceStatus: e.target.value }))}
                        className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-bold outline-none bg-white"
                      >
                        <option value="CLEARED">CLEARED</option>
                        <option value="PENDING">PENDING</option>
                      </select>
                    </div>

                    <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50 flex items-center justify-between">
                      <div>
                        <p className="text-xs font-bold text-slate-700">Library Clearance</p>
                        <p className="text-[11px] text-slate-400">Borrowed books & fines</p>
                      </div>
                      <select
                        value={form.libraryClearanceStatus}
                        onChange={e => setForm(f => ({ ...f, libraryClearanceStatus: e.target.value }))}
                        className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-bold outline-none bg-white"
                      >
                        <option value="CLEARED">CLEARED</option>
                        <option value="PENDING">PENDING</option>
                      </select>
                    </div>

                    <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50 flex items-center justify-between">
                      <div>
                        <p className="text-xs font-bold text-slate-700">Hostel Clearance</p>
                        <p className="text-[11px] text-slate-400">Boarding & mess dues</p>
                      </div>
                      <select
                        value={form.hostelClearanceStatus}
                        onChange={e => setForm(f => ({ ...f, hostelClearanceStatus: e.target.value }))}
                        className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-bold outline-none bg-white"
                      >
                        <option value="CLEARED">CLEARED</option>
                        <option value="PENDING">PENDING</option>
                        <option value="NOT_APPLICABLE">NOT APPLICABLE</option>
                      </select>
                    </div>

                    <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50 flex items-center justify-between">
                      <div>
                        <p className="text-xs font-bold text-slate-700">Transport Clearance</p>
                        <p className="text-[11px] text-slate-400">Bus pass & route dues</p>
                      </div>
                      <select
                        value={form.transportClearanceStatus}
                        onChange={e => setForm(f => ({ ...f, transportClearanceStatus: e.target.value }))}
                        className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-bold outline-none bg-white"
                      >
                        <option value="CLEARED">CLEARED</option>
                        <option value="PENDING">PENDING</option>
                        <option value="NOT_APPLICABLE">NOT APPLICABLE</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {currentStep === 3 && (
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100 text-xs text-emerald-900 font-semibold flex items-center gap-2">
                    <ShieldCheck className="text-emerald-600 shrink-0" size={18} />
                    <span>Final Approval & Transfer Certificate Generation.</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">TC Serial Number (Auto if blank)</label>
                      <input
                        type="text"
                        value={form.tcNumber}
                        onChange={e => setForm(f => ({ ...f, tcNumber: e.target.value }))}
                        placeholder="Auto generated (e.g. TC/2026/001)"
                        className="w-full rounded-2xl border border-slate-200 p-3 text-sm font-semibold outline-none focus:border-amber-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">TC Issue Date</label>
                      <input
                        type="date"
                        value={form.tcIssueDate}
                        onChange={e => setForm(f => ({ ...f, tcIssueDate: e.target.value }))}
                        className="w-full rounded-2xl border border-slate-200 p-3 text-sm font-semibold outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Authorized Signatory Name</label>
                      <input
                        type="text"
                        value={form.authorizedSignatoryName}
                        onChange={e => setForm(f => ({ ...f, authorizedSignatoryName: e.target.value }))}
                        className="w-full rounded-2xl border border-slate-200 p-3 text-sm font-semibold outline-none focus:border-amber-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Signatory Role</label>
                      <input
                        type="text"
                        value={form.authorizedSignatoryRole}
                        onChange={e => setForm(f => ({ ...f, authorizedSignatoryRole: e.target.value }))}
                        className="w-full rounded-2xl border border-slate-200 p-3 text-sm font-semibold outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>

                  <div className="pt-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Documents Issued to Student</label>
                    <div className="flex flex-wrap gap-2">
                      {['Transfer Certificate', 'Character Certificate', 'Report Card', 'Migration Certificate', 'Fee Clearance Cert'].map(doc => {
                        const isSelected = form.documentsIssued.includes(doc);
                        return (
                          <button
                            key={doc}
                            type="button"
                            onClick={() => {
                              setForm(f => ({
                                ...f,
                                documentsIssued: isSelected
                                  ? f.documentsIssued.filter(d => d !== doc)
                                  : [...f.documentsIssued, doc]
                              }));
                            }}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors ${isSelected ? 'bg-amber-500 text-white border-amber-500' : 'bg-slate-50 text-slate-600 border-slate-200'}`}
                          >
                            {isSelected ? '✓ ' : '+ '}{doc}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-slate-100 dark:border-slate-800 p-4 bg-slate-50 dark:bg-slate-950 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="text-xs font-semibold text-slate-400">
            Exit status & clearance data will be saved to official records.
          </div>
          
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button onClick={onClose} type="button" className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-200/50">
              Cancel
            </button>

            <button onClick={handleSaveDraft} disabled={isSubmitting} type="button" className="px-4 py-2.5 rounded-xl border border-amber-200 bg-amber-50 text-amber-800 text-xs font-bold hover:bg-amber-100 transition-colors">
              Save Draft
            </button>

            {currentStep < 3 ? (
              <button onClick={() => setCurrentStep(s => s + 1)} type="button" className="px-5 py-2.5 rounded-xl bg-amber-500 text-white text-xs font-bold hover:bg-amber-600 transition-colors flex items-center gap-1">
                Next <ChevronRight size={14} />
              </button>
            ) : (
              <button onClick={handleIssueTc} disabled={isSubmitting} type="button" className="px-6 py-2.5 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 transition-all shadow-lg shadow-rose-600/20 flex items-center gap-1.5">
                {isSubmitting ? <Loader2 className="animate-spin" size={14} /> : <CheckCircle2 size={14} />}
                Complete Withdrawal & Issue Exit Record
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
