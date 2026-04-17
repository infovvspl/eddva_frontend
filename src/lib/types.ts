export type UserRole = "super_admin" | "institute_admin" | "teacher" | "student";

export interface StudentProfile {
  id: string;
  batchId?: string;
  examTarget: string;
  currentClass: string;
  examYear?: number;
  diagnosticCompleted: boolean;
  streakDays?: number;
  xpPoints?: number;
  currentEloTier?: string;
  targetCollege?: string;
  dailyStudyHours?: number;
}

export interface User {
  id: string;
  name: string;
  phone: string;
  email?: string;
  role: UserRole;
  avatar?: string;
  tenantId?: string;
  tenantName?: string;
  isFirstLogin?: boolean;
  onboardingRequired?: boolean;
  teacherProfile?: TeacherProfile | null;
  studentProfile?: StudentProfile | null;
}

export interface TeacherProfile {
  id: string;
  userId: string;
  tenantId: string;
  qualification?: string;
  subjectExpertise?: string[];
  classesTeach?: string[];
  yearsOfExperience?: number;
  bio?: string;
  gender?: string;
  dateOfBirth?: string;
  profilePhotoUrl?: string;
  teachingMode?: string;
  previousInstitute?: string;
  city?: string;
  state?: string;
  onboardingComplete?: boolean;
}

export interface Tenant {
  id: string;
  name: string;
  subdomain: string;
  plan: "starter" | "growth" | "scale" | "enterprise";
  status: "active" | "trial" | "suspended";
  studentCount: number;
  studentLimit: number;
  teacherCount: number;
  joinedAt: string;
}

export interface Batch {
  id: string;
  name: string;
  examTarget: "JEE" | "NEET" | "Both";
  className: string;
  teacherName: string;
  teacherAvatar?: string;
  studentCount: number;
  maxStudents: number;
  status: "active" | "upcoming" | "completed";
}

export interface StatCardData {
  label: string;
  value: string | number;
  trend?: number;
  icon: React.ComponentType<{ className?: string }>;
  color: "primary" | "success" | "warning" | "destructive" | "ai" | "info";
}

import type React from "react";
