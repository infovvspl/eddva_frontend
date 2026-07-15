import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  User, GraduationCap, Calendar, BarChart2, DollarSign, 
  Mail, Smartphone, MapPin, ArrowLeft, Download, Users, Phone, Shield,
  Edit2, Clock, CheckCircle, AlertCircle, TrendingUp, HeartPulse, Briefcase, FileText, Printer, Share2, Loader2, Send, Key, X, Plus, Trash2
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
  const [performanceSessions, setPerformanceSessions] = useState([]);
  const [performanceLoading, setPerformanceLoading] = useState(false);
  const [attendanceMonth, setAttendanceMonth] = useState(
    new Date().toISOString().slice(0, 7) // YYYY-MM
  );
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [teachingMap, setTeachingMap] = useState(null);

  const [isAddPrevOpen, setIsAddPrevOpen] = useState(false);
  const [isSavingPrev, setIsSavingPrev] = useState(false);

  const getClassNumberFromName = (className = '') => {
    const cls = String(className || '').toLowerCase();
    const numeric = cls.match(/\b(?:class|grade|standard|std)?\s*(\d{1,2})\b/);
    if (numeric) return Number(numeric[1]);

    const romanMap = {
      i: 1, ii: 2, iii: 3, iv: 4, v: 5,
      vi: 6, vii: 7, viii: 8, ix: 9, x: 10, xi: 11, xii: 12
    };
    const tokens = cls.split(/[^a-z0-9]+/).filter(Boolean);
    const roman = tokens.find((token) => romanMap[token]);
    return roman ? romanMap[roman] : null;
  };

  const isBoardResultClass = (className = '') => {
    const classNumber = getClassNumberFromName(className);
    return classNumber === 10 || classNumber === 12;
  };

  const isPrePrimaryResultClass = (className = '') => {
    const cls = String(className || '').toLowerCase();
    return cls.includes('lkg') || cls.includes('ukg') || cls.includes('nursery') || cls.includes('pre');
  };

  const getResultColumnsForClass = (className = '') => {
    if (isPrePrimaryResultClass(className)) {
      return [
        { key: 'readingPhonics', title: 'Reading & Phonics', defaultMax: '100' },
        { key: 'writingMotorSkills', title: 'Writing & Motor Skills', defaultMax: '100' },
        { key: 'numeracyShapes', title: 'Numeracy & Shapes', defaultMax: '100' },
        { key: 'communicationSpeech', title: 'Communication & Speech', defaultMax: '100' },
        { key: 'creativityArts', title: 'Creativity & Arts', defaultMax: '100' },
        { key: 'socialBehaviour', title: 'Social development & Behaviour', defaultMax: '100' }
      ];
    }

    if (isBoardResultClass(className)) {
      return [
        { key: 'theory', title: 'Theory', defaultMax: '70' },
        { key: 'practical', title: 'Practical', defaultMax: '20' },
        { key: 'internal', title: 'Internal', defaultMax: '10' }
      ];
    }

    return [
      { key: 't1Internal', title: 'T1 Internal', defaultMax: '20' },
      { key: 'halfYearly', title: 'Half-Yearly', defaultMax: '80' },
      { key: 't2Internal', title: 'T2 Internal', defaultMax: '20' },
      { key: 'annual', title: 'Annual', defaultMax: '80' }
    ];
  };

  const isInformationTechnologySubject = (subjectName = '') => {
    const subject = String(subjectName || '').trim().toLowerCase();
    return /\b(information|informational)\s+technology\b/.test(subject) || 
           /\bcomputer\s+science\b/.test(subject) ||
           /\bcomputer\b/.test(subject) ||
           subject === 'it' || 
           subject === 'cs';
  };

  const getResultColumnsForSubject = (className = '', subjectName = '') => {
    if (!isBoardResultClass(className) && !isPrePrimaryResultClass(className) && isInformationTechnologySubject(subjectName)) {
      return [
        { key: 'halfYearlyTheory', title: 'Half-Yearly Theory', defaultMax: '50' },
        { key: 'halfYearlyPractical', title: 'Half-Yearly Practical', defaultMax: '50' },
        { key: 'annualTheory', title: 'Annual Theory', defaultMax: '50' },
        { key: 'annualPractical', title: 'Annual Practical', defaultMax: '50' }
      ];
    }
    return getResultColumnsForClass(className);
  };

  const getBlankAssessments = (className = '', subjectName = '') => getResultColumnsForSubject(className, subjectName).reduce((acc, item) => {
    acc[item.key] = { obtained: '', max: item.defaultMax };
    return acc;
  }, {});

  const getEditableMaxForResult = (column, totalMarks) => {
    const savedMax = totalMarks !== undefined && totalMarks !== null ? String(totalMarks) : '';
    if (column.defaultMax === '80' && Number(savedMax) === 100) return column.defaultMax;
    return savedMax || column.defaultMax;
  };

  const migrateAssessmentsForSubject = (className, subjectName, currentAssessments = {}) => {
    const nextAssessments = getBlankAssessments(className, subjectName);
    const retained = Object.fromEntries(
      Object.entries(currentAssessments || {}).filter(([key]) => key in nextAssessments)
    );
    const migrated = { ...nextAssessments, ...retained };

    if (isInformationTechnologySubject(subjectName)) {
      if (!retained.halfYearlyTheory && currentAssessments.halfYearly) {
        migrated.halfYearlyTheory = { ...currentAssessments.halfYearly, max: '50' };
      }
      if (!retained.annualTheory && currentAssessments.annual) {
        migrated.annualTheory = { ...currentAssessments.annual, max: '50' };
      }
    }

    return migrated;
  };

  const initialSubjectRow = (className = '') => ({
    subjectName: isPrePrimaryResultClass(className) ? 'Early Learner Progress' : '',
    assessments: getBlankAssessments(className),
    remarks: ''
  });

  const [prevForm, setPrevForm] = useState({
    className: '',
    academicYear: '',
    subjects: [initialSubjectRow()]
  });

  const resultColumns = getResultColumnsForClass(prevForm.className);

  const openAddPrevModal = () => {
    const className = profile?.section?.class?.name || '';
    setPrevForm({
      className,
      academicYear: profile?.section?.class?.academicYear || profile?.academicYear || '',
      subjects: [initialSubjectRow(className)]
    });
    setIsAddPrevOpen(true);
  };

  const openEditPrevModal = (className, academicYear, results) => {
    const subjectRows = {};

    results
      .filter((res) => res.subjectName && !(res.assessmentTitle || '').toLowerCase().includes('(total)'))
      .sort((a, b) => {
        const aTime = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
        const bTime = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
        return aTime - bTime;
      })
      .forEach((res) => {
        const subjectName = isPrePrimaryResultClass(className) ? 'Early Learner Progress' : (res.subjectName || 'General');
        if (!subjectRows[subjectName]) {
          subjectRows[subjectName] = {
            subjectName,
            assessments: getBlankAssessments(className, subjectName),
            remarks: ''
          };
        }
        const subjectColumns = getResultColumnsForSubject(className, subjectName);

        let parsedComponents = null;
        try {
          if (res.remarks && String(res.remarks).trim().startsWith('{')) {
            const parsed = JSON.parse(res.remarks);
            if (parsed?.type === 'breakdown' && parsed.components) parsedComponents = parsed.components;
          }
        } catch (e) {}

        if (isBoardResultClass(className) && parsedComponents) {
          subjectColumns.forEach((column) => {
            const component = parsedComponents[column.key];
            if (component) {
              subjectRows[subjectName].assessments[column.key] = {
                obtained: component.obtained !== undefined && component.obtained !== null ? String(component.obtained) : '',
                max: component.max !== undefined && component.max !== null ? String(component.max) : column.defaultMax
              };
            }
          });
        } else {
          const title = String(res.assessmentTitle || '').trim().toLowerCase();
          const column = subjectColumns.find((item) => {
            const columnTitle = item.title.trim().toLowerCase();
            return title === columnTitle;
          });

          if (column) {
            subjectRows[subjectName].assessments[column.key] = {
              obtained: res.marksObtained !== undefined && res.marksObtained !== null ? String(res.marksObtained) : '',
              max: getEditableMaxForResult(column, res.totalMarks)
            };
          }
        }

        if (!subjectRows[subjectName].remarks && res.remarks && !String(res.remarks).trim().startsWith('{')) {
          subjectRows[subjectName].remarks = res.remarks;
        }
      });

    setPrevForm({
      className,
      academicYear,
      subjects: Object.values(subjectRows).length ? Object.values(subjectRows) : [initialSubjectRow(className)]
    });
    setIsAddPrevOpen(true);
  };

  const handlePrevClassChange = (className) => {
    const nextAssessments = getBlankAssessments(className);
    if (isPrePrimaryResultClass(className)) {
      setPrevForm((form) => ({
        ...form,
        className,
        subjects: [{
          subjectName: 'Early Learner Progress',
          assessments: nextAssessments,
          remarks: form.subjects?.[0]?.remarks || ''
        }]
      }));
      return;
    }

    setPrevForm((form) => ({
      ...form,
      className,
      subjects: form.subjects.map((subject) => ({
        ...subject,
        subjectName: isPrePrimaryResultClass(className) ? 'Early Learner Progress' : subject.subjectName,
        assessments: migrateAssessmentsForSubject(className, subject.subjectName, subject.assessments)
      }))
    }));
  };

  const addSubjectRow = () => {
    setPrevForm(f => ({
      ...f,
      subjects: [...f.subjects, initialSubjectRow(f.className)]
    }));
  };

  const removeSubjectRow = (idx) => {
    setPrevForm(f => ({
      ...f,
      subjects: f.subjects.filter((_, i) => i !== idx)
    }));
  };

  const handlePrevSubjectChange = (idx, field, value) => {
    const nextSubjects = [...prevForm.subjects];
    const current = nextSubjects[idx];
    if (field === 'subjectName') {
      const nextAssessments = getBlankAssessments(prevForm.className, value);
      nextSubjects[idx] = {
        ...current,
        subjectName: value,
        assessments: migrateAssessmentsForSubject(prevForm.className, value, current.assessments)
      };
    } else {
      nextSubjects[idx] = { ...current, [field]: value };
    }
    setPrevForm(f => ({ ...f, subjects: nextSubjects }));
  };

  const handlePrevAssessmentChange = (idx, assessmentKey, field, value) => {
    const nextSubjects = [...prevForm.subjects];
    const subject = nextSubjects[idx];
    nextSubjects[idx] = {
      ...subject,
      assessments: {
        ...subject.assessments,
        [assessmentKey]: {
          ...(subject.assessments?.[assessmentKey] || {}),
          [field]: value
        }
      }
    };
    setPrevForm(f => ({ ...f, subjects: nextSubjects }));
  };

  const handleAddPrevResultSubmit = async (e) => {
    e.preventDefault();
    if (!prevForm.className.trim() || !prevForm.academicYear.trim()) {
      toast.error('Class Name and Academic Year are required.');
      return;
    }
    const hasInvalidSubject = prevForm.subjects.some(s => {
      if (!s.subjectName.trim()) return true;
      return getResultColumnsForSubject(prevForm.className, s.subjectName).some(({ key }) => {
        const value = s.assessments?.[key] || {};
        return value.obtained === '' || value.max === '';
      });
    });
    if (hasInvalidSubject) {
      toast.error('Please enter subject name, obtained marks and max marks for all result columns.');
      return;
    }

    setIsSavingPrev(true);
    try {
      const activeAssessmentTitlesBySubject = Object.fromEntries(
        prevForm.subjects.map((subject) => [
          subject.subjectName.trim().toLowerCase(),
          isBoardResultClass(prevForm.className)
            ? ['Final Result']
            : getResultColumnsForSubject(prevForm.className, subject.subjectName).map((column) => column.title)
        ])
      );

      if (isBoardResultClass(prevForm.className)) {
        await api.post(`/students/${student.id}/previous-results`, {
          className: prevForm.className,
          academicYear: prevForm.academicYear,
          assessmentTitle: 'Final Result',
          activeAssessmentTitlesBySubject,
          subjects: prevForm.subjects.map((subject) => ({
            subjectName: subject.subjectName,
            components: Object.fromEntries(
              getResultColumnsForSubject(prevForm.className, subject.subjectName).map((column) => [
                column.key,
                {
                  enabled: true,
                  obtained: Number(subject.assessments[column.key].obtained || 0),
                  max: Number(subject.assessments[column.key].max || 0)
                }
              ])
            ),
            remarks: subject.remarks || ''
          }))
        });
      } else {
        const assessmentTitles = [
          ...new Set(prevForm.subjects.flatMap((subject) =>
            getResultColumnsForSubject(prevForm.className, subject.subjectName).map((column) => column.title)
          ))
        ];
        for (const assessmentTitle of assessmentTitles) {
          await api.post(`/students/${student.id}/previous-results`, {
            className: prevForm.className,
            academicYear: prevForm.academicYear,
            assessmentTitle,
            activeAssessmentTitlesBySubject,
            subjects: prevForm.subjects
              .map((subject) => {
                const column = getResultColumnsForSubject(prevForm.className, subject.subjectName).find((item) => item.title === assessmentTitle);
                if (!column) return null;
                return {
                  subjectName: subject.subjectName,
                  marksObtained: Number(subject.assessments[column.key].obtained || 0),
                  totalMarks: Number(subject.assessments[column.key].max || 0),
                  remarks: subject.remarks || ''
                };
              })
              .filter(Boolean)
          });
        }
      }
      toast.success('Previous class result added successfully!');
      setIsAddPrevOpen(false);
      setPrevForm({
        className: '',
        academicYear: '',
        subjects: [initialSubjectRow()]
      });
      fetchStudent();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.error || err.response?.data?.message || 'Failed to add previous result');
    } finally {
      setIsSavingPrev(false);
    }
  };

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
    if (activeTab === 'performance' && student?.id) {
      fetchPerformanceSessions();
    }
  }, [activeTab, student?.id, student?.studentProfile?.id]);

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

  const fetchPerformanceSessions = async () => {
    setPerformanceLoading(true);
    try {
      const studentProfileId = student?.studentProfile?.id || student?.profile_id;
      const userId = student?.id || student?.user_id;
      const studentId = studentProfileId || userId;
      const res = await api.get('/assessments/sessions', {
        params: { studentId, limit: 500 },
      });
      const list = res.data?.data ?? res.data ?? [];
      const targetIds = new Set([studentProfileId, userId].filter(Boolean).map(String));
      const rows = Array.isArray(list) ? list : [];
      const scopedRows = rows.filter((row) => {
        const rowIds = [
          row.studentId,
          row.userId,
          row.student?.id,
          row.student?.userId,
          row.student?.user?.id,
        ].filter(Boolean).map(String);
        return rowIds.length > 0 && rowIds.some((rowId) => targetIds.has(rowId));
      });
      const completed = scopedRows
        .filter((row) => ['submitted', 'auto_submitted', 'evaluated'].includes(String(row.status || '').toLowerCase()))
        .map((row) => {
          const rawAccuracy = Number(row.accuracy ?? 0);
          const accuracy = rawAccuracy > 0 && rawAccuracy <= 1 ? rawAccuracy * 100 : rawAccuracy;
          return {
            id: row.id,
            mockTestTitle: row.mockTestTitle || row.mock_test_title || row.mockTest?.title || row.assessment?.title,
            submittedAt: row.submittedAt || row.submitted_at || row.completedAt || row.completed_at || row.startedAt || row.started_at,
            accuracy,
            score: Number(row.score ?? row.totalScore ?? row.total_score ?? 0),
            correctCount: Number(row.correctCount ?? row.correct_count ?? 0),
            wrongCount: Number(row.wrongCount ?? row.wrong_count ?? 0),
          };
        });
      setPerformanceSessions(completed);
    } catch (err) {
      console.error('Performance sessions fetch error:', err);
      setPerformanceSessions([]);
    } finally {
      setPerformanceLoading(false);
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
    const documents = nestedProfile.documents ?? raw.documents ?? {};
    const parentDetailsRaw = raw.parentDetails ?? raw.parent_details ?? nestedProfile.parentDetails ?? documents.parentDetails ?? documents.parent_details ?? {};
    const primaryContact = parentDetailsRaw.primaryContact ?? parentDetailsRaw.primary_contact ?? nestedProfile.primaryContact ?? raw.primaryContact ?? raw.primary_contact ?? 'father';
    const parentPhone = nestedProfile.parentPhone ?? nestedProfile.parent_phone ?? raw.parent_phone ?? raw.parentPhone ?? parentDetailsRaw.parentPhone ?? parentDetailsRaw.parent_phone;
    const fatherPhone = parentDetailsRaw.fatherPhone ?? parentDetailsRaw.father_phone ?? nestedProfile.fatherPhone ?? nestedProfile.father_phone ?? raw.father_phone ?? raw.fatherPhone ?? (primaryContact === 'father' ? parentPhone : undefined);
    const motherPhone = parentDetailsRaw.motherPhone ?? parentDetailsRaw.mother_phone ?? nestedProfile.motherPhone ?? nestedProfile.mother_phone ?? raw.mother_phone ?? raw.motherPhone ?? (primaryContact === 'mother' ? parentPhone : undefined);
    const guardianPhone = parentDetailsRaw.guardianPhone ?? parentDetailsRaw.guardian_phone ?? nestedProfile.guardianPhone ?? nestedProfile.guardian_phone ?? raw.guardian_phone ?? raw.guardianPhone ?? (primaryContact === 'guardian' ? parentPhone : undefined);
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
        fatherPhone,
        motherName:        nestedProfile.motherName ?? nestedProfile.mother_name ?? raw.mother_name ?? raw.motherName,
        motherPhone,
        parentPhone,
        parentEmail:       nestedProfile.parentEmail ?? nestedProfile.parent_email ?? raw.parent_email ?? raw.parentEmail,
        parentOccupation:  nestedProfile.parentOccupation ?? nestedProfile.parent_occupation ?? raw.parent_occupation ?? raw.parentOccupation,
        admissionDate:     nestedProfile.admissionDate ?? nestedProfile.admission_date ?? raw.admission_date ?? raw.admissionDate,
        medicalConditions: nestedProfile.medicalConditions ?? nestedProfile.medical_conditions ?? raw.medical_conditions ?? raw.medicalConditions,
        allergies:         nestedProfile.allergies ?? raw.allergies,
        address:           nestedProfile.address ?? raw.address,
        city:              nestedProfile.city ?? raw.city,
        state:             nestedProfile.state ?? raw.state,
        pinCode:           nestedProfile.pinCode ?? nestedProfile.pin_code ?? raw.pin_code ?? raw.pinCode,
        documents,
        section: nestedProfile.section || {
          name:  raw.section_name ?? nestedProfile.section?.name,
          class: { name: raw.class_name ?? nestedProfile.section?.class?.name },
        },
      },
      // build parentDetails from flat fields if not returned as nested
      parentDetails: {
        ...parentDetailsRaw,
        primaryContact,
        fatherName:      parentDetailsRaw.fatherName ?? parentDetailsRaw.father_name ?? nestedProfile.fatherName ?? raw.father_name ?? raw.fatherName,
        fatherPhone,
        motherName:      parentDetailsRaw.motherName ?? parentDetailsRaw.mother_name ?? nestedProfile.motherName ?? raw.mother_name ?? raw.motherName,
        motherPhone,
        email:           parentDetailsRaw.email ?? parentDetailsRaw.parentEmail ?? parentDetailsRaw.parent_email ?? nestedProfile.parentEmail ?? raw.parent_email ?? raw.parentEmail,
        whatsappNumber:  parentDetailsRaw.whatsappNumber ?? parentDetailsRaw.whatsapp_number ?? nestedProfile.whatsappNumber ?? raw.whatsapp_number ?? raw.whatsappNumber ?? parentPhone,
        occupation:      parentDetailsRaw.occupation ?? parentDetailsRaw.parentOccupation ?? parentDetailsRaw.parent_occupation ?? nestedProfile.parentOccupation ?? raw.parent_occupation ?? raw.parentOccupation,
        guardianName:    parentDetailsRaw.guardianName ?? parentDetailsRaw.guardian_name ?? nestedProfile.guardianName ?? raw.guardian_name ?? raw.guardianName,
        guardianRelation:parentDetailsRaw.guardianRelation ?? parentDetailsRaw.guardian_relation ?? nestedProfile.guardianRelation ?? raw.guardian_relation ?? raw.guardianRelation,
        guardianPhone,
        createLogin:     parentDetailsRaw.createLogin ?? parentDetailsRaw.create_login ?? nestedProfile.createLogin ?? raw.create_login ?? raw.createLogin,
        sendViaSms:      parentDetailsRaw.sendViaSms ?? parentDetailsRaw.send_via_sms ?? nestedProfile.sendViaSms ?? raw.send_via_sms ?? raw.sendViaSms,
        sendViaEmail:    parentDetailsRaw.sendViaEmail ?? parentDetailsRaw.send_via_email ?? nestedProfile.sendViaEmail ?? raw.send_via_email ?? raw.sendViaEmail,
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
  const primaryContact = parents.primaryContact || 'father';
  const fatherPhone = parents.fatherPhone || profile.fatherPhone || (primaryContact === 'father' ? profile.parentPhone : null);
  const motherPhone = parents.motherPhone || profile.motherPhone || (primaryContact === 'mother' ? profile.parentPhone : null);
  const guardianPhone = parents.guardianPhone || profile.guardianPhone || (primaryContact === 'guardian' ? profile.parentPhone : null);

  return (
    <div className="w-full pb-12">
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
            className="flex items-center justify-center gap-1.5 px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl border border-slate-100 text-slate-600 font-bold text-xs sm:text-sm hover:bg-slate-50 transition-all disabled:opacity-50 flex-1 sm:flex-initial"
          >
            {exporting ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
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
            className="flex items-center justify-center gap-1.5 px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl border border-indigo-200 bg-indigo-50 text-indigo-700 font-bold text-xs sm:text-sm hover:bg-indigo-100 transition-all flex-1 sm:flex-initial"
          >
            <Send size={14} />
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
      {isAddPrevOpen && (
        <div className="fixed left-0 right-0 top-16 bottom-16 md:left-[72px] md:top-0 md:bottom-0 lg:left-[280px] z-50 flex items-stretch justify-stretch p-3 sm:p-5 lg:p-6" style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}>
          <div className="w-full h-full bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-6 shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                    <GraduationCap size={20} className="text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">Add Previous Class Result</h3>
                    <p className="text-xs text-blue-200 font-bold">Record historical academic achievements</p>
                  </div>
                </div>
                <button onClick={() => setIsAddPrevOpen(false)} className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center text-white hover:bg-white/30 transition-all">
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleAddPrevResultSubmit} className="p-4 sm:p-8 space-y-5 overflow-y-auto no-scrollbar flex-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Class Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Class 9"
                    value={prevForm.className}
                    onChange={(e) => handlePrevClassChange(e.target.value)}
                    className="w-full rounded-xl border-2 border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-xs font-bold text-slate-900 dark:text-white outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Academic Year</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 2024-2025"
                    value={prevForm.academicYear}
                    onChange={(e) => setPrevForm({ ...prevForm, academicYear: e.target.value })}
                    className="w-full rounded-xl border-2 border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-xs font-bold text-slate-900 dark:text-white outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Subject-wise Report Card Marks</h4>
                    <p className="text-[11px] font-semibold text-slate-400 mt-0.5">
                      Columns: {isPrePrimaryResultClass(prevForm.className) ? '' : 'Subject, '}{resultColumns.map((column) => column.title).join(', ')}, {isBoardResultClass(prevForm.className) ? 'Total' : isPrePrimaryResultClass(prevForm.className) ? 'Grade' : 'T1 Total, T2 Total, Final, Grade'}
                    </p>
                  </div>
                  {!isPrePrimaryResultClass(prevForm.className) && (
                    <button
                      type="button"
                      onClick={addSubjectRow}
                      className="flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-700 transition-colors"
                    >
                      <Plus size={12} />
                      Add Subject
                    </button>
                  )}
                </div>

                <div className="space-y-6">
                  {prevForm.subjects.map((sub, idx) => {
                    let subObtained = 0;
                    let subMax = 0;
                    const subjectColumns = getResultColumnsForSubject(prevForm.className, sub.subjectName);
                    subjectColumns.forEach(({ key }) => {
                      const marks = sub.assessments?.[key] || {};
                      subObtained += Number(marks.obtained || 0);
                      subMax += Number(marks.max || 0);
                    });
                    
                    return (
                      <div key={idx} className="p-5 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/10 space-y-4">
                        <div className="flex items-center justify-between gap-4">
                          {!isPrePrimaryResultClass(prevForm.className) && (
                            <div className="flex-1">
                              <input
                                type="text"
                                required
                                placeholder="Subject Name (e.g. Physics)"
                                value={sub.subjectName}
                                onChange={(e) => handlePrevSubjectChange(idx, 'subjectName', e.target.value)}
                                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2.5 text-xs font-bold text-slate-800 dark:text-white outline-none focus:border-blue-500"
                              />
                            </div>
                          )}
                          
                          <div className="text-right shrink-0">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">{isPrePrimaryResultClass(prevForm.className) ? 'Indicator Total' : 'Subject Total'}</span>
                            <span className="text-xs font-extrabold text-slate-800 dark:text-white">{subObtained} / {subMax}</span>
                          </div>

                          {!isPrePrimaryResultClass(prevForm.className) && prevForm.subjects.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeSubjectRow(idx)}
                              className="p-2 rounded-xl border border-rose-100 hover:bg-rose-50 text-rose-500 transition-colors shrink-0"
                            >
                              <Trash2 size={13} />
                            </button>
                          )}
                        </div>

                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Report Card Columns</span>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                          {subjectColumns.map((column) => {
                            const marks = sub.assessments?.[column.key] || { obtained: '', max: column.defaultMax };
                            return (
                              <div key={column.key} className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2">
                                <span className="text-xs font-bold text-slate-500 block">{column.title}</span>
                                <div className="flex items-center gap-2 min-w-0">
                                  <input
                                    type="number"
                                    required
                                    min="0"
                                    placeholder="Marks"
                                    value={marks.obtained}
                                    onChange={(e) => handlePrevAssessmentChange(idx, column.key, 'obtained', e.target.value)}
                                    className="w-full min-w-0 rounded-lg border border-slate-200 dark:border-slate-700 px-2 py-1 text-xs text-center font-bold text-slate-800 dark:text-white outline-none focus:border-blue-500 bg-white dark:bg-slate-850"
                                  />
                                  <span className="text-slate-400 text-xs">/</span>
                                  <input
                                    type="number"
                                    required
                                    min="1"
                                    placeholder="Max"
                                    value={marks.max}
                                    onChange={(e) => handlePrevAssessmentChange(idx, column.key, 'max', e.target.value)}
                                    className="w-full min-w-0 rounded-lg border border-slate-200 dark:border-slate-700 px-2 py-1 text-xs text-center font-bold text-slate-800 dark:text-white outline-none focus:border-blue-500 bg-white dark:bg-slate-850"
                                  />
                                </div>
                              </div>
                            );
                          })}
                          </div>
                        </div>

                        <div>
                          <input
                            type="text"
                            placeholder="Remarks (e.g. Notebook score, subject enrichment notes)"
                            value={sub.remarks}
                            onChange={(e) => handlePrevSubjectChange(idx, 'remarks', e.target.value)}
                            className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2 text-xs font-medium text-slate-500 dark:text-slate-350 outline-none focus:border-blue-500"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Dynamic Overall Total Card */}
              {(() => {
                let totalObtained = 0;
                let totalMax = 0;
                prevForm.subjects.forEach(sub => {
                  getResultColumnsForSubject(prevForm.className, sub.subjectName).forEach(({ key }) => {
                    const marks = sub.assessments?.[key] || {};
                    totalObtained += Number(marks.obtained || 0);
                    totalMax += Number(marks.max || 0);
                  });
                });
                const pct = totalMax > 0 ? Math.round((totalObtained / totalMax) * 100) : 0;
                return (
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 flex items-center justify-between">
                    <div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Calculated Total Result</div>
                      <div className="text-xs font-bold text-slate-500">Sum of all report-card column marks</div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <div className="text-[10px] font-bold text-slate-400">Total Score</div>
                        <div className="text-xs font-extrabold text-slate-800 dark:text-white">{totalObtained} / {totalMax}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-[10px] font-bold text-slate-400">Percentage</div>
                        <div className="text-xs font-extrabold text-blue-600 dark:text-blue-400">{pct}%</div>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsAddPrevOpen(false)}
                  className="px-6 py-2.5 rounded-xl border border-slate-100 dark:border-slate-800 text-slate-500 font-bold text-xs hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingPrev}
                  className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm shadow-blue-500/10 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  {isSavingPrev && <Loader2 size={14} className="animate-spin" />}
                  Save Result
                </button>
              </div>
            </form>
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
      <div id="student-profile-content" className="bg-white dark:bg-slate-950 rounded-3xl sm:rounded-[2.5rem] shadow-2xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-800 overflow-hidden mb-8">
        <div className="h-24 sm:h-32 bg-gradient-to-r from-blue-600 to-indigo-700" />
        <div className="px-4 sm:px-12 pb-6 sm:pb-12 -mt-12 sm:-mt-16">
          <div className="flex flex-col md:flex-row items-center md:items-end text-center md:text-left gap-4 sm:gap-8 mb-6 sm:mb-8">
            <div className="w-24 h-24 sm:w-40 sm:h-40 rounded-2xl sm:rounded-[2.5rem] border-4 sm:border-8 border-white dark:border-slate-950 overflow-hidden bg-slate-100 shadow-xl shrink-0">
              {student.profileImage ? (
                <img src={student.profileImage} alt={student.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-blue-600/10 text-2xl sm:text-4xl font-bold tracking-tight text-blue-700">
                  {getInitials(student.name)}
                </div>
              )}
            </div>
            <div className="flex-1 pb-2">
              <div className="flex items-center justify-center md:justify-start gap-3 mb-2 flex-wrap">
                <h1 className="text-xl sm:text-4xl font-black tracking-tight text-slate-900 dark:text-white leading-tight">{student.name}</h1>
                <button
                  onClick={toggleActiveStatus}
                  disabled={updatingStatus}
                  className="flex items-center gap-2 outline-none group cursor-pointer"
                  title="Click to toggle account status"
                >
                  <div className={cn(
                    "relative w-9 h-5 rounded-full transition-colors duration-300 flex items-center px-0.5 border",
                    student.isActive 
                      ? "bg-emerald-500 border-emerald-600" 
                      : "bg-slate-300 border-slate-400 dark:bg-slate-800 dark:border-slate-700"
                  )}>
                    <div className={cn(
                      "w-3.5 h-3.5 rounded-full bg-white transition-transform duration-300 shadow-md",
                      student.isActive ? "translate-x-4" : "translate-x-0"
                    )} />
                  </div>
                  <span className={cn(
                    "text-[9px] font-bold tracking-tight uppercase tracking-widest",
                    student.isActive ? "text-emerald-600" : "text-slate-400"
                  )}>
                    {student.isActive ? 'Active' : 'Inactive'}
                  </span>
                </button>
              </div>
              <div className="flex flex-col sm:flex-row sm:flex-wrap items-center justify-center md:justify-start gap-2.5 sm:gap-6 text-xs sm:text-sm font-bold text-slate-500">
                <div className="flex items-center gap-2"><GraduationCap size={16} className="text-blue-500" /> Class {profile.section?.class?.name || '—'} - {profile.section?.name || '—'}</div>
                <div className="flex items-center gap-2"><Smartphone size={16} className="text-blue-500" /> {student.phone || '—'}</div>
                <div className="flex items-center gap-2"><Mail size={16} className="text-blue-500" /> {student.email}</div>
              </div>
            </div>
            <div className="pb-4 hidden lg:block text-right">
              <div className="text-[10px] font-bold tracking-tight text-slate-400 uppercase tracking-widest mb-1">Enrollment No</div>
              <div className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white tracking-tighter">{profile.enrollmentNo || '—'}</div>
            </div>
          </div>

          <div className="flex flex-nowrap gap-2 border-b border-slate-100 dark:border-slate-800 -mx-4 sm:-mx-12 mb-6 sm:mb-8 px-4 sm:px-12 pb-4 overflow-x-auto no-scrollbar">
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
            >
              {activeTab === 'personal' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="md:col-span-2 space-y-8">
                    <div>
                      <h3 className="text-sm font-bold tracking-tight text-slate-900 dark:text-white uppercase tracking-widest mb-4">Identity Details</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                        <DetailItem label="Full Name" value={student.name} icon={User} />
                        <DetailItem label="Date of Birth" value={profile.dob ? new Date(profile.dob).toLocaleDateString() : '—'} icon={Calendar} />
                        <DetailItem label="Gender" value={profile.gender} icon={User} />
                        <DetailItem label="Blood Group" value={profile.bloodGroup} icon={HeartPulse} />
                        <DetailItem label="National ID" value={profile.nationalId || 'Verified'} icon={CheckCircle} />
                      </div>
                    </div>
                    <div>
                      <h3 className="text-sm font-bold tracking-tight text-slate-900 dark:text-white uppercase tracking-widest mb-4">Contact Information</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                        <DetailItem label="Primary Email" value={student.email} icon={Mail} />
                        <DetailItem label="Phone Number" value={student.phone} icon={Smartphone} />
                        <DetailItem label="Address" value={profile.address} icon={MapPin} className="sm:col-span-2" />
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
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
                        <div className="flex items-center gap-3">
                          <h3 className="text-sm font-bold tracking-tight text-slate-900 dark:text-white uppercase tracking-widest">Primary Contact Information</h3>
                          <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-[10px] font-bold tracking-tight uppercase border border-blue-200 capitalize">
                            {primaryContact}
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
                          className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-indigo-200 bg-indigo-50 text-indigo-700 font-bold text-xs hover:bg-indigo-100 transition-all self-start sm:self-auto"
                        >
                          <Send size={14} />
                          Send Credentials
                        </button>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                        <DetailItem label="Parent Email" value={parents.email || profile.parentEmail} icon={Mail} />
                        <DetailItem label="WhatsApp Number" value={parents.whatsappNumber || fatherPhone || motherPhone || guardianPhone || profile.parentPhone} icon={Phone} />
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
                          <div className="text-sm font-bold text-slate-900 dark:text-white">{fatherPhone || '—'}</div>
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
                          <div className="text-sm font-bold text-slate-900 dark:text-white">{motherPhone || '—'}</div>
                        </div>
                      </div>
                    </div>

                    {(parents.guardianName || primaryContact === 'guardian' || profile.guardianName) && (
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
                            <div className="text-sm font-bold text-slate-900 dark:text-white">{guardianPhone || '—'}</div>
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
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
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
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
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

                  <div className="pt-6 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-bold tracking-tight text-slate-900 dark:text-white uppercase tracking-widest">
                        Class-wise Academic Results
                      </h3>
                      <button
                        type="button"
                        onClick={openAddPrevModal}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm shadow-blue-500/10 active:scale-[0.98] transition-all"
                      >
                        <Plus size={13} />
                        Add Class Result
                      </button>
                    </div>
                    {(() => {
                      const currentClassName = profile.section?.class?.name;
                      const previousResultsList = student.previousResults || [];

                      const resultsByClass = {};
                      previousResultsList.forEach((res) => {
                        if (!res.className) return;
                        const isCurrent = res.className === currentClassName;
                        const key = isCurrent 
                          ? `${res.className} (Ongoing Class)` 
                          : `${res.className} (${res.academicYear || 'N/A'})`;
                        if (!resultsByClass[key]) {
                          resultsByClass[key] = [];
                        }
                        resultsByClass[key].push(res);
                      });

                      if (Object.keys(resultsByClass).length > 0) {
                        return (
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {Object.entries(resultsByClass).map(([classKey, results]) => {
                              const classNameVal = results[0]?.className || classKey;
                              const academicYearVal = results[0]?.academicYear || '';
                              const subjectResults = results.filter((res) => res.subjectName && !(res.assessmentTitle || '').toLowerCase().includes('(total)'));
                              const subjectsList = [...new Set(subjectResults.map((res) => res.subjectName).filter(Boolean))];
                              const subjectsDisplay = subjectsList.length > 0 ? subjectsList.join(', ') : 'General / All Subjects';
                              const totalMarks = subjectResults.reduce((sum, res) => sum + (res.isAbsent ? 0 : Number(res.totalMarks || 0)), 0);
                              const marksObtained = subjectResults.reduce((sum, res) => sum + (res.isAbsent ? 0 : Number(res.marksObtained || 0)), 0);
                              const overallPercentage = totalMarks > 0 ? Math.round((marksObtained / totalMarks) * 100) : 0;

                              return (
                                <div
                                  key={classKey}
                                  onClick={() => navigate(`/school/admin/students/${id}/report-card?class=${encodeURIComponent(classNameVal)}&year=${encodeURIComponent(academicYearVal)}`)}
                                  className="group relative cursor-pointer p-6 rounded-3xl border border-slate-200/85 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-blue-500/50 hover:shadow-xl hover:shadow-blue-500/5 transition-all duration-300 flex flex-col justify-between h-48 active:scale-[0.99]"
                                >
                                  <div className="space-y-2">
                                    <div className="flex justify-between items-start">
                                      <span className="px-3 py-1 rounded-xl bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 font-extrabold text-[10px] uppercase tracking-wider">
                                        {academicYearVal || 'Academic Year'}
                                      </span>
                                      <div className="flex items-center gap-2">
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            openEditPrevModal(classNameVal, academicYearVal, results);
                                          }}
                                          className="w-8 h-8 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-colors"
                                          title="Edit marks"
                                        >
                                          <Edit2 size={14} />
                                        </button>
                                        <div className="w-8 h-8 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400 group-hover:text-blue-500 group-hover:bg-blue-50 dark:group-hover:bg-blue-950/30 transition-colors">
                                          <FileText size={16} />
                                        </div>
                                      </div>
                                    </div>
                                    <h4 className="text-lg font-black text-slate-800 dark:text-white leading-tight tracking-tight group-hover:text-blue-600 transition-colors">
                                      {classNameVal}
                                    </h4>
                                    <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 line-clamp-2 pr-4 leading-normal">
                                      Subjects: {subjectsDisplay}
                                    </p>
                                  </div>
                                  <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
                                    <div>
                                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-0.5">Overall %</span>
                                      <span className="text-2xl font-black text-slate-800 dark:text-white tracking-tighter font-mono">
                                        {overallPercentage}%
                                      </span>
                                    </div>
                                    <span className="text-xs font-extrabold text-blue-600 dark:text-blue-400 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center gap-1 translate-x-2 group-hover:translate-x-0">
                                      View Report Card &rarr;
                                    </span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        );
                      }
                      return <p className="text-sm text-slate-500">No previous class results found on record.</p>;
                    })()}
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
                    const present = attendance.filter(r => ['PRESENT', 'LATE'].includes((r.status || '').toUpperCase())).length;
                    const absent  = attendance.filter(r => (r.status || '').toUpperCase() === 'ABSENT').length;
                    const leave   = attendance.filter(r => (r.status || '').toUpperCase() === 'LEAVE').length;
                    const pct     = total > 0 ? Math.round((present / total) * 100) : 0;

                    const getPctColor = (p) => {
                      if (p >= 90) return 'text-emerald-600 dark:text-emerald-400';
                      if (p >= 75) return 'text-blue-600 dark:text-blue-400';
                      if (p >= 60) return 'text-amber-600 dark:text-amber-400';
                      return 'text-rose-500 dark:text-rose-400';
                    };

                    const statusStyle = (status) => {
                      const s = (status || '').toUpperCase();
                      if (s === 'PRESENT') return 'bg-emerald-500/10 text-emerald-600';
                      if (s === 'ABSENT')  return 'bg-red-500/10 text-red-500';
                      if (s === 'LATE')    return 'bg-amber-400/10 text-amber-600';
                      if (s === 'LEAVE')   return 'bg-amber-400/10 text-amber-600';
                      return 'bg-slate-100 text-slate-500';
                    };

                    return (
                      <>
                        {/* Stats */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
                          <div className="p-4 sm:p-6 rounded-2xl sm:rounded-[2rem] bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 text-center">
                            <div className={`text-2xl sm:text-4xl font-bold tracking-tight mb-1 ${getPctColor(pct)}`}>{total > 0 ? `${pct}%` : '—'}</div>
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
                            <div className="text-2xl sm:text-4xl font-bold tracking-tight mb-1">{leave}</div>
                            <div className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest">Leave</div>
                          </div>
                          <div className="p-4 sm:p-6 rounded-2xl sm:rounded-[2rem] bg-slate-100 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-800 text-center text-slate-600 dark:text-slate-400">
                            <div className="text-2xl sm:text-4xl font-bold tracking-tight mb-1">{total}</div>
                            <div className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest">Total Classes</div>
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

              {activeTab === 'performance' && (() => {
                const sessions = performanceSessions;
                const totalSessions = sessions.length;
                const avgAccuracy = totalSessions > 0
                  ? Math.round(sessions.reduce((sum, s) => sum + (s.accuracy || 0), 0) / totalSessions)
                  : 0;

                return (
                  <div className="space-y-8">
                    {performanceLoading ? (
                      <div className="flex items-center justify-center py-16">
                        <Loader2 size={32} className="animate-spin text-blue-500" />
                      </div>
                    ) : (
                      <>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-6">
                          <div className="p-4 sm:p-6 rounded-2xl sm:rounded-[2rem] bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 text-center">
                            <div className="text-2xl sm:text-4xl font-bold tracking-tight text-blue-600 mb-1">{totalSessions}</div>
                            <div className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-widest">Completed Assessments</div>
                          </div>
                          <div className="p-4 sm:p-6 rounded-2xl sm:rounded-[2rem] bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 text-center">
                            <div className="text-2xl sm:text-4xl font-bold tracking-tight text-emerald-500 mb-1">{totalSessions > 0 ? `${avgAccuracy}%` : '—'}</div>
                            <div className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-widest">Average Accuracy</div>
                          </div>
                          <div className="p-4 sm:p-6 rounded-2xl sm:rounded-[2rem] bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 text-center">
                            <div className="text-2xl sm:text-4xl font-bold tracking-tight text-indigo-600 mb-1">
                              {totalSessions > 0 ? (sessions.reduce((sum, s) => sum + (s.score || 0), 0) / totalSessions).toFixed(1) : '—'}
                            </div>
                            <div className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-widest">Average Score</div>
                          </div>
                        </div>

                        {/* Test Sessions Table */}
                    <div className="rounded-[2rem] border border-slate-100 dark:border-slate-800 overflow-hidden bg-white dark:bg-slate-950">
                      <div className="px-8 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-widest">Assessment History</h4>
                      </div>
                      <div className="overflow-x-auto w-full">
                        <table className="w-full text-left min-w-[700px]">
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
                      </>
                    )}
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
                  <div className="rounded-3xl border border-slate-100 overflow-hidden overflow-x-auto w-full">
                    <table className="w-full text-left min-w-[500px]">
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
