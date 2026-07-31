import type { CourseKind, CoursePriority, CourseStatus } from "@/types/course";

export type CourseImportSource = "official" | "csv";
export type DuplicateStrategy = "skip" | "update";
export type ImportRowState = "READY" | "DUPLICATE" | "INVALID";

export type RawCourseImportRow = {
  sourceId?: string | number | null;
  name?: unknown;
  kind?: unknown;
  platform?: unknown;
  area?: unknown;
  workloadHours?: unknown;
  status?: unknown;
  priority?: unknown;
  startDate?: unknown;
  targetCompletionDate?: unknown;
  completionDate?: unknown;
  emitsCertificate?: unknown;
  url?: unknown;
  notes?: unknown;
};

export type NormalizedCourseImportRow = {
  sourceId: string | null;
  name: string;
  kind: CourseKind;
  platform: string;
  area: string;
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

export type CourseImportPreviewRow = {
  rowNumber: number;
  sourceId: string | null;
  state: ImportRowState;
  data: NormalizedCourseImportRow | null;
  errors: string[];
  warnings: string[];
  existingCourseId: string | null;
  existingArchived: boolean;
  createsPlatform: boolean;
  createsArea: boolean;
};

export type CourseImportSummary = {
  total: number;
  ready: number;
  duplicates: number;
  invalid: number;
  newPlatforms: string[];
  newAreas: string[];
};

export type CourseImportPreview = {
  importKey: string;
  source: CourseImportSource;
  sourceName: string;
  alreadyImported: boolean;
  summary: CourseImportSummary;
  rows: CourseImportPreviewRow[];
};

export type CourseImportReportRow = {
  rowNumber: number;
  sourceId: string | null;
  name: string;
  result: "IMPORTED" | "UPDATED" | "SKIPPED" | "ERROR";
  message: string;
  courseId: string | null;
};

export type CourseImportReport = {
  importId: string;
  importKey: string;
  source: CourseImportSource;
  sourceName: string;
  totalRows: number;
  importedRows: number;
  updatedRows: number;
  skippedRows: number;
  errorRows: number;
  createdPlatforms: string[];
  createdAreas: string[];
  rows: CourseImportReportRow[];
  completedAt: string;
};
