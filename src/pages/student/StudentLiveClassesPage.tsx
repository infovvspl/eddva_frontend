import { useEffect, useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  useMyCourses,
  useAllBatchLectures,
  useSubjects,
} from '@/hooks/use-student';
import { CustomSelect } from '@/components/ui/CustomSelect';
import { cn } from '@/lib/utils';
import {
  BookOpen,
  CalendarDays,
  CheckCircle2,
  Clock3,
  ExternalLink,
  Loader2,
  PlayCircle,
  Radio,
  Video,
} from 'lucide-react';
import { liveBroadcast, type BroadcastLecture } from '@/lib/api/live-broadcast';

function fmtDateTime(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString([], {
    month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function StatusBadge({ status }: { status: BroadcastLecture['status'] }) {
  switch (status) {
    case 'LIVE':
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-red-100 dark:bg-red-900/30 px-2.5 py-1 text-xs font-black text-red-600 dark:text-red-400">
          <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" /> LIVE NOW
        </span>
      );
    case 'SCHEDULED':
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 dark:bg-amber-900/30 px-2.5 py-1 text-xs font-bold text-amber-600 dark:text-amber-400">
          <CalendarDays size={11} /> Scheduled
        </span>
      );
    case 'ENDED':
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 dark:bg-slate-800 px-2.5 py-1 text-xs font-bold text-slate-500">
          <CheckCircle2 size={11} /> Ended
        </span>
      );
    case 'PROCESSED':
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 dark:bg-green-900/30 px-2.5 py-1 text-xs font-bold text-green-600 dark:text-green-400">
          <CheckCircle2 size={11} /> Recording Ready
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 dark:bg-slate-800 px-2.5 py-1 text-xs font-bold text-slate-500">
          {status}
        </span>
      );
  }
}

/** Fetches and shows recording link for a PROCESSED lecture. */
function RecordingLink({ lectureId }: { lectureId: string }) {
  const navigate = useNavigate();
  const [url, setUrl] = useState<string | null>(null);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    liveBroadcast.getRecordingUrl(lectureId)
      .then((r) => setUrl(r?.url ?? null))
      .catch(() => setUrl(null))
      .finally(() => setFetching(false));
  }, [lectureId]);

  if (fetching) {
    return (
      <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Loader2 size={11} className="animate-spin" /> Checking recording…
      </span>
    );
  }
  if (!url) {
    return <p className="text-xs text-muted-foreground/60">Recording will be available soon.</p>;
  }
  return (
    <button
      type="button"
      onClick={() => navigate(`/student/live-classes/${lectureId}/recording`)}
      className="inline-flex items-center gap-1.5 rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-bold text-primary hover:bg-primary/20 transition-colors"
    >
      <PlayCircle size={12} /> Watch Recording
    </button>
  );
}

function LectureCard({ lecture, onJoin }: { lecture: BroadcastLecture; onJoin: () => void }) {
  const isLive = lecture.status === 'LIVE';
  const isProcessed = lecture.status === 'PROCESSED';
  const isEnded = lecture.status === 'ENDED';
  const isScheduled = lecture.status === 'SCHEDULED';

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border bg-card p-5 space-y-3 transition-shadow ${
        isLive
          ? 'border-red-500/40 shadow-lg shadow-red-500/10 hover:shadow-red-500/20'
          : 'border-border hover:shadow-md'
      }`}
    >
      {/* Top pulse bar for LIVE */}
      {isLive && (
        <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-red-500 via-orange-400 to-red-500 animate-pulse" />
      )}

      {/* Header row */}
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-bold text-foreground leading-tight line-clamp-2">{lecture.title}</h3>
        <StatusBadge status={lecture.status} />
      </div>

      {/* Batch / Subject chips */}
      {(lecture.batchName || lecture.subjectName) && (
        <div className="flex flex-wrap gap-1.5">
          {lecture.batchName && (
            <span className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
               {lecture.batchName}
            </span>
          )}
          {lecture.subjectName && (
            <span className="inline-flex items-center gap-1 rounded-md bg-secondary px-2 py-0.5 text-[10px] font-medium text-secondary-foreground">
              <BookOpen size={9} /> {lecture.subjectName}
            </span>
          )}
        </div>
      )}

      {/* Time info */}
      <div className="flex flex-col gap-1 text-xs text-muted-foreground">
        {isScheduled && lecture.scheduledAt && (
          <span className="flex items-center gap-1.5">
            <CalendarDays size={11} /> Scheduled: {fmtDateTime(lecture.scheduledAt)}
          </span>
        )}
        {lecture.startedAt && !isScheduled && (
          <span className="flex items-center gap-1.5">
            <Clock3 size={11} />
            {isLive ? 'Started' : 'Was live'}: {fmtDateTime(lecture.startedAt)}
          </span>
        )}
        {lecture.endedAt && (isEnded || isProcessed) && (
          <span className="flex items-center gap-1.5">
            <CheckCircle2 size={11} /> Ended: {fmtDateTime(lecture.endedAt)}
          </span>
        )}
      </div>

      {/* Actions */}
      {isLive && (
        <button
          onClick={onJoin}
          className="w-full rounded-xl bg-red-600 py-2.5 text-sm font-black text-white hover:bg-red-700 active:bg-red-800 transition-colors flex items-center justify-center gap-2"
        >
          <PlayCircle size={16} /> Join Now
        </button>
      )}

      {isScheduled && (
        <p className="text-xs text-muted-foreground/60">
          Class will go live automatically when the teacher starts streaming.
        </p>
      )}

      {isProcessed && <RecordingLink lectureId={lecture.id} />}

      {isEnded && (
        <p className="text-xs text-muted-foreground/60 flex items-center gap-1.5">
          <Loader2 size={11} className="animate-spin" /> Processing recording…
        </p>
      )}
    </div>
  );
}

export default function StudentLiveClassesPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [lectures, setLectures] = useState<BroadcastLecture[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters from URL
  const filterBatch = searchParams.get("batchId") ?? "";
  const filterSubjectId = searchParams.get("subjectId") ?? "";
  const filterChapterId = searchParams.get("chapterId") ?? "";
  const filterTopicId = searchParams.get("topicId") ?? "";

  const setBatchFilter = (id: string) => {
    const p = new URLSearchParams(searchParams);
    if (id) p.set("batchId", id); else p.delete("batchId");
    p.delete("subjectId");
    p.delete("chapterId");
    p.delete("topicId");
    setSearchParams(p, { replace: true });
  };

  // Student specific data
  const { data: myCourses = [] } = useMyCourses();
  const batchList = myCourses;

  const resolvedBatchId = useMemo(() => {
    if (filterBatch) return filterBatch;
    if (batchList.length === 1) return batchList[0].id;
    return undefined;
  }, [filterBatch, batchList]);

  const { data: allLectures, isLoading: isLoadingLectures } = useAllBatchLectures(resolvedBatchId);
  const { data: curriculumSubjectsRaw = [] } = useSubjects(undefined, resolvedBatchId);
  const curriculumSubjects = Array.isArray(curriculumSubjectsRaw) ? curriculumSubjectsRaw : [];
  
  const all = useMemo(() => allLectures ?? [], [allLectures]);
  
  const subjectOptions = useMemo(() => {
    const names = new Set<string>();
    
    // Only use globally enrolled subjects if we're not filtering by batch.
    // If we're filtering by a specific batch, we just use its curriculum subjects.
    if (!resolvedBatchId) {
      // We don't have a specific batch, just use what we can find in the lectures.
      for (const l of all) {
        const n = l.topic?.chapter?.subject?.name?.trim();
        if (n) names.add(n);
      }
    } else {
      for (const s of curriculumSubjects) {
        if (s.name?.trim()) names.add(s.name.trim());
      }
    }
    
    // Always include any subjects that appear in the currently visible lectures, just in case
    for (const l of all) {
      const n = l.topic?.chapter?.subject?.name?.trim();
      if (n) names.add(n);
    }
    
    const sorted = [...names].sort((a, b) => a.localeCompare(b));
    return sorted.map(n => ({ key: n.toLowerCase(), label: n }));
  }, [all, curriculumSubjects, resolvedBatchId]);
  
  const chapterOptions = useMemo(() => {
    if (!filterSubjectId) return [];
    const chapters = new Map();
    all.forEach(l => {
      if (l.topic?.chapter?.subject?.id === filterSubjectId || l.topic?.chapter?.subject?.name?.toLowerCase() === filterSubjectId) {
        if (l.topic?.chapter) chapters.set(l.topic.chapter.id, l.topic.chapter);
      }
    });
    return Array.from(chapters.values());
  }, [all, filterSubjectId]);

  const topicOptions = useMemo(() => {
    if (!filterChapterId) return [];
    const topics = new Map();
    all.forEach(l => {
      if (l.topic?.chapter?.id === filterChapterId) {
        if (l.topic) topics.set(l.topic.id, l.topic);
      }
    });
    return Array.from(topics.values());
  }, [all, filterChapterId]);

  const load = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const data = await liveBroadcast.list();
      const sorted = [...data].sort((a, b) => {
        const rank = (l: BroadcastLecture) =>
          l.status === 'LIVE' ? 0 : l.status === 'SCHEDULED' ? 1 : 2;
        if (rank(a) !== rank(b)) return rank(a) - rank(b);
        if (a.status === 'SCHEDULED' && b.status === 'SCHEDULED') {
          return new Date(a.scheduledAt ?? 0).getTime() - new Date(b.scheduledAt ?? 0).getTime();
        }
        return (
          new Date(b.endedAt ?? b.startedAt ?? 0).getTime() -
          new Date(a.endedAt ?? a.startedAt ?? 0).getTime()
        );
      });
      setLectures(sorted);
    } catch { /* non-fatal */ }
    finally { setLoading(false); }
  };

  useEffect(() => {
    load();
    const t = setInterval(() => load(true), 15_000);
    return () => clearInterval(t);
  }, []);

  const visibleBroadcasts = useMemo(() => {
    const myBatchIds = new Set(myCourses.map((c) => c.id));
    return lectures.filter(b => {
      // Batch filter logic
      if (resolvedBatchId) {
        if (b.batchId && b.batchId !== resolvedBatchId) return false;
        if (!b.batchId) {
          const matchesTitle = all.some(l => l.title.trim().toLowerCase() === b.title.trim().toLowerCase() && l.batch?.id === resolvedBatchId);
          if (!matchesTitle) return false;
        }
      } else {
        if (b.batchId && !myBatchIds.has(b.batchId)) return false;
        if (!b.batchId) {
           // We allow orphan (legacy) streams to show here if they can't be mapped,
           // so that the student doesn't lose access to their older live classes.
           // Previously we hid them if they didn't match a title, but this hides valid old streams.
        }
      }

      // Subject / Chapter / Topic logic (requires matching with standard lectures)
      if (filterSubjectId || filterChapterId || filterTopicId) {
        const matchingStandard = all.find(l => l.title.trim().toLowerCase() === b.title.trim().toLowerCase());
        
        if (filterTopicId) {
          if (matchingStandard?.topic?.id !== filterTopicId) return false;
        } else if (filterChapterId) {
          if (matchingStandard?.topic?.chapter?.id !== filterChapterId) return false;
        } else if (filterSubjectId) {
           const matchSubjectId = matchingStandard?.topic?.chapter?.subject?.id;
           const matchSubjectName = matchingStandard?.topic?.chapter?.subject?.name?.toLowerCase();
           if (matchSubjectId !== filterSubjectId && matchSubjectName !== filterSubjectId) {
              // fallback to broadcast entity subject check
              if (b.subjectId !== filterSubjectId && b.subjectName?.toLowerCase() !== filterSubjectId) return false;
           }
        }
      }
      return true;
    });
  }, [lectures, resolvedBatchId, myCourses, all, filterSubjectId, filterChapterId, filterTopicId]);

  const live = visibleBroadcasts.filter((l) => l.status === 'LIVE');
  const scheduled = visibleBroadcasts.filter((l) => l.status === 'SCHEDULED');
  const past = visibleBroadcasts.filter((l) => l.status === 'ENDED' || l.status === 'PROCESSED');

  if (loading || isLoadingLectures) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="w-full space-y-8">

      {/* Page header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-black text-foreground flex items-center gap-2.5">
            <Radio className="h-6 w-6 text-red-500" /> Live Classes
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Join live sessions, raise your hand, answer polls, and interact with your teacher in real time.
          </p>
        </div>
        
        {/* Batch filters */}
        {batchList.length > 1 && (
          <div className="flex gap-2 flex-wrap">
            <button type="button" onClick={() => setBatchFilter("")}
              className={cn("px-3 py-1.5 rounded-xl text-xs font-black transition-all",
                !filterBatch
                  ? "bg-primary text-primary-foreground"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300")}>
              All
            </button>
            {batchList.map((b) => (
              <button type="button" key={b.id} onClick={() => setBatchFilter(b.id)}
                className={cn("px-3 py-1.5 rounded-xl text-xs font-black transition-all",
                  filterBatch === b.id
                    ? "bg-primary text-primary-foreground"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300")}>
                {b.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Curriculum filters */}
      {resolvedBatchId && (subjectOptions.length > 0 || filterSubjectId || filterChapterId || filterTopicId) && (
        <div className="flex flex-row flex-nowrap items-center gap-2 overflow-x-auto bg-card p-3 rounded-2xl border">
          <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground shrink-0 inline-flex items-center gap-1.5 mr-2">
            Curriculum
          </span>
          <div className="shrink-0 min-w-[160px]">
            <CustomSelect
              value={filterSubjectId}
              onChange={(val) => {
                const p = new URLSearchParams(searchParams);
                if (val) p.set("subjectId", val); else p.delete("subjectId");
                p.delete("chapterId");
                p.delete("topicId");
                setSearchParams(p, { replace: true });
              }}
              options={[
                { value: "", label: "All subjects" },
                ...subjectOptions.map((s) => ({ value: s.key, label: s.label })),
              ]}
              className="w-full"
            />
          </div>
          <div className="shrink-0 min-w-[160px]">
            <CustomSelect
              value={filterChapterId}
              onChange={(val) => {
                const p = new URLSearchParams(searchParams);
                if (val) p.set("chapterId", val); else p.delete("chapterId");
                p.delete("topicId");
                setSearchParams(p, { replace: true });
              }}
              options={[
                { value: "", label: "All chapters" },
                ...chapterOptions.map((c) => ({ value: c.id, label: c.name })),
              ]}
              disabled={!filterSubjectId}
              className="w-full"
            />
          </div>
          <div className="shrink-0 min-w-[160px]">
            <CustomSelect
              value={filterTopicId}
              onChange={(val) => {
                const p = new URLSearchParams(searchParams);
                if (val) p.set("topicId", val); else p.delete("topicId");
                setSearchParams(p, { replace: true });
              }}
              options={[
                { value: "", label: "All topics" },
                ...topicOptions.map((t) => ({ value: t.id, label: t.name })),
              ]}
              disabled={!filterChapterId}
              className="w-full"
            />
          </div>
          {(filterSubjectId || filterChapterId || filterTopicId) && (
            <button
              type="button"
              onClick={() => {
                const p = new URLSearchParams(searchParams);
                p.delete("subjectId");
                p.delete("chapterId");
                p.delete("topicId");
                setSearchParams(p, { replace: true });
              }}
              className="shrink-0 h-9 px-3 rounded-xl text-xs font-black text-slate-500 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors whitespace-nowrap ml-2"
            >
              Clear topic filters
            </button>
          )}
        </div>
      )}

      {/* Empty state */}
      {visibleBroadcasts.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border py-24 text-center">
          <Video className="mx-auto mb-4 h-14 w-14 text-muted-foreground/30" />
          <p className="text-base font-bold text-muted-foreground">No live classes yet</p>
          <p className="mt-1 text-sm text-muted-foreground/60">
            Your teacher's scheduled live sessions will appear here automatically.
          </p>
        </div>
      )}

      {/* ── Currently LIVE ── */}
      {live.length > 0 && (
        <section className="space-y-3">
          <h2 className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-red-500">
            <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" /> Happening Right Now
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {live.map((l) => (
              <LectureCard key={l.id} lecture={l} onJoin={() => navigate(`/student/live/${l.id}`)} />
            ))}
          </div>
        </section>
      )}

      {/* ── Upcoming / Scheduled ── */}
      {scheduled.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-xs font-black uppercase tracking-widest text-muted-foreground">
            Upcoming
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {scheduled.map((l) => (
              <LectureCard key={l.id} lecture={l} onJoin={() => navigate(`/student/live/${l.id}`)} />
            ))}
          </div>
        </section>
      )}

      {/* ── Past classes ── */}
      {past.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-xs font-black uppercase tracking-widest text-muted-foreground">
            Past Classes
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {past.map((l) => (
              <LectureCard key={l.id} lecture={l} onJoin={() => navigate(`/student/live/${l.id}`)} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
