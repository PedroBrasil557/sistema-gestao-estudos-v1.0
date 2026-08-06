import { CoursesManager } from "@/components/courses/courses-manager";
import { courseSelect, mapCourseRow } from "@/lib/courses/mappers";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import { dateInTimeZone } from "@/lib/study-sessions/analytics";
import type { Course, CourseListOption } from "@/types/course";

export default async function CursosPage() {
  let courses: Course[] = [];
  let platforms: CourseListOption[] = [];
  let areas: CourseListOption[] = [];
  let databaseReady = false;
  let importReady = false;
  let currentCourseId: string | null = null;
  let weeklyStudiedHours = 0;
  let weeklyHoursByCourse: Record<string, number> = {};

  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    const { data: authData } = await supabase.auth.getUser();
    if (authData.user) {
      const settingsResult = await supabase.from("user_settings").select("current_course_id, timezone").eq("user_id", authData.user.id).maybeSingle();
      const timezone = typeof settingsResult.data?.timezone === "string" ? settingsResult.data.timezone : "America/Sao_Paulo";
      const today = dateInTimeZone(timezone);
      const base = new Date(`${today}T12:00:00Z`);
      const day = (base.getUTCDay() + 6) % 7;
      base.setUTCDate(base.getUTCDate() - day);
      const monday = base.toISOString().slice(0, 10);
      const [coursesResult, platformsResult, areasResult, importsResult, weeklyResult] = await Promise.all([
        supabase.from("courses").select(courseSelect).eq("user_id", authData.user.id).order("created_at", { ascending: false }),
        supabase.from("platforms").select("id, name").eq("user_id", authData.user.id).is("archived_at", null).order("name"),
        supabase.from("areas").select("id, name").eq("user_id", authData.user.id).is("archived_at", null).order("name"),
        supabase.from("course_imports").select("id").eq("user_id", authData.user.id).limit(1),
        supabase.from("study_sessions").select("course_id, studied_hours").eq("user_id", authData.user.id).gte("study_date", monday).is("deleted_at", null),
      ]);

      databaseReady = !coursesResult.error && !platformsResult.error && !areasResult.error;
      importReady = !importsResult.error;
      courses = (coursesResult.data ?? []).map((row: unknown) => mapCourseRow(row as Record<string, unknown>));
      platforms = (platformsResult.data ?? []).map((row: { id: unknown; name: unknown }) => ({ id: String(row.id), name: String(row.name) }));
      areas = (areasResult.data ?? []).map((row: { id: unknown; name: unknown }) => ({ id: String(row.id), name: String(row.name) }));
      currentCourseId = typeof settingsResult.data?.current_course_id === "string" ? settingsResult.data.current_course_id : null;
      weeklyStudiedHours = (weeklyResult.data ?? []).reduce((sum: number, row: { studied_hours: unknown }) => sum + Number(row.studied_hours ?? 0), 0);
      weeklyHoursByCourse = (weeklyResult.data ?? []).reduce((map: Record<string, number>, row: { course_id?: unknown; studied_hours: unknown }) => {
        const courseId = String(row.course_id ?? "");
        if (courseId) map[courseId] = (map[courseId] ?? 0) + Number(row.studied_hours ?? 0);
        return map;
      }, {});
    }
  }

  return <CoursesManager initialCourses={courses} platforms={platforms} areas={areas} databaseReady={databaseReady} importReady={importReady} currentCourseId={currentCourseId} weeklyStudiedHours={weeklyStudiedHours} weeklyHoursByCourse={weeklyHoursByCourse} />;
}
