"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { LoaderCircle, MailCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { getSiteUrl } from "@/lib/site-url";

export function RecoveryForm() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);

    if (!isSupabaseConfigured()) {
      setMessage("Configure o Supabase no arquivo .env.local antes de testar a recuperação.");
      return;
    }

    const email = String(new FormData(event.currentTarget).get("email") ?? "").trim();
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${getSiteUrl()}/auth/confirm?next=/nova-senha`,
    });
    setLoading(false);

    if (error) {
      setSuccess(false);
      setMessage("Não foi possível enviar o e-mail agora. Aguarde e tente novamente.");
      return;
    }

    setSuccess(true);
    setMessage("Se o e-mail estiver cadastrado, você receberá as instruções de recuperação.");
  }

  return (
    <>
      <div className="auth-card-heading">
        <span className="auth-step">Recuperação de acesso</span>
        <h2>Redefina sua senha</h2>
        <p>Informe seu e-mail para receber um link seguro.</p>
      </div>

      <form className="auth-form" onSubmit={handleSubmit}>
        <div className="auth-field">
          <label htmlFor="recovery-email">E-mail</label>
          <input id="recovery-email" name="email" type="email" autoComplete="email" placeholder="seuemail@exemplo.com" required />
        </div>

        {message && <div className={`auth-message ${success ? "success" : "error"}`} role="alert">{message}</div>}

        <button className="auth-submit" type="submit" disabled={loading}>
          {loading ? <LoaderCircle className="spin" size={18} /> : <MailCheck size={18} />}
          {loading ? "Enviando..." : "Enviar link de recuperação"}
        </button>
      </form>

      <p className="auth-switch"><Link href="/entrar">Voltar para o login</Link></p>
    </>
  );
}
