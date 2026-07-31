"use client";

import Link from "next/link";
import type { CSSProperties, MouseEvent, ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  BarChart3,
  BookOpen,
  FileBadge2,
  Home,
  LogOut,
  Menu,
  NotebookPen,
  Settings,
  Trophy,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type ShellUser = {
  name: string;
  email: string;
  avatarUrl: string | null;
};

type ShellAppearance = {
  theme: "light" | "dark" | "system";
  accentColor: string;
  interfaceDensity: "compact" | "default" | "comfortable";
  rounding: "small" | "default" | "large";
};

const navigation = [
  { href: "/estudos", label: "Estudos", icon: Home },
  { href: "/cursos", label: "Cursos", icon: BookOpen },
  { href: "/dashboard", label: "Dashboard", icon: BarChart3 },
  { href: "/anotacoes", label: "Anotações", icon: NotebookPen },
  { href: "/certificados", label: "Certificados", icon: FileBadge2 },
  { href: "/configuracoes", label: "Configurações", icon: Settings },
];

function getInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "US";
}

function SidebarContent({
  pathname,
  user,
  supabaseConfigured,
  close,
}: {
  pathname: string;
  user: ShellUser;
  supabaseConfigured: boolean;
  close?: () => void;
}) {
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);

  async function handleSignOut() {
    close?.();
    if (!supabaseConfigured) {
      router.push("/entrar");
      return;
    }

    setSigningOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace("/entrar");
    router.refresh();
  }

  return (
    <>
      <div className="brand">
        <div className="brand-mark"><BookOpen size={27} /></div>
        <div>
          <div className="brand-title">GESTÃO DE ESTUDOS</div>
          <div className="brand-script">Roberta</div>
        </div>
      </div>

      <nav className="nav" aria-label="Navegação principal">
        {navigation.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              onClick={close}
              className={`nav-link ${active ? "active" : ""}`}
              aria-current={active ? "page" : undefined}
            >
              <Icon size={20} aria-hidden="true" />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>

      <Link href="/perfil" onClick={close} className="sidebar-profile sidebar-profile-link">
        <div className="avatar" aria-hidden="true">{getInitials(user.name)}</div>
        <div><strong>{user.name}</strong><small>Ver perfil</small></div>
      </Link>

      <div className="sidebar-motivation">
        <div className="motivation-title"><Trophy size={17} /> Foco e disciplina</div>
        <p>“Pequenas conquistas, grandes resultados!”</p>
      </div>

      <button className="logout-button" type="button" onClick={handleSignOut} disabled={signingOut}>
        <LogOut size={18} /> {signingOut ? "Saindo..." : "Sair da conta"}
      </button>
    </>
  );
}

export function AppShell({
  children,
  user,
  supabaseConfigured,
  appearance,
}: {
  children: ReactNode;
  user: ShellUser;
  supabaseConfigured: boolean;
  appearance: ShellAppearance;
}) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [systemDark, setSystemDark] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const update = () => setSystemDark(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  const resolvedTheme = appearance.theme === "system" ? (systemDark ? "dark" : "light") : appearance.theme;
  const shellStyle = { "--blue": appearance.accentColor } as CSSProperties;

  return (
    <div
      className={`app-shell theme-${resolvedTheme} density-${appearance.interfaceDensity} rounding-${appearance.rounding}`}
      style={shellStyle}
    >
      <a className="skip-link" href="#conteudo-principal">Pular para o conteúdo principal</a>
      <aside className="sidebar">
        <SidebarContent pathname={pathname} user={user} supabaseConfigured={supabaseConfigured} />
      </aside>

      <button
        type="button"
        className="mobile-menu-button"
        aria-label="Abrir menu"
        aria-expanded={menuOpen}
        onClick={() => setMenuOpen(true)}
      >
        <Menu size={21} />
      </button>

      {menuOpen && (
        <div className="mobile-drawer-backdrop" role="presentation" onClick={() => setMenuOpen(false)}>
          <aside className="mobile-drawer" role="dialog" aria-modal="true" aria-label="Menu principal" onClick={(event: MouseEvent<HTMLElement>) => event.stopPropagation()}>
            <button className="drawer-close" onClick={() => setMenuOpen(false)} aria-label="Fechar menu"><X size={20} /></button>
            <SidebarContent pathname={pathname} user={user} supabaseConfigured={supabaseConfigured} close={() => setMenuOpen(false)} />
          </aside>
        </div>
      )}

      <main className="main" id="conteudo-principal" tabIndex={-1}>
        {!supabaseConfigured && (
          <div className="supabase-banner" role="status">
            <strong>Modo demonstração:</strong> configure o arquivo <code>.env.local</code> para ativar login, cadastro e recuperação de senha.
          </div>
        )}
        {children}
      </main>

      <nav className="mobile-nav" aria-label="Navegação móvel">
        {navigation.slice(0, 5).map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link key={href} href={href} className={active ? "active" : ""} aria-current={active ? "page" : undefined}>
              <Icon size={18} aria-hidden="true" /><span>{label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
