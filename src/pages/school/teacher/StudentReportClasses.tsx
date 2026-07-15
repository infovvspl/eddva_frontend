import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, GraduationCap, Clock, CheckCircle, Edit2, FileText, 
  Loader2, Plus, Trash2, X, PlusCircle, Calendar
} from 'lucide-react';
import api from '@/lib/api/school-client';
import { toast } from 'sonner';
import GlassCard from '@/components/school/GlassCard';
import Badge from '@/components/school/Badge';
import './StudentReportClasses.css';

interface SubjectRow {
  subjectName: string;
  assessments: any;
  remarks: string;
}

export default function StudentReportClasses() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [student, setStudent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isAddPrevOpen, setIsAddPrevOpen] = useState(false);
  const [isSavingPrev, setIsSavingPrev] = useState(false);

  const getClassNumberFromName = (className = '') => {
    const cls = String(className || '').toLowerCase();
    const numeric = cls.match(/\b(?:class|grade|standard|std)?\s*(\d{1,2})\b/);
    if (numeric) return Number(numeric[1]);

    const romanMap: Record<string, number> = {
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

  const calculateReportCardPercentage = (recordsList: any[], className: string) => {
    const isBoard = isBoardResultClass(className);
    const isPrePrimary = isPrePrimaryResultClass(className);

    const subjectResults = recordsList.filter((res) => res.subjectName && !(res.assessmentTitle || '').toLowerCase().includes('(total)'));
    if (!subjectResults.length) return 0;
    if (isPrePrimary) return 0;

    const subjectMap: Record<string, any[]> = {};
    subjectResults.forEach((res: any) => {
      const sub = res.subjectName || 'General';
      if (!subjectMap[sub]) subjectMap[sub] = [];
      subjectMap[sub].push(res);
    });

    let subjectFinals: number[] = [];

    Object.entries(subjectMap).forEach(([subject, records]) => {
      const isIT = isInformationTechnologySubject(subject);
      
      if (isBoard) {
        let obtained = 0, max = 0;
        records.forEach((rec: any) => {
          try {
            if (rec.remarks && String(rec.remarks).trim().startsWith('{')) {
              const parsed = JSON.parse(rec.remarks);
              if (parsed?.type === 'breakdown' && parsed.components) {
                Object.values(parsed.components).forEach((comp: any) => {
                  if (comp && comp.enabled) {
                    obtained += Number(comp.obtained || 0);
                    max += Number(comp.max || 0);
                  }
                });
              }
            } else {
              obtained += Number(rec.marksObtained || 0);
              max += Number(rec.totalMarks || 100);
            }
          } catch (e) {
            obtained += Number(rec.marksObtained || 0);
            max += Number(rec.totalMarks || 100);
          }
        });
        const finalVal = max > 0 ? (obtained / max) * 100 : 0;
        subjectFinals.push(finalVal);
      } else {
        const slotMap = new Map<string, any>();
        const getTermSlot = (titleStr: string) => {
          const title = titleStr.toLowerCase();
          if (title.includes('t1') || title.includes('term 1') || title.includes('mid') || title.includes('half')) {
            if (title.includes('internal') || title.includes('periodic') || title.includes('unit')) {
              return 't1Internal';
            }
            if (isIT) {
              if (title.includes('practical')) return 'halfYearlyPractical';
              if (title.includes('theory')) return 'halfYearlyTheory';
            }
            return 'halfYearly';
          }
          if (title.includes('t2') || title.includes('term 2') || title.includes('annual')) {
            if (title.includes('internal') || title.includes('periodic') || title.includes('unit')) {
              return 't2Internal';
            }
            if (isIT) {
              if (title.includes('practical')) return 'annualPractical';
              if (title.includes('theory')) return 'annualTheory';
            }
            return 'annual';
          }
          return null;
        };

        [...records]
          .sort((a: any, b: any) => {
            const aTime = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
            const bTime = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
            return aTime - bTime;
          })
          .forEach((rec: any) => {
            const slot = getTermSlot(rec.assessmentTitle || '');
            if (slot) {
              slotMap.set(slot, rec);
            }
          });

        let t1Int = 0, h1Exam = 0;
        let t2Int = 0, aExam = 0;
        let theoryObtained = 0, theoryMax = 0;
        let internalObtained = 0;

        Array.from(slotMap.values()).forEach((rec: any) => {
          const title = (rec.assessmentTitle || '').toLowerCase();
          const marks = Number(rec.marksObtained || 0);
          if (title.includes('t1') || title.includes('term 1') || title.includes('mid') || title.includes('half')) {
            if (title.includes('internal') || title.includes('periodic') || title.includes('unit')) {
              t1Int += marks;
            } else {
              h1Exam += marks;
            }
          } else if (title.includes('t2') || title.includes('term 2') || title.includes('annual')) {
            if (title.includes('internal') || title.includes('periodic') || title.includes('unit')) {
              t2Int += marks;
            } else {
              aExam += marks;
            }
          }
          
          try {
            if (rec.remarks && rec.remarks.trim().startsWith('{')) {
              const parsed = JSON.parse(rec.remarks);
              if (parsed.type === 'breakdown' && parsed.components) {
                const comps = parsed.components;
                if (comps.theory?.enabled) {
                  theoryObtained += Number(comps.theory.obtained || 0);
                  theoryMax += Number(comps.theory.max || 0);
                }
                if (comps.internal?.enabled) {
                  internalObtained += Number(comps.internal.obtained || 0);
                }
              }
            } else {
              theoryObtained += Number(rec.marksObtained || 0);
              theoryMax += Number(rec.totalMarks || 100);
            }
          } catch (e) {
            theoryObtained += Number(rec.marksObtained || 0);
            theoryMax += Number(rec.totalMarks || 100);
          }
        });

        if (h1Exam === 0 && aExam === 0) {
          h1Exam = Math.round(theoryObtained * 0.4);
          aExam = Math.round(theoryObtained * 0.5);
          t1Int = Math.round(internalObtained || (theoryObtained * 0.05));
          t2Int = Math.round(internalObtained || (theoryObtained * 0.05));
        }

        let h1Max = 80, aMax = 80;
        Array.from(slotMap.values()).forEach((rec: any) => {
          const title = (rec.assessmentTitle || '').toLowerCase();
          const maxVal = Number(rec.totalMarks || 0);
          if (maxVal > 0) {
            if (title.includes('t1') || title.includes('term 1') || title.includes('mid') || title.includes('half')) {
              if (!title.includes('internal') && !title.includes('periodic') && !title.includes('unit')) {
                h1Max = maxVal;
              }
            } else if (title.includes('t2') || title.includes('term 2') || title.includes('annual')) {
              if (!title.includes('internal') && !title.includes('periodic') && !title.includes('unit')) {
                aMax = maxVal;
              }
            }
          }
        });

        const t1Total = t1Int + h1Exam;
        const t2Total = t2Int + aExam;

        let finalVal = 0;
        if (isIT) {
          finalVal = (h1Exam + aExam) / 2;
        } else {
          const hyScaled = h1Max > 0 ? (h1Exam / h1Max) * 30 : 0;
          const annualScaled = aMax > 0 ? (aExam / aMax) * 50 : 0;
          const internalScaled = (t1Int + t2Int) / 2;
          finalVal = hyScaled + internalScaled + annualScaled;
        }
        subjectFinals.push(Math.min(100, Math.round(finalVal * 100) / 100));
      }
    });

    const sum = subjectFinals.reduce((acc, val) => acc + val, 0);
    return subjectFinals.length > 0 ? Math.round((sum / subjectFinals.length) * 100) / 100 : 0;
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

  const getBlankAssessments = (className = '', subjectName = '') => getResultColumnsForSubject(className, subjectName).reduce((acc: any, item) => {
    acc[item.key] = { obtained: '', max: item.defaultMax };
    return acc;
  }, {});

  const getEditableMaxForResult = (column: any, totalMarks: any) => {
    const savedMax = totalMarks !== undefined && totalMarks !== null ? String(totalMarks) : '';
    if (column.defaultMax === '80' && Number(savedMax) === 100) return column.defaultMax;
    return savedMax || column.defaultMax;
  };

  const migrateAssessmentsForSubject = (className: string, subjectName: string, currentAssessments: any = {}) => {
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

  const initialSubjectRow = (className = ''): SubjectRow => ({
    subjectName: isPrePrimaryResultClass(className) ? 'Early Learner Progress' : '',
    assessments: getBlankAssessments(className),
    remarks: ''
  });

  const [prevForm, setPrevForm] = useState<{
    className: string;
    academicYear: string;
    subjects: SubjectRow[];
  }>({
    className: '',
    academicYear: '',
    subjects: [initialSubjectRow()]
  });

  const resultColumns = getResultColumnsForClass(prevForm.className);

  const openAddPrevModal = () => {
    const profile = student?.studentProfile || {};
    const className = profile?.section?.class?.name || '';
    setPrevForm({
      className,
      academicYear: profile?.section?.class?.academicYear || profile?.academicYear || '',
      subjects: [initialSubjectRow(className)]
    });
    setIsAddPrevOpen(true);
  };

  const openEditPrevModal = (className: string, academicYear: string, results: any[]) => {
    const subjectRows: Record<string, SubjectRow> = {};

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

  const handlePrevClassChange = (className: string) => {
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

  const removeSubjectRow = (idx: number) => {
    setPrevForm(f => ({
      ...f,
      subjects: f.subjects.filter((_, i) => i !== idx)
    }));
  };

  const handlePrevSubjectChange = (idx: number, field: string, value: string) => {
    const nextSubjects = [...prevForm.subjects];
    const current = nextSubjects[idx];
    if (field === 'subjectName') {
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

  const handlePrevAssessmentChange = (idx: number, assessmentKey: string, field: string, value: string) => {
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

  const handleAddPrevResultSubmit = async (e: React.FormEvent) => {
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
      toast.success('Report card saved successfully!');
      setIsAddPrevOpen(false);
      setPrevForm({
        className: '',
        academicYear: '',
        subjects: [initialSubjectRow()]
      });
      fetchStudent();
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.error || err.response?.data?.message || 'Failed to save report card');
    } finally {
      setIsSavingPrev(false);
    }
  };

  const fetchStudent = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/students/${id}`);
      const raw = res.data?.data ?? res.data;
      setStudent(raw);
    } catch (err: any) {
      console.error(err);
      toast.error('Failed to load student details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchStudent();
    }
  }, [id]);

  const resultsByClass = useMemo(() => {
    if (!student) return {};
    const profile = student.studentProfile || {};
    const currentClassName = profile.section?.class?.name;
    const previousResultsList = student.previousResults || [];

    const grouped: Record<string, any[]> = {};
    previousResultsList.forEach((res: any) => {
      if (!res.className) return;
      const isCurrent = res.className === currentClassName;
      const key = isCurrent 
        ? `${res.className} (Ongoing Class)` 
        : `${res.className} (${res.academicYear || 'N/A'})`;
      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(res);
    });
    return grouped;
  }, [student]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <p className="text-sm font-bold text-slate-500">Loading student performance classes...</p>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="p-8 text-center text-slate-500 font-bold">
        Student not found.
      </div>
    );
  }

  const profile = student.studentProfile || {};
  const currentClassName = profile.section?.class?.name || student.className || '—';
  const currentAcademicYear = profile.section?.class?.academicYear || student.academicYear || '—';

  return (
    <div className="student-report-classes pb-12 font-poppins">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-900 font-bold transition-colors text-sm"
        >
          <ArrowLeft size={16} />
          Back to Reports
        </button>
        <button
          type="button"
          onClick={openAddPrevModal}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md transition-all active:scale-[0.98]"
        >
          <PlusCircle size={16} />
          Add Class Result
        </button>
      </div>

      <div className="bg-white dark:bg-slate-950 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-xl shadow-slate-200/30 dark:shadow-none mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-0.5">Student Profile</span>
          <h1 className="text-xl sm:text-2xl font-black text-slate-800 dark:text-white leading-tight">{student.name}</h1>
          <p className="text-xs font-semibold text-slate-500 mt-1">Class: {currentClassName} | Roll No: {profile.rollNo || '—'}</p>
        </div>
        <div className="text-left sm:text-right">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-0.5">Ongoing Term</span>
          <Badge variant="purple">{currentAcademicYear}</Badge>
        </div>
      </div>

      <h3 className="text-sm font-bold tracking-tight text-slate-900 dark:text-white uppercase tracking-widest mb-6">
        Class-wise Academic Results
      </h3>

      {Object.keys(resultsByClass).length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Object.entries(resultsByClass).map(([classKey, results]) => {
            const classNameVal = results[0]?.className || classKey;
            const academicYearVal = results[0]?.academicYear || '';
            const subjectResults = results.filter((res) => res.subjectName && !(res.assessmentTitle || '').toLowerCase().includes('(total)'));
            const subjectsList = [...new Set(subjectResults.map((res) => res.subjectName).filter(Boolean))];
            const subjectsDisplay = subjectsList.length > 0 ? subjectsList.join(', ') : 'General / All Subjects';
            const overallPercentage = calculateReportCardPercentage(results, classNameVal);

            return (
              <GlassCard
                key={classKey}
                onClick={() => navigate(`/school/teacher/reports/student/${id}/report-card?class=${encodeURIComponent(classNameVal)}&year=${encodeURIComponent(academicYearVal)}`)}
                className="group relative cursor-pointer p-6 rounded-3xl border border-slate-200/85 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-blue-500/50 hover:shadow-xl hover:shadow-blue-500/5 transition-all duration-300 flex flex-col justify-between h-48 active:scale-[0.99] student-report-classes__card"
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
              </GlassCard>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12 bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-3xl text-slate-500 font-bold">
          No previous class results found on record.
        </div>
      )}

      {isAddPrevOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}>
          <div className="w-full max-w-4xl max-h-[90vh] bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-6 shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                    <GraduationCap size={20} className="text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">Save Class Result</h3>
                    <p className="text-xs text-blue-200 font-bold">Record historical academic achievements</p>
                  </div>
                </div>
                <button onClick={() => setIsAddPrevOpen(false)} className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center text-white hover:bg-white/30 transition-all">
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleAddPrevResultSubmit} className="p-4 sm:p-8 space-y-5 overflow-y-auto flex-1 no-scrollbar">
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
    </div>
  );
}
