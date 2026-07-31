import { notFound } from "next/navigation";
import { CourseDetailClient } from "@/components/courses/course-detail-client";
import { PageHeader } from "@/components/page-header";
import { courseSelect, mapCourseRow } from "@/lib/courses/mappers";
import { mapStudySessionRow, studySessionSelect } from "@/lib/study-sessions/mappers";
import { mapNoteRow, noteSelect } from "@/lib/notes/mappers";
import { mapCertificateRow, certificateSelect } from "@/lib/certificates/mappers";
import { createClient } from "@/lib/supabase/server";

export default async function CourseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) notFound();

  const [courseResult, platformsResult, areasResult, settingsResult, sessionsResult, notesResult, certificatesResult] = await Promise.all([
    supabase.from("courses").select(courseSelect).eq("id", id).eq("user_id", authData.user.id).is("archived_at", null).maybeSingle(),
    supabase.from("platforms").select("id, name").eq("user_id", authData.user.id).is("archived_at", null).order("name"),
    supabase.from("areas").select("id, name").eq("user_id", authData.user.id).is("archived_at", null).order("name"),
    supabase.from("user_settings").select("current_course_id").eq("user_id", authData.user.id).maybeSingle(),
    supabase.from("study_sessions").select(studySessionSelect).eq("user_id", authData.user.id).eq("course_id", id).is("deleted_at", null).order("study_date", { ascending: false }).order("updated_at", { ascending: false }).limit(10),
    supabase.from("notes").select(noteSelect).eq("user_id", authData.user.id).eq("course_id", id).is("deleted_at", null).order("note_date", { ascending: false }).order("updated_at", { ascending: false }).limit(5),
    supabase.from("certificates").select(certificateSelect).eq("user_id", authData.user.id).eq("course_id", id).is("deleted_at", null).order("issue_date", { ascending: false, nullsFirst: false }).limit(5),
  ]);

  if (!courseResult.data) notFound();
  const course = mapCourseRow(courseResult.data as unknown as Record<string, unknown>);
  const platforms = (platformsResult.data ?? []).map((row: { id: unknown; name: unknown }) => ({ id: String(row.id), name: String(row.name) }));
  const areas = (areasResult.data ?? []).map((row: { id: unknown; name: unknown }) => ({ id: String(row.id), name: String(row.name) }));
  const sessions = (sessionsResult.data ?? []).map((row: unknown) => mapStudySessionRow(row as Record<string, unknown>));
  const notes = (notesResult.data ?? []).map((row: unknown) => mapNoteRow(row as Record<string, unknown>));
  const certificates = (certificatesResult.data ?? []).map((row: unknown) => mapCertificateRow(row as Record<string, unknown>));
  return (<>
    <PageHeader title="Detalhes do curso" subtitle="Acompanhe dados, progresso e informações do registro." />
    <CourseDetailClient initialCourse={course} platforms={platforms} areas={areas} isCurrent={settingsResult.data?.current_course_id === course.id} initialSessions={sessions} initialNotes={notes} initialCertificates={certificates} />
  </>);
}
