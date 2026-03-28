import { Clock } from "lucide-react";
import type { Lecture } from "@/lib/api/teacher";

interface Props {
  lecture: Lecture;
  onWatch: () => void;
  onQuizFirst: () => void;
}

function fmtDuration(sec?: number) {
  if (!sec) return null;
  const m = Math.floor(sec / 60);
  return m >= 60 ? `${Math.floor(m / 60)}h ${m % 60}m` : `${m}m`;
}

export function NextLectureCard({ lecture, onWatch, onQuizFirst }: Props) {
  return (
    <div className="mt-4">
      <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "#484F58" }}>Up Next</p>
      <div className="rounded-xl p-4" style={{ background: "#161B22", border: "1px solid #30363D" }}>
        <div className="flex items-center gap-3 mb-3">
          <div
            className="w-[60px] h-[45px] rounded-lg flex items-center justify-center shrink-0 overflow-hidden"
            style={{ background: "#21262D" }}
          >
            {lecture.thumbnailUrl
              ? <img src={lecture.thumbnailUrl} className="w-full h-full object-cover" alt="" />
              : <span className="text-lg">🎬</span>}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold truncate" style={{ color: "#E6EDF3" }}>{lecture.title}</p>
            <div className="flex items-center gap-2 mt-0.5">
              {lecture.videoDurationSeconds && (
                <span className="text-xs flex items-center gap-1" style={{ color: "#8B949E" }}>
                  <Clock className="w-3 h-3" />{fmtDuration(lecture.videoDurationSeconds)}
                </span>
              )}
              {lecture.topic?.name && (
                <span className="text-xs" style={{ color: "#8B949E" }}>{lecture.topic.name}</span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={onWatch}
            className="flex-1 py-2 rounded-lg text-xs font-bold transition-colors"
            style={{ background: "transparent", border: "1px solid #F97316", color: "#F97316" }}
            onMouseEnter={e => (e.currentTarget.style.background = "rgba(249,115,22,0.1)")}
            onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
          >
            Watch Next →
          </button>
          <button onClick={onQuizFirst} className="text-xs" style={{ color: "#484F58" }}>
            Take Quiz First
          </button>
        </div>
      </div>
    </div>
  );
}
