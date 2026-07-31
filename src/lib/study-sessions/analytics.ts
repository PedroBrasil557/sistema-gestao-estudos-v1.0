import type { StudyCourseOption, StudySession } from "@/types/study-session";

export function dateInTimeZone(timezone: string, date = new Date()) {
  try {
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(date);
    const year = parts.find((part) => part.type === "year")?.value;
    const month = parts.find((part) => part.type === "month")?.value;
    const day = parts.find((part) => part.type === "day")?.value;
    if (year && month && day) return `${year}-${month}-${day}`;
  } catch {
    // Fallback below when the saved timezone is invalid in the current runtime.
  }
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function dateFromKey(value: string) {
  const [year, month, day] = value.slice(0, 10).split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day, 12));
}

export function dateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

export function addDays(value: string, amount: number) {
  const date = dateFromKey(value);
  date.setUTCDate(date.getUTCDate() + amount);
  return dateKey(date);
}

export function mondayOf(value: string) {
  const date = dateFromKey(value);
  const weekday = date.getUTCDay();
  const delta = weekday === 0 ? -6 : 1 - weekday;
  date.setUTCDate(date.getUTCDate() + delta);
  return dateKey(date);
}

export function formatShortDate(value: string) {
  const [, month, day] = value.slice(0, 10).split("-");
  return `${day}/${month}`;
}

export function courseProgress(course: StudyCourseOption, studiedHours: number) {
  if (course.status === "COMPLETED") return 100;
  if (!course.workloadHours || course.workloadHours <= 0) return 0;
  return Math.max(0, Math.min(100, (studiedHours / course.workloadHours) * 100));
}

export function generalProgress(courses: StudyCourseOption[], sessions: StudySession[]) {
  const considered = courses.filter((course) => course.status !== "CANCELLED" && course.workloadHours > 0 && !course.archivedAt);
  const totalWorkload = considered.reduce((sum, course) => sum + course.workloadHours, 0);
  if (totalWorkload <= 0) return 0;

  const hoursByCourse = new Map<string, number>();
  for (const session of sessions) {
    if (session.deletedAt) continue;
    hoursByCourse.set(session.course.id, (hoursByCourse.get(session.course.id) ?? 0) + session.studiedHours);
  }

  const consideredHours = considered.reduce((sum, course) => {
    if (course.status === "COMPLETED") return sum + course.workloadHours;
    return sum + Math.min(course.workloadHours, Math.max(0, hoursByCourse.get(course.id) ?? 0));
  }, 0);

  return Math.max(0, Math.min(100, (consideredHours / totalWorkload) * 100));
}

export function currentStreak(sessions: StudySession[], today: string) {
  const daily = new Map<string, number>();
  for (const session of sessions) {
    if (session.deletedAt || session.studyDate > today || session.studiedHours <= 0) continue;
    daily.set(session.studyDate, (daily.get(session.studyDate) ?? 0) + session.studiedHours);
  }

  let cursor = today;
  let atRisk = false;
  if ((daily.get(cursor) ?? 0) <= 0) {
    const yesterday = addDays(today, -1);
    if ((daily.get(yesterday) ?? 0) > 0) {
      cursor = yesterday;
      atRisk = true;
    } else {
      return { days: 0, atRisk: false };
    }
  }

  let days = 0;
  while ((daily.get(cursor) ?? 0) > 0) {
    days += 1;
    cursor = addDays(cursor, -1);
  }
  return { days, atRisk };
}

export function areaTotals(sessions: StudySession[]) {
  const totals = new Map<string, number>();
  for (const session of sessions) {
    if (session.deletedAt || session.studiedHours <= 0) continue;
    const label = session.course.area.name || "Área não informada";
    totals.set(label, (totals.get(label) ?? 0) + session.studiedHours);
  }
  return [...totals.entries()].sort((a, b) => b[1] - a[1]);
}

export function weeklyTotals(sessions: StudySession[], today: string, weeks = 8) {
  const currentMonday = mondayOf(today);
  const result = Array.from({ length: weeks }, (_, index) => {
    const start = addDays(currentMonday, -(weeks - 1 - index) * 7);
    return { start, end: addDays(start, 6), hours: 0 };
  });
  const byStart = new Map(result.map((week) => [week.start, week]));

  for (const session of sessions) {
    if (session.deletedAt || session.studiedHours <= 0 || session.studyDate > today) continue;
    const week = byStart.get(mondayOf(session.studyDate));
    if (week) week.hours += session.studiedHours;
  }
  return result;
}

export function consistencyDays(sessions: StudySession[], today: string, count: number) {
  const safeCount = Math.max(7, Math.min(365, count));
  const totals = new Map<string, { hours: number; sessionCount: number }>();
  for (const session of sessions) {
    if (session.deletedAt || session.studyDate > today) continue;
    const current = totals.get(session.studyDate) ?? { hours: 0, sessionCount: 0 };
    current.hours += session.studiedHours;
    current.sessionCount += 1;
    totals.set(session.studyDate, current);
  }
  return Array.from({ length: safeCount }, (_, index) => {
    const date = addDays(today, -(safeCount - 1 - index));
    const total = totals.get(date) ?? { hours: 0, sessionCount: 0 };
    return { date, ...total };
  });
}
