import type { CoursePriority, CourseStatus } from "@/types/course";

export type SessionStatus = "PLANNED" | "IN_PROGRESS" | "COMPLETED" | "PAUSED" | "CANCELLED";

export type StudyCourseOption = {
  id: string;
  name: string;
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
  topic: string;
  plannedHours: number | null;
  studiedHours: number;
  status: SessionStatus;
  notes: string | null;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
  course: {
    id: string;
    name: string;
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
  courseId: string;
  topic: string;
  plannedHours: number | null;
  studiedHours: number;
  status: SessionStatus;
  studyTypeId: string;
  notes: string | null;
};
