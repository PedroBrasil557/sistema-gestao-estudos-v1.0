import { DashboardManager } from "@/components/dashboard/dashboard-manager";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import type { DashboardFilterOption } from "@/types/dashboard";

export default async function DashboardPage() {
  let areas: DashboardFilterOption[] = [];
  let platforms: DashboardFilterOption[] = [];
  let studyTypes: DashboardFilterOption[] = [];
  let databaseReady = false;
  let rememberFilters = true;

  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    const { data: authData } = await supabase.auth.getUser();
    if (authData.user) {
      const [areasResult, platformsResult, typesResult, settingsResult] = await Promise.all([
        supabase.from("areas").select("id, name").eq("user_id", authData.user.id).is("archived_at", null).order("name"),
        supabase.from("platforms").select("id, name").eq("user_id", authData.user.id).is("archived_at", null).order("name"),
        supabase.from("study_types").select("id, name").eq("user_id", authData.user.id).is("archived_at", null).order("name"),
        supabase.from("user_settings").select("remember_filters").eq("user_id", authData.user.id).maybeSingle(),
      ]);

      databaseReady = !areasResult.error && !platformsResult.error && !typesResult.error && !settingsResult.error;
      areas = ((areasResult.data ?? []) as Array<{ id: unknown; name: unknown }>).map((row) => ({ id: String(row.id), name: String(row.name) }));
      platforms = ((platformsResult.data ?? []) as Array<{ id: unknown; name: unknown }>).map((row) => ({ id: String(row.id), name: String(row.name) }));
      studyTypes = ((typesResult.data ?? []) as Array<{ id: unknown; name: unknown }>).map((row) => ({ id: String(row.id), name: String(row.name) }));
      rememberFilters = settingsResult.data?.remember_filters !== false;
    }
  }

  return (
    <DashboardManager
      areas={areas}
      platforms={platforms}
      studyTypes={studyTypes}
      databaseReady={databaseReady}
      rememberFilters={rememberFilters}
    />
  );
}
