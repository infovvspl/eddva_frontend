// Detailed per-stakeholder capabilities for /solution.
//
// SOURCE OF TRUTH: these are the modules that actually ship in this repo —
// each one maps to a real route in src/App.tsx (/student/*, /school/student/*,
// /teacher/*, /school/teacher/*, /school/parent/*, /admin/*, /school/admin/*).
// When a module is added or renamed there, update it here so the marketing
// site keeps describing the product that exists.
//
// The role `title` and `blurb` are the same strings the stakeholder cards use
// in data/services.js; the group and item copy is written for this section.

import {
  MonitorPlay, PlayCircle, Library, BookMarked, NotebookPen, ClipboardList,
  ClipboardCheck, ListChecks, HelpCircle, Trophy, Gamepad2, Swords, BrainCircuit,
  Sparkles, CalendarDays, CalendarCheck, Timer, BarChart3, LineChart, Compass,
  Bell, MessageSquare, Megaphone, Wallet, UserRound, Users, UserCheck, Layers,
  Presentation, SquarePen, Percent, ShieldCheck, Settings, Database, Building2,
  ScrollText, Target, TrendingUp, Cog, Lock, HardDrive, Receipt, BadgeCheck,
  FileBarChart, UserCog, Boxes, Table2, Banknote, FolderKanban, Network, Contact,
  Gauge, Route as RouteIcon, Star,
} from "lucide-react";

export const roleSolutions = [
  /* ─────────────────────────── STUDENTS ─────────────────────────── */
  {
    id: "nw-sol-students",
    title: "Students",
    blurb: "Personalized learning paths, progress tracking & more.",
    Icon: Users,
    color: "#1a56db",
    bg: "#eff6ff",
    groups: [
      {
        id: "learn",
        label: "Learn",
        items: [
          { Icon: MonitorPlay, name: "Live interactive classes", desc: "Join scheduled live lectures with chat, polls and hand-raise." },
          { Icon: PlayCircle,  name: "Recorded class library",   desc: "Rewatch every session, resume where you left off." },
          { Icon: Library,     name: "Courses & topics",         desc: "Structured batches broken into chapters and topics." },
          { Icon: BookMarked,  name: "Study materials",          desc: "Notes, PDFs and resources attached to each topic." },
          { Icon: ScrollText,  name: "Syllabus view",            desc: "See the full syllabus and how much of it is covered." },
        ],
      },
      {
        id: "practice",
        label: "Practice & assess",
        items: [
          { Icon: ClipboardList, name: "Assignments",        desc: "Submit work and track what is due." },
          { Icon: ClipboardCheck, name: "Assessments & quizzes", desc: "Topic quizzes and graded assessments in the browser." },
          { Icon: ListChecks,    name: "Mock tests",         desc: "Full-length timed tests with instant scoring." },
          { Icon: Timer,         name: "Diagnostic test",    desc: "A baseline test that maps what you already know." },
          { Icon: Layers,        name: "PYQ bank",           desc: "Previous-year questions organised by topic." },
          { Icon: HelpCircle,    name: "Doubt queue",        desc: "Raise a doubt on any topic and get a teacher reply." },
        ],
      },
      {
        id: "ai",
        label: "AI tools",
        items: [
          { Icon: BrainCircuit, name: "AI study assistant", desc: "Ask questions on a topic and get worked explanations." },
          { Icon: Sparkles,     name: "AI study plan",      desc: "A schedule generated from your syllabus and pace." },
          { Icon: CalendarCheck, name: "Planner",           desc: "Your own plan of what to study and when." },
        ],
      },
      {
        id: "motivation",
        label: "Stay motivated",
        items: [
          { Icon: Swords,   name: "Battle Arena",  desc: "Head-to-head question battles against classmates." },
          { Icon: Gamepad2, name: "Game Zone",     desc: "Quiz Rush, Treasure Hunt, Math Sprint, Memory Match, Word Master." },
          { Icon: Trophy,   name: "Leaderboard",   desc: "Rankings across your batch and institute." },
          { Icon: Star,     name: "Gamification",  desc: "Points, streaks and badges for consistent work." },
        ],
      },
      {
        id: "track",
        label: "Track & plan",
        items: [
          { Icon: BarChart3,   name: "Progress & analytics", desc: "Topic-level strengths, gaps and time spent." },
          { Icon: FileBarChart, name: "Report card",         desc: "Consolidated results across terms." },
          { Icon: CalendarDays, name: "Timetable & calendar", desc: "Classes, tests and deadlines in one view." },
          { Icon: UserCheck,   name: "Attendance",           desc: "Your own attendance record, always visible." },
          { Icon: Compass,     name: "Career guidance",      desc: "Career quiz, report and an explorer of career paths." },
        ],
      },
      {
        id: "stay-connected",
        label: "Stay connected",
        items: [
          { Icon: MessageSquare, name: "Chat & communication", desc: "Message teachers and batchmates." },
          { Icon: Megaphone,     name: "Announcements",        desc: "Institute-wide notices as they are posted." },
          { Icon: Bell,          name: "Notifications",        desc: "Alerts for classes, results and deadlines." },
          { Icon: Wallet,        name: "Fees",                 desc: "Dues, payment history and receipts." },
        ],
      },
    ],
  },

  /* ─────────────────────────── TEACHERS ─────────────────────────── */
  {
    id: "nw-sol-teachers",
    title: "Teachers",
    blurb: "Smart tools, lesson planning, assessments & insights.",
    Icon: Presentation,
    color: "#0891b2",
    bg: "#ecfeff",
    groups: [
      {
        id: "teach",
        label: "Teach",
        items: [
          { Icon: MonitorPlay, name: "Live lectures",      desc: "Run live classes with a teaching dashboard beside them." },
          { Icon: PlayCircle,  name: "Recorded lectures",  desc: "Sessions recorded automatically and published to the batch." },
          { Icon: FolderKanban, name: "Course content",    desc: "Build the topic tree and attach material to each node." },
          { Icon: BookMarked,  name: "Study materials",    desc: "Upload notes and resources students can open in place." },
          { Icon: Table2,      name: "Textbook coverage",  desc: "Mark chapters covered against the prescribed textbook." },
        ],
      },
      {
        id: "assess",
        label: "Assess",
        items: [
          { Icon: SquarePen,     name: "Quiz builder",      desc: "Create topic quizzes and question banks." },
          { Icon: ClipboardCheck, name: "Assessments",      desc: "Set assessments, then view every submission." },
          { Icon: Percent,       name: "Manual grading",    desc: "Grade written answers session by session." },
          { Icon: FileBarChart,  name: "Test results",      desc: "Per-question breakdowns across the batch." },
          { Icon: HelpCircle,    name: "Doubt resolution",  desc: "A queue of student doubts to answer and close." },
        ],
      },
      {
        id: "plan",
        label: "Plan",
        items: [
          { Icon: RouteIcon,    name: "Syllabus planner",  desc: "Lay out the term against teaching days." },
          { Icon: Target,       name: "Syllabus tracker",  desc: "Record what was actually taught, week by week." },
          { Icon: CalendarDays, name: "Timetable & calendar", desc: "Your teaching schedule in one place." },
          { Icon: Boxes,        name: "Batches & classes", desc: "Every batch you own, with its roster." },
        ],
      },
      {
        id: "insight",
        label: "Understand the class",
        items: [
          { Icon: LineChart, name: "Class analytics",    desc: "Where the batch is strong and where it is stuck." },
          { Icon: UserRound, name: "Student profiles",   desc: "One page per student: work, results, attendance." },
          { Icon: Gauge,     name: "Performance view",   desc: "Students grouped into performance brackets." },
          { Icon: UserCheck, name: "Attendance",         desc: "Mark and review attendance per session." },
        ],
      },
      {
        id: "communicate",
        label: "Communicate",
        items: [
          { Icon: MessageSquare, name: "Communication",  desc: "Message students and parents from the platform." },
          { Icon: Megaphone,     name: "Announcements",  desc: "Post notices to a batch or a class." },
          { Icon: Bell,          name: "Notifications",  desc: "Reach a batch without leaving the dashboard." },
          { Icon: Contact,       name: "Support tickets", desc: "Raise and track issues with the institute." },
        ],
      },
    ],
  },

  /* ─────────────────────────── PARENTS ─────────────────────────── */
  {
    id: "nw-sol-parents",
    title: "Parents",
    blurb: "Real-time updates, communication & performance reports.",
    Icon: UserRound,
    color: "#16a34a",
    bg: "#f0fdf4",
    groups: [
      {
        id: "child",
        label: "Follow your child",
        items: [
          { Icon: Gauge,        name: "Parent dashboard", desc: "One screen for everything happening this week." },
          { Icon: UserRound,    name: "Child profile",    desc: "Attendance, work and results in one place." },
          { Icon: FileBarChart, name: "Report card",      desc: "Term results as soon as they are published." },
          { Icon: ScrollText,   name: "Syllabus progress", desc: "How much of the syllabus has been covered." },
        ],
      },
      {
        id: "keep-up",
        label: "Keep up",
        items: [
          { Icon: MessageSquare, name: "Communication",  desc: "Talk to teachers and the school directly." },
          { Icon: Megaphone,     name: "Announcements",  desc: "School notices delivered as they go out." },
          { Icon: Bell,          name: "Notifications",  desc: "Alerts for results, absence and events." },
          { Icon: UserCog,       name: "Profile",        desc: "Keep your own contact details current." },
        ],
      },
    ],
  },

  /* ────────────────────── INSTITUTE ADMIN ────────────────────── */
  {
    id: "nw-sol-admin",
    title: "Institute Admin",
    blurb: "Streamlined operations, data & decision-making.",
    Icon: Building2,
    color: "#dc2626",
    bg: "#fff1f2",
    groups: [
      {
        id: "people",
        label: "People",
        items: [
          { Icon: Users,     name: "Student records",   desc: "Admission, edit, exit and full student history." },
          { Icon: TrendingUp, name: "Student promotion", desc: "Move a whole cohort up a year in one pass." },
          { Icon: UserCheck, name: "Teachers & staff",  desc: "Onboard staff and review their performance." },
          { Icon: Lock,      name: "Roles & permissions", desc: "Decide exactly who can see and do what." },
        ],
      },
      {
        id: "academics",
        label: "Academics",
        items: [
          { Icon: Layers,       name: "Classes & sections", desc: "Structure the school, class by class." },
          { Icon: BookMarked,   name: "Subjects",           desc: "Subjects mapped to each class." },
          { Icon: CalendarDays, name: "Timetable",          desc: "Build and publish the whole timetable." },
          { Icon: UserCheck,    name: "Attendance",         desc: "Institute-wide attendance, daily." },
          { Icon: RouteIcon,    name: "Syllabus planning",  desc: "Plan, track and analyse syllabus coverage." },
          { Icon: ListChecks,   name: "Mock tests & PYQ",   desc: "Central test bank and previous-year questions." },
        ],
      },
      {
        id: "operations",
        label: "Operations",
        items: [
          { Icon: Database,  name: "Full ERP",           desc: "Academic, administrative and financial operations." },
          { Icon: Banknote,  name: "Fees & finance",     desc: "Dues, collection and payment records." },
          { Icon: Receipt,   name: "Document generator", desc: "Generate certificates and official documents." },
          { Icon: Boxes,     name: "Batches",            desc: "Create batches and assign teachers to them." },
          { Icon: HardDrive, name: "Storage",            desc: "See what content and media are using space." },
        ],
      },
      {
        id: "communication",
        label: "Communication",
        items: [
          { Icon: Megaphone,     name: "Notices & announcements", desc: "Reach the whole institute at once." },
          { Icon: MessageSquare, name: "Communications",   desc: "Message any group, with a log of what was sent." },
          { Icon: Bell,          name: "Notifications",    desc: "Push alerts to students, teachers or parents." },
          { Icon: Contact,       name: "Complaints & tickets", desc: "Route and resolve issues with an audit trail." },
        ],
      },
      {
        id: "intelligence",
        label: "Intelligence",
        items: [
          { Icon: BarChart3,    name: "Analytics",        desc: "Institute-wide performance and engagement." },
          { Icon: FileBarChart, name: "Reports",          desc: "Exportable reports for every module." },
          { Icon: BrainCircuit, name: "AI usage",         desc: "See how much AI the institute is actually using." },
          { Icon: Network,      name: "Live usage",       desc: "Live class load in real time." },
          { Icon: Star,         name: "Gamification",     desc: "Tune points and rewards across the institute." },
        ],
      },
      {
        id: "governance",
        label: "Governance",
        items: [
          { Icon: ShieldCheck, name: "Security",       desc: "Enterprise-grade controls over institute data." },
          { Icon: ScrollText,  name: "Audit logs",     desc: "A record of who changed what, and when." },
          { Icon: BadgeCheck,  name: "Feature flags",  desc: "Turn modules on and off per institute." },
          { Icon: Settings,    name: "Institute profile & settings", desc: "Branding, defaults and configuration." },
          { Icon: Cog,         name: "ERP modules",    desc: "Choose which ERP modules are in play." },
        ],
      },
    ],
  },
];
