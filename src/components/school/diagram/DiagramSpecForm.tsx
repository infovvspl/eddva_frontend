/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Guided forms for building a diagram specification.
 *
 * A teacher should describe a diagram in the vocabulary of the question —
 * "radius 10", "chord AB" — not by writing JSON. Every kind the schema
 * supports with a fixed, small set of fields therefore gets a real form.
 *
 * Geometry gets a points-and-shapes builder rather than a free canvas,
 * because that is what the schema actually is: named points and shapes that
 * reference them. Cartesian and line graphs fall back to the advanced editor
 * for now — see the Phase 7 report.
 *
 * NOTHING HERE VALIDATES. The backend is authoritative for structure,
 * geometry and rendering; a form that second-guessed it would drift from it
 * and would start telling teachers things that are not true. These forms only
 * build an object and hand it over.
 */
import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import Button from '@/components/school/Button';
import type { DiagramCapabilities } from './diagram-api';

interface FormProps {
  spec: any;
  onChange: (next: any) => void;
  capabilities: DiagramCapabilities | null;
}

/** Kinds this file can build with a form. Everything else uses JSON. */
export const GUIDED_KINDS = [
  'geometry', 'bar_chart', 'ray_diagram', 'force_diagram', 'template',
] as const;

export function isGuidedKind(kind: string): boolean {
  return (GUIDED_KINDS as readonly string[]).includes(kind);
}

/** Starter specifications, so a teacher begins from something that renders. */
export function starterSpec(kind: string, capabilities: DiagramCapabilities | null): any {
  switch (kind) {
    case 'geometry':
      // The Giant Wheel: radius 10, chord AB = 12, OM = 8, C opposite A.
      return {
        kind: 'geometry',
        title: '',
        points: [
          { id: 'O', x: 0, y: 0, label: 'O' },
          { id: 'A', x: -6, y: 8, label: 'A' },
          { id: 'B', x: 6, y: 8, label: 'B' },
        ],
        shapes: [
          { type: 'circle', center: 'O', radius: 10 },
          { type: 'chord', circle: 'O', from: 'A', to: 'B' },
        ],
      };
    case 'bar_chart':
      return { kind: 'bar_chart', title: '', categories: ['A', 'B', 'C'], values: [3, 5, 4], showValues: true };
    case 'ray_diagram':
      return {
        kind: 'ray_diagram', title: '',
        device: capabilities?.opticalDevices?.[0] || 'concave_mirror',
        focalLength: 10, objectDistance: 25, objectHeight: 5, showPrincipalRays: true,
      };
    case 'force_diagram':
      return {
        kind: 'force_diagram', title: '',
        body: { shape: 'block', label: '' },
        forces: [{ label: 'Weight', magnitude: 50, angleDeg: -90 }],
      };
    case 'template':
      return { kind: 'template', title: '', template: capabilities?.templates?.[0]?.id || 'plant_cell', labels: {} };
    case 'cartesian':
      return {
        kind: 'cartesian', xRange: [-5, 5], yRange: [-5, 5], grid: true,
        functions: [{ form: 'linear', coefficients: [1, 0] }],
      };
    case 'line_graph':
      return { kind: 'line_graph', series: [{ points: [{ x: 0, y: 0 }, { x: 5, y: 10 }] }] };
    default:
      return { kind };
  }
}

// ── Small shared controls, styled to the existing form conventions ──────────

const FIELD = 'w-full rounded-lg border border-gray-300 px-2.5 py-1.5 text-sm '
  + 'focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30';

function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-gray-600">{label}</span>
      {children}
      {hint ? <span className="mt-1 block text-[11px] text-gray-400">{hint}</span> : null}
    </label>
  );
}

function NumberInput({ value, onChange, label, step = 'any' }: {
  value: number; onChange: (n: number) => void; label: string; step?: string;
}) {
  return (
    <input
      type="number" step={step} value={Number.isFinite(value) ? value : ''}
      aria-label={label}
      onChange={(e) => onChange(e.target.value === '' ? NaN : Number(e.target.value))}
      className={FIELD}
    />
  );
}

function TextInput({ value, onChange, label, placeholder }: {
  value: string; onChange: (v: string) => void; label: string; placeholder?: string;
}) {
  return (
    <input
      type="text" value={value ?? ''} aria-label={label} placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)} className={FIELD}
    />
  );
}

function TitleField({ spec, onChange }: FormProps) {
  return (
    <Field label="Title" hint="Shown above the diagram. Optional.">
      <TextInput
        label="Diagram title" value={spec.title || ''}
        placeholder="e.g. Giant wheel"
        onChange={(v) => onChange({ ...spec, title: v || undefined })}
      />
    </Field>
  );
}

// ── Geometry ────────────────────────────────────────────────────────────────

/** Shape types and the point references each one needs. */
const SHAPE_FIELDS: Record<string, { refs: string[]; numbers?: string[]; note?: string }> = {
  circle: { refs: ['center'], numbers: ['radius'] },
  segment: { refs: ['from', 'to'] },
  chord: { refs: ['circle', 'from', 'to'], note: '"circle" is the centre point' },
  diameter: { refs: ['circle', 'from', 'to'], note: 'must pass through the centre' },
  radius: { refs: ['circle', 'to'] },
  tangent: { refs: ['circle', 'at'], numbers: ['length'] },
  secant: { refs: ['circle', 'from', 'to'] },
  polygon: { refs: [], note: 'choose 3 or more points below' },
  perpendicular: { refs: ['from'], note: 'drops onto the segment you choose' },
  angle: { refs: ['at', 'from', 'to'] },
};

function GeometryForm({ spec, onChange, capabilities }: FormProps) {
  const points: any[] = Array.isArray(spec.points) ? spec.points : [];
  const shapes: any[] = Array.isArray(spec.shapes) ? spec.shapes : [];
  const ids = points.map((p) => p.id).filter(Boolean);

  const setPoints = (next: any[]) => onChange({ ...spec, points: next });
  const setShapes = (next: any[]) => onChange({ ...spec, shapes: next });

  const pointSelect = (value: string, onPick: (v: string) => void, label: string) => (
    <select value={value || ''} aria-label={label} onChange={(e) => onPick(e.target.value)} className={FIELD}>
      <option value="">—</option>
      {ids.map((id) => <option key={id} value={id}>{id}</option>)}
    </select>
  );

  return (
    <div className="space-y-4">
      <TitleField spec={spec} onChange={onChange} capabilities={capabilities} />

      <section aria-labelledby="diagram-points-heading">
        <div className="mb-2 flex items-center justify-between">
          <h4 id="diagram-points-heading" className="text-xs font-bold uppercase tracking-wide text-gray-600">
            Points
          </h4>
          <Button
            type="button" size="sm" variant="outline" icon={<Plus size={13} />}
            onClick={() => setPoints([...points, { id: `P${points.length + 1}`, x: 0, y: 0, label: '' }])}
          >
            Add point
          </Button>
        </div>
        <div className="space-y-2">
          {points.map((p, i) => (
            <div key={i} className="grid grid-cols-[1fr_1fr_1fr_1.4fr_auto] items-end gap-2">
              <Field label="Name"><TextInput label={`Point ${i + 1} name`} value={p.id}
                onChange={(v) => setPoints(points.map((q, j) => (j === i ? { ...q, id: v } : q)))} /></Field>
              <Field label="x"><NumberInput label={`Point ${i + 1} x`} value={p.x}
                onChange={(v) => setPoints(points.map((q, j) => (j === i ? { ...q, x: v } : q)))} /></Field>
              <Field label="y"><NumberInput label={`Point ${i + 1} y`} value={p.y}
                onChange={(v) => setPoints(points.map((q, j) => (j === i ? { ...q, y: v } : q)))} /></Field>
              <Field label="Label"><TextInput label={`Point ${i + 1} label`} value={p.label || ''}
                onChange={(v) => setPoints(points.map((q, j) => (j === i ? { ...q, label: v || undefined } : q)))} /></Field>
              <button
                type="button" aria-label={`Remove point ${p.id || i + 1}`}
                onClick={() => setPoints(points.filter((_q, j) => j !== i))}
                className="mb-1 rounded-lg border border-gray-200 p-2 text-gray-500 hover:bg-rose-50 hover:text-rose-600"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      </section>

      <section aria-labelledby="diagram-shapes-heading">
        <div className="mb-2 flex items-center justify-between">
          <h4 id="diagram-shapes-heading" className="text-xs font-bold uppercase tracking-wide text-gray-600">
            Shapes
          </h4>
          <Button
            type="button" size="sm" variant="outline" icon={<Plus size={13} />}
            onClick={() => setShapes([...shapes, { type: 'segment', from: ids[0] || '', to: ids[1] || '' }])}
          >
            Add shape
          </Button>
        </div>
        <div className="space-y-3">
          {shapes.map((s, i) => {
            const fields = SHAPE_FIELDS[s.type] || { refs: [] };
            return (
              <div key={i} className="rounded-lg border border-gray-200 p-3">
                <div className="mb-2 flex items-center gap-2">
                  <select
                    value={s.type} aria-label={`Shape ${i + 1} type`} className={`${FIELD} max-w-[10rem]`}
                    onChange={(e) => setShapes(shapes.map((t, j) => (j === i ? { type: e.target.value } : t)))}
                  >
                    {Object.keys(SHAPE_FIELDS).map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                  {fields.note ? <span className="text-[11px] text-gray-400">{fields.note}</span> : null}
                  <button
                    type="button" aria-label={`Remove shape ${i + 1}`}
                    onClick={() => setShapes(shapes.filter((_t, j) => j !== i))}
                    className="ml-auto rounded-lg border border-gray-200 p-2 text-gray-500 hover:bg-rose-50 hover:text-rose-600"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {fields.refs.map((ref) => (
                    <Field key={ref} label={ref}>
                      {pointSelect(s[ref], (v) => setShapes(shapes.map((t, j) => (j === i ? { ...t, [ref]: v } : t))), `Shape ${i + 1} ${ref}`)}
                    </Field>
                  ))}
                  {(fields.numbers || []).map((num) => (
                    <Field key={num} label={num}>
                      <NumberInput label={`Shape ${i + 1} ${num}`} value={s[num]}
                        onChange={(v) => setShapes(shapes.map((t, j) => (j === i ? { ...t, [num]: v } : t)))} />
                    </Field>
                  ))}
                  {s.type === 'polygon' ? (
                    <Field label="vertices" hint="comma separated, e.g. A,B,C">
                      <TextInput label={`Shape ${i + 1} vertices`} value={(s.vertices || []).join(',')}
                        onChange={(v) => setShapes(shapes.map((t, j) => (j === i
                          ? { ...t, vertices: v.split(',').map((x) => x.trim()).filter(Boolean) } : t)))} />
                    </Field>
                  ) : null}
                  {s.type === 'perpendicular' ? (
                    <Field label="onto segment" hint="two points, e.g. A,B">
                      <TextInput label={`Shape ${i + 1} segment`} value={(s.segment || []).join(',')}
                        onChange={(v) => setShapes(shapes.map((t, j) => (j === i
                          ? { ...t, segment: v.split(',').map((x) => x.trim()).filter(Boolean) } : t)))} />
                    </Field>
                  ) : null}
                  {s.type === 'angle' ? (
                    <Field label="right angle">
                      <input
                        type="checkbox" checked={!!s.rightAngle} aria-label={`Shape ${i + 1} right angle`}
                        onChange={(e) => setShapes(shapes.map((t, j) => (j === i ? { ...t, rightAngle: e.target.checked } : t)))}
                        className="h-4 w-4"
                      />
                    </Field>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

// ── Bar chart ───────────────────────────────────────────────────────────────

function BarChartForm({ spec, onChange, capabilities }: FormProps) {
  const categories: string[] = Array.isArray(spec.categories) ? spec.categories : [];
  const values: number[] = Array.isArray(spec.values) ? spec.values : [];

  const setRow = (i: number, name: string, value: number) => onChange({
    ...spec,
    categories: categories.map((c, j) => (j === i ? name : c)),
    values: values.map((v, j) => (j === i ? value : v)),
  });

  return (
    <div className="space-y-4">
      <TitleField spec={spec} onChange={onChange} capabilities={capabilities} />
      <div className="grid grid-cols-2 gap-3">
        <Field label="x axis label">
          <TextInput label="x axis label" value={spec.xLabel || ''}
            onChange={(v) => onChange({ ...spec, xLabel: v || undefined })} />
        </Field>
        <Field label="y axis label">
          <TextInput label="y axis label" value={spec.yLabel || ''}
            onChange={(v) => onChange({ ...spec, yLabel: v || undefined })} />
        </Field>
      </div>
      <div>
        <div className="mb-2 flex items-center justify-between">
          <h4 className="text-xs font-bold uppercase tracking-wide text-gray-600">Bars</h4>
          <Button
            type="button" size="sm" variant="outline" icon={<Plus size={13} />}
            onClick={() => onChange({ ...spec, categories: [...categories, ''], values: [...values, 0] })}
          >
            Add bar
          </Button>
        </div>
        <div className="space-y-2">
          {categories.map((c, i) => (
            <div key={i} className="grid grid-cols-[2fr_1fr_auto] items-end gap-2">
              <Field label="Category">
                <TextInput label={`Bar ${i + 1} category`} value={c} onChange={(v) => setRow(i, v, values[i] ?? 0)} />
              </Field>
              <Field label="Value">
                <NumberInput label={`Bar ${i + 1} value`} value={values[i]} onChange={(v) => setRow(i, c, v)} />
              </Field>
              <button
                type="button" aria-label={`Remove bar ${i + 1}`}
                onClick={() => onChange({
                  ...spec,
                  categories: categories.filter((_x, j) => j !== i),
                  values: values.filter((_x, j) => j !== i),
                })}
                className="mb-1 rounded-lg border border-gray-200 p-2 text-gray-500 hover:bg-rose-50 hover:text-rose-600"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      </div>
      <label className="flex items-center gap-2 text-sm text-gray-700">
        <input
          type="checkbox" checked={!!spec.showValues} aria-label="Show values above bars"
          onChange={(e) => onChange({ ...spec, showValues: e.target.checked })} className="h-4 w-4"
        />
        Print each value above its bar
      </label>
    </div>
  );
}

// ── Ray diagram ─────────────────────────────────────────────────────────────

function RayDiagramForm({ spec, onChange, capabilities }: FormProps) {
  const devices = capabilities?.opticalDevices || [];
  return (
    <div className="space-y-4">
      <TitleField spec={spec} onChange={onChange} capabilities={capabilities} />
      <Field label="Device" hint="The image position is computed from the mirror or lens equation.">
        <select
          value={spec.device || ''} aria-label="Optical device" className={FIELD}
          onChange={(e) => onChange({ ...spec, device: e.target.value })}
        >
          {devices.map((d) => <option key={d} value={d}>{d.replace(/_/g, ' ')}</option>)}
        </select>
      </Field>
      <div className="grid grid-cols-3 gap-3">
        <Field label="Focal length"><NumberInput label="Focal length" value={spec.focalLength}
          onChange={(v) => onChange({ ...spec, focalLength: v })} /></Field>
        <Field label="Object distance"><NumberInput label="Object distance" value={spec.objectDistance}
          onChange={(v) => onChange({ ...spec, objectDistance: v })} /></Field>
        <Field label="Object height"><NumberInput label="Object height" value={spec.objectHeight}
          onChange={(v) => onChange({ ...spec, objectHeight: v })} /></Field>
      </div>
      <label className="flex items-center gap-2 text-sm text-gray-700">
        <input
          type="checkbox" checked={spec.showPrincipalRays !== false} aria-label="Draw principal rays"
          onChange={(e) => onChange({ ...spec, showPrincipalRays: e.target.checked })} className="h-4 w-4"
        />
        Draw the principal rays
      </label>
    </div>
  );
}

// ── Force diagram ───────────────────────────────────────────────────────────

function ForceDiagramForm({ spec, onChange, capabilities }: FormProps) {
  const forces: any[] = Array.isArray(spec.forces) ? spec.forces : [];
  const body = spec.body || { shape: 'block' };
  return (
    <div className="space-y-4">
      <TitleField spec={spec} onChange={onChange} capabilities={capabilities} />
      <div className="grid grid-cols-2 gap-3">
        <Field label="Body shape">
          <select
            value={body.shape} aria-label="Body shape" className={FIELD}
            onChange={(e) => onChange({ ...spec, body: { ...body, shape: e.target.value } })}
          >
            <option value="block">block</option>
            <option value="circle">circle</option>
          </select>
        </Field>
        <Field label="Body label">
          <TextInput label="Body label" value={body.label || ''}
            onChange={(v) => onChange({ ...spec, body: { ...body, label: v || undefined } })} />
        </Field>
      </div>
      <div>
        <div className="mb-2 flex items-center justify-between">
          <h4 className="text-xs font-bold uppercase tracking-wide text-gray-600">Forces</h4>
          <Button
            type="button" size="sm" variant="outline" icon={<Plus size={13} />}
            onClick={() => onChange({ ...spec, forces: [...forces, { label: '', magnitude: 10, angleDeg: 0 }] })}
          >
            Add force
          </Button>
        </div>
        <div className="space-y-2">
          {forces.map((f, i) => (
            <div key={i} className="grid grid-cols-[2fr_1fr_1fr_auto] items-end gap-2">
              <Field label="Label"><TextInput label={`Force ${i + 1} label`} value={f.label || ''}
                onChange={(v) => onChange({ ...spec, forces: forces.map((g, j) => (j === i ? { ...g, label: v || undefined } : g)) })} /></Field>
              <Field label="Magnitude"><NumberInput label={`Force ${i + 1} magnitude`} value={f.magnitude}
                onChange={(v) => onChange({ ...spec, forces: forces.map((g, j) => (j === i ? { ...g, magnitude: v } : g)) })} /></Field>
              <Field label="Angle (deg)"><NumberInput label={`Force ${i + 1} angle`} value={f.angleDeg}
                onChange={(v) => onChange({ ...spec, forces: forces.map((g, j) => (j === i ? { ...g, angleDeg: v } : g)) })} /></Field>
              <button
                type="button" aria-label={`Remove force ${i + 1}`}
                onClick={() => onChange({ ...spec, forces: forces.filter((_g, j) => j !== i) })}
                className="mb-1 rounded-lg border border-gray-200 p-2 text-gray-500 hover:bg-rose-50 hover:text-rose-600"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      </div>
      <label className="flex items-center gap-2 text-sm text-gray-700">
        <input
          type="checkbox" checked={!!spec.showResultant} aria-label="Show resultant force"
          onChange={(e) => onChange({ ...spec, showResultant: e.target.checked })} className="h-4 w-4"
        />
        Show the resultant
      </label>
    </div>
  );
}

// ── Template ────────────────────────────────────────────────────────────────

function TemplateForm({ spec, onChange, capabilities }: FormProps) {
  const templates = capabilities?.templates || [];
  const current = templates.find((t) => t.id === spec.template);
  const labels: Record<string, string> = spec.labels || {};
  const hidden: string[] = Array.isArray(spec.hideLabels) ? spec.hideLabels : [];

  return (
    <div className="space-y-4">
      <TitleField spec={spec} onChange={onChange} capabilities={capabilities} />
      <Field label="Template">
        <select
          value={spec.template || ''} aria-label="Template" className={FIELD}
          onChange={(e) => onChange({ ...spec, template: e.target.value, labels: {}, hideLabels: [] })}
        >
          {templates.map((t) => <option key={t.id} value={t.id}>{t.id.replace(/_/g, ' ')}</option>)}
        </select>
      </Field>
      {current ? (
        <div>
          <h4 className="mb-2 text-xs font-bold uppercase tracking-wide text-gray-600">Labels</h4>
          <p className="mb-2 text-[11px] text-gray-400">
            Leave a label blank to keep the default. Hide one to turn the diagram into a labelling exercise.
          </p>
          <div className="space-y-2">
            {current.slots.map((slot) => (
              <div key={slot.id} className="grid grid-cols-[1fr_auto] items-end gap-2">
                <Field label={slot.id}>
                  <TextInput
                    label={`Label for ${slot.id}`} value={labels[slot.id] ?? ''}
                    placeholder={slot.defaultLabel}
                    onChange={(v) => {
                      const next = { ...labels };
                      if (v) next[slot.id] = v; else delete next[slot.id];
                      onChange({ ...spec, labels: next });
                    }}
                  />
                </Field>
                <label className="mb-2 flex items-center gap-1.5 text-[11px] text-gray-600">
                  <input
                    type="checkbox" checked={hidden.includes(slot.id)}
                    aria-label={`Hide the ${slot.id} label`}
                    onChange={(e) => onChange({
                      ...spec,
                      hideLabels: e.target.checked
                        ? [...hidden, slot.id]
                        : hidden.filter((h) => h !== slot.id),
                    })}
                    className="h-3.5 w-3.5"
                  />
                  hide
                </label>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

// ── Dispatcher ──────────────────────────────────────────────────────────────

export default function DiagramSpecForm(props: FormProps) {
  switch (props.spec?.kind) {
    case 'geometry': return <GeometryForm {...props} />;
    case 'bar_chart': return <BarChartForm {...props} />;
    case 'ray_diagram': return <RayDiagramForm {...props} />;
    case 'force_diagram': return <ForceDiagramForm {...props} />;
    case 'template': return <TemplateForm {...props} />;
    default:
      return (
        <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
          This diagram type has no guided form yet. Use the advanced editor below to
          describe it; it is validated by the same server checks either way.
        </p>
      );
  }
}
