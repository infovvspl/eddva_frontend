import { ArrowRight, ClipboardCheck, LifeBuoy, PartyPopper, Route, Sparkles, Target, Unlock } from "lucide-react";
import { ChatQuiz } from "./ChatQuiz";
import { stripCitations } from "./citations";
import { StreamingText } from "./StreamingText";
import { MarkdownRenderer } from "@/components/shared/MarkdownRenderer";
import type { ThreadMessage } from "@/lib/api/learning-path";
import { cn } from "@/lib/utils";
import { formatPct } from "./status";

interface MessageListProps {
  threadId: string;
  messages: ThreadMessage[];
  /** The answer that just arrived: written out word by word. */
  streamingId?: string | null;
  /** While it is being written (keep it in view), and once it is complete. */
  onStreamGrow?: () => void;
  onStreamDone?: () => void;
  topicName: string | null;
  onOpenStep: (stepId: string) => void;
  onOpenTopic: (topicId: string) => void;
  onOpenSubtopic: (subtopicId: string) => void;
}


function Bubble({ children, tone = "ai" }: { children: React.ReactNode; tone?: "ai" | "student" | "system" }) {
  return (
    <div className={cn("flex", tone === "student" ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[85%] rounded-2xl px-4 py-3 text-sm",
          tone === "student" && "rounded-br-md bg-primary text-primary-foreground",
          tone === "ai" && "rounded-bl-md border border-border bg-card text-foreground",
          tone === "system" && "mx-auto bg-muted px-3 py-1.5 text-xs text-muted-foreground",
        )}
      >
        {children}
      </div>
    </div>
  );
}

function ActionCard({ icon: Icon, title, body, action, onAction, tone = "default" }: {
  icon: typeof Route;
  title: string;
  body?: React.ReactNode;
  action?: string;
  onAction?: () => void;
  tone?: "default" | "good" | "warn";
}) {
  return (
    <div className="flex justify-start">
      <div className={cn("w-full max-w-md rounded-2xl border p-4",
        tone === "good" ? "border-emerald-200 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/40"
          : tone === "warn" ? "border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/40"
          : "border-border bg-card")}
      >
        <p className="flex items-center gap-2 text-sm font-semibold text-foreground"><Icon className="size-4 text-primary" /> {title}</p>
        {body && <div className="mt-1.5 text-sm text-muted-foreground">{body}</div>}
        {action && onAction && (
          <button type="button" onClick={onAction} className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground">
            {action} <ArrowRight className="size-4" />
          </button>
        )}
      </div>
    </div>
  );
}

/** One chat's history: the student's questions, the AI's answers, and the path's cards. */
export function MessageList({ threadId, messages, topicName, onOpenStep, onOpenTopic, onOpenSubtopic, streamingId, onStreamGrow, onStreamDone }: MessageListProps) {
  return (
    <div className="space-y-3">
      {messages.map((m) => {
        const c = m.content ?? {};
        const step = m.stepId ? () => onOpenStep(m.stepId!) : undefined;
        switch (m.kind) {
          case "text":
            return m.role === "student" ? (
              <Bubble key={m.id} tone="student"><p className="whitespace-pre-wrap">{c.text}</p></Bubble>
            ) : (
              <Bubble key={m.id}>
                {m.id === streamingId ? (
                  <StreamingText text={stripCitations(String(c.text ?? ""))} onGrow={onStreamGrow} onDone={onStreamDone} />
                ) : (
                  <MarkdownRenderer content={stripCitations(String(c.text ?? ""))} />
                )}
                {/* A quiz appears once its intro has finished writing. */}
                {m.id !== streamingId && Array.isArray(c.quiz?.questions) && c.quiz.questions.length > 0 && (
                  <ChatQuiz threadId={threadId} messageId={m.id} questions={c.quiz.questions} savedResult={c.quizResult ?? null} />
                )}
              </Bubble>
            );
          // The welcome is shown below the curved path (PathIntro), not in the chat.
          case "welcome":
            return null;
          // The video and notes cards are not shown (older chats still have them saved): the curved path opens those steps.
          case "video_set":
          case "notes_card":
            return null;
          case "quiz_card":
          case "assessment_card":
            return (
              <ActionCard key={m.id} icon={m.kind === "assessment_card" ? ClipboardCheck : Target}
                title={m.kind === "assessment_card" ? "Formal assessment ready" : c.retake ? "New quiz ready" : "Quiz ready"}
                body={`${c.questionCount ?? ""} questions${c.minutes ? ` · ${c.minutes} min, one attempt` : ""}`}
                action="Open" onAction={step} />
            );
          case "quiz_result":
          case "assessment_result":
            return (
              <ActionCard key={m.id} icon={m.kind === "assessment_result" ? ClipboardCheck : Target}
                tone={(c.accuracy ?? 0) >= 70 ? "good" : "warn"}
                title={`${m.kind === "assessment_result" ? "Assessment" : "Quiz"}: ${formatPct(c.accuracy)}`}
                body={Array.isArray(c.weakConcepts) && c.weakConcepts.length ? `Needs more work: ${c.weakConcepts.map((w: any) => w.conceptTag).join(", ")}` : "No weak concepts found."}
                action="See answers" onAction={step} />
            );
          case "step_unlocked":
            return (
              <Bubble key={m.id} tone="system"><span className="inline-flex items-center gap-1.5"><Unlock className="size-3" /> {c.text}</span></Bubble>
            );
          case "path_extension":
            return (
              <ActionCard key={m.id} icon={Route} tone="warn" title={`Round ${c.round} added below`}
                body={<>Your {c.reason === "assessment" ? "assessment" : "quiz"} showed {c.focusConcepts?.length ? <>gaps in <strong>{c.focusConcepts.join(", ")}</strong></> : "some gaps"}. The new round's videos, notes and quiz focus on {c.focusConcepts?.length ? "them" : "the topic again"}.</>}
              />
            );
          case "prerequisite_suggestion":
            return (
              <ActionCard key={m.id} icon={Sparkles} title={`Try "${c.subtopicName ?? c.topicName}" first`}
                body="This earlier topic is likely the gap. Its chat is ready in your list."
                action="Open it" onAction={() => (c.subtopicId ? onOpenSubtopic(c.subtopicId) : onOpenTopic(c.topicId))} />
            );
          case "path_complete": {
            const gain = c.baselineMastery !== null && c.baselineMastery !== undefined ? Math.round(c.latestMastery - c.baselineMastery) : null;
            return (
              <ActionCard key={m.id} icon={PartyPopper} tone="good" title="Topic complete!"
                body={<>Formal assessment: <strong>{formatPct(c.latestMastery)}</strong>{gain !== null && <> (was {formatPct(c.baselineMastery)}, {gain >= 0 ? `+${gain}` : gain} points)</>}.</>}
              />
            );
          }
          case "needs_teacher":
            return (
              <ActionCard key={m.id} icon={LifeBuoy} tone="warn" title="Let's get you some help"
                body={<>After three rounds this topic is still hard{c.focusConcepts?.length ? <>, especially {c.focusConcepts.join(", ")}</> : ""}. It is flagged in your progress report. Keep asking me here about anything that is unclear.</>}
              />
            );
          default:
            return null;
        }
      })}
    </div>
  );
}
