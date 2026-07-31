import Link from "next/link";
import type { ReactNode } from "react";
import { BookOpen, CheckCircle2, ShieldCheck, Sparkles } from "lucide-react";

export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <main className="auth-page">
      <section className="auth-visual" aria-label="Apresentação do sistema">
        <Link href="/entrar" className="auth-brand">
          <span className="auth-brand-mark"><BookOpen size={28} /></span>
          <span><strong>GESTÃO DE ESTUDOS</strong><em>Roberta</em></span>
        </Link>

        <div className="auth-hero-copy">
          <span className="auth-kicker"><Sparkles size={15} /> Sua evolução em um só lugar</span>
          <h1>Transforme sua rotina de estudos em progresso visível.</h1>
          <p>Organize cursos, registre horas, acompanhe metas e mantenha suas conquistas protegidas.</p>
        </div>

        <div className="auth-benefits">
          <div><CheckCircle2 size={18} /><span><strong>Registro rápido</strong><small>Cadastre uma sessão em poucos passos.</small></span></div>
          <div><CheckCircle2 size={18} /><span><strong>Indicadores automáticos</strong><small>Metas e progresso atualizados após cada estudo.</small></span></div>
          <div><ShieldCheck size={18} /><span><strong>Conta protegida</strong><small>Sessão segura e dados isolados por usuário.</small></span></div>
        </div>
      </section>

      <section className="auth-content">
        <div className="auth-card">{children}</div>
        <p className="auth-footer">© 2026 Sistema de Gestão de Estudos — Roberta</p>
      </section>
    </main>
  );
}
