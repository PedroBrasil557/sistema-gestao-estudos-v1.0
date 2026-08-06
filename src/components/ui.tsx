import type { CSSProperties, ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { Inbox } from "lucide-react";
import { normalizeHex, pastelColor } from "@/lib/visuals";

export type Tone = "blue" | "green" | "orange" | "purple" | "cyan" | "red" | "gray";

export function MetricCard({ label, value, helper, progress, icon: Icon, tone = "blue" }: { label: string; value: string; helper: string; progress?: number; icon: LucideIcon; tone?: Tone }) {
  return (
    <article className={`card metric-card tone-${tone}`}>
      <div className="metric-icon"><Icon size={23} /></div>
      <div className="metric-content"><div className="metric-label">{label}</div><div className="metric-value">{value}</div><div className="metric-helper">{helper}</div>{typeof progress === "number" && <ProgressBar value={progress} tone={tone} />}</div>
    </article>
  );
}

export function SummaryCard({ label, value, helper, icon: Icon, color = "#2F6BFF", progress }: { label: string; value: string; helper?: string; icon: LucideIcon; color?: string; progress?: number }) {
  const normalized = normalizeHex(color);
  const style = { "--card-color": normalized, "--card-pastel": pastelColor(normalized) } as CSSProperties;
  return (
    <article className="summary-card" style={style}>
      <div className="summary-card-icon"><Icon size={24} /></div>
      <div className="summary-card-copy"><span>{label}</span><strong>{value}</strong>{helper && <small>{helper}</small>}{typeof progress === "number" && <ProgressBar value={progress} color={normalized} />}</div>
    </article>
  );
}

export function Panel({ title, action, children, className = "", subtitle }: { title: string; action?: ReactNode; children: ReactNode; className?: string; subtitle?: string }) {
  return <section className={`card panel ${className}`}><div className="panel-header"><div><h2>{title}</h2>{subtitle && <p>{subtitle}</p>}</div>{action}</div><div className="panel-body">{children}</div></section>;
}

export function ProgressBar({ value, tone = "blue", color }: { value: number; tone?: Tone; color?: string }) {
  const safe = Math.max(0, Math.min(value, 100));
  return <div className="progress" aria-label={`${value}%`}><span className={`tone-${tone}`} style={{ width: `${safe}%`, ...(color ? { background: color } : {}) }} /></div>;
}

export function Badge({ children, tone = "gray", color }: { children: ReactNode; tone?: Tone; color?: string }) {
  const style = color ? ({ color, background: pastelColor(color), borderColor: `${color}33` } as CSSProperties) : undefined;
  return <span className={`badge tone-${tone}`} style={style}>{children}</span>;
}

export function Donut({ value, center, label, tone = "blue", size = 140, color }: { value: number; center: string; label: string; tone?: Tone; size?: number; color?: string }) {
  const safe = Math.max(0, Math.min(value, 100));
  const style = { "--donut-value": `${safe * 3.6}deg`, "--donut-size": `${size}px`, ...(color ? { color } : {}) } as CSSProperties;
  return <div className={`donut tone-${tone}`} style={style} role="img" aria-label={`${label}: ${center}`}><div><strong>{center}</strong><span>{label}</span></div></div>;
}

export function HorizontalBars({ rows }: { rows: Array<{ label: string; value: number; text: string; color?: string }> }) {
  const max = Math.max(...rows.map((row) => row.value), 1);
  return <div className="horizontal-bars">{rows.map((row) => <div className="bar-row" key={row.label}><span className="bar-label">{row.label}</span><div className="bar-track"><span style={{ width: `${(row.value / max) * 100}%`, background: row.color }} /></div><strong>{row.text}</strong></div>)}</div>;
}

export function MiniColumnChart({ values, labels, unit = "h" }: { values: number[]; labels: string[]; unit?: string }) {
  const max = Math.max(...values, 1);
  return <div className="column-chart" role="img" aria-label="Gráfico de colunas">{values.map((value, index) => <div className="column-item" key={`${labels[index]}-${index}`}><span className="column-value">{value}{unit}</span><div className="column-track"><span style={{ height: `${(value / max) * 100}%` }} /></div><small>{labels[index]}</small></div>)}</div>;
}

export function EmptyState({ title, description, action, compact = false }: { title: string; description: string; action?: ReactNode; compact?: boolean }) {
  return <div className={`empty-state ${compact ? "compact" : ""}`}><Inbox size={compact ? 24 : 36} /><h3>{title}</h3><p>{description}</p>{action}</div>;
}

export function FilterChips({ items, value, onChange, ariaLabel }: { items: Array<{ value: string; label: string; icon?: LucideIcon }>; value: string; onChange: (value: string) => void; ariaLabel: string }) {
  return <div className="filter-chips" role="tablist" aria-label={ariaLabel}>{items.map((item) => { const Icon = item.icon; return <button key={item.value} type="button" role="tab" aria-selected={value === item.value} className={value === item.value ? "active" : ""} onClick={() => onChange(item.value)}>{Icon && <Icon size={15} />}{item.label}</button>; })}</div>;
}

export function ColorPicker({ value, onChange, colors }: { value: string; onChange: (color: string) => void; colors: string[] }) {
  return <div className="color-picker">{colors.map((color) => <button key={color} type="button" className={normalizeHex(value) === normalizeHex(color) ? "active" : ""} style={{ background: color }} aria-label={`Selecionar ${color}`} onClick={() => onChange(color)} />)}<input type="color" value={normalizeHex(value)} aria-label="Cor personalizada" onChange={(event) => onChange(event.target.value.toUpperCase())} /></div>;
}

export function EmptyButton({ children }: { children: ReactNode }) { return <button type="button" className="link-button">{children}</button>; }
