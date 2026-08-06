import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { defaultUserSettings, mapSettingsRow } from "@/lib/settings/defaults";

export default async function SystemLayout({ children }: { children: ReactNode }) {
  let user = {
    name: "Paula Roberta",
    email: "modo-demonstracao@local",
    avatarUrl: null as string | null,
  };
  let appearance = {
    theme: defaultUserSettings.theme,
    accentColor: defaultUserSettings.accentColor,
    interfaceDensity: defaultUserSettings.interfaceDensity,
    rounding: defaultUserSettings.rounding,
    sidebarColor: defaultUserSettings.sidebarColor,
    buttonColor: defaultUserSettings.buttonColor,
    cardTone: defaultUserSettings.cardTone,
  };

  const configured = isSupabaseConfigured();

  if (configured) {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    if (!data.user) {
      redirect("/entrar");
    }

    const [profileResult, settingsResult] = await Promise.all([
      supabase.from("profiles").select("name, avatar_url").eq("id", data.user.id).maybeSingle(),
      supabase.from("user_settings").select("theme, accent_color, interface_density, rounding, sidebar_color, button_color, card_tone").eq("user_id", data.user.id).maybeSingle(),
    ]);

    user = {
      name: String(profileResult.data?.name ?? data.user.user_metadata?.name ?? data.user.email?.split("@")[0] ?? "Usuário"),
      email: data.user.email ?? "",
      avatarUrl: typeof profileResult.data?.avatar_url === "string"
        ? profileResult.data.avatar_url
        : typeof data.user.user_metadata?.avatar_url === "string"
          ? data.user.user_metadata.avatar_url
          : null,
    };

    if (!settingsResult.error && settingsResult.data) {
      const mapped = mapSettingsRow(settingsResult.data);
      appearance = {
        theme: mapped.theme,
        accentColor: mapped.accentColor,
        interfaceDensity: mapped.interfaceDensity,
        rounding: mapped.rounding,
        sidebarColor: mapped.sidebarColor,
        buttonColor: mapped.buttonColor,
        cardTone: mapped.cardTone,
      };
    }
  }

  return (
    <AppShell user={user} supabaseConfigured={configured} appearance={appearance}>
      {children}
    </AppShell>
  );
}
