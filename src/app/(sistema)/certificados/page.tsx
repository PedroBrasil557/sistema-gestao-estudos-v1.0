import { CertificatesManager } from "@/components/certificates/certificates-manager";
import { certificateSelect, mapCertificateRow } from "@/lib/certificates/mappers";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import type { Certificate, CertificateCourse } from "@/types/certificate";

function relation(value: unknown) {
  const row = Array.isArray(value) ? value[0] : value;
  const object = row && typeof row === "object" ? row as Record<string, unknown> : {};
  return { id: String(object.id ?? ""), name: String(object.name ?? "Não informado") };
}

export default async function CertificadosPage({ searchParams }: { searchParams: Promise<{ curso?: string; novo?: string }> }) {
  const params = await searchParams;
  let certificates: Certificate[] = [];
  let courses: CertificateCourse[] = [];
  let annualGoal = 12;
  let trackingYear = new Date().getFullYear();
  let databaseReady = false;

  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    const { data: authData } = await supabase.auth.getUser();
    if (authData.user) {
      const [certificatesResult, coursesResult, settingsResult] = await Promise.all([
        supabase.from("certificates").select(certificateSelect).eq("user_id", authData.user.id).order("issue_date", { ascending: false, nullsFirst: false }).order("created_at", { ascending: false }).limit(1000),
        supabase.from("courses").select(`id,name,kind,workload_hours,completion_date,target_completion_date,status,emits_certificate,platform:platforms!courses_platform_id_fkey(id,name),area:areas!courses_area_id_fkey(id,name)`).eq("user_id", authData.user.id).is("archived_at", null).order("name"),
        supabase.from("user_settings").select("annual_certificate_goal,tracking_year").eq("user_id", authData.user.id).maybeSingle(),
      ]);
      databaseReady = !certificatesResult.error && !coursesResult.error;
      certificates = (certificatesResult.data ?? []).map((row: unknown) => mapCertificateRow(row as Record<string, unknown>));
      courses = (coursesResult.data ?? []).map((row: Record<string, unknown>) => ({
        id: String(row.id ?? ""),
        name: String(row.name ?? ""),
        kind: row.kind === "CERTIFICATION" ? "CERTIFICATION" : "COURSE",
        workloadHours: Number(row.workload_hours ?? 0) || 0,
        completionDate: typeof row.completion_date === "string" ? row.completion_date : null,
        targetCompletionDate: typeof row.target_completion_date === "string" ? row.target_completion_date : null,
        status: String(row.status ?? ""),
        emitsCertificate: Boolean(row.emits_certificate),
        platform: relation(row.platform),
        area: relation(row.area),
      }));
      if (settingsResult.data) {
        const savedGoal = Number(settingsResult.data.annual_certificate_goal ?? 12);
        annualGoal = Number.isFinite(savedGoal) ? savedGoal : 12;
        const savedYear = Number(settingsResult.data.tracking_year ?? trackingYear);
        trackingYear = Number.isFinite(savedYear) && savedYear > 2000 ? savedYear : trackingYear;
      }
    }
  }

  const requestedCourseId = typeof params.curso === "string" && courses.some((course) => course.id === params.curso) ? params.curso : null;
  return <CertificatesManager initialCertificates={certificates} courses={courses} annualGoal={annualGoal} trackingYear={trackingYear} databaseReady={databaseReady} defaultCourseId={requestedCourseId} initialOpen={params.novo === "1"} />;
}
