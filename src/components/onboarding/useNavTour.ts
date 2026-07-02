import { useState } from "react";
import type { UserRole } from "@/lib/types";
import {
  Home, LayoutDashboard, Calendar, Library, Brain, ClipboardList,
  Trophy, Swords, BarChart, User, GraduationCap, Video, BookOpen,
  MessageSquare, Users, Sparkles, Layout, Bell, Settings,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface PageFeature {
  title: string;
  description: string;
}

export interface NavTourStep {
  navKey: string;
  path: string;           // empty string = no nav click required (header/footer steps)
  title: string;
  label: string;
  description: string;
  icon: LucideIcon;
  pageFeatures: PageFeature[];
}

export type TourPhase = "nav" | "page";

// ─── Shared page-feature lists (teacher + institute_admin use the same pages) ─

const LECTURES_FEATURES: PageFeature[] = [
  {
    title: "Filter & Search",
    description: "Filter lectures by status (Published / Draft / Processing / Live / Scheduled / Ended) and by batch. Search by title to find any lecture instantly.",
  },
  {
    title: "Lecture Cards",
    description: "Each card shows a thumbnail, title, status badge, creation date, student count, and a watch-analytics icon. Per-card actions: Edit, View Analytics, Publish, Delete.",
  },
  {
    title: "Create Lecture — 4-Step Wizard",
    description: "Step 1: title, description, batch, subject, chapter, topic. Step 2: upload a video (YouTube URL or direct upload). Step 3: generate notes with AI (Sparkles) or write manually in the rich-text editor. Step 4: add quizzes or checkpoints at any timestamp.",
  },
  {
    title: "Go Live",
    description: "Start a live session directly from this page — students in the selected batch get an instant notification and can join the stream straight away.",
  },
  {
    title: "Generate Quiz from Lecture",
    description: "After uploading, hit 'Generate Quiz' to automatically create MCQ questions from the lecture content — edit and publish without leaving the page.",
  },
];

const DOUBTS_FEATURES: PageFeature[] = [
  {
    title: "Escalated Queue (Highest Priority)",
    description: "The red-badge 'Escalated Queue' tab shows every doubt the AI couldn't resolve and the student marked unhelpful — these need your response to close.",
  },
  {
    title: "Search, Filter & Sort",
    description: "Search by question text or student name, filter by course/batch, sort newest or oldest, and use status chips (Needs Answer / AI Resolved / Resolved) to organise your review list.",
  },
  {
    title: "Doubt Detail Panel",
    description: "Click any doubt to open the right panel: the student's full question, their image if attached, and the complete AI-drafted response — everything you need in one view.",
  },
  {
    title: "AI Quality Rating",
    description: "For AI-resolved doubts, rate the answer Completely Correct, Partially Correct, or Completely Wrong. Rating wrong unlocks the response editor for your correction.",
  },
  {
    title: "Response Editor",
    description: "Write or edit the response, attach a lecture reference URL, upload a diagram, or tap 'AI Assist' for an instant draft based on the doubt context. Hit Send to deliver it to the student.",
  },
  {
    title: "Resolved Audit Trail",
    description: "Resolved doubts show the teacher's response, any attached lecture link, diagram, and the student's helpfulness rating — a complete history in one panel.",
  },
];

const ANALYTICS_FEATURES: PageFeature[] = [
  {
    title: "Period & Batch Filters",
    description: "Pick Last 24 Hours, This Week, or This Month, then choose a specific batch or All Batches — every chart and table on the page updates to match your selection.",
  },
  {
    title: "Smart Insights (Overview Tab)",
    description: "AI-flagged insight cards highlight at-risk students, low watch-time topics, and doubt spikes — color-coded red/amber/blue by urgency. Click any card to jump to the relevant data.",
  },
  {
    title: "Stat Cards",
    description: "Four cards show Total Students, Avg Quiz Score %, Avg Lecture Watch %, and Open Doubts — with sub-counts like attempts, completions, and resolution rate.",
  },
  {
    title: "Topic Coverage Tab",
    description: "Every taught topic is listed with its gate pass rate, affected student count, avg accuracy, and a 'Needs Revision' flag when pass rate drops below 60%.",
  },
  {
    title: "Pending Topics",
    description: "Topics in your syllabus you haven't taught yet appear in orange — a live coverage checklist so nothing falls through before exams.",
  },
  {
    title: "Doubt Analytics Tab",
    description: "Total doubt volume, open/escalated count, AI resolution rate, avg resolution time in minutes, and a ranked list of the most confusing topics by doubt count.",
  },
];

const CONTENT_FEATURES: PageFeature[] = [
  {
    title: "Course Selector",
    description: "All assigned courses appear as cards with a search input. Click any course to open its Curriculum Workspace.",
  },
  {
    title: "Curriculum Explorer (Left Panel)",
    description: "A collapsible tree: Subjects → Chapters → Topics. Each topic shows coverage % and resource count badges (SM / DPP / PYQ). Click any node to open its workspace.",
  },
  {
    title: "Add Chapters & Topics Inline",
    description: "Click '+ Add Chapter' or '+ Add Topic' inside any subject to create new syllabus nodes directly in the tree — no separate form.",
  },
  {
    title: "Topic Workspace",
    description: "Selecting a topic shows its Readiness %, all uploaded resources (with View / Open / Watch links per file), and a Delete button per resource.",
  },
  {
    title: "AI Content Studio",
    description: "Hit 'AI Content Generator' to open a side panel. Choose type (DPP / PYQ / Study Guide / Key Concepts / Mindmap), set difficulty, preview the AI-generated output, then click 'Approve & Publish to Students'.",
  },
];

// ─── Shared steps for header controls and sidebar footer ──────────────────────

function makeHeaderStep(role: "student" | "teacher_admin"): NavTourStep {
  return {
    navKey: "header-controls",
    path: "",
    title: "Header Controls",
    label: "Top Bar",
    description: "Notifications, quick settings, and account actions — always in the top-right corner.",
    icon: Bell,
    pageFeatures:
      role === "student"
        ? [
            {
              title: "Exam Target Switcher",
              description: "The pill showing your current exam (JEE / NEET / CBSE 10 / CBSE 12) lets you switch targets at any time. Your study plan recommendations and weak-topic analysis update to match the new target.",
            },
            {
              title: "Notifications Bell",
              description: "Tap the bell to open your Notifications page. It has filter tabs — All, Unread, Announcements, Academic, Achievements — and a 'Mark as Read' action per notification. Alerts include new lecture uploads, doubt responses, and test reminders.",
            },
            {
              title: "User Menu",
              description: "Click your avatar in the top-right to open the dropdown. It shows your name and role, a Settings shortcut to your profile page, and a Logout button.",
            },
          ]
        : [
            {
              title: "Notifications Bell",
              description: "Tap the bell to open the Notifications page. Unread items have a blue dot indicator. Lead notifications from prospective students include quick Call and Email action buttons.",
            },
            {
              title: "User Menu",
              description: "Click your avatar to open the dropdown with your name, role, a Settings link (navigates to your profile or institute settings), and a Logout button.",
            },
          ],
  };
}

const FOOTER_STEP: NavTourStep = {
  navKey: "sidebar-footer",
  path: "",
  title: "Profile & Logout",
  label: "Your Account",
  description: "Your name, role, and logout button — always pinned at the bottom of the sidebar.",
  icon: User,
  pageFeatures: [
    {
      title: "Your Profile at a Glance",
      description: "The sidebar footer shows your name and role label so you always know which account is active — useful in shared-device environments.",
    },
    {
      title: "Logout",
      description: "The arrow-out icon next to your name signs you out securely and redirects to the login page. Your data and progress are saved automatically — nothing is lost on logout.",
    },
  ],
};

// ─── STUDENT STEPS ────────────────────────────────────────────────────────────

const STUDENT_STEPS: NavTourStep[] = [
  {
    navKey: "student",
    path: "/student",
    title: "Dashboard",
    label: "Dashboard",
    description: "Your personal study hub — streak, XP, courses to continue, and AI-powered recommendations.",
    icon: LayoutDashboard,
    pageFeatures: [
      {
        title: "Hero Banner",
        description: "Shows your exam target badge, overall course progress %, and three action shortcuts: Continue Learning, Take a Test, and Detailed Progress.",
      },
      {
        title: "Streak, XP & ELO",
        description: "Three stat pills show your current day streak, total XP earned, and ELO tier — the core indicators of study consistency and competitive performance.",
      },
      {
        title: "Stats Grid",
        description: "Five compact cards: total courses enrolled, pending lectures to watch, tests attempted, overall accuracy %, and current streak — all at one glance.",
      },
      {
        title: "Continue Learning",
        description: "Enrolled courses appear with progress bars and last-accessed dates. Click any card to resume exactly where you left off.",
      },
      {
        title: "Quick Actions & Tests",
        description: "Dashboard shortcuts take you to the Tests page (/student/tests), which lists all available quizzes and mock tests filtered by Competitive or Academic with Attempt and Review buttons.",
      },
      {
        title: "Leaderboard Preview & Recommendations",
        description: "The sidebar shows your top-3 batch group and current rank. Below it, AI-identified weak topics surface as personalised revision suggestions based on your recent quiz results.",
      },
    ],
  },
  {
    navKey: "calendar",
    path: "/student/calendar",
    title: "Calendar",
    label: "Calendar",
    description: "All your scheduled lectures, tests, and academic events in one calendar view.",
    icon: Calendar,
    pageFeatures: [
      {
        title: "Monthly & Weekly Views",
        description: "Toggle between monthly and weekly calendar layouts to see the full schedule of lectures, mock tests, and events across all your batches.",
      },
      {
        title: "Event Details",
        description: "Click any calendar entry to see its full details: batch name, subject, teacher, start time, and description — everything you need to prepare.",
      },
      {
        title: "Read-Only for Students",
        description: "Students can view all scheduled content but cannot create or edit entries. Teachers and admins control the calendar — your view always reflects what they've published.",
      },
    ],
  },
  {
    navKey: "courses",
    path: "/student/courses",
    title: "My Courses",
    label: "My Courses",
    description: "All enrolled courses — resume learning, access notes, tests, PYQs, and DPPs.",
    icon: Library,
    pageFeatures: [
      {
        title: "Ongoing & Completed Tabs",
        description: "Switch between Ongoing and Completed tabs (each with a count badge) and filter by format: All, Live, Hybrid, or Recorded.",
      },
      {
        title: "Course Cards",
        description: "Each card shows the thumbnail, exam target badge, institute name, date range, and a progress bar with '% complete' and topic/lecture count.",
      },
      {
        title: "5 Quick-Access Buttons",
        description: "Every course card has: Resume (▶ jumps to last position), Notes (📄 study material), Test (🧪 take a quiz), PYQ (🏆 previous year questions), DPP (📋 daily practice problems).",
      },
      {
        title: "Course Detail Page",
        description: "Click a course card title to open the Course Detail page with four tabs: Curriculum (Subject → Chapter → Topic tree), DPP, PYQ, and Material (downloadable resources).",
      },
      {
        title: "Curriculum Tab — Topic Player",
        description: "Inside Curriculum, click any unlocked topic to open the video lecture player. It has speed control, watch-progress bar, checkpoint markers, embedded quizzes, and a notes download button.",
      },
      {
        title: "AI Study Session",
        description: "From any topic in the Curriculum tab, launch an AI Study Session. AI generates structured notes, worked examples, and practice problems for that specific topic — bookmark or download the output.",
      },
    ],
  },
  {
    navKey: "learn",
    path: "/student/learn",
    title: "Browse Courses",
    label: "Courses",
    description: "Discover all courses on the platform — filter by exam, enroll, or continue learning.",
    icon: Brain,
    pageFeatures: [
      {
        title: "Search & Exam Filter",
        description: "Search by course name and filter by JEE, NEET, CBSE 10, or CBSE 12 using color-coded filter buttons. Results update instantly as you type.",
      },
      {
        title: "Enrollment Status Badge",
        description: "The top-right of each card shows your status: a green 'Enrolled' check, a price (₹) for paid courses, or 'FREE' for open courses.",
      },
      {
        title: "Enroll or Continue",
        description: "'Continue Learning' on enrolled courses resumes your progress. 'View Course' opens free courses. 'View · ₹AMOUNT' shows full details before payment for paid ones.",
      },
      {
        title: "Course Details",
        description: "Each card shows teacher name (with verified shield), description with See more/less toggle, start/end dates, and the number of students already enrolled.",
      },
    ],
  },
  {
    navKey: "study-plan",
    path: "/student/study-plan",
    title: "Study Plan",
    label: "Study Plan",
    description: "Your AI-generated daily study roadmap — prioritised tasks based on your exam, class, and weak areas.",
    icon: ClipboardList,
    pageFeatures: [
      {
        title: "One-Time Setup Wizard",
        description: "First visit triggers a wizard: pick exam target (JEE Mains / JEE Advanced / NEET / Foundation), class level (9–12 / Dropper), exam year, and daily study hours. AI builds your personalised plan instantly.",
      },
      {
        title: "Prioritised Daily Tasks",
        description: "Tasks are automatically ranked HIGH, MED, or LOW based on topic type and your identified weak areas. Types include lecture, practice, quiz, mock_test, and revision.",
      },
      {
        title: "Subject Colour Coding",
        description: "Physics = indigo, Chemistry = emerald, Math = violet, Biology = teal — consistent across all plan views so you can spot the balance at a glance.",
      },
      {
        title: "Complete or Skip Tasks",
        description: "Tap 'Complete Task' to mark it done (updates adherence stats) or 'Skip Task' to defer it. Skipped tasks roll over and affect your consistency score in My Progress.",
      },
      {
        title: "Regenerate or Clear",
        description: "Hit Regenerate Plan (↻) anytime to rebuild around your latest weak areas. Clear Plan (🗑) resets everything so you can start fresh with a new wizard.",
      },
    ],
  },
  {
    navKey: "doubts",
    path: "/student/doubts",
    title: "AI Doubt Solver",
    label: "Doubts",
    description: "Ask any question, get instant AI answers, escalate to your teacher if needed.",
    icon: MessageSquare,
    pageFeatures: [
      {
        title: "Doubt Stats",
        description: "Three cards at the top: Total doubts asked, Pending (orange — awaiting AI or teacher), and Resolved (green) — a live pulse on your learning gaps.",
      },
      {
        title: "Ask a Doubt",
        description: "Tap 'Ask a Doubt' to open the form. Select course and subject, type your question or upload a photo of the problem, then choose Brief or Detailed AI explanation mode. Submit as 'Ask AI' or 'Ask Teacher' directly.",
      },
      {
        title: "Status Tabs",
        description: "Filter by All / Waiting / Queued / AI Resolved / Resolved to quickly see what needs your attention. Sort newest or oldest within each tab.",
      },
      {
        title: "Expandable Answer Cards",
        description: "Click any doubt card to expand it. The full AI solution appears with a Brief/Detailed toggle, a final-answer box for numerical questions, key concept highlights, and concept link tags.",
      },
      {
        title: "Rate & Escalate",
        description: "Tap thumbs up if the AI answer helped. Tap thumbs down and it's automatically escalated to your teacher, who sees it in their priority Escalated Queue.",
      },
      {
        title: "Teacher's Response",
        description: "When your teacher resolves an escalated doubt, their reply appears in a green section with any attached lecture reference URL and diagram — plus a resolved timestamp.",
      },
    ],
  },
  {
    navKey: "leaderboard",
    path: "/student/leaderboard",
    title: "Leaderboard",
    label: "Leaderboard",
    description: "Batch rankings, XP cycles, promotion zones — your competitive standing.",
    icon: Trophy,
    pageFeatures: [
      {
        title: "Zone & Promotion Badge",
        description: "Your current zone (Promotion / Safe / Demotion) and exact XP needed to move up are shown at the top — a precise target to work toward each week.",
      },
      {
        title: "Cycle Stat Cards",
        description: "Four cards: Cycle XP earned, current group rank, level and progress to next, and days until the 14-day cycle resets.",
      },
      {
        title: "Podium & Full Rank Table",
        description: "Top 3 students get the podium with animated crown/medals. Below, a full rank table shows every batchmate's name, zone badge, and a Duel (⚔) shortcut to challenge them in Battle Arena.",
      },
      {
        title: "Progress Sidebar",
        description: "Shows your Promotion Meter (XP gap to next tier), daily streak flame, zone shield badge, level progress bar, and lifetime XP total.",
      },
      {
        title: "Mock Test Rank Tab",
        description: "Switch tabs to see your national rank, global percentile, total mock XP, and accuracy % across every submitted test — separate from the XP leaderboard.",
      },
    ],
  },
  {
    navKey: "battle",
    path: "/student/battle",
    title: "Battle Arena ⚔️",
    label: "Battle Arena",
    description: "Real-time quiz battles against classmates. Win XP and build your ELO rating.",
    icon: Swords,
    pageFeatures: [
      {
        title: "Home — Modes & Daily Battle",
        description: "The home stage shows available battle modes (currently Challenge Friend: 10 questions, 45 s each), a Daily Battle card with countdown timer, and a live top-10 leaderboard.",
      },
      {
        title: "Topic Pick",
        description: "Choose Subject → Chapter → Topic to set the battle subject. Both players answer from the same topic so the contest is fair.",
      },
      {
        title: "Join with Room Code",
        description: "Your opponent shares a room code — enter it in the 'Join with Code' field to skip matchmaking and jump straight into the battle.",
      },
      {
        title: "Matchmaking",
        description: "After sending a challenge, a spinner shows 'Waiting for opponent…'. A Cancel button lets you back out if no one accepts.",
      },
      {
        title: "Live Battle",
        description: "Questions appear with a countdown timer per question. Both players answer simultaneously. Your score updates in real time as the opponent's status is shown.",
      },
      {
        title: "Results & XP",
        description: "The results screen shows XP earned, any tier change, updated rank, and View Leaderboard / Play Again buttons. Confetti animation fires on a win.",
      },
    ],
  },
  {
    navKey: "progress",
    path: "/student/progress",
    title: "My Progress",
    label: "My Progress",
    description: "Deep-dive performance analytics — readiness, topic mastery, engagement, and weak areas.",
    icon: BarChart,
    pageFeatures: [
      {
        title: "Top Metric Cards",
        description: "Four cards: Readiness Score %, Performance Trend (IMPROVING / STABLE / DECLINING with colour), Consistency %, and Weak Topics count — all filtered by your selected time range.",
      },
      {
        title: "Performance Tab",
        description: "Score History area chart, Mistake Analysis by error type, and Topic Mastery progress bars per subject. Click 'Fix Weak Topics' to open the AI modal.",
      },
      {
        title: "Weak Topic Analysis Modal",
        description: "An AI-powered modal lists each weak topic with accuracy %, error count, and a 'Launch Fix' button that starts a targeted revision session for that topic.",
      },
      {
        title: "Engagement Tab",
        description: "Active Learning bar chart (daily study minutes), Content Preference % breakdown, Lecture Attendance chart, and Avg Watch Percentage — see how you actually study.",
      },
      {
        title: "Study Plan Tab",
        description: "Shows Completed, Skipped, and Pending task counts alongside your current day streak and overdue task count — a direct read on plan adherence.",
      },
      {
        title: "Syllabus Tab",
        description: "The Curriculum Roadmap tree shows topic-by-topic completion across your entire syllabus — spot uncovered topics before exam season starts.",
      },
    ],
  },
  {
    navKey: "profile",
    path: "/student/profile",
    title: "My Profile",
    label: "Profile",
    description: "Your full profile — tier badge, XP, cognitive mastery map, AI insights, and account settings.",
    icon: User,
    pageFeatures: [
      {
        title: "Profile Header",
        description: "Shows your avatar with exam-readiness ring, tier badge (Iron → Champion), exam target, XP total, course count, and a learning DNA tagline generated from your study patterns.",
      },
      {
        title: "Metric Cards",
        description: "Four cards: Learning Streak (days), Daily Target (hours this week), Accuracy Index % (across PYQs), and XP Points with tier rank.",
      },
      {
        title: "Cognitive Mastery Map",
        description: "Subject-level ring charts show mastery % per subject. Expand any subject to see the weak chapters list with direct 'Fix Now' buttons.",
      },
      {
        title: "AI Insight Panel",
        description: "A gradient panel displays a personalised AI-written insight with a typewriter animation, followed by a 'Start Focus Session' button pointing you to your highest-priority revision.",
      },
      {
        title: "Edit Profile",
        description: "Click Edit to update name, email, address, exam target, daily study hours, and target college. Upload a new avatar by clicking the camera icon.",
      },
      {
        title: "Logout",
        description: "The Logout button in the profile header card signs you out immediately and redirects to the login screen.",
      },
    ],
  },
  makeHeaderStep("student"),
  FOOTER_STEP,
];

// ─── TEACHER STEPS ────────────────────────────────────────────────────────────

const TEACHER_STEPS: NavTourStep[] = [
  {
    navKey: "teacher",
    path: "/teacher",
    title: "Dashboard",
    label: "Dashboard",
    description: "Your full teaching overview — doubts, lectures, student activity, smart insights.",
    icon: Home,
    pageFeatures: [
      {
        title: "Stat Cards",
        description: "Five cards: My Batches (active count), Lectures Uploaded, Open Doubts (red when pending, green when clear), Total Students, and Students Online right now.",
      },
      {
        title: "KPI Progress Bars",
        description: "Animated bars for Avg Quiz Score %, Avg Lecture Watch %, and Doubt Resolution % — each with sub-counts (attempts, completions, resolved doubts).",
      },
      {
        title: "Smart Insights",
        description: "AI-flagged cards highlight at-risk students and confusing topics, color-coded red/amber/blue by urgency. Click any card to jump directly to the relevant analytics view.",
      },
      {
        title: "Batch & Doubt Charts",
        description: "A horizontal bar chart shows student distribution across your batches. A donut chart breaks down doubts by status. Both are clickable links to the management pages.",
      },
      {
        title: "Recent Doubts & Batches",
        description: "The 5 most recent student doubts are listed with previews and status badges. All assigned batches follow with student counts. 'View All' links jump to the full pages.",
      },
      {
        title: "Quick Action Buttons",
        description: "Four shortcuts in the sidebar: Upload Lecture, View Doubts, My Batches, Analytics — reach any tool in one tap from the dashboard.",
      },
    ],
  },
  {
    navKey: "content",
    path: "/teacher/content",
    title: "Course Content",
    label: "Content",
    description: "Audit and enrich your curriculum — add topics, upload resources, generate AI content.",
    icon: GraduationCap,
    pageFeatures: CONTENT_FEATURES,
  },
  {
    navKey: "lectures",
    path: "/teacher/lectures",
    title: "Lecture Studio",
    label: "Lectures",
    description: "Upload recorded lectures, go live, and enhance them with notes, quizzes, and checkpoints.",
    icon: Video,
    pageFeatures: LECTURES_FEATURES,
  },
  {
    navKey: "quizzes",
    path: "/teacher/quizzes",
    title: "Quizzes & Tests",
    label: "Quizzes & Tests",
    description: "Build, schedule, and analyse quizzes — three question types, difficulty control, and a question bank.",
    icon: BookOpen,
    pageFeatures: [
      {
        title: "Three Tabs",
        description: "My Quizzes lists all your published, draft, and scheduled quizzes. Question Bank is a searchable library of reusable questions. Analytics shows per-quiz performance data.",
      },
      {
        title: "Quiz List Actions",
        description: "Each quiz shows title, scope (topic / chapter / subject / full mock), question count, difficulty bars, duration, and status. Per-quiz: Edit, View Analytics, Share link, Delete.",
      },
      {
        title: "Create Quiz — Step 1 (Scope & Settings)",
        description: "Set the test scope, batch, subject/chapter/topic, title, duration, total marks, passing marks, and an optional scheduled date and time.",
      },
      {
        title: "Create Quiz — Step 2 (Question Builder)",
        description: "Add MCQ Single, MCQ Multi, or Integer-answer questions. Set difficulty, write options A–D, mark the correct answer, and assign per-question marks. Pull questions from the Question Bank with one click.",
      },
      {
        title: "Create Quiz — Step 3 (Settings & Publish)",
        description: "Toggle shuffle questions, show answers after submit, and allow re-attempt. Then Publish Now or Schedule for a future date and time.",
      },
      {
        title: "Question Bank",
        description: "Filter by difficulty, subject, or chapter. Each question shows a text preview, difficulty badge, and usage count. Edit, view, or delete any question independently of quiz assignments.",
      },
    ],
  },
  {
    navKey: "doubts",
    path: "/teacher/doubts",
    title: "Doubt Queue",
    label: "Doubt Queue",
    description: "Review and respond to all student doubts. AI pre-drafts every response for you.",
    icon: MessageSquare,
    pageFeatures: DOUBTS_FEATURES,
  },
  {
    navKey: "batches",
    path: "/teacher/batches",
    title: "My Batches",
    label: "My Batches",
    description: "Manage your assigned batches — roster, performance stats, and inactive student alerts.",
    icon: Users,
    pageFeatures: [
      {
        title: "Batch List",
        description: "All your assigned batches with name, exam target badge, student count, status (Active / Inactive / Completed), start/end dates, and delivery mode.",
      },
      {
        title: "Roster Tab",
        description: "Every student in the batch with their avatar, name, email, phone, and engagement status badge. Click any student row to open their full detail page.",
      },
      {
        title: "Student Detail Page",
        description: "From the roster, open any student's detail page: performance overview (tests taken, avg accuracy, streak), subject-wise accuracy bar chart, activity timeline, and action buttons — Send Message, Flag Student, Remove from Batch.",
      },
      {
        title: "Performance Tab",
        description: "Batch-wide avg accuracy %, tests attempted, and lecture completion counts — plus a performance trend chart for the batch over time.",
      },
      {
        title: "Inactive Tab",
        description: "Students absent for 3+ days are listed with last login time (orange), streak count, and days-inactive badge. 'Send Bulk Reminder' (🔔) notifies all of them at once.",
      },
    ],
  },
  {
    navKey: "calendar",
    path: "/teacher/calendar",
    title: "Calendar",
    label: "Calendar",
    description: "Manage your teaching schedule — create and edit lectures, tests, and events.",
    icon: Calendar,
    pageFeatures: [
      {
        title: "Monthly & Weekly Views",
        description: "Toggle between monthly and weekly layouts to see the full schedule across all your batches.",
      },
      {
        title: "Create Events",
        description: "Click any date to create an event: set title, type (lecture / test / event), date and time, and which batch it applies to. It appears immediately on students' calendars.",
      },
      {
        title: "Edit & Delete",
        description: "Click any existing event to edit its details or delete it. Changes propagate to all affected students and co-teachers instantly.",
      },
    ],
  },
  {
    navKey: "analytics",
    path: "/teacher/analytics",
    title: "Analytics",
    label: "Analytics",
    description: "Watch time, quiz scores, topic coverage gaps, doubt volume — data to teach smarter.",
    icon: BarChart,
    pageFeatures: ANALYTICS_FEATURES,
  },
  {
    navKey: "ai-tools",
    path: "/teacher/ai-tools",
    title: "AI Tools",
    label: "AI Tools",
    description: "AI-powered teaching utilities — grade answers, generate notes, transcribe lectures.",
    icon: Sparkles,
    pageFeatures: [
      {
        title: "Grade Subjective Answer",
        description: "Paste a question and a student's written answer, optionally add the subject and marking rubric, then click 'Grade Answer'. AI returns a percentage score with detailed written feedback.",
      },
      {
        title: "Result Card",
        description: "The output shows a score bar, percentage, and full feedback text. A Copy button lets you paste the feedback directly into the doubt response editor with one click.",
      },
      {
        title: "Generate Lecture Notes",
        description: "Upload or paste lecture content — AI generates structured, student-ready notes you can publish to the Content page immediately.",
      },
      {
        title: "Generate Quiz from Lecture",
        description: "Provide a lecture transcript or topic — AI creates MCQ questions at the difficulty you specify, ready to review and publish from the Quizzes page.",
      },
      {
        title: "AI Credits",
        description: "Usage stats at the top show credits used and remaining this month. An Upgrade button appears when you're close to the limit.",
      },
    ],
  },
  {
    navKey: "profile",
    path: "/teacher/profile",
    title: "My Profile",
    label: "My Profile",
    description: "Your teacher profile — personal info, subjects, qualifications, and teaching mode.",
    icon: User,
    pageFeatures: [
      {
        title: "Avatar & Basic Info",
        description: "Click your avatar to upload a new photo (camera icon appears on hover). Edit your full name, email, phone, and a bio up to 300 characters with a live counter.",
      },
      {
        title: "Teaching Profile",
        description: "Add subjects via a tag input, select class levels taught (8–12 / Dropper), add qualification tags (B.Tech / M.Sc / etc.), and choose teaching mode: Online, Offline, or Hybrid.",
      },
      {
        title: "Academic Info",
        description: "Set your institute name, years of teaching experience, and specialisation — these appear on your public profile that students see in the course browser.",
      },
    ],
  },
  makeHeaderStep("teacher_admin"),
  FOOTER_STEP,
];

// ─── INSTITUTE ADMIN STEPS ────────────────────────────────────────────────────

const ADMIN_STEPS: NavTourStep[] = [
  {
    navKey: "admin",
    path: "/admin",
    title: "Dashboard",
    label: "Dashboard",
    description: "Live institute metrics, recent activity, urgent doubts — your institute at a glance.",
    icon: Home,
    pageFeatures: [
      {
        title: "Live Status Indicators",
        description: "A green pulse shows Online Students count and a blue indicator shows Live Classes Running — both update in real time without a page refresh.",
      },
      {
        title: "Stat Cards",
        description: "Four clickable cards: Total Students (→ Students page), Active/Total Batches (→ Courses), Total Lectures (→ Recorded Lectures), and Open Doubts in red when pending (→ Doubt Queue).",
      },
      {
        title: "Charts",
        description: "Bar chart: student distribution across batches. Donut chart: Active vs Pending teachers with a count in the center.",
      },
      {
        title: "Recent Batches & Doubts",
        description: "Four most recent courses as thumbnail cards for quick access. Four most recent open doubts with student name and orange status badge — 'View All' jumps to the queue.",
      },
      {
        title: "Teachers Management (not in sidebar)",
        description: "Access via the Teachers page (/admin/teachers): add teachers one-by-one or bulk via CSV, view each teacher's batches and performance, reset passwords, and deactivate accounts. A temporary password is shown after creation.",
      },
      {
        title: "Reports & Settings (not in sidebar)",
        description: "Reports (/admin/reports) generates student, teacher, batch, or financial reports as PDF/CSV/Excel for any date range. Settings (/admin/settings) controls institute branding, email templates, batch defaults, and payment gateway config.",
      },
    ],
  },
  {
    navKey: "batches",
    path: "/admin/batches",
    title: "Courses & Batches",
    label: "Courses",
    description: "Create courses, assign teachers per subject, manage students, attendance, and performance.",
    icon: Layout,
    pageFeatures: [
      {
        title: "Course Cards + Enrollment Code",
        description: "All courses as expandable cards. Each batch has an enrollment code (copy button) — share it with students so they can self-join via /join without manual enrollment.",
      },
      {
        title: "Create a Course",
        description: "New Course form: name, exam target (with custom option), class level, pricing (free or paid — the revenue split preview shows 80% to your institute, 20% to platform), thumbnail, delivery mode, and start/end dates.",
      },
      {
        title: "Teacher Assignments Tab",
        description: "Assign a different teacher per subject — type the subject name (autocomplete suggests Physics, Chemistry, Math, Biology, etc.), select the teacher, click Add. They gain access immediately.",
      },
      {
        title: "Student Management Tab",
        description: "Add students individually or bulk-enroll via CSV upload (download the template first). A preview table appears before import, and the result summary shows enrolled count, skipped rows, and reasons.",
      },
      {
        title: "Live Attendance Tab",
        description: "See who's active right now (green pulse), who studied today, and who's been inactive — plus a GitHub-style monthly heatmap of class-wide engagement over the full month.",
      },
      {
        title: "Performance Tab",
        description: "Per-course Avg Accuracy %, Tests Taken, and Top Score. A ranked top-students list and a 'Needs Attention' section flag students who are falling behind.",
      },
    ],
  },
  {
    navKey: "students",
    path: "/admin/students",
    title: "Students",
    label: "Students",
    description: "Every student across all batches — searchable, filterable, with full individual profiles.",
    icon: Users,
    pageFeatures: [
      {
        title: "Student Table",
        description: "Every enrolled student with avatar, name, phone, email, batch badges (colour-coded), enrollment date, last active date, and quick-action buttons per row.",
      },
      {
        title: "Search & Batch Filter",
        description: "Search by name, email, or phone in real time. The batch filter dropdown narrows the list to a specific course — active filters appear as clearable chips.",
      },
      {
        title: "Student Detail Page",
        description: "Click a student's name to open their detail page: enrolled batches with progress %, tests taken, avg accuracy, weak topics, last login, lecture watch history, and action buttons — Send Message, Flag, Remove from Institute.",
      },
      {
        title: "Pagination",
        description: "Page controls with direct page-number jumping and previous/next buttons keep large student lists fast and navigable.",
      },
    ],
  },
  {
    navKey: "content",
    path: "/admin/content",
    title: "Course Content",
    label: "Content",
    description: "Full curriculum management across all batches — add topics, upload resources, generate AI content.",
    icon: GraduationCap,
    pageFeatures: [
      {
        title: "Full Batch Access",
        description: "Unlike teachers who only see their assigned courses, admins see every batch. Select any course to open its Curriculum Workspace.",
      },
      ...CONTENT_FEATURES.slice(1),
    ],
  },
  {
    navKey: "lectures",
    path: "/teacher/lectures",
    title: "Lecture Studio",
    label: "Lectures",
    description: "Upload recorded lectures, go live, and add notes, quizzes, and checkpoints.",
    icon: Video,
    pageFeatures: LECTURES_FEATURES,
  },
  {
    navKey: "doubts",
    path: "/teacher/doubts",
    title: "Doubt Queue",
    label: "Doubt Queue",
    description: "Review and respond to all institute-wide student doubts.",
    icon: MessageSquare,
    pageFeatures: DOUBTS_FEATURES,
  },
  {
    navKey: "analytics",
    path: "/teacher/analytics",
    title: "Analytics",
    label: "Analytics",
    description: "Batch performance, topic coverage, and doubt analytics across your institute.",
    icon: BarChart,
    pageFeatures: ANALYTICS_FEATURES,
  },
  {
    navKey: "mock-tests",
    path: "/admin/mock-tests",
    title: "Mock Tests",
    label: "Mock Tests",
    description: "Build full-length exams with AI questions, auto-grading, and personalised AI reports.",
    icon: BookOpen,
    pageFeatures: [
      {
        title: "Test Builder",
        description: "Create named sections, pick question types (MCQ Single / MCQ Multi / Integer / Descriptive), set time limit, passing marks, and a difficulty mix. Competitive presets match JEE/NEET paper patterns.",
      },
      {
        title: "AI Question Generation",
        description: "Type any topic and difficulty level — AI generates questions instantly with built-in quality checks. Review, edit if needed, and add to the test in one click.",
      },
      {
        title: "Custom Questions with LaTeX",
        description: "Write your own questions manually with full LaTeX math notation support, multiple answer options, and correct-answer key — complete control over every item.",
      },
      {
        title: "PYQ Management",
        description: "PYQ Management (/admin/pyq) — accessible from the sidebar or admin panel — lets you upload previous year question PDFs tagged by exam, subject, year, and difficulty. Students access them from their course PYQ tab.",
      },
      {
        title: "Auto-Grading & AI Reports",
        description: "Tests are graded the moment the window closes. Every student receives an AI-generated performance report highlighting strengths and specific topics to revise before the real exam.",
      },
    ],
  },
  {
    navKey: "calendar",
    path: "/admin/calendar",
    title: "Academic Calendar",
    label: "Calendar",
    description: "Institute-wide schedule — create and manage lectures, tests, holidays, and events.",
    icon: Calendar,
    pageFeatures: [
      {
        title: "Monthly & Weekly Views",
        description: "See the full institute schedule across all batches. Toggle between monthly overview and weekly detail view.",
      },
      {
        title: "Create & Edit Events",
        description: "Create events scoped to specific batches or institute-wide. Set title, type (lecture / test / holiday / event), date, time, and description. Edit or delete any entry at any time.",
      },
      {
        title: "Propagation",
        description: "Events appear on all relevant students' and teachers' calendars immediately — no manual distribution needed.",
      },
    ],
  },
  {
    navKey: "notifications",
    path: "/admin/notifications",
    title: "Notifications",
    label: "Notifications",
    description: "All institute notifications — unread indicators, lead actions, and full history.",
    icon: Bell,
    pageFeatures: [
      {
        title: "Notification List",
        description: "Every notification as a row: icon, title, body preview, and a 'time ago' timestamp. Unread rows have a light-indigo background and a blue indicator dot.",
      },
      {
        title: "Mark as Read",
        description: "Click any row to mark it read — background shifts to white, dot disappears. The unread count in the header bell updates instantly.",
      },
      {
        title: "Lead Notifications",
        description: "Course-view notifications from prospective students show the contact info extracted from their enquiry, plus quick-action Call (📞) and Email (✉) buttons — follow up without leaving the page.",
      },
    ],
  },
  {
    navKey: "header-controls",
    path: "",
    title: "Header Controls",
    label: "Top Bar",
    description: "Notifications, institute settings, and account actions — always top-right.",
    icon: Settings,
    pageFeatures: [
      {
        title: "Notifications Bell",
        description: "Tap the bell to open the Notifications page. Lead notifications from prospective students include direct Call and Email action buttons without navigating away.",
      },
      {
        title: "Institute Settings",
        description: "Click your avatar → Settings to reach /admin/settings: institute name, subdomain, logo/branding, email templates, batch defaults, and payment gateway configuration.",
      },
      {
        title: "User Menu & Logout",
        description: "The avatar dropdown shows your name and role, a Settings link, and a Logout button. Logout redirects to login — all data is saved automatically.",
      },
    ],
  },
  FOOTER_STEP,
];

// ─── Hook ─────────────────────────────────────────────────────────────────────

const NAV_TOUR_STEPS: Record<UserRole, NavTourStep[]> = {
  student: STUDENT_STEPS,
  teacher: TEACHER_STEPS,
  institute_admin: ADMIN_STEPS,
  super_admin: [], // no tour for super admin
};

export function useNavTour(role: UserRole) {
  const [isActive, setIsActive] = useState(false);
  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const [phase, setPhase] = useState<TourPhase>("nav");
  const [pageFeatureIdx, setPageFeatureIdx] = useState(0);

  const steps = NAV_TOUR_STEPS[role] ?? [];
  const currentStep = isActive && steps.length > 0 ? steps[currentStepIdx] : null;
  const currentPageFeature =
    isActive && phase === "page" && currentStep
      ? currentStep.pageFeatures[pageFeatureIdx] ?? null
      : null;

  function startTour() {
    if (steps.length === 0) return;
    setCurrentStepIdx(0);
    setPhase("nav");
    setPageFeatureIdx(0);
    setIsActive(true);
  }

  function advanceFromNav() {
    if (!currentStep || phase !== "nav") return;
    if (currentStep.pageFeatures.length > 0) {
      setPhase("page");
      setPageFeatureIdx(0);
    } else {
      goNextStep();
    }
  }

  function advancePageFeature() {
    if (!currentStep || phase !== "page") return;
    const next = pageFeatureIdx + 1;
    if (next < currentStep.pageFeatures.length) {
      setPageFeatureIdx(next);
    } else {
      goNextStep();
    }
  }

  function goNextStep() {
    const next = currentStepIdx + 1;
    if (next >= steps.length) {
      setIsActive(false);
      setCurrentStepIdx(0);
      setPhase("nav");
      setPageFeatureIdx(0);
    } else {
      setCurrentStepIdx(next);
      setPhase("nav");
      setPageFeatureIdx(0);
    }
  }

  function skip() {
    setIsActive(false);
    setCurrentStepIdx(0);
    setPhase("nav");
    setPageFeatureIdx(0);
  }

  return {
    startTour,
    isActive,
    currentStep,
    currentStepIdx,
    totalSteps: steps.length,
    phase,
    currentPageFeature,
    pageFeatureIdx,
    totalPageFeatures: currentStep?.pageFeatures.length ?? 0,
    advanceFromNav,
    advancePageFeature,
    skip,
  };
}
