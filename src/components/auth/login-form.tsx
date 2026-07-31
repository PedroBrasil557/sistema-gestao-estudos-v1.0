"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useState } from "react";
import { LoaderCircle, LogIn } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { translateAuthError } from "@/lib/auth-errors";
import { PasswordField } from "@/components/auth/password-field";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<"error" | "success">("error");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);

    if (!isSupabaseConfigured()) {
      setMessage("Configure o Supabase no arquivo .env.local antes de testar o login.");
      return;
    }

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");

    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);

    if (error) {
      setMessageType("error");
      setMessage(translateAuthError(error.message));
      return;
    }

    setMessageType("success");
    setMessage("Login realizado. Redirecionando...");
    const returnPath = searchParams.get("retorno");
    let destination = returnPath?.startsWith("/") ? returnPath : "/estudos";

    if (!returnPath) {
      const { data: userData } = await supabase.auth.getUser();
      if (userData.user) {
        const { data: preferences } = await supabase
          .from("user_settings")
          .select("home_page")
          .eq("user_id", userData.user.id)
          .maybeSingle();
        if (preferences?.home_page) destination = `/${preferences.home_page}`;
      }
    }

    router.replace(destination);
    router.refresh();
  }

  return (
    <>
      <div className="auth-card-heading">
        <span className="auth-step">Acesso seguro</span>
        <h2>Entre na sua conta</h2>
        <p>Continue de onde parou e acompanhe sua evolução.</p>
      </div>

      <form className="auth-form" onSubmit={handleSubmit}>
        <div className="auth-field">
          <label htmlFor="login-email">E-mail</label>
          <input id="login-email" name="email" type="email" autoComplete="email" placeholder="seuemail@exemplo.com" required />
        </div>
        <PasswordField id="login-password" name="password" label="Senha" autoComplete="current-password" placeholder="Digite sua senha" />

        <div className="auth-form-options">
          <label className="auth-check"><input type="checkbox" name="remember" defaultChecked /> <span>Lembrar minha sessão</span></label>
          <Link href="/recuperar-senha">Esqueci minha senha</Link>
        </div>

        {message && <div className={`auth-message ${messageType}`} role="alert">{message}</div>}

        <button className="auth-submit" type="submit" disabled={loading}>
          {loading ? <LoaderCircle className="spin" size={18} /> : <LogIn size={18} />}
          {loading ? "Entrando..." : "Entrar"}
        </button>
      </form>

      <p className="auth-switch">Ainda não possui conta? <Link href="/criar-conta">Criar conta</Link></p>
    </>
  );
}
