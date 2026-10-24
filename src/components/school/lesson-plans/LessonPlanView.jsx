// Read-only view of a chapter lesson plan. Structured (v2) plans show objectives
// with Bloom levels, differentiation, misconceptions and a timed sequence per
// period; v1 plans fall back to their text sections. Used by the teacher (once
// submitted or approved), the admin review page and the print page.
import React from 'react';
import { AlertTriangle, BookOpenCheck, CheckCircle2, FileText, Info, Sparkles } from 'lucide-react';
import { MarkdownRenderer } from '@/components/shared/MarkdownRenderer';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { PERIOD_FIELD_LABELS, PHASE_LABELS, PLAN_FIELD_LABELS, STATUS_META } from '@/lib/api/school-lesson-plans';

export function LessonPlanStatusBadge({ status }) {
  const meta = STATUS_META[status] || STATUS_META.DRAFT;
  return (
    <Badge variant="outline" className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${meta.className}`}>
      {meta.label}
    </Badge>
  );
}

const pagesText = (pages) => (Array.isArray(pages) && pages.length ? `p. ${pages.join(', ')}` : '');

export function LessonPlanSourceLine({ plan }) {
  const pages = Array.isArray(plan.groundedPages) ? plan.groundedPages : [];
  return (
    <p className="flex flex-wrap items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
      {plan.source === 'AI' ? <Sparkles className="size-3.5 text-violet-500" /> : <FileText className="size-3.5" />}
      {plan.source === 'AI' ? 'Generated with AI' : plan.source === 'UPLOAD' ? 'Read by AI from an uploaded file' : 'Written by the teacher'}
      {plan.source === 'UPLOAD' && plan.sourceFileUrl && (
        <a href={plan.sourceFileUrl} target="_blank" rel="noopener noreferrer" className="font-semibold text-blue-600 hover:underline">
          · {plan.sourceFileName || 'original file'}
        </a>
      )}
      {plan.source === 'AI' && (plan.grounded
        ? <span>· from the school textbook{pages.length ? ` (pages ${pages.slice(0, 12).join(', ')}${pages.length > 12 ? '…' : ''})` : ''}</span>
        : <span className="text-amber-600 dark:text-amber-400">· no textbook available for this chapter, so not checked against the book — review carefully</span>)}
      {plan.periodMinutes ? <span>· {plan.periodMinutes}-minute periods</span> : null}
    </p>
  );
}

/** Periods taught per section, as bars (read-only; the teacher records them on the plan page). */
export function TeachingProgressSummary({ summary }) {
  const list = Array.isArray(summary) ? summary : [];
  if (!list.length) return null;
  return (
    <div className="space-y-2">
      {list.map((s) => {
        const pct = s.total ? Math.round((s.done / s.total) * 100) : 0;
        return (
          <div key={s.sectionId} className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-700 dark:text-slate-200">{list.length > 1 || s.sectionName !== 'Whole class' ? `Section ${s.sectionName}` : 'Class'}</span>
              <span className="text-slate-500">
                {s.done} of {s.total} periods done{s.partial ? ` · ${s.partial} partly taught` : ''}{s.skipped ? ` · ${s.skipped} skipped` : ''}
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800" role="progressbar" aria-valuemin={0} aria-valuemax={s.total} aria-valuenow={s.done}
              aria-label={`Section ${s.sectionName}: ${s.done} of ${s.total} periods done`}>
              <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${pct}%` }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

/** Errors block submission; warnings are things to look at. Neither is hidden. */
export function QualityPanel({ issues, compact = false }) {
  const list = Array.isArray(issues) ? issues : [];
  if (!list.length) {
    return compact ? null : (
      <p className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
        <CheckCircle2 className="size-3.5" /> Automatic checks passed (structure, timing, question answers, page references). Content still needs a teacher's review.
      </p>
    );
  }
  const errors = list.filter((i) => i.severity === 'error');
  const warnings = list.filter((i) => i.severity !== 'error');
  return (
    <Card className={`space-y-2 rounded-2xl p-4 ${errors.length ? 'border-rose-200 bg-rose-50 dark:border-rose-900 dark:bg-rose-950/40' : 'border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/40'}`}>
      <p className={`flex items-center gap-1.5 text-sm font-bold ${errors.length ? 'text-rose-800 dark:text-rose-200' : 'text-amber-900 dark:text-amber-200'}`}>
        <AlertTriangle className="size-4" />
        {errors.length ? `${errors.length} problem${errors.length > 1 ? 's' : ''} to fix before submitting` : ''}
        {errors.length && warnings.length ? ' · ' : ''}
        {warnings.length ? `${warnings.length} thing${warnings.length > 1 ? 's' : ''} to check` : ''}
      </p>
      <ul className="space-y-1 text-xs">
        {errors.map((i, k) => <li key={`e${k}`} className="text-rose-800 dark:text-rose-200">• {i.message}</li>)}
        {warnings.map((i, k) => <li key={`w${k}`} className="text-amber-900 dark:text-amber-200">• {i.message}</li>)}
      </ul>
    </Card>
  );
}

function Section({ title, children, icon: Icon }) {
  return (
    <div className="space-y-1.5">
      <h4 className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
        {Icon ? <Icon className="size-3.5" /> : null}{title}
      </h4>
      {children}
    </div>
  );
}

function Bullets({ items }) {
  if (!items?.length) return <p className="text-xs italic text-slate-400">—</p>;
  return (
    <ul className="list-disc space-y-0.5 pl-5 text-sm text-slate-700 dark:text-slate-300">
      {items.map((s, i) => <li key={i}><MarkdownRenderer content={String(s)} className="prose prose-sm max-w-none dark:prose-invert [&_p]:my-0" /></li>)}
    </ul>
  );
}

function V2View({ content, minutes }) {
  const objectives = content.objectives || [];
  const d = content.differentiation || {};
  return (
    <div className="space-y-5">
      <Card className="space-y-5 rounded-2xl border-slate-200 p-5 dark:border-slate-800 dark:bg-slate-900 print:border-0 print:p-0">
        <div className="flex items-center gap-2">
          <BookOpenCheck className="size-4 text-blue-600" />
          <h3 className="text-sm font-black text-slate-900 dark:text-white">Plan overview</h3>
        </div>

        <Section title="Learning objectives">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-[11px] uppercase tracking-wider text-slate-500">
                <tr><th className="py-1 pr-3">#</th><th className="py-1 pr-3">Objective</th><th className="py-1 pr-3">Bloom</th><th className="py-1 pr-3">How it's checked</th><th className="py-1">Source</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {objectives.map((o) => (
                  <tr key={o.id} className="align-top">
                    <td className="py-1.5 pr-3 font-bold text-slate-900 dark:text-white">{o.id}</td>
                    <td className="py-1.5 pr-3 text-slate-700 dark:text-slate-300">{o.text}</td>
                    <td className="py-1.5 pr-3"><Badge variant="outline" className="rounded-full text-[11px]">{o.bloom}</Badge></td>
                    <td className="py-1.5 pr-3 text-slate-600 dark:text-slate-400">{o.assessment}</td>
                    <td className="py-1.5 text-xs">
                      {o.source?.type === 'textbook'
                        ? <span className="font-semibold text-emerald-700 dark:text-emerald-400">Textbook {pagesText(o.source.pages)}</span>
                        : <span className="text-slate-500">Teaching suggestion</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>

        <div className="grid gap-5 md:grid-cols-2">
          <Section title="Expected outcomes"><Bullets items={content.outcomes} /></Section>
          <Section title="Prior knowledge"><Bullets items={content.prerequisites} /></Section>
          <Section title="Key concepts and vocabulary">
            {content.keyConcepts?.length ? (
              <ul className="space-y-0.5 text-sm text-slate-700 dark:text-slate-300">
                {content.keyConcepts.map((k, i) => (
                  <li key={i}><span className="font-semibold">{k.term}</span> — {k.meaning}{k.pages?.length ? <span className="text-xs text-emerald-700 dark:text-emerald-400"> ({pagesText(k.pages)})</span> : null}</li>
                ))}
              </ul>
            ) : <p className="text-xs italic text-slate-400">—</p>}
          </Section>
          <Section title="Resources"><Bullets items={content.resources} /></Section>
          <Section title="Common misconceptions">
            {content.misconceptions?.length ? (
              <ul className="space-y-1 text-sm">
                {content.misconceptions.map((m, i) => (
                  <li key={i} className="text-slate-700 dark:text-slate-300"><span className="font-semibold">✗ {m.misconception}</span><br /><span className="text-slate-600 dark:text-slate-400">✓ {m.correction}</span></li>
                ))}
              </ul>
            ) : <p className="text-xs italic text-slate-400">—</p>}
          </Section>
          <Section title="Differentiation">
            <div className="space-y-1.5 text-sm">
              {[['Support', d.support], ['On-level', d.onLevel], ['Challenge', d.challenge], ['Accessibility', d.accessibility]].map(([label, items]) => (
                <div key={label}><span className="text-xs font-bold text-slate-500">{label}</span><Bullets items={items} /></div>
              ))}
            </div>
          </Section>
        </div>
        {content.groundingNotes ? (
          <p className="flex items-start gap-1.5 rounded-xl bg-amber-50 p-3 text-xs text-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
            <Info className="mt-0.5 size-3.5 shrink-0" /> AI note on sources (not verified): {content.groundingNotes}
          </p>
        ) : null}
      </Card>

      <div className="space-y-3">
        <h3 className="text-sm font-black text-slate-900 dark:text-white">Period-by-period plan ({content.periods?.length || 0})</h3>
        {(content.periods || []).map((p) => {
          const total = (p.sequence || []).reduce((a, s) => a + (Number(s.minutes) || 0), 0);
          return (
            <Card key={p.number} className="space-y-3 rounded-2xl border-slate-200 p-4 break-inside-avoid dark:border-slate-800 dark:bg-slate-900">
              <div className="flex flex-wrap items-center gap-2">
                <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-black text-white">{p.number}</span>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">{p.topic || `Period ${p.number}`}</h4>
                {p.objectiveIds?.length ? <span className="text-xs text-slate-500">Objectives {p.objectiveIds.join(', ')}</span> : null}
                <span className={`ml-auto text-xs font-semibold ${minutes && total !== minutes ? 'text-amber-600' : 'text-slate-500'}`}>
                  {total} min{minutes && total !== minutes ? ` (period is ${minutes})` : ''}
                </span>
                {p.pages?.length ? <span className="text-xs text-emerald-700 dark:text-emerald-400">{pagesText(p.pages)}</span> : null}
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="text-[11px] uppercase tracking-wider text-slate-500">
                    <tr><th className="w-14 py-1 pr-2">Min</th><th className="w-40 py-1 pr-2">Step</th><th className="py-1 pr-2">Teacher</th><th className="py-1">Students</th></tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {(p.sequence || []).map((s, i) => (
                      <tr key={i} className="align-top">
                        <td className="py-1.5 pr-2 font-semibold">{s.marker ? <span className="text-xs font-normal italic text-slate-400" title="Closing note: takes no class time">note</span> : s.minutes}</td>
                        <td className="py-1.5 pr-2 text-slate-600 dark:text-slate-400">{PHASE_LABELS[s.phase] || s.phase}</td>
                        <td className="py-1.5 pr-2 text-slate-700 dark:text-slate-300">{s.teacher}</td>
                        <td className="py-1.5 text-slate-700 dark:text-slate-300">{s.students}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                {p.examples?.length ? <Section title="Examples"><Bullets items={p.examples} /></Section> : null}
                {p.resources?.length ? <Section title="Resources"><Bullets items={p.resources} /></Section> : null}
                {p.checks?.length ? <Section title="Checks for understanding"><Bullets items={p.checks} /></Section> : null}
                <Section title="Assessment questions">
                  <ol className="list-decimal space-y-1 pl-5 text-sm text-slate-700 dark:text-slate-300">
                    {(p.questions || []).map((q, i) => (
                      <li key={i}>
                        <MarkdownRenderer content={q.question} className="prose prose-sm max-w-none dark:prose-invert [&_p]:my-0" />
                        <span className="text-xs text-slate-500">Answer: </span><span className="text-xs">{q.answer}</span>
                        {q.objectiveIds?.length ? <span className="text-xs text-slate-400"> · {q.objectiveIds.join(', ')}</span> : null}
                      </li>
                    ))}
                  </ol>
                </Section>
                {p.homework ? <Section title="Homework"><p className="text-sm text-slate-700 dark:text-slate-300">{p.homework}</p></Section> : null}
                {p.exitTicket ? <Section title="Exit ticket"><p className="text-sm text-slate-700 dark:text-slate-300">{p.exitTicket}</p></Section> : null}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function V1Block({ label, text }) {
  if (!String(text || '').trim()) return null;
  return (
    <div className="space-y-1">
      <h4 className="text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">{label}</h4>
      <MarkdownRenderer content={text} className="prose prose-sm max-w-none dark:prose-invert" />
    </div>
  );
}

function V1View({ plan }) {
  const periods = plan.periods || [];
  return (
    <div className="space-y-5">
      <Card className="space-y-4 rounded-2xl border-slate-200 p-5 dark:border-slate-800 dark:bg-slate-900">
        <div className="grid gap-4 md:grid-cols-2">
          {PLAN_FIELD_LABELS.map(([key, label]) => <V1Block key={key} label={label} text={plan[key]} />)}
        </div>
      </Card>
      {periods.map((p, i) => (
        <Card key={p.id || i} className="space-y-3 rounded-2xl border-slate-200 p-4 dark:border-slate-800 dark:bg-slate-900">
          <h4 className="text-sm font-bold text-slate-900 dark:text-white">{i + 1}. {p.title || `Period ${i + 1}`}</h4>
          <div className="grid gap-3 md:grid-cols-2">
            {PERIOD_FIELD_LABELS.map(([key, label]) => <V1Block key={key} label={label} text={p[key]} />)}
          </div>
        </Card>
      ))}
    </div>
  );
}

export default function LessonPlanView({ plan }) {
  if (plan.schemaVersion >= 2 && plan.content) return <V2View content={plan.content} minutes={plan.periodMinutes} />;
  return <V1View plan={plan} />;
}
