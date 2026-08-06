import { StudySessionsManager } from "@/components/study-sessions/study-sessions-manager";
import { mapStudySessionRow, studySessionSelect } from "@/lib/study-sessions/mappers";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import type { StudyCourseOption, StudySession, StudyTypeOption } from "@/types/study-session";

function relation(value: unknown): Record<string, unknown> {
  const row = Array.isArray(value) ? value[0] : value;
  return row && typeof row === "object" ? row as Record<string, unknown> : {};
}

export default async function EstudosPage({ searchParams }: { searchParams: Promise<{ curso?: string; novo?: string; planejar?: string }> }) {
  const params = await searchParams;
  let sessions: StudySession[] = [];
  let courses: StudyCourseOption[] = [];
  let studyTypes: StudyTypeOption[] = [];
  let databaseReady = false;
  let monthlyGoalHours = 40;
  let currentCourseId: string | null = null;
  let timezone = "America/Sao_Paulo";
  let configuredConsistencyDays = 30;

  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    const { data: authData } = await supabase.auth.getUser();
    if (authData.user) {
      const [sessionsResult, coursesResult, typesResult, settingsResult] = await Promise.all([
        supabase.from("study_sessions").select(studySessionSelect).eq("user_id", authData.user.id).order("study_date", { ascending: false }).order("updated_at", { ascending: false }),
        supabase.from("courses").select(`
          id,
          name,
          status,
          priority,
          course_group,
          color,
          icon,
          weekly_goal_minutes,
          archived_at,
          workload_hours,
          studied_hours,
          target_completion_date,
          platform:platforms!courses_platform_id_fkey(id, name),
          area:areas!courses_area_id_fkey(id, name)
        `).eq("user_id", authData.user.id).is("archived_at", null).order("name"),
        supabase.from("study_types").select("id, name").eq("user_id", authData.user.id).is("archived_at", null).order("name"),
        supabase.from("user_settings").select("monthly_goal_hours, current_course_id, timezone, consistency_days").eq("user_id", authData.user.id).maybeSingle(),
      ]);

      databaseReady = !sessionsResult.error && !coursesResult.error && !typesResult.error && !settingsResult.error;
      sessions = (sessionsResult.data ?? []).map((row: unknown) => mapStudySessionRow(row as Record<string, unknown>));
      courses = (coursesResult.data ?? []).map((row: Record<string, unknown>) => {
        const platform = relation(row.platform);
        const area = relation(row.area);
        return {
          id: String(row.id),
          name: String(row.name),
          status: row.status as StudyCourseOption["status"],
          priority: row.priority as StudyCourseOption["priority"],
          group: row.course_group === "LANGUAGE" ? "LANGUAGE" : "PROFESSIONAL",
          color: typeof row.color === "string" ? row.color : "#2F6BFF",
          icon: typeof row.icon === "string" ? row.icon : "book-open",
          weeklyGoalMinutes: Number(row.weekly_goal_minutes ?? 0),
          archivedAt: typeof row.archived_at === "string" ? row.archived_at : null,
          workloadHours: Number(row.workload_hours ?? 0),
          studiedHours: Number(row.studied_hours ?? 0),
          targetCompletionDate: typeof row.target_completion_date === "string" ? row.target_completion_date : null,
          platform: { id: String(platform.id ?? ""), name: String(platform.name ?? "Plataforma não informada") },
          area: { id: String(area.id ?? ""), name: String(area.name ?? "Área não informada") },
        } satisfies StudyCourseOption;
      });
      studyTypes = (typesResult.data ?? []).map((row: { id: unknown; name: unknown }) => ({ id: String(row.id), name: String(row.name) }));
      monthlyGoalHours = Number(settingsResult.data?.monthly_goal_hours ?? 40);
      currentCourseId = typeof settingsResult.data?.current_course_id === "string" ? settingsResult.data.current_course_id : null;
      timezone = typeof settingsResult.data?.timezone === "string" ? settingsResult.data.timezone : "America/Sao_Paulo";
      configuredConsistencyDays = Number(settingsResult.data?.consistency_days ?? 30);
    }
  }

  const requestedCourseId = typeof params.curso === "string" && courses.some((course) => course.id === params.curso) ? params.curso : null;
  const savedCurrentCourseId = currentCourseId && courses.some((course) => course.id === currentCourseId) ? currentCourseId : null;

  return (
    <StudySessionsManager
      initialSessions={sessions}
      courses={courses}
      studyTypes={studyTypes}
      databaseReady={databaseReady}
      monthlyGoalHours={monthlyGoalHours}
      currentCourseId={requestedCourseId ?? savedCurrentCourseId}
      defaultCourseId={requestedCourseId ?? savedCurrentCourseId}
      timezone={timezone}
      consistencyDays={configuredConsistencyDays}
      initialOpen={params.novo === "1" || params.planejar === "1"}
      initialMode={params.planejar === "1" ? "plan" : "register"}
    />
  );
}
