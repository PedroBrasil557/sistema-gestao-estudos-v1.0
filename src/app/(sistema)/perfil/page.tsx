import type { Metadata } from "next";
import { PageHeader } from "@/components/page-header";
import { AccountSettings } from "@/components/account/account-settings";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export const metadata: Metadata = { title: "Meu perfil" };

export default async function ProfilePage() {
  let name = "Paula Roberta";
  let email = "modo-demonstracao@local";
  let avatarUrl = "";

  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    if (data.user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("name, avatar_url")
        .eq("id", data.user.id)
        .maybeSingle();

      name = String(profile?.name ?? data.user.user_metadata?.name ?? data.user.email?.split("@")[0] ?? "Usuário");
      email = data.user.email ?? "";
      avatarUrl = typeof profile?.avatar_url === "string"
        ? profile.avatar_url
        : typeof data.user.user_metadata?.avatar_url === "string"
          ? data.user.user_metadata.avatar_url
          : "";
    }
  }

  return (
    <>
      <PageHeader title="Meu perfil" subtitle="Gerencie seus dados de acesso e a segurança da conta." />
      <div className="content profile-content">
        <AccountSettings initialName={name} initialEmail={email} initialAvatarUrl={avatarUrl} />
      </div>
    </>
  );
}
