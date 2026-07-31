"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { LoaderCircle, UserPlus } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { translateAuthError } from "@/lib/auth-errors";
import { getSiteUrl } from "@/lib/site-url";
import { PasswordField } from "@/components/auth/password-field";

function validatePassword(password: string) {
  return password.length >= 8 && /[A-Z]/.test(password) && /\d/.test(password);
}

export function SignupForm() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<"error" | "success">("error");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setMessage(null);

    if (!isSupabaseConfigured()) {
      setMessage("Configure o Supabase no arquivo .env.local antes de criar a conta.");
      return;
    }

    const formData = new FormData(event.currentTarget);
    const name = String(formData.get("name") ?? "").trim();
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");
    const passwordConfirmation = String(formData.get("passwordConfirmation") ?? "");
    const acceptedTerms = formData.get("terms") === "on";

    if (name.length < 3) {
      setMessage("Informe seu nome completo.");
      return;
    }
    if (!validatePassword(password)) {
      setMessage("A senha deve ter ao menos 8 caracteres, uma letra maiúscula e um número.");
      return;
    }
    if (password !== passwordConfirmation) {
      setMessage("As senhas não coincidem.");
      return;
    }
    if (!acceptedTerms) {
      setMessage("Você precisa aceitar os termos para criar a conta.");
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name },
        emailRedirectTo: `${getSiteUrl()}/auth/confirm?next=/estudos`,
      },
    });
    setLoading(false);

    if (error) {
      setMessageType("error");
      setMessage(translateAuthError(error.message));
      return;
    }

    setMessageType("success");
    setMessage(
      data.session
        ? "Conta criada com sucesso. Você já pode acessar o sistema."
        : "Conta criada. Verifique seu e-mail para confirmar o cadastro.",
    );
    form.reset();
  }

  return (
    <>
      <div className="auth-card-heading">
        <span className="auth-step">Primeiro acesso</span>
        <h2>Crie sua conta</h2>
        <p>Comece a organizar sua formação profissional.</p>
      </div>

      <form className="auth-form" onSubmit={handleSubmit}>
        <div className="auth-field">
          <label htmlFor="signup-name">Nome completo</label>
          <input id="signup-name" name="name" type="text" autoComplete="name" placeholder="Seu nome completo" required minLength={3} />
        </div>
        <div className="auth-field">
          <label htmlFor="signup-email">E-mail</label>
          <input id="signup-email" name="email" type="email" autoComplete="email" placeholder="seuemail@exemplo.com" required />
        </div>
        <PasswordField id="signup-password" name="password" label="Senha" autoComplete="new-password" placeholder="Crie uma senha segura" />
        <PasswordField id="signup-password-confirmation" name="passwordConfirmation" label="Confirmar senha" autoComplete="new-password" placeholder="Repita a senha" />
        <p className="password-hint">Use pelo menos 8 caracteres, uma letra maiúscula e um número.</p>

        <label className="auth-check terms-check"><input type="checkbox" name="terms" /> <span>Li e aceito os termos de uso e a política de privacidade.</span></label>

        {message && <div className={`auth-message ${messageType}`} role="alert">{message}</div>}

        <button className="auth-submit" type="submit" disabled={loading}>
          {loading ? <LoaderCircle className="spin" size={18} /> : <UserPlus size={18} />}
          {loading ? "Criando conta..." : "Criar minha conta"}
        </button>
      </form>

      <p className="auth-switch">Já possui uma conta? <Link href="/entrar">Entrar</Link></p>
    </>
  );
}
