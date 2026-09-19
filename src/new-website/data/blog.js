// blog.js — shared post data for BlogGrid (/blog) and BlogPost (/blog/:slug).
//
// Placeholder copy, same status as the rest of the new-website mockup data
// files — real posts (and a cover photo per post, once we have assets) swap
// in before launch without touching any component.
//
// `slug` is the URL segment for /blog/:slug — treat these as fixed once a
// post is published anywhere.

import {
  BrainCircuit, GraduationCap, Landmark, MonitorPlay, Trophy, Users,
} from "lucide-react";

export const blogCategories = [
  "All",
  "AI in Education",
  "Exam Prep",
  "School Management",
  "Product Updates",
];

export const blogPosts = [
  {
    id: "nw-blog-ai-personalised-learning",
    slug: "how-ai-personalises-learning",
    title: "How AI Is Personalising Learning for Every Student",
    category: "AI in Education",
    excerpt:
      "A single classroom pace never fits every learner. Here's how adaptive AI study plans close the gap between fast and struggling students without extra teacher workload.",
    author: "EDDVA Team",
    date: "2026-08-18",
    readTime: 6,
    Icon: BrainCircuit,
    color: "#7c3aed",
    bg: "#faf8ff",
    sections: [
      {
        heading: "The one-pace problem",
        body: "Every classroom has a spread — some students are ready for the next chapter while others are still shaky on the last one. A fixed syllabus pace serves the middle of that spread well and leaves the two ends behind, and no teacher has the hours to hand-build a different plan for every student.",
      },
      {
        heading: "What adaptive study plans do differently",
        body: "An AI study plan reads a student's quiz results and topic-level accuracy, then resequences what they see next — more practice on weak topics, less repetition on topics already mastered. The plan updates itself after every test instead of staying fixed for a term.",
      },
      {
        heading: "Where the teacher still matters",
        body: "The AI surfaces what to focus on; it does not replace the explanation. Teachers get a weak-topic heatmap across the whole class, so the fifteen minutes they spend re-teaching a concept go to the topic that is actually holding students back, not a guess.",
      },
    ],
  },
  {
    id: "nw-blog-jee-neet-mock-strategy",
    slug: "jee-neet-mock-test-strategy",
    title: "Mock Tests Alone Won't Raise Your Rank — Here's What Will",
    category: "Exam Prep",
    excerpt:
      "Taking more mock tests without reviewing them is the most common mistake JEE and NEET aspirants make. A better loop: test, analyse, drill, retest.",
    author: "EDDVA Team",
    date: "2026-08-05",
    readTime: 5,
    Icon: GraduationCap,
    color: "#0f766e",
    bg: "#f2fafa",
    sections: [
      {
        heading: "Volume isn't the bottleneck",
        body: "Students who plateau are rarely short on mock tests — most have taken dozens. What's usually missing is a structured pass over each result: which topics cost the most marks, and whether the loss was a concept gap or a silly error under time pressure.",
      },
      {
        heading: "The test → analyse → drill loop",
        body: "After every mock, sort wrong answers into two piles: 'didn't know it' and 'knew it, got it wrong anyway'. The first pile needs topic-wise revision; the second needs timed drilling on that exact question type, not a full re-read of the chapter.",
      },
      {
        heading: "Automating the analysis",
        body: "This is the part that eats the most time by hand. EDDVA JEE NEET AI runs this breakdown automatically after every test — weak-topic detection, error-type tagging, and a focused practice set generated from the results, so the analysis step takes minutes instead of an evening.",
      },
    ],
  },
  {
    id: "nw-blog-erp-digitise-admin",
    slug: "digitise-school-admin-without-disruption",
    title: "Digitising School Admin Without Disrupting a Running Term",
    category: "School Management",
    excerpt:
      "Switching systems mid-year feels risky. A phased rollout — attendance and fees first, everything else after — gets a school off spreadsheets with zero downtime.",
    author: "EDDVA Team",
    date: "2026-07-22",
    readTime: 7,
    Icon: Landmark,
    color: "#16a34a",
    bg: "#f5fbf7",
    sections: [
      {
        heading: "Why 'wait for next year' isn't necessary",
        body: "The instinct is to hold off on a new system until the next academic year starts clean. In practice, the modules that cause the most daily pain — attendance marking, fee collection, parent notices — can move over in a week without touching exams or report cards mid-term.",
      },
      {
        heading: "A rollout order that works",
        body: "Start with attendance and fees, the two processes staff already do daily and can compare directly against the old paper or spreadsheet version. Once those are trusted, move timetable and communications. Exams, report cards and academic calendar migrate at the natural term boundary, not before.",
      },
      {
        heading: "What this buys the admin team",
        body: "No duplicate data entry during the transition, no term where two systems run in parallel, and staff learn the new system on the parts they already touch every day instead of everything at once.",
      },
    ],
  },
  {
    id: "nw-blog-teacher-productivity",
    slug: "give-teachers-their-time-back",
    title: "Grading Takes Hours. Here's What Automating It Actually Buys a Teacher.",
    category: "AI in Education",
    excerpt:
      "Automated grading on objective questions doesn't just save time — it changes what a teacher's evening looks like, and what they can do with the hours it frees up.",
    author: "EDDVA Team",
    date: "2026-07-10",
    readTime: 5,
    Icon: MonitorPlay,
    color: "#2563eb",
    bg: "#f5f9ff",
    sections: [
      {
        heading: "Where the hours actually go",
        body: "For MCQs, fill-in-the-blank and numeric-answer questions, grading is mechanical — correct or not — yet it still eats a teacher's evening one paper at a time. That time has no direct benefit to a student; it's pure overhead.",
      },
      {
        heading: "What's left for a teacher to do by hand",
        body: "Automating objective grading doesn't touch subjective answers — long-form responses, project work, essays still need a teacher's judgement. What changes is the ratio: instead of an evening split across a hundred papers of mixed difficulty, the teacher's time goes only to the answers that need a human read.",
      },
      {
        heading: "The knock-on effect",
        body: "Schools that automate objective grading report faster turnaround on assessments — students see results the same day, not a week later — and teachers redirect the reclaimed hours to one-on-one doubt sessions instead of paperwork.",
      },
    ],
  },
  {
    id: "nw-blog-gamification-engagement",
    slug: "does-gamification-actually-help-students-learn",
    title: "Does Gamification Actually Help Students Learn, or Just Feel Good?",
    category: "AI in Education",
    excerpt:
      "Leaderboards and streaks are easy to add and easy to dismiss as a gimmick. The evidence is more specific than either extreme: it depends what you're measuring.",
    author: "EDDVA Team",
    date: "2026-06-28",
    readTime: 6,
    Icon: Trophy,
    color: "#ea580c",
    bg: "#fff8f2",
    sections: [
      {
        heading: "The honest case for it",
        body: "Gamification's proven effect is on engagement, not comprehension directly — students who see a streak or a leaderboard position log in more often and attempt more practice questions than a control group without one. More attempts, given a working feedback loop, does translate into more practice-driven mastery.",
      },
      {
        heading: "Where it backfires",
        body: "A leaderboard that only ever shows the same five names at the top demotivates everyone else. Done well, ranking is scoped — by class, by weekly effort, by topic — so a student is compared against a peer group they can realistically move within, not the whole school.",
      },
      {
        heading: "What to actually track",
        body: "The metric that matters isn't badges collected — it's whether practice attempts and session frequency go up after gamification is switched on, and whether that holds a month later, not just in the first excited week.",
      },
    ],
  },
  {
    id: "nw-blog-parent-engagement",
    slug: "closing-the-parent-visibility-gap",
    title: "Closing the Parent Visibility Gap — Without Another App to Check",
    category: "School Management",
    excerpt:
      "Parents want to know how their child is doing without logging into a portal nobody remembers the password to. The fix is pushing the right update, not building a bigger dashboard.",
    author: "EDDVA Team",
    date: "2026-06-12",
    readTime: 4,
    Icon: Users,
    color: "#dc2626",
    bg: "#fff5f5",
    sections: [
      {
        heading: "The portal nobody opens",
        body: "Most schools already have some parent portal, and most parents open it only when something goes wrong — a fee reminder, a low grade notice. The everyday, reassuring updates (attendance was fine today, homework was submitted) never get seen because nobody thinks to go check.",
      },
      {
        heading: "Push, don't wait to be pulled",
        body: "The fix that actually changes behaviour is sending short updates to where parents already are — SMS or WhatsApp — instead of expecting a portal visit. Attendance, a missed assignment, an upcoming fee due date: each as its own short nudge, not buried in a weekly digest.",
      },
      {
        heading: "Keeping the noise down",
        body: "The failure mode on the other side is over-notifying until parents mute everything. The updates that earn attention are the ones tied to an action a parent might actually take — not a running commentary on every quiz score.",
      },
    ],
  },
];

export const findPost = slug => blogPosts.find(p => p.slug === slug);
