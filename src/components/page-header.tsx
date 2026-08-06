"use client";

import type { ReactNode } from "react";
import { CalendarDays } from "lucide-react";

export function PageHeader({
  title,
  subtitle,
  actions,
  timezone = "America/Sao_Paulo",
}: {
  title: string;
  subtitle: string;
  actions?: ReactNode;
  timezone?: string;
}) {
  const now = new Date();
  const date = new Intl.DateTimeFormat("pt-BR", {
    timeZone: timezone,
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(now);
  const weekday = new Intl.DateTimeFormat("pt-BR", {
    timeZone: timezone,
    weekday: "long",
  }).format(now);

  return (
    <header className="topbar redesign-topbar">
      <div className="topbar-copy">
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </div>
      <div className="topbar-actions">
        <div className="date-display" aria-label={`${weekday}, ${date}`}>
          <CalendarDays size={18} />
          <span><strong>{weekday}, {date}</strong></span>
        </div>
        {actions}
      </div>
    </header>
  );
}
