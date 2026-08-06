import type { CourseGroup, CoursePriority, CourseStatus } from "@/types/course";

export type SessionStatus = "PLANNED" | "IN_PROGRESS" | "COMPLETED" | "PAUSED" | "CANCELLED";
export type LanguageSkill = "READING" | "WRITING" | "SPEAKING" | "LISTENING" | "PRONUNCIATION" | "GRAMMAR" | "VOCABULARY" | "REVIEW";

export type StudyCourseOption = {
  id: string;
  name: string;
  group: CourseGroup;
  color: string;
  icon: string;
  weeklyGoalMinutes: number;
  status: CourseStatus;
  priority: CoursePriority;
  archivedAt: string | null;
  workloadHours: number;
  studiedHours: number;
  targetCompletionDate: string | null;
  platform: { id: string; name: string };
  area: { id: string; name: string };
};

export type StudyTypeOption = {
  id: string;
  name: string;
};

export type StudySession = {
  id: string;
  studyDate: string;
  scheduledTime: string | null;
  topic: string;
  plannedHours: number | null;
  studiedHours: number;
  status: SessionStatus;
  languageSkill: LanguageSkill | null;
  resource: string | null;
  recurrenceRule: string | null;
  reminderAt: string | null;
  notes: string | null;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
  course: {
    id: string;
    name: string;
    group: CourseGroup;
    color: string;
    icon: string;
    weeklyGoalMinutes: number;
    status: CourseStatus;
    priority: CoursePriority;
    workloadHours: number;
    studiedHours: number;
    area: {
      id: string;
      name: string;
    };
  };
  studyType: StudyTypeOption;
};

export type StudySessionInput = {
  studyDate: string;
  scheduledTime: string | null;
  courseId: string;
  topic: string;
  plannedHours: number | null;
  studiedHours: number;
  status: SessionStatus;
  languageSkill: LanguageSkill | null;
  studyTypeId: string;
  resource: string | null;
  recurrenceRule: string | null;
  reminderAt: string | null;
  notes: string | null;
};
