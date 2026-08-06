"use client";

import { useCallback, useEffect, useState } from "react";
import {
  BookOpenCheck,
  CalendarDays,
  Clock3,
  Filter,
  GraduationCap,
  Languages,
  LoaderCircle,
  RefreshCw,
  Target,
  X,
} from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Donut, EmptyState, FilterChips, ProgressBar, SummaryCard } from "@/components/ui";
import type { CourseStatus } from "@/types/course";
import type { DashboardData, DashboardFilterOption, DashboardFilters, DashboardRange } from "@/types/dashboard";

const storageKey = "study-dashboard-filters-v1.1";
const defaultFilters: DashboardFilters = { range: "7d", start: null, end: null, group: null, areaId: null, platformId: null, courseStatus: null, studyTypeId: null };
const ranges: Array<{ value: DashboardRange; label: string }> = [
  { value: "7d", label: "Últimos 7 dias" }, { value: "30d", label: "Últimos 30 dias" }, { value: "month", label: "Mês atual" }, { value: "year", label: "Ano atual" }, { value: "all", label: "Todo o período" }, { value: "custom", label: "Personalizado" },
];
const statuses: Array<{ value: CourseStatus; label: string }> = [
  { value: "PLANNED", label: "Planejado" }, { value: "NOT_STARTED", label: "Não iniciado" }, { value: "IN_PROGRESS", label: "Em andamento" }, { value: "PAUSED", label: "Pausado" }, { value: "COMPLETED", label: "Concluído" }, { value: "CANCELLED", label: "Cancelado" },
];

function formatHours(value: number) { const minutes = Math.round(Math.max(0, value) * 60); const hours = Math.floor(minutes / 60); const rest = minutes % 60; return hours ? (rest ? `${hours}h ${rest}min` : `${hours}h`) : `${rest}min`; }

function LineChart({ rows }: { rows: DashboardData["dailyEvolution"] }) {
  const width = 700; const height = 220; const padX = 34; const padY = 28; const max = Math.max(...rows.map((row) => row.hours), 1);
  const points = rows.map((row, index) => ({ x: padX + (rows.length <= 1 ? 0 : index * ((width - padX * 2) / (rows.length - 1))), y: height - padY - (row.hours / max) * (height - padY * 2), ...row }));
  const line = points.map((point) => `${point.x},${point.y}`).join(" ");
  return <div className="redesign-line-chart"><svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Evolução das horas"><defs><linearGradient id="line-fill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#4454F4" stopOpacity=".25" /><stop offset="100%" stopColor="#4454F4" stopOpacity="0" /></linearGradient></defs>{[0.25, 0.5, 0.75, 1].map((ratio) => <line key={ratio} x1={padX} x2={width - padX} y1={height - padY - ratio * (height - padY * 2)} y2={height - padY - ratio * (height - padY * 2)} stroke="#E8EDF5" strokeDasharray="4 5" />)}{points.length > 1 && <polygon points={`${padX},${height-padY} ${line} ${width-padX},${height-padY}`} fill="url(#line-fill)" />}<polyline points={line} fill="none" stroke="#4454F4" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />{points.map((point) => <g key={point.date}><circle cx={point.x} cy={point.y} r="5" fill="#fff" stroke="#4454F4" strokeWidth="3" /><text x={point.x} y={point.y - 12} textAnchor="middle" fontSize="10" fontWeight="700" fill="#101828">{formatHours(point.hours)}</text><text x={point.x} y={height - 6} textAnchor="middle" fontSize="10" fill="#667085">{point.label}</text></g>)}</svg></div>;
}

function Heatmap({ rows }: { rows: DashboardData["consistency"] }) {
  const max = Math.max(...rows.map((row) => row.hours), 1);
  return <div><div className="dashboard-calendar-grid">{rows.slice(-35).map((row) => { const level = row.hours <= 0 ? 0 : row.hours < max * .34 ? 1 : row.hours < max * .67 ? 2 : 3; return <span key={row.date} className={`level-${level}`} title={`${row.date}: ${formatHours(row.hours)}`}>{Number(row.date.slice(8, 10))}</span>; })}</div><div className="calendar-legend"><span>Menos</span><i /><i className="level-1" /><i className="level-2" /><i className="level-3" /><span>Mais</span></div></div>;
}

export function DashboardManager({ areas, platforms, studyTypes, databaseReady, rememberFilters }: { areas: DashboardFilterOption[]; platforms: DashboardFilterOption[]; studyTypes: DashboardFilterOption[]; databaseReady: boolean; rememberFilters: boolean }) {
  const [filters, setFilters] = useState<DashboardFilters>(defaultFilters);
  const [hydrated, setHydrated] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(databaseReady);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      if (rememberFilters) {
        try { const stored = sessionStorage.getItem(storageKey); if (stored) setFilters({ ...defaultFilters, ...JSON.parse(stored) }); } catch { sessionStorage.removeItem(storageKey); }
      }
      setHydrated(true);
    });
    return () => window.cancelAnimationFrame(frame);
  }, [rememberFilters]);

  useEffect(() => { if (hydrated && rememberFilters) sessionStorage.setItem(storageKey, JSON.stringify(filters)); }, [filters, hydrated, rememberFilters]);

  const loadDashboard = useCallback(async () => {
    if (!databaseReady || !hydrated) return;
    setLoading(true); setError(null);
    const params = new URLSearchParams({ range: filters.range });
    if (filters.range === "custom") { if (filters.start) params.set("start", filters.start); if (filters.end) params.set("end", filters.end); }
    if (filters.group) params.set("group", filters.group);
    if (filters.areaId) params.set("areaId", filters.areaId);
    if (filters.platformId) params.set("platformId", filters.platformId);
    if (filters.courseStatus) params.set("courseStatus", filters.courseStatus);
    if (filters.studyTypeId) params.set("studyTypeId", filters.studyTypeId);
    try { const response = await fetch(`/api/dashboard?${params.toString()}`, { cache: "no-store" }); const payload = await response.json().catch(() => ({})); if (!response.ok) throw new Error(payload.message ?? "Não foi possível carregar o Dashboard."); setData(payload.dashboard as DashboardData); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Não foi possível carregar o Dashboard."); }
    finally { setLoading(false); }
  }, [databaseReady, filters, hydrated]);

  useEffect(() => { const timer = window.setTimeout(loadDashboard, 120); return () => window.clearTimeout(timer); }, [loadDashboard]);

  const groupTab = filters.group === "LANGUAGE" ? "languages" : filters.group === "PROFESSIONAL" ? "professional" : "all";
  const goalProgress = data?.summary.monthlyGoalProgress ?? 0;
  const filterCount = [filters.areaId, filters.platformId, filters.courseStatus, filters.studyTypeId, filters.range !== "7d" ? filters.range : null].filter(Boolean).length;

  function clearFilters() { setFilters({ ...defaultFilters, group: filters.group }); if (rememberFilters) sessionStorage.removeItem(storageKey); }
  function setGroup(value: string) { setFilters((current) => ({ ...current, group: value === "languages" ? "LANGUAGE" : value === "professional" ? "PROFESSIONAL" : null })); }

  return <>
    <PageHeader title="Dashboard" subtitle="Acompanhe seu desempenho e veja sua evolução nos estudos." actions={<button className="secondary-button" type="button" onClick={() => setFiltersOpen(true)}><Filter size={17} /> Filtrar{filterCount ? ` (${filterCount})` : ""}</button>} />
    <div className="content redesign-content dashboard-redesign">
      {!databaseReady && <div className="settings-notice error">Confirme as migrations do Supabase antes de usar o Dashboard.</div>}
      {error && <div className="settings-notice error"><span>{error}</span><button className="secondary-button compact-button" type="button" onClick={loadDashboard}><RefreshCw size={15} /> Tentar novamente</button></div>}
      {loading && <div className="dashboard-overlay-loading"><LoaderCircle className="spin" size={24} /> Atualizando indicadores...</div>}

      {data && <>
        <section className="dashboard-summary-grid">
          <SummaryCard label="Horas estudadas" value={formatHours(data.metrics.totalHours)} helper={`no período: ${data.period.label}`} icon={Clock3} color="#2F6BFF" />
          <SummaryCard label="Dias com estudo" value={`${data.summary.studyDays} dias`} helper="consistência no período" icon={CalendarDays} color="#16A34A" />
          <SummaryCard label="Cursos concluídos" value={String(data.metrics.completedCourses)} helper={`${data.metrics.inProgressCourses} em andamento`} icon={GraduationCap} color="#7C3AED" />
          <SummaryCard label="Meta do período" value={`${Math.round(goalProgress)}%`} helper={`${formatHours(data.metrics.totalHours)} realizadas`} icon={Target} color="#F97316" progress={goalProgress} />
        </section>

        <FilterChips items={[{ value: "all", label: "Visão geral", icon: BookOpenCheck }, { value: "languages", label: "Idiomas", icon: Languages }, { value: "professional", label: "Profissionalizantes", icon: GraduationCap }]} value={groupTab} onChange={setGroup} ariaLabel="Visões do Dashboard" />

        <div className="dashboard-main-grid">
          <section className="card dashboard-chart-card wide"><div className="section-heading"><div><Clock3 size={19} /><h2>Evolução das horas</h2></div><select className="inline-select" value={filters.range} onChange={(event) => setFilters((current) => ({ ...current, range: event.target.value as DashboardRange }))}>{ranges.slice(0, 4).map((range) => <option key={range.value} value={range.value}>{range.label}</option>)}</select></div>{data.dailyEvolution.some((row) => row.hours > 0) ? <LineChart rows={data.dailyEvolution} /> : <EmptyState compact title="Sem horas no período" description="Registre estudos para visualizar a evolução diária." />}</section>

          <section className="card dashboard-chart-card"><div className="section-heading"><div><Target size={19} /><h2>Distribuição do tempo</h2></div><span>{data.period.label}</span></div>{data.timeDistribution.length ? <div className="distribution-layout"><Donut value={100} center={formatHours(data.metrics.totalHours)} label="Total" color={data.timeDistribution[0]?.color} size={152} /><div className="distribution-list">{data.timeDistribution.slice(0, 6).map((row) => <div key={row.id}><i style={{ background: row.color }} /><span>{row.label}</span><strong>{Math.round(row.share)}%</strong><small>{formatHours(row.hours)}</small></div>)}</div></div> : <EmptyState compact title="Sem distribuição" description="Ainda não há horas para comparar." />}</section>

          <section className="card dashboard-chart-card"><div className="section-heading"><div><GraduationCap size={19} /><h2>Progresso dos cursos</h2></div></div>{data.courseProgress.length ? <div className="dashboard-progress-list">{data.courseProgress.slice(0, 6).map((course) => <div key={course.id}><span className="progress-course-name"><i style={{ background: course.color }} />{course.name}</span><ProgressBar value={course.progress} color={course.color} /><strong>{Math.round(course.progress)}%</strong></div>)}</div> : <EmptyState compact title="Sem cursos ativos" description="Os cursos em andamento aparecerão aqui." />}</section>

          <section className="card dashboard-chart-card"><div className="section-heading"><div><CalendarDays size={19} /><h2>Consistência</h2></div><span>{data.summary.studyDays} dias</span></div>{data.consistency.length ? <Heatmap rows={data.consistency} /> : <EmptyState compact title="Sem consistência" description="Registre estudos para preencher o calendário." />}</section>

          <section className="card dashboard-chart-card"> <div className="section-heading"><div><Languages size={19} /><h2>Habilidades estudadas</h2></div></div>{data.languageSkills.length ? <div className="skill-list">{data.languageSkills.map((skill, index) => { const colors = ["#2F6BFF", "#7C3AED", "#16A34A", "#F97316", "#EC4899", "#0D9488", "#EAB308"]; const color = colors[index % colors.length]; return <div key={skill.key}><span>{skill.label}</span><ProgressBar value={skill.share} color={color} /><strong>{Math.round(skill.share)}%</strong></div>; })}</div> : <EmptyState compact title="Sem habilidades registradas" description="Ao registrar um idioma, selecione leitura, conversação, vocabulário e outras habilidades." />}</section>
        </div>
      </>}
    </div>

    {filtersOpen && <div className="drawer-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setFiltersOpen(false); }}><aside className="filter-side-drawer" role="dialog" aria-modal="true" aria-label="Filtros do Dashboard"><header><div><h2>Filtrar Dashboard</h2><p>Todos os painéis serão atualizados em conjunto.</p></div><button className="icon-action" type="button" onClick={() => setFiltersOpen(false)} aria-label="Fechar"><X size={18} /></button></header><div className="drawer-fields"><label>Período<select className="form-control" value={filters.range} onChange={(event) => setFilters((current) => ({ ...current, range: event.target.value as DashboardRange }))}>{ranges.map((range) => <option key={range.value} value={range.value}>{range.label}</option>)}</select></label>{filters.range === "custom" && <><label>Data inicial<input className="form-control" type="date" value={filters.start ?? ""} onChange={(event) => setFilters((current) => ({ ...current, start: event.target.value || null }))} /></label><label>Data final<input className="form-control" type="date" value={filters.end ?? ""} onChange={(event) => setFilters((current) => ({ ...current, end: event.target.value || null }))} /></label></>}<label>Área<select className="form-control" value={filters.areaId ?? ""} onChange={(event) => setFilters((current) => ({ ...current, areaId: event.target.value || null }))}><option value="">Todas</option>{areas.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label><label>Plataforma<select className="form-control" value={filters.platformId ?? ""} onChange={(event) => setFilters((current) => ({ ...current, platformId: event.target.value || null }))}><option value="">Todas</option>{platforms.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label><label>Status<select className="form-control" value={filters.courseStatus ?? ""} onChange={(event) => setFilters((current) => ({ ...current, courseStatus: event.target.value ? event.target.value as CourseStatus : null }))}><option value="">Todos</option>{statuses.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label><label>Tipo de estudo<select className="form-control" value={filters.studyTypeId ?? ""} onChange={(event) => setFilters((current) => ({ ...current, studyTypeId: event.target.value || null }))}><option value="">Todos</option>{studyTypes.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label></div><footer><button className="secondary-button" type="button" onClick={clearFilters}>Limpar filtros</button><button className="primary-button" type="button" onClick={() => setFiltersOpen(false)}>Aplicar</button></footer></aside></div>}
  </>;
}
