import type { CourseKind, CoursePriority, CourseStatus } from "@/types/course";
import type { Tone } from "@/components/ui";

export const courseKindLabels: Record<CourseKind, string> = {
  COURSE: "Curso",
  CERTIFICATION: "Certificação",
};

export const courseStatusLabels: Record<CourseStatus, string> = {
  PLANNED: "Planejado",
  NOT_STARTED: "Não iniciado",
  IN_PROGRESS: "Em andamento",
  PAUSED: "Pausado",
  COMPLETED: "Concluído",
  CANCELLED: "Cancelado",
};

export const coursePriorityLabels: Record<CoursePriority, string> = {
  HIGH: "Alta",
  MEDIUM: "Média",
  LOW: "Baixa",
};

export const courseStatusTones: Record<CourseStatus, Tone> = {
  PLANNED: "blue",
  NOT_STARTED: "gray",
  IN_PROGRESS: "orange",
  PAUSED: "purple",
  COMPLETED: "green",
  CANCELLED: "red",
};

export const coursePriorityTones: Record<CoursePriority, Tone> = {
  HIGH: "red",
  MEDIUM: "orange",
  LOW: "green",
};

export const courseStatuses = Object.keys(courseStatusLabels) as CourseStatus[];
export const coursePriorities = Object.keys(coursePriorityLabels) as CoursePriority[];
export const courseKinds = Object.keys(courseKindLabels) as CourseKind[];
