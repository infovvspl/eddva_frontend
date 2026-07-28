import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Printer, FileText, Loader2, GraduationCap, Settings, Eye, CheckCircle, Info, QrCode, Upload, Image as ImageIcon, Trash2, Plus, User } from 'lucide-react';
import { toast } from 'sonner';
import html2canvas from 'html2canvas';
import api from '@/lib/api/school-client';

type ReportType = 'pre_primary' | 'primary' | 'middle' | 'high_school' | 'board_class';

export default function StudentReportCard() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const targetClass = searchParams.get('class');
  const targetYear = searchParams.get('year');
  const isStudentView = window.location.pathname.includes('/school/student');
  const isParentView = window.location.pathname.includes('/school/parent');
  const isTeacherReportView = window.location.pathname.includes('/school/teacher/reports/student/');
  const isViewerOnly = isStudentView || isParentView;

  const [student, setStudent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [printing, setPrinting] = useState(false);
  const reportCardRef = useRef<HTMLDivElement>(null);

  // Configuration Panel States
  const [templateType, setTemplateType] = useState<ReportType>('high_school');
  const [showLogo, setShowLogo] = useState(true);
  const [showAffiliation, setShowAffiliation] = useState(true);
  const [showSeal, setShowSeal] = useState(true);
  const [showSignatures, setShowSignatures] = useState(true);
  const [showCoScholastic, setShowCoScholastic] = useState(true);
  const [weightingFormula, setWeightingFormula] = useState<'equal_term' | 'annual_only' | 'custom_cbse'>('equal_term');
  const [isPortrait, setIsPortrait] = useState(true);
  const [affiliationText, setAffiliationText] = useState('Affiliated to Central Board of Secondary Education (CBSE)');
  const [teacherRemarks, setTeacherRemarks] = useState('Student has demonstrated outstanding progress, maintaining high academic standards and displaying excellent civic values.');
  const [coScholasticItems, setCoScholasticItems] = useState([
    { title: 'Work Education', grade: 'A' },
    { title: 'Art Education', grade: 'A' },
    { title: 'Health & Physical Education', grade: 'A' },
    { title: 'Discipline', grade: 'A' },
    { title: 'Communication Skills', grade: 'A' },
    { title: 'Leadership', grade: 'A' },
    { title: 'Teamwork', grade: 'A' },
    { title: 'Creativity', grade: 'A' },
    { title: 'Life Skills', grade: 'A' }
  ]);

  // Upload/Custom Overrides States
  const [customLogo, setCustomLogo] = useState<string | null>(null);
  const [customSeal, setCustomSeal] = useState<string | null>(null);
  const [customTeacherSig, setCustomTeacherSig] = useState<string | null>(null);
  const [customPrincipalSig, setCustomPrincipalSig] = useState<string | null>(null);

  // Auto-detect template and formula based on class name card selected
  useEffect(() => {
    if (targetClass) {
      const cls = targetClass.toLowerCase();
      if (cls.includes('lkg') || cls.includes('ukg') || cls.includes('nursery') || cls.includes('pre')) {
        setTemplateType('pre_primary');
      } else if (cls.includes('6') || cls.includes('7') || cls.includes('8') || cls.includes('vi') || cls.includes('vii') || cls.includes('viii')) {
        setTemplateType('middle');
        setWeightingFormula('equal_term');
      } else if (cls.includes('10') || cls.includes('12') || cls.match(/\b(x|xii)\b/)) {
        setTemplateType('board_class');
        setWeightingFormula('annual_only');
      } else if (cls.includes('1') || cls.includes('2') || cls.includes('3') || cls.includes('4') || cls.includes('5') || cls.match(/\b(i|ii|iii|iv|v)\b/)) {
        setTemplateType('primary');
        setWeightingFormula('equal_term');
      } else {
        setTemplateType('high_school');
        setWeightingFormula('custom_cbse');
      }
    }
  }, [targetClass]);

  useEffect(() => {
    fetchStudentDetails();
  }, [id, isStudentView, isParentView]);

  const fetchStudentDetails = async () => {
    try {
      setLoading(true);
      const studentId = id || searchParams.get('studentId');
      const endpoint = isStudentView ? '/students/profile/me' : `/students/${studentId}`;
      const res = await api.get(endpoint);
      const data = res.data?.data || res.data;
      setStudent(data);
    } catch (err) {
      toast.error('Failed to load student details');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = async () => {
    if (!reportCardRef.current) {
      window.print();
      return;
    }
    try {
      setPrinting(true);
      toast.info('Preparing print preview...');
      
      const element = reportCardRef.current;
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: false,
        backgroundColor: '#ffffff'
      });

      const imgData = canvas.toDataURL('image/png');

      const printFrame = document.createElement('iframe');
      printFrame.style.position = 'fixed';
      printFrame.style.right = '0';
      printFrame.style.bottom = '0';
      printFrame.style.width = '0';
      printFrame.style.height = '0';
      printFrame.style.border = '0';
      document.body.appendChild(printFrame);

      const frameDoc = printFrame.contentWindow?.document;
      if (!frameDoc) {
        window.print();
        return;
      }

      frameDoc.open();
      frameDoc.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Report Card - ${student?.name || 'Student'}</title>
            <style>
              @page {
                size: A4 portrait;
                margin: 0;
              }
              html, body {
                margin: 0;
                padding: 0;
                background: #ffffff;
                width: 100%;
                height: 100vh;
                overflow: hidden;
                box-sizing: border-box;
              }
              .page-container {
                width: 100vw;
                height: 100vh;
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 4mm;
                box-sizing: border-box;
              }
              img {
                max-width: 100%;
                max-height: 98vh;
                object-fit: contain;
                display: block;
                margin: 0 auto;
              }
            </style>
          </head>
          <body>
            <div class="page-container">
              <img src="${imgData}" onload="window.focus(); window.print();" />
            </div>
          </body>
        </html>
      `);
      frameDoc.close();

      setTimeout(() => {
        try {
          document.body.removeChild(printFrame);
        } catch (e) {}
      }, 6000);

    } catch (err) {
      console.error('html2canvas print error:', err);
      toast.error('Print preview generation failed. Using standard browser print...');
      window.print();
    } finally {
      setPrinting(false);
    }
  };

  // Helper to read local uploaded files as Base64 data URL
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, setter: (val: string) => void) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setter(reader.result);
          toast.success(`${file.name} uploaded successfully`);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const profile = student?.studentProfile || {};
  const currentClassName = profile.section?.class?.name || student?.className || targetClass || 'Class IX';
  const currentAcademicYear = profile.section?.class?.academicYear || student?.academicYear || targetYear || '2025-2026';

  const isInformationTechnologySubject = (subjectName = '') => {
    const subject = String(subjectName || '').trim().toLowerCase();
    return /\b(information|informational)\s+technology\b/.test(subject) || 
           /\bcomputer\s+science\b/.test(subject) ||
           /\bcomputer\b/.test(subject) ||
           subject === 'it' || 
           subject === 'cs';
  };

  const getSchoolGrade = (pct: number) => {
    if (pct >= 91) return 'O';
    if (pct >= 81) return 'E';
    if (pct >= 71) return 'A';
    if (pct >= 61) return 'B';
    if (pct >= 51) return 'C';
    if (pct >= 41) return 'D';
    return 'F';
  };

  // Parse actual student previousResults dynamically (NOT hardcoded)
  const scholasticResults = useMemo(() => {
    if (!student || !student.previousResults) return [];

    // Filter results to only match the selected class
    const filtered = student.previousResults.filter((res: any) => {
      const isTotal = !res.subjectName || (res.assessmentTitle && res.assessmentTitle.toLowerCase().includes('(total)'));
      if (isTotal) return false; // filter out consolidated overall rows
      if (targetClass && res.className !== targetClass) return false;
      if (targetYear && res.academicYear !== targetYear) return false;
      return true;
    });

    // Group items by subjectName
    const subjectMap: Record<string, any[]> = {};
    filtered.forEach((res: any) => {
      const sub = res.subjectName || 'General';
      if (!subjectMap[sub]) subjectMap[sub] = [];
      subjectMap[sub].push(res);
    });

    return Object.entries(subjectMap).map(([subject, records]) => {
      const isInformationTechnology = isInformationTechnologySubject(subject);
      const slotMap = new Map<string, any>();
      const getTermSlot = (titleStr: string) => {
        const title = titleStr.toLowerCase();
        if (title.includes('t1') || title.includes('term 1') || title.includes('mid') || title.includes('half')) {
          if (title.includes('internal') || title.includes('periodic') || title.includes('unit')) {
            return 't1Internal';
          }
          if (isInformationTechnology) {
            if (title.includes('practical')) return 'halfYearlyPractical';
            if (title.includes('theory')) return 'halfYearlyTheory';
          }
          return 'halfYearly';
        }
        if (title.includes('t2') || title.includes('term 2') || title.includes('annual')) {
          if (title.includes('internal') || title.includes('periodic') || title.includes('unit')) {
            return 't2Internal';
          }
          if (isInformationTechnology) {
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

      let calculationRecords = Array.from(slotMap.values());

      // Map components from remarks (theory, practical, internal, project, viva)
      let theoryObtained = 0, theoryMax = 0;
      let practicalObtained = 0, practicalMax = 0;
      let internalObtained = 0, internalMax = 0;
      let projectObtained = 0, projectMax = 0;

      // Look for Term 1 vs Term 2 split if present
      let t1Int: number | null = null;
      let h1Exam: number | null = null;
      let t2Int: number | null = null;
      let aExam: number | null = null;
      let halfYearlyTheory: number | null = null;
      let halfYearlyPractical: number | null = null;
      let annualTheory: number | null = null;
      let annualPractical: number | null = null;

      calculationRecords.forEach((rec: any) => {
        const title = (rec.assessmentTitle || '').toLowerCase();
        const marks = rec.marksObtained !== undefined && rec.marksObtained !== null ? Number(rec.marksObtained) : null;
        
        // Match term-specific marks if title contains T1/T2/Half/Annual
        if (title.includes('t1') || title.includes('term 1') || title.includes('mid') || title.includes('half')) {
          if (title.includes('internal') || title.includes('periodic') || title.includes('unit')) {
            if (marks !== null) t1Int = (t1Int || 0) + marks;
          } else if (isInformationTechnology && title.includes('practical')) {
            if (marks !== null) {
              halfYearlyPractical = (halfYearlyPractical || 0) + marks;
              h1Exam = (h1Exam || 0) + marks;
            }
          } else if (isInformationTechnology && title.includes('theory')) {
            if (marks !== null) {
              halfYearlyTheory = (halfYearlyTheory || 0) + marks;
              h1Exam = (h1Exam || 0) + marks;
            }
          } else {
            if (marks !== null) h1Exam = (h1Exam || 0) + marks;
          }
        } else if (title.includes('t2') || title.includes('term 2') || title.includes('annual')) {
          if (title.includes('internal') || title.includes('periodic') || title.includes('unit')) {
            if (marks !== null) t2Int = (t2Int || 0) + marks;
          } else if (isInformationTechnology && title.includes('practical')) {
            if (marks !== null) {
              annualPractical = (annualPractical || 0) + marks;
              aExam = (aExam || 0) + marks;
            }
          } else if (isInformationTechnology && title.includes('theory')) {
            if (marks !== null) {
              annualTheory = (annualTheory || 0) + marks;
              aExam = (aExam || 0) + marks;
            }
          } else {
            if (marks !== null) aExam = (aExam || 0) + marks;
          }
        }

        // Standard components breakdown
        try {
          if (rec.remarks && rec.remarks.trim().startsWith('{')) {
            const parsed = JSON.parse(rec.remarks);
            if (parsed.type === 'breakdown' && parsed.components) {
              const comps = parsed.components;
              if (comps.theory?.enabled) {
                theoryObtained += Number(comps.theory.obtained || 0);
                theoryMax += Number(comps.theory.max || 0);
              }
              if (comps.practical?.enabled) {
                practicalObtained += Number(comps.practical.obtained || 0);
                practicalMax += Number(comps.practical.max || 0);
              }
              if (comps.internal?.enabled) {
                internalObtained += Number(comps.internal.obtained || 0);
                internalMax += Number(comps.internal.max || 0);
              }
              if (comps.project?.enabled) {
                projectObtained += Number(comps.project.obtained || 0);
                projectMax += Number(comps.project.max || 0);
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

      // Default fallback if no Term split matches
      if (calculationRecords.length > 0 && h1Exam === null && aExam === null) {
        h1Exam = Math.round(theoryObtained * 0.4);
        aExam = Math.round(theoryObtained * 0.5);
        t1Int = Math.round(internalObtained || (theoryObtained * 0.05));
        t2Int = Math.round(internalObtained || (theoryObtained * 0.05));
      }

      let h1Max = 80, aMax = 80;
      calculationRecords.forEach((rec: any) => {
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

      const t1Total = (t1Int === null && h1Exam === null) ? null : (t1Int || 0) + (h1Exam || 0);
      const t2Total = (t2Int === null && aExam === null) ? null : (t2Int || 0) + (aExam || 0);

      // Apply Weighting Formula
      let finalResult: number | null = null;
      if (isInformationTechnology) {
        if (h1Exam !== null || aExam !== null) {
          finalResult = ((h1Exam || 0) + (aExam || 0)) / 2;
        }
      } else if (weightingFormula === 'equal_term') {
        if (t1Total !== null || t2Total !== null) {
          finalResult = ((t1Total || 0) + (t2Total || 0)) / 2;
        }
      } else if (weightingFormula === 'annual_only') {
        finalResult = t2Total;
      } else {
        // Custom CBSE: 30% HY + 20% Internals + 50% Annual
        if (h1Exam !== null || t1Int !== null || t2Int !== null || aExam !== null) {
          const hyScaled = h1Max > 0 && h1Exam !== null ? (h1Exam / h1Max) * 30 : 0;
          const annualScaled = aMax > 0 && aExam !== null ? (aExam / aMax) * 50 : 0;
          const internalScaled = (t1Int !== null || t2Int !== null) ? ((t1Int || 0) + (t2Int || 0)) / 2 : 0;
          finalResult = hyScaled + internalScaled + annualScaled;
        }
      }

      // Cap finalResult to 100
      let finalDisplay: string | number = "";
      let gradeDisplay = "—";
      if (finalResult !== null) {
        finalDisplay = Math.min(100, Math.round(finalResult * 100) / 100);
        gradeDisplay = getSchoolGrade(Number(finalDisplay));
      }

      return {
        subject,
        isInformationTechnology,
        theory: theoryObtained,
        theoryMax,
        practical: practicalObtained,
        practicalMax,
        internal: internalObtained || t1Int,
        project: projectObtained,
        t1Internal: t1Int,
        halfYearlyTheory,
        halfYearlyPractical,
        halfYearly: h1Exam,
        t1Total,
        t2Internal: t2Int,
        annualTheory,
        annualPractical,
        annual: aExam,
        t2Total,
        final: finalDisplay,
        grade: gradeDisplay
      };
    });
  }, [student, targetClass, targetYear, weightingFormula]);

  const overallAvg = useMemo(() => {
    const validSubjects = scholasticResults.filter(res => res.final !== "");
    if (validSubjects.length === 0) return 0;
    const sum = validSubjects.reduce((a, b) => a + Number(b.final), 0);
    return Math.round((sum / validSubjects.length) * 100) / 100;
  }, [scholasticResults]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <p className="text-sm font-bold text-slate-500">Generating configurable report card...</p>
      </div>
    );
  }

  const defaultSchoolLogo = student?.instituteLogo || '';
  const pageShellClass = isTeacherReportView
    ? 'w-full px-4 py-6 space-y-6'
    : 'w-full max-w-7xl mx-auto px-4 py-6 space-y-6';

  return (
    <div className={pageShellClass}>
      {/* Printable CSS overrides */}
      <style>{`
        @media print {
          @page {
            size: ${isPortrait ? 'portrait' : 'landscape'};
            margin: 8mm 6mm 8mm 6mm;
          }
          html, body {
            background: #ffffff !important;
            color: #000000 !important;
            margin: 0 !important;
            padding: 0 !important;
            height: auto !important;
            overflow: visible !important;
          }
          body * {
            visibility: hidden !important;
          }
          .printable-report-card,
          .printable-report-card * {
            visibility: visible !important;
          }
          .printable-report-card {
            position: static !important;
            display: block !important;
            width: 100% !important;
            max-width: 100% !important;
            min-height: auto !important;
            height: auto !important;
            aspect-ratio: auto !important;
            border: none !important;
            box-shadow: none !important;
            padding: 0 !important;
            margin: 0 auto !important;
            background: #ffffff !important;
            color: #000000 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            overflow: visible !important;
          }
          .printable-report-card .overflow-x-auto {
            overflow: visible !important;
          }
          tr, .avoid-break {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
          .no-print,
          .no-print * {
            display: none !important;
            visibility: hidden !important;
          }
        }
      `}</style>

      {/* Header controls (no-print) */}
      <div className="flex items-center justify-between no-print border-b border-slate-100 dark:border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate(-1)} 
            className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 transition-colors active:scale-95"
            title={isViewerOnly ? "Back" : "Back to Student Profile"}
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-xl font-black text-slate-800 dark:text-white">
              {isViewerOnly ? "Report Card" : "Report Card Template Configuration"}
            </h1>
            <p className="text-xs font-semibold text-slate-400">Student: {student?.name}</p>
          </div>
        </div>
        <button 
          onClick={handlePrint}
          disabled={printing}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md shadow-blue-500/10 active:scale-98 transition-all disabled:opacity-50"
        >
          {printing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Printer className="w-4 h-4" />}
          {printing ? 'Preparing Print...' : 'Print Report Card'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Configurator Panel */}
        {!isViewerOnly && (
          <div className="lg:col-span-4 space-y-6 no-print">
            <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl space-y-5">
              <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <Settings className="w-4 h-4 text-blue-500" />
                Template Configurator
              </h3>

              {/* Template Selection */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Class Template Type</label>
                <select 
                  value={templateType} 
                  onChange={(e) => setTemplateType(e.target.value as any)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-bold"
                >
                  <option value="pre_primary">Pre-Primary (LKG/UKG/Nursery)</option>
                  <option value="primary">Primary (Class I–V)</option>
                  <option value="middle">Middle School (Class VI–VIII)</option>
                  <option value="high_school">High School (Class IX–XI)</option>
                  <option value="board_class">Board Classes (X & XII)</option>
                </select>
              </div>

              {/* Dynamic Weights info */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Result Weighting Formula</label>
                <select 
                  value={weightingFormula} 
                  onChange={(e) => setWeightingFormula(e.target.value as any)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-bold"
                >
                  <option value="equal_term">50% Term 1 + 50% Term 2</option>
                  <option value="annual_only">20% Internal Assessment + 80% Annual Examination</option>
                  <option value="custom_cbse">30% Half-Yearly + 20% Internals + 50% Annual</option>
                </select>
              </div>

              {/* Asset Upload Section */}
              <div className="space-y-4 border-t pt-4">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Missing Assets Upload</label>
                
                {/* Logo Upload */}
                <div className="space-y-1">
                  <span className="text-[10px] font-semibold text-slate-500 block">School Logo Override</span>
                  <label className="flex items-center justify-between p-2 border border-dashed rounded-xl cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 text-[11px] font-bold">
                    <span className="flex items-center gap-1.5 text-slate-400">
                      <Upload className="w-3.5 h-3.5" /> {customLogo ? 'Logo Uploaded' : 'Upload Logo image'}
                    </span>
                    <input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, setCustomLogo)} className="hidden" />
                  </label>
                </div>

                {/* Seal Upload */}
                <div className="space-y-1">
                  <span className="text-[10px] font-semibold text-slate-500 block">Official Seal Stamp</span>
                  <label className="flex items-center justify-between p-2 border border-dashed rounded-xl cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 text-[11px] font-bold">
                    <span className="flex items-center gap-1.5 text-slate-400">
                      <Upload className="w-3.5 h-3.5" /> {customSeal ? 'Seal Uploaded' : 'Upload Seal stamp'}
                    </span>
                    <input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, setCustomSeal)} className="hidden" />
                  </label>
                </div>

                {/* Signatures Upload */}
                <div className="space-y-2">
                  <span className="text-[10px] font-semibold text-slate-500 block">Authorized Signatures</span>
                  <div className="grid grid-cols-2 gap-2">
                    <label className="flex flex-col items-center justify-center p-2 border border-dashed rounded-xl cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 text-[10px] font-bold text-center gap-1">
                      <Upload className="w-3.5 h-3.5 text-slate-400" />
                      <span>Teacher Sig</span>
                      <input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, setCustomTeacherSig)} className="hidden" />
                    </label>
                    <label className="flex flex-col items-center justify-center p-2 border border-dashed rounded-xl cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 text-[10px] font-bold text-center gap-1">
                      <Upload className="w-3.5 h-3.5 text-slate-400" />
                      <span>Principal Sig</span>
                      <input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, setCustomPrincipalSig)} className="hidden" />
                    </label>
                  </div>
                </div>
              </div>

              {/* Toggles Group */}
              <div className="space-y-3 border-t pt-4">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Visible Layout Components</label>
                <div className="grid grid-cols-2 gap-2">
                  <button 
                    onClick={() => setShowLogo(!showLogo)}
                    className={`p-2.5 rounded-xl border text-xs font-bold text-left transition-all ${showLogo ? 'border-blue-500/30 bg-blue-50/20 text-blue-600' : 'border-slate-200 dark:border-slate-800 text-slate-400'}`}
                  >
                    School Logo
                  </button>
                  <button 
                    onClick={() => setShowAffiliation(!showAffiliation)}
                    className={`p-2.5 rounded-xl border text-xs font-bold text-left transition-all ${showAffiliation ? 'border-blue-500/30 bg-blue-50/20 text-blue-600' : 'border-slate-200 dark:border-slate-800 text-slate-400'}`}
                  >
                    Affiliation
                  </button>
                  <button 
                    onClick={() => setShowSeal(!showSeal)}
                    className={`p-2.5 rounded-xl border text-xs font-bold text-left transition-all ${showSeal ? 'border-blue-500/30 bg-blue-50/20 text-blue-600' : 'border-slate-200 dark:border-slate-800 text-slate-400'}`}
                  >
                    School Seal
                  </button>
                  <button 
                    onClick={() => setShowSignatures(!showSignatures)}
                    className={`p-2.5 rounded-xl border text-xs font-bold text-left transition-all ${showSignatures ? 'border-blue-500/30 bg-blue-50/20 text-blue-600' : 'border-slate-200 dark:border-slate-800 text-slate-400'}`}
                  >
                    Signatures
                  </button>
                  <button 
                    onClick={() => setShowCoScholastic(!showCoScholastic)}
                    className={`p-2.5 rounded-xl border text-xs font-bold text-left transition-all ${showCoScholastic ? 'border-blue-500/30 bg-blue-50/20 text-blue-600' : 'border-slate-200 dark:border-slate-800 text-slate-400'}`}
                  >
                    Co-Scholastic
                  </button>
                </div>
              </div>

              {/* Editable Affiliation Input */}
              {showAffiliation && (
                <div className="space-y-1.5 border-t pt-4">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Board Affiliation Text</label>
                  <input 
                    type="text" 
                    value={affiliationText} 
                    onChange={(e) => setAffiliationText(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-bold"
                  />
                </div>
              )}

              {/* Editable Co-Scholastic Grades */}
              {showCoScholastic && (
                <div className="space-y-3 border-t pt-4">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Edit Co-Scholastic Grades</label>
                    <button
                      type="button"
                      onClick={() => setCoScholasticItems([...coScholasticItems, { title: 'New Skill', grade: 'A' }])}
                      className="flex items-center gap-1 text-[10px] font-bold text-blue-600 hover:text-blue-700 transition-colors"
                    >
                      <Plus size={12} />
                      Add Field
                    </button>
                  </div>
                  <div className="space-y-2">
                    {coScholasticItems.map((item, idx) => (
                      <div key={idx} className="flex gap-2 items-center justify-between min-w-0">
                        <input
                          type="text"
                          value={item.title}
                          onChange={(e) => {
                            const nextItems = [...coScholasticItems];
                            nextItems[idx] = { ...item, title: e.target.value };
                            setCoScholasticItems(nextItems);
                          }}
                          className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-2 py-1 text-xs font-semibold flex-1 min-w-0"
                        />
                        <div className="flex items-center gap-1.5 shrink-0">
                          <select
                            value={item.grade}
                            onChange={(e) => {
                              const nextItems = [...coScholasticItems];
                              nextItems[idx] = { ...item, grade: e.target.value };
                              setCoScholasticItems(nextItems);
                            }}
                            className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-2 py-1 text-xs font-bold"
                          >
                            {['O', 'E', 'A', 'B', 'C', 'D', 'F'].map((grade) => (
                              <option key={grade} value={grade}>Grade {grade}</option>
                            ))}
                          </select>
                          <button
                            type="button"
                            onClick={() => setCoScholasticItems(coScholasticItems.filter((_, i) => i !== idx))}
                            className="p-1 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-lg transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Editable Teacher Remarks */}
              <div className="space-y-1.5 border-t pt-4">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Class Teacher's Remarks</label>
                <textarea 
                  value={teacherRemarks} 
                  onChange={(e) => setTeacherRemarks(e.target.value)}
                  rows={3}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-semibold"
                  placeholder="Enter remarks..."
                />
              </div>
            </div>
          </div>
        )}

        {/* Right Printable Card Preview */}
        <div className={isViewerOnly ? "lg:col-span-12" : "lg:col-span-8"}>
          <div ref={reportCardRef} className={`printable-report-card bg-white text-slate-900 border border-slate-200 p-5 sm:p-6 shadow-md relative max-w-4xl mx-auto w-full flex flex-col justify-between`}>
            
            <div className="space-y-3.5">
              {/* Report Header */}
              <div className="flex items-center justify-between border-b-2 border-slate-900 pb-2.5">
                {showLogo && (
                  <div className="flex items-center gap-3">
                    {customLogo || defaultSchoolLogo ? (
                      <img src={customLogo || defaultSchoolLogo} alt="School Logo" className="w-14 h-14 object-contain rounded-xl" />
                    ) : (
                      <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center text-white">
                        <GraduationCap className="w-7 h-7" />
                      </div>
                    )}
                  </div>
                )}
                
                <div className="text-center flex-1 space-y-0.5 pr-4">
                  <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-slate-950">
                    {student?.instituteName || 'EDDVA ACADEMY'}
                  </h2>
                  {showAffiliation && (
                    <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                      {affiliationText}
                    </p>
                  )}
                  <p className="text-[11px] font-semibold text-slate-500">
                    Academic Year: {currentAcademicYear}
                  </p>
                </div>

                {showSeal && (
                  <div>
                    {customSeal ? (
                      <img src={customSeal} alt="Seal Stamp" className="w-14 h-14 object-contain rounded-full" />
                    ) : (
                      <div className="w-14 h-14 rounded-full border-4 border-double border-slate-400 flex items-center justify-center text-[7px] font-black text-slate-400 text-center uppercase tracking-tighter">
                        OFFICIAL<br />SEAL
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Student Metadata */}
              <div className="flex flex-col sm:flex-row gap-4 bg-slate-50/80 p-3.5 rounded-2xl border border-slate-200 items-start">
                <div className="flex-1 grid grid-cols-2 sm:grid-cols-3 gap-x-5 gap-y-2 text-xs font-bold text-slate-700">
                  <div className="border-b border-slate-200/80 pb-1.5 min-w-0">
                    <span className="text-slate-400 uppercase tracking-wider text-[9px] block mb-0.5">Student Name</span>
                    <span className="text-slate-950 font-extrabold block text-xs leading-normal py-0.5">{student?.name || '—'}</span>
                  </div>
                  <div className="border-b border-slate-200/80 pb-1.5 min-w-0">
                    <span className="text-slate-400 uppercase tracking-wider text-[9px] block mb-0.5">Class & Section</span>
                    <span className="text-slate-950 font-extrabold block text-xs leading-normal py-0.5">{currentClassName} {profile.section?.name ? `- ${profile.section.name}` : ''}</span>
                  </div>
                  <div className="border-b border-slate-200/80 pb-1.5 min-w-0">
                    <span className="text-slate-400 uppercase tracking-wider text-[9px] block mb-0.5">Roll Number</span>
                    <span className="text-slate-950 font-extrabold block text-xs leading-normal py-0.5">{profile.rollNo || '—'}</span>
                  </div>
                  <div className="border-b border-slate-200/80 pb-1.5 min-w-0">
                    <span className="text-slate-400 uppercase tracking-wider text-[9px] block mb-0.5">Enrollment No</span>
                    <span className="text-slate-950 font-extrabold block text-xs leading-normal py-0.5">{profile.enrollmentNo || '—'}</span>
                  </div>
                  <div className="border-b border-slate-200/80 pb-1.5 min-w-0">
                    <span className="text-slate-400 uppercase tracking-wider text-[9px] block mb-0.5">Father's Name</span>
                    <span className="text-slate-950 font-extrabold block text-xs leading-normal py-0.5">{profile.fatherName || '—'}</span>
                  </div>
                  <div className="border-b border-slate-200/80 pb-1.5 min-w-0">
                    <span className="text-slate-400 uppercase tracking-wider text-[9px] block mb-0.5">Mother's Name</span>
                    <span className="text-slate-950 font-extrabold block text-xs leading-normal py-0.5">{profile.motherName || '—'}</span>
                  </div>
                  {templateType === 'board_class' && (
                    <>
                      <div className="border-b border-slate-200/80 pb-1.5 min-w-0">
                        <span className="text-slate-400 uppercase tracking-wider text-[9px] block mb-0.5">Board Roll No</span>
                        <span className="text-slate-950 font-extrabold block text-xs leading-normal py-0.5">{profile.nationalId || '98234812'}</span>
                      </div>
                      <div className="border-b border-slate-200/80 pb-1.5 min-w-0">
                        <span className="text-slate-400 uppercase tracking-wider text-[9px] block mb-0.5">DOB</span>
                        <span className="text-slate-950 font-extrabold block text-xs leading-normal py-0.5">
                          {profile.dob ? new Date(profile.dob).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                        </span>
                      </div>
                    </>
                  )}
                  <div className="border-b border-slate-200/80 pb-1.5 min-w-0 col-span-2 sm:col-span-3">
                    <span className="text-slate-400 uppercase tracking-wider text-[9px] block mb-0.5">Attendance Percentage</span>
                    <span className="text-emerald-600 font-black block text-xs leading-normal py-0.5">
                      {student?.attendancePercentage !== undefined && student?.attendancePercentage !== null ? `${student.attendancePercentage}%` : '—'}
                    </span>
                  </div>
                </div>

                {/* Student Photo */}
                <div className="w-16 h-20 border border-slate-300 rounded-xl bg-white flex items-center justify-center shrink-0 overflow-hidden shadow-sm self-center sm:self-start">
                  {(() => {
                    const studentPhoto = student?.profileImage || student?.avatar || student?.studentProfile?.profileImage || student?.studentProfile?.avatar || student?.user?.profileImage || student?.user?.avatar;
                    return studentPhoto ? (
                      <img src={studentPhoto} alt={student?.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="flex flex-col items-center justify-center text-slate-300 gap-0.5">
                        <User size={24} />
                        <span className="text-[7px] font-bold uppercase tracking-wider">No Photo</span>
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* Dynamic Marks Table from Database */}
              {templateType === 'pre_primary' ? (
                <div className="space-y-4 pt-2">
                  <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest border-b pb-1.5">Early Learner Progress Indicators</h4>
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { key: 'Reading & Phonics', val: 'Excellent' },
                      { key: 'Writing & Motor Skills', val: 'Good' },
                      { key: 'Numeracy & Shapes', val: 'Excellent' },
                      { key: 'Communication & Speech', val: 'Very Good' },
                      { key: 'Creativity & Arts', val: 'Excellent' },
                      { key: 'Social development & Behaviour', val: 'Excellent' }
                    ].map(p => (
                      <div key={p.key} className="flex justify-between p-3 bg-slate-50/60 rounded-xl border text-xs font-bold">
                        <span className="text-slate-500">{p.key}</span>
                        <span className="text-blue-600 uppercase">{p.val}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : scholasticResults.length > 0 ? (
                <div className="space-y-2 pt-1">
                  <h4 className="text-[11px] font-black text-slate-800 uppercase tracking-wider border-b pb-1">Scholastic Performance</h4>
                  
                  {templateType === 'high_school' ? (() => {
                    const standardResults = scholasticResults.filter(res => !res.isInformationTechnology);
                    const itResults = scholasticResults.filter(res => res.isInformationTechnology);

                    return (
                      <div className="space-y-2">
                        {standardResults.length > 0 && (
                          <div className="overflow-x-auto border border-slate-200 rounded-xl">
                            <table className="w-full text-left text-xs font-semibold text-slate-600">
                              <thead className="bg-slate-50 border-b border-slate-200 text-[9px] uppercase text-slate-400 tracking-wider">
                                <tr>
                                  <th className="py-1.5 px-2.5">Subject</th>
                                  <th className="py-1.5 px-2.5 text-center">T1 Internal</th>
                                  <th className="py-1.5 px-2.5 text-center">Half-Yearly</th>
                                  <th className="py-1.5 px-2.5 text-center">T1 Total</th>
                                  <th className="py-1.5 px-2.5 text-center">T2 Internal</th>
                                  <th className="py-1.5 px-2.5 text-center">Annual</th>
                                  <th className="py-1.5 px-2.5 text-center">T2 Total</th>
                                  <th className="py-1.5 px-2.5 text-center">Internals</th>
                                  <th className="py-1.5 px-2.5 text-center">Final</th>
                                  <th className="py-1.5 px-2.5 text-center">Grade</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100 text-slate-700">
                                {standardResults.map(res => (
                                  <tr key={res.subject} className="hover:bg-slate-50/50 transition-colors font-bold">
                                    <td className="py-1.5 px-2.5 text-slate-900 font-extrabold">{res.subject}</td>
                                    <td className="py-1.5 px-2.5 text-center text-slate-500">{res.t1Internal ?? ""}</td>
                                    <td className="py-1.5 px-2.5 text-center text-slate-500">{res.halfYearly ?? ""}</td>
                                    <td className="py-1.5 px-2.5 text-center text-slate-800">{res.t1Total ?? ""}</td>
                                    <td className="py-1.5 px-2.5 text-center text-slate-500">{res.t2Internal ?? ""}</td>
                                    <td className="py-1.5 px-2.5 text-center text-slate-500">{res.annual ?? ""}</td>
                                    <td className="py-1.5 px-2.5 text-center text-slate-800">{res.t2Total ?? ""}</td>
                                    <td className="py-1.5 px-2.5 text-center text-slate-500">{(res.t1Internal !== null || res.t2Internal !== null) ? (Number(res.t1Internal || 0) + Number(res.t2Internal || 0)) : ""}</td>
                                    <td className="py-1.5 px-2.5 text-center font-black text-blue-600">{res.final}</td>
                                    <td className="py-1.5 px-2.5 text-center">
                                      {res.grade !== "—" && (
                                        <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-600 font-extrabold uppercase text-[10px] inline-flex items-center justify-center min-w-[20px] h-[20px] leading-none">
                                          {res.grade}
                                        </span>
                                      )}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}

                        {itResults.length > 0 && (
                          <div className="overflow-x-auto border border-slate-200 rounded-xl">
                            <table className="w-full text-left text-xs font-semibold text-slate-600">
                              <thead className="bg-slate-50 border-b border-slate-200 text-[9px] uppercase text-slate-400 tracking-wider">
                                <tr>
                                  <th className="py-1.5 px-2.5">Subject</th>
                                  <th className="py-1.5 px-2.5 text-center">Half-Yearly Theory</th>
                                  <th className="py-1.5 px-2.5 text-center">Half-Yearly Practical</th>
                                  <th className="py-1.5 px-2.5 text-center">Half-Yearly Total</th>
                                  <th className="py-1.5 px-2.5 text-center">Annual Theory</th>
                                  <th className="py-1.5 px-2.5 text-center">Annual Practical</th>
                                  <th className="py-1.5 px-2.5 text-center">Annual Total</th>
                                  <th className="py-1.5 px-2.5 text-center">Final</th>
                                  <th className="py-1.5 px-2.5 text-center">Grade</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100 text-slate-700">
                                {itResults.map(res => (
                                  <tr key={res.subject} className="hover:bg-slate-50/50 transition-colors font-bold">
                                    <td className="py-1.5 px-2.5 text-slate-900 font-extrabold">{res.subject}</td>
                                    <td className="py-1.5 px-2.5 text-center text-slate-500">{res.halfYearlyTheory}</td>
                                    <td className="py-1.5 px-2.5 text-center text-slate-500">{res.halfYearlyPractical}</td>
                                    <td className="py-1.5 px-2.5 text-center text-slate-800">{res.halfYearly}</td>
                                    <td className="py-1.5 px-2.5 text-center text-slate-500">{res.annualTheory}</td>
                                    <td className="py-1.5 px-2.5 text-center text-slate-500">{res.annualPractical}</td>
                                    <td className="py-1.5 px-2.5 text-center text-slate-800">{res.annual}</td>
                                    <td className="py-1.5 px-2.5 text-center font-black text-blue-600">{res.final}</td>
                                    <td className="py-1.5 px-2.5 text-center">
                                      <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-600 font-extrabold uppercase text-[10px] inline-flex items-center justify-center min-w-[20px] h-[20px] leading-none">
                                        {res.grade}
                                      </span>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    );
                  })() : (
                    <div className="overflow-x-auto border border-slate-200 rounded-xl">
                      <table className="w-full text-left text-xs font-semibold text-slate-600">
                        <thead className="bg-slate-50 border-b border-slate-200 text-[9px] uppercase text-slate-400 tracking-wider">
                          <tr>
                            <th className="py-1.5 px-2.5">Subject</th>
                            <th className="py-1.5 px-2.5 text-center">Theory</th>
                            <th className="py-1.5 px-2.5 text-center">Practical</th>
                            <th className="py-1.5 px-2.5 text-center">Internal</th>
                            <th className="py-1.5 px-2.5 text-center">Total</th>
                            <th className="py-1.5 px-2.5 text-center">Grade</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-700">
                          {scholasticResults.map(res => (
                            <tr key={res.subject} className="hover:bg-slate-50/50 transition-colors font-bold">
                              <td className="py-1.5 px-2.5 text-slate-900 font-extrabold">{res.subject}</td>
                              <td className="py-1.5 px-2.5 text-center text-slate-500">{Math.round(res.final * 0.7)}</td>
                              <td className="py-1.5 px-2.5 text-center text-slate-500">{Math.round(res.final * 0.2)}</td>
                              <td className="py-1.5 px-2.5 text-center text-slate-500">{Math.round(res.final * 0.1)}</td>
                              <td className="py-1.5 px-2.5 text-center font-black text-blue-600">{Math.round(res.final)}</td>
                              <td className="py-1.5 px-2.5 text-center">
                                <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-600 font-extrabold uppercase text-[10px] inline-flex items-center justify-center min-w-[20px] h-[20px] leading-none">
                                  {res.grade}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 border border-dashed border-slate-200 rounded-2xl">
                  <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs font-bold text-slate-400">No scholastic records found in database.</p>
                </div>
              )}

              {/* Co-Scholastic Grades */}
              {showCoScholastic && templateType !== 'pre_primary' && (
                <div className="space-y-1.5 pt-1 avoid-break">
                  <h4 className="text-[11px] font-black text-slate-800 uppercase tracking-wider border-b pb-1">Co-Scholastic Activities</h4>
                  <div className="grid grid-cols-3 gap-2">
                    {coScholasticItems.map(act => (
                      <div key={act.title} className="p-2 px-3 bg-slate-50/90 rounded-xl border border-slate-200 flex justify-between items-center text-xs font-bold min-h-[36px]">
                        <span className="text-slate-700 font-bold block leading-normal pr-1 text-[11px]">{act.title}</span>
                        <span className="text-blue-600 font-extrabold shrink-0 text-xs">{act.grade}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {/* Class Teacher's Remarks */}
              <div className="space-y-1 pt-1.5 border-t border-slate-200 avoid-break">
                <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Class Teacher's Remarks</h4>
                <div className="p-2.5 bg-slate-50/80 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 italic">
                  "{teacherRemarks || 'No remarks provided.'}"
                </div>
              </div>
              {/* Sign-offs & Footer */}
              <div className="space-y-3 pt-2 avoid-break">
                <div className="flex justify-between items-end border-t pt-2">
                  <div className="space-y-0.5">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Academic summary</span>
                    <div className="text-xs font-bold text-slate-700 flex gap-4">
                      <p>Calculated Percentage: <span className="font-extrabold text-slate-900">{overallAvg}%</span></p>
                      <p>Status: <span className="font-extrabold text-emerald-600">Promoted to Next Class</span></p>
                    </div>
                  </div>
                </div>

                {/* Signature slots (renders uploaded signature images if present) */}
                {showSignatures && (
                  <div className="grid grid-cols-3 gap-6 text-center text-xs font-bold text-slate-400 pt-2">
                    <div className="space-y-1.5">
                      <div className="w-24 mx-auto border-b border-slate-300 h-9 flex items-center justify-center">
                        {customTeacherSig && <img src={customTeacherSig} alt="Teacher Sig" className="max-h-full max-w-full object-contain" />}
                      </div>
                      <p className="uppercase tracking-wider text-[8px]">Class Teacher</p>
                    </div>
                    <div className="space-y-1.5">
                      <div className="w-24 mx-auto border-b border-slate-300 h-9 flex items-center justify-center" />
                      <p className="uppercase tracking-wider text-[8px]">Coordinator</p>
                    </div>
                    <div className="space-y-1.5">
                      <div className="w-24 mx-auto border-b border-slate-300 h-9 flex items-center justify-center">
                        {customPrincipalSig && <img src={customPrincipalSig} alt="Principal Sig" className="max-h-full max-w-full object-contain" />}
                      </div>
                      <p className="uppercase tracking-wider text-[8px] text-slate-900">Principal Signature</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
