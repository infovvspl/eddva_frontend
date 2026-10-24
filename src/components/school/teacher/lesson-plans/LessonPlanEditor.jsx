// Editor for a structured (v2) chapter lesson plan. Every part is editable in
// place; each part can also be rewritten with AI on its own (the page passes
// onRewrite), which leaves the rest of the plan exactly as the teacher left it.
import React from 'react';
import { ArrowDown, ArrowUp, Plus, Sparkles, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { BLOOM_LEVELS, PHASES, PHASE_LABELS } from '@/lib/api/school-lesson-plans';

const lines = (v) => (Array.isArray(v) ? v.join('\n') : '');
const toList = (s) => String(s || '').split('\n').map((x) => x.trim()).filter(Boolean);
const move = (arr, i, d) => {
  const j = i + d;
  if (j < 0 || j >= arr.length) return arr;
  const out = [...arr];
  [out[i], out[j]] = [out[j], out[i]];
  return out;
};
const nextObjectiveId = (objs) => {
  const used = new Set(objs.map((o) => o.id));
  let n = objs.length + 1;
  while (used.has(`O${n}`)) n += 1;
  return `O${n}`;
};
const selectClass = 'h-9 rounded-md border border-slate-200 bg-white px-2 text-sm dark:border-slate-700 dark:bg-slate-900';

function RewriteButton({ onClick, disabled, label = 'Rewrite with AI' }) {
  return (
    <Button type="button" variant="ghost" size="sm" onClick={onClick} disabled={disabled} className="h-7 gap-1 px-2 text-xs text-violet-700 dark:text-violet-300">
      <Sparkles className="size-3.5" /> {label}
    </Button>
  );
}

function PartCard({ title, part, onRewrite, busy, children, hint }) {
  return (
    <Card className="space-y-3 rounded-2xl border-slate-200 p-4 dark:border-slate-800 dark:bg-slate-900">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-black text-slate-900 dark:text-white">{title}</h3>
          {hint ? <p className="text-xs text-slate-500">{hint}</p> : null}
        </div>
        {part ? <RewriteButton onClick={() => onRewrite(part)} disabled={busy} /> : null}
      </div>
      {children}
    </Card>
  );
}

function LinesField({ label, value, onChange, rows = 3, placeholder }) {
  return (
    <div className="space-y-1">
      {label ? <Label className="text-xs">{label}</Label> : null}
      <Textarea rows={rows} value={lines(value)} placeholder={placeholder || 'One per line'} onChange={(e) => onChange(toList(e.target.value))} />
    </div>
  );
}

function ObjectiveChips({ objectives, value, onChange }) {
  const set = new Set(value || []);
  return (
    <div className="flex flex-wrap gap-1">
      {objectives.map((o) => (
        <button key={o.id} type="button" title={o.text}
          onClick={() => onChange(set.has(o.id) ? [...set].filter((x) => x !== o.id) : [...set, o.id])}
          className={`rounded-full border px-2 py-0.5 text-[11px] font-bold ${set.has(o.id) ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-200 text-slate-500 dark:border-slate-700'}`}>
          {o.id}
        </button>
      ))}
    </div>
  );
}

function PeriodEditor({ period, index, count, objectives, minutes, onChange, onMove, onRemove, onRewrite, busy }) {
  const set = (k, v) => onChange({ ...period, [k]: v });
  const setStep = (i, k, v) => set('sequence', period.sequence.map((s, j) => (j === i ? { ...s, [k]: v } : s)));
  const setQ = (i, k, v) => set('questions', period.questions.map((q, j) => (j === i ? { ...q, [k]: v } : q)));
  const total = period.sequence.reduce((a, s) => a + (Number(s.minutes) || 0), 0);
  return (
    <Card className="space-y-4 rounded-2xl border-slate-200 p-4 dark:border-slate-800 dark:bg-slate-900">
      <div className="flex flex-wrap items-center gap-2">
        <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-black text-white">{index + 1}</span>
        <Input value={period.topic} maxLength={300} placeholder={`What period ${index + 1} covers`} onChange={(e) => set('topic', e.target.value)} className="min-w-48 flex-1 font-semibold" />
        <RewriteButton onClick={() => onRewrite('period', index + 1)} disabled={busy} label="Rewrite period" />
        <Button variant="ghost" size="icon" onClick={() => onMove(index, -1)} disabled={index === 0} aria-label="Move period up"><ArrowUp className="size-4" /></Button>
        <Button variant="ghost" size="icon" onClick={() => onMove(index, 1)} disabled={index === count - 1} aria-label="Move period down"><ArrowDown className="size-4" /></Button>
        <Button variant="ghost" size="icon" onClick={onRemove} disabled={count <= 1} aria-label="Remove period" className="text-rose-600"><Trash2 className="size-4" /></Button>
      </div>

      <div className="space-y-1">
        <Label className="text-xs">Objectives taught in this period</Label>
        <ObjectiveChips objectives={objectives} value={period.objectiveIds} onChange={(v) => set('objectiveIds', v)} />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-xs">Teaching sequence</Label>
          <span className={`text-xs font-bold ${total === minutes ? 'text-emerald-600' : 'text-amber-600'}`}>
            {total} / {minutes} min{total !== minutes ? ` (${total > minutes ? `${total - minutes} over` : `${minutes - total} short`})` : ' ✓'}
          </span>
        </div>
        {period.sequence.map((s, i) => (
          <div key={i} className="grid gap-2 rounded-xl border border-slate-100 p-2 dark:border-slate-800 md:grid-cols-[150px_80px_1fr_1fr_auto]">
            <select className={selectClass} value={s.phase} onChange={(e) => setStep(i, 'phase', e.target.value)} aria-label="Step">
              {PHASES.map((ph) => <option key={ph} value={ph}>{PHASE_LABELS[ph]}</option>)}
            </select>
            <Input type="number" min={1} max={120} value={s.minutes} aria-label="Minutes" onChange={(e) => setStep(i, 'minutes', Number(e.target.value) || 0)} />
            <Textarea rows={2} value={s.teacher} placeholder="Teacher does / says" onChange={(e) => setStep(i, 'teacher', e.target.value)} />
            <Textarea rows={2} value={s.students} placeholder="Students do" onChange={(e) => setStep(i, 'students', e.target.value)} />
            <div className="flex md:flex-col">
              <Button variant="ghost" size="icon" onClick={() => set('sequence', move(period.sequence, i, -1))} disabled={i === 0} aria-label="Move step up"><ArrowUp className="size-3.5" /></Button>
              <Button variant="ghost" size="icon" onClick={() => set('sequence', move(period.sequence, i, 1))} disabled={i === period.sequence.length - 1} aria-label="Move step down"><ArrowDown className="size-3.5" /></Button>
              <Button variant="ghost" size="icon" onClick={() => set('sequence', period.sequence.filter((_, j) => j !== i))} disabled={period.sequence.length <= 1} aria-label="Remove step" className="text-rose-600"><Trash2 className="size-3.5" /></Button>
            </div>
          </div>
        ))}
        <Button variant="outline" size="sm" onClick={() => set('sequence', [...period.sequence, { phase: 'explanation', minutes: 5, teacher: '', students: '' }])} className="gap-1"><Plus className="size-3.5" /> Add step</Button>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <LinesField label="Examples and explanations" value={period.examples} onChange={(v) => set('examples', v)} />
        <LinesField label="Resources" value={period.resources} onChange={(v) => set('resources', v)} />
        <LinesField label="Checks for understanding" value={period.checks} onChange={(v) => set('checks', v)} />
      </div>

      <div className="space-y-2">
        <Label className="text-xs">Assessment questions (each needs an expected answer and an objective)</Label>
        {period.questions.map((q, i) => (
          <div key={i} className="grid gap-2 rounded-xl border border-slate-100 p-2 dark:border-slate-800 md:grid-cols-[1fr_1fr_auto_auto]">
            <Textarea rows={2} value={q.question} placeholder="Question" onChange={(e) => setQ(i, 'question', e.target.value)} />
            <Textarea rows={2} value={q.answer} placeholder="Expected answer" onChange={(e) => setQ(i, 'answer', e.target.value)} />
            <ObjectiveChips objectives={objectives} value={q.objectiveIds} onChange={(v) => setQ(i, 'objectiveIds', v)} />
            <Button variant="ghost" size="icon" onClick={() => set('questions', period.questions.filter((_, j) => j !== i))} aria-label="Remove question" className="text-rose-600"><Trash2 className="size-3.5" /></Button>
          </div>
        ))}
        <Button variant="outline" size="sm" onClick={() => set('questions', [...period.questions, { question: '', answer: '', objectiveIds: period.objectiveIds?.slice(0, 1) || [] }])} className="gap-1"><Plus className="size-3.5" /> Add question</Button>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <div className="space-y-1"><Label className="text-xs">Homework / follow-up</Label><Textarea rows={2} value={period.homework} onChange={(e) => set('homework', e.target.value)} /></div>
        <div className="space-y-1"><Label className="text-xs">Exit ticket</Label><Textarea rows={2} value={period.exitTicket} onChange={(e) => set('exitTicket', e.target.value)} /></div>
      </div>
    </Card>
  );
}

export default function LessonPlanEditor({ content, minutes, onChange, onRewrite, busy }) {
  const c = content;
  const set = (k, v) => onChange({ ...c, [k]: v });
  const setObj = (i, k, v) => set('objectives', c.objectives.map((o, j) => (j === i ? { ...o, [k]: v } : o)));
  const setPeriods = (periods) => set('periods', periods.map((p, i) => ({ ...p, number: i + 1 })));
  const d = c.differentiation || { support: [], onLevel: [], challenge: [], accessibility: [] };

  return (
    <div className="space-y-4">
      <Card className="space-y-2 rounded-2xl border-slate-200 p-4 dark:border-slate-800 dark:bg-slate-900">
        <Label>Title</Label>
        <Input value={c.title} maxLength={300} onChange={(e) => set('title', e.target.value)} />
      </Card>

      <PartCard title="Learning objectives" part="objectives" onRewrite={onRewrite} busy={busy} hint="Observable and measurable, each with a Bloom level and how it will be checked.">
        {c.objectives.map((o, i) => (
          <div key={i} className="grid gap-2 rounded-xl border border-slate-100 p-2 dark:border-slate-800 md:grid-cols-[48px_1fr_130px_1fr_auto]">
            <span className="self-center text-sm font-black text-slate-900 dark:text-white">{o.id}</span>
            <Textarea rows={2} value={o.text} placeholder="Students will be able to…" onChange={(e) => setObj(i, 'text', e.target.value)} />
            <select className={selectClass} value={o.bloom} onChange={(e) => setObj(i, 'bloom', e.target.value)} aria-label="Bloom level">
              {BLOOM_LEVELS.map((b) => <option key={b} value={b}>{b}</option>)}
            </select>
            <Textarea rows={2} value={o.assessment} placeholder="How it is checked" onChange={(e) => setObj(i, 'assessment', e.target.value)} />
            <Button variant="ghost" size="icon" onClick={() => set('objectives', c.objectives.filter((_, j) => j !== i))} disabled={c.objectives.length <= 1} aria-label="Remove objective" className="text-rose-600"><Trash2 className="size-3.5" /></Button>
          </div>
        ))}
        <Button variant="outline" size="sm" className="gap-1"
          onClick={() => set('objectives', [...c.objectives, { id: nextObjectiveId(c.objectives), text: '', bloom: 'Understand', assessment: '', source: { type: 'suggestion', pages: [] } }])}>
          <Plus className="size-3.5" /> Add objective
        </Button>
      </PartCard>

      <div className="grid gap-4 md:grid-cols-2">
        <PartCard title="Expected outcomes" part="outcomes" onRewrite={onRewrite} busy={busy}><LinesField value={c.outcomes} onChange={(v) => set('outcomes', v)} /></PartCard>
        <PartCard title="Prior knowledge" part="prerequisites" onRewrite={onRewrite} busy={busy}><LinesField value={c.prerequisites} onChange={(v) => set('prerequisites', v)} /></PartCard>
        <PartCard title="Key concepts and vocabulary" part="keyConcepts" onRewrite={onRewrite} busy={busy} hint="One per line: term — meaning">
          <Textarea rows={4} value={(c.keyConcepts || []).map((k) => `${k.term} — ${k.meaning}`).join('\n')}
            onChange={(e) => set('keyConcepts', toList(e.target.value).map((line) => {
              const [term, ...rest] = line.split(/\s+[—-]\s+/);
              const prev = (c.keyConcepts || []).find((k) => k.term === term.trim());
              return { term: term.trim(), meaning: rest.join(' — ').trim(), pages: prev?.pages || [] };
            }))} />
        </PartCard>
        <PartCard title="Resources" part="resources" onRewrite={onRewrite} busy={busy}><LinesField value={c.resources} onChange={(v) => set('resources', v)} /></PartCard>
      </div>

      <PartCard title="Common misconceptions" part="misconceptions" onRewrite={onRewrite} busy={busy}>
        {(c.misconceptions || []).map((m, i) => (
          <div key={i} className="grid gap-2 md:grid-cols-[1fr_1fr_auto]">
            <Textarea rows={2} value={m.misconception} placeholder="Common wrong idea" onChange={(e) => set('misconceptions', c.misconceptions.map((x, j) => (j === i ? { ...x, misconception: e.target.value } : x)))} />
            <Textarea rows={2} value={m.correction} placeholder="How to correct it" onChange={(e) => set('misconceptions', c.misconceptions.map((x, j) => (j === i ? { ...x, correction: e.target.value } : x)))} />
            <Button variant="ghost" size="icon" onClick={() => set('misconceptions', c.misconceptions.filter((_, j) => j !== i))} aria-label="Remove misconception" className="text-rose-600"><Trash2 className="size-3.5" /></Button>
          </div>
        ))}
        <Button variant="outline" size="sm" className="gap-1" onClick={() => set('misconceptions', [...(c.misconceptions || []), { misconception: '', correction: '' }])}><Plus className="size-3.5" /> Add misconception</Button>
      </PartCard>

      <PartCard title="Differentiation" part="differentiation" onRewrite={onRewrite} busy={busy} hint="Three pathways, plus accessibility adaptations where relevant.">
        <div className="grid gap-3 md:grid-cols-2">
          <LinesField label="Support" value={d.support} onChange={(v) => set('differentiation', { ...d, support: v })} />
          <LinesField label="On-level" value={d.onLevel} onChange={(v) => set('differentiation', { ...d, onLevel: v })} />
          <LinesField label="Challenge" value={d.challenge} onChange={(v) => set('differentiation', { ...d, challenge: v })} />
          <LinesField label="Accessibility" value={d.accessibility} onChange={(v) => set('differentiation', { ...d, accessibility: v })} />
        </div>
      </PartCard>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-black text-slate-900 dark:text-white">Periods ({c.periods.length}) · {minutes} minutes each</h3>
          <Button variant="outline" size="sm" disabled={c.periods.length >= 20} className="gap-1"
            onClick={() => setPeriods([...c.periods, {
              number: c.periods.length + 1, topic: '', objectiveIds: [], examples: [], resources: [], checks: [], homework: '', exitTicket: '', pages: [],
              sequence: [{ phase: 'introduction', minutes: 5, teacher: '', students: '' }, { phase: 'explanation', minutes: Math.max(1, minutes - 10), teacher: '', students: '' }, { phase: 'conclusion', minutes: 5, teacher: '', students: '' }],
              questions: [{ question: '', answer: '', objectiveIds: [] }],
            }])}>
            <Plus className="size-4" /> Add period
          </Button>
        </div>
        {c.periods.map((p, i) => (
          <PeriodEditor key={i} period={p} index={i} count={c.periods.length} objectives={c.objectives} minutes={minutes} busy={busy}
            onChange={(np) => setPeriods(c.periods.map((x, j) => (j === i ? np : x)))}
            onMove={(idx, dlt) => setPeriods(move(c.periods, idx, dlt))}
            onRemove={() => setPeriods(c.periods.filter((_, j) => j !== i))}
            onRewrite={onRewrite} />
        ))}
      </div>
    </div>
  );
}
