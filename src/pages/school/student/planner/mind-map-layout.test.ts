import { describe, expect, it } from "vitest";
import type { ChapterNode, SubjectNode, SubtopicNode, TopicNode } from "@/lib/api/learning-path";
import { combineProgress, findChapter, findTopic, homeHeadings, subtopicProgress, threadProgress, layoutChapterMap, layoutHomeMap, layoutTopicMap, roadmapHref, type MapLayout } from "./mind-map-layout";

const topic = (id: string, status: TopicNode["status"], over: Partial<TopicNode> = {}): TopicNode => ({
  topicId: id,
  name: `Topic ${id}`,
  order: null,
  status,
  mastery: 40,
  estMinutes: 30,
  roadmapState: "ready",
  thread: null,
  subtopics: [
    { name: `${id} part A`, order: 1, status: "weak", accuracy: 25, answered: 4 },
    { name: `${id} part B`, order: 2, status: "not_assessed", accuracy: null, answered: 0 },
  ],
  children: [],
  ...over,
});

const weakChapter: ChapterNode = {
  chapterId: "c1",
  name: "Quadratics",
  status: "weak",
  mastery: 35,
  estMinutes: 90,
  expanded: true,
  roadmapState: "ready",
  topics: [topic("t1", "weak", { order: 1 }), topic("t2", "mastered", { order: 2 })],
};
const preparingChapter: ChapterNode = { chapterId: "c2", name: "Triangles", status: "weak", mastery: 20, estMinutes: 60, expanded: true, roadmapState: "pending", topics: [] };
// A chapter that is fine overall, with one weak topic (shown on its own).
const fineChapter: ChapterNode = {
  chapterId: "c3", name: "Statistics", status: "ok", mastery: 72, estMinutes: 20, expanded: false, roadmapState: null,
  topics: [topic("t3", "weak", { thread: { id: "th3", status: "active", round: 2 } })],
};

const subjects: SubjectNode[] = [
  { subjectId: "s1", name: "Maths", weakChapters: 2, atRiskChapters: 0, hiddenChapters: 3, chapters: [weakChapter, preparingChapter, fineChapter] },
  { subjectId: "s2", name: "Hindi", weakChapters: 0, atRiskChapters: 0, hiddenChapters: 9, chapters: [] },
  { subjectId: "s3", name: "Science", weakChapters: 1, atRiskChapters: 0, hiddenChapters: 4, chapters: [{ ...weakChapter, chapterId: "c4", name: "Light", topics: [] }] },
];

const index = (l: MapLayout) => Object.fromEntries(l.nodes.map((n) => [n.id, n]));

describe("layoutHomeMap", () => {
  // Nothing expanded: like a mind map that opens only the root and the next
  // node, every subject's own weak chapters and topics stay hidden until clicked.
  const collapsed = layoutHomeMap(subjects);
  const collapsedById = index(collapsed);
  // Both shown subjects expanded, for the tests that need their headings.
  const home = layoutHomeMap(subjects, new Set(["s1", "s3"]));
  const byId = index(home);

  it("starts with only 'You' and its subjects — every subject collapsed, expandable, and marked which id to expand", () => {
    expect(collapsed.nodes.map((n) => n.kind).sort()).toEqual(["root", "subject", "subject"]);
    expect(collapsedById["subject-s2"]).toBeUndefined(); // Hindi has nothing weak, never shown
    expect(collapsedById["subject-s1"]).toMatchObject({ expandable: true, expanded: false, toggleKey: "s1" });
    expect(collapsedById["subject-s3"]).toMatchObject({ expandable: true, expanded: false, toggleKey: "s3" });
  });

  it("expanding a subject shows its weak chapters and weak topics: no topics of a weak chapter, no subtopics", () => {
    expect(home.nodes.map((n) => n.kind).sort()).toEqual(["chapter", "chapter", "chapter", "root", "subject", "subject", "topic"]);
    expect(byId["topic-t1"]).toBeUndefined(); // t1 belongs to the weak (expanded) chapter c1, not shown on its own
    expect(home.nodes.some((n) => n.kind === "subtopic")).toBe(false);
    expect(byId["subject-s1"]).toMatchObject({ expanded: true });
  });

  it("fans subjects out in one row under 'You', and an expanded subject's headings out in a row under it", () => {
    const subjectRow = new Set(["subject-s1", "subject-s3"].map((id) => byId[id].y));
    expect(subjectRow.size).toBe(1);
    expect(byId.root.y).toBeLessThan([...subjectRow][0]);
    const centre = (id: string) => byId[id].x + byId[id].width / 2;
    expect(centre("root")).toBeCloseTo((centre("subject-s1") + centre("subject-s3")) / 2, 5);

    // s1's three headings run left to right under it, on the same row as s3's —
    // every level is a row, same as the subjects' own row above it.
    const headingRow = new Set(["chapter-c1", "chapter-c2", "topic-t3", "chapter-c4"].map((id) => byId[id].y));
    expect(headingRow.size).toBe(1);
    expect([...subjectRow][0]).toBeLessThan([...headingRow][0]);
    const [c1, c2, t3] = [byId["chapter-c1"], byId["chapter-c2"], byId["topic-t3"]];
    expect(c1.x + c1.width).toBeLessThanOrEqual(c2.x);
    expect(c2.x + c2.width).toBeLessThanOrEqual(t3.x);
    expect(centre("subject-s1")).toBeCloseTo((centre("chapter-c1") + centre("topic-t3")) / 2, 5);
    expect(centre("subject-s3")).toBeCloseTo(centre("chapter-c4"), 5);
  });

  it("joins 'You' to each subject, and an expanded subject to its headings, from the bottom to the top", () => {
    expect(home.edges).toContainEqual(expect.objectContaining({ source: "root", target: "subject-s1", sourceHandle: "bottom", targetHandle: "top" }));
    expect(home.edges).toContainEqual(expect.objectContaining({ source: "subject-s1", target: "chapter-c1", sourceHandle: "bottom", targetHandle: "top" }));
    expect(home.edges.every((e) => e.sourceHandle === "bottom" && e.targetHandle === "top")).toBe(true);
  });

  it("opens a chapter's roadmap or a topic's roadmap", () => {
    expect(byId["chapter-c1"].action).toEqual({ type: "open-chapter-map", chapterId: "c1" });
    expect(byId["topic-t3"].action).toEqual({ type: "open-topic-map", topicId: "t3" });
    expect(byId["topic-t3"]).toMatchObject({ detail: "Statistics · 40%", hasThread: true, threadStatus: "active" });
  });

  it("marks a chapter whose roadmap is being made", () => {
    expect(byId["chapter-c2"]).toMatchObject({ pending: true, detail: "Chapter · 20% · Preparing roadmap" });
    expect(byId["chapter-c1"]).toMatchObject({ pending: false, detail: "Chapter · 35% · 2 topics" });
  });

  it("returns nothing when nothing is weak", () => {
    expect(layoutHomeMap([subjects[1]])).toEqual({ nodes: [], edges: [] });
  });

  it("lists headings in the subject's order", () => {
    expect(homeHeadings(subjects[0]).map((h) => (h.kind === "chapter" ? h.chapter.chapterId : h.topic!.topicId))).toEqual(["c1", "c2", "t3"]);
  });
});

describe("layoutChapterMap", () => {
  // Both of weakChapter's topics opened, for the tests that need its subtopics.
  const bothTopicsExpanded = new Set(["t1", "t2"]);

  it("starts with only the chapter and its topics — every topic collapsed and expandable", () => {
    const byId = index(layoutChapterMap(weakChapter));
    expect(byId["sub-t1-1"]).toBeUndefined();
    expect(byId["sub-t2-2"]).toBeUndefined();
    expect(byId["topic-t1"]).toMatchObject({ expandable: true, expanded: false, toggleKey: "t1" });
    expect(byId["topic-t2"]).toMatchObject({ expandable: true, expanded: false, toggleKey: "t2" });
  });

  it("opening a topic shows every topic of the chapter in order with its subtopics", () => {
    const byId = index(layoutChapterMap(weakChapter, bothTopicsExpanded));
    expect(byId["chapter-c1"].action).toEqual({ type: "none" });
    expect(byId["topic-t1"].label).toBe("1. Topic t1");
    expect(byId["topic-t2"].label).toBe("2. Topic t2");
    expect(byId["sub-t1-1"]).toMatchObject({ kind: "subtopic", label: "t1 part A", detail: "25% of 4" });
    expect(byId["sub-t2-2"]).toBeDefined(); // a mastered topic's subtopics show too
  });

  it("runs top to bottom for the chapter and its row of topics, then each topic's subtopics in a row under it", () => {
    const byId = index(layoutChapterMap(weakChapter, bothTopicsExpanded));
    const [c, t1, t2] = [byId["chapter-c1"], byId["topic-t1"], byId["topic-t2"]];
    const [s1, s2] = [byId["sub-t1-1"], byId["sub-t1-2"]];
    // levels 1-2: top to bottom, topics side by side in order, the chapter centred over them
    expect(c.y).toBeLessThan(t1.y);
    expect(t1.y).toBe(t2.y);
    expect(t1.x + t1.width).toBeLessThanOrEqual(t2.x);
    const centre = (n: { x: number; width: number }) => n.x + n.width / 2;
    expect(centre(c)).toBeCloseTo((centre(t1) + centre(t2)) / 2, 5);
    // level 3: t1's subtopics run left to right under it, on their own row
    expect(s1.y).toBeGreaterThan(t1.y);
    expect(s1.y).toBe(s2.y);
    expect(s1.x + s1.width).toBeLessThanOrEqual(s2.x);
    expect(centre(t1)).toBeCloseTo((centre(s1) + centre(s2)) / 2, 5);
    // t1's subtopic row never reaches t2's own column
    expect(s2.x + s2.width).toBeLessThanOrEqual(t2.x);
  });

  it("joins the topics from the chapter's bottom to their tops, and each subtopic the same way", () => {
    const { edges } = layoutChapterMap(weakChapter, bothTopicsExpanded);
    expect(edges).toContainEqual(expect.objectContaining({ source: "chapter-c1", target: "topic-t1", sourceHandle: "bottom", targetHandle: "top" }));
    expect(edges).toContainEqual(expect.objectContaining({ source: "topic-t1", target: "sub-t1-1", sourceHandle: "bottom", targetHandle: "top" }));
  });

  it("never overlaps two nodes", () => {
    const { nodes } = layoutChapterMap(weakChapter, bothTopicsExpanded);
    for (const a of nodes)
      for (const b of nodes) {
        if (a === b) continue;
        const apart = a.x + a.width <= b.x || b.x + b.width <= a.x || Math.abs(a.y - b.y) >= 64;
        expect(apart).toBe(true);
      }
  });

  it("closing an opened topic again returns the exact starting layout", () => {
    const initial = layoutChapterMap(weakChapter);
    const openedThenClosed = layoutChapterMap(weakChapter, new Set()); // t1 opened and closed, same end state
    expect(openedThenClosed).toEqual(initial);
    const opened = index(layoutChapterMap(weakChapter, new Set(["t1"])));
    expect(opened["sub-t1-1"]).toBeDefined();
    expect(opened["topic-t1"]).toMatchObject({ expandable: true, expanded: true });
    expect(opened["sub-t2-1"]).toBeUndefined(); // t2 stays collapsed on its own
  });

  it("makes a subtopic open the topic's learning path focused on it, not the topic itself (the subtopic is what's being learned)", () => {
    const byId = index(layoutChapterMap(weakChapter, bothTopicsExpanded));
    expect(byId["topic-t1"].action).toEqual({ type: "none" }); // toggles its subtopics instead
    expect(byId["sub-t1-2"].action).toEqual({ type: "open-topic", topicId: "t1", focusSubtopic: "t1 part B" });
  });

  it("still opens a topic's own chat directly when it has no subtopics to expand into", () => {
    const noSubtopics: ChapterNode = { ...weakChapter, topics: [{ ...weakChapter.topics[0], subtopics: [] }] };
    const byId = index(layoutChapterMap(noSubtopics));
    expect(byId["topic-t1"]).toMatchObject({ expandable: false, action: { type: "open-topic", topicId: "t1" } });
  });

  it("shows a chapter whose roadmap is being made as preparing", () => {
    const l = layoutChapterMap(preparingChapter);
    expect(index(l)["prep-c2"]).toMatchObject({ kind: "preparing", label: "Preparing your roadmap…" });
    expect(l.edges.some((e) => e.source === "chapter-c2" && e.target === "prep-c2")).toBe(true);
  });

});

describe("layoutTopicMap", () => {
  it("shows the topic and its subtopics, and opens the topic's learning path", () => {
    const byId = index(layoutTopicMap(fineChapter.topics[0]));
    expect(byId["topic-t3"]).toMatchObject({ label: "Topic t3", action: { type: "open-topic", topicId: "t3" }, y: 0 });
    const [a, b] = [byId["sub-t3-1"], byId["sub-t3-2"]];
    expect(a.y).toBeGreaterThan(0);
    expect(a.y).toBe(b.y); // subtopics side by side in one row under the topic
    expect(b.x).toBeGreaterThanOrEqual(a.x + a.width);
    expect(byId["sub-t3-1"].action).toEqual({ type: "open-topic", topicId: "t3", focusSubtopic: "t3 part A" });
  });

  it("does not let a topic still waiting for its subtopics be opened", () => {
    const byId = index(layoutTopicMap(topic("t9", "weak", { roadmapState: "pending", subtopics: [] })));
    expect(byId["topic-t9"].action).toEqual({ type: "none" });
    expect(byId["prep-t9"].label).toBe("Preparing subtopics…");
  });
});

describe("finding a roadmap", () => {
  it("finds chapters and topics in the home data", () => {
    expect(findChapter(subjects, "c2")?.subject.name).toBe("Maths");
    expect(findTopic(subjects, "t3")?.chapter.chapterId).toBe("c3");
    expect(findTopic(subjects, "nope")).toBeNull();
  });

  it("sends a chat back to its weak chapter's roadmap, else to its topic's roadmap", () => {
    expect(roadmapHref(subjects, "c1", "t1")).toBe("/school/student/planner/chapter/c1");
    expect(roadmapHref(subjects, "c3", "t3")).toBe("/school/student/planner/topic/t3");
    expect(roadmapHref(subjects, "gone", "gone")).toBe("/school/student/planner");
    expect(roadmapHref(undefined, "c1", "t1")).toBe("/school/student/planner");
  });
});

describe("progress colours", () => {
  it("makes a topic blue once it is opened and green once completed", () => {
    expect(threadProgress(null)).toBe("not_started");
    expect(threadProgress({ status: "suggested" })).toBe("not_started"); // suggested, not opened yet
    expect(threadProgress({ status: "active" })).toBe("in_progress");
    expect(threadProgress({ status: "needs_teacher" })).toBe("in_progress");
    expect(threadProgress({ status: "completed" })).toBe("completed");
  });

  it("gives each subtopic its own progress from the student's answers on it", () => {
    const sub = (status: SubtopicNode["status"], answered: number): SubtopicNode => ({ name: "x", order: 1, status, accuracy: null, answered });
    expect(subtopicProgress(sub("not_assessed", 0))).toBe("not_started");
    expect(subtopicProgress(sub("weak", 4))).toBe("in_progress");
    expect(subtopicProgress(sub("insufficient_data", 1))).toBe("in_progress");
    expect(subtopicProgress(sub("ok", 6))).toBe("completed");
    expect(subtopicProgress(sub("mastered", 6))).toBe("completed");
    expect(subtopicProgress({ ...sub("not_assessed", 0), opened: true })).toBe("in_progress"); // opened from the mind map
  });

  it("marks a group completed only when all of it is, and in progress once any part has started", () => {
    expect(combineProgress([])).toBe("not_started");
    expect(combineProgress(["not_started", "not_started"])).toBe("not_started");
    expect(combineProgress(["completed", "not_started"])).toBe("in_progress");
    expect(combineProgress(["in_progress", "not_started"])).toBe("in_progress");
    expect(combineProgress(["completed", "completed"])).toBe("completed");
  });

  it("turns only the opened topic blue, not its siblings or its unanswered subtopics", () => {
    const opened: ChapterNode = {
      ...weakChapter,
      topics: [
        { ...weakChapter.topics[0], thread: { id: "th1", status: "active", round: 1, stepsDone: 0 } },
        weakChapter.topics[1],
      ],
    };
    const map = index(layoutChapterMap(opened, new Set(["t1", "t2"])));
    expect(map["topic-t1"].progress).toBe("in_progress"); // opened
    expect(map["sub-t1-2"].progress).toBe("not_started"); // not answered yet
    expect(map["sub-t1-1"].progress).toBe("in_progress"); // answered, still weak
    expect(map["topic-t2"].progress).toBe("not_started");
  });

  it("colours the chapter and topic maps by progress, not the home map", () => {
    expect(layoutHomeMap(subjects).nodes.every((n) => n.progress === undefined)).toBe(true);

    const done: ChapterNode = { ...weakChapter, topics: weakChapter.topics.map((t) => ({ ...t, thread: { id: `th-${t.topicId}`, status: "completed" as const, round: 1, stepsDone: 4 } })) };
    const chapter = index(layoutChapterMap(done));
    expect(chapter["chapter-c1"].progress).toBe("completed");
    expect(chapter["topic-t1"].progress).toBe("completed");

    const topicMap = index(layoutTopicMap(fineChapter.topics[0])); // round 2 of its chat
    expect(topicMap["topic-t3"].progress).toBe("in_progress");
  });

  it("marks the top of every map, which keeps its home-map colour", () => {
    expect(index(layoutHomeMap(subjects)).root.isRoot).toBe(true);
    expect(index(layoutChapterMap(weakChapter))["chapter-c1"].isRoot).toBe(true);
    expect(index(layoutTopicMap(fineChapter.topics[0]))["topic-t3"].isRoot).toBe(true);
    expect(index(layoutChapterMap(weakChapter))["topic-t1"].isRoot).toBeUndefined();
    expect(index(layoutChapterMap(weakChapter))["chapter-c1"].status).toBe("weak"); // drawn red, as on the home map
  });
});
