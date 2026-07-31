"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { KeyRound, LoaderCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { PasswordField } from "@/components/auth/password-field";

export function NewPasswordForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);

    if (!isSupabaseConfigured()) {
      setMessage("Configure o Supabase no arquivo .env.local.");
      return;
    }

    const formData = new FormData(event.currentTarget);
    const password = String(formData.get("password") ?? "");
    const confirmation = String(formData.get("passwordConfirmation") ?? "");

    if (password.length < 8 || !/[A-Z]/.test(password) || !/\d/.test(password)) {
      setMessage("A nova senha deve ter ao menos 8 caracteres, uma letra maiúscula e um número.");
      return;
    }
    if (password !== confirmation) {
      setMessage("As senhas não coincidem.");
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      setLoading(false);
      setMessage("O link expirou ou é inválido. Solicite uma nova recuperação de senha.");
      return;
    }

    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      setMessage("Não foi possível atualizar a senha. Solicite um novo link.");
      return;
    }

    setSuccess(true);
    setMessage("Senha atualizada com sucesso. Redirecionando para o sistema...");
    setTimeout(() => {
      router.replace("/estudos");
      router.refresh();
    }, 1200);
  }

  return (
    <>
      <div className="auth-card-heading">
        <span className="auth-step">Nova senha</span>
        <h2>Crie uma nova senha</h2>
        <p>Escolha uma senha diferente da anterior.</p>
      </div>

      <form className="auth-form" onSubmit={handleSubmit}>
        <PasswordField id="new-password" name="password" label="Nova senha" autoComplete="new-password" placeholder="Digite a nova senha" />
        <PasswordField id="new-password-confirmation" name="passwordConfirmation" label="Confirmar nova senha" autoComplete="new-password" placeholder="Repita a nova senha" />
        {message && <div className={`auth-message ${success ? "success" : "error"}`} role="alert">{message}</div>}
        <button className="auth-submit" type="submit" disabled={loading || success}>
          {loading ? <LoaderCircle className="spin" size={18} /> : <KeyRound size={18} />}
          {loading ? "Atualizando..." : "Salvar nova senha"}
        </button>
      </form>

      <p className="auth-switch"><Link href="/recuperar-senha">Solicitar outro link</Link></p>
    </>
  );
}
