import type { Metadata } from "next";
import { PageHeader } from "@/components/page-header";
import { SettingsCenter } from "@/components/settings/settings-center";
import { createClient } from "@/lib/supabase/server";
import { defaultUserSettings, mapSettingsRow } from "@/lib/settings/defaults";
import { mapListItem } from "@/lib/settings/lists";
import type { ConfigurableLists } from "@/types/settings";

export const metadata: Metadata = { title: "Configurações" };

const emptyLists: ConfigurableLists = {
  platforms: [],
  areas: [],
  "study-types": [],
  "note-categories": [],
};

export default async function ConfiguracoesPage() {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  const userId = authData.user?.id;

  let settings = defaultUserSettings;
  let lists = emptyLists;
  let databaseReady = false;

  if (userId) {
    const [settingsResult, platformsResult, areasResult, studyTypesResult, noteCategoriesResult] = await Promise.all([
      supabase.from("user_settings").select("*").eq("user_id", userId).maybeSingle(),
      supabase.from("platforms").select("id, name, is_system, archived_at").eq("user_id", userId).order("name"),
      supabase.from("areas").select("id, name, is_system, archived_at").eq("user_id", userId).order("name"),
      supabase.from("study_types").select("id, name, is_system, archived_at").eq("user_id", userId).order("name"),
      supabase.from("note_categories").select("id, name, color, is_system, archived_at").eq("user_id", userId).order("name"),
    ]);

    databaseReady = !settingsResult.error && !platformsResult.error && !areasResult.error && !studyTypesResult.error && !noteCategoriesResult.error;

    if (databaseReady) {
      settings = mapSettingsRow(settingsResult.data);
      lists = {
        platforms: (platformsResult.data ?? []).map((row: Record<string, unknown>) => mapListItem(row)),
        areas: (areasResult.data ?? []).map((row: Record<string, unknown>) => mapListItem(row)),
        "study-types": (studyTypesResult.data ?? []).map((row: Record<string, unknown>) => mapListItem(row)),
        "note-categories": (noteCategoriesResult.data ?? []).map((row: Record<string, unknown>) => mapListItem(row)),
      };
    }
  }

  return (
    <>
      <PageHeader title="Configurações" subtitle="Personalize sua experiência e gerencie preferências salvas no Supabase." />
      <div className="content settings-content">
        <SettingsCenter initialSettings={settings} initialLists={lists} databaseReady={databaseReady} />
      </div>
    </>
  );
}
