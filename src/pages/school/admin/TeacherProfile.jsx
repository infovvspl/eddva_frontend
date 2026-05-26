import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  User, BookOpen, Calendar, BarChart2, Briefcase, 
  Mail, Smartphone, MapPin, ArrowLeft, Download, 
  Edit2, Clock, CheckCircle, Award, Globe, Building,
  Printer, Share2, Loader2, FileText
} from 'lucide-react';
import api from '@/lib/api/school-client';
import { motion, AnimatePresence } from 'framer-motion';
import { exportToPDF } from "../../../lib/school/pdfExport";
import { toast } from 'sonner';

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

export default function TeacherProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [teacher, setTeacher] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('personal');

  useEffect(() => {
    fetchTeacher();
  }, [id]);

  const fetchTeacher = async () => {
    try {
      const res = await api.get(`/teachers/${id}`);
      setTeacher(res.data?.data ?? res.data);
    } catch (err) {
      console.error(err);
      setTeacher(null);
    } finally {
      setLoading(false);
    }
  };

  const [exporting, setExporting] = useState(false);

  const handleExportPDF = async () => {
    setExporting(true);
    try {
      await exportToPDF('teacher-profile-content', `Teacher_Profile_${teacher.name.replace(/\s+/g, '_')}.pdf`);
      toast.success('PDF report generated successfully');
    } catch (err) {
      console.error(err);
      toast.error('Failed to generate PDF report');
    } finally {
      setExporting(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-slate-500 font-bold animate-pulse">Loading Profile...</div>;
  if (!teacher) return <div className="p-8 text-center text-red-500">Teacher not found.</div>;

  const profile = teacher.teacherProfile || {};

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
        <div className="flex flex-wrap gap-2">
          <button 
            onClick={handleExportPDF}
            disabled={exporting}
            className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-black uppercase tracking-widest text-white shadow-lg shadow-blue-600/20 hover:brightness-110 active:scale-95 transition-all disabled:opacity-50"
          >
            {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
            Export PDF
          </button>
          <button className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
            <Printer size={18} />
          </button>
          <button className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
            <Share2 size={18} />
          </button>
        </div>
      </div>

      {/* Main Profile Card for Export */}
      <div id="teacher-profile-content" className="bg-white dark:bg-slate-950 rounded-[2.5rem] shadow-2xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-800 overflow-hidden mb-8">
        <div className="h-40 bg-gradient-to-r from-blue-600 to-indigo-700" />
        <div className="px-12 pb-12 -mt-20">
          <div className="flex flex-col md:flex-row items-end gap-8 mb-8">
            <div className="w-48 h-48 rounded-[3rem] border-8 border-white dark:border-slate-950 overflow-hidden bg-slate-100 shadow-2xl">
              {teacher.photo ? (
                <img src={teacher.photo} alt={teacher.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-blue-600/10 text-5xl font-black text-blue-700">
                  {(teacher.name || 'T').slice(0, 1).toUpperCase()}
                </div>
              )}
            </div>
            <div className="flex-1 pb-4">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">{teacher.name}</h1>
                <span className="px-3 py-1 rounded-full bg-blue-500/10 text-blue-600 text-[10px] font-black uppercase tracking-widest border border-blue-500/20">Permanent</span>
              </div>
              <div className="flex flex-wrap gap-6 text-sm font-bold text-slate-500">
                <div className="flex items-center gap-2"><Briefcase size={18} className="text-blue-500" /> {profile.role || 'Senior Teacher'}</div>
                <div className="flex items-center gap-2"><Building size={18} className="text-blue-500" /> {profile.department || 'Science Department'}</div>
                <div className="flex items-center gap-2"><Mail size={18} className="text-blue-500" /> {teacher.email}</div>
              </div>
            </div>
            <div className="pb-4 hidden lg:block text-right">
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Employee ID</div>
              <div className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter">{profile.employeeId || 'â€”'}</div>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 border-b border-slate-100 dark:border-slate-800 -mx-12 mb-8 px-12 pb-6 overflow-x-auto no-scrollbar">
            <TabButton active={activeTab === 'personal'} onClick={() => setActiveTab('personal')} icon={User} label="Personal Details" />
            <TabButton active={activeTab === 'academic'} onClick={() => setActiveTab('academic')} icon={BookOpen} label="Subjects & Classes" />
            <TabButton active={activeTab === 'attendance'} onClick={() => setActiveTab('attendance')} icon={Calendar} label="Attendance" />
            <TabButton active={activeTab === 'performance'} onClick={() => setActiveTab('performance')} icon={BarChart2} label="Performance" />
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
                      <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest mb-4">Core Identification</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <DetailItem label="Full Name" value={teacher.name} icon={User} />
                        <DetailItem label="Joining Date" value={profile.joiningDate ? new Date(profile.joiningDate).toLocaleDateString() : 'â€”'} icon={Clock} />
                        <DetailItem label="Qualifications" value={profile.qualifications} icon={Award} className="col-span-2" />
                      </div>
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest mb-4">Contact Info</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <DetailItem label="Work Email" value={teacher.email} icon={Mail} />
                        <DetailItem label="Phone Number" value={teacher.phone} icon={Smartphone} />
                        <DetailItem label="Nationality" value="Indian" icon={Globe} />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-6">
                    <div className="p-6 rounded-3xl bg-slate-900 text-white shadow-2xl">
                      <h4 className="text-xs font-black uppercase tracking-widest opacity-60 mb-4">Department Lead Info</h4>
                      <div className="flex items-center gap-4 mb-6">
                        <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center font-bold">SM</div>
                        <div>
                          <div className="text-sm font-black">Sarah Miller</div>
                          <div className="text-[10px] font-bold opacity-60">Head of Science</div>
                        </div>
                      </div>
                      <button className="w-full py-3 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-black uppercase tracking-widest transition-all">
                        Contact HOD
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'academic' && (
                <div className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                      <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest mb-4">Assigned Subjects</h3>
                      <div className="space-y-3">
                        {['Advanced Physics', 'Quantum Mechanics', 'Thermodynamics'].map(sub => (
                          <div key={sub} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center">
                                <BookOpen size={20} />
                              </div>
                              <span className="text-sm font-bold text-slate-700">{sub}</span>
                            </div>
                            <span className="px-2 py-1 rounded-lg bg-blue-500/10 text-blue-600 text-[10px] font-black uppercase">Active</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest mb-4">Class Management</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 rounded-2xl border border-slate-100 text-center">
                          <div className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Assigned Classes</div>
                          <div className="text-3xl font-black text-slate-900">12</div>
                        </div>
                        <div className="p-4 rounded-2xl border border-slate-100 text-center">
                          <div className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Active Sections</div>
                          <div className="text-3xl font-black text-slate-900">24</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'attendance' && (
                <div className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="p-6 rounded-3xl bg-slate-50 border border-slate-100 text-center">
                      <div className="text-3xl font-black text-blue-600">98%</div>
                      <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Efficiency</div>
                    </div>
                    <div className="p-6 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 text-center">
                      <div className="text-3xl font-black text-emerald-600">22</div>
                      <div className="text-[10px] font-black uppercase tracking-widest">Days Present</div>
                    </div>
                    <div className="p-6 rounded-3xl bg-red-500/10 border border-red-500/20 text-center">
                      <div className="text-3xl font-black text-red-500">1</div>
                      <div className="text-[10px] font-black uppercase tracking-widest">Sick Leave</div>
                    </div>
                    <div className="p-6 rounded-3xl bg-orange-500/10 border border-orange-500/20 text-center">
                      <div className="text-3xl font-black text-orange-500">0</div>
                      <div className="text-[10px] font-black uppercase tracking-widest">Late Arrivals</div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'performance' && (
                <div className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-2 p-8 rounded-[2.5rem] bg-white border border-slate-100 shadow-xl">
                      <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-6">Student Success Rate</h4>
                      <div className="flex items-center gap-12">
                        <div className="relative w-40 h-40 flex items-center justify-center">
                           <svg className="w-full h-full -rotate-90">
                              <circle cx="80" cy="80" r="70" fill="none" stroke="#f1f5f9" strokeWidth="20" />
                              <circle cx="80" cy="80" r="70" fill="none" stroke="#2563eb" strokeWidth="20" strokeDasharray="440" strokeDashoffset="44" strokeLinecap="round" />
                           </svg>
                           <div className="absolute text-center">
                              <div className="text-3xl font-black text-slate-900">90%</div>
                              <div className="text-[10px] font-black text-slate-400 uppercase">Avg Pass</div>
                           </div>
                        </div>
                        <div className="flex-1 space-y-4">
                           <div className="flex items-center justify-between">
                              <span className="text-sm font-bold text-slate-600 uppercase tracking-wider">Teaching Quality</span>
                              <span className="text-sm font-black text-blue-600">4.9/5.0</span>
                           </div>
                           <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                              <div className="h-full bg-blue-600 w-[98%]" />
                           </div>
                           <div className="flex items-center justify-between">
                              <span className="text-sm font-bold text-slate-600 uppercase tracking-wider">Curriculum Pacing</span>
                              <span className="text-sm font-black text-emerald-600">Optimal</span>
                           </div>
                        </div>
                      </div>
                    </div>
                    <div className="p-8 rounded-[2.5rem] bg-blue-600 text-white text-center flex flex-col justify-center">
                       <Award size={48} className="mx-auto mb-4 opacity-40" />
                       <h4 className="text-xl font-black mb-1">Teacher of the Month</h4>
                       <p className="text-xs font-bold opacity-70 uppercase tracking-widest">April 2026</p>
                    </div>
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
