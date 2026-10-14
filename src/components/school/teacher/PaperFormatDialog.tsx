import React, { useRef } from 'react';
import { ImagePlus, RotateCcw, Save, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import PaperHeader from './PaperHeader';
import { DEFAULT_INSTRUCTIONS, type PaperFormat } from '@/lib/school/paperFormat';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  format: PaperFormat;
  onChange: (patch: Partial<PaperFormat>) => void;
  onReset: () => void;
  onSaveDefault: () => void;
}

/** Shrinks a chosen logo so it stays small enough to keep with the school's saved format. */
function fileToLogo(file: File, maxSide = 256): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error);
    reader.onload = () => {
      const src = String(reader.result);
      if (/^data:image\/svg/i.test(src)) { resolve(src); return; }
      const img = new Image();
      img.onerror = () => reject(new Error('Could not read the image'));
      img.onload = () => {
        const scale = Math.min(1, maxSide / Math.max(img.naturalWidth, img.naturalHeight));
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(img.naturalWidth * scale));
        canvas.height = Math.max(1, Math.round(img.naturalHeight * scale));
        const ctx = canvas.getContext('2d');
        if (!ctx) { resolve(src); return; }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/png'));
      };
      img.src = src;
    };
    reader.readAsDataURL(file);
  });
}

function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">{label}</Label>
      {children}
      {hint && <p className="text-[11px] text-slate-400">{hint}</p>}
    </div>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2 dark:border-slate-800 dark:bg-slate-900">
      <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">{label}</span>
      <Switch checked={checked} onCheckedChange={onChange} />
    </label>
  );
}

export default function PaperFormatDialog({ open, onOpenChange, format, onChange, onReset, onSaveDefault }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);

  const pickLogo = async (file?: File) => {
    if (!file) return;
    try {
      onChange({ logo: await fileToLogo(file), showLogo: true });
    } catch { /* unreadable image — leave the logo as it was */ }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onOpenAutoFocus={(e) => e.preventDefault()} className="flex h-[92vh] w-[calc(100%-1rem)] max-w-6xl flex-col gap-0 overflow-hidden rounded-2xl p-0 sm:rounded-2xl">
        <DialogHeader className="shrink-0 border-b border-slate-100 p-4 pr-12 text-left dark:border-slate-800 sm:p-5 sm:pr-14">
          <DialogTitle className="text-base font-bold leading-normal tracking-normal sm:text-lg">Question paper format</DialogTitle>
          <DialogDescription className="text-xs sm:text-sm">
            Set up the school letterhead and details printed on the paper. Class, subject, marks and time come from the test.
          </DialogDescription>
        </DialogHeader>

        <div className="grid min-h-0 flex-1 grid-cols-1 overflow-y-auto lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:overflow-hidden">
          {/* Form */}
          <div className="space-y-5 p-4 sm:p-5 lg:overflow-y-auto">
            <section className="space-y-3">
              <h4 className="text-[11px] font-black uppercase tracking-wider text-slate-400">School</h4>
              <Field label="School name">
                <Input value={format.schoolName} onChange={(e) => onChange({ schoolName: e.target.value })} placeholder="e.g. Delhi Public School" />
              </Field>
              <Field label="Affiliation / tagline (optional)">
                <Input value={format.affiliation} onChange={(e) => onChange({ affiliation: e.target.value })} placeholder="Affiliated to CBSE, Affiliation No. 1234567" />
              </Field>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Field label="Academic session">
                  <Input value={format.session} onChange={(e) => onChange({ session: e.target.value })} placeholder="2026-27" />
                </Field>
                <Field label="Logo">
                  <div className="flex items-center gap-2">
                    <input
                      ref={fileRef}
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      className="hidden"
                      onChange={(e) => { void pickLogo(e.target.files?.[0]); e.target.value = ''; }}
                    />
                    <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={() => fileRef.current?.click()}>
                      <ImagePlus className="size-4" /> {format.logo ? 'Change' : 'Upload'}
                    </Button>
                    {format.logo && (
                      <>
                        <img src={format.logo} alt="" className="size-9 rounded border border-slate-200 object-contain" />
                        <Button type="button" variant="ghost" size="icon" className="size-8 text-slate-400" aria-label="Remove logo" onClick={() => onChange({ logo: '' })}>
                          <Trash2 className="size-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </Field>
              </div>
            </section>

            <section className="space-y-3">
              <h4 className="text-[11px] font-black uppercase tracking-wider text-slate-400">This paper</h4>
              <Field label="Exam title">
                <Input value={format.examTitle} onChange={(e) => onChange({ examTitle: e.target.value })} placeholder="Unit Test 1" />
              </Field>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Field label="Class">
                  <Input value={format.className} onChange={(e) => onChange({ className: e.target.value })} />
                </Field>
                <Field label="Section">
                  <Input value={format.sectionName} onChange={(e) => onChange({ sectionName: e.target.value })} />
                </Field>
                <Field label="Subject">
                  <Input value={format.subjectName} onChange={(e) => onChange({ subjectName: e.target.value })} />
                </Field>
                <Field label="Date">
                  <Input value={format.date} onChange={(e) => onChange({ date: e.target.value })} placeholder="12 Oct 2026" />
                </Field>
                <Field label="Time allowed">
                  <Input value={format.timeAllowed} onChange={(e) => onChange({ timeAllowed: e.target.value })} placeholder="2 hours" />
                </Field>
                <Field label="Maximum marks">
                  <Input value={format.maxMarks} onChange={(e) => onChange({ maxMarks: e.target.value })} placeholder="100" />
                </Field>
              </div>
            </section>

            <section className="space-y-3">
              <h4 className="text-[11px] font-black uppercase tracking-wider text-slate-400">Instructions &amp; footer</h4>
              <Field label="General instructions" hint="One instruction per line.">
                <Textarea
                  rows={6}
                  value={format.instructions}
                  onChange={(e) => onChange({ instructions: e.target.value })}
                  className="resize-y text-sm"
                />
              </Field>
              <Button type="button" variant="link" className="h-auto p-0 text-xs" onClick={() => onChange({ instructions: DEFAULT_INSTRUCTIONS })}>
                Use the standard instructions
              </Button>
              <Field label="Footer note (optional)">
                <Input value={format.footerNote} onChange={(e) => onChange({ footerNote: e.target.value })} placeholder="e.g. All the best!" />
              </Field>
            </section>

            <section className="space-y-2">
              <h4 className="text-[11px] font-black uppercase tracking-wider text-slate-400">Show on the paper</h4>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <Toggle label="School logo" checked={format.showLogo} onChange={(v) => onChange({ showLogo: v })} />
                <Toggle label="Affiliation line" checked={format.showAffiliation} onChange={(v) => onChange({ showAffiliation: v })} />
                <Toggle label="Name / roll no. / section" checked={format.showStudentFields} onChange={(v) => onChange({ showStudentFields: v })} />
                <Toggle label="General instructions" checked={format.showInstructions} onChange={(v) => onChange({ showInstructions: v })} />
                <Toggle label="Page border" checked={format.showBorder} onChange={(v) => onChange({ showBorder: v })} />
              </div>
            </section>
          </div>

          {/* Live preview */}
          <div className="border-t border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/40 sm:p-5 lg:overflow-y-auto lg:border-l lg:border-t-0">
            <p className="mb-2 text-[11px] font-black uppercase tracking-wider text-slate-400">Preview</p>
            <div
              className="mx-auto max-w-[620px] bg-white p-5 shadow-sm"
              style={{ border: format.showBorder ? '1.5px solid #0f172a' : '1px solid #e2e8f0' }}
            >
              <PaperHeader format={format} />
              <p className="mt-4 text-center text-xs italic text-slate-400">Questions appear here</p>
            </div>
          </div>
        </div>

        <DialogFooter className="shrink-0 flex-col-reverse gap-2 border-t border-slate-100 p-4 dark:border-slate-800 sm:flex-row sm:justify-between sm:space-x-0 sm:px-5">
          <Button type="button" variant="ghost" onClick={onReset} className="gap-2 text-slate-600">
            <RotateCcw className="size-4" /> Reset
          </Button>
          <div className="flex flex-col-reverse gap-2 sm:flex-row">
            <Button type="button" variant="outline" onClick={onSaveDefault} className="gap-2 font-bold">
              <Save className="size-4" /> Save as school default
            </Button>
            <Button type="button" onClick={() => onOpenChange(false)} className="bg-blue-600 font-bold text-white hover:bg-blue-700">
              Done
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
