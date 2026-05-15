  // Weak chapters: chapters with overall accuracy > 0 and < 50% with at least one attempted topic
  const weakChapters = useMemo(() => {
    const list: Array<{ chapterId: string; chapterName: string; subjectName: string; topicsTotal: number; topicsCompleted: number; overallAccuracy: number; attemptedTopics: number }> = [];
    effectiveProgressReport?.subjects.forEach(s =>
      s.chapters.forEach(c => {
        const attempted = c.topics.filter(t => t.attemptCount > 0 || t.status === "completed" || t.status === "in_progress").length;
        if (attempted > 0 && c.overallAccuracy > 0 && c.overallAccuracy < 50) {
          list.push({
            chapterId: c.chapterId,
            chapterName: c.chapterName,
            subjectName: s.subjectName,
            topicsTotal: c.topicsTotal,
            topicsCompleted: c.topicsCompleted,
            overallAccuracy: Math.round(c.overallAccuracy),
            attemptedTopics: attempted,
          });
        }
      })
    );
    return list.sort((a, b) => a.overallAccuracy - b.overallAccuracy);
  }, [effectiveProgressReport]);

  // Forgotten concepts: completed topics not revisited in 14+ days, or abandoned in-progress (3+ attempts)
  const forgottenConcepts = useMemo(() => {
    const now = new Date();
    const list: Array<{ topicId: string; topicName: string; subjectName: string; chapterName: string; status: string; daysSince: number | null; attemptCount: number; bestAccuracy: number }> = [];
    effectiveProgressReport?.subjects.forEach(s =>
      s.chapters.forEach(c =>
        c.topics.forEach(t => {
          if (t.status === "completed" && t.completedAt) {
            const days = differenceInDays(now, new Date(t.completedAt));
            if (days >= 14) {
              list.push({ topicId: t.topicId, topicName: t.topicName, subjectName: s.subjectName, chapterName: c.chapterName, status: "completed", daysSince: days, attemptCount: t.attemptCount, bestAccuracy: t.bestAccuracy });
            }
          } else if (t.status === "in_progress" && t.attemptCount >= 3) {
            list.push({ topicId: t.topicId, topicName: t.topicName, subjectName: s.subjectName, chapterName: c.chapterName, status: "in_progress", daysSince: null, attemptCount: t.attemptCount, bestAccuracy: t.bestAccuracy });
          }
        })
      )
    );
    return list.sort((a, b) => (b.daysSince ?? 999) - (a.daysSince ?? 999));
  }, [effectiveProgressReport]);

  // High negative-marking areas: topics where PYQ accuracy < 50% (high wrong-answer rate)
  const highNegativeTopics = useMemo(() => {
    const list: Array<{ topicId: string; topicName: string; subjectName: string; chapterName: string; attempted: number; correct: number; wrong: number; pyqAccuracy: number }> = [];
    effectiveProgressReport?.subjects.forEach(s =>
      s.chapters.forEach(c =>
        c.topics.forEach(t => {
          if (t.pyq && t.pyq.attempted > 0 && t.pyq.accuracy < 50) {
            list.push({
              topicId: t.topicId,
              topicName: t.topicName,
              subjectName: s.subjectName,
              chapterName: c.chapterName,
              attempted: t.pyq.attempted,
              correct: t.pyq.correct,
              wrong: t.pyq.attempted - t.pyq.correct,
              pyqAccuracy: Math.round(t.pyq.accuracy),
            });
          }
        })
      )
    );
    return list.sort((a, b) => a.pyqAccuracy - b.pyqAccuracy);
  }, [effectiveProgressReport]);

  // Revision queue: topics the student has studied (via completed plan items OR report signals)
  // Primary source: completed StudyPlanItems — always fresh, never stale from cache.
  // Secondary: effectiveProgressReport for topics with quiz/lecture signals not in the plan.
  const revisionTopics = useMemo(() => {
    const now = new Date();
    type RevItem = {
      topicId: string; topicName: string; subjectName: string; chapterName: string;
      accuracy: number; completedAt: string | null; learnedOn: string;
      nextRevisionDate: Date; nextRevisionLabel: string;
      intervalDays: 1 | 3 | 7 | 21; isOverdue: boolean;
    };
    const list: RevItem[] = [];
    const seenTopicIds = new Set<string>();

    const addTopic = (
      topicId: string, topicName: string, subjectName: string, chapterName: string,
      accuracy: number, completedAt: string | null, learnedOnFallback: string
    ) => {
      if (seenTopicIds.has(topicId) || accuracy >= 75) return;
      seenTopicIds.add(topicId);
      const interval: 1 | 3 | 7 | 21 = accuracy < 40 ? 1 : accuracy < 55 ? 3 : accuracy < 65 ? 7 : 21;
      const base      = completedAt ? new Date(completedAt) : now;
      const nextDate  = addDays(base, interval);
      const daysUntil = differenceInDays(nextDate, now);
      const isOverdue = daysUntil < 0;
      const learnedOn = completedAt ? format(new Date(completedAt), "MMM d") : learnedOnFallback;
      const nextLabel = isOverdue ? "Overdue" : daysUntil === 0 ? "Today" : format(nextDate, "MMM d");
      list.push({ topicId, topicName, subjectName, chapterName: chapterName ?? "", accuracy, completedAt, learnedOn, nextRevisionDate: nextDate, nextRevisionLabel: nextLabel, intervalDays: interval, isOverdue });
    };

    // Build accuracy lookup from report
    const reportMap = new Map<string, { accuracy: number; completedAt: string | null }>();
    effectiveProgressReport?.subjects.forEach(s =>
      s.chapters.forEach(c =>
        c.topics.forEach(t =>
          reportMap.set(t.topicId, { accuracy: t.bestAccuracy ?? 0, completedAt: t.completedAt ?? null })
        )
      )
    );

    // Primary: all completed plan items (today + past week)
    const allPlanItems = [
      ...todayItems,
      ...Object.values(backlogWeekData).flat(),
    ];
    allPlanItems.forEach(item => {
      if (item.status !== "completed" || !item.content?.topicId) return;
      const { topicId, topicName = "Unknown Topic", subjectName = "General", chapterName = "" } = item.content;
      const rep = reportMap.get(topicId);
      addTopic(topicId, topicName, subjectName, chapterName, rep?.accuracy ?? 0, rep?.completedAt ?? null, format(new Date(item.scheduledDate), "MMM d"));
    });

    // Secondary: report topics with clear interaction signals (quiz attempts, lectures, AI sessions)
    effectiveProgressReport?.subjects.forEach(s =>
      s.chapters.forEach(c =>
        c.topics.forEach(t => {
          const hasInteracted =
            t.status !== "locked" &&
            (t.bestAccuracy > 0 || t.attemptCount > 0 ||
             t.lecture?.anyCompleted || t.aiSession?.completed);
          if (hasInteracted)
            addTopic(t.topicId, t.topicName, s.subjectName, c.chapterName, t.bestAccuracy ?? 0, t.completedAt ?? null, "—");
        })
      )
    );

    return list.sort((a, b) =>
      a.isOverdue !== b.isOverdue ? (a.isOverdue ? -1 : 1)
      : a.nextRevisionDate.getTime() - b.nextRevisionDate.getTime()
    );
  }, [effectiveProgressReport, todayItems, backlogWeekData]);

  // Intensive revision: filter recent plan items for 'revision' type
