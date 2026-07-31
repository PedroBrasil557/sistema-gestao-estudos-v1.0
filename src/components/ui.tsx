import type { CSSProperties, ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

export type Tone = "blue" | "green" | "orange" | "purple" | "cyan" | "red" | "gray";

export function MetricCard({
  label,
  value,
  helper,
  progress,
  icon: Icon,
  tone = "blue",
}: {
  label: string;
  value: string;
  helper: string;
  progress?: number;
  icon: LucideIcon;
  tone?: Tone;
}) {
  return (
    <article className={`card metric-card tone-${tone}`}>
      <div className="metric-icon"><Icon size={23} /></div>
      <div className="metric-content">
        <div className="metric-label">{label}</div>
        <div className="metric-value">{value}</div>
        <div className="metric-helper">{helper}</div>
        {typeof progress === "number" && <ProgressBar value={progress} tone={tone} />}
      </div>
    </article>
  );
}

export function Panel({
  title,
  action,
  children,
  className = "",
}: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`card panel ${className}`}>
      <div className="panel-header"><h2>{title}</h2>{action}</div>
      <div className="panel-body">{children}</div>
    </section>
  );
}

export function ProgressBar({ value, tone = "blue" }: { value: number; tone?: Tone }) {
  const safe = Math.max(0, Math.min(value, 100));
  return <div className="progress" aria-label={`${value}%`}><span className={`tone-${tone}`} style={{ width: `${safe}%` }} /></div>;
}

export function Badge({ children, tone = "gray" }: { children: ReactNode; tone?: Tone }) {
  return <span className={`badge tone-${tone}`}>{children}</span>;
}

export function Donut({
  value,
  center,
  label,
  tone = "blue",
  size = 140,
}: {
  value: number;
  center: string;
  label: string;
  tone?: Tone;
  size?: number;
}) {
  const safe = Math.max(0, Math.min(value, 100));
  const style = {
    "--donut-value": `${safe * 3.6}deg`,
    "--donut-size": `${size}px`,
  } as CSSProperties;
  return (
    <div className={`donut tone-${tone}`} style={style} role="img" aria-label={`${label}: ${center}`}>
      <div><strong>{center}</strong><span>{label}</span></div>
    </div>
  );
}

export function HorizontalBars({ rows }: { rows: Array<{ label: string; value: number; text: string }> }) {
  const max = Math.max(...rows.map((row) => row.value), 1);
  return (
    <div className="horizontal-bars">
      {rows.map((row) => (
        <div className="bar-row" key={row.label}>
          <span className="bar-label">{row.label}</span>
          <div className="bar-track"><span style={{ width: `${(row.value / max) * 100}%` }} /></div>
          <strong>{row.text}</strong>
        </div>
      ))}
    </div>
  );
}

export function MiniColumnChart({ values, labels, unit = "h" }: { values: number[]; labels: string[]; unit?: string }) {
  const max = Math.max(...values, 1);
  return (
    <div className="column-chart" role="img" aria-label="Gráfico de colunas">
      {values.map((value, index) => (
        <div className="column-item" key={`${labels[index]}-${index}`}>
          <span className="column-value">{value}{unit}</span>
          <div className="column-track"><span style={{ height: `${(value / max) * 100}%` }} /></div>
          <small>{labels[index]}</small>
        </div>
      ))}
    </div>
  );
}

export function EmptyButton({ children }: { children: ReactNode }) {
  return <button type="button" className="link-button">{children}</button>;
}
