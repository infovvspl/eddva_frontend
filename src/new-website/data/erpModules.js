// The modules inside EDDVA ERP, as supplied — 23 modules, each with the
// capabilities it covers. Replaces the earlier flat 18-name list once the
// real per-module breakdown was provided.
//
// Icons are chosen to match each module's name; they are not otherwise
// signed off — swap any that don't read as intended.

import {
  ConciergeBell, Building2, GraduationCap, UserCog, School, UserCheck,
  Banknote, FileBarChart, Award, CalendarDays, Clock, ClipboardList,
  BedDouble, UtensilsCrossed, Bus, Library, Users, Network, Boxes,
  Users2, Wallet, Trophy, BarChart3,
} from "lucide-react";

export const erpModules = [
  {
    id: "front-desk", title: "Front Desk", Icon: ConciergeBell,
    bullets: ["Visitor/front-desk management", "Enquiry & admission support", "Communication records", "Front-office dashboard"],
  },
  {
    id: "school-management", title: "School Management", Icon: Building2,
    bullets: ["Institute/branch configuration", "Academic year", "School profile", "Roles & permissions", "Management dashboard"],
  },
  {
    id: "student-management", title: "Student Management", Icon: GraduationCap,
    bullets: ["Admissions & registration", "Student profiles", "Class/section allocation", "Parent mapping", "Student records"],
  },
  {
    id: "teacher-staff", title: "Teacher & Staff", Icon: UserCog,
    bullets: ["Staff profiles", "Teacher allocation", "Subject assignment", "Role management"],
  },
  {
    id: "classroom-management", title: "Classroom Management", Icon: School,
    bullets: ["Classes & sections", "Subjects", "Teacher-subject mapping", "Classroom configuration"],
  },
  {
    id: "attendance-tracking", title: "Attendance Tracking", Icon: UserCheck,
    bullets: ["Student attendance", "Teacher/staff attendance", "Daily records", "Attendance reports"],
  },
  {
    id: "fee-management", title: "Fee Management", Icon: Banknote,
    bullets: ["Fee structures", "Fee collection", "Payment records", "Dues/outstanding", "Fee reports"],
  },
  {
    id: "report-cards", title: "Report Cards", Icon: FileBarChart,
    bullets: ["Marks/grades", "Academic records", "Report-card generation", "Performance records"],
  },
  {
    id: "certificates", title: "Certificates", Icon: Award,
    bullets: ["Certificate templates/configuration", "Certificate generation", "Student certificate records"],
  },
  {
    id: "calendar-events", title: "Calendar & Events", Icon: CalendarDays,
    bullets: ["Academic calendar", "School events", "Important dates", "Announcements"],
  },
  {
    id: "timetable-management", title: "Timetable Management", Icon: Clock,
    bullets: ["Class timetable", "Teacher timetable", "Periods", "Subject/teacher scheduling"],
  },
  {
    id: "homework-assignments", title: "Homework & Assignments", Icon: ClipboardList,
    bullets: ["Homework creation", "Assignment allocation", "Submission tracking"],
  },
  {
    id: "hostel-management", title: "Hostel Management", Icon: BedDouble,
    bullets: ["Hostel/room allocation", "Resident records", "Hostel administration"],
  },
  {
    id: "canteen-management", title: "Canteen Management", Icon: UtensilsCrossed,
    bullets: ["Canteen operations", "Meal/service records", "Basic administration"],
  },
  {
    id: "transportation-management", title: "Transportation Management", Icon: Bus,
    bullets: ["Routes", "Vehicles", "Driver records", "Student transport allocation"],
  },
  {
    id: "library-management", title: "Library Management", Icon: Library,
    bullets: ["Book/catalogue", "Issue/return tracking", "Library records"],
  },
  {
    id: "hr-staff-support", title: "HR & Staff Support", Icon: Users,
    bullets: ["Employee records", "Basic HR administration", "Staff records"],
  },
  {
    id: "department-management", title: "Department Management", Icon: Network,
    bullets: ["Academic/administrative departments", "Department organization"],
  },
  {
    id: "inventory-assets", title: "Inventory & Assets", Icon: Boxes,
    bullets: ["School inventory", "Asset records", "Stock and issue/return tracking"],
  },
  {
    id: "alumni-management", title: "Alumni Management", Icon: Users2,
    bullets: ["Alumni records", "Alumni database", "Communication"],
  },
  {
    id: "accounts-management", title: "Accounts Management", Icon: Wallet,
    bullets: [
      "Income and expenditure records", "Account heads and financial categorization",
      "Income and expenditure tracking", "Payment and receipt records", "Expense management",
      "Financial transaction records", "Account-wise reports", "Financial summaries and management reports",
    ],
  },
  {
    id: "sports-management", title: "Sports Management", Icon: Trophy,
    bullets: [
      "Sports activity management", "Student/player profiles", "Sports and game management",
      "Team and house management", "Sports event scheduling", "Participation tracking",
      "Competition and achievement records", "Sports performance reports",
    ],
  },
  {
    id: "reports-analytics", title: "Reports & Analytics", Icon: BarChart3,
    bullets: ["Administrative reports", "Attendance/fee/student reports", "Management insights"],
  },
];
