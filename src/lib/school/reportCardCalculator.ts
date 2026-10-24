// Single source of truth for report-card percentage/grade calculation.
// Ported from the admin "generate report card" page (StudentReportCard.tsx),
// which is the system of record used to produce the actual printed report card.
// Every other view (parent, teacher, student dashboards) must call into this
// module instead of re-deriving its own weightage formula, so all views agree.

export type WeightingFormula = 'equal_term' | 'annual_only' | 'custom_cbse';

export interface ReportCardResultRow {
  subjectName?: string | null;
  assessmentTitle?: string | null;
  marksObtained?: number | string | null;
  totalMarks?: number | string | null;
  remarks?: string | null;
  updatedAt?: string | null;
  className?: string | null;
  academicYear?: string | null;
}

export interface SubjectBreakdown {
  subject: string;
  isInformationTechnology: boolean;
  theory: number;
  theoryMax: number;
  practical: number;
  practicalMax: number;
  internal: number | null;
  project: number;
  t1Internal: number | null;
  halfYearlyTheory: number | null;
  halfYearlyPractical: number | null;
  halfYearly: number | null;
  t1Total: number | null;
  t2Internal: number | null;
  annualTheory: number | null;
  annualPractical: number | null;
  annual: number | null;
  t2Total: number | null;
  final: number | '';
  grade: string;
}

export function isInformationTechnologySubject(subjectName: string | null | undefined = ''): boolean {
  const subject = String(subjectName || '').trim().toLowerCase();
  return /\b(information|informational)\s+technology\b/.test(subject) ||
    /\bcomputer\s+science\b/.test(subject) ||
    /\bcomputer\b/.test(subject) ||
    subject === 'it' ||
    subject === 'cs';
}

export function getSchoolGrade(pct: number): string {
  if (pct >= 91) return 'O';
  if (pct >= 81) return 'E';
  if (pct >= 71) return 'A';
  if (pct >= 61) return 'B';
  if (pct >= 51) return 'C';
  if (pct >= 41) return 'D';
  return 'F';
}

function getTermSlot(titleStr: string, isInformationTechnology: boolean): string | null {
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
}

/**
 * Computes the per-subject report-card breakdown for a single class's results.
 * `results` should already be filtered down to one class/academic year (as
 * every caller already groups results by class before calling this).
 */
export function calculateSubjectBreakdown(
  results: ReportCardResultRow[],
  weightingFormula: WeightingFormula = 'equal_term',
): SubjectBreakdown[] {
  const filtered = (results || []).filter((res) => {
    const isTotal = !res.subjectName || (res.assessmentTitle || '').toLowerCase().includes('(total)');
    return !isTotal;
  });

  const subjectMap: Record<string, ReportCardResultRow[]> = {};
  filtered.forEach((res) => {
    const sub = res.subjectName || 'General';
    if (!subjectMap[sub]) subjectMap[sub] = [];
    subjectMap[sub].push(res);
  });

  return Object.entries(subjectMap).map(([subject, records]) => {
    const isInformationTechnology = isInformationTechnologySubject(subject);
    const slotMap = new Map<string, ReportCardResultRow>();

    [...records]
      .sort((a, b) => {
        const aTime = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
        const bTime = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
        return aTime - bTime;
      })
      .forEach((rec) => {
        const slot = getTermSlot(rec.assessmentTitle || '', isInformationTechnology);
        if (slot) slotMap.set(slot, rec);
      });

    const calculationRecords = Array.from(slotMap.values());

    let theoryObtained = 0, theoryMax = 0;
    let practicalObtained = 0, practicalMax = 0;
    let internalObtained = 0;
    let projectObtained = 0;

    let t1Int: number | null = null;
    let h1Exam: number | null = null;
    let t2Int: number | null = null;
    let aExam: number | null = null;
    let halfYearlyTheory: number | null = null;
    let halfYearlyPractical: number | null = null;
    let annualTheory: number | null = null;
    let annualPractical: number | null = null;

    calculationRecords.forEach((rec) => {
      const title = (rec.assessmentTitle || '').toLowerCase();
      const marks = rec.marksObtained !== undefined && rec.marksObtained !== null ? Number(rec.marksObtained) : null;

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
        } else if (marks !== null) {
          h1Exam = (h1Exam || 0) + marks;
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
        } else if (marks !== null) {
          aExam = (aExam || 0) + marks;
        }
      }

      try {
        if (rec.remarks && String(rec.remarks).trim().startsWith('{')) {
          const parsed = JSON.parse(String(rec.remarks));
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
            }
            if (comps.project?.enabled) {
              projectObtained += Number(comps.project.obtained || 0);
            }
          } else {
            theoryObtained += Number(rec.marksObtained || 0);
            theoryMax += Number(rec.totalMarks || 100);
          }
        } else {
          theoryObtained += Number(rec.marksObtained || 0);
          theoryMax += Number(rec.totalMarks || 100);
        }
      } catch {
        theoryObtained += Number(rec.marksObtained || 0);
        theoryMax += Number(rec.totalMarks || 100);
      }
    });

    if (calculationRecords.length > 0 && h1Exam === null && aExam === null) {
      h1Exam = Math.round(theoryObtained * 0.4);
      aExam = Math.round(theoryObtained * 0.5);
      t1Int = Math.round(internalObtained || (theoryObtained * 0.05));
      t2Int = Math.round(internalObtained || (theoryObtained * 0.05));
    }

    let h1Max = 80, aMax = 80;
    calculationRecords.forEach((rec) => {
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
      if (h1Exam !== null || t1Int !== null || t2Int !== null || aExam !== null) {
        const hyScaled = h1Max > 0 && h1Exam !== null ? (h1Exam / h1Max) * 30 : 0;
        const annualScaled = aMax > 0 && aExam !== null ? (aExam / aMax) * 50 : 0;
        const internalScaled = (t1Int !== null || t2Int !== null) ? ((t1Int || 0) + (t2Int || 0)) / 2 : 0;
        finalResult = hyScaled + internalScaled + annualScaled;
      }
    }

    let finalDisplay: number | '' = '';
    let gradeDisplay = '—';
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
      grade: gradeDisplay,
    };
  });
}

/**
 * Overall report-card percentage for a single class's results: the average
 * of each subject's final percentage. This is the number shown on every
 * report-card summary card (parent, teacher, student, admin dashboards).
 */
export function calculateReportCardPercentage(
  results: ReportCardResultRow[],
  weightingFormula: WeightingFormula = 'equal_term',
): number {
  const breakdown = calculateSubjectBreakdown(results, weightingFormula);
  const validSubjects = breakdown.filter((res) => res.final !== '');
  if (validSubjects.length === 0) return 0;
  const sum = validSubjects.reduce((acc, res) => acc + Number(res.final), 0);
  return Math.round((sum / validSubjects.length) * 100) / 100;
}
