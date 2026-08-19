import { useState } from 'react';
import { toast } from 'sonner';
import { Loader2, CheckCircle2, Rocket } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { submitLead, type LeadVertical } from '@/lib/api/leads';
import { PRODUCT_FEATURES } from '@/lib/feature-list';

interface RequestDemoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Preselect School or Coaching (e.g. when opened from a school-specific CTA). */
  defaultVertical?: LeadVertical;
}

interface FormState {
  name: string;
  email: string;
  phone: string;
  organization: string;
  role: string;
  vertical: LeadVertical;
  interestedFeature: string;
  message: string;
}

const EMPTY = (v: LeadVertical): FormState => ({
  name: '', email: '', phone: '', organization: '', role: '',
  vertical: v, interestedFeature: '', message: '',
});

const inputCls =
  'w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20';
const labelCls = 'mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500';

export default function RequestDemoModal({ open, onOpenChange, defaultVertical = 'SCHOOL' }: RequestDemoModalProps) {
  const [form, setForm] = useState<FormState>(EMPTY(defaultVertical));
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  const set = (k: keyof FormState, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const reset = () => { setForm(EMPTY(defaultVertical)); setDone(false); };

  const handleOpenChange = (o: boolean) => {
    onOpenChange(o);
    if (!o) setTimeout(reset, 200); // reset after close animation
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { toast.warning('Please enter your name.'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) { toast.warning('Please enter a valid email.'); return; }

    setBusy(true);
    try {
      await submitLead({
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || undefined,
        organization: form.organization.trim() || undefined,
        role: form.role.trim() || undefined,
        vertical: form.vertical,
        interestedFeature: form.interestedFeature || undefined,
        message: form.message.trim() || undefined,
        source: 'landing-modal',
      });
      setDone(true);
      toast.success("Request sent! We'll be in touch shortly.");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        {done ? (
          <div className="py-8 text-center">
            <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-full bg-emerald-100 text-emerald-600">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <h3 className="text-lg font-black text-slate-900">Thank you!</h3>
            <p className="mx-auto mt-1 max-w-xs text-sm text-slate-500">
              We've received your request and a confirmation is on its way to your inbox. Our team will
              reach out shortly to set up your demo.
            </p>
            <button
              onClick={() => handleOpenChange(false)}
              className="mt-5 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-slate-800"
            >
              Close
            </button>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-xl font-black">
                <Rocket className="h-5 w-5 text-blue-600" /> Request a Demo
              </DialogTitle>
              <DialogDescription>
                See EDVA in action. Tell us a bit about you and we'll set up a personalized walkthrough.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={submit} className="space-y-3.5 pt-2">
              {/* Vertical toggle */}
              <div className="grid grid-cols-2 gap-2 rounded-xl bg-slate-100 p-1">
                {(['SCHOOL', 'COACHING'] as LeadVertical[]).map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => set('vertical', v)}
                    className={`rounded-lg py-2 text-sm font-bold transition ${form.vertical === v ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    {v === 'SCHOOL' ? 'For my School' : 'For my Coaching'}
                  </button>
                ))}
              </div>

              <div className="grid gap-3.5 sm:grid-cols-2">
                <div>
                  <label className={labelCls}>Name *</label>
                  <input className={inputCls} value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="Your full name" />
                </div>
                <div>
                  <label className={labelCls}>Email *</label>
                  <input className={inputCls} type="email" value={form.email} onChange={(e) => set('email', e.target.value)} placeholder="you@example.com" />
                </div>
                <div>
                  <label className={labelCls}>Phone</label>
                  <input className={inputCls} value={form.phone} onChange={(e) => set('phone', e.target.value)} placeholder="+91…" />
                </div>
                <div>
                  <label className={labelCls}>Role</label>
                  <input className={inputCls} value={form.role} onChange={(e) => set('role', e.target.value)} placeholder="Principal, Owner, Teacher…" />
                </div>
              </div>

              <div>
                <label className={labelCls}>{form.vertical === 'SCHOOL' ? 'School name' : 'Coaching / Institute name'}</label>
                <input className={inputCls} value={form.organization} onChange={(e) => set('organization', e.target.value)} placeholder="Your organization" />
              </div>

              <div>
                <label className={labelCls}>Which feature interests you most?</label>
                <select className={inputCls} value={form.interestedFeature} onChange={(e) => set('interestedFeature', e.target.value)}>
                  <option value="">Select a feature (optional)</option>
                  {PRODUCT_FEATURES.map((f) => (
                    <option key={f} value={f}>{f}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className={labelCls}>Message</label>
                <textarea className={`${inputCls} min-h-[80px] resize-y`} value={form.message} onChange={(e) => set('message', e.target.value)} placeholder="Anything you'd like us to know…" />
              </div>

              <button
                type="submit"
                disabled={busy}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-black text-white transition hover:bg-blue-700 disabled:opacity-60"
              >
                {busy ? <><Loader2 className="h-4 w-4 animate-spin" /> Sending…</> : <>Request Demo</>}
              </button>
              <p className="text-center text-[11px] text-slate-400">We'll only use your details to contact you about EDVA.</p>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
