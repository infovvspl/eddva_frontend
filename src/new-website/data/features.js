// Shared AI feature copy.
// Used by AiFeaturesSection (the marquee on the home page), the /features
// index, and the /features/:slug detail pages.
//
// `title` and the artwork are the original signed-off items. Everything added
// for the detail pages — `tagline`, `intro`, `highlights`, `roles` — is NOT
// signed off:
//   • `highlights` name modules that genuinely ship in this repo (see the route
//     tables in src/App.tsx), so they describe the product that exists.
//   • `tagline` and `intro` are written prose. Review before launch.
//
// `slug` is the URL segment — changing one breaks any link already pointing at
// that page, so treat these as fixed once published.
//
// `cat` groups a feature; the index page uses it as a filter.

import fLive        from "../assets/features/01.png";
import fMaterial    from "../assets/features/02.png";
import fRecorded    from "../assets/features/03.png";
import fStudyPlans  from "../assets/features/06.png";
import fVisual      from "../assets/features/07.png";
import fAssistant   from "../assets/features/08.png";
import fAssignment  from "../assets/features/09.png";
import fComms       from "../assets/features/10.png";
import fGamified    from "../assets/features/11.png";

export const featureCategories = [
  { id: "classroom", label: "In the classroom",    accent: "#1a56db", bg: "#eff6ff" },
  { id: "content",   label: "Content & AI",        accent: "#7c3aed", bg: "#f5f3ff" },
  { id: "practice",  label: "Practice & progress", accent: "#0891b2", bg: "#ecfeff" },
];

export const features = [
  {
    id: "nw-aifeat-live",
    slug: "live-interactive-classes",
    title: "Live Interactive Classes",
    tagline: "Teach the whole room, not just the ones on camera",
    img: fLive,
    cat: "classroom",
    roles: ["Students", "Teachers"],
    intro:
      "Run scheduled live sessions from inside the platform, with the register, " +
      "the material and the follow-up work already attached to the class. " +
      "Teachers get a dashboard beside the room; students join from the same " +
      "place they find everything else.",
    highlights: [
      "Scheduled live lectures with chat, polls and hand-raise",
      "A teaching dashboard running alongside the room",
      "Attendance captured from the session itself",
      "Materials and follow-up work attached to the class",
      "Live usage visible to administrators in real time",
    ],
  },
  {
    id: "nw-aifeat-recorded",
    slug: "auto-recorded-lectures",
    title: "Auto-Recorded Lectures",
    tagline: "Nobody loses a class they could not attend",
    img: fRecorded,
    cat: "classroom",
    roles: ["Students", "Teachers"],
    intro:
      "Every live session is captured without anyone pressing record, then " +
      "published back to the batch it belongs to. Students resume where they " +
      "stopped; teachers watch the library build itself as the term goes on.",
    highlights: [
      "Recording starts and ends with the session, automatically",
      "Published straight to the batch that attended",
      "Resume playback from where a student left off",
      "Recordings filed against the topic they cover",
      "A growing library students can revise from before exams",
    ],
  },
  {
    id: "nw-aifeat-material",
    slug: "ai-generated-study-material",
    title: "AI-Generated Study Material",
    tagline: "First drafts of notes and questions, in seconds",
    img: fMaterial,
    cat: "content",
    roles: ["Students", "Teachers"],
    intro:
      "Point the platform at a topic and it drafts the notes, summaries and " +
      "question sets around it. Teachers edit rather than start from a blank " +
      "page, and what they approve goes straight into the course tree.",
    highlights: [
      "Notes and summaries generated per topic",
      "Question sets drafted from the same material",
      "Teacher review before anything reaches students",
      "Output filed into the existing course and topic structure",
      "Institute-wide AI usage visible to administrators",
    ],
  },
  {
    id: "nw-aifeat-assistant",
    slug: "ai-teaching-assistant",
    title: "AI Teaching Assistant",
    tagline: "A tutor that shows the working, not just the answer",
    img: fAssistant,
    cat: "content",
    roles: ["Students", "Teachers"],
    intro:
      "Students ask questions against the topic they are studying and get an " +
      "explanation they can follow, at any hour. What it cannot settle becomes " +
      "a doubt in the teacher's queue, so nothing quietly goes unanswered.",
    highlights: [
      "Topic-scoped questions and worked explanations",
      "Available outside teaching hours",
      "Unresolved questions escalate into the doubt queue",
      "Teachers see what the batch keeps getting stuck on",
      "Usage metered per institute",
    ],
  },
  {
    id: "nw-aifeat-assignment",
    slug: "assignment-generator-and-tracker",
    title: "Assignment Generator & Tracker",
    tagline: "Set it, hand it out, and see who actually did it",
    img: fAssignment,
    cat: "practice",
    roles: ["Students", "Teachers"],
    intro:
      "Generate an assignment from the topic, publish it to a batch, and watch " +
      "submissions arrive against a deadline. Grading — including written " +
      "answers — happens in the same screen as the submissions.",
    highlights: [
      "Assignments generated from the topic being taught",
      "Published to a whole batch in one action",
      "Submission tracking against the due date",
      "Manual grading for written answers",
      "Results feed the student's progress record",
    ],
  },
  {
    id: "nw-aifeat-studyplans",
    slug: "personalized-study-plans",
    title: "Personalized Study Plans",
    tagline: "Two hundred students, two hundred schedules",
    img: fStudyPlans,
    cat: "practice",
    roles: ["Students"],
    intro:
      "A plan built from each student's syllabus, pace and weak topics, rather " +
      "than one timetable handed to the whole batch. It rebuilds as results " +
      "come in, so the plan follows the student instead of the calendar.",
    highlights: [
      "Generated from syllabus, pace and diagnostic results",
      "Reshaped as new assessment results arrive",
      "Weak topics weighted heavier in the schedule",
      "Sits alongside the student's own planner",
      "Visible to teachers reviewing a student",
    ],
  },
  {
    id: "nw-aifeat-visual",
    slug: "ai-visual-learning",
    title: "AI Visual Learning",
    tagline: "For the concepts a paragraph cannot explain",
    img: fVisual,
    cat: "content",
    roles: ["Students", "Teachers"],
    intro:
      "Turns a topic into diagrams and visual explanations students can follow, " +
      "for the parts of a syllabus that resist plain text. Generated against the " +
      "same topic tree as everything else, so it sits with the rest of the material.",
    highlights: [
      "Diagrams and visual explanations generated per topic",
      "Attached to the topic alongside notes and recordings",
      "Useful for the concepts text alone does not carry",
      "Teachers can review before publishing",
      "Available to students inside the study assistant",
    ],
  },
  {
    id: "nw-aifeat-comms",
    slug: "unified-communication-platform",
    title: "Unified Communication Platform",
    tagline: "One thread instead of four apps",
    img: fComms,
    cat: "classroom",
    roles: ["Students", "Teachers", "Parents", "Institute Admin"],
    intro:
      "Announcements, notices and direct messages between students, teachers, " +
      "parents and the office — inside the platform, with a log of what was sent " +
      "to whom. No more chasing a message across a personal chat app.",
    highlights: [
      "Direct messaging between students, teachers and parents",
      "Institute-wide notices and per-batch announcements",
      "Notifications for classes, results and deadlines",
      "Message logs the administration can audit",
      "Complaints and support tickets routed and tracked",
    ],
  },
  {
    id: "nw-aifeat-gamified",
    slug: "gamified-learning",
    title: "Gamified Learning",
    tagline: "Reasons to come back tomorrow",
    img: fGamified,
    cat: "practice",
    roles: ["Students", "Institute Admin"],
    intro:
      "Points, streaks and badges for consistent work, leaderboards across the " +
      "batch, head-to-head question battles, and a game zone for the days a " +
      "student needs a lighter way in. Administrators tune what earns what.",
    highlights: [
      "Points, streaks and badges for consistent work",
      "Batch and institute-wide leaderboards",
      "Battle Arena — head-to-head question battles",
      "Game Zone: Quiz Rush, Treasure Hunt, Math Sprint, Memory Match, Word Master",
      "Reward rules configurable per institute",
    ],
  },
];

/** Look one up by URL segment. Returns undefined for an unknown slug. */
export const findFeature = slug => features.find(f => f.slug === slug);
