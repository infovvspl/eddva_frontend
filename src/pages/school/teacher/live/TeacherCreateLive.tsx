import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Check, Copy, Eye, EyeOff, Radio, Loader2, ArrowRight } from 'lucide-react';
import { schoolLive, type CreatedLecture } from '@/lib/api/school-live';

export default function TeacherCreateLive() {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [busy, setBusy] = useState(false);
  const [created, setCreated] = useState<CreatedLecture | null>(null);
  const [showKey, setShowKey] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const create = async () => {
    if (!title.trim()) { toast.warning('Enter a lecture title'); return; }
    setBusy(true);
    try {
      setCreated(await schoolLive.createLecture({ title: title.trim() }));
      toast.success('Live class created');
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Failed to create live class');
    } finally {
      setBusy(false);
    }
  };

  const copy = (label: string, value: string) => {
    navigator.clipboard.writeText(value);
    setCopied(label);
    setTimeout(() => setCopied(null), 1500);
  };

  return (
    <div className="mx-auto max-w-2xl p-4 sm:p-6">
      <div className="mb-6 flex items-center gap-3">
        <div className="grid h-11 w-11 place-items-center rounded-2xl bg-red-500/10 text-red-500">
          <Radio className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-xl font-black text-slate-900 dark:text-white">Create Live Class</h1>
          <p className="text-sm text-slate-500">Go live with OBS — students watch in real time.</p>
        </div>
      </div>

      {!created ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <label className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-500">Lecture title</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && create()}
            placeholder="e.g. Trigonometry — Live Doubt Session"
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          />
          <button
            onClick={create}
            disabled={busy}
            className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-700 disabled:opacity-60"
          >
            {busy ? <><Loader2 className="h-4 w-4 animate-spin" /> Creating…</> : <><Radio className="h-4 w-4" /> Create Live Class</>}
          </button>
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <div className="flex items-center gap-2 border-b border-slate-100 px-6 py-4 dark:border-slate-800">
            <span className="relative flex h-3 w-3">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
              <span className="relative inline-flex h-3 w-3 rounded-full bg-red-500" />
            </span>
            <h2 className="text-base font-black text-slate-900 dark:text-white">Your Live Class is Ready</h2>
          </div>

          <div className="space-y-4 p-6">
            <Field label="RTMP URL" value={created.rtmpUrl} copied={copied === 'rtmp'} onCopy={() => copy('rtmp', created.rtmpUrl)} />
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-slate-500">Stream Key</span>
                <div className="flex gap-2">
                  <button onClick={() => setShowKey((s) => !s)} className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300">
                    {showKey ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />} {showKey ? 'Hide' : 'Show'}
                  </button>
                  <button onClick={() => copy('key', created.streamKey)} className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700">
                    {copied === 'key' ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />} Copy
                  </button>
                </div>
              </div>
              <code className="block w-full overflow-x-auto rounded-xl bg-slate-100 px-4 py-3 font-mono text-sm text-slate-800 dark:bg-slate-800 dark:text-slate-200">
                {showKey ? created.streamKey : '•'.repeat(Math.min(created.streamKey.length, 32))}
              </code>
            </div>

            <ol className="space-y-1.5 rounded-xl bg-slate-50 p-4 text-sm text-slate-600 dark:bg-slate-800/60 dark:text-slate-300">
              <li><b>Step 1:</b> Open OBS Studio</li>
              <li><b>Step 2:</b> Settings → Stream → Service: <i>Custom</i></li>
              <li><b>Step 3:</b> Paste the RTMP URL and Stream Key above</li>
              <li><b>Step 4:</b> Click <b>Start Streaming</b> — you go LIVE automatically</li>
            </ol>

            <button
              onClick={() => navigate(`/school/teacher/live/${created.lectureId}/dashboard`)}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-bold text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
            >
              Go to Live Dashboard <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, value, copied, onCopy }: { label: string; value: string; copied: boolean; onCopy: () => void }) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <span className="text-xs font-black uppercase tracking-wider text-slate-500">{label}</span>
        <button onClick={onCopy} className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700">
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />} Copy
        </button>
      </div>
      <code className="block w-full overflow-x-auto rounded-xl bg-slate-100 px-4 py-3 font-mono text-sm text-slate-800 dark:bg-slate-800 dark:text-slate-200">{value}</code>
    </div>
  );
}
