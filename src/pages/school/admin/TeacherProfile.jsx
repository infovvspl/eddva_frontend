import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import {
  User, BookOpen, Calendar, BarChart2, Briefcase,
  Mail, Smartphone, MapPin, ArrowLeft, Download,
  Edit2, Clock, CheckCircle, Award, Globe, Building,
  Printer, Share2, Loader2, FileText, ChevronDown, ChevronUp,
  Video, TrendingUp, Eye, Brain, Star, Play, AlertCircle,
  CheckCircle2, Sparkles, RotateCcw, X, Upload, Trash2, File,
} from 'lucide-react';
import api from '@/lib/api/school-client';
import { getUploadUrl, uploadToS3 } from '@/lib/upload';
import { motion, AnimatePresence } from 'framer-motion';
import { exportToPDF } from "@/lib/school/pdfExport";
import { toast } from 'sonner';
import { cn } from '@/components/school/admin/Skeleton';
import { normalizeSubjectName } from '@/lib/utils';

const TabButton = ({ active, onClick, icon: Icon, label }) => (
  <button
    onClick={onClick}
    className={`
      flex items-center gap-1.5 rounded-xl sm:rounded-2xl border px-3.5 py-2.5 sm:px-5 sm:py-3 text-xs sm:text-sm font-bold transition-all duration-200 whitespace-nowrap shrink-0
      ${active
        ? 'border-blue-600 bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-600/20'
        : 'border-transparent bg-transparent text-slate-500 hover:border-slate-100 hover:bg-slate-50 hover:text-slate-900 dark:hover:bg-slate-900/70 dark:hover:text-white'}
    `}
  >
    <Icon size={16} />
    {label}
  </button>
);

const DetailItem = ({ label, value, icon: Icon, className }) => (
  <div className={cn("p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 min-w-0 overflow-hidden", className)}>
    <div className="flex items-center gap-2 text-[10px] font-bold tracking-tight text-slate-400 uppercase tracking-widest mb-1 truncate">
      {Icon && <Icon size={12} className="shrink-0" />}
      <span className="truncate">{label}</span>
    </div>
    <div className="text-sm font-bold text-slate-900 dark:text-white truncate break-words">{value || '—'}</div>
  </div>
);

export default function TeacherProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [teacher, setTeacher] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'personal');

  // Attendance states
  const [attendance, setAttendance] = useState([]);
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [attendanceMonth, setAttendanceMonth] = useState(
    new Date().toISOString().slice(0, 7) // YYYY-MM
  );

  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [viewingDoc, setViewingDoc] = useState(null);

  const [uploadingCert, setUploadingCert] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleCertificateUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingCert(true);
    setUploadProgress(0);
    try {
      const { uploadUrl, fileUrl } = await getUploadUrl({
        type: 'chat-attachment',
        fileName: file.name,
        contentType: file.type,
        fileSize: file.size
      });

      await uploadToS3(file, uploadUrl, (progressEvent) => {
        const pct = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        setUploadProgress(pct);
      });

      const currentDocs = profile.docs || {};
      const currentCertificates = currentDocs.certificates || [];
      
      const newCert = {
        name: file.name,
        url: fileUrl,
        size: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
        uploadedAt: new Date().toISOString()
      };

      const updatedDocs = {
        ...currentDocs,
        certificates: [...currentCertificates, newCert]
      };

      await api.put(`/teachers/${id}`, {
        docs: updatedDocs
      });

      setTeacher(prev => ({
        ...prev,
        teacherProfile: {
          ...prev.teacherProfile,
          docs: updatedDocs
        }
      }));

      toast.success('Certificate uploaded successfully!');
    } catch (err) {
      console.error(err);
      toast.error('Failed to upload certificate');
    } finally {
      setUploadingCert(false);
      setUploadProgress(0);
    }
  };

  const handleCertificateDelete = async (certUrl) => {
    try {
      const currentDocs = profile.docs || {};
      const currentCertificates = currentDocs.certificates || [];
      const updatedCertificates = currentCertificates.filter(c => c.url !== certUrl);

      const updatedDocs = {
        ...currentDocs,
        certificates: updatedCertificates
      };

      await api.put(`/teachers/${id}`, {
        docs: updatedDocs
      });

      setTeacher(prev => ({
        ...prev,
        teacherProfile: {
          ...prev.teacherProfile,
          docs: updatedDocs
        }
      }));

      toast.success('Certificate deleted successfully');
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete certificate');
    }
  };

  // Performance states
  const [performanceData, setPerformanceData] = useState(null);
  const [performanceLoading, setPerformanceLoading] = useState(false);

  // Video analysis states
  const [videoSummary, setVideoSummary] = useState(null);
  const [videoRecordings, setVideoRecordings] = useState([]);
  const [videoLoading, setVideoLoading] = useState(false);
  const [analyzingId, setAnalyzingId] = useState(null);
  const [expandedAnalysis, setExpandedAnalysis] = useState({});
  const [watchingRec, setWatchingRec] = useState(null);
  const [watchUrl, setWatchUrl] = useState(null);
  const [watchUrlLoading, setWatchUrlLoading] = useState(false);
  const videoRef = useRef(null);
  const [expandedCategories, setExpandedCategories] = useState({});

  const toggleCategory = (key) => {
    setExpandedCategories(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  useEffect(() => {
    if (activeTab === 'performance' && teacher?.id) {
      fetchPerformanceData();
    }
  }, [activeTab, teacher?.id]);

  const fetchPerformanceData = async () => {
    setPerformanceLoading(true);
    try {
      const res = await api.get('/reports/class', {
        params: { teacherUserId: id }
      });
      setPerformanceData(res.data);
    } catch (err) {
      console.error('Failed to fetch performance report:', err);
      toast.error('Failed to load performance analytics');
      setPerformanceData(null);
    } finally {
      setPerformanceLoading(false);
    }
  };

  const toggleActiveStatus = async () => {
    setUpdatingStatus(true);
    try {
      const newActive = !teacher.isActive;
      await api.put(`/teachers/${teacher.id}`, {
        name: teacher.name,
        isActive: newActive
      });
      setTeacher(prev => ({ ...prev, isActive: newActive }));
      toast.success(`Teacher account ${newActive ? 'activated' : 'deactivated'} successfully`);
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.error || 'Failed to update teacher status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  useEffect(() => {
    fetchTeacher();
  }, [id]);

  useEffect(() => {
    if (activeTab === 'attendance' && teacher?.id) {
      fetchAttendance();
    }
  }, [activeTab, attendanceMonth, teacher?.id]);

  useEffect(() => {
    if (activeTab === 'videos' && teacher?.id) {
      fetchVideoAnalysis();
    }
  }, [activeTab, teacher?.id]);

  const fetchVideoAnalysis = async () => {
    setVideoLoading(true);
    try {
      const [summaryRes, recordingsRes] = await Promise.all([
        api.get(`/teachers/${id}/recordings/summary`),
        api.get(`/teachers/${id}/recordings`),
      ]);
      setVideoSummary(summaryRes.data?.data ?? null);
      setVideoRecordings(recordingsRes.data?.data ?? []);
    } catch (err) {
      console.error('Failed to load video analysis data', err);
      toast.error('Failed to load video data');
    } finally {
      setVideoLoading(false);
    }
  };

  const openWatch = async (rec) => {
    setWatchingRec(rec);
    setWatchUrl(null);
    setWatchUrlLoading(true);
    try {
      const res = await api.get(`/classes/recordings/${rec.id}/play-url`);
      setWatchUrl(res.data?.data?.videoUrl ?? null);
    } catch {
      toast.error('Could not load video. Please try again.');
      setWatchingRec(null);
    } finally {
      setWatchUrlLoading(false);
    }
  };

  const closeWatch = () => {
    if (videoRef.current) videoRef.current.pause();
    setWatchingRec(null);
    setWatchUrl(null);
  };

  const analyzeRecording = async (recordingId) => {
    setAnalyzingId(recordingId);
    try {
      const res = await api.post(`/teachers/${id}/recordings/${recordingId}/analyze`);
      const analysis = res.data?.data;
      setVideoRecordings(prev => prev.map(r =>
        r.id === recordingId
          ? { ...r, ai_teaching_analysis: analysis, ai_teaching_analysis_status: 'done' }
          : r
      ));
      setExpandedAnalysis(prev => ({ ...prev, [recordingId]: true }));
      toast.success('Teaching analysis complete!');
    } catch (err) {
      const msg = err.response?.data?.message ?? 'Analysis failed. Please try again.';
      toast.error(msg);
      setVideoRecordings(prev => prev.map(r =>
        r.id === recordingId ? { ...r, ai_teaching_analysis_status: 'failed' } : r
      ));
    } finally {
      setAnalyzingId(null);
    }
  };

  const fetchAttendance = async () => {
    setAttendanceLoading(true);
    try {
      const [year, month] = attendanceMonth.split('-');
      const startDate = `${year}-${month}-01`;
      const lastDay = new Date(Number(year), Number(month), 0).getDate();
      const endDate = `${year}-${month}-${String(lastDay).padStart(2, '0')}`;
      const res = await api.get('/attendance', {
        params: { userId: teacher.id, startDate, endDate },
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

  const profile = teacher?.teacherProfile || {};
  const isTeacher = teacher?.role === 'TEACHER';
  const docs = profile.docs || {};
  const teacherDetails = docs.teacherDetails || docs.profileDetails || {};
  const detailValue = (...values) => values.find((value) => value !== undefined && value !== null && value !== '');
  const qualificationText = detailValue(
    profile.qualifications,
    [profile.qualification || teacherDetails.qualification, profile.degree || teacherDetails.degree, profile.specialization || teacherDetails.specialization]
      .filter(Boolean)
      .join(' | ')
  );

  const groupedAssignments = useMemo(() => {
    if (!profile.assignments) return [];
    const groups = {};
    profile.assignments.forEach(ass => {
      const classKey = `${ass.className || ''}_${ass.sectionName || ''}`;
      if (!groups[classKey]) {
        groups[classKey] = {
          className: ass.className,
          sectionName: ass.sectionName,
          isClassTeacher: false,
          subjects: new Set(),
        };
      }
      if (ass.isClassTeacher) {
        groups[classKey].isClassTeacher = true;
      }
      const normalizedSub = normalizeSubjectName(ass.subjectName);
      if (normalizedSub) {
        groups[classKey].subjects.add(normalizedSub);
      }
    });

    return Object.values(groups).map(g => ({
      ...g,
      subjects: Array.from(g.subjects),
    }));
  }, [profile.assignments]);

  if (loading) return <div className="p-8 text-center text-slate-500 font-bold animate-pulse">Loading Profile...</div>;
  if (!teacher) return <div className="p-8 text-center text-red-500">Teacher not found.</div>;

  return (
    <div className="w-full pb-24 sm:pb-36">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between px-4 sm:px-0">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-900 font-bold transition-colors text-sm sm:text-base self-start"
        >
          <ArrowLeft size={18} />
          Back to List
        </button>
        <div className="flex gap-2 w-full sm:w-auto">
          <button
            onClick={handleExportPDF}
            disabled={exporting}
            className="flex items-center justify-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-2.5 text-xs font-bold tracking-tight uppercase tracking-widest text-white shadow-lg shadow-blue-600/20 hover:brightness-110 active:scale-95 transition-all disabled:opacity-50 flex-1 sm:flex-initial"
          >
            {exporting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileText className="h-3.5 w-3.5" />}
            Export PDF
          </button>
          <button className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-100 bg-white text-slate-500 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400 shrink-0">
            <Printer size={16} />
          </button>
          <button className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-100 bg-white text-slate-500 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400 shrink-0">
            <Share2 size={16} />
          </button>
        </div>
      </div>

      {/* Main Profile Card for Export */}
      <div id="teacher-profile-content" className="bg-white dark:bg-slate-950 rounded-3xl sm:rounded-[2.5rem] shadow-2xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-800 overflow-hidden mb-8">
        
        {/* DESKTOP HEADER (Picture 1 Style) - Visible on lg screens and up */}
        <div className="hidden lg:block">
          <div className="h-28 sm:h-36 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 relative">
            <div className="absolute inset-0 bg-[url('/noise.png')] opacity-10 mix-blend-overlay pointer-events-none" />
          </div>
          <div className="px-6 sm:px-12 pb-4 -mt-14 sm:-mt-16">
            <div className="flex items-end justify-between gap-6 mb-4">
              <div className="flex items-end gap-6 min-w-0">
                <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-3xl border-4 sm:border-8 border-white dark:border-slate-950 overflow-hidden bg-slate-100 dark:bg-slate-900 shadow-xl shrink-0 z-10">
                  {teacher.profileImage ? (
                    <img src={teacher.profileImage} alt={teacher.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-blue-600/10 text-3xl sm:text-4xl font-bold tracking-tight text-blue-700 dark:text-sky-300">
                      {(teacher.name || 'T').slice(0, 1).toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="pb-2 min-w-0">
                  <div className="flex items-center gap-3 mb-2 flex-wrap">
                    <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-slate-900 dark:text-white leading-tight break-words">{teacher.name}</h1>
                    <button
                      onClick={toggleActiveStatus}
                      disabled={updatingStatus}
                      className="inline-flex items-center gap-2 outline-none group cursor-pointer shrink-0"
                      title="Click to toggle account status"
                    >
                      <div className={cn(
                        "relative w-9 h-5 rounded-full transition-colors duration-300 flex items-center px-0.5 border",
                        teacher.isActive ? "bg-emerald-500 border-emerald-600" : "bg-slate-300 border-slate-400 dark:bg-slate-800"
                      )}>
                        <div className={cn(
                          "w-3.5 h-3.5 rounded-full bg-white transition-transform duration-300 shadow-md",
                          teacher.isActive ? "translate-x-4" : "translate-x-0"
                        )} />
                      </div>
                      <span className={cn(
                        "text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-0.5 rounded-full border shadow-sm",
                        teacher.isActive 
                          ? "bg-emerald-50 border-emerald-300 text-emerald-700 dark:bg-emerald-950/80 dark:border-emerald-700 dark:text-emerald-300"
                          : "bg-slate-100 border-slate-300 text-slate-700 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300"
                      )}>
                        {teacher.isActive ? 'ACTIVE' : 'INACTIVE'}
                      </span>
                    </button>
                  </div>
                  <div className="flex flex-wrap items-center gap-4 text-xs sm:text-sm font-bold text-slate-500 dark:text-slate-400">
                    {profile.role && (
                      <div className="flex items-center gap-2">
                        <Briefcase size={16} className="text-blue-500 shrink-0" />
                        <span>{profile.role}</span>
                      </div>
                    )}
                    {profile.department && (
                      <div className="flex items-center gap-2">
                        <Building size={16} className="text-blue-500 shrink-0" />
                        <span>{profile.department}</span>
                      </div>
                    )}
                    {teacher.email && (
                      <div className="flex items-center gap-2 min-w-0 max-w-full">
                        <Mail size={16} className="text-blue-500 shrink-0" />
                        <span className="truncate">{teacher.email}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {profile.employeeId && (
                <div className="pb-2 text-right shrink-0">
                  <div className="text-[10px] font-bold tracking-widest text-slate-400 uppercase mb-0.5">Employee ID</div>
                  <div className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white">{profile.employeeId}</div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* COMPACT / SHRINKED HEADER (Picture 2 Style) - Visible on screens below lg */}
        <div className="block lg:hidden">
          <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 p-5 sm:p-6 text-white relative">
            <div className="flex flex-col sm:flex-row items-center sm:items-center text-center sm:text-left gap-4">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl border-2 border-white/30 bg-white/10 backdrop-blur-md overflow-hidden shadow-xl shrink-0 flex items-center justify-center">
                {teacher.profileImage ? (
                  <img src={teacher.profileImage} alt={teacher.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-white/20 text-2xl sm:text-3xl font-black text-white">
                    {(teacher.name || 'T').slice(0, 1).toUpperCase()}
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0 space-y-2">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
                  <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white leading-tight break-words">{teacher.name}</h1>
                  <button
                    onClick={toggleActiveStatus}
                    disabled={updatingStatus}
                    className={cn(
                      "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border shadow-sm transition-all text-[11px] font-black tracking-wider uppercase",
                      teacher.isActive
                        ? "bg-emerald-500/90 border-emerald-400 text-white"
                        : "bg-slate-800/90 border-slate-600 text-slate-200"
                    )}
                  >
                    <div className={cn("w-2.5 h-2.5 rounded-full bg-white", teacher.isActive ? "bg-emerald-200" : "bg-slate-400")} />
                    {teacher.isActive ? 'ACTIVE' : 'INACTIVE'}
                  </button>
                </div>
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 text-xs font-semibold text-blue-100">
                  {profile.role && (
                    <span className="bg-white/15 px-2.5 py-1 rounded-xl backdrop-blur-sm border border-white/10">{profile.role}</span>
                  )}
                  {teacher.email && (
                    <span className="bg-white/15 px-2.5 py-1 rounded-xl backdrop-blur-sm border border-white/10 truncate max-w-[220px]">{teacher.email}</span>
                  )}
                </div>
              </div>

              {profile.employeeId && (
                <div className="text-center sm:text-right shrink-0 bg-white/10 p-3 rounded-2xl backdrop-blur-sm border border-white/10">
                  <div className="text-[9px] font-bold tracking-widest text-blue-200 uppercase mb-0.5">Employee ID</div>
                  <div className="text-base font-black tracking-tight text-white">{profile.employeeId}</div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tab Buttons Container */}
        <div className="px-4 sm:px-12 pt-6 pb-10 sm:pb-16">
          <div className="flex flex-nowrap gap-2 border-b border-slate-100 dark:border-slate-800 mb-6 sm:mb-8 pb-4 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            <TabButton active={activeTab === 'personal'} onClick={() => setActiveTab('personal')} icon={User} label="Personal Details" />
            {isTeacher && <TabButton active={activeTab === 'academic'} onClick={() => setActiveTab('academic')} icon={BookOpen} label="Subjects & Classes" />}
            <TabButton active={activeTab === 'attendance'} onClick={() => setActiveTab('attendance')} icon={Calendar} label="Attendance" />
            {isTeacher && <TabButton active={activeTab === 'performance'} onClick={() => setActiveTab('performance')} icon={BarChart2} label="Performance" />}
            {isTeacher && <TabButton active={activeTab === 'videos'} onClick={() => setActiveTab('videos')} icon={Video} label="Video Analysis" />}
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
                      <h3 className="text-sm font-bold tracking-tight text-slate-900 dark:text-white uppercase tracking-widest mb-4">Core Identification</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                        <DetailItem label="Full Name" value={teacher.name} icon={User} />
                        <DetailItem label="Joining Date" value={profile.joiningDate ? new Date(profile.joiningDate).toLocaleDateString() : '—'} icon={Clock} />
                        <DetailItem label="Qualifications" value={profile.qualifications} icon={Award} />
                        <DetailItem label="Nationality" value={profile.nationality} icon={Globe} />
                        <DetailItem label="Date of Birth" value={profile.dob ? new Date(profile.dob).toLocaleDateString() : '—'} icon={Calendar} />
                        <DetailItem label="Gender" value={profile.gender} icon={User} />
                        <DetailItem label="Blood Group" value={profile.bloodGroup} icon={CheckCircle} />
                        <DetailItem label="Marital Status" value={profile.maritalStatus} icon={User} />
                        <DetailItem label="National ID" value={profile.nationalId} icon={FileText} />
                        <DetailItem label="Nationality" value={detailValue(profile.nationality, teacherDetails.nationality)} icon={Globe} />
                      </div>
                    </div>
                    <div>
                      <h3 className="text-sm font-bold tracking-tight text-slate-900 dark:text-white uppercase tracking-widest mb-4">Academic Details</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                        <DetailItem label="Qualifications" value={qualificationText} icon={Award} className="sm:col-span-2" />
                        <DetailItem label="University / Institute" value={detailValue(profile.institute, teacherDetails.institute)} icon={Building} />
                        <DetailItem label="Passing Year" value={detailValue(profile.passingYear, teacherDetails.passingYear)} icon={Clock} />
                        <DetailItem label="Languages Known" value={detailValue(profile.languages, teacherDetails.languages)} icon={Globe} className="sm:col-span-2" />
                      </div>
                    </div>
                    <div>
                      <h3 className="text-sm font-bold tracking-tight text-slate-900 dark:text-white uppercase tracking-widest mb-4">Professional Details</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                        <DetailItem label="Designation" value={profile.role} icon={Briefcase} />
                        <DetailItem label="Employment Type" value={detailValue(profile.employmentType, teacherDetails.employmentType)} icon={Briefcase} />
                        <DetailItem label="Experience" value={profile.experience ? `${profile.experience} years` : null} icon={Clock} />
                        <DetailItem label="Salary" value={profile.salary} icon={FileText} />
                        <DetailItem label="Achievements" value={detailValue(profile.achievements, teacherDetails.achievements)} icon={Award} className="sm:col-span-2" />
                      </div>
                    </div>
                    <div>
                      <h3 className="text-sm font-bold tracking-tight text-slate-900 dark:text-white uppercase tracking-widest mb-4">Contact Info</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                        <DetailItem label="Work Email" value={teacher.email} icon={Mail} />
                        <DetailItem label="Phone Number" value={teacher.phone} icon={Smartphone} />
                      </div>
                    </div>
                    <div>
                      <h3 className="text-sm font-bold tracking-tight text-slate-900 dark:text-white uppercase tracking-widest mb-4">Address Information</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                        <DetailItem label="Address" value={profile.currentAddress} icon={MapPin} />
                        <DetailItem label="City" value={profile.city} icon={Building} />
                        <DetailItem label="State" value={profile.state} icon={Building} />
                        <DetailItem label="Country" value={profile.country} icon={Globe} />
                        <DetailItem label="Pin Code" value={profile.pinCode} icon={MapPin} />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-6">
                    <div className="p-6 rounded-3xl bg-slate-900 text-white shadow-2xl">
                      <h4 className="text-xs font-bold tracking-tight uppercase tracking-widest opacity-60 mb-4">Department Lead Info</h4>
                      <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm font-semibold text-white/60">
                        No department lead assigned.
                      </div>
                    </div>

                    <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-xl">
                      <h4 className="text-xs font-bold tracking-tight text-slate-900 dark:text-white uppercase tracking-widest mb-4 flex items-center justify-between">
                        <span>Teacher Certificates</span>
                        <Award size={14} className="text-blue-500" />
                      </h4>

                      <div className="relative mb-4">
                        <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-200 dark:border-slate-800 hover:border-blue-500 dark:hover:border-blue-500 rounded-2xl p-4 cursor-pointer transition-colors bg-slate-50/50 dark:bg-slate-950/10">
                          <Upload size={18} className="text-slate-400 mb-1" />
                          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Upload Certificate</span>
                          <input
                            type="file"
                            onChange={handleCertificateUpload}
                            className="hidden"
                            accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                            disabled={uploadingCert}
                          />
                        </label>

                        {uploadingCert && (
                          <div className="absolute inset-0 bg-white/80 dark:bg-slate-900/80 rounded-2xl flex flex-col items-center justify-center p-3">
                            <Loader2 size={18} className="animate-spin text-blue-600 mb-1" />
                            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Uploading ({uploadProgress}%)</div>
                          </div>
                        )}
                      </div>

                      <div>
                        {(docs.certificates || []).length > 0 ? (
                          <div className="grid grid-cols-2 gap-4">
                            {(docs.certificates || []).map((cert, index) => {
                              const isImage = /\.(png|jpe?g|webp|gif)$/i.test(cert.name || '');
                              const isPdf = /\.pdf$/i.test(cert.name || '');
                              const isDoc = /\.(doc|docx)$/i.test(cert.name || '');
                              
                              return (
                                <div key={index} className="relative group rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/10 p-3 flex flex-col items-center text-center gap-2 hover:shadow-md transition-all">
                                  {/* Floating delete button */}
                                  <button
                                    type="button"
                                    onClick={() => handleCertificateDelete(cert.url)}
                                    className="absolute top-2 right-2 p-2 rounded-xl bg-white/95 dark:bg-slate-900/95 text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 shadow-md opacity-80 group-hover:opacity-100 transition-all z-10"
                                  >
                                    <Trash2 size={15} />
                                  </button>

                                  {/* Preview Area */}
                                  <div 
                                    onClick={() => setViewingDoc(cert)}
                                    className="w-full h-24 rounded-xl overflow-hidden border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-center shrink-0 cursor-pointer relative"
                                  >
                                    {isImage ? (
                                      <img
                                        src={cert.url}
                                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                                        alt={cert.name}
                                      />
                                    ) : isPdf ? (
                                      <iframe
                                        src={`${cert.url}#toolbar=0&navpanes=0&scrollbar=0`}
                                        className="w-[400%] h-[400%] scale-[0.25] origin-top-left border-0 pointer-events-none select-none"
                                        style={{ overflow: 'hidden' }}
                                        title={cert.name}
                                      />
                                    ) : isDoc ? (
                                      <iframe
                                        src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(cert.url)}`}
                                        className="w-[400%] h-[400%] scale-[0.25] origin-top-left border-0 pointer-events-none select-none"
                                        style={{ overflow: 'hidden' }}
                                        title={cert.name}
                                      />
                                    ) : (
                                      <div className="w-full h-full bg-slate-50 dark:bg-slate-800 flex flex-col items-center justify-center gap-1">
                                        <File className="text-slate-400" size={24} />
                                        <span className="text-[9px] font-black tracking-widest text-slate-500 uppercase">FILE</span>
                                      </div>
                                    )}
                                  </div>

                                  {/* File Details */}
                                  <div className="w-full min-w-0">
                                    <button
                                      type="button"
                                      onClick={() => setViewingDoc(cert)}
                                      className="text-[11px] font-bold text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 truncate block hover:underline w-full text-center"
                                      title={cert.name}
                                    >
                                      {cert.name}
                                    </button>
                                    <span className="text-[9px] text-slate-400 font-bold block mt-0.5">{cert.size || '—'}</span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="text-center py-6 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl text-xs text-slate-400 font-semibold">
                            No certificates uploaded yet.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'academic' && isTeacher && (
                <div className="space-y-8">
                  <div>
                    <h3 className="text-sm font-bold tracking-tight text-slate-900 dark:text-white uppercase tracking-widest mb-4">Class Management Summary</h3>
                    <div className="grid grid-cols-2 gap-3 sm:gap-4 max-w-md">
                      <div className="p-4 rounded-2xl border border-slate-100 dark:border-slate-800 text-center">
                        <div className="text-xs font-bold tracking-tight text-slate-400 uppercase tracking-widest mb-1">Unique Classes</div>
                        <div className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">{teacher.classes?.length || 0}</div>
                      </div>
                      <div className="p-4 rounded-2xl border border-slate-100 dark:border-slate-800 text-center">
                        <div className="text-xs font-bold tracking-tight text-slate-400 uppercase tracking-widest mb-1">Unique Sections</div>
                        <div className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">{teacher.sections?.length || 0}</div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold tracking-tight text-slate-900 dark:text-white uppercase tracking-widest mb-4">Academic Assignments</h3>
                    <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2">
                      {groupedAssignments && groupedAssignments.length > 0 ? (
                        groupedAssignments.map((group, i) => (
                          <div key={i} className="p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-100 bg-white dark:bg-slate-900 dark:border-slate-800 shadow-sm flex flex-col justify-between">
                            <div className="flex items-center justify-between gap-4">
                              <span className="text-lg font-bold text-slate-900 dark:text-white">
                                {group.className && !group.className.toLowerCase().startsWith('class') ? 'Class ' : ''}{group.className || '—'}
                                {group.sectionName ? ` · Section ${group.sectionName}` : ''}
                              </span>
                              {group.isClassTeacher && (
                                <span className="bg-emerald-500/10 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-450 border border-emerald-500/20 dark:border-emerald-800 px-3 py-1 rounded-full text-[10px] uppercase font-black tracking-widest shrink-0">
                                  Class Teacher
                                </span>
                              )}
                            </div>
                            
                            {group.subjects && group.subjects.length > 0 ? (
                              <div className="flex flex-wrap gap-2 mt-4">
                                {group.subjects.map((sub, idx) => (
                                  <span
                                    key={idx}
                                    className="px-3.5 py-1.5 rounded-full bg-slate-50 text-slate-700 dark:bg-slate-800 dark:text-slate-300 text-xs font-semibold border border-slate-100/50 dark:border-slate-800/80 shadow-sm"
                                  >
                                    {sub}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <p className="text-xs font-semibold text-slate-400 mt-3 italic">No subjects assigned</p>
                            )}
                          </div>
                        ))
                      ) : (
                        <div className="p-8 text-center text-sm font-semibold text-slate-400 border border-dashed border-slate-100 dark:border-slate-850 rounded-2xl md:col-span-2">
                          No active academic assignments found.
                        </div>
                      )}
                    </div>
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
                    const total = attendance.length;
                    const present = attendance.filter(r => (r.status || '').toUpperCase() === 'PRESENT').length;
                    const absent = attendance.filter(r => (r.status || '').toUpperCase() === 'ABSENT').length;
                    const late = attendance.filter(r => (r.status || '').toUpperCase() === 'LATE').length;
                    const pct = total > 0 ? Math.round((present / total) * 100) : 0;

                    const statusStyle = (status) => {
                      const s = (status || '').toUpperCase();
                      if (s === 'PRESENT') return 'bg-emerald-500/10 text-emerald-600';
                      if (s === 'ABSENT') return 'bg-red-500/10 text-red-500';
                      if (s === 'LATE') return 'bg-amber-400/10 text-amber-600';
                      if (s === 'LEAVE') return 'bg-blue-500/10 text-blue-600';
                      return 'bg-slate-100 text-slate-500';
                    };

                    return (
                      <>
                        {/* Stats */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                          <div className="p-4 sm:p-6 rounded-2xl sm:rounded-[2rem] bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 text-center">
                            <div className={`text-2xl sm:text-4xl font-bold tracking-tight mb-1 ${pct >= 75 ? 'text-blue-600' : 'text-red-500'}`}>{total > 0 ? `${pct}%` : '—'}</div>
                            <div className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-widest">Attendance %</div>
                          </div>
                          <div className="p-4 sm:p-6 rounded-2xl sm:rounded-[2rem] bg-emerald-500/10 border border-emerald-500/20 text-center text-emerald-600">
                            <div className="text-2xl sm:text-4xl font-bold tracking-tight mb-1">{present}</div>
                            <div className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest">Present</div>
                          </div>
                          <div className="p-4 sm:p-6 rounded-2xl sm:rounded-[2rem] bg-red-500/10 border border-red-500/20 text-center text-red-500">
                            <div className="text-2xl sm:text-4xl font-bold tracking-tight mb-1">{absent}</div>
                            <div className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest">Absent</div>
                          </div>
                          <div className="p-4 sm:p-6 rounded-2xl sm:rounded-[2rem] bg-amber-400/10 border border-amber-400/20 text-center text-amber-600">
                            <div className="text-2xl sm:text-4xl font-bold tracking-tight mb-1">{late}</div>
                            <div className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest">Late</div>
                          </div>
                        </div>

                        {/* Records Table */}
                        <div className="rounded-3xl border border-slate-100 dark:border-slate-800 overflow-hidden overflow-x-auto w-full">
                          <table className="w-full text-left min-w-[600px]">
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

                {activeTab === 'performance' && isTeacher && (() => {
                if (performanceLoading) {
                  return (
                    <div className="flex flex-col items-center justify-center py-20 space-y-4">
                      <Loader2 size={40} className="animate-spin text-blue-600" />
                      <p className="text-sm font-bold text-slate-500 animate-pulse uppercase tracking-widest">Calculating performance analytics...</p>
                    </div>
                  );
                }

                const studentsList = performanceData?.students || [];
                const evaluatedStudents = studentsList.filter(s => s.isEvaluated);
                const totalEvaluated = evaluatedStudents.length;
                const totalEvaluatedSubmissions = performanceData?.summary?.evaluatedSubmissions ?? 0;

                if (totalEvaluated === 0 && totalEvaluatedSubmissions === 0) {
                  return (
                    <div className="p-12 rounded-[2.5rem] bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800 text-center shadow-sm">
                      <Award size={48} className="mx-auto mb-4 text-slate-300 dark:text-slate-700 animate-bounce" />
                      <h4 className="text-xl font-bold text-slate-900 dark:text-white mb-2">No assessments evaluated yet.</h4>
                      <p className="text-sm font-semibold text-slate-500 max-w-md mx-auto">
                        Student performance metrics will appear here once assessments are created, completed, and graded for the classes assigned to this teacher.
                      </p>
                    </div>
                  );
                }

                const overallAverage = Math.round(
                  performanceData?.summary?.averageStudentScore ?? 
                  (evaluatedStudents.reduce((sum, s) => sum + s.avgScore, 0) / (totalEvaluated || 1))
                );

                const categories = {
                  outstanding: evaluatedStudents.filter(s => s.avgScore >= 80),
                  aboveAverage: evaluatedStudents.filter(s => s.avgScore >= 70 && s.avgScore < 80),
                  highAverage: evaluatedStudents.filter(s => s.avgScore >= 60 && s.avgScore < 70),
                  average: evaluatedStudents.filter(s => s.avgScore >= 50 && s.avgScore < 60),
                  poor: evaluatedStudents.filter(s => s.avgScore < 50)
                };

                const categoryConfig = [
                  {
                    key: 'outstanding',
                    title: 'Outstanding',
                    range: '80%+',
                    students: categories.outstanding,
                    bgColor: 'bg-emerald-50/50 dark:bg-emerald-950/10',
                    borderColor: 'border-emerald-100 dark:border-emerald-900/50',
                    textColor: 'text-emerald-700 dark:text-emerald-400',
                    barBg: 'bg-emerald-500',
                    glowColor: 'shadow-emerald-500/10'
                  },
                  {
                    key: 'aboveAverage',
                    title: 'Above Average',
                    range: '70% - 79%',
                    students: categories.aboveAverage,
                    bgColor: 'bg-blue-50/50 dark:bg-blue-950/10',
                    borderColor: 'border-blue-100 dark:border-blue-900/50',
                    textColor: 'text-blue-700 dark:text-blue-400',
                    barBg: 'bg-blue-500',
                    glowColor: 'shadow-blue-500/10'
                  },
                  {
                    key: 'highAverage',
                    title: 'High Average',
                    range: '60% - 69%',
                    students: categories.highAverage,
                    bgColor: 'bg-indigo-50/50 dark:bg-indigo-950/10',
                    borderColor: 'border-indigo-100 dark:border-indigo-900/50',
                    textColor: 'text-indigo-700 dark:text-indigo-400',
                    barBg: 'bg-indigo-500',
                    glowColor: 'shadow-indigo-500/10'
                  },
                  {
                    key: 'average',
                    title: 'Average',
                    range: '50% - 59%',
                    students: categories.average,
                    bgColor: 'bg-amber-50/50 dark:bg-amber-950/10',
                    borderColor: 'border-amber-100 dark:border-amber-900/50',
                    textColor: 'text-amber-700 dark:text-amber-400',
                    barBg: 'bg-amber-500',
                    glowColor: 'shadow-amber-500/10'
                  },
                  {
                    key: 'poor',
                    title: 'Poor',
                    range: '< 50%',
                    students: categories.poor,
                    bgColor: 'bg-rose-50/50 dark:bg-rose-950/10',
                    borderColor: 'border-rose-100 dark:border-rose-900/50',
                    textColor: 'text-rose-700 dark:text-rose-400',
                    barBg: 'bg-rose-500',
                    glowColor: 'shadow-rose-500/10'
                  }
                ];

                return (
                  <div className="space-y-10">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
                      <div className="md:col-span-2 p-5 sm:p-8 rounded-2xl sm:rounded-[2.5rem] bg-white border border-slate-100 dark:border-slate-800 dark:bg-slate-900/50 shadow-xl flex items-center justify-between gap-6 sm:gap-8 flex-wrap md:flex-nowrap">
                        <div className="space-y-1.5">
                          <h4 className="text-sm font-bold tracking-tight text-slate-900 dark:text-white uppercase tracking-widest">Class Performance</h4>
                          <p className="text-slate-500 text-xs font-semibold">
                            Aggregated metrics of students assigned to classes and sections taught by this teacher.
                          </p>
                        </div>
                        <div className="flex items-center gap-10 flex-wrap shrink-0">
                          <div className="relative w-28 h-28 sm:w-32 sm:h-32 flex items-center justify-center">
                            <svg className="w-full h-full -rotate-90">
                              <circle cx="56" cy="56" r="46" fill="none" stroke="#f1f5f9" strokeWidth="10" className="dark:stroke-slate-800 sm:cx-64 sm:cy-64 sm:r-54 sm:strokeWidth-12" />
                              <circle cx="56" cy="56" r="46" fill="none" stroke="#2563eb" strokeWidth="10" strokeDasharray="290" strokeDashoffset={290 - (290 * overallAverage) / 100} strokeLinecap="round" className="sm:cx-64 sm:cy-64 sm:r-54 sm:strokeWidth-12" />
                            </svg>
                            <div className="absolute text-center">
                              <div className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">{overallAverage}%</div>
                              <div className="text-[8px] sm:text-[9px] font-bold tracking-tight text-slate-400 uppercase">Class Avg</div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="p-5 sm:p-8 rounded-2xl sm:rounded-[2.5rem] bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-xl shadow-blue-600/10 flex flex-col justify-center space-y-4">
                        <div>
                          <h4 className="text-[10px] font-bold uppercase tracking-widest text-blue-200">Total Graded Students</h4>
                          <div className="text-4xl sm:text-5xl font-black mt-1">{totalEvaluated || evaluatedStudents.length}</div>
                        </div>
                        <p className="text-xs text-blue-100 font-semibold leading-relaxed">
                          Students with at least one evaluation in classes mapped to this teacher profile.
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
                      <div className="p-4 sm:p-6 rounded-2xl sm:rounded-[2rem] border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900/50 text-center shadow-sm">
                        <div className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Assessments</div>
                        <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">{performanceData?.summary?.totalAssessmentsCreated ?? 0}</div>
                      </div>
                      <div className="p-4 sm:p-6 rounded-2xl sm:rounded-[2rem] border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900/50 text-center shadow-sm">
                        <div className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Student Submissions</div>
                        <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">{performanceData?.summary?.totalStudentSubmissions ?? 0}</div>
                      </div>
                      <div className="p-4 sm:p-6 rounded-2xl sm:rounded-[2rem] border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900/50 text-center shadow-sm">
                        <div className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Evaluated Submissions</div>
                        <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">{performanceData?.summary?.evaluatedSubmissions ?? 0}</div>
                        <div className="text-[8px] sm:text-[9px] font-bold text-amber-500 mt-1 uppercase">Pending: {performanceData?.summary?.pendingEvaluations ?? 0}</div>
                      </div>
                      <div className="p-4 sm:p-6 rounded-2xl sm:rounded-[2rem] border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900/50 text-center shadow-sm">
                        <div className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Highest / Lowest Score</div>
                        <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                          {performanceData?.summary?.highestScore ?? 0}% <span className="text-slate-300">/</span> {performanceData?.summary?.lowestScore ?? 0}%
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-sm font-bold tracking-tight text-slate-900 dark:text-white uppercase tracking-widest mb-6">Student Performance Distribution</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                        {categoryConfig.map(cat => {
                          const pct = totalEvaluated > 0 ? Math.round((cat.students.length / totalEvaluated) * 100) : 0;
                          return (
                            <div
                              key={cat.key}
                              className={`p-5 rounded-3xl border ${cat.borderColor} ${cat.bgColor} flex flex-col justify-between space-y-4 shadow-sm hover:shadow-md transition-all duration-300`}
                            >
                              <div>
                                <div className="flex items-center justify-between mb-1">
                                  <h5 className={`text-sm font-bold tracking-tight ${cat.textColor}`}>{cat.title}</h5>
                                  <span className="text-[10px] font-bold text-slate-400 tracking-wider bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-800 px-1.5 py-0.5 rounded">
                                    {cat.range}
                                  </span>
                                </div>
                                <div className="text-2xl font-black text-slate-900 dark:text-white">
                                  {cat.students.length} <span className="text-xs text-slate-400 font-bold">student{cat.students.length !== 1 ? 's' : ''}</span>
                                </div>
                              </div>

                              <div className="space-y-1.5">
                                <div className="h-1.5 bg-slate-200/60 dark:bg-slate-850 rounded-full overflow-hidden">
                                  <div className={`h-full ${cat.barBg}`} style={{ width: `${pct}%` }} />
                                </div>
                                <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest flex justify-between">
                                  <span>Share of class</span>
                                  <span>{pct}%</span>
                                </div>
                              </div>

                              <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80">
                                {cat.students.length > 0 ? (
                                  <button
                                    onClick={() => {
                                      const urlBracket = cat.key.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`);
                                      navigate(`/school/admin/teachers/${id}/performance/${urlBracket}`);
                                    }}
                                    className="w-full flex items-center justify-between text-[9px] font-bold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white uppercase tracking-widest transition-colors py-1 outline-none"
                                  >
                                    <span>View Students &rarr;</span>
                                  </button>
                                ) : (
                                  <div className="text-[9px] font-bold text-slate-350 dark:text-slate-700 uppercase tracking-widest py-1 flex justify-between items-center cursor-not-allowed select-none opacity-50">
                                    <span>No Students</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div>
                      <h3 className="text-sm font-bold tracking-tight text-slate-900 dark:text-white uppercase tracking-widest mb-6">Class-wise Performance Summary</h3>
                      <div className="rounded-3xl border border-slate-100 dark:border-slate-800 overflow-hidden overflow-x-auto w-full shadow-sm">
                        <table className="w-full text-left min-w-[600px]">
                          <thead className="bg-slate-50 dark:bg-slate-900/60 border-b border-slate-100 dark:border-slate-800">
                            <tr>
                              <th className="p-4 text-[10px] font-bold tracking-tight text-slate-400 uppercase tracking-widest">Class Name</th>
                              <th className="p-4 text-[10px] font-bold tracking-tight text-slate-400 uppercase tracking-widest">Total Students Evaluated</th>
                              <th className="p-4 text-[10px] font-bold tracking-tight text-slate-400 uppercase tracking-widest">Average Score</th>
                              <th className="p-4 text-[10px] font-bold tracking-tight text-slate-400 uppercase tracking-widest">Pass Percentage</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-50 dark:divide-slate-800 text-sm">
                            {(performanceData?.data || []).map((cs, idx) => (
                              <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors">
                                <td className="p-4 font-bold text-slate-950 dark:text-white">{cs.class}</td>
                                <td className="p-4 font-bold text-slate-600 dark:text-slate-400">{cs.totalEvaluated ?? 0}</td>
                                <td className="p-4 font-bold text-slate-600 dark:text-slate-400">{Math.round(cs.avgScore)}%</td>
                                <td className="p-4">
                                  <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${cs.passRate >= 50 ? 'bg-emerald-500/10 text-emerald-600' : 'bg-red-500/10 text-red-500'}`}>
                                    {cs.passRate}%
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                );
              })()}
              {activeTab === 'videos' && isTeacher && (
                <div className="space-y-6">
                  {videoLoading ? (
                    <div className="flex flex-col items-center justify-center py-20 space-y-4">
                      <Loader2 size={40} className="animate-spin text-blue-600" />
                      <p className="text-sm font-bold text-slate-500 animate-pulse uppercase tracking-widest">Loading video data…</p>
                    </div>
                  ) : (
                    <>
                      {/* Summary Cards */}
                      {videoSummary && (
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                          {[
                            { icon: <Video size={18} className="text-blue-600" />, label: 'Total Recordings', value: videoSummary.total_recordings ?? 0, sub: `+ ${videoSummary.total_live ?? 0} live`, tone: 'blue' },
                            { icon: <Eye size={18} className="text-violet-600" />, label: 'Avg Watch Rate', value: `${videoSummary.avg_watch_pct ?? 0}%`, sub: `${videoSummary.total_views ?? 0} total views`, tone: 'violet' },
                            { icon: <CheckCircle2 size={18} className="text-emerald-600" />, label: 'Completions', value: videoSummary.total_completions ?? 0, sub: 'watched ≥90%', tone: 'emerald' },
                            { icon: <Brain size={18} className="text-amber-600" />, label: 'AI Analyzed', value: videoSummary.analyzed_count ?? 0, sub: `of ${videoSummary.total_recordings ?? 0} recordings`, tone: 'amber' },
                          ].map(({ icon, label, value, sub, tone }) => {
                            const tones = { blue: 'bg-blue-50 border-blue-200 text-blue-700', violet: 'bg-violet-50 border-violet-200 text-violet-700', emerald: 'bg-emerald-50 border-emerald-200 text-emerald-700', amber: 'bg-amber-50 border-amber-200 text-amber-700' };
                            return (
                              <div key={label} className={`rounded-2xl border p-4 ${tones[tone]}`}>
                                <div className="flex items-center gap-2 mb-2">
                                  <div className="grid h-8 w-8 place-items-center rounded-xl bg-white shadow-sm">{icon}</div>
                                  <p className="text-[10px] font-bold uppercase tracking-wide opacity-70">{label}</p>
                                </div>
                                <p className="text-2xl font-bold">{value}</p>
                                {sub && <p className="text-[10px] opacity-60 mt-0.5">{sub}</p>}
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Content Quality badges */}
                      {videoSummary && (
                        <div className="flex flex-wrap gap-3 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 p-4">
                          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest w-full mb-1">Content Quality Signals</p>
                          {[
                            { label: 'Transcribed', val: videoSummary.transcribed_count, total: videoSummary.total_recordings, color: 'blue' },
                            { label: 'Notes Generated', val: videoSummary.notes_count, total: videoSummary.total_recordings, color: 'violet' },
                            { label: 'Quizzes Created', val: videoSummary.quiz_count, total: videoSummary.total_recordings, color: 'emerald' },
                          ].map(({ label, val, total, color }) => {
                            const pct = total ? Math.round((val / total) * 100) : 0;
                            const colors = { blue: 'bg-blue-600', violet: 'bg-violet-600', emerald: 'bg-emerald-600' };
                            return (
                              <div key={label} className="flex-1 min-w-36">
                                <div className="flex justify-between items-center mb-1">
                                  <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">{label}</span>
                                  <span className="text-[11px] font-bold text-slate-900 dark:text-white">{val}/{total}</span>
                                </div>
                                <div className="h-1.5 w-full rounded-full bg-slate-200 dark:bg-slate-700">
                                  <div className={`h-full rounded-full ${colors[color]}`} style={{ width: `${pct}%` }} />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Recordings list */}
                      <div>
                        <h3 className="text-sm font-bold tracking-tight text-slate-900 dark:text-white uppercase tracking-widest mb-4">Class Recordings</h3>
                        {videoRecordings.length === 0 ? (
                          <div className="flex flex-col items-center justify-center py-16 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/40">
                            <Video size={40} className="text-slate-300 mb-3" />
                            <p className="text-sm font-bold text-slate-400">No recordings found</p>
                            <p className="text-xs text-slate-400 mt-1">This teacher hasn't uploaded any class recordings yet.</p>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {videoRecordings.map(rec => {
                              const analysis = rec.ai_teaching_analysis;
                              const status = rec.ai_teaching_analysis_status;
                              const isExpanded = expandedAnalysis[rec.id];
                              const isAnalyzing = analyzingId === rec.id;
                              const hasTranscript = rec.transcript_status === 'done';
                              const watchPct = rec.avg_watch_pct ?? 0;

                              return (
                                <div key={rec.id} className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
                                  {/* Recording row */}
                                  <div className="p-4 flex flex-col sm:flex-row sm:items-center gap-4">
                                    {/* Icon */}
                                    <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-blue-50 dark:bg-blue-950">
                                      <Play size={18} className="text-blue-600" />
                                    </div>

                                    {/* Meta */}
                                    <div className="flex-1 min-w-0">
                                      <div className="flex flex-wrap items-center gap-2 mb-1">
                                        <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{rec.title}</p>
                                        {rec.source === 'live' && (
                                          <span className="text-[9px] font-bold bg-red-100 text-red-700 rounded-full px-2 py-0.5 uppercase">Live</span>
                                        )}
                                      </div>
                                      <div className="flex flex-wrap gap-2 text-[10px] text-slate-400">
                                        {rec.class_name && <span>{rec.class_name}{rec.section_name ? ` • ${rec.section_name}` : ''}</span>}
                                        {rec.subject_name && <span>• {rec.subject_name}</span>}
                                        {rec.recorded_date && <span>• {new Date(rec.recorded_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>}
                                        {rec.duration && <span>• {rec.duration}</span>}
                                      </div>
                                    </div>

                                    {/* Engagement stats */}
                                    <div className="flex items-center gap-4 shrink-0">
                                      <div className="text-center">
                                        <p className="text-base font-bold text-slate-900 dark:text-white">{watchPct}%</p>
                                        <p className="text-[9px] text-slate-400 uppercase font-semibold">Avg Watch</p>
                                        <div className="mt-1 h-1 w-16 rounded-full bg-slate-100 dark:bg-slate-700">
                                          <div className={`h-full rounded-full ${watchPct >= 70 ? 'bg-emerald-500' : watchPct >= 40 ? 'bg-amber-500' : 'bg-red-400'}`} style={{ width: `${watchPct}%` }} />
                                        </div>
                                      </div>
                                      <div className="text-center">
                                        <p className="text-base font-bold text-slate-900 dark:text-white">{rec.total_viewers ?? 0}</p>
                                        <p className="text-[9px] text-slate-400 uppercase font-semibold">Viewers</p>
                                      </div>
                                      <div className="text-center">
                                        <p className="text-base font-bold text-slate-900 dark:text-white">{rec.completed_count ?? 0}</p>
                                        <p className="text-[9px] text-slate-400 uppercase font-semibold">Completed</p>
                                      </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center gap-2 mt-2 sm:mt-0 shrink-0">
                                      <button
                                        onClick={() => openWatch(rec)}
                                        className="flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shrink-0"
                                      >
                                        <Play size={12} className="text-blue-600" /> Watch
                                      </button>

                                      {/* AI Action */}
                                      <div className="flex items-center gap-2">
                                        {status === 'done' && analysis ? (
                                          <button
                                            onClick={() => setExpandedAnalysis(prev => ({ ...prev, [rec.id]: !prev[rec.id] }))}
                                            className="flex items-center gap-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-800 px-3 py-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 transition-colors"
                                          >
                                            <Star size={12} />
                                            {isExpanded ? 'Hide' : 'View'} Analysis
                                            <ChevronDown size={12} className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                                          </button>
                                        ) : status === 'processing' || isAnalyzing ? (
                                          <span className="flex items-center gap-1.5 rounded-xl bg-blue-50 dark:bg-blue-950 border border-blue-200 px-3 py-1.5 text-xs font-bold text-blue-600">
                                            <Loader2 size={12} className="animate-spin" /> Analyzing…
                                          </span>
                                        ) : status === 'failed' ? (
                                          <button
                                            onClick={() => analyzeRecording(rec.id)}
                                            disabled={!hasTranscript}
                                            className="flex items-center gap-1.5 rounded-xl bg-red-50 border border-red-200 px-3 py-1.5 text-xs font-bold text-red-600 hover:bg-red-100 disabled:opacity-40 transition-colors"
                                          >
                                            <RotateCcw size={12} /> Retry
                                          </button>
                                        ) : (
                                          <button
                                            onClick={() => analyzeRecording(rec.id)}
                                            disabled={!hasTranscript || isAnalyzing}
                                            title={!hasTranscript ? 'Transcript required — click Transcribe on the recording first' : 'Analyze teaching quality with AI'}
                                            className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-3 py-1.5 text-xs font-bold text-white hover:brightness-110 disabled:opacity-40 transition-all"
                                          >
                                            <Sparkles size={12} /> Analyze
                                          </button>
                                        )}
                                        {!hasTranscript && (
                                          <span title="No transcript yet" className="text-slate-300">
                                            <AlertCircle size={14} />
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </div>

                                  {/* Analysis panel */}
                                  {isExpanded && analysis && (
                                    <div className="border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 p-5 space-y-4">
                                      {/* Overall score */}
                                      <div className="flex items-center gap-4">
                                        <div className="grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white font-display shrink-0">
                                          <span className="text-2xl font-bold">{analysis.overallScore}</span>
                                          <span className="text-[9px] opacity-70">/10</span>
                                        </div>
                                        <div>
                                          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Overall Teaching Score</p>
                                          <p className="text-sm text-slate-700 dark:text-slate-300">{analysis.summary}</p>
                                        </div>
                                      </div>

                                      {/* Dimension scores */}
                                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                                        {[
                                          { key: 'clarity', label: 'Clarity' },
                                          { key: 'pacing', label: 'Pacing' },
                                          { key: 'contentCoverage', label: 'Content' },
                                          { key: 'studentEngagement', label: 'Engagement' },
                                          { key: 'languageQuality', label: 'Language' },
                                        ].map(({ key, label }) => {
                                          const dim = analysis[key];
                                          if (!dim) return null;
                                          const score = dim.score ?? 0;
                                          const pctVal = score * 10;
                                          const color = score >= 8 ? 'bg-emerald-500' : score >= 6 ? 'bg-blue-500' : score >= 4 ? 'bg-amber-500' : 'bg-red-400';
                                          return (
                                            <div key={key} className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-3">
                                              <div className="flex justify-between items-center mb-2">
                                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{label}</p>
                                                <span className="text-sm font-bold text-slate-900 dark:text-white">{score}/10</span>
                                              </div>
                                              <div className="h-1.5 w-full rounded-full bg-slate-100 dark:bg-slate-700">
                                                <div className={`h-full rounded-full ${color} transition-all`} style={{ width: `${pctVal}%` }} />
                                              </div>
                                              <p className="mt-2 text-[10px] text-slate-500 leading-relaxed line-clamp-2">{dim.feedback}</p>
                                            </div>
                                          );
                                        })}
                                      </div>

                                      {/* Strengths & Suggestions */}
                                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {analysis.strengths?.length > 0 && (
                                          <div className="rounded-xl border border-emerald-100 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950/40 p-4">
                                            <p className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-widest mb-2 flex items-center gap-1">
                                              <TrendingUp size={12} /> Strengths
                                            </p>
                                            <ul className="space-y-1.5">
                                              {analysis.strengths.map((s, i) => (
                                                <li key={i} className="flex items-start gap-2 text-xs text-emerald-800 dark:text-emerald-300">
                                                  <CheckCircle size={12} className="shrink-0 mt-0.5 text-emerald-600" />
                                                  {s}
                                                </li>
                                              ))}
                                            </ul>
                                          </div>
                                        )}
                                        {analysis.suggestions?.length > 0 && (
                                          <div className="rounded-xl border border-amber-100 dark:border-amber-900 bg-amber-50 dark:bg-amber-950/40 p-4">
                                            <p className="text-[10px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-widest mb-2 flex items-center gap-1">
                                              <Brain size={12} /> Suggestions
                                            </p>
                                            <ul className="space-y-1.5">
                                              {analysis.suggestions.map((s, i) => (
                                                <li key={i} className="flex items-start gap-2 text-xs text-amber-800 dark:text-amber-300">
                                                  <Star size={12} className="shrink-0 mt-0.5 text-amber-500" />
                                                  {s}
                                                </li>
                                              ))}
                                            </ul>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* ── Video player modal ─────────────────────────────────────── */}
      {watchingRec && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={(e) => { if (e.target === e.currentTarget) closeWatch(); }}
        >
          <div className="w-full max-w-4xl rounded-2xl overflow-hidden bg-black shadow-2xl">
            {/* Modal header */}
            <div className="flex items-center justify-between bg-slate-900 px-4 py-3">
              <div className="min-w-0">
                <p className="text-sm font-bold text-white truncate">{watchingRec.title}</p>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  {[watchingRec.class_name, watchingRec.section_name, watchingRec.subject_name].filter(Boolean).join(' • ')}
                </p>
              </div>
              <button
                onClick={closeWatch}
                className="ml-4 shrink-0 grid h-8 w-8 place-items-center rounded-lg text-slate-400 hover:bg-slate-700 hover:text-white transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* Video area */}
            <div className="relative bg-black aspect-video flex items-center justify-center">
              {watchUrlLoading ? (
                <div className="flex flex-col items-center gap-3">
                  <Loader2 size={36} className="animate-spin text-blue-400" />
                  <p className="text-sm text-slate-400">Loading video…</p>
                </div>
              ) : watchUrl ? (
                <video
                  ref={videoRef}
                  src={watchUrl}
                  controls
                  autoPlay
                  className="w-full h-full"
                  controlsList="nodownload"
                />
              ) : (
                <div className="flex flex-col items-center gap-3">
                  <AlertCircle size={36} className="text-red-400" />
                  <p className="text-sm text-slate-400">Video unavailable</p>
                </div>
              )}
            </div>

            {/* Footer stats */}
            <div className="flex items-center gap-6 bg-slate-900 px-4 py-2.5 border-t border-slate-800">
              {[
                { label: 'Avg Watch Rate', value: `${watchingRec.avg_watch_pct ?? 0}%` },
                { label: 'Viewers', value: watchingRec.total_viewers ?? 0 },
                { label: 'Completions', value: watchingRec.completed_count ?? 0 },
                { label: 'Duration', value: watchingRec.duration || '—' },
              ].map(({ label, value }) => (
                <div key={label}>
                  <p className="text-[9px] text-slate-500 uppercase font-semibold">{label}</p>
                  <p className="text-sm font-bold text-white">{value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Dynamic In-App Document Viewer Modal */}
      {viewingDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
          <div className="w-full max-w-4xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="px-8 py-5 bg-gradient-to-r from-blue-600 to-indigo-700 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <File size={20} className="text-white" />
                <h3 className="text-base font-bold text-white truncate max-w-lg">{viewingDoc.name}</h3>
              </div>
              <button 
                onClick={() => setViewingDoc(null)} 
                className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center text-white hover:bg-white/30 transition-all"
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Body (Content Viewer) */}
            <div className="p-8 flex-1 overflow-y-auto no-scrollbar flex items-center justify-center bg-slate-50 dark:bg-slate-950">
              {/\.(png|jpe?g|webp|gif)$/i.test(viewingDoc.name || '') ? (
                <img 
                  src={viewingDoc.url} 
                  className="max-w-full max-h-[70vh] object-contain rounded-2xl shadow-lg border border-slate-100 dark:border-slate-800" 
                  alt={viewingDoc.name} 
                />
              ) : /\.pdf$/i.test(viewingDoc.name || '') ? (
                <iframe 
                  src={viewingDoc.url} 
                  className="w-full h-[70vh] rounded-2xl border border-slate-200 dark:border-slate-800 bg-white" 
                  title={viewingDoc.name}
                />
              ) : (
                <div className="text-center py-12 space-y-4">
                  <File size={48} className="mx-auto text-slate-400" />
                  <p className="text-sm font-bold text-slate-700 dark:text-slate-350">
                    Preview is not supported for this file type.
                  </p>
                  <a 
                    href={viewingDoc.url} 
                    download
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition-all active:scale-98"
                  >
                    <Download size={14} />
                    Download File
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
