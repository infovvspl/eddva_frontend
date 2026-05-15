        {/* ══ REVISION TAB ════════════════════════════════════════════════════════ */}
        {activeTab === "revision" && (
          <div className="grid grid-cols-1 lg:grid-cols-7 gap-3">
            {/* Left Column */}
            <div className="lg:col-span-4 space-y-4">
              
              {/* Main Landing View for Revision Categories */}
              {!revisionCategory && (
                <>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">Revision Dashboard</h2>
                    <p className="text-sm text-gray-500 mt-0.5">Select a category to review your topics and practice</p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {([
                      { key: "spaced",    icon: <RefreshCw className="w-5 h-5" />, label: "Spaced Revision",    count: revisionTopics.length,       desc: "Topics grouped by revision intervals", accent: "bg-teal-50 border-teal-200 text-teal-600", badge: "bg-teal-100 text-teal-700"  },
                      { key: "intensive", icon: <Target    className="w-5 h-5" />, label: "Intensive Revision", count: intensiveRevisionItems.length, desc: "Revision after syllabus completion",   accent: "bg-indigo-50 border-indigo-200 text-indigo-600", badge: "bg-indigo-100 text-indigo-700"  },
                      { key: "notes",     icon: <BookOpen  className="w-5 h-5" />, label: "Study Notes",        count: completedAiNotes.length,       desc: "Completed AI study plan notes",        accent: "bg-amber-50 border-amber-200 text-amber-600", badge: "bg-amber-100 text-amber-700" },
                      { key: "practice",  icon: <CheckCheck className="w-5 h-5" />,label: "Practice Questions", count: completedPractice.length,      desc: "Completed practice questions",         accent: "bg-violet-50 border-violet-200 text-violet-600", badge: "bg-violet-100 text-violet-700" },
                    ] as const).map(c => (
                      <button key={c.key} onClick={() => setRevisionCategory(c.key)}
                        className="text-left bg-white rounded-2xl border-2 border-gray-100 p-4 hover:border-gray-300 hover:shadow-md transition-all group">
                        <div className="flex items-start gap-3">
                          <div className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${c.accent}`}>{c.icon}</div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-sm text-gray-900">{c.label}</span>
                              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${c.badge}`}>{c.count}</span>
                            </div>
                            <p className="text-xs text-gray-400 mt-0.5">{c.desc}</p>
                          </div>
                          <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 transition-colors shrink-0 mt-1" />
                        </div>
                      </button>
                    ))}
                  </div>
                </>
              )}

              {/* Detail view navigation header */}
              {revisionCategory && (
                <div className="flex items-center gap-2 mb-4">
                  <button onClick={() => { setRevisionCategory(null); setRevisionPage(null); }}
                    className="flex items-center gap-1.5 text-sm text-indigo-600 font-medium hover:text-indigo-800 transition-colors bg-indigo-50 px-3 py-1.5 rounded-lg">
                    <ArrowLeft className="w-4 h-4" /> Back to Revision
                  </button>
                  {/* Inside spaced view, there's another level of navigation (schedule/table/aiplan) */}
                  {revisionCategory === "spaced" && revisionPage && (
                    <button onClick={() => setRevisionPage(null)}
                      className="flex items-center gap-1.5 text-sm text-indigo-600 font-medium hover:text-indigo-800 transition-colors bg-indigo-50 px-3 py-1.5 rounded-lg">
                      <ChevronRight className="w-4 h-4 rotate-180" /> Spaced Menu
                    </button>
                  )}
                </div>
              )}

              {/* ── Spaced Revision ── */}
              {revisionCategory === "spaced" && (
                <div className="space-y-2">
                  {!revisionPage && (
                    <>
                      <div>
                        <h2 className="text-lg font-bold text-gray-900">Spaced Revision Plan</h2>
                        <p className="text-sm text-gray-500 mt-0.5">Choose how you want to review your topics</p>
                      </div>
                      {revisionTopics.length === 0 ? (
                        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
                          <BookOpen className="w-12 h-12 text-teal-400 mx-auto mb-4" />
                          <h3 className="text-lg font-bold text-gray-900">Revision queue is empty</h3>
                          <p className="text-gray-500 mt-2 text-sm">Complete study plan tasks to populate your revision queue.</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {([
                            { key: "schedule", icon: <RefreshCw className="w-5 h-5" />, label: "Spaced Schedule",   desc: "Topics grouped by 1d / 3d / 7d / 21d revision intervals", count: revisionTopics.length, accent: "bg-teal-50 border-teal-200 text-teal-600",     badge: "bg-teal-100 text-teal-700"    },
                            { key: "table",    icon: <ListTodo   className="w-5 h-5" />, label: "Topic Table",       desc: "Full list with learned-on and next-revision dates",       count: revisionTopics.length, accent: "bg-indigo-50 border-indigo-200 text-indigo-600", badge: "bg-indigo-100 text-indigo-700" },
                            { key: "aiplan",   icon: <Sparkles  className="w-5 h-5" />, label: "AI 7-Day Plan",     desc: "Auto-scheduled revision across the next 7 days",          count: revisionTopics.length, accent: "bg-violet-50 border-violet-200 text-violet-600", badge: "bg-violet-100 text-violet-700" },
                          ] as const).map(c => (
                            <button key={c.key} onClick={() => setRevisionPage(c.key)}
                              className="text-left bg-white rounded-2xl border-2 border-gray-100 p-4 hover:border-gray-300 hover:shadow-md transition-all group">
                              <div className="flex items-start gap-3">
                                <div className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${c.accent}`}>{c.icon}</div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className="font-bold text-sm text-gray-900">{c.label}</span>
                                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${c.badge}`}>{c.count}</span>
                                  </div>
                                  <p className="text-xs text-gray-400 mt-0.5">{c.desc}</p>
                                </div>
                                <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 transition-colors shrink-0 mt-1" />
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </>
                  )}

                  {revisionPage === "schedule" && (() => {
                    const BUCKETS: Array<{
                      interval: 1 | 3 | 7 | 21;
                      label: string; sublabel: string;
                      accentBg: string; accentBorder: string; accentBadge: string; accentText: string;
                    }> = [
                      { interval: 1,  label: "1-Day Revision",  sublabel: "accuracy < 40% — revise every day",        accentBg: "bg-red-50",    accentBorder: "border-red-300",    accentBadge: "bg-red-100 text-red-700",      accentText: "text-red-700"    },
                      { interval: 3,  label: "3-Day Revision",  sublabel: "accuracy 40–54% — revise every 3 days",    accentBg: "bg-orange-50", accentBorder: "border-orange-300", accentBadge: "bg-orange-100 text-orange-700", accentText: "text-orange-700" },
                      { interval: 7,  label: "7-Day Revision",  sublabel: "accuracy 55–64% — revise every 7 days",    accentBg: "bg-amber-50",  accentBorder: "border-amber-300",  accentBadge: "bg-amber-100 text-amber-700",  accentText: "text-amber-700"  },
                      { interval: 21, label: "21-Day Revision", sublabel: "accuracy 65–74% — revise every 3 weeks",   accentBg: "bg-teal-50",   accentBorder: "border-teal-300",   accentBadge: "bg-teal-100 text-teal-700",   accentText: "text-teal-700"   },
                    ];
                    return (
                      <div className="space-y-3">
                        {BUCKETS.map(bkt => {
                          const items = revisionTopics.filter(t => t.intervalDays === bkt.interval);
                          if (items.length === 0) return null;
                          const open = openRevBuckets.has(bkt.interval);
                          const overdue = items.filter(t => t.isOverdue).length;
                          return (
                            <div key={bkt.interval} className={`rounded-2xl border-2 ${bkt.accentBorder} overflow-hidden`}>
                              <button onClick={() => toggleRevBucket(bkt.interval)}
                                className={`w-full flex items-center gap-3 px-4 py-3 text-left ${bkt.accentBg}`}>
                                <RefreshCw className={`w-4 h-4 ${bkt.accentText}`} />
                                <div className="flex-1">
                                  <span className={`font-bold text-sm ${bkt.accentText}`}>{bkt.label}</span>
                                  <span className="text-xs text-gray-400 ml-2">{bkt.sublabel}</span>
                                </div>
                                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${bkt.accentBadge}`}>{items.length}</span>
                                {overdue > 0 && (
                                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-red-100 text-red-700 border border-red-200">{overdue} overdue</span>
                                )}
                                {open ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
                              </button>
                              {open && (
                                <div className="bg-white p-3 space-y-2">
                                  {items.map(topic => (
                                    <RevisionTopicCard
                                      key={topic.topicId}
                                      topic={topic}
                                      isNoteOpen={openNoteIds.has(topic.topicId)}
                                      noteText={revisionNotes[topic.topicId] ?? ""}
                                      onToggleNote={() => toggleNote(topic.topicId)}
                                      onNoteChange={v => setRevisionNotes(p => ({ ...p, [topic.topicId]: v }))}
                                      onRevise={() => navigate(`/student/ai-study/${topic.topicId}`)}
                                      onFullNotes={() => navigate(`/student/ai-study/${topic.topicId}`)}
                                    />
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}

                  {revisionPage === "table" && (
                    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="bg-gray-50 border-b border-gray-100">
                              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Topic</th>
                              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">Learned On</th>
                              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">Next Revision</th>
                              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Interval</th>
                              <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Accuracy</th>
                              <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-50">
                            {revisionTopics.map(topic => {
                              const cfg = subjectCfg(topic.subjectName);
                              const accColor = topic.accuracy < 40 ? "text-red-600" : topic.accuracy < 55 ? "text-orange-500" : topic.accuracy < 65 ? "text-amber-600" : "text-teal-600";
                              return (
                                <tr key={topic.topicId} className={`hover:bg-gray-50 transition-colors ${topic.isOverdue ? "bg-red-50/40" : ""}`}>
                                  <td className="px-4 py-3">
                                    <div className="font-medium text-gray-900 truncate max-w-[180px]">{topic.topicName}</div>
                                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full border font-medium ${cfg.bg} ${cfg.color} ${cfg.border}`}>{topic.subjectName}</span>
                                  </td>
                                  <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">{topic.learnedOn}</td>
                                  <td className="px-4 py-3 whitespace-nowrap">
                                    <span className={`text-sm font-semibold ${topic.isOverdue ? "text-red-600" : "text-teal-600"}`}>{topic.nextRevisionLabel}</span>
                                    {topic.isOverdue && <span className="ml-1.5 text-[9px] font-bold text-red-600 bg-red-100 px-1 py-0.5 rounded">OVERDUE</span>}
                                  </td>
                                  <td className="px-4 py-3"><span className="text-xs font-semibold bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{topic.intervalDays}d</span></td>
                                  <td className="px-4 py-3 text-right"><span className={`text-sm font-bold ${accColor}`}>{topic.accuracy}%</span></td>
                                  <td className="px-4 py-3 text-right">
                                    <div className="flex items-center justify-end gap-1">
                                      <button onClick={() => navigate(`/student/ai-study/${topic.topicId}`)}
                                        className="px-2.5 py-1 bg-teal-600 text-white rounded-lg text-xs font-semibold hover:bg-teal-700 flex items-center gap-1">
                                        <RefreshCw className="w-2.5 h-2.5" /> Revise
                                      </button>
                                      <button onClick={() => { setRevisionPage("schedule"); toggleNote(topic.topicId); }}
                                        className="px-2.5 py-1 bg-violet-100 text-violet-700 rounded-lg text-xs font-semibold hover:bg-violet-200 flex items-center gap-1">
                                        <FileText className="w-2.5 h-2.5" /> Notes
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {revisionPage === "aiplan" && (
                    <div className="space-y-3">
                      <div className="bg-gradient-to-r from-indigo-50 to-violet-50 border border-indigo-100 rounded-2xl p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Sparkles className="w-4 h-4 text-indigo-600" />
                          <span className="text-sm font-bold text-indigo-700">7-Day AI Revision Plan</span>
                        </div>
                        <p className="text-xs text-indigo-600 leading-relaxed">
                          Topics assigned based on next due date and accuracy. Overdue items are prioritised first. Max 4 topics/day to keep revision manageable.
                        </p>
                      </div>
                      {aiRevisionPlan.map((day, di) => {
                        if (day.topics.length === 0) return (
                          <div key={di} className="flex items-center gap-3 px-4 py-2.5 bg-gray-50 rounded-xl border border-gray-200">
                            <span className="text-xs font-semibold text-gray-400 w-24 shrink-0">{day.label}</span>
                            <span className="text-xs text-gray-400 italic">No revision due — rest day 🎉</span>
                          </div>
                        );
                        return (
                          <div key={di} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                            <div className={`px-4 py-2.5 flex items-center gap-3 border-b border-gray-100 ${di === 0 ? "bg-indigo-50" : "bg-gray-50"}`}>
                              <Calendar className={`w-4 h-4 ${di === 0 ? "text-indigo-600" : "text-gray-400"}`} />
                              <span className={`text-sm font-bold ${di === 0 ? "text-indigo-700" : "text-gray-700"}`}>{day.label}</span>
                              <span className="ml-auto text-xs text-gray-400">{day.topics.length} topics</span>
                            </div>
                            <div className="divide-y divide-gray-50">
                              {day.topics.map(topic => {
                                const cfg = subjectCfg(topic.subjectName);
                                const accColor = topic.accuracy < 40 ? "text-red-600" : topic.accuracy < 55 ? "text-orange-500" : topic.accuracy < 65 ? "text-amber-600" : "text-teal-600";
                                return (
                                  <div key={topic.topicId} className="px-4 py-3 flex items-center gap-3">
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2 flex-wrap">
                                        <span className="text-sm font-medium text-gray-900 truncate">{topic.topicName}</span>
                                        {topic.isOverdue && <span className="text-[9px] font-bold text-red-600 bg-red-100 px-1 py-0.5 rounded-full border border-red-200">OVERDUE</span>}
                                      </div>
                                      <div className="flex items-center gap-2 mt-0.5">
                                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full border font-medium ${cfg.bg} ${cfg.color} ${cfg.border}`}>{topic.subjectName}</span>
                                        <span className="text-[10px] text-gray-400">Learned {topic.learnedOn}</span>
                                        <span className="text-[10px] font-semibold bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-full">{topic.intervalDays}d cycle</span>
                                      </div>
                                    </div>
                                    <span className={`text-sm font-bold shrink-0 ${accColor}`}>{topic.accuracy}%</span>
                                    <button onClick={() => navigate(`/student/ai-study/${topic.topicId}`)}
                                      className="shrink-0 px-2.5 py-1.5 bg-teal-600 text-white rounded-lg text-xs font-semibold hover:bg-teal-700 flex items-center gap-1">
                                      <RefreshCw className="w-2.5 h-2.5" /> Revise
                                    </button>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* ── Intensive Revision ── */}
              {revisionCategory === "intensive" && (
                <div className="space-y-4">
                  <div className="bg-white rounded-2xl border border-gray-200 p-4">
                    <h3 className="text-base font-bold text-gray-900">Intensive Study Sessions</h3>
                    <p className="text-xs text-gray-500 mt-0.5">Focus on deep concept clarity and AI-guided practice after syllabus completion.</p>
                  </div>
                  {intensiveRevisionItems.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-dashed border-gray-300 p-8 text-center">
                      <Zap className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                      <p className="text-gray-500 font-medium">No intensive revision tasks right now</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {intensiveRevisionItems.map(item => (
                        <PlanItemCard
                          key={item.id}
                          item={item}
                          priority={derivePriority(item, weakTopicIds)}
                          onOpen={() => navigate(`/student/ai-study/${item.content?.topicId}`)}
                          onComplete={(id) => complete.mutate(id)}
                          onSkip={(id) => skip.mutate(id)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* ── Study Notes ── */}
              {revisionCategory === "notes" && (
                <div className="space-y-4">
                  <div className="bg-white rounded-2xl border border-gray-200 p-4">
                    <h3 className="text-base font-bold text-gray-900">Study Notes</h3>
                    <p className="text-xs text-gray-500 mt-0.5">Review notes from your completed AI study sessions.</p>
                  </div>
                  {completedAiNotes.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-dashed border-gray-300 p-8 text-center">
                      <BookOpen className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                      <p className="text-gray-500 font-medium">No study notes available</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {completedAiNotes.map(session => (
                        <div key={session.id} className="bg-white rounded-xl border border-gray-100 p-4 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                              <BrainCircuit className="w-5 h-5" />
                            </div>
                            <div>
                              <p className="text-sm font-bold text-gray-800">{session.topicName}</p>
                              <p className="text-[10px] text-gray-400">{format(new Date(session.createdAt), "MMM d, h:mm a")} · {session.durationMinutes}m session</p>
                            </div>
                          </div>
                          <button
                            onClick={() => navigate(`/student/ai-study/${session.topicId}`)}
                            className="text-xs font-bold text-indigo-600 hover:bg-indigo-50 px-3 py-1.5 rounded-md transition-all"
                          >
                            Review Notes
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* ── Practice Questions ── */}
              {revisionCategory === "practice" && (
                <div className="space-y-4">
                  <div className="bg-white rounded-2xl border border-gray-200 p-4">
                    <h3 className="text-base font-bold text-gray-900">Practice Questions</h3>
                    <p className="text-xs text-gray-500 mt-0.5">Review completed practice questions and quizzes from your study plan.</p>
                  </div>
                  {completedPractice.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-dashed border-gray-300 p-8 text-center">
                      <CheckCheck className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                      <p className="text-gray-500 font-medium">No completed practice items yet</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {completedPractice.map(item => (
                        <PlanItemCard
                          key={item.id}
                          item={item}
                          priority={derivePriority(item, weakTopicIds)}
                          onOpen={() => navigate(`/student/ai-study/${item.content?.topicId}`)}
                          onComplete={(id) => complete.mutate(id)}
                          onSkip={(id) => skip.mutate(id)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}

            </div>

            {/* Right Sidebar */}
            <div className="lg:col-span-3 flex gap-3 items-start sticky top-4 self-start">
              <div className="flex-1 min-w-0 space-y-3">
                <AISarthiCard
                  todayItems={todayItems}
                  streak={student?.streakDays ?? 0}
                  xpPoints={student?.xpPoints ?? 0}
                  progressReport={effectiveProgressReport}
                  weeklyActivity={weeklyActivity}
                  sessions={sessions}
                  weakTopicsCount={weakTopics.length}
                  revisionTopicsCount={revisionTopics.length}
                  forgottenCount={forgottenConcepts.length}
                />
                <div className="bg-teal-50 border border-teal-100 rounded-2xl p-4">
                  <div className="font-semibold text-teal-700 text-sm mb-3 flex items-center gap-1.5">
                    <RefreshCw className="w-4 h-4" /> Spaced Repetition
                  </div>
                  <div className="space-y-2 text-xs">
                    {([
                      ["1-Day",  "< 40%",   "bg-red-100 text-red-700"],
                      ["3-Day",  "40\u201354%",  "bg-orange-100 text-orange-700"],
                      ["7-Day",  "55\u201364%",  "bg-amber-100 text-amber-700"],
                      ["21-Day", "65\u201374%",  "bg-teal-100 text-teal-700"],
                    ] as const).map(([interval, range, cls]) => (
                      <div key={interval} className="flex items-center gap-2">
                        <span className={`font-bold px-2 py-0.5 rounded-full shrink-0 ${cls}`}>{interval}</span>
                        <span className="text-gray-500">accuracy {range}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 pt-3 border-t border-teal-100 text-xs text-teal-600 leading-relaxed">
                    Accuracy improves \u2192 interval extends \u2192 topic eventually clears the queue.
                  </div>
                </div>
              </div>
              <div className="flex-1 min-w-0 space-y-3">
                <MicroGoalsCard
                  weakTopics={weakTopics}
                  revisionTopics={revisionTopics}
                  pendingPYQTopics={pendingPYQTopics}
                  highNegativeTopics={highNegativeTopics}
                />
                <SmartRemindersCard
                  revisionTopics={revisionTopics}
                  weeklyActivity={weeklyActivity}
                  pendingMockTests={pendingMockTests}
                  forgottenConcepts={forgottenConcepts}
                  weakTopics={weakTopics}
                  pendingPYQTopics={pendingPYQTopics}
                  onTabChange={setActiveTab}
                />
              </div>
            </div>
          </div>
        )}
