import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { dateInTimeZone, addDays, dateFromKey } from "@/lib/study-sessions/analytics";
import {
  courseStatusLabels,
  formatPeriodLabel,
  monthLabel,
  monthSequence,
  monthsCovered,
  priorityWeight,
  resolvePeriod,
} from "@/lib/dashboard/calculations";
import type { CourseStatus } from "@/types/course";
import type { DashboardData, DashboardRange } from "@/types/dashboard";


type DashboardCourse = {
  id: string;
  name: string;
  workloadHours: number;
  studiedHours: number;
  status: CourseStatus;
  priority: "HIGH" | "MEDIUM" | "LOW";
  targetCompletionDate: string | null;
  completionDate: string | null;
  platform: string;
  area: string;
};

const validRanges = new Set<DashboardRange>(["7d", "30d", "month", "year", "all", "custom"]);
const validStatuses = new Set<CourseStatus>(["PLANNED", "NOT_STARTED", "IN_PROGRESS", "PAUSED", "COMPLETED", "CANCELLED"]);

function relation(value: unknown): Record<string, unknown> {
  const row = Array.isArray(value) ? value[0] : value;
  return row && typeof row === "object" ? row as Record<string, unknown> : {};
}

function numeric(value: unknown) {
  const number = Number(value ?? 0);
  return Number.isFinite(number) ? number : 0;
}

function inPeriod(date: string | null, start: string | null, end: string | null) {
  if (!date) return false;
  if (start && date < start) return false;
  if (end && date > end) return false;
  return true;
}

function daysBetween(from: string, to: string) {
  return Math.round((dateFromKey(to).getTime() - dateFromKey(from).getTime()) / 86400000);
}

async function allStudySessions(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  courseIds: string[],
  start: string | null,
  end: string | null,
  studyTypeId: string | null,
) {
  if (!courseIds.length) return { data: [] as Record<string, unknown>[], error: null as null | string };
  const pageSize = 900;
  const rows: Record<string, unknown>[] = [];
  for (let from = 0; ; from += pageSize) {
    let query = supabase
      .from("study_sessions")
      .select(`
        id, course_id, study_type_id, study_date, topic, studied_hours, status, updated_at,
        study_type:study_types!study_sessions_study_type_id_fkey(id, name)
      `)
      .eq("user_id", userId)
      .is("deleted_at", null)
      .in("course_id", courseIds);
    if (start) query = query.gte("study_date", start);
    if (end) query = query.lte("study_date", end);
    if (studyTypeId) query = query.eq("study_type_id", studyTypeId);
    const { data, error } = await query.order("study_date", { ascending: true }).range(from, from + pageSize - 1);
    if (error) return { data: rows, error: error.message };
    const batch = (data ?? []) as unknown as Record<string, unknown>[];
    rows.push(...batch);
    if (batch.length < pageSize) break;
  }
  return { data: rows, error: null };
}

async function allCertificates(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  courseIds: string[],
) {
  if (!courseIds.length) return { data: [] as Record<string, unknown>[], error: null as null | string };
  const pageSize = 900;
  const rows: Record<string, unknown>[] = [];
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await supabase
      .from("certificates")
      .select("id, course_id, is_available, issue_date, completion_date, created_at")
      .eq("user_id", userId)
      .is("deleted_at", null)
      .eq("is_available", true)
      .in("course_id", courseIds)
      .range(from, from + pageSize - 1);
    if (error) return { data: rows, error: error.message };
    const batch = (data ?? []) as unknown as Record<string, unknown>[];
    rows.push(...batch);
    if (batch.length < pageSize) break;
  }
  return { data: rows, error: null };
}

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) return NextResponse.json({ message: "Sessão inválida." }, { status: 401 });

  const params = request.nextUrl.searchParams;
  const rawRange = params.get("range") as DashboardRange | null;
  const range: DashboardRange = rawRange && validRanges.has(rawRange) ? rawRange : "month";
  const areaId = params.get("areaId") || null;
  const platformId = params.get("platformId") || null;
  const studyTypeId = params.get("studyTypeId") || null;
  const rawStatus = params.get("courseStatus") as CourseStatus | null;
  const courseStatus = rawStatus && validStatuses.has(rawStatus) ? rawStatus : null;

  const { data: settings } = await supabase
    .from("user_settings")
    .select("timezone, monthly_goal_hours")
    .eq("user_id", authData.user.id)
    .maybeSingle();
  const timezone = typeof settings?.timezone === "string" ? settings.timezone : "America/Sao_Paulo";
  const monthlyGoal = Math.max(0, numeric(settings?.monthly_goal_hours));
  const today = dateInTimeZone(timezone);
  const period = resolvePeriod(range, today, params.get("start"), params.get("end"));

  let coursesQuery = supabase
    .from("courses")
    .select(`
      id, name, kind, workload_hours, studied_hours, status, priority,
      target_completion_date, completion_date, archived_at,
      platform:platforms!courses_platform_id_fkey(id, name),
      area:areas!courses_area_id_fkey(id, name)
    `)
    .eq("user_id", authData.user.id)
    .is("archived_at", null);
  if (areaId) coursesQuery = coursesQuery.eq("area_id", areaId);
  if (platformId) coursesQuery = coursesQuery.eq("platform_id", platformId);
  if (courseStatus) coursesQuery = coursesQuery.eq("status", courseStatus);
  const { data: courseRows, error: coursesError } = await coursesQuery.order("priority").order("name");
  if (coursesError) return NextResponse.json({ message: "Não foi possível carregar os cursos do Dashboard.", details: coursesError.message }, { status: 500 });

  const courses: DashboardCourse[] = ((courseRows ?? []) as unknown as Record<string, unknown>[]).map((row) => {
    const platform = relation(row.platform);
    const area = relation(row.area);
    return {
      id: String(row.id),
      name: String(row.name),
      workloadHours: numeric(row.workload_hours),
      studiedHours: numeric(row.studied_hours),
      status: row.status as CourseStatus,
      priority: (row.priority as "HIGH" | "MEDIUM" | "LOW") ?? "MEDIUM",
      targetCompletionDate: typeof row.target_completion_date === "string" ? row.target_completion_date : null,
      completionDate: typeof row.completion_date === "string" ? row.completion_date : null,
      platform: String(platform.name ?? "Plataforma não informada"),
      area: String(area.name ?? "Área não informada"),
    };
  });
  const courseIds = courses.map((course) => course.id);
  const courseMap = new Map(courses.map((course) => [course.id, course]));

  const [sessionsResult, certificatesResult] = await Promise.all([
    allStudySessions(supabase, authData.user.id, courseIds, period.start, period.end, studyTypeId),
    allCertificates(supabase, authData.user.id, courseIds),
  ]);
  if (sessionsResult.error) return NextResponse.json({ message: "Não foi possível carregar as sessões do Dashboard.", details: sessionsResult.error }, { status: 500 });
  if (certificatesResult.error) return NextResponse.json({ message: "Não foi possível carregar os certificados do Dashboard.", details: certificatesResult.error }, { status: 500 });

  const sessions = sessionsResult.data.map((row) => {
    const type = relation(row.study_type);
    return {
      id: String(row.id),
      courseId: String(row.course_id),
      studyDate: String(row.study_date),
      topic: String(row.topic ?? ""),
      studiedHours: numeric(row.studied_hours),
      status: String(row.status ?? ""),
      updatedAt: String(row.updated_at ?? ""),
      studyType: String(type.name ?? "Tipo não informado"),
    };
  });

  const totalHours = sessions.reduce((sum, session) => sum + session.studiedHours, 0);
  const completedCourses = courses.filter((course) => course.status === "COMPLETED" && (!period.start || inPeriod(course.completionDate, period.start, period.end))).length;
  const inProgressCourses = courses.filter((course) => course.status === "IN_PROGRESS").length;

  const certificatesObtained = certificatesResult.data.filter((certificate) => {
    const rawDate = typeof certificate.issue_date === "string"
      ? certificate.issue_date
      : typeof certificate.completion_date === "string"
        ? certificate.completion_date
        : typeof certificate.created_at === "string"
          ? certificate.created_at.slice(0, 10)
          : null;
    return !period.start || inPeriod(rawDate, period.start, period.end);
  }).length;

  const monthCount = monthsCovered(period.start, period.end, sessions.map((session) => session.studyDate));
  const monthlyAverageHours = totalHours / monthCount;

  const progressCourses = courses.filter((course) => course.status !== "CANCELLED" && course.workloadHours > 0);
  const totalWorkload = progressCourses.reduce((sum, course) => sum + course.workloadHours, 0);
  const progressHours = progressCourses.reduce((sum, course) => {
    if (course.status === "COMPLETED") return sum + course.workloadHours;
    return sum + Math.min(course.workloadHours, Math.max(0, course.studiedHours));
  }, 0);
  const generalProgress = totalWorkload > 0 ? Math.min(100, (progressHours / totalWorkload) * 100) : 0;

  const monthKeys = monthSequence(period.start, period.end, sessions.map((session) => session.studyDate));
  const monthlyMap = new Map(monthKeys.map((key) => [key, 0]));
  for (const session of sessions) {
    const key = session.studyDate.slice(0, 7);
    if (monthlyMap.has(key)) monthlyMap.set(key, (monthlyMap.get(key) ?? 0) + session.studiedHours);
  }
  const monthlyEvolution = monthKeys.map((key) => ({ key, label: monthLabel(key), hours: monthlyMap.get(key) ?? 0 }));

  const areaMap = new Map<string, number>();
  const typeMap = new Map<string, { hours: number; sessions: number }>();
  const platformMap = new Map<string, { hours: number; courses: Set<string> }>();
  for (const session of sessions) {
    const course = courseMap.get(session.courseId);
    if (!course) continue;
    areaMap.set(course.area, (areaMap.get(course.area) ?? 0) + session.studiedHours);
    const type = typeMap.get(session.studyType) ?? { hours: 0, sessions: 0 };
    type.hours += session.studiedHours;
    type.sessions += 1;
    typeMap.set(session.studyType, type);
    const platform = platformMap.get(course.platform) ?? { hours: 0, courses: new Set<string>() };
    platform.hours += session.studiedHours;
    platform.courses.add(course.id);
    platformMap.set(course.platform, platform);
  }
  for (const course of courses) {
    const platform = platformMap.get(course.platform) ?? { hours: 0, courses: new Set<string>() };
    platform.courses.add(course.id);
    platformMap.set(course.platform, platform);
  }

  const statusOrder: CourseStatus[] = ["PLANNED", "NOT_STARTED", "IN_PROGRESS", "PAUSED", "COMPLETED", "CANCELLED"];
  const coursesByStatus = statusOrder.map((status) => ({
    status,
    label: courseStatusLabels[status],
    count: courses.filter((course) => course.status === status).length,
  })).filter((item) => item.count > 0);

  const courseProgress = courses
    .filter((course) => course.status !== "CANCELLED" && course.status !== "COMPLETED")
    .map((course) => ({
      id: course.id,
      name: course.name,
      priority: course.priority,
      progress: course.status === "COMPLETED" ? 100 : course.workloadHours > 0 ? Math.min(100, (course.studiedHours / course.workloadHours) * 100) : 0,
      remainingHours: Math.max(course.workloadHours - course.studiedHours, 0),
    }))
    .sort((a, b) => priorityWeight[a.priority] - priorityWeight[b.priority] || b.progress - a.progress || a.name.localeCompare(b.name, "pt-BR"))
    .slice(0, 8);

  const deadlines = courses
    .filter((course) => course.targetCompletionDate && course.targetCompletionDate >= today && !["COMPLETED", "CANCELLED"].includes(course.status))
    .sort((a, b) => String(a.targetCompletionDate).localeCompare(String(b.targetCompletionDate)))
    .slice(0, 5)
    .map((course) => ({
      id: course.id,
      name: course.name,
      date: course.targetCompletionDate!,
      daysRemaining: daysBetween(today, course.targetCompletionDate!),
    }));

  const recentlyCompleted = courses
    .filter((course) => course.status === "COMPLETED" && course.completionDate)
    .sort((a, b) => String(b.completionDate).localeCompare(String(a.completionDate)))
    .slice(0, 5)
    .map((course) => ({ id: course.id, name: course.name, date: course.completionDate! }));

  const latestStudies = sessions
    .filter((session) => session.studiedHours > 0)
    .sort((a, b) => b.studyDate.localeCompare(a.studyDate) || b.updatedAt.localeCompare(a.updatedAt))
    .slice(0, 5)
    .map((session) => ({
      id: session.id,
      courseName: courseMap.get(session.courseId)?.name ?? "Curso não informado",
      topic: session.topic,
      date: session.studyDate,
      hours: session.studiedHours,
      studyType: session.studyType,
    }));

  const consistencyEnd = period.end ?? today;
  const consistencyStart = period.start && daysBetween(period.start, consistencyEnd) < 74 ? period.start : addDays(consistencyEnd, -74);
  const daily = new Map<string, { hours: number; sessions: number }>();
  for (const session of sessions) {
    if (session.studyDate < consistencyStart || session.studyDate > consistencyEnd) continue;
    const current = daily.get(session.studyDate) ?? { hours: 0, sessions: 0 };
    current.hours += session.studiedHours;
    current.sessions += 1;
    daily.set(session.studyDate, current);
  }
  const consistency: DashboardData["consistency"] = [];
  for (let date = consistencyStart; date <= consistencyEnd; date = addDays(date, 1)) {
    consistency.push({ date, ...(daily.get(date) ?? { hours: 0, sessions: 0 }) });
    if (consistency.length >= 75) break;
  }

  const weeklyHours = totalHours > 0 && period.start && period.end
    ? totalHours / Math.max(1, (daysBetween(period.start, period.end) + 1) / 7)
    : totalHours > 0
      ? totalHours / Math.max(1, new Set(sessions.map((session) => session.studyDate.slice(0, 7))).size * 4.345)
      : 0;
  const forecast = courseProgress.slice(0, 5).map((course) => ({
    id: course.id,
    name: course.name,
    remainingHours: course.remainingHours,
    estimatedWeeks: weeklyHours > 0 ? Math.max(1, Math.ceil(course.remainingHours / weeklyHours)) : null,
  }));

  const hoursByArea = [...areaMap.entries()].sort((a, b) => b[1] - a[1]).map(([label, hours]) => ({ label, hours }));
  const studyTypes = [...typeMap.entries()].sort((a, b) => b[1].hours - a[1].hours).map(([label, value]) => ({ label, ...value }));
  const platforms = [...platformMap.entries()].sort((a, b) => b[1].hours - a[1].hours || b[1].courses.size - a[1].courses.size).map(([label, value]) => ({ label, hours: value.hours, courses: value.courses.size }));
  const topArea = hoursByArea[0] ?? null;
  const topPlatform = platforms[0] ?? null;
  const studyDays = new Set(sessions.filter((session) => session.studiedHours > 0).map((session) => session.studyDate)).size;

  const monthStart = `${today.slice(0, 7)}-01`;
  const { data: currentMonthRows } = await supabase
    .from("study_sessions")
    .select("studied_hours")
    .eq("user_id", authData.user.id)
    .is("deleted_at", null)
    .gte("study_date", monthStart)
    .lte("study_date", today);
  const monthHours = ((currentMonthRows ?? []) as Array<{ studied_hours: unknown }>).reduce((sum: number, row) => sum + numeric(row.studied_hours), 0);

  const payload: DashboardData = {
    period: {
      label: formatPeriodLabel(range, period.start, period.end),
      start: period.start,
      end: period.end,
    },
    metrics: {
      totalHours,
      completedCourses,
      inProgressCourses,
      certificatesObtained,
      monthlyAverageHours,
      generalProgress,
    },
    monthlyEvolution,
    hoursByArea,
    coursesByStatus,
    courseProgress,
    studyTypes,
    platforms,
    deadlines,
    recentlyCompleted,
    latestStudies,
    consistency,
    forecast,
    summary: {
      topArea: topArea?.label ?? null,
      topAreaShare: topArea && totalHours > 0 ? (topArea.hours / totalHours) * 100 : 0,
      studyDays,
      topPlatform: topPlatform?.label ?? null,
      monthlyGoalProgress: monthlyGoal > 0 ? (monthHours / monthlyGoal) * 100 : 0,
    },
  };

  return NextResponse.json({ dashboard: payload });
}
