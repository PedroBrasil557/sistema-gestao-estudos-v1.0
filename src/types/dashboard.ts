import type { CourseStatus } from "@/types/course";

export type DashboardRange = "7d" | "30d" | "month" | "year" | "all" | "custom";

export type DashboardFilters = {
  range: DashboardRange;
  start: string | null;
  end: string | null;
  areaId: string | null;
  platformId: string | null;
  courseStatus: CourseStatus | null;
  studyTypeId: string | null;
};

export type DashboardFilterOption = { id: string; name: string };

export type DashboardMetric = {
  value: number;
  label: string;
};

export type DashboardData = {
  period: {
    label: string;
    start: string | null;
    end: string | null;
  };
  metrics: {
    totalHours: number;
    completedCourses: number;
    inProgressCourses: number;
    certificatesObtained: number;
    monthlyAverageHours: number;
    generalProgress: number;
  };
  monthlyEvolution: Array<{ key: string; label: string; hours: number }>;
  hoursByArea: Array<{ label: string; hours: number }>;
  coursesByStatus: Array<{ status: CourseStatus; label: string; count: number }>;
  courseProgress: Array<{
    id: string;
    name: string;
    progress: number;
    priority: "HIGH" | "MEDIUM" | "LOW";
    remainingHours: number;
  }>;
  studyTypes: Array<{ label: string; hours: number; sessions: number }>;
  platforms: Array<{ label: string; hours: number; courses: number }>;
  deadlines: Array<{ id: string; name: string; date: string; daysRemaining: number }>;
  recentlyCompleted: Array<{ id: string; name: string; date: string }>;
  latestStudies: Array<{ id: string; courseName: string; topic: string; date: string; hours: number; studyType: string }>;
  consistency: Array<{ date: string; hours: number; sessions: number }>;
  forecast: Array<{ id: string; name: string; remainingHours: number; estimatedWeeks: number | null }>;
  summary: {
    topArea: string | null;
    topAreaShare: number;
    studyDays: number;
    topPlatform: string | null;
    monthlyGoalProgress: number;
  };
};
