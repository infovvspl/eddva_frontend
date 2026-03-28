import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Loader2, FolderOpen, ChevronRight, BookOpen, FileText, Trash2, X, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/PageHeader";
import { useSubjects, useCreateSubject, useDeleteSubject, useChapters, useCreateChapter, useTopics, useCreateTopic } from "@/hooks/use-admin";

const ContentPage = () => {
  const { data: subjects, isLoading } = useSubjects();
  const createSubject = useCreateSubject();
  const deleteSubject = useDeleteSubject();
  const [selectedSubject, setSelectedSubject] = useState<string>("");
  const [selectedChapter, setSelectedChapter] = useState<string>("");
  const [showSubjectForm, setShowSubjectForm] = useState(false);
  const [showChapterForm, setShowChapterForm] = useState(false);
  const [showTopicForm, setShowTopicForm] = useState(false);
  const [subjectForm, setSubjectForm] = useState({ name: "", examTarget: "jee" });
  const [chapterForm, setChapterForm] = useState({ name: "" });
  const [topicForm, setTopicForm] = useState({ name: "", estimatedStudyMinutes: 30, gatePassPercentage: 70 });

  const { data: chapters, isLoading: chaptersLoading } = useChapters(selectedSubject);
  const createChapter = useCreateChapter();
  const { data: topics, isLoading: topicsLoading } = useTopics(selectedChapter);
  const createTopic = useCreateTopic();

  const subjectList = Array.isArray(subjects) ? subjects : [];
  const chapterList = Array.isArray(chapters) ? chapters : [];
  const topicList = Array.isArray(topics) ? topics : [];

  const handleCreateSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    await createSubject.mutateAsync(subjectForm);
    setSubjectForm({ name: "", examTarget: "JEE" });
    setShowSubjectForm(false);
  };

  const handleCreateChapter = async (e: React.FormEvent) => {
    e.preventDefault();
    await createChapter.mutateAsync({ subjectId: selectedSubject, name: chapterForm.name });
    setChapterForm({ name: "" });
    setShowChapterForm(false);
  };

  const handleCreateTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    await createTopic.mutateAsync({
      chapterId: selectedChapter,
      name: topicForm.name,
      estimatedStudyMinutes: topicForm.estimatedStudyMinutes,
      gatePassPercentage: topicForm.gatePassPercentage,
    });
    setTopicForm({ name: "", estimatedStudyMinutes: 30, gatePassPercentage: 70 });
    setShowTopicForm(false);
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <PageHeader title="Content" subtitle="Subject, Chapter & Topic management" />

      {/* Breadcrumb */}
      <div className="flex items-center gap-1 text-sm mb-6 flex-wrap">
        <button onClick={() => { setSelectedSubject(""); setSelectedChapter(""); }} className={`font-medium ${!selectedSubject ? "text-foreground" : "text-primary hover:underline"}`}>
          Subjects
        </button>
        {selectedSubject && (
          <>
            <ChevronRight className="w-3 h-3 text-muted-foreground" />
            <button onClick={() => setSelectedChapter("")} className={`font-medium ${!selectedChapter ? "text-foreground" : "text-primary hover:underline"}`}>
              {subjectList.find((s) => s.id === selectedSubject)?.name || "Chapters"}
            </button>
          </>
        )}
        {selectedChapter && (
          <>
            <ChevronRight className="w-3 h-3 text-muted-foreground" />
            <span className="text-foreground font-medium">
              {chapterList.find((c) => c.id === selectedChapter)?.name || "Topics"}
            </span>
          </>
        )}
      </div>

      {/* ── Subjects View ── */}
      {!selectedSubject && (
        <>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Subjects ({subjectList.length})</h3>
            <Button size="sm" onClick={() => setShowSubjectForm(!showSubjectForm)} className="gap-1.5">
              {showSubjectForm ? <X className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
              {showSubjectForm ? "Cancel" : "Add Subject"}
            </Button>
          </div>

          {showSubjectForm && (
            <form onSubmit={handleCreateSubject} className="bg-card border border-border rounded-2xl p-4 mb-4 flex gap-3 flex-wrap">
              <input required placeholder="Subject Name (e.g. Physics)" value={subjectForm.name}
                onChange={(e) => setSubjectForm({ ...subjectForm, name: e.target.value })}
                className="h-10 flex-1 min-w-[200px] px-4 bg-secondary border border-border rounded-xl text-sm outline-none focus:border-primary" />
              <select value={subjectForm.examTarget} onChange={(e) => setSubjectForm({ ...subjectForm, examTarget: e.target.value })}
                className="h-10 px-4 bg-secondary border border-border rounded-xl text-sm outline-none focus:border-primary">
                <option value="jee">JEE</option><option value="neet">NEET</option><option value="both">Both</option>
              </select>
              <Button type="submit" size="sm" disabled={createSubject.isPending} className="h-10">
                {createSubject.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create"}
              </Button>
            </form>
          )}

          {subjectList.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <FolderOpen className="w-12 h-12 mx-auto mb-4 opacity-30" />
              <p className="font-medium">No subjects yet</p>
              <p className="text-sm mt-1">Create subjects to start building your content library.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {subjectList.map((s) => (
                <button key={s.id} onClick={() => setSelectedSubject(s.id)}
                  className="bg-card border border-border rounded-2xl p-5 text-left hover:shadow-md hover:border-primary/30 transition-all group">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                        <BookOpen className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-bold text-foreground">{s.name}</h4>
                        <p className="text-xs text-muted-foreground">{s.examTarget} · {s.chapters?.length || 0} chapters</p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                </button>
              ))}
            </div>
          )}
        </>
      )}

      {/* ── Chapters View ── */}
      {selectedSubject && !selectedChapter && (
        <>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Chapters ({chapterList.length})</h3>
            <Button size="sm" onClick={() => setShowChapterForm(!showChapterForm)} className="gap-1.5">
              {showChapterForm ? <X className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
              {showChapterForm ? "Cancel" : "Add Chapter"}
            </Button>
          </div>

          {showChapterForm && (
            <form onSubmit={handleCreateChapter} className="bg-card border border-border rounded-2xl p-4 mb-4 flex gap-3">
              <input required placeholder="Chapter Name" value={chapterForm.name}
                onChange={(e) => setChapterForm({ name: e.target.value })}
                className="h-10 flex-1 px-4 bg-secondary border border-border rounded-xl text-sm outline-none focus:border-primary" />
              <Button type="submit" size="sm" disabled={createChapter.isPending} className="h-10">
                {createChapter.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create"}
              </Button>
            </form>
          )}

          {chaptersLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
          ) : chapterList.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <FileText className="w-12 h-12 mx-auto mb-4 opacity-30" />
              <p className="font-medium">No chapters yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {chapterList.map((c, i) => (
                <button key={c.id} onClick={() => setSelectedChapter(c.id)}
                  className="w-full bg-card border border-border rounded-xl p-4 text-left hover:border-primary/30 transition-all flex items-center justify-between group">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-muted-foreground w-6">{String(i + 1).padStart(2, "0")}</span>
                    <span className="text-sm font-medium text-foreground">{c.name}</span>
                    <span className="text-xs text-muted-foreground">{c.topics?.length || 0} topics</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary" />
                </button>
              ))}
            </div>
          )}
        </>
      )}

      {/* ── Topics View ── */}
      {selectedChapter && (
        <>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Topics ({topicList.length})</h3>
            <Button size="sm" onClick={() => setShowTopicForm(!showTopicForm)} className="gap-1.5">
              {showTopicForm ? <X className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
              {showTopicForm ? "Cancel" : "Add Topic"}
            </Button>
          </div>

          {showTopicForm && (
            <form onSubmit={handleCreateTopic} className="bg-card border border-border rounded-2xl p-4 mb-4 flex gap-3 flex-wrap items-end">
              <input required placeholder="Topic Name" value={topicForm.name}
                onChange={(e) => setTopicForm({ ...topicForm, name: e.target.value })}
                className="h-10 flex-1 min-w-[200px] px-4 bg-secondary border border-border rounded-xl text-sm outline-none focus:border-primary" />
              <div className="flex flex-col gap-1">
                <label className="text-xs text-muted-foreground px-1">Study mins</label>
                <input type="number" placeholder="30" value={topicForm.estimatedStudyMinutes}
                  onChange={(e) => setTopicForm({ ...topicForm, estimatedStudyMinutes: +e.target.value })}
                  className="h-10 w-28 px-4 bg-secondary border border-border rounded-xl text-sm outline-none focus:border-primary" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-muted-foreground px-1 flex items-center gap-1">
                  <Lock className="w-3 h-3" /> Gate lock %
                </label>
                <input type="number" min={0} max={100} placeholder="70" value={topicForm.gatePassPercentage}
                  onChange={(e) => setTopicForm({ ...topicForm, gatePassPercentage: +e.target.value })}
                  className="h-10 w-24 px-4 bg-secondary border border-border rounded-xl text-sm outline-none focus:border-primary" />
              </div>
              <Button type="submit" size="sm" disabled={createTopic.isPending} className="h-10">
                {createTopic.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create"}
              </Button>
            </form>
          )}

          {topicsLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
          ) : topicList.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <FileText className="w-12 h-12 mx-auto mb-4 opacity-30" />
              <p className="font-medium">No topics yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {topicList.map((t, i) => (
                <div key={t.id} className="bg-card border border-border rounded-xl p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="text-xs font-bold text-muted-foreground w-6">{String(i + 1).padStart(2, "0")}</span>
                    <span className="text-sm font-medium text-foreground">{t.name}</span>
                    {t.estimatedStudyMinutes && (
                      <span className="text-xs text-muted-foreground">{t.estimatedStudyMinutes} min</span>
                    )}
                    <span className="text-xs flex items-center gap-1 text-amber-600 bg-amber-500/10 px-2 py-0.5 rounded-full">
                      <Lock className="w-3 h-3" /> {t.gatePassPercentage ?? 70}%
                    </span>
                  </div>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${t.isActive ? "bg-emerald-500/10 text-emerald-600" : "bg-muted text-muted-foreground"}`}>
                    {t.isActive ? "Active" : "Inactive"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </motion.div>
  );
};

export default ContentPage;
