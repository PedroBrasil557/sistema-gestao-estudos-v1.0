import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseEnvironment, isSupabaseConfigured } from "@/lib/supabase/env";

const publicRoutes = new Set([
  "/entrar",
  "/criar-conta",
  "/recuperar-senha",
  "/nova-senha",
]);

function isPublicPath(pathname: string) {
  return publicRoutes.has(pathname) || pathname.startsWith("/auth/");
}

export async function updateSession(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.next({ request });
  }

  const { url, publishableKey } = getSupabaseEnvironment();
  let response = NextResponse.next({ request });

  const supabase = createServerClient(url, publishableKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  const { data } = await supabase.auth.getClaims();
  const isAuthenticated = Boolean(data?.claims?.sub);
  const { pathname } = request.nextUrl;

  if (!isAuthenticated && !isPublicPath(pathname)) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/entrar";
    loginUrl.searchParams.set("retorno", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (
    isAuthenticated &&
    ["/entrar", "/criar-conta", "/recuperar-senha"].includes(pathname)
  ) {
    const studiesUrl = request.nextUrl.clone();
    studiesUrl.pathname = "/estudos";
    studiesUrl.search = "";
    return NextResponse.redirect(studiesUrl);
  }

  return response;
}
