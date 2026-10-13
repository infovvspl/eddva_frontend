import React from 'react';
import { instructionLines, type PaperFormat } from '@/lib/school/paperFormat';

/**
 * The school-style question-paper header: letterhead, exam title, class / subject / time / marks
 * grid, student fields and general instructions.
 *
 * Inline styles only — the same markup is shown in the on-screen preview and written into the
 * print window, so it has to look identical without depending on any page stylesheet.
 */

const SERIF = "'Times New Roman', Times, Georgia, serif";

const cell: React.CSSProperties = {
  border: '1px solid #1e293b',
  padding: '5px 8px',
  fontSize: '12px',
  verticalAlign: 'top',
};

const label: React.CSSProperties = { fontWeight: 700, marginRight: 4 };

interface Props {
  format: PaperFormat;
  /** 'questions' = full student header; 'answers' = compact header with an answer-key banner. */
  variant?: 'questions' | 'answers';
}

export default function PaperHeader({ format, variant = 'questions' }: Props) {
  const isAnswers = variant === 'answers';
  const instructions = instructionLines(format);
  const classSection = [format.className, format.sectionName && `(${format.sectionName})`].filter(Boolean).join(' ');
  const title = [format.examTitle, format.session && `Session ${format.session}`].filter(Boolean).join('  •  ');

  return (
    <div style={{ fontFamily: SERIF, fontWeight: 400, color: '#0f172a', width: '100%' }} data-paper-header>
      {/* Letterhead */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingBottom: 8, borderBottom: '2px solid #0f172a' }}>
        <div style={{ width: 64, height: 64, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {format.showLogo && format.logo ? (
            <img src={format.logo} alt="" style={{ maxWidth: 64, maxHeight: 64, objectFit: 'contain' }} />
          ) : null}
        </div>
        <div style={{ flex: 1, textAlign: 'center', minWidth: 0 }}>
          <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: '0.04em', textTransform: 'uppercase', lineHeight: 1.2, wordBreak: 'break-word' }}>
            {format.schoolName || 'School Name'}
          </div>
          {format.showAffiliation && format.affiliation ? (
            <div style={{ fontSize: 11, marginTop: 3, color: '#475569', letterSpacing: '0.03em' }}>{format.affiliation}</div>
          ) : null}
        </div>
        <div style={{ width: 64, flexShrink: 0 }} />
      </div>

      {/* Exam title */}
      <div style={{ textAlign: 'center', margin: '10px 0 8px' }}>
        <div style={{ fontSize: 16, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.03em' }}>
          {title || 'Question Paper'}
        </div>
        {isAnswers ? (
          <div style={{ display: 'inline-block', marginTop: 5, padding: '2px 12px', border: '1.5px solid #0f172a', fontSize: 11, fontWeight: 800, letterSpacing: '0.12em' }}>
            ANSWER KEY &mdash; TEACHER COPY
          </div>
        ) : null}
      </div>

      {/* Class / subject / time / marks */}
      <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
        <tbody>
          <tr>
            <td style={cell}><span style={label}>Class:</span>{classSection || '—'}</td>
            <td style={cell}><span style={label}>Subject:</span>{format.subjectName || '—'}</td>
            <td style={cell}><span style={label}>Date:</span>{format.date || '—'}</td>
          </tr>
          <tr>
            <td style={cell}><span style={label}>Time Allowed:</span>{format.timeAllowed || '—'}</td>
            <td style={cell}><span style={label}>Maximum Marks:</span>{format.maxMarks || '—'}</td>
            <td style={cell}>
              {isAnswers ? <span style={label}>Marking scheme</span> : <span style={label}>Marks Obtained:</span>}
            </td>
          </tr>
        </tbody>
      </table>

      {/* Student details */}
      {!isAnswers && format.showStudentFields ? (
        <div style={{ display: 'flex', gap: 14, marginTop: 10, fontSize: 12, fontWeight: 700 }}>
          {['Name', 'Roll No.', 'Section'].map((f, i) => (
            <div key={f} style={{ display: 'flex', alignItems: 'flex-end', gap: 6, flex: i === 0 ? 2 : 1, minWidth: 0 }}>
              <span style={{ whiteSpace: 'nowrap' }}>{f}:</span>
              <span style={{ flex: 1, borderBottom: '1px solid #0f172a', height: 14 }} />
            </div>
          ))}
        </div>
      ) : null}

      {/* General instructions */}
      {!isAnswers && format.showInstructions && instructions.length > 0 ? (
        <div style={{ marginTop: 12, border: '1px solid #1e293b', padding: '8px 12px' }}>
          <div style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>
            General Instructions
          </div>
          {/* Numbers are written out, not list-style: the app's CSS reset removes list markers. */}
          <div style={{ fontSize: 12, lineHeight: 1.5 }}>
            {instructions.map((line, i) => (
              <div key={i} style={{ display: 'flex', gap: 6 }}>
                <span style={{ minWidth: 16, textAlign: 'right' }}>{i + 1}.</span>
                <span style={{ flex: 1 }}>{line}</span>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <div style={{ borderBottom: '2px solid #0f172a', marginTop: 12 }} />
    </div>
  );
}
