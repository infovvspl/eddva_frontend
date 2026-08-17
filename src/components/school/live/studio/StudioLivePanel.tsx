import { useEffect, useRef, useState } from 'react';
import type { Socket } from 'socket.io-client';
import { MessageSquare, Users, Hand, Send, Eye } from 'lucide-react';
import { createLiveSocket, getLiveToken, type LiveChatMessage } from '@/lib/api/school-live';
import FloatingReactionLayer, { useFloatingReactions } from '@/components/school/live/FloatingReaction';

/**
 * StudioLivePanel — the interaction sidebar for the in-browser Studio: chat,
 * students, raised hands, live reactions and viewer count. It connects to the
 * same `/school-live` realtime namespace and uses the identical events as the
 * teacher dashboard (teacher-join / chat / participants / hand-raised /
 * reaction), so the Studio is a complete live console on its own.
 */

interface Student { userId: string; userName: string }
interface Hand { userId: string; userName: string }
// The wire payload carries a role the API type doesn't declare (same as the dashboard).
type ChatMsg = LiveChatMessage & { role?: string };

function handsFromStudents(rows: (Student & { handRaised?: boolean })[]): Hand[] {
  return rows.filter((r) => r.handRaised).map((r) => ({ userId: r.userId, userName: r.userName }));
}

export default function StudioLivePanel({ lectureId, isLive }: { lectureId: string; isLive: boolean }) {
  const socketRef = useRef<Socket | null>(null);
  const chatEndRef = useRef<HTMLDivElement | null>(null);
  const [tab, setTab] = useState<'chat' | 'students' | 'hands'>('chat');
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [hands, setHands] = useState<Hand[]>([]);
  const [viewers, setViewers] = useState(0);
  const [draft, setDraft] = useState('');
  const { items: reactions, push: pushReaction } = useFloatingReactions();

  useEffect(() => {
    const socket = createLiveSocket();
    socketRef.current = socket;

    socket.on('connect', () => socket.emit('teacher-join', { token: getLiveToken(), lectureId }));
    socket.on('teacher-joined', ({ viewerCount = 0, students: s = [] }: { viewerCount?: number; students?: (Student & { handRaised?: boolean })[] }) => {
      setViewers(viewerCount);
      setStudents(s);
      setHands(handsFromStudents(s));
    });
    socket.on('viewerCount', ({ count }: { count: number }) => setViewers(count));
    socket.on('participants', ({ students: s = [] }: { students?: (Student & { handRaised?: boolean })[] }) => {
      setStudents(s);
      setHands(handsFromStudents(s));
    });
    socket.on('chat', (m: ChatMsg) => setMessages((prev) => [...prev.slice(-200), m]));
    socket.on('reaction', ({ emoji }: { emoji: string }) => pushReaction(emoji));
    socket.on('hand-raised', ({ userId, userName, raised }: Hand & { raised: boolean }) => {
      setHands((prev) =>
        raised
          ? (prev.some((h) => h.userId === userId) ? prev : [...prev, { userId, userName }])
          : prev.filter((h) => h.userId !== userId),
      );
    });

    return () => {
      try { socket.disconnect(); } catch {}
      socketRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lectureId]);

  useEffect(() => {
    if (tab === 'chat') chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, tab]);

  const send = () => {
    const text = draft.trim();
    if (!text) return;
    socketRef.current?.emit('chat', { text: text.slice(0, 300) });
    setDraft('');
  };

  const lowerHand = (userId: string) => socketRef.current?.emit('lower-hand', { userId });

  const TabBtn = ({ id, icon: Icon, label, badge }: { id: typeof tab; icon: typeof Users; label: string; badge?: number }) => (
    <button
      onClick={() => setTab(id)}
      className={`relative flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-black transition ${tab === id ? 'bg-blue-600 text-white' : 'text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'}`}
    >
      <Icon className="h-4 w-4" /> <span className="hidden lg:inline">{label}</span>
      {!!badge && <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-amber-500 px-1 text-[10px] font-black text-white">{badge}</span>}
    </button>
  );

  return (
    <div className="relative flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
      <FloatingReactionLayer items={reactions} />

      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 px-3 py-2 dark:border-slate-800">
        <span className="text-xs font-black uppercase tracking-wider text-slate-500">Live Class</span>
        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
          <Eye className="h-3.5 w-3.5" /> {viewers}
        </span>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-slate-100 p-2 dark:border-slate-800">
        <TabBtn id="chat" icon={MessageSquare} label="Chat" />
        <TabBtn id="students" icon={Users} label="Students" badge={students.length || undefined} />
        <TabBtn id="hands" icon={Hand} label="Hands" badge={hands.length || undefined} />
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-3">
        {tab === 'chat' && (
          messages.length === 0 ? (
            <EmptyState icon={MessageSquare} title="No messages yet" sub="Student messages appear here." />
          ) : (
            <div className="space-y-2">
              {messages.map((m, i) => (
                <div key={m.id || i} className={`rounded-xl px-3 py-2 text-sm ${m.role === 'teacher' ? 'bg-blue-50 dark:bg-blue-900/20' : 'bg-slate-50 dark:bg-slate-800/60'}`}>
                  <span className={`mr-1.5 text-xs font-black ${m.role === 'teacher' ? 'text-blue-600' : 'text-slate-500'}`}>{m.role === 'teacher' ? 'You' : m.userName}</span>
                  <span className="text-slate-700 dark:text-slate-200">{m.text}</span>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>
          )
        )}

        {tab === 'students' && (
          students.length === 0 ? (
            <EmptyState icon={Users} title="No students yet" sub="Students who join appear here." />
          ) : (
            <div className="space-y-1.5">
              {students.map((s) => (
                <div key={s.userId} className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-800/60">
                  <span className="grid h-7 w-7 place-items-center rounded-full bg-blue-100 text-xs font-black text-blue-600 dark:bg-blue-900/40">{s.userName?.[0]?.toUpperCase() || '?'}</span>
                  <span className="truncate text-sm font-semibold text-slate-700 dark:text-slate-200">{s.userName}</span>
                </div>
              ))}
            </div>
          )
        )}

        {tab === 'hands' && (
          hands.length === 0 ? (
            <EmptyState icon={Hand} title="No raised hands" sub="Raised hands show up here." />
          ) : (
            <div className="space-y-1.5">
              {hands.map((h) => (
                <div key={h.userId} className="flex items-center justify-between gap-2 rounded-lg bg-amber-50 px-2 py-1.5 dark:bg-amber-900/20">
                  <span className="flex items-center gap-2 truncate">
                    <Hand className="h-4 w-4 text-amber-500" />
                    <span className="truncate text-sm font-semibold text-slate-700 dark:text-slate-200">{h.userName}</span>
                  </span>
                  <button onClick={() => lowerHand(h.userId)} className="rounded-lg px-2 py-1 text-xs font-bold text-slate-500 hover:bg-white hover:text-slate-700 dark:hover:bg-slate-800">Lower</button>
                </div>
              ))}
            </div>
          )
        )}
      </div>

      {/* Chat input */}
      {tab === 'chat' && (
        <div className="border-t border-slate-100 p-2 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && send()}
              placeholder={isLive ? 'Message students…' : 'Go live to chat'}
              disabled={!isLive}
              className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
            <button onClick={send} disabled={!isLive || !draft.trim()} className="grid h-9 w-9 place-items-center rounded-xl bg-blue-600 text-white transition hover:bg-blue-700 disabled:opacity-40">
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function EmptyState({ icon: Icon, title, sub }: { icon: typeof Users; title: string; sub: string }) {
  return (
    <div className="grid h-full place-items-center text-center">
      <div>
        <Icon className="mx-auto mb-2 h-8 w-8 text-slate-300" />
        <p className="text-sm font-bold text-slate-500">{title}</p>
        <p className="text-xs text-slate-400">{sub}</p>
      </div>
    </div>
  );
}
