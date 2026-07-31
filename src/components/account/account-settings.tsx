"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, KeyRound, LoaderCircle, Mail, Save, Trash2, UserRound } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/env";

type Props = {
  initialName: string;
  initialEmail: string;
  initialAvatarUrl: string;
};

type Notice = { type: "success" | "error"; text: string } | null;

export function AccountSettings({ initialName, initialEmail, initialAvatarUrl }: Props) {
  const router = useRouter();
  const [profileNotice, setProfileNotice] = useState<Notice>(null);
  const [passwordNotice, setPasswordNotice] = useState<Notice>(null);
  const [deleteNotice, setDeleteNotice] = useState<Notice>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  async function updateProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setProfileNotice(null);

    if (!isSupabaseConfigured()) {
      setProfileNotice({ type: "error", text: "Configure o Supabase para salvar dados da conta." });
      return;
    }

    const formData = new FormData(event.currentTarget);
    const name = String(formData.get("name") ?? "").trim();
    const email = String(formData.get("email") ?? "").trim();
    const avatarUrl = String(formData.get("avatarUrl") ?? "").trim();

    if (name.length < 3) {
      setProfileNotice({ type: "error", text: "Informe um nome válido." });
      return;
    }

    setProfileLoading(true);
    const supabase = createClient();
    const { data: userData } = await supabase.auth.getUser();
    const currentEmail = userData.user?.email ?? initialEmail;

    const { error } = await supabase.auth.updateUser({
      email: email !== currentEmail ? email : undefined,
      data: { name, avatar_url: avatarUrl || null },
    });

    if (!error && userData.user) {
      await supabase.from("profiles").upsert({
        id: userData.user.id,
        name,
        avatar_url: avatarUrl || null,
      }, { onConflict: "id" });
    }
    setProfileLoading(false);

    if (error) {
      setProfileNotice({ type: "error", text: "Não foi possível atualizar a conta. Revise os dados e tente novamente." });
      return;
    }

    setProfileNotice({
      type: "success",
      text: email !== currentEmail
        ? "Dados atualizados. Confirme o novo e-mail pelas mensagens enviadas pelo Supabase."
        : "Dados da conta atualizados com sucesso.",
    });
    router.refresh();
  }

  async function updatePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setPasswordNotice(null);

    if (!isSupabaseConfigured()) {
      setPasswordNotice({ type: "error", text: "Configure o Supabase para alterar a senha." });
      return;
    }

    const formData = new FormData(event.currentTarget);
    const currentPassword = String(formData.get("currentPassword") ?? "");
    const password = String(formData.get("password") ?? "");
    const confirmation = String(formData.get("passwordConfirmation") ?? "");

    if (password.length < 8 || !/[A-Z]/.test(password) || !/\d/.test(password)) {
      setPasswordNotice({ type: "error", text: "A nova senha deve ter 8 caracteres, uma letra maiúscula e um número." });
      return;
    }
    if (password !== confirmation) {
      setPasswordNotice({ type: "error", text: "As novas senhas não coincidem." });
      return;
    }

    setPasswordLoading(true);
    const supabase = createClient();
    const { data: userData } = await supabase.auth.getUser();
    const email = userData.user?.email;

    if (!email) {
      setPasswordLoading(false);
      setPasswordNotice({ type: "error", text: "Não foi possível confirmar sua identidade." });
      return;
    }

    const { error: reauthenticationError } = await supabase.auth.signInWithPassword({
      email,
      password: currentPassword,
    });

    if (reauthenticationError) {
      setPasswordLoading(false);
      setPasswordNotice({ type: "error", text: "A senha atual está incorreta." });
      return;
    }

    const { error } = await supabase.auth.updateUser({ password });
    setPasswordLoading(false);

    if (error) {
      setPasswordNotice({ type: "error", text: "Não foi possível alterar a senha." });
      return;
    }

    form.reset();
    setPasswordNotice({ type: "success", text: "Senha alterada com sucesso." });
  }

  async function deleteAccount(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setDeleteNotice(null);

    if (!isSupabaseConfigured()) {
      setDeleteNotice({ type: "error", text: "Configure o Supabase para excluir a conta." });
      return;
    }

    const confirmation = String(new FormData(event.currentTarget).get("confirmation") ?? "");
    if (confirmation !== "EXCLUIR") {
      setDeleteNotice({ type: "error", text: "Digite EXCLUIR exatamente como solicitado." });
      return;
    }

    setDeleteLoading(true);
    const response = await fetch("/api/account/delete", { method: "DELETE" });
    const payload = (await response.json().catch(() => ({}))) as { message?: string };
    setDeleteLoading(false);

    if (!response.ok) {
      setDeleteNotice({ type: "error", text: payload.message ?? "Não foi possível excluir a conta." });
      return;
    }

    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace("/entrar?conta=excluida");
    router.refresh();
  }

  return (
    <div className="account-sections">
      <section className="account-card">
        <header><UserRound size={20} /><div><h2>Dados pessoais</h2><p>Atualize o nome, o e-mail e a imagem usada no perfil.</p></div></header>
        <form onSubmit={updateProfile} className="account-form">
          <div className="form-field"><label htmlFor="account-name">Nome completo</label><input id="account-name" name="name" className="form-control" defaultValue={initialName} required minLength={3} /></div>
          <div className="form-field"><label htmlFor="account-email">E-mail</label><input id="account-email" name="email" className="form-control" type="email" defaultValue={initialEmail} required /></div>
          <div className="form-field full"><label htmlFor="account-avatar">URL da foto do perfil <span>(opcional)</span></label><input id="account-avatar" name="avatarUrl" className="form-control" type="url" defaultValue={initialAvatarUrl} placeholder="https://..." /></div>
          {profileNotice && <div className={`account-notice ${profileNotice.type}`} role="alert">{profileNotice.text}</div>}
          <button type="submit" className="primary-button account-submit" disabled={profileLoading}>{profileLoading ? <LoaderCircle className="spin" size={17} /> : <Save size={17} />}{profileLoading ? "Salvando..." : "Salvar dados"}</button>
        </form>
      </section>

      <section className="account-card">
        <header><KeyRound size={20} /><div><h2>Alterar senha</h2><p>Confirme sua senha atual antes de cadastrar uma nova.</p></div></header>
        <form onSubmit={updatePassword} className="account-form">
          <div className="form-field full"><label htmlFor="current-password">Senha atual</label><input id="current-password" name="currentPassword" className="form-control" type="password" autoComplete="current-password" required /></div>
          <div className="form-field"><label htmlFor="account-password">Nova senha</label><input id="account-password" name="password" className="form-control" type="password" autoComplete="new-password" minLength={8} required /></div>
          <div className="form-field"><label htmlFor="account-password-confirmation">Confirmar nova senha</label><input id="account-password-confirmation" name="passwordConfirmation" className="form-control" type="password" autoComplete="new-password" minLength={8} required /></div>
          {passwordNotice && <div className={`account-notice ${passwordNotice.type}`} role="alert">{passwordNotice.text}</div>}
          <button type="submit" className="primary-button account-submit" disabled={passwordLoading}>{passwordLoading ? <LoaderCircle className="spin" size={17} /> : <KeyRound size={17} />}{passwordLoading ? "Alterando..." : "Alterar senha"}</button>
        </form>
      </section>

      <section className="account-card account-danger-zone">
        <header><AlertTriangle size={20} /><div><h2>Excluir conta</h2><p>Esta ação remove permanentemente o usuário de autenticação.</p></div></header>
        <div className="danger-description"><Mail size={17} /><p>Antes de excluir, confirme que possui uma cópia dos dados. Nas próximas versões, os registros do sistema também serão incluídos na exclusão.</p></div>
        <form onSubmit={deleteAccount} className="account-form">
          <div className="form-field full"><label htmlFor="delete-confirmation">Digite <strong>EXCLUIR</strong> para confirmar</label><input id="delete-confirmation" name="confirmation" className="form-control" autoComplete="off" /></div>
          {deleteNotice && <div className={`account-notice ${deleteNotice.type}`} role="alert">{deleteNotice.text}</div>}
          <button type="submit" className="danger-button account-submit" disabled={deleteLoading}>{deleteLoading ? <LoaderCircle className="spin" size={17} /> : <Trash2 size={17} />}{deleteLoading ? "Excluindo..." : "Excluir minha conta"}</button>
        </form>
      </section>
    </div>
  );
}
