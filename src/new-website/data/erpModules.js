// The modules inside EDDVA ERP, as supplied — 23 modules, each with the
// capabilities it covers. Replaces the earlier flat 18-name list once the
// real per-module breakdown was provided.
//
// Icons are chosen to match each module's name; they are not otherwise
// signed off — swap any that don't read as intended.
//
// `desc` is a one-sentence summary of what the module covers, shown above its
// bullet list in ModuleAccordion — the bullets stay as the literal capability
// list, `desc` just narrates them for a reader skimming before they expand it.

import {
  ConciergeBell, Building2, GraduationCap, UserCog, School, UserCheck,
  Banknote, FileBarChart, Award, CalendarDays, Clock, ClipboardList,
  BedDouble, UtensilsCrossed, Bus, Library, Users, Network, Boxes,
  Users2, Wallet, Trophy, BarChart3,
} from "lucide-react";

export const erpModules = [
  {
    id: "front-desk", title: "Front Desk", Icon: ConciergeBell,
    desc: "Runs the first point of contact for your institution — logging visitors, tracking admission enquiries end to end, and keeping a record of every communication so front-office staff always know where things stand.",
    bullets: ["Visitor/front-desk management", "Enquiry & admission support", "Communication records", "Front-office dashboard"],
  },
  {
    id: "school-management", title: "School Management", Icon: Building2,
    desc: "Sets up how your institution runs on EDDVA — branches, academic years and school profile details — and controls who on staff can access what, from one management dashboard.",
    bullets: ["Institute/branch configuration", "Academic year", "School profile", "Roles & permissions", "Management dashboard"],
  },
  {
    id: "student-management", title: "Student Management", Icon: GraduationCap,
    desc: "Covers a student's full journey on the platform — admission and registration, class/section placement, parent linking — and keeps one permanent academic record per student.",
    bullets: ["Admissions & registration", "Student profiles", "Class/section allocation", "Parent mapping", "Student records"],
  },
  {
    id: "teacher-staff", title: "Teacher & Staff", Icon: UserCog,
    desc: "Maintains staff profiles, assigns teachers to classes and subjects, and controls what each role can see or do across the system.",
    bullets: ["Staff profiles", "Teacher allocation", "Subject assignment", "Role management"],
  },
  {
    id: "classroom-management", title: "Classroom Management", Icon: School,
    desc: "Organizes classes, sections and subjects, and maps which teacher teaches which subject in which classroom.",
    bullets: ["Classes & sections", "Subjects", "Teacher-subject mapping", "Classroom configuration"],
  },
  {
    id: "attendance-tracking", title: "Attendance Tracking", Icon: UserCheck,
    desc: "Records daily attendance for both students and staff, with reports that surface patterns and absences at a glance.",
    bullets: ["Student attendance", "Teacher/staff attendance", "Daily records", "Attendance reports"],
  },
  {
    id: "fee-management", title: "Fee Management", Icon: Banknote,
    desc: "Handles fee structures and collection, keeps payment records, tracks outstanding dues, and generates fee reports for the finance team.",
    bullets: ["Fee structures", "Fee collection", "Payment records", "Dues/outstanding", "Fee reports"],
  },
  {
    id: "report-cards", title: "Report Cards", Icon: FileBarChart,
    desc: "Compiles marks and grades into report cards, keeping a running academic record and performance history for every student.",
    bullets: ["Marks/grades", "Academic records", "Report-card generation", "Performance records"],
  },
  {
    id: "certificates", title: "Certificates", Icon: Award,
    desc: "Configures certificate templates and generates certificates on demand, with a record of every certificate issued to a student.",
    bullets: ["Certificate templates/configuration", "Certificate generation", "Student certificate records"],
  },
  {
    id: "calendar-events", title: "Calendar & Events", Icon: CalendarDays,
    desc: "Keeps one shared academic calendar — school events, important dates and announcements — visible to everyone who needs it.",
    bullets: ["Academic calendar", "School events", "Important dates", "Announcements"],
  },
  {
    id: "timetable-management", title: "Timetable Management", Icon: Clock,
    desc: "Builds class and teacher timetables, schedules periods, and manages subject/teacher assignments across the week.",
    bullets: ["Class timetable", "Teacher timetable", "Periods", "Subject/teacher scheduling"],
  },
  {
    id: "homework-assignments", title: "Homework & Assignments", Icon: ClipboardList,
    desc: "Lets teachers create homework and assignments, allocate them to classes, and track submissions as they come in.",
    bullets: ["Homework creation", "Assignment allocation", "Submission tracking"],
  },
  {
    id: "hostel-management", title: "Hostel Management", Icon: BedDouble,
    desc: "Manages room allocation and resident records for hostel students, along with day-to-day hostel administration.",
    bullets: ["Hostel/room allocation", "Resident records", "Hostel administration"],
  },
  {
    id: "canteen-management", title: "Canteen Management", Icon: UtensilsCrossed,
    desc: "Covers basic canteen operations — meal and service records — with simple administrative tools for canteen staff.",
    bullets: ["Canteen operations", "Meal/service records", "Basic administration"],
  },
  {
    id: "transportation-management", title: "Transportation Management", Icon: Bus,
    desc: "Tracks routes, vehicles and driver records, and manages which students are allocated to which transport route.",
    bullets: ["Routes", "Vehicles", "Driver records", "Student transport allocation"],
  },
  {
    id: "library-management", title: "Library Management", Icon: Library,
    desc: "Maintains the book catalogue, tracks issues and returns, and keeps a full record of library activity.",
    bullets: ["Book/catalogue", "Issue/return tracking", "Library records"],
  },
  {
    id: "hr-staff-support", title: "HR & Staff Support", Icon: Users,
    desc: "Keeps employee records and handles basic HR administration for teaching and non-teaching staff.",
    bullets: ["Employee records", "Basic HR administration", "Staff records"],
  },
  {
    id: "department-management", title: "Department Management", Icon: Network,
    desc: "Organizes academic and administrative departments so responsibilities and reporting lines are clear.",
    bullets: ["Academic/administrative departments", "Department organization"],
  },
  {
    id: "inventory-assets", title: "Inventory & Assets", Icon: Boxes,
    desc: "Tracks school inventory and assets, including stock levels and issue/return records.",
    bullets: ["School inventory", "Asset records", "Stock and issue/return tracking"],
  },
  {
    id: "alumni-management", title: "Alumni Management", Icon: Users2,
    desc: "Maintains an alumni database and supports ongoing communication with past students.",
    bullets: ["Alumni records", "Alumni database", "Communication"],
  },
  {
    id: "accounts-management", title: "Accounts Management", Icon: Wallet,
    desc: "Runs full institutional accounting — income and expenditure, account heads, payments and receipts, expense tracking — and rolls it up into financial summaries for management review.",
    bullets: [
      "Income and expenditure records", "Account heads and financial categorization",
      "Income and expenditure tracking", "Payment and receipt records", "Expense management",
      "Financial transaction records", "Account-wise reports", "Financial summaries and management reports",
    ],
  },
  {
    id: "sports-management", title: "Sports Management", Icon: Trophy,
    desc: "Manages sports activities, player profiles, teams and houses, event scheduling and participation, plus competition, achievement and performance records.",
    bullets: [
      "Sports activity management", "Student/player profiles", "Sports and game management",
      "Team and house management", "Sports event scheduling", "Participation tracking",
      "Competition and achievement records", "Sports performance reports",
    ],
  },
  {
    id: "reports-analytics", title: "Reports & Analytics", Icon: BarChart3,
    desc: "Pulls attendance, fee and student data into administrative reports that give management a clear view across the institution.",
    bullets: ["Administrative reports", "Attendance/fee/student reports", "Management insights"],
  },
];
