import { driver } from "driver.js";
import "driver.js/dist/driver.css";
import type { UserRole } from "@/lib/types";

type NavigateFn = (path: string) => void;
type DriverInstance = ReturnType<typeof driver>;

// Navigate then advance after giving the page time to render
function navThenNext(d: DriverInstance, navigate: NavigateFn, path: string) {
  navigate(path);
  setTimeout(() => d.moveNext(), 700);
}

function buildSteps(role: UserRole, navigate: NavigateFn, getInstance: () => DriverInstance) {
  const d = () => getInstance();

  if (role === "student") {
    return [
      {
        element: '[data-tour="sidebar"]',
        popover: {
          title: "Your Navigation Hub",
          description: "Every feature you need is in this sidebar. Let's walk through the key ones.",
          side: "right" as const,
          align: "center" as const,
        },
      },
      {
        element: '[data-tour="nav-doubts"]',
        popover: {
          title: "AI Doubt Solver",
          description: "Ask any question — AI answers with step-by-step solutions. Escalates to your teacher if it can't help.",
          side: "right" as const,
        },
        onNextClick: () => navThenNext(d(), navigate, "/student/doubts"),
      },
      {
        element: '[data-tour="main-content"]',
        popover: {
          title: "Ask Your Doubts Here",
          description: "Type a question or upload an image. Get an AI answer in seconds.",
          side: "top" as const,
          align: "center" as const,
        },
        onNextClick: () => navThenNext(d(), navigate, "/student/battle"),
      },
      {
        element: '[data-tour="main-content"]',
        popover: {
          title: "Battle Arena ⚔️",
          description: "Challenge classmates to real-time quiz battles. Win XP, climb the leaderboard.",
          side: "top" as const,
          align: "center" as const,
        },
        onNextClick: () => navThenNext(d(), navigate, "/student/leaderboard"),
      },
      {
        element: '[data-tour="main-content"]',
        popover: {
          title: "Leaderboard 🏆",
          description: "See where you rank among your batchmates. Earn XP by answering doubts, winning battles, and studying.",
          side: "top" as const,
          align: "center" as const,
        },
        onNextClick: () => navThenNext(d(), navigate, "/student"),
      },
      {
        element: '[data-tour="main-content"]',
        popover: {
          title: "Your Dashboard 📊",
          description: "Your study streak, upcoming lectures, recent activity, and progress — all in one place.",
          side: "top" as const,
          align: "center" as const,
        },
      },
      {
        element: '[data-tour="notifications"]',
        popover: {
          title: "Notifications 🔔",
          description: "Get notified when your teacher responds to a doubt or new content is published.",
          side: "bottom" as const,
          align: "end" as const,
        },
      },
    ];
  }

  if (role === "teacher") {
    return [
      {
        element: '[data-tour="sidebar"]',
        popover: {
          title: "Your Teaching Hub",
          description: "All your tools are here. Let's take a quick tour.",
          side: "right" as const,
          align: "center" as const,
        },
      },
      {
        element: '[data-tour="nav-doubts"]',
        popover: {
          title: "Doubt Queue",
          description: "See every student doubt escalated to you. AI pre-drafts the response — you review and send.",
          side: "right" as const,
        },
        onNextClick: () => navThenNext(d(), navigate, "/teacher/doubts"),
      },
      {
        element: '[data-tour="main-content"]',
        popover: {
          title: "Answer Student Doubts 💬",
          description: "Each card shows the student's question, the AI draft, and lets you send a response with one click.",
          side: "top" as const,
          align: "center" as const,
        },
        onNextClick: () => navThenNext(d(), navigate, "/teacher/lectures"),
      },
      {
        element: '[data-tour="main-content"]',
        popover: {
          title: "Lecture Studio 🎥",
          description: "Upload recorded lectures or go live. Add checkpoints, quizzes, and notes per lecture.",
          side: "top" as const,
          align: "center" as const,
        },
        onNextClick: () => navThenNext(d(), navigate, "/teacher/analytics"),
      },
      {
        element: '[data-tour="main-content"]',
        popover: {
          title: "Analytics 📊",
          description: "See who's watching, who's struggling, and which topics need more attention.",
          side: "top" as const,
          align: "center" as const,
        },
        onNextClick: () => navThenNext(d(), navigate, "/teacher"),
      },
      {
        element: '[data-tour="main-content"]',
        popover: {
          title: "Teacher Dashboard 🏠",
          description: "Your overview — pending doubts, recent lecture activity, and student performance at a glance.",
          side: "top" as const,
          align: "center" as const,
        },
      },
    ];
  }

  if (role === "institute_admin") {
    return [
      {
        element: '[data-tour="sidebar"]',
        popover: {
          title: "Admin Control Panel",
          description: "Manage your entire institute from this sidebar. Let's explore.",
          side: "right" as const,
          align: "center" as const,
        },
      },
      {
        element: '[data-tour="nav-batches"]',
        popover: {
          title: "Courses & Batches 📚",
          description: "Create batches, assign subject teachers, and manage student access per course.",
          side: "right" as const,
        },
        onNextClick: () => navThenNext(d(), navigate, "/admin/batches"),
      },
      {
        element: '[data-tour="main-content"]',
        popover: {
          title: "Manage Batches 📚",
          description: "Create a new batch, assign teachers per subject, and enroll students in seconds.",
          side: "top" as const,
          align: "center" as const,
        },
        onNextClick: () => navThenNext(d(), navigate, "/admin/students"),
      },
      {
        element: '[data-tour="main-content"]',
        popover: {
          title: "Student Roster 👩‍🎓",
          description: "View, enroll, and manage all students. Track fees, progress, and access per student.",
          side: "top" as const,
          align: "center" as const,
        },
        onNextClick: () => navThenNext(d(), navigate, "/admin/mock-tests"),
      },
      {
        element: '[data-tour="main-content"]',
        popover: {
          title: "Mock Tests 📝",
          description: "Build full-length sectional exams with timers, auto-grading, and AI performance reports.",
          side: "top" as const,
          align: "center" as const,
        },
        onNextClick: () => navThenNext(d(), navigate, "/admin"),
      },
      {
        element: '[data-tour="main-content"]',
        popover: {
          title: "Institute Dashboard 🏠",
          description: "Your institute at a glance — active students, upcoming tests, and key metrics.",
          side: "top" as const,
          align: "center" as const,
        },
      },
    ];
  }

  // super_admin
  return [
    {
      element: '[data-tour="sidebar"]',
      popover: {
        title: "Super Admin Panel ⚡",
        description: "Full governance across every institute on the platform.",
        side: "right" as const,
        align: "center" as const,
      },
    },
    {
      element: '[data-tour="main-content"]',
      popover: {
        title: "Platform Overview",
        description: "Monitor all institutes, student counts, plan tiers, and activity at a glance.",
        side: "top" as const,
        align: "center" as const,
      },
      onNextClick: () => navThenNext(d(), navigate, "/super-admin/tenants"),
    },
    {
      element: '[data-tour="main-content"]',
      popover: {
        title: "Institutes 🏢",
        description: "Each institute is a fully isolated tenant. Create, suspend, or upgrade plans from here.",
        side: "top" as const,
        align: "center" as const,
      },
      onNextClick: () => navThenNext(d(), navigate, "/super-admin/users"),
    },
    {
      element: '[data-tour="main-content"]',
      popover: {
        title: "Users 👥",
        description: "View and manage all users across every institute — admins, teachers, and students.",
        side: "top" as const,
        align: "center" as const,
      },
    },
  ];
}

export function useAppTour(role: UserRole, navigate: NavigateFn) {
  function startTour() {
    let instance: DriverInstance;

    instance = driver({
      showProgress: true,
      progressText: "{{current}} / {{total}}",
      nextBtnText: "Next →",
      prevBtnText: "← Back",
      doneBtnText: "Done ✓",
      popoverClass: "edva-tour-popover",
      steps: buildSteps(role, navigate, () => instance),
      onDestroyStarted: () => {
        instance.destroy();
      },
    });

    instance.drive();
  }

  return { startTour };
}
