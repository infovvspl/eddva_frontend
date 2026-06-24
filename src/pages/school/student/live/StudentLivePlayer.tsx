import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import type { Socket } from 'socket.io-client';
import Hls from 'hls.js';
import { Hand, Maximize, Send, Wifi } from 'lucide-react';
import {
  createLiveSocket,
  getLiveToken,
  hlsProxyUrl,
  LIVE_REACTIONS,
  schoolLive,
  type LiveChatMessage,
} from '@/lib/api/school-live';
import FloatingReactionLayer, { useFloatingReactions } from '@/components/school/live/FloatingReaction';

type Phase = 'waiting' | 'live' | 'ended';

export default function StudentLivePlayer() {
  const { id = '' } = useParams();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const hlsRef = useRef<Hls | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  const [phase, setPhase] = useState<Phase>('waiting');
  const [playbackUrl, setPlaybackUrl] = useState('');
  const [buffering, setBuffering] = useState(false);   // live but stream not yet flowing
  const [messages, setMessages] = useState<LiveChatMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [cooldown, setCooldown] = useState(0);
  const [handRaised, setHandRaised] = useState(false);
  const { items: reactions, push: pushReaction } = useFloatingReactions();

  // ── load HLS ──────────────────────────────────────────────────────────────
  const attach = (url: string) => {
    const video = videoRef.current;
    if (!video || !url) return;
    if (hlsRef.current) { hlsRef.current.destroy(); hlsRef.current = null; }
    setBuffering(true);
    if (Hls.isSupported()) {
      const hls = new Hls({
        // Always join at the live edge and stay there — students should never
        // start from the beginning of the buffered window.
        liveSyncDurationCount: 3,
        liveMaxLatencyDurationCount: 8,
        liveDurationInfinity: true,
        backBufferLength: 10,            // don't retain a long replayable back-buffer
        // HLS has startup latency — keep retrying the manifest while the
        // teacher's segments are still being produced/uploaded.
        manifestLoadingMaxRetry: 8,
        manifestLoadingRetryDelay: 2000,
        manifestLoadingMaxRetryTimeout: 30000,
      });
      hls.loadSource(url);
      hls.attachMedia(video);
      const jumpToLive = () => {
        // hls.liveSyncPosition is the recommended live play-head.
        const live = (hls as any).liveSyncPosition;
        if (typeof live === 'number' && isFinite(live)) {
          if (video.currentTime < live - 1) video.currentTime = live;
        } else if (video.seekable.length) {
          video.currentTime = video.seekable.end(video.seekable.length - 1);
        }
      };
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        setBuffering(false);
        jumpToLive();
        video.play().catch(() => undefined);
      });
      // Keep snapping to live: if the player drifts too far behind the edge
      // (tab backgrounded, buffering, slow network), jump back to live.
      hls.on(Hls.Events.LEVEL_UPDATED, () => {
        const live = (hls as any).liveSyncPosition;
        if (typeof live === 'number' && isFinite(live) && live - video.currentTime > 12) {
          video.currentTime = live;
        }
      });
      hls.on(Hls.Events.ERROR, (_evt, data) => {
        if (!data.fatal) return;
        if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
          // Manifest/segment not available yet (stream still warming up) — retry.
          setBuffering(true);
          setTimeout(() => { try { hls.startLoad(); } catch { /* destroyed */ } }, 3000);
        } else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
          try { hls.recoverMediaError(); } catch { /* noop */ }
        } else {
          // Unrecoverable — rebuild the player after a short delay.
          try { hls.destroy(); } catch { /* noop */ }
          hlsRef.current = null;
          setTimeout(() => attach(url), 4000);
        }
      });
      hlsRef.current = hls;
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = url;
      video.addEventListener('loadedmetadata', () => {
        setBuffering(false);
        // Seek to the live edge (Safari native HLS).
        if (video.seekable.length) video.currentTime = video.seekable.end(video.seekable.length - 1);
        video.play().catch(() => undefined);
      }, { once: true });
    }
  };

  // ── initial status + socket ────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    schoolLive.getStreamUrl(id).then((r) => {
      if (cancelled) return;
      // Play through the same-origin proxy (R2's public domain has no CORS headers).
      const playUrl = r.streamKey ? hlsProxyUrl(r.streamKey) : r.url;
      setPlaybackUrl(playUrl);
      if (r.status === 'LIVE') { setPhase('live'); setTimeout(() => attach(playUrl), 0); }
      else if (r.status === 'ENDED') setPhase('ended');
    }).catch(() => undefined);
    schoolLive.getChatHistory(id).then((h) => { if (!cancelled) setMessages(h); }).catch(() => undefined);

    const socket = createLiveSocket();
    socketRef.current = socket;
    socket.on('connect', () => socket.emit('join', { token: getLiveToken(), lectureId: id }));
    socket.on('chat', (m: LiveChatMessage) => setMessages((prev) => [...prev.slice(-200), m]));
    socket.on('reaction', ({ emoji }: { emoji: string }) => pushReaction(emoji));
    socket.on('hand-ack', ({ raised }: { raised: boolean }) => setHandRaised(raised));
    socket.on('stream-started', () => { setPhase('live'); setPlaybackUrl((u) => { if (u) setTimeout(() => attach(u), 300); return u; }); });
    socket.on('stream-ended', () => { setPhase('ended'); hlsRef.current?.destroy(); });

    return () => { cancelled = true; socket.disconnect(); hlsRef.current?.destroy(); hlsRef.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Scroll only within the chat list (block:'nearest' + guard) so an empty chat
  // doesn't scroll the whole page and clip the top of the video.
  useEffect(() => {
    if (messages.length) chatEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [messages]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const send = () => {
    const text = draft.trim();
    if (!text || cooldown > 0) return;
    socketRef.current?.emit('chat', { text: text.slice(0, 300) });
    setDraft('');
    setCooldown(3);
  };

  const fullscreen = () => videoRef.current?.requestFullscreen?.().catch(() => undefined);

  const toggleHand = () => {
    const next = !handRaised;
    setHandRaised(next);
    socketRef.current?.emit('raise-hand', { raised: next });
    schoolLive.setHandRaised(id, next).catch(() => setHandRaised(!next));
  };

  return (
    <div className="flex flex-col gap-4 p-3 sm:p-4 lg:flex-row lg:items-start">
      {/* Video + interaction (70%) */}
      <div className="flex flex-1 flex-col gap-3 lg:w-[70%]">
        <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-gray-900 lg:aspect-auto lg:h-[72vh]">
          <FloatingReactionLayer items={reactions} />
          <video ref={videoRef} className="h-full w-full object-contain" controls playsInline />
          {phase === 'live' && buffering && (
            <div className="pointer-events-none absolute inset-0 grid place-items-center bg-gray-900/70 text-center">
              <div className="text-white/80">
                <Wifi className="mx-auto mb-3 h-9 w-9 animate-pulse text-blue-400" />
                <p className="text-base font-bold">Connecting to live stream…</p>
                <p className="text-xs text-white/50">Buffering the teacher's feed — this can take a few seconds.</p>
              </div>
            </div>
          )}
          {phase !== 'live' && (
            <div className="absolute inset-0 grid place-items-center bg-gray-900 text-center">
              {phase === 'waiting' ? (
                <div className="text-white/80">
                  <Wifi className="mx-auto mb-3 h-10 w-10 animate-pulse text-blue-400" />
                  <p className="text-lg font-bold">Waiting for stream…</p>
                  <p className="text-sm text-white/50">The class will start automatically when the teacher goes live.</p>
                </div>
              ) : (
                <div className="text-white/80">
                  <p className="text-lg font-bold">Class ended</p>
                  <p className="text-sm text-white/50">Recording will be available soon.</p>
                </div>
              )}
            </div>
          )}
          {phase === 'live' && (
            <>
              <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-red-600 px-2.5 py-1 text-xs font-black text-white"><span className="h-2 w-2 rounded-full bg-white" /> LIVE · auto</span>
              <button onClick={fullscreen} className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-lg bg-black/40 text-white hover:bg-black/60"><Maximize className="h-4 w-4" /></button>
            </>
          )}
        </div>

        {/* Interaction bar */}
        <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-slate-200 bg-white p-2.5 dark:border-slate-800 dark:bg-slate-900">
          <button
            onClick={toggleHand}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold transition ${handRaised ? 'bg-amber-500 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200'}`}
          >
            <Hand className="h-4 w-4" /> {handRaised ? 'Hand Raised ✋' : 'Raise Hand'}
          </button>
          <div className="ml-auto flex items-center gap-1">
            {LIVE_REACTIONS.map((emoji) => (
              <button
                key={emoji}
                onClick={() => socketRef.current?.emit('reaction', { emoji })}
                className="grid h-10 w-10 place-items-center rounded-xl text-xl transition hover:scale-125 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Chat (30%) */}
      <div className="flex h-[420px] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-gray-800 lg:h-[70vh] lg:w-[30%] dark:border-slate-800">
        <div className="border-b border-white/10 px-4 py-3 text-sm font-bold text-white">Live Chat</div>
        <div className="flex-1 space-y-2 overflow-y-auto p-3">
          {messages.length === 0 && <p className="py-10 text-center text-sm text-white/40">Be the first to say hi 👋</p>}
          {messages.map((m, i) => (
            <div key={m.id} className={`flex gap-2 rounded-lg p-2 ${i % 2 ? 'bg-white/5' : ''}`}>
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-blue-500/30 text-xs font-bold text-blue-200">{m.userName.charAt(0).toUpperCase()}</span>
              <div className="min-w-0">
                <div className="flex items-baseline gap-2">
                  <span className="truncate text-xs font-bold text-blue-200">{m.userName}</span>
                  <span className="shrink-0 text-[10px] text-white/40">{new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <p className="break-words text-sm text-white/90">{m.text}</p>
              </div>
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>
        <div className="flex items-center gap-2 border-t border-white/10 p-2.5">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && send()}
            maxLength={300}
            placeholder={cooldown > 0 ? `Wait ${cooldown}s…` : 'Type a message…'}
            className="min-w-0 flex-1 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-white/40 outline-none focus:border-blue-400"
          />
          <button
            onClick={send}
            disabled={cooldown > 0 || !draft.trim()}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-blue-600 text-white transition hover:bg-blue-700 disabled:opacity-50"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
