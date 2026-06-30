import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import type { Socket } from 'socket.io-client';
import Hls from 'hls.js';
import {
  BROADCAST_REACTIONS,
  BroadcastChatMessage,
  broadcastHlsUrl,
  createBroadcastSocket,
  getBroadcastToken,
  liveBroadcast,
} from '@/lib/api/live-broadcast';
import FloatingReactionLayer, { useFloatingReactions } from '@/components/school/live/FloatingReaction';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Hand, Loader2, MessageSquare, Send, Video, X } from 'lucide-react';

type Phase = 'waiting' | 'live' | 'ended';
type SidePanel = 'chat' | 'polls';

interface ActivePoll {
  id: string;
  question: string;
  options: string[];
  correctOption?: string;
  results: Record<string, number>;
}

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

const CHAT_COOLDOWN_MS = 3_000;

export default function StudentLiveRoomPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [phase, setPhase] = useState<Phase>('waiting');
  const [lectureTitle, setLectureTitle] = useState('Live Class');
  const [viewerCount, setViewerCount] = useState(0);
  const [buffering, setBuffering] = useState(false);
  const [sidePanel, setSidePanel] = useState<SidePanel>('chat');

  const [messages, setMessages] = useState<BroadcastChatMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [cooldown, setCooldown] = useState(false);
  const [cooldownSec, setCooldownSec] = useState(0);

  const [handRaised, setHandRaised] = useState(false);
  const [activePoll, setActivePoll] = useState<ActivePoll | null>(null);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [showPollPopup, setShowPollPopup] = useState(false);
  const [pastPolls, setPastPolls] = useState<ActivePoll[]>([]);

  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);
  const cooldownTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { items: floatItems, push: pushReaction } = useFloatingReactions();

  // ── Load initial state ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!id) return;
    liveBroadcast.getStreamUrl(id).then((info) => {
      if (info?.title) setLectureTitle(info.title);
      if (info?.status === 'LIVE') {
        setPhase('live');
        if (info.streamKey) attach(broadcastHlsUrl(info.streamKey));
      } else if (info?.status && ['ENDED', 'PROCESSED'].includes(info.status)) {
        setPhase('ended');
      }
    }).catch(() => undefined);

    liveBroadcast.getChatHistory(id).then(setMessages).catch(() => undefined);
    liveBroadcast.getActivePoll(id).then((res) => {
      if (res?.poll) {
        setActivePoll({ ...res.poll, results: res.results || {} });
        setShowPollPopup(true);
      }
    }).catch(() => undefined);
    liveBroadcast.listPolls(id).then((polls) => {
      setPastPolls(polls.filter((p: any) => p.status === 'ENDED').map((p: any) => ({
        id: p.id, question: p.question, options: p.options, correctOption: p.correctOption, results: p.results || {},
      })));
    }).catch(() => undefined);
  }, [id]);

  // ── HLS attach ─────────────────────────────────────────────────────────────
  const attach = useCallback((url: string) => {
    const video = videoRef.current;
    if (!video) return;

    hlsRef.current?.destroy();
    hlsRef.current = null;

    if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 30,
      });
      hlsRef.current = hls;
      hls.loadSource(url);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        setBuffering(false);
        // snap to live edge
        if (video.duration && isFinite(video.duration)) {
          video.currentTime = Math.max(0, video.duration - 3);
        }
        video.play().catch(() => undefined);
      });
      hls.on(Hls.Events.BUFFER_STALLED_ERROR, () => setBuffering(true));
      hls.on(Hls.Events.BUFFER_APPENDED, () => setBuffering(false));
      hls.on(Hls.Events.ERROR, (_, data) => {
        if (data.fatal) {
          if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
            setTimeout(() => hls.startLoad(), 2000);
          } else {
            hls.destroy();
          }
        }
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = url;
      video.play().catch(() => undefined);
    }
  }, []);

  useEffect(() => {
    return () => {
      hlsRef.current?.destroy();
      hlsRef.current = null;
    };
  }, []);

  // ── Socket ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!id) return;
    const socket = createBroadcastSocket();
    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('join', { token: getBroadcastToken(), lectureId: id });
    });

    socket.on('joined', ({ viewerCount: vc }) => {
      setViewerCount(vc ?? 0);
    });

    socket.on('stream-started', async () => {
      setPhase('live');
      try {
        const info = await liveBroadcast.getStreamUrl(id);
        if (info?.streamKey) attach(broadcastHlsUrl(info.streamKey));
      } catch {
        undefined;
      }
    });

    socket.on('stream-ended', () => {
      setPhase('ended');
      hlsRef.current?.destroy();
      hlsRef.current = null;
    });

    socket.on('viewerCount', ({ count }) => setViewerCount(count ?? 0));

    socket.on('chat', (msg: BroadcastChatMessage) => {
      setMessages((prev) => [...prev, msg]);
    });

    socket.on('chat-rate-limited', ({ retryInSeconds }) => {
      const secs = retryInSeconds || 10;
      setCooldown(true);
      setCooldownSec(secs);
      const tick = setInterval(() => {
        setCooldownSec((s) => {
          if (s <= 1) {
            clearInterval(tick);
            setCooldown(false);
            return 0;
          }
          return s - 1;
        });
      }, 1000);
    });

    socket.on('hand-ack', ({ raised }) => setHandRaised(raised));

    socket.on('reaction', ({ emoji }) => pushReaction(emoji));

    socket.on('poll-created', ({ poll }) => {
      setActivePoll({ id: poll.id, question: poll.question, options: poll.options, correctOption: poll.correctOption, results: {} });
      setSelectedOption(null);
      setShowPollPopup(true);
    });

    socket.on('poll-results', ({ pollId, results }) => {
      setActivePoll((prev) => (prev?.id === pollId ? { ...prev, results } : prev));
    });

    socket.on('poll-ended', ({ pollId }) => {
      setActivePoll((prev) => {
        if (prev?.id === pollId) {
          setPastPolls((p) => [...p, { ...prev }]);
          return null;
        }
        return prev;
      });
      setShowPollPopup(false);
    });

    socket.on('stream-error', ({ message }) => {
      toast({ title: 'Connection error', description: message, variant: 'destructive' });
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [id, attach]);

  // Auto-scroll chat
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ── Actions ─────────────────────────────────────────────────────────────────
  const sendChat = () => {
    const text = draft.trim();
    if (!text || !socketRef.current || cooldown) return;
    socketRef.current.emit('chat', { text });
    setDraft('');
    // local cooldown guard
    setCooldown(true);
    setCooldownSec(3);
    if (cooldownTimer.current) clearTimeout(cooldownTimer.current);
    cooldownTimer.current = setTimeout(() => setCooldown(false), CHAT_COOLDOWN_MS);
  };

  const toggleHand = () => {
    const newState = !handRaised;
    socketRef.current?.emit('raise-hand', { raised: newState });
    setHandRaised(newState);
  };

  const sendReaction = (emoji: string) => {
    socketRef.current?.emit('reaction', { emoji });
  };

  const votePoll = async (option: string) => {
    if (!activePoll || !id) return;
    setSelectedOption(option);
    try {
      await liveBroadcast.votePoll(id, activePoll.id, option);
    } catch {
      toast({ title: 'Failed to submit vote', variant: 'destructive' });
    }
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">
      {/* Header */}
      <header className="flex items-center gap-3 px-4 py-3 border-b border-gray-800 bg-gray-900 flex-shrink-0">
        <button onClick={() => navigate('/student/lectures')} className="text-gray-400 hover:text-white transition-colors">
          <ArrowLeft size={20} />
        </button>
        <Video className="text-blue-400 flex-shrink-0" size={20} />
        <h1 className="font-semibold text-base truncate flex-1">{lectureTitle}</h1>
        {phase === 'live' && (
          <Badge className="bg-red-600 text-white animate-pulse flex-shrink-0 text-xs">● LIVE</Badge>
        )}
        <span className="text-gray-400 text-sm flex-shrink-0">{viewerCount} watching</span>
      </header>

      {/* Main body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Video area */}
        <div className="flex-1 relative bg-black min-h-0 flex flex-col">
          {/* Video */}
          <div className="relative flex-1 flex items-center justify-center">
            <video
              ref={videoRef}
              className={`w-full h-full object-contain ${phase !== 'live' ? 'hidden' : ''}`}
              playsInline
              autoPlay
            />

            {phase === 'waiting' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center gap-4 px-6">
                <div className="w-16 h-16 rounded-full bg-gray-800 flex items-center justify-center">
                  <Video className="text-gray-500" size={28} />
                </div>
                <p className="text-lg font-semibold text-white">{lectureTitle}</p>
                <p className="text-gray-400 text-sm">Waiting for the teacher to start the stream…</p>
                <Loader2 className="text-blue-400 animate-spin" size={22} />
              </div>
            )}

            {phase === 'ended' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center gap-4 px-6">
                <Video className="text-gray-500" size={40} />
                <p className="text-lg font-semibold text-white">Class Ended</p>
                <p className="text-gray-400 text-sm">The live class has ended.</p>
                <Button variant="outline" onClick={() => navigate('/student/lectures')}>
                  Back to Lectures
                </Button>
              </div>
            )}

            {phase === 'live' && buffering && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                <Loader2 className="text-white animate-spin" size={36} />
              </div>
            )}

            <FloatingReactionLayer items={floatItems} />
          </div>

          {/* Bottom controls (reactions + hand raise) */}
          {phase === 'live' && (
            <div className="flex items-center justify-between px-4 py-2 bg-gray-900 border-t border-gray-800 flex-shrink-0">
              <div className="flex gap-2">
                {BROADCAST_REACTIONS.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => sendReaction(emoji)}
                    className="text-xl hover:scale-125 transition-transform"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
              <button
                onClick={toggleHand}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  handRaised
                    ? 'bg-yellow-500 text-black'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                <Hand size={14} />
                {handRaised ? 'Lower Hand' : 'Raise Hand'}
              </button>
            </div>
          )}
        </div>

        {/* Right panel */}
        <div className="w-80 flex-shrink-0 flex flex-col border-l border-gray-800 bg-gray-900">
          {/* Panel tabs */}
          <div className="flex border-b border-gray-800 flex-shrink-0">
            {([
              { key: 'chat', label: 'Chat', icon: MessageSquare },
              { key: 'polls', label: 'Polls', icon: null },
            ] as const).map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setSidePanel(key)}
                className={`flex-1 py-2.5 text-xs font-medium transition-colors relative ${
                  sidePanel === key ? 'text-blue-400 border-b-2 border-blue-400' : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                {label}
                {key === 'polls' && activePoll && (
                  <span className="absolute top-1 right-2 bg-blue-500 text-white text-[9px] rounded-full w-4 h-4 flex items-center justify-center font-bold">!</span>
                )}
              </button>
            ))}
          </div>

          {/* Panel content */}
          <div className="flex-1 overflow-y-auto min-h-0">
            {/* Chat */}
            {sidePanel === 'chat' && (
              <div className="flex flex-col h-full">
                <div className="flex-1 overflow-y-auto p-3 space-y-2 min-h-0">
                  {messages.map((m) => (
                    <div key={m.id} className="text-sm">
                      <span className="text-blue-300 font-medium">{m.userName}</span>
                      <span className="text-gray-500 text-xs ml-1">{fmtTime(m.createdAt)}</span>
                      <p className="text-gray-200 mt-0.5 break-words">{m.text}</p>
                    </div>
                  ))}
                  {messages.length === 0 && (
                    <p className="text-gray-600 text-xs text-center mt-4">No messages yet</p>
                  )}
                  <div ref={chatBottomRef} />
                </div>
                <div className="p-2 border-t border-gray-800 flex-shrink-0">
                  <div className="flex gap-2">
                    <Input
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      placeholder={cooldown ? `Wait ${cooldownSec}s…` : 'Type a message…'}
                      disabled={cooldown}
                      className="bg-gray-800 border-gray-700 text-white text-sm h-8"
                      onKeyDown={(e) => e.key === 'Enter' && sendChat()}
                    />
                    <Button size="sm" className="h-8 px-2" onClick={sendChat} disabled={cooldown || !draft.trim()}>
                      <Send size={14} />
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Polls */}
            {sidePanel === 'polls' && (
              <div className="p-3 space-y-4">
                {/* Active poll */}
                {activePoll && (
                  <div className="bg-blue-900/20 border border-blue-700/50 rounded-lg p-3">
                    <span className="text-xs text-blue-300 uppercase font-medium">Active Poll</span>
                    <p className="text-sm font-medium text-white mt-1 mb-3">{activePoll.question}</p>
                    <div className="space-y-2">
                      {activePoll.options.map((opt) => {
                        const votes = activePoll.results?.[opt] ?? 0;
                        const total = Object.values(activePoll.results || {}).reduce((a, b) => a + b, 0);
                        const pct = total ? Math.round((votes / total) * 100) : 0;
                        const isSelected = selectedOption === opt;
                        const isCorrect = activePoll.correctOption === opt;
                        return (
                          <button
                            key={opt}
                            onClick={() => votePoll(opt)}
                            className={`w-full text-left px-3 py-2 rounded-lg border text-sm transition-colors ${
                              isSelected
                                ? 'bg-blue-600 border-blue-500 text-white'
                                : 'bg-gray-800 border-gray-700 text-gray-300 hover:border-blue-600'
                            }`}
                          >
                            <div className="flex justify-between items-center">
                              <span>{opt}</span>
                              {selectedOption && <span className="text-xs text-gray-400">{pct}%</span>}
                            </div>
                            {selectedOption && (
                              <div className="h-1 bg-gray-700 rounded-full mt-1 overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${isCorrect ? 'bg-green-500' : 'bg-blue-500'}`}
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Past polls */}
                {pastPolls.length > 0 && (
                  <>
                    <p className="text-xs text-gray-500 uppercase">Ended Polls</p>
                    {pastPolls.map((poll) => {
                      const total = Object.values(poll.results || {}).reduce((a, b) => a + b, 0);
                      return (
                        <div key={poll.id} className="bg-gray-800 rounded-lg p-3">
                          <p className="text-xs font-medium text-gray-300 mb-2">{poll.question}</p>
                          {poll.options.map((opt) => {
                            const votes = poll.results?.[opt] ?? 0;
                            const pct = total ? Math.round((votes / total) * 100) : 0;
                            const isCorrect = poll.correctOption === opt;
                            return (
                              <div key={opt} className="mb-1">
                                <div className="flex justify-between text-xs mb-0.5">
                                  <span className={isCorrect ? 'text-green-400' : 'text-gray-400'}>{opt}{isCorrect && ' ✓'}</span>
                                  <span className="text-gray-500">{pct}%</span>
                                </div>
                                <div className="h-1 bg-gray-700 rounded-full overflow-hidden">
                                  <div className={`h-full rounded-full ${isCorrect ? 'bg-green-500' : 'bg-blue-600'}`} style={{ width: `${pct}%` }} />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })}
                  </>
                )}

                {!activePoll && pastPolls.length === 0 && (
                  <p className="text-gray-600 text-xs text-center mt-4">No polls yet</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Poll popup */}
      {showPollPopup && activePoll && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-xl p-5 w-full max-w-sm shadow-2xl">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-blue-400 uppercase font-semibold">New Poll</span>
              <button onClick={() => setShowPollPopup(false)} className="text-gray-500 hover:text-white">
                <X size={16} />
              </button>
            </div>
            <p className="text-base font-semibold text-white mb-4">{activePoll.question}</p>
            <div className="space-y-2">
              {activePoll.options.map((opt) => (
                <button
                  key={opt}
                  onClick={() => { votePoll(opt); setShowPollPopup(false); setSidePanel('polls'); }}
                  className={`w-full text-left px-4 py-2.5 rounded-lg border text-sm transition-colors ${
                    selectedOption === opt
                      ? 'bg-blue-600 border-blue-500 text-white'
                      : 'bg-gray-800 border-gray-700 text-gray-300 hover:border-blue-600'
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowPollPopup(false)}
              className="text-xs text-gray-500 mt-3 hover:text-gray-300 w-full text-center"
            >
              Answer later
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
