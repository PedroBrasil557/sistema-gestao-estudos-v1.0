import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const code = searchParams.get("code");
  const requestedNext = searchParams.get("next");
  const next = requestedNext?.startsWith("/") ? requestedNext : "/estudos";

  if (!isSupabaseConfigured()) {
    return NextResponse.redirect(`${origin}/entrar?erro=supabase-nao-configurado`);
  }

  const supabase = await createClient();
  let error: Error | null = null;

  if (tokenHash && type) {
    const result = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    error = result.error;
  } else if (code) {
    const result = await supabase.auth.exchangeCodeForSession(code);
    error = result.error;
  } else {
    error = new Error("Parâmetros de confirmação ausentes.");
  }

  if (error) {
    return NextResponse.redirect(`${origin}/entrar?erro=link-invalido`);
  }

  return NextResponse.redirect(`${origin}${next}`);
}
