import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  User, GraduationCap, Calendar, BarChart2, DollarSign, 
  Mail, Smartphone, MapPin, ArrowLeft, Download, 
  Edit2, Clock, CheckCircle, AlertCircle, TrendingUp, HeartPulse, Briefcase, FileText, Printer, Share2, Loader2
} from 'lucide-react';
import api from '@/lib/api/school-client';
import Modal from '@/components/school/admin/Modal';
import StudentForm from '@/components/school/admin/forms/StudentForm';
import { exportToPDF } from "../../../lib/school/pdfExport";
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

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
        : 'border-transparent bg-transparent text-slate-500 hover:border-slate-200 hover:bg-slate-50 hover:text-slate-900 dark:hover:bg-slate-900/70 dark:hover:text-white'}
    `}
  >
    <Icon size={18} />
    {label}
  </button>
);

const DetailItem = ({ label, value, icon: Icon }) => (
  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800">
    <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
      {Icon && <Icon size={12} />}
      {label}
    </div>
    <div className="text-sm font-bold text-slate-900 dark:text-white">{value || 'â€”'}</div>
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

  useEffect(() => {
    fetchStudent();
  }, [id]);

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

  const fetchStudent = async () => {
    try {
      const res = await api.get(`/students/${id}`);
      setStudent(res.data?.data ?? res.data);
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
          <h2 className="text-xl font-black text-red-900 mb-2">Student Not Found</h2>
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

  const profile = student.studentProfile || {};

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
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50 transition-all disabled:opacity-50"
          >
            {exporting ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
            Export PDF
          </button>
          <button onClick={() => setIsEditOpen(true)} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white font-bold text-sm hover:bg-blue-700 shadow-lg shadow-blue-600/20 transition-all">
            <Edit2 size={18} />
            Edit Profile
          </button>
        </div>
      </div>

      <Modal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} title="Edit Student" size="full">
        <StudentForm
          student={student}
          onCancel={() => setIsEditOpen(false)}
          isLoading={isSaving}
          onSubmit={async (formData) => {
            setIsSaving(true);
            try {
              await api.put(`/students/${student.id}`, formData);
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
              {student.photo ? (
                <img src={student.photo} alt={student.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-blue-600/10 text-4xl font-black text-blue-700">
                  {getInitials(student.name)}
                </div>
              )}
            </div>
            <div className="flex-1 pb-4">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">{student.name}</h1>
                <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 text-[10px] font-black uppercase tracking-widest border border-emerald-500/20">Active</span>
              </div>
              <div className="flex flex-wrap gap-6 text-sm font-bold text-slate-500">
                <div className="flex items-center gap-2"><GraduationCap size={18} className="text-blue-500" /> Class {profile.section?.class?.name || 'â€”'} - {profile.section?.name || 'â€”'}</div>
                <div className="flex items-center gap-2"><Smartphone size={18} className="text-blue-500" /> {student.phone || 'â€”'}</div>
                <div className="flex items-center gap-2"><Mail size={18} className="text-blue-500" /> {student.email}</div>
              </div>
            </div>
            <div className="pb-4 hidden lg:block text-right">
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Enrollment No</div>
              <div className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter">{profile.enrollmentNo || 'â€”'}</div>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 border-b border-slate-100 dark:border-slate-800 -mx-12 mb-8 px-12 pb-6 overflow-x-auto no-scrollbar">
            <TabButton active={activeTab === 'personal'} onClick={() => setActiveTab('personal')} icon={User} label="Personal" />
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
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="md:col-span-2 space-y-8">
                    <div>
                      <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest mb-4">Identity Details</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <DetailItem label="Full Name" value={student.name} icon={User} />
                        <DetailItem label="Date of Birth" value={profile.dob ? new Date(profile.dob).toLocaleDateString() : 'â€”'} icon={Calendar} />
                        <DetailItem label="Gender" value={profile.gender} icon={User} />
                        <DetailItem label="Blood Group" value={profile.bloodGroup} icon={HeartPulse} />
                        <DetailItem label="National ID" value={profile.nationalId || 'Verified'} icon={CheckCircle} />
                      </div>
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest mb-4">Contact Information</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <DetailItem label="Primary Email" value={student.email} icon={Mail} />
                        <DetailItem label="Phone Number" value={student.phone} icon={Smartphone} />
                        <DetailItem label="Address" value={profile.address} icon={MapPin} className="col-span-2" />
                      </div>
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest mb-4">Parent / Guardian Details</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <DetailItem label="Father's Name" value={profile.fatherName} />
                        <DetailItem label="Mother's Name" value={profile.motherName} />
                        <DetailItem label="Guardian Phone" value={profile.parentPhone} icon={Smartphone} />
                        <DetailItem label="Guardian Email" value={profile.parentEmail} icon={Mail} />
                        <DetailItem label="Occupation" value={profile.parentOccupation} icon={Briefcase} />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-6">
                    <div className="p-6 rounded-3xl bg-blue-600 text-white shadow-xl shadow-blue-600/20">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-xs font-black uppercase tracking-widest opacity-80">Medical Alert</h4>
                        <AlertCircle size={20} />
                      </div>
                      <p className="text-sm font-bold leading-relaxed mb-4">
                        {profile.medicalConditions || 'No significant medical conditions reported.'}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <span className="px-2 py-1 rounded-lg bg-white/20 text-[10px] font-black uppercase">Blood: {profile.bloodGroup || 'â€”'}</span>
                        <span className="px-2 py-1 rounded-lg bg-white/20 text-[10px] font-black uppercase">Allergy: {profile.allergies || 'None'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'academic' && (
                <div className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <DetailItem label="Current Class" value={profile.section?.class?.name || 'â€”'} icon={GraduationCap} />
                    <DetailItem label="Section" value={profile.section?.name || 'â€”'} />
                    <DetailItem label="Roll Number" value={profile.rollNo || 'â€”'} />
                    <DetailItem label="Admission Date" value={profile.admissionDate ? new Date(profile.admissionDate).toLocaleDateString() : 'â€”'} icon={Clock} />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest mb-4">Subject Performance Overview</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {['Mathematics', 'Physics', 'Chemistry', 'English', 'History'].map(sub => (
                        <div key={sub} className="p-4 rounded-2xl border border-slate-100 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center font-bold text-blue-600">
                              {sub.charAt(0)}
                            </div>
                            <div className="text-sm font-bold text-slate-700">{sub}</div>
                          </div>
                          <div className="text-right">
                            <div className="text-[10px] font-black text-slate-400 uppercase">Grade</div>
                            <div className="text-sm font-black text-blue-600">A+</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'attendance' && (
                <div className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="p-8 rounded-[2rem] bg-slate-50 dark:bg-slate-900/50 border border-slate-100 text-center">
                      <div className="text-5xl font-black text-blue-600 mb-2">94%</div>
                      <div className="text-xs font-black text-slate-400 uppercase tracking-widest">Attendance Average</div>
                    </div>
                    <div className="p-8 rounded-[2rem] bg-emerald-500/10 border border-emerald-500/20 text-center text-emerald-600">
                      <div className="text-5xl font-black mb-2">172</div>
                      <div className="text-xs font-black uppercase tracking-widest">Days Present</div>
                    </div>
                    <div className="p-8 rounded-[2rem] bg-red-500/10 border border-red-500/20 text-center text-red-500">
                      <div className="text-5xl font-black mb-2">12</div>
                      <div className="text-xs font-black uppercase tracking-widest">Days Absent</div>
                    </div>
                  </div>
                  <div className="rounded-3xl border border-slate-100 overflow-hidden">
                    <table className="w-full text-left">
                      <thead className="bg-slate-50 border-b border-slate-100">
                        <tr>
                          <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Date</th>
                          <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                          <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Remarks</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50 text-sm">
                        {[1, 2, 3, 4, 5].map(i => (
                          <tr key={i}>
                            <td className="p-4 font-bold text-slate-600">May {12-i}, 2026</td>
                            <td className="p-4">
                              <span className="px-2 py-1 rounded-lg bg-emerald-500/10 text-emerald-600 text-[10px] font-black uppercase">Present</span>
                            </td>
                            <td className="p-4 text-slate-400">On Time</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {activeTab === 'performance' && (
                <div className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="p-8 rounded-[2.5rem] bg-white border border-slate-100 shadow-xl shadow-slate-100/50">
                      <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-6 flex items-center gap-2">
                        <TrendingUp size={18} className="text-blue-600" />
                        GPA Trend
                      </h4>
                      <div className="h-48 flex items-end justify-between gap-2">
                        {[60, 80, 75, 90, 85, 95].map((h, i) => (
                          <div key={i} className="flex-1 bg-blue-100 rounded-t-xl relative group">
                            <div className="absolute inset-0 bg-blue-600 rounded-t-xl transition-all duration-500" style={{ height: `${h}%` }} />
                            <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] font-black text-slate-400">Term {i+1}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div className="p-6 rounded-3xl bg-slate-900 text-white">
                        <h5 className="text-xs font-black uppercase tracking-widest opacity-60 mb-2">Teacher's Remark</h5>
                        <p className="text-sm font-bold italic">
                          "Deepak has shown exceptional growth in logical reasoning this term. He consistently helps his peers during lab sessions."
                        </p>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 rounded-2xl bg-slate-50 text-center border border-slate-100">
                          <div className="text-2xl font-black text-blue-600">3.8</div>
                          <div className="text-[10px] font-black text-slate-400 uppercase">Current GPA</div>
                        </div>
                        <div className="p-4 rounded-2xl bg-slate-50 text-center border border-slate-100">
                          <div className="text-2xl font-black text-emerald-600">Top 5%</div>
                          <div className="text-[10px] font-black text-slate-400 uppercase">Class Rank</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'fees' && (
                <div className="space-y-8">
                  <div className="p-8 rounded-[2.5rem] bg-indigo-600 text-white flex flex-col md:flex-row items-center justify-between gap-8">
                    <div>
                      <div className="text-xs font-black uppercase tracking-widest opacity-70 mb-1">Total Outstanding</div>
                      <div className="text-5xl font-black tracking-tighter">â‚¹ 12,500</div>
                    </div>
                    <button className="px-8 py-4 rounded-2xl bg-white text-indigo-600 font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all">
                      Pay Now
                    </button>
                  </div>
                  <div className="rounded-3xl border border-slate-100 overflow-hidden">
                    <table className="w-full text-left">
                      <thead className="bg-slate-50 border-b border-slate-100">
                        <tr>
                          <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Invoice</th>
                          <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Due Date</th>
                          <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Amount</th>
                          <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50 text-sm font-bold">
                        {[1, 2, 3].map(i => (
                          <tr key={i}>
                            <td className="p-4 text-slate-900">#INV-2026-00{i}</td>
                            <td className="p-4 text-slate-500">June 15, 2026</td>
                            <td className="p-4 text-slate-900">â‚¹ 4,500</td>
                            <td className="p-4">
                              <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase ${i === 1 ? 'bg-red-500/10 text-red-500' : 'bg-emerald-500/10 text-emerald-600'}`}>
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
