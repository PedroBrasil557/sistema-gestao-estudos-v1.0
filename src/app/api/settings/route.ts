import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { defaultUserSettings, mapSettingsRow, settingsToDatabase } from "@/lib/settings/defaults";
import type { UserSettings } from "@/types/settings";

function isHexColor(value: string) {
  return /^#[0-9a-fA-F]{6}$/.test(value);
}

function validateSettings(input: Partial<UserSettings>): string | null {
  if (input.monthlyGoalHours !== undefined && (!Number.isFinite(input.monthlyGoalHours) || input.monthlyGoalHours <= 0 || input.monthlyGoalHours > 744)) {
    return "A meta mensal deve estar entre 0,01 e 744 horas.";
  }
  if (input.annualCertificateGoal !== undefined && (!Number.isInteger(input.annualCertificateGoal) || input.annualCertificateGoal < 0 || input.annualCertificateGoal > 999)) {
    return "A meta anual de certificados deve estar entre 0 e 999.";
  }
  if (input.trackingYear !== undefined && (!Number.isInteger(input.trackingYear) || input.trackingYear < 2000 || input.trackingYear > 2100)) {
    return "Informe um ano de acompanhamento válido.";
  }
  if (input.consistencyDays !== undefined && (!Number.isInteger(input.consistencyDays) || input.consistencyDays < 7 || input.consistencyDays > 365)) {
    return "O calendário de consistência deve ter entre 7 e 365 dias.";
  }
  for (const [label, value] of [["cor principal", input.accentColor], ["cor do menu", input.sidebarColor], ["cor dos botões", input.buttonColor]] as const) {
    if (value !== undefined && !isHexColor(value)) return `A ${label} deve estar no formato hexadecimal.`;
  }
  if (input.cardTone !== undefined && !["soft", "neutral", "vivid"].includes(input.cardTone)) return "Selecione uma tonalidade de cartões válida.";
  return null;
}

export async function GET() {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();

  if (!authData.user) {
    return NextResponse.json({ message: "Sessão inválida." }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("user_settings")
    .select("*")
    .eq("user_id", authData.user.id)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ message: "Execute a migração da versão 0.4 no Supabase.", details: error.message }, { status: 503 });
  }

  if (!data) {
    const { data: created, error: insertError } = await supabase
      .from("user_settings")
      .insert({ user_id: authData.user.id, ...settingsToDatabase(defaultUserSettings) })
      .select("*")
      .single();

    if (insertError) {
      return NextResponse.json({ message: "Não foi possível criar as preferências da conta." }, { status: 500 });
    }

    return NextResponse.json({ settings: mapSettingsRow(created) });
  }

  return NextResponse.json({ settings: mapSettingsRow(data) });
}

export async function PATCH(request: Request) {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();

  if (!authData.user) {
    return NextResponse.json({ message: "Sessão inválida." }, { status: 401 });
  }

  const payload = (await request.json().catch(() => null)) as Partial<UserSettings> | null;
  if (!payload) {
    return NextResponse.json({ message: "Dados inválidos." }, { status: 400 });
  }

  const validationError = validateSettings(payload);
  if (validationError) {
    return NextResponse.json({ message: validationError }, { status: 422 });
  }

  if (payload.currentCourseId !== undefined && payload.currentCourseId !== null) {
    const { data: ownedCourse, error: courseError } = await supabase
      .from("courses")
      .select("id")
      .eq("id", payload.currentCourseId)
      .eq("user_id", authData.user.id)
      .is("archived_at", null)
      .maybeSingle();
    if (courseError || !ownedCourse) {
      return NextResponse.json({ message: "O curso atual selecionado não está disponível nesta conta." }, { status: 422 });
    }
  }

  const currentResponse = await supabase
    .from("user_settings")
    .select("*")
    .eq("user_id", authData.user.id)
    .maybeSingle();

  if (currentResponse.error) {
    return NextResponse.json({ message: "Execute a migração da versão 0.4 no Supabase." }, { status: 503 });
  }

  const merged = { ...mapSettingsRow(currentResponse.data), ...payload } as UserSettings;
  const { data, error } = await supabase
    .from("user_settings")
    .upsert({ user_id: authData.user.id, ...settingsToDatabase(merged) }, { onConflict: "user_id" })
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ message: "Não foi possível salvar as configurações.", details: error.message }, { status: 500 });
  }

  await supabase.from("audit_logs").insert({
    user_id: authData.user.id,
    action: "settings.updated",
    entity_type: "user_settings",
    entity_id: authData.user.id,
    metadata: { fields: Object.keys(payload) },
  });

  return NextResponse.json({ message: "Configurações salvas com sucesso.", settings: mapSettingsRow(data) });
}
