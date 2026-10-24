import { useMemo, useState } from "react";
import { NavLink, Outlet, useMatch, useNavigate } from "react-router-dom";
import { CheckCircle2, CircleDot, LifeBuoy, Map as MapIcon, Menu, MessageSquarePlus, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { useLearningThread, useLearningThreads, useOpenThread } from "@/hooks/use-learning-path";
import { apiErrorMessage, type ThreadSummary } from "@/lib/api/learning-path";
import { cn } from "@/lib/utils";
import { STEP_LABEL, THREAD_STATUS_LABEL } from "./status";

const BASE = "/school/student/planner";

function ThreadItem({ t, onPick }: { t: ThreadSummary; onPick: () => void }) {
  const Icon = t.status === "completed" ? CheckCircle2 : t.status === "suggested" ? Sparkles : t.status === "needs_teacher" ? LifeBuoy : CircleDot;
  const title = t.scope === "general" ? "AI Tutor" : t.topicName ?? "Topic";
  const sub =
    t.scope === "general"
      ? "Any subject"
      : [t.subjectName, t.status === "active" ? `Round ${t.round}${t.currentStepKind ? ` · ${STEP_LABEL[t.currentStepKind]}` : ""}` : THREAD_STATUS_LABEL[t.status]]
          .filter(Boolean)
          .join(" · ");
  return (
    <NavLink
      to={`${BASE}/t/${t.id}`}
      onClick={onPick}
      className={({ isActive }) =>
        cn(
          "flex items-start gap-2.5 rounded-xl px-3 py-2.5 text-left transition-colors",
          isActive ? "bg-primary/10 text-foreground" : "text-foreground hover:bg-muted",
        )
      }
    >
      <Icon
        className={cn(
          "mt-0.5 size-4 shrink-0",
          t.status === "completed" ? "text-emerald-500" : t.status === "suggested" ? "text-violet-500" : t.status === "needs_teacher" ? "text-amber-500" : "text-primary",
        )}
      />
      <div className="min-w-0">
        <p className="truncate text-sm font-medium">{title}</p>
        <p className="truncate text-[11px] text-muted-foreground">{sub}</p>
      </div>
    </NavLink>
  );
}

function Sidebar({ onPick }: { onPick: () => void }) {
  const navigate = useNavigate();
  const { data: threads = [], isLoading } = useLearningThreads();
  const openThread = useOpenThread();
  const groups = useMemo(() => {
    const topicThreads = threads.filter((t) => t.scope === "topic");
    return [
      { label: "In progress", items: topicThreads.filter((t) => t.status === "active" || t.status === "needs_teacher") },
      { label: "Suggested", items: topicThreads.filter((t) => t.status === "suggested") },
      { label: "Completed", items: topicThreads.filter((t) => t.status === "completed") },
    ].filter((g) => g.items.length);
  }, [threads]);
  const general = threads.find((t) => t.scope === "general");

  const openGeneral = () => {
    if (general) {
      navigate(`${BASE}/t/${general.id}`);
      onPick();
      return;
    }
    openThread.mutate(
      { general: true },
      {
        onSuccess: (view) => {
          navigate(`${BASE}/t/${view.thread.id}`);
          onPick();
        },
        onError: (err) => toast.error(apiErrorMessage(err)),
      },
    );
  };

  return (
    <nav className="flex h-full flex-col gap-3 p-3" aria-label="Your learning chats">
      <NavLink
        to={BASE}
        end
        onClick={onPick}
        className={({ isActive }) =>
          cn("flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold", isActive ? "bg-primary text-primary-foreground" : "bg-muted text-foreground hover:bg-muted/70")
        }
      >
        <MapIcon className="size-4" /> My roadmap
      </NavLink>
      <button
        type="button"
        onClick={openGeneral}
        disabled={openThread.isPending}
        className="flex items-center gap-2 rounded-xl border border-border px-3 py-2.5 text-sm font-medium text-foreground hover:bg-muted disabled:opacity-60"
      >
        <MessageSquarePlus className="size-4" /> AI Tutor
      </button>
      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto pr-1">
        {isLoading && <p className="px-3 text-xs text-muted-foreground">Loading your chats…</p>}
        {!isLoading && !groups.length && (
          <p className="px-3 text-xs leading-5 text-muted-foreground">Open a topic on your roadmap to start its chat. Every chat is saved here, so you can pick up where you left off.</p>
        )}
        {groups.map((g) => (
          <div key={g.label}>
            <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{g.label}</p>
            <div className="space-y-0.5">
              {g.items.map((t) => (
                <ThreadItem key={t.id} t={t} onPick={onPick} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </nav>
  );
}

/** The planner frame: the list of chats beside the roadmap pages. A topic's curved path is shown without it. */
export default function PlannerShell() {
  const [open, setOpen] = useState(false);
  // A topic's curved-path page is shown on its own, without the list of chats; the
  // general AI Tutor chat keeps it. Same cached query as the page, so no extra request.
  const threadId = useMatch(`${BASE}/t/:threadId`)?.params.threadId;
  const { data } = useLearningThread(threadId);
  const onPath = !!threadId && data?.pages[0]?.thread.scope !== "general";
  // One layout whose sidebar is shown or hidden, so the page under it is never remounted.
  return (
    <div className="flex h-full min-h-0 w-full bg-background">
      {!onPath && (
        <aside className="hidden w-72 shrink-0 border-r border-border bg-card lg:block">
          <Sidebar onPick={() => undefined} />
        </aside>
      )}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="w-80 p-0">
          <SheetTitle className="sr-only">Your learning chats</SheetTitle>
          <Sidebar onPick={() => setOpen(false)} />
        </SheetContent>
      </Sheet>
      <main className="relative flex min-h-0 min-w-0 flex-1 flex-col">
        {!onPath && (
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label="Open your chats"
            className="absolute left-3 top-3 z-20 flex size-9 items-center justify-center rounded-xl border border-border bg-card shadow-sm lg:hidden"
          >
            <Menu className="size-4" />
          </button>
        )}
        <Outlet />
      </main>
    </div>
  );
}
