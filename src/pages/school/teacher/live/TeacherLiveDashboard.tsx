import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import type { Socket } from 'socket.io-client';
import { Hand, Radio, Users, X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { createLiveSocket, getLiveToken, schoolLive, type LiveChatMessage } from '@/lib/api/school-live';
import FloatingReactionLayer, { useFloatingReactions } from '@/components/school/live/FloatingReaction';

interface RaisedHand { userId: string; userName: string }

export default function TeacherLiveDashboard() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const socketRef = useRef<Socket | null>(null);
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  const [viewerCount, setViewerCount] = useState(0);
  const [live, setLive] = useState(false);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [now, setNow] = useState(Date.now());
  const [hands, setHands] = useState<RaisedHand[]>([]);
  const [messages, setMessages] = useState<LiveChatMessage[]>([]);
  const [confirmEnd, setConfirmEnd] = useState(false);
  const [ending, setEnding] = useState(false);
  const { items: reactions, push: pushReaction } = useFloatingReactions();

  const endClass = async () => {
    setEnding(true);
    try {
      await schoolLive.endLecture(id);
      setLive(false);
      toast.success('Live class ended');
      navigate('/school/teacher/classes');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to end the class');
      setEnding(false);
    }
  };

  useEffect(() => {
    const socket = createLiveSocket();
    socketRef.current = socket;

    socket.on('connect', () => socket.emit('teacher-join', { token: getLiveToken(), lectureId: id }));
    socket.on('teacher-joined', ({ viewerCount }: { viewerCount: number }) => {
      setViewerCount(viewerCount);
      setLive(true);
      setStartedAt((s) => s ?? Date.now());
    });
    socket.on('viewerCount', ({ count }: { count: number }) => setViewerCount(count));
    socket.on('stream-started', () => { setLive(true); setStartedAt((s) => s ?? Date.now()); });
    socket.on('stream-ended', () => setLive(false));
    socket.on('chat', (m: LiveChatMessage) => setMessages((prev) => [...prev.slice(-200), m]));
    socket.on('reaction', ({ emoji }: { emoji: string }) => pushReaction(emoji));
    socket.on('hand-raised', ({ userId, userName, raised }: RaisedHand & { raised: boolean }) => {
      setHands((prev) => raised
        ? (prev.some((h) => h.userId === userId) ? prev : [...prev, { userId, userName }])
        : prev.filter((h) => h.userId !== userId));
    });

    return () => { socket.disconnect(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Seed chat history + initial status.
  useEffect(() => {
    schoolLive.getChatHistory(id).then(setMessages).catch(() => undefined);
    schoolLive.getStreamUrl(id).then((r) => setLive(r.status === 'LIVE')).catch(() => undefined);
  }, [id]);

  useEffect(() => {
    if (!live) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [live]);

  // Scroll only within the chat list (block:'nearest' avoids scrolling the whole page).
  useEffect(() => {
    if (messages.length) chatEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [messages]);

  const duration = useMemo(() => {
    if (!startedAt) return '00:00';
    const s = Math.max(0, Math.floor((now - startedAt) / 1000));
    const hh = Math.floor(s / 3600), mm = Math.floor((s % 3600) / 60), ss = s % 60;
    return (hh ? `${String(hh).padStart(2, '0')}:` : '') + `${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}`;
  }, [now, startedAt]);

  return (
    <div className="bg-slate-50 p-4 dark:bg-slate-950 sm:p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-black ${live ? 'bg-red-500 text-white' : 'bg-slate-300 text-slate-700 dark:bg-slate-700 dark:text-slate-200'}`}>
            <Radio className="h-3.5 w-3.5" /> {live ? 'LIVE' : 'OFFLINE'}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-700 shadow-sm dark:bg-slate-900 dark:text-slate-200">
            <Users className="h-3.5 w-3.5 text-blue-500" /> {viewerCount} watching
          </span>
          <span className="rounded-full bg-white px-3 py-1 font-mono text-xs font-bold text-slate-700 shadow-sm dark:bg-slate-900 dark:text-slate-200">⏱ {duration}</span>
        </div>
        <button onClick={() => setConfirmEnd(true)} className="rounded-xl bg-red-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-red-700">End Stream</button>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Reactions stage + chat (read-only) */}
        <div className="relative flex h-[60vh] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-gray-900 lg:col-span-2 lg:h-[72vh] dark:border-slate-800">
          <FloatingReactionLayer items={reactions} />
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-3 text-white">
            <span className="text-sm font-bold">Live Chat</span>
            <span className="text-xs text-white/50">read-only</span>
          </div>
          <div className="flex-1 space-y-2 overflow-y-auto p-4">
            {messages.length === 0 && <p className="py-10 text-center text-sm text-white/40">No messages yet.</p>}
            {messages.map((m, i) => (
              <div key={m.id} className={`rounded-lg px-3 py-2 text-sm ${i % 2 ? 'bg-white/5' : 'bg-white/[0.02]'}`}>
                <span className="font-bold text-blue-300">{m.userName}</span>{' '}
                <span className="text-white/90">{m.text}</span>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>
        </div>

        {/* Raised hands */}
        <div className="flex h-[60vh] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm lg:h-[72vh] dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-2 border-b border-slate-100 px-4 py-3 dark:border-slate-800">
            <Hand className="h-4 w-4 text-amber-500" />
            <span className="text-sm font-black text-slate-900 dark:text-white">Raised Hands</span>
            <span className="ml-auto rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">{hands.length}</span>
          </div>
          <div className="flex-1 space-y-2 overflow-y-auto p-3">
            {hands.length === 0 && <p className="py-10 text-center text-sm text-slate-400">No raised hands.</p>}
            {hands.map((h) => (
              <div key={h.userId} className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 dark:bg-slate-800">
                <span className="flex items-center gap-2 text-sm font-semibold text-slate-800 dark:text-slate-200">
                  <span className="grid h-7 w-7 place-items-center rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">{h.userName.charAt(0).toUpperCase()}</span>
                  {h.userName} <span className="animate-bounce">✋</span>
                </span>
                <button onClick={() => setHands((p) => p.filter((x) => x.userId !== h.userId))} className="text-xs font-bold text-slate-400 hover:text-red-500">Lower</button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {confirmEnd && (
        <div className="fixed inset-0 z-[200] grid place-items-center bg-black/50 p-4" onClick={(e) => e.target === e.currentTarget && setConfirmEnd(false)}>
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-base font-black text-slate-900 dark:text-white">End this live class?</h3>
              <button onClick={() => setConfirmEnd(false)} className="text-slate-400"><X className="h-5 w-5" /></button>
            </div>
            <p className="mb-5 text-sm text-slate-500">This ends the class for all students now. Also stop streaming in OBS to free the encoder.</p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setConfirmEnd(false)} disabled={ending} className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-bold text-slate-700 disabled:opacity-50 dark:border-slate-700 dark:text-slate-200">Cancel</button>
              <button onClick={endClass} disabled={ending} className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-60">
                {ending ? <><Loader2 className="h-4 w-4 animate-spin" /> Ending…</> : 'End Live Class'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
