import { useState } from "react";
import ReactMarkdown from "react-markdown";
import { apiClient, extractData } from "@/lib/api/client";

interface Props {
  lectureId: string;
  topicId: string;
  topicName: string;
  lectureTitle: string;
  timestampSeconds: number;
  onClose: () => void;
}

type Mode = "short" | "detailed";
type Tab = "ai" | "teacher";

interface DoubtResponse {
  doubtId: string;
  aiExplanation: string;
  aiConceptLinks?: string[];
}

function fmt(s: number) {
  return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
}

export function AskDoubtPanel({ lectureId, topicId, topicName, lectureTitle, timestampSeconds, onClose }: Props) {
  const [tab, setTab] = useState<Tab>("ai");
  const [text, setText] = useState("");
  const [mode, setMode] = useState<Mode>("short");
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<DoubtResponse | null>(null);
  const [feedback, setFeedback] = useState<"helpful" | "not_helpful" | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState("");
  const [teacherSent, setTeacherSent] = useState(false);

  const handleAsk = async () => {
    if (!text.trim() || loading) return;
    setLoading(true);
    setResponse(null);
    try {
      const res = await apiClient.post("/doubts", {
        ...(topicId ? { topicId } : {}),
        questionText: text.trim(),
        source: "lecture",
        sourceRefId: lectureId,
        explanationMode: mode,
      });
      const data = extractData<DoubtResponse>(res);
      setResponse(data);
    } catch {
      setResponse({ doubtId: "", aiExplanation: "Failed to get AI response. Please try again.", aiConceptLinks: [] });
    } finally {
      setLoading(false);
    }
  };

  const handleAskTeacher = async () => {
    if (!text.trim() || loading) return;
    setLoading(true);
    try {
      await apiClient.post("/doubts", {
        ...(topicId ? { topicId } : {}),
        questionText: text.trim(),
        source: "lecture",
        sourceRefId: lectureId,
        explanationMode: "short",
        skipAI: true,
      });
      setTeacherSent(true);
    } catch {
      setTeacherSent(false);
    } finally {
      setLoading(false);
    }
  };

  const handleFeedback = async (helpful: boolean) => {
    if (!response?.doubtId) return;
    setFeedback(helpful ? "helpful" : "not_helpful");
    try {
      await apiClient.post(`/doubts/${response.doubtId}/helpful`, { isHelpful: helpful });
    } catch { /* silent */ }
    if (helpful) {
      setFeedbackMsg("✅ Got it!");
      setTimeout(onClose, 1000);
    } else {
      setFeedbackMsg("Sending to your teacher... ⏳");
    }
  };

  const switchTab = (t: Tab) => {
    setTab(t);
    setResponse(null);
    setFeedback(null);
    setFeedbackMsg("");
    setTeacherSent(false);
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-base" style={{ color: "#E6EDF3" }}>💬 Ask Doubt</h3>
        <button onClick={onClose} className="text-xs px-2 py-1 rounded" style={{ color: "#8B949E", background: "#21262D" }}>× Close</button>
      </div>

      {/* Tab toggle */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => switchTab("ai")}
          className="flex-1 py-2 rounded-lg text-xs font-semibold transition-all"
          style={{
            background: tab === "ai" ? "#7C3AED" : "#21262D",
            color: tab === "ai" ? "white" : "#8B949E",
            border: "1px solid " + (tab === "ai" ? "#A855F7" : "#30363D"),
          }}
        >
          ✨ Ask AI
        </button>
        <button
          onClick={() => switchTab("teacher")}
          className="flex-1 py-2 rounded-lg text-xs font-semibold transition-all"
          style={{
            background: tab === "teacher" ? "#0D6EFD" : "#21262D",
            color: tab === "teacher" ? "white" : "#8B949E",
            border: "1px solid " + (tab === "teacher" ? "#3B82F6" : "#30363D"),
          }}
        >
          👨‍🏫 Ask Teacher
        </button>
      </div>

      {/* Timestamp chip */}
      <div className="flex gap-2 mb-4 flex-wrap">
        <span
          className="text-xs px-3 py-1 rounded-full"
          style={{ background: "#21262D", border: "1px solid #A855F7", color: "#E6EDF3" }}
        >
          🎬 At {fmt(timestampSeconds)} in {lectureTitle}
        </span>
        <span
          className="text-xs px-3 py-1 rounded-full"
          style={{ background: "#21262D", border: "1px solid #F97316", color: "#E6EDF3" }}
        >
          📚 {topicName}
        </span>
      </div>

      {/* Text input */}
      <textarea
        value={text}
        onChange={e => setText(e.target.value)}
        placeholder={tab === "ai" ? "What don't you understand at this part?" : "Describe your doubt for the teacher..."}
        rows={3}
        className="w-full resize-none rounded-lg p-3 text-sm mb-4 outline-none transition-all"
        style={{
          background: "#21262D",
          border: "1px solid #30363D",
          color: "#E6EDF3",
        }}
        onFocus={e => (e.currentTarget.style.boxShadow = `0 0 0 2px rgba(${tab === "ai" ? "168,85,247" : "59,130,246"},0.3)`)}
        onBlur={e => (e.currentTarget.style.boxShadow = "none")}
      />

      {/* AI tab controls */}
      {tab === "ai" && (
        <>
          {/* Mode toggle */}
          <div className="flex gap-2 mb-4">
            {(["short", "detailed"] as Mode[]).map(m => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className="flex-1 py-2 rounded-lg text-xs font-semibold transition-all"
                style={{
                  background: mode === m ? "#7C3AED" : "#21262D",
                  color: mode === m ? "white" : "#8B949E",
                  border: "1px solid " + (mode === m ? "#A855F7" : "#30363D"),
                }}
              >
                {m === "short" ? "⚡ Short" : "📖 Detailed"}
              </button>
            ))}
          </div>

          {/* Ask AI button */}
          <button
            onClick={handleAsk}
            disabled={!text.trim() || loading}
            className="w-full py-3 rounded-lg font-bold text-sm text-white mb-4 transition-opacity"
            style={{
              background: "linear-gradient(135deg, #7C3AED, #A855F7)",
              opacity: !text.trim() || loading ? 0.6 : 1,
            }}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                Thinking...
                <span className="flex gap-1">
                  {[0, 1, 2].map(i => (
                    <span
                      key={i}
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ background: "#A855F7", animation: `pulse 1s ${i * 0.2}s infinite` }}
                    />
                  ))}
                </span>
              </span>
            ) : "Ask AI ✨"}
          </button>

          {/* AI Response */}
          {response && (
            <div
              className="rounded-xl p-4"
              style={{ background: "#161B22", border: "1px solid #30363D", animation: "fadeIn 300ms ease" }}
            >
              <style>{`@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } } @keyframes pulse { 0%,100% { opacity:0.4; } 50% { opacity:1; } }`}</style>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: "rgba(168,85,247,0.2)", color: "#A855F7", border: "1px solid rgba(168,85,247,0.3)" }}>
                  ✨ AI Response
                </span>
              </div>
              <div className="text-sm prose prose-invert max-w-none" style={{ color: "#E6EDF3" }}>
                <ReactMarkdown>{response.aiExplanation}</ReactMarkdown>
              </div>

              {(response.aiConceptLinks?.length ?? 0) > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {response.aiConceptLinks!.map((link, i) => (
                    <span key={i} className="text-xs px-2.5 py-1 rounded-full" style={{ background: "#21262D", border: "1px solid #1D4ED8", color: "#60A5FA" }}>
                      {link}
                    </span>
                  ))}
                </div>
              )}

              {!feedbackMsg ? (
                <div className="flex gap-3 mt-4">
                  <button
                    onClick={() => handleFeedback(true)}
                    className="flex-1 py-2 rounded-lg text-xs font-semibold"
                    style={{ background: "rgba(34,197,94,0.15)", color: "#22C55E", border: "1px solid rgba(34,197,94,0.3)" }}
                  >
                    👍 Helpful
                  </button>
                  <button
                    onClick={() => handleFeedback(false)}
                    className="flex-1 py-2 rounded-lg text-xs font-semibold"
                    style={{ background: "rgba(239,68,68,0.15)", color: "#EF4444", border: "1px solid rgba(239,68,68,0.3)" }}
                  >
                    👎 Not helpful
                  </button>
                </div>
              ) : (
                <p className="text-xs mt-3 text-center" style={{ color: feedback === "helpful" ? "#22C55E" : "#8B949E" }}>{feedbackMsg}</p>
              )}
            </div>
          )}
        </>
      )}

      {/* Teacher tab controls */}
      {tab === "teacher" && (
        <>
          {teacherSent ? (
            <div
              className="rounded-xl p-5 text-center"
              style={{ background: "#161B22", border: "1px solid #1D4ED8" }}
            >
              <div className="text-3xl mb-2">📬</div>
              <p className="text-sm font-bold mb-1" style={{ color: "#60A5FA" }}>Doubt sent to your teacher!</p>
              <p className="text-xs" style={{ color: "#8B949E" }}>Your teacher will review and respond soon.</p>
              <button
                onClick={onClose}
                className="mt-4 w-full py-2 rounded-lg text-xs font-semibold"
                style={{ background: "#21262D", color: "#8B949E", border: "1px solid #30363D" }}
              >
                Close
              </button>
            </div>
          ) : (
            <button
              onClick={handleAskTeacher}
              disabled={!text.trim() || loading}
              className="w-full py-3 rounded-lg font-bold text-sm text-white mb-4 transition-opacity"
              style={{
                background: "linear-gradient(135deg, #1D4ED8, #3B82F6)",
                opacity: !text.trim() || loading ? 0.6 : 1,
              }}
            >
              {loading ? "Sending..." : "Send to Teacher 👨‍🏫"}
            </button>
          )}
        </>
      )}
    </div>
  );
}
