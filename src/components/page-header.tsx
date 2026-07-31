import type { ReactNode } from "react";
import { Bell, CalendarDays } from "lucide-react";

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle: string;
  actions?: ReactNode;
}) {
  return (
    <header className="topbar">
      <div className="topbar-copy">
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </div>
      <div className="topbar-actions">
        {actions}
        <div className="date-display"><CalendarDays size={18} /><span><strong>23 de junho de 2025</strong><small>Segunda-feira</small></span></div>
        <button className="icon-button" aria-label="Notificações" type="button"><Bell size={19} /><span className="notification-dot">3</span></button>
      </div>
    </header>
  );
}
