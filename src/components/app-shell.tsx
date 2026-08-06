"use client";

import Link from "next/link";
import type { CSSProperties, MouseEvent, ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  BarChart3,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  FileBadge2,
  GraduationCap,
  LogOut,
  Menu,
  NotebookPen,
  Settings,
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
  sidebarColor: string;
  buttonColor: string;
  cardTone: string;
};

const navigation = [
  { href: "/estudos", label: "Estudos", icon: BookOpen },
  { href: "/cursos", label: "Cursos", icon: GraduationCap },
  { href: "/dashboard", label: "Dashboard", icon: BarChart3 },
  { href: "/anotacoes", label: "Anotações", icon: NotebookPen },
  { href: "/certificados", label: "Certificados", icon: FileBadge2 },
  { href: "/configuracoes", label: "Configurações", icon: Settings },
];

function getInitials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("") || "US";
}

function SidebarContent({
  pathname,
  user,
  supabaseConfigured,
  collapsed,
  onToggle,
  close,
}: {
  pathname: string;
  user: ShellUser;
  supabaseConfigured: boolean;
  collapsed: boolean;
  onToggle?: () => void;
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
      <div className="brand redesign-brand">
        <div className="brand-mark redesign-brand-mark"><BookOpen size={28} /></div>
        {!collapsed && <div><div className="brand-title">GESTÃO DE<br />ESTUDOS</div><div className="brand-script">Roberta</div></div>}
      </div>

      <nav className="nav redesign-nav" aria-label="Navegação principal">
        {navigation.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href === "/cursos" && pathname.startsWith("/cursos/"));
          return (
            <Link key={href} href={href} onClick={close} className={`nav-link ${active ? "active" : ""}`} aria-current={active ? "page" : undefined} title={collapsed ? label : undefined}>
              <Icon size={21} aria-hidden="true" /><span>{label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="sidebar-bottom">
        <Link href="/perfil" onClick={close} className="sidebar-profile sidebar-profile-link" title={collapsed ? user.name : undefined}>
          {user.avatarUrl ? <div className="avatar-image" style={{ backgroundImage: `url(${user.avatarUrl})` }} role="img" aria-label={`Foto de ${user.name}`} /> : <div className="avatar" aria-hidden="true">{getInitials(user.name)}</div>}
          {!collapsed && <div><strong>{user.name}</strong><small>Ver perfil</small></div>}
          {!collapsed && <ChevronRight size={18} />}
        </Link>

        <button className="sidebar-collapse" type="button" onClick={onToggle} aria-label={collapsed ? "Expandir menu" : "Recolher menu"}>
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          {!collapsed && <span>Recolher menu</span>}
        </button>

        <button className="logout-button" type="button" onClick={handleSignOut} disabled={signingOut} title={collapsed ? "Sair da conta" : undefined}>
          <LogOut size={18} /> {!collapsed && (signingOut ? "Saindo..." : "Sair da conta")}
        </button>
      </div>
    </>
  );
}

export function AppShell({ children, user, supabaseConfigured, appearance }: { children: ReactNode; user: ShellUser; supabaseConfigured: boolean; appearance: ShellAppearance }) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [systemDark, setSystemDark] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const update = () => setSystemDark(media.matches);
    const frame = window.requestAnimationFrame(update);
    media.addEventListener("change", update);
    return () => {
      window.cancelAnimationFrame(frame);
      media.removeEventListener("change", update);
    };
  }, []);

  useEffect(() => {
    if (!menuOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };

    window.addEventListener("keydown", handleEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleEscape);
    };
  }, [menuOpen]);

  const resolvedTheme = appearance.theme === "system" ? (systemDark ? "dark" : "light") : appearance.theme;
  const shellStyle = {
    "--blue": appearance.accentColor,
    "--button": appearance.buttonColor,
    "--sidebar-custom": appearance.sidebarColor,
    "--page-tone": appearance.cardTone,
  } as CSSProperties;

  return (
    <div className={`app-shell redesign-shell ${collapsed ? "sidebar-collapsed" : ""} theme-${resolvedTheme} density-${appearance.interfaceDensity} rounding-${appearance.rounding} card-tone-${appearance.cardTone}`} style={shellStyle}>
      <a className="skip-link" href="#conteudo-principal">Pular para o conteúdo principal</a>
      <aside className="sidebar redesign-sidebar">
        <SidebarContent pathname={pathname} user={user} supabaseConfigured={supabaseConfigured} collapsed={collapsed} onToggle={() => setCollapsed((value) => !value)} />
      </aside>

      <button type="button" className="mobile-menu-button" aria-label="Abrir menu" aria-expanded={menuOpen} onClick={() => setMenuOpen(true)}><Menu size={21} /></button>

      {menuOpen && (
        <div className="mobile-drawer-backdrop" role="presentation" onClick={() => setMenuOpen(false)}>
          <aside className="mobile-drawer redesign-sidebar" role="dialog" aria-modal="true" aria-label="Menu principal" onClick={(event: MouseEvent<HTMLElement>) => event.stopPropagation()}>
            <button className="drawer-close" onClick={() => setMenuOpen(false)} aria-label="Fechar menu"><X size={20} /></button>
            <SidebarContent pathname={pathname} user={user} supabaseConfigured={supabaseConfigured} collapsed={false} close={() => setMenuOpen(false)} />
          </aside>
        </div>
      )}

      <main className="main redesign-main" id="conteudo-principal" tabIndex={-1}>
        {!supabaseConfigured && <div className="supabase-banner" role="status"><strong>Modo demonstração:</strong> configure o arquivo <code>.env.local</code> para ativar os dados reais.</div>}
        {children}
      </main>
    </div>
  );
}
