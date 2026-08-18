import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Check, Copy, Eye, EyeOff, Radio, Loader2, ArrowRight, MonitorUp, ChevronDown, Monitor, LayoutDashboard } from 'lucide-react';
import { schoolLive, type CreatedLecture, type LiveLecture } from '@/lib/api/school-live';

export default function TeacherCreateLive() {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [busy, setBusy] = useState(false);
  const [created, setCreated] = useState<CreatedLecture | null>(null);
  const [showKey, setShowKey] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [showObs, setShowObs] = useState(false);
  const [lectures, setLectures] = useState<LiveLecture[]>([]);
  const [loadingList, setLoadingList] = useState(true);

  useEffect(() => {
    let active = true;
    schoolLive.listLectures()
      .then((rows) => { if (active) setLectures(rows); })
      .catch(() => undefined)
      .finally(() => { if (active) setLoadingList(false); });
    return () => { active = false; };
  }, []);

  const liveNow = lectures.filter((l) => l.status === 'LIVE');
  const scheduled = lectures.filter((l) => l.status === 'SCHEDULED');

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
    navigator.clipboard.writeText(value).catch(() => {
      // clipboard API requires HTTPS + user gesture; fail gracefully (BUG-37)
      toast.error('Copy failed — please select and copy manually');
    });
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
          <h1 className="text-xl font-black text-slate-900 dark:text-white">Live Classes</h1>
          <p className="text-sm text-slate-500">Go live from your browser — students watch in real time.</p>
        </div>
      </div>

      {/* Ongoing + scheduled classes so a teacher can rejoin instead of re-creating. */}
      {!created && (
        <div className="mb-6 space-y-3">
          {loadingList ? (
            <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading your classes…
            </div>
          ) : (
            <>
              {liveNow.map((lec) => (
                <div key={lec.id} className="flex flex-wrap items-center gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 dark:border-red-900/40 dark:bg-red-900/15">
                  <span className="relative flex h-3 w-3">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
                    <span className="relative inline-flex h-3 w-3 rounded-full bg-red-500" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-black text-slate-900 dark:text-white">{lec.title}</p>
                    <p className="text-xs font-bold uppercase tracking-wider text-red-500">Live now</p>
                  </div>
                  <button
                    onClick={() => navigate(`/school/teacher/live/${lec.id}/studio`)}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-red-600 px-4 py-2 text-sm font-black text-white transition hover:bg-red-700"
                  >
                    <Monitor className="h-4 w-4" /> Rejoin Studio
                  </button>
                  <button
                    onClick={() => navigate(`/school/teacher/live/${lec.id}/dashboard`)}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-red-300 px-4 py-2 text-sm font-bold text-red-600 transition hover:bg-red-100 dark:border-red-900/50 dark:text-red-300 dark:hover:bg-red-900/20"
                  >
                    <LayoutDashboard className="h-4 w-4" /> Dashboard
                  </button>
                </div>
              ))}

              {scheduled.map((lec) => (
                <div key={lec.id} className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-slate-900 dark:text-white">{lec.title}</p>
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Scheduled</p>
                  </div>
                  <button
                    onClick={() => navigate(`/school/teacher/live/${lec.id}/studio`)}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-sm font-black text-white transition hover:bg-blue-700"
                  >
                    <Monitor className="h-4 w-4" /> Studio
                  </button>
                  <button
                    onClick={() => navigate(`/school/teacher/live/${lec.id}/dashboard`)}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                  >
                    Dashboard
                  </button>
                </div>
              ))}
            </>
          )}
        </div>
      )}

      {!created ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <h2 className="mb-3 text-sm font-black text-slate-900 dark:text-white">Start a new live class</h2>
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
            {/* Primary: broadcast from the browser (screen share, whiteboard, slides) */}
            <div className="rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 p-5 dark:border-blue-900/50 dark:from-blue-900/20 dark:to-indigo-900/20">
              <div className="flex items-start gap-3">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-blue-600 text-white">
                  <MonitorUp className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-black text-slate-900 dark:text-white">Broadcast from your browser</h3>
                  <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-300">
                    Share your screen, present slides, and use the whiteboard — no OBS or setup needed. Recommended.
                  </p>
                </div>
              </div>
              <button
                onClick={() => navigate(`/school/teacher/live/${created.lectureId}/studio`)}
                className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-black text-white transition hover:bg-blue-700"
              >
                <Radio className="h-4 w-4" /> Open Studio & Go Live
              </button>
            </div>

            {/* Secondary: OBS (advanced) */}
            <button
              onClick={() => setShowObs((s) => !s)}
              className="flex w-full items-center justify-between rounded-xl border border-slate-200 px-4 py-3 text-left text-sm font-bold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              <span>Advanced: stream with OBS instead</span>
              <ChevronDown className={`h-4 w-4 transition-transform ${showObs ? 'rotate-180' : ''}`} />
            </button>

            {showObs && (
              <div className="space-y-4">
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
                  <li><b>Step 4:</b> Settings → Output → Encoding → Keyframe Interval: <b>1</b> (second) — keeps latency low</li>
                  <li><b>Step 5:</b> Click <b>Start Streaming</b> — you go LIVE automatically</li>
                </ol>
              </div>
            )}

            <button
              onClick={() => navigate(`/school/teacher/live/${created.lectureId}/dashboard`)}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
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
