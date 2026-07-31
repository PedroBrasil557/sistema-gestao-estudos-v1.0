export type CourseKind = "COURSE" | "CERTIFICATION";
export type CourseStatus = "PLANNED" | "NOT_STARTED" | "IN_PROGRESS" | "PAUSED" | "COMPLETED" | "CANCELLED";
export type CoursePriority = "HIGH" | "MEDIUM" | "LOW";

export type CourseListOption = {
  id: string;
  name: string;
};

export type Course = {
  id: string;
  name: string;
  kind: CourseKind;
  platform: CourseListOption;
  area: CourseListOption;
  workloadHours: number;
  studiedHours: number;
  progress: number;
  status: CourseStatus;
  priority: CoursePriority;
  startDate: string | null;
  targetCompletionDate: string | null;
  completionDate: string | null;
  emitsCertificate: boolean;
  url: string | null;
  notes: string | null;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CourseInput = {
  name: string;
  kind: CourseKind;
  platformId: string;
  areaId: string;
  workloadHours: number;
  status: CourseStatus;
  priority: CoursePriority;
  startDate: string | null;
  targetCompletionDate: string | null;
  completionDate: string | null;
  emitsCertificate: boolean;
  url: string | null;
  notes: string | null;
};
