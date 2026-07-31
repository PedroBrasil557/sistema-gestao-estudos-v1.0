import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { certificateBucket } from "@/lib/certificates/constants";

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) return NextResponse.json({ message: "Sessão inválida." }, { status: 401 });

  const { data: certificate, error } = await supabase.from("certificates").select("id, file_key, file_name").eq("id", id).eq("user_id", authData.user.id).is("deleted_at", null).maybeSingle();
  if (error) return NextResponse.json({ message: "Não foi possível localizar o arquivo.", details: error.message }, { status: 500 });
  if (!certificate?.file_key) return NextResponse.json({ message: "Este certificado não possui arquivo." }, { status: 404 });

  const download = request.nextUrl.searchParams.get("download") === "1";
  const options = download && certificate.file_name ? { download: String(certificate.file_name) } : undefined;
  const { data, error: signedError } = await supabase.storage.from(certificateBucket).createSignedUrl(String(certificate.file_key), 60, options);
  if (signedError || !data?.signedUrl) return NextResponse.json({ message: "Não foi possível gerar acesso temporário ao arquivo.", details: signedError?.message }, { status: 500 });
  return NextResponse.redirect(data.signedUrl);
}
