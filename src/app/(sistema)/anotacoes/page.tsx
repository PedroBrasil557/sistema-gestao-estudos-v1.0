import { NotesManager } from "@/components/notes/notes-manager";
import { mapNoteRow, noteSelect } from "@/lib/notes/mappers";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import type { Note, NoteCategoryOption, NoteCourseOption } from "@/types/note";

export default async function AnotacoesPage({ searchParams }: { searchParams: Promise<{ curso?: string; novo?: string }> }) {
  const params = await searchParams;
  let notes: Note[] = [];
  let courses: NoteCourseOption[] = [];
  let categories: NoteCategoryOption[] = [];
  let databaseReady = false;

  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    const { data: authData } = await supabase.auth.getUser();
    if (authData.user) {
      const [notesResult, coursesResult, categoriesResult] = await Promise.all([
        supabase.from("notes").select(noteSelect).eq("user_id", authData.user.id).order("note_date", { ascending: false }).order("updated_at", { ascending: false }).limit(1000),
        supabase.from("courses").select("id, name, color, icon, course_group").eq("user_id", authData.user.id).is("archived_at", null).order("name"),
        supabase.from("note_categories").select("id, name, color").eq("user_id", authData.user.id).is("archived_at", null).order("name"),
      ]);

      databaseReady = !notesResult.error && !coursesResult.error && !categoriesResult.error;
      notes = (notesResult.data ?? []).map((row: unknown) => mapNoteRow(row as Record<string, unknown>));
      courses = (coursesResult.data ?? []).map((row: { id: unknown; name: unknown; color?: unknown; icon?: unknown; course_group?: unknown }) => ({ id: String(row.id), name: String(row.name), color: typeof row.color === "string" ? row.color : "#2F6BFF", icon: typeof row.icon === "string" ? row.icon : "book-open", group: row.course_group === "LANGUAGE" ? "LANGUAGE" : "PROFESSIONAL" }));
      categories = (categoriesResult.data ?? []).map((row: { id: unknown; name: unknown; color?: unknown }) => ({ id: String(row.id), name: String(row.name), color: typeof row.color === "string" ? row.color : "#7C3AED" }));
    }
  }

  const requestedCourseId = typeof params.curso === "string" && courses.some((course) => course.id === params.curso) ? params.curso : null;

  return <NotesManager initialNotes={notes} courses={courses} categories={categories} databaseReady={databaseReady} defaultCourseId={requestedCourseId} initialOpen={params.novo === "1"} />;
}
