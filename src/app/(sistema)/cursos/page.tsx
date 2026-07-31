import { CoursesManager } from "@/components/courses/courses-manager";
import { courseSelect, mapCourseRow } from "@/lib/courses/mappers";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import type { Course, CourseListOption } from "@/types/course";

export default async function CursosPage() {
  let courses: Course[] = [];
  let platforms: CourseListOption[] = [];
  let areas: CourseListOption[] = [];
  let databaseReady = false;
  let importReady = false;
  let currentCourseId: string | null = null;

  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    const { data: authData } = await supabase.auth.getUser();
    if (authData.user) {
      const [coursesResult, platformsResult, areasResult, settingsResult, importsResult] = await Promise.all([
        supabase.from("courses").select(courseSelect).eq("user_id", authData.user.id).order("created_at", { ascending: false }),
        supabase.from("platforms").select("id, name").eq("user_id", authData.user.id).is("archived_at", null).order("name"),
        supabase.from("areas").select("id, name").eq("user_id", authData.user.id).is("archived_at", null).order("name"),
        supabase.from("user_settings").select("current_course_id").eq("user_id", authData.user.id).maybeSingle(),
        supabase.from("course_imports").select("id").eq("user_id", authData.user.id).limit(1),
      ]);

      databaseReady = !coursesResult.error && !platformsResult.error && !areasResult.error;
      importReady = !importsResult.error;
      courses = (coursesResult.data ?? []).map((row: unknown) => mapCourseRow(row as Record<string, unknown>));
      platforms = (platformsResult.data ?? []).map((row: { id: unknown; name: unknown }) => ({ id: String(row.id), name: String(row.name) }));
      areas = (areasResult.data ?? []).map((row: { id: unknown; name: unknown }) => ({ id: String(row.id), name: String(row.name) }));
      currentCourseId = typeof settingsResult.data?.current_course_id === "string" ? settingsResult.data.current_course_id : null;
    }
  }

  return <CoursesManager initialCourses={courses} platforms={platforms} areas={areas} databaseReady={databaseReady} importReady={importReady} currentCourseId={currentCourseId} />;
}
