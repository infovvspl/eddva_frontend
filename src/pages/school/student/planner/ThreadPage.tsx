import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { AlertTriangle, ArrowLeft, CheckCircle2, ListChecks, Loader2, Lock, Send } from "lucide-react";
import { toast } from "sonner";
import { AiNotesPanel, type NotesUpdate } from "@/components/school/ai-notes/AiNotesPanel";
import { useLearningHome, useLearningThread, useOpenStep, useOpenThread, usePostThreadMessage, useStepProgress } from "@/hooks/use-learning-path";
import { useActivityTracker } from "@/hooks/use-activity-tracker";
import {
  apiErrorCode,
  apiErrorMessage,
  learningApi,
  type ActivitySection,
  type OpenStepResult,
  type ThreadMessage,
  type ThreadStep,
} from "@/lib/api/learning-path";
import { cn } from "@/lib/utils";
import { CurvedPath } from "./CurvedPath";
import { MessageList } from "./MessageList";
import { PathIntro } from "./PathIntro";
import { roadmapHref } from "./mind-map-layout";
import { QuizRunner } from "./QuizRunner";
import { VideosStep } from "./VideosStep";
import { formatPct, STEP_LABEL, THREAD_STATUS_LABEL } from "./status";

/** The open step: `result` is null while it loads. */
type Workspace = { stepId: string; kind: ThreadStep["kind"]; result: OpenStepResult | null };

/** One chat: the curved path of steps, the conversation, and the open step's content. */
export default function ThreadPage() {
  const { threadId = "" } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const navState = (location.state ?? {}) as { draft?: string };
  const query = useLearningThread(threadId);
  const openStep = useOpenStep(threadId);
  const progress = useStepProgress(threadId);
  const post = usePostThreadMessage(threadId);
  const openThread = useOpenThread();
  const { data: home } = useLearningHome();
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [text, setText] = useState("");
  const [pending, setPending] = useState<string | null>(null);
  /** The AI answer that just arrived, written out word by word. */
  const [streamingId, setStreamingId] = useState<string | null>(null);
  const [videoPlaying, setVideoPlaying] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const workspaceScrollRef = useRef<HTMLDivElement>(null);
  const draftSent = useRef(false);

  const first = query.data?.pages[0];
  const thread = first?.thread;
  const rounds = first?.rounds ?? [];
  const steps = useMemo(() => rounds.flatMap((r) => r.steps), [rounds]);
  const messages = useMemo<ThreadMessage[]>(() => [...(query.data?.pages ?? [])].reverse().flatMap((p) => p.messages), [query.data]);
  const assessmentInProgress = !!first?.assessmentInProgress;
  const isGeneral = thread?.scope === "general";

  // Where the student is: drives the engagement tracker.
  const section: ActivitySection = workspace ? (workspace.kind === "assessment" ? "assessment" : workspace.kind) : "chat";
  useActivityTracker({
    section,
    threadId,
    stepId: workspace?.stepId,
    enabled: !!thread,
    idleMs: section === "notes" ? 90_000 : 60_000,
    mediaPlaying: section === "videos" && videoPlaying,
  });

  const showStep = useCallback(
    (step: Pick<ThreadStep, "id" | "kind">, retake = false) => {
      setWorkspace({ stepId: step.id, kind: step.kind, result: null });
      openStep.mutate(
        { stepId: step.id, retake },
        {
          onSuccess: (res) => setWorkspace({ stepId: res.stepId, kind: res.kind, result: res }),
          onError: (err) => {
            setWorkspace(null);
            toast.error(apiErrorMessage(err, "This step could not be opened. Please try again."));
          },
        },
      );
    },
    [openStep],
  );

  // A question typed on the home screen is sent once the general chat is open.
  useEffect(() => {
    if (!thread || draftSent.current || !navState.draft) return;
    draftSent.current = true;
    void send(navState.draft);
    navigate(location.pathname, { replace: true, state: {} });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [thread]);

  // While an answer is being written, follow it unless the student has scrolled up to read.
  const keepNewestInView = useCallback(() => {
    const el = scrollRef.current;
    if (el && el.scrollHeight - el.scrollTop - el.clientHeight < 160) el.scrollTop = el.scrollHeight;
  }, []);

  // Keep the newest message in view.
  useEffect(() => {
    if (!workspace) scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages.length, pending, workspace]);

  /** mode "quiz": practice questions the student answers by tapping an option. */
  const send = async (raw: string, mode: "chat" | "quiz" = "chat") => {
    const q = raw.trim();
    if (!q || post.isPending) return;
    setText("");
    setPending(q);
    try {
      const { aiMessage } = await post.mutateAsync({ text: q, mode });
      setStreamingId(aiMessage?.id ?? null);
    } catch (err) {
      setText(q);
      toast.error(
        apiErrorCode(err) === "ASSESSMENT_IN_PROGRESS"
          ? "Chat is paused while your assessment is open. Submit it first."
          : apiErrorMessage(err, "The AI tutor could not answer right now."),
      );
    } finally {
      setPending(null);
    }
  };

  const askFromNotes = (q: string) => {
    setWorkspace(null);
    void send(q);
  };

  const saveNotes = useCallback(
    (update: NotesUpdate) => {
      const r = workspace?.result;
      if (r?.kind === "notes") {
        learningApi.saveNotes(r.notes.sessionId, update).catch(() => toast.error("Your notes changes could not be saved."));
      }
    },
    [workspace],
  );

  const finishNotes = (stepId: string) =>
    progress.mutate(
      { stepId, notesDone: true },
      {
        onSuccess: () => {
          toast.success("Notes done. Your quiz is ready.");
          setWorkspace(null);
        },
        onError: (err) => toast.error(apiErrorMessage(err)),
      },
    );

  const markWatched = (stepId: string, videoId: string) =>
    progress.mutate(
      { stepId, watchedVideoIds: [videoId] },
      {
        onSuccess: (res) =>
          setWorkspace((w) => (w?.result?.kind === "videos" ? { ...w, result: { ...w.result, watched: res.watched ?? w.result.watched } } : w)),
      },
    );

  const skipVideos = (stepId: string) =>
    progress.mutate(
      { stepId, videosDone: true },
      {
        onSuccess: () => {
          const round = rounds.find((r) => r.steps.some((s) => s.id === stepId));
          const notes = round?.steps.find((s) => s.kind === "notes");
          if (notes) showStep(notes);
          else setWorkspace(null);
        },
      },
    );

  const openTopic = (topicId: string) =>
    openThread.mutate(
      { topicId },
      {
        onSuccess: (v) => navigate(`/school/student/planner/t/${v.thread.id}`),
        onError: (err) => toast.error(apiErrorMessage(err)),
      },
    );

  const openSubtopic = (subtopicId: string) =>
    openThread.mutate(
      { subtopicId },
      {
        onSuccess: (v) => navigate(`/school/student/planner/t/${v.thread.id}`),
        onError: (err) => toast.error(apiErrorMessage(err)),
      },
    );

  if (query.isLoading) {
    return <div className="flex h-full items-center justify-center gap-2 text-sm text-muted-foreground"><Loader2 className="size-4 animate-spin" /> Opening your chat…</div>;
  }
  if (query.isError || !thread) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
        <AlertTriangle className="size-6 text-amber-500" />
        <p className="text-sm text-muted-foreground">{apiErrorMessage(query.error, "This chat could not be loaded.")}</p>
        <button type="button" onClick={() => navigate("/school/student/planner")} className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">Back to roadmap</button>
      </div>
    );
  }

  const title = isGeneral ? "AI Tutor" : thread.subtopicName ?? thread.topicName ?? "Topic";
  const composerLocked = assessmentInProgress;

  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className={cn("flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-3", isGeneral && "pl-14 lg:pl-4")}>
        <div className="min-w-0">
          {!isGeneral && (
            <Link to={roadmapHref(home?.mindMap, thread.chapterId, thread.topicId)}
              className="mb-0.5 inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground">
              <ArrowLeft className="size-3.5" /> Back to roadmap
            </Link>
          )}
          <h1 className="truncate text-base font-bold text-foreground sm:text-lg">{title}</h1>
          {!isGeneral && <p className="truncate text-xs text-muted-foreground">{[thread.subjectName, thread.chapterName].filter(Boolean).join(" · ")}</p>}
        </div>
        {!isGeneral && (
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="rounded-full bg-muted px-2.5 py-1 font-medium text-foreground">Round {thread.round} · {THREAD_STATUS_LABEL[thread.status]}</span>
            <span className="rounded-full bg-muted px-2.5 py-1 text-muted-foreground">
              Start {formatPct(thread.baselineMastery)}{thread.latestMastery !== null && <> → <strong className="text-foreground">{formatPct(thread.latestMastery)}</strong></>}
            </span>
          </div>
        )}
      </header>

      <div className="flex min-h-0 flex-1">
        {!isGeneral && rounds.length > 0 && (
          <aside className="hidden w-[272px] shrink-0 overflow-y-auto border-r border-border bg-muted/20 py-4 md:block" aria-label="Learning path">
            <CurvedPath rounds={rounds} currentStepId={workspace?.stepId ?? first?.resume?.stepId ?? null} onSelect={(s) => showStep(s)} />
            <PathIntro thread={thread} className="mx-3 mt-4" />
          </aside>
        )}

        <div className="relative flex min-w-0 flex-1 flex-col">
          {!isGeneral && rounds.length > 0 && (
            <nav className="flex gap-1.5 overflow-x-auto border-b border-border px-3 py-2 md:hidden" aria-label="Learning path">
              {steps.filter((s) => s.status !== "skipped").map((s) => (
                <button key={s.id} type="button" disabled={s.status === "locked"} onClick={() => showStep(s)}
                  className={cn("inline-flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium",
                    s.status === "done" ? "border-emerald-300 bg-emerald-50 text-emerald-800" : s.status === "active" ? "border-primary text-primary" : "border-border text-muted-foreground")}>
                  {s.status === "done" ? <CheckCircle2 className="size-3" /> : s.status === "locked" ? <Lock className="size-3" /> : null}
                  {STEP_LABEL[s.kind]}
                </button>
              ))}
            </nav>
          )}
          {!isGeneral && rounds.length > 0 && !workspace && <PathIntro thread={thread} className="mx-3 mt-3 md:hidden" />}

          {workspace ? (
            <div ref={workspaceScrollRef} className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">
              <button type="button" onClick={() => setWorkspace(null)}
                className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground">
                <ArrowLeft className="size-4" /> Back to chat
              </button>
              {!workspace.result ? (
                <div className="flex flex-col items-center justify-center gap-2 py-20 text-sm text-muted-foreground">
                  <Loader2 className="size-5 animate-spin" />
                  {workspace.kind === "notes" ? "Writing your notes… this can take up to a minute the first time." : workspace.kind === "videos" ? "Finding videos…" : "Preparing your questions…"}
                </div>
              ) : workspace.result.kind === "videos" ? (
                <VideosStep videos={workspace.result.videos} watched={workspace.result.watched}
                  onWatched={(id) => markWatched(workspace.stepId, id)} onSkip={() => skipVideos(workspace.stepId)} onPlayingChange={setVideoPlaying} />
              ) : workspace.result.kind === "notes" ? (
                <AiNotesPanel notes={workspace.result.notes} onAsk={askFromNotes} onSave={saveNotes} scrollRef={workspaceScrollRef}
                  footer={
                    (() => {
                      const step = steps.find((s) => s.id === workspace.stepId);
                      return step?.status === "done" ? (
                        <p className="rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-medium text-emerald-800">Notes finished. You can come back to them any time.</p>
                      ) : (
                        <button type="button" onClick={() => finishNotes(workspace.stepId)} disabled={progress.isPending}
                          className="w-full rounded-2xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground disabled:opacity-60">
                          I've finished these notes
                        </button>
                      );
                    })()
                  }
                />
              ) : (
                <QuizRunner quiz={workspace.result.quiz} threadId={threadId}
                  retaking={openStep.isPending}
                  onRetake={() => { const s = steps.find((x) => x.id === workspace.stepId); if (s) showStep(s, true); }} />
              )}
            </div>
          ) : (
            <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">
              {/* The same centred width as the message bar below. */}
              <div className="mx-auto w-full max-w-3xl">
              {query.hasNextPage && (
                <div className="mb-3 text-center">
                  <button type="button" onClick={() => query.fetchNextPage()} disabled={query.isFetchingNextPage} className="text-xs font-medium text-primary hover:underline">
                    {query.isFetchingNextPage ? "Loading…" : "Show earlier messages"}
                  </button>
                </div>
              )}
              {isGeneral && messages.length === 0 && !pending && (
                <p className="mx-auto mt-10 max-w-sm text-center text-sm text-muted-foreground">Ask any study question. This chat is saved, so you can come back to it.</p>
              )}
              <MessageList threadId={threadId} messages={messages} topicName={thread.topicName}
                streamingId={streamingId} onStreamGrow={keepNewestInView} onStreamDone={() => setStreamingId(null)} onOpenStep={(id) => { const s = steps.find((x) => x.id === id); if (s) showStep(s); }} onOpenTopic={openTopic} onOpenSubtopic={openSubtopic} />
              {pending && (
                <div className="mt-3 space-y-3">
                  <div className="flex justify-end"><p className="max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-br-md bg-primary/70 px-4 py-3 text-sm text-primary-foreground">{pending}</p></div>
                  <p className="inline-flex items-center gap-2 text-xs text-muted-foreground"><Loader2 className="size-3 animate-spin" /> Thinking…</p>
                </div>
              )}
              </div>
            </div>
          )}

          {(!workspace || workspace.kind !== "assessment") && (
            <form className="border-t border-border p-3" onSubmit={(e) => { e.preventDefault(); void send(text); }}>
              {/* Centred at a reading width rather than spanning the whole area. */}
              <div className="mx-auto w-full max-w-3xl">
              {composerLocked && (
                <p className="mb-2 inline-flex items-center gap-1.5 text-xs text-amber-700 dark:text-amber-300"><Lock className="size-3" /> Chat is paused while your assessment is open.</p>
              )}
              <div className="flex items-end gap-2 rounded-2xl border border-border bg-card p-2">
                <textarea value={text} onChange={(e) => setText(e.target.value)} rows={1} maxLength={2000} disabled={composerLocked}
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void send(text); } }}
                  placeholder={isGeneral ? "Ask the AI Tutor…" : `Ask about ${title}…`} aria-label="Message"
                  className="max-h-40 min-h-[40px] min-w-0 flex-1 resize-none bg-transparent px-2 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none disabled:opacity-60" />
                {!isGeneral && (
                  <button type="button" disabled={post.isPending || composerLocked}
                    onClick={() => void send(`Quiz me on ${title}.`, "quiz")}
                    className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-xl border border-border px-3 text-xs font-semibold text-foreground hover:bg-muted disabled:opacity-50">
                    <ListChecks className="size-4 text-primary" /> Quiz me
                  </button>
                )}
                <button type="submit" disabled={!text.trim() || post.isPending || composerLocked} aria-label="Send"
                  className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground disabled:opacity-50">
                  {post.isPending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
                </button>
              </div>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
