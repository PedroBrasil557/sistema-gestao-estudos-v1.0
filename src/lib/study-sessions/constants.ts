import type { Tone } from "@/components/ui";
import type { SessionStatus } from "@/types/study-session";

export const sessionStatuses: SessionStatus[] = ["PLANNED", "IN_PROGRESS", "COMPLETED", "PAUSED", "CANCELLED"];

export const sessionStatusLabels: Record<SessionStatus, string> = {
  PLANNED: "Planejado",
  IN_PROGRESS: "Em andamento",
  COMPLETED: "Concluído",
  PAUSED: "Pausado",
  CANCELLED: "Cancelado",
};

export const sessionStatusTones: Record<SessionStatus, Tone> = {
  PLANNED: "blue",
  IN_PROGRESS: "orange",
  COMPLETED: "green",
  PAUSED: "purple",
  CANCELLED: "gray",
};
