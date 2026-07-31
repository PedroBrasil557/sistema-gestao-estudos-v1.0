"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Award,
  BookOpenCheck,
  CalendarClock,
  Clock3,
  FilterX,
  Gauge,
  GraduationCap,
  LoaderCircle,
  PlayCircle,
  RefreshCw,
  TrendingUp,
} from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Donut, HorizontalBars, MetricCard, MiniColumnChart, Panel, ProgressBar } from "@/components/ui";
import { courseStatusLabels } from "@/lib/dashboard/calculations";
import type { CourseStatus } from "@/types/course";
import type { DashboardData, DashboardFilterOption, DashboardFilters, DashboardRange } from "@/types/dashboard";

const ranges: Array<{ value: DashboardRange; label: string }> = [
  { value: "7d", label: "Últimos 7 dias" },
  { value: "30d", label: "Últimos 30 dias" },
  { value: "month", label: "Mês atual" },
  { value: "year", label: "Ano atual" },
  { value: "all", label: "Todo o período" },
  { value: "custom", label: "Personalizado" },
];

const statuses: CourseStatus[] = ["PLANNED", "NOT_STARTED", "IN_PROGRESS", "PAUSED", "COMPLETED", "CANCELLED"];
const storageKey = "study-dashboard-filters-v0.11";

const defaultFilters: DashboardFilters = {
  range: "month",
  start: null,
  end: null,
  areaId: null,
  platformId: null,
  courseStatus: null,
  studyTypeId: null,
};

function formatHours(value: number) {
  const totalMinutes = Math.round(Math.max(0, value) * 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) return `${minutes}min`;
  if (minutes === 0) return `${hours}h`;
  return `${hours}h ${String(minutes).padStart(2, "0")}m`;
}

function formatDate(value: string) {
  const [year, month, day] = value.slice(0, 10).split("-");
  return `${day}/${month}/${year}`;
}

function percentage(value: number) {
  return `${Math.round(value)}%`;
}

function EmptyState({ children }: { children: string }) {
  return <div className="dashboard-empty">{children}</div>;
}

function LoadingState() {
  return (
    <div className="dashboard-loading" role="status">
      <LoaderCircle size={24} className="spin" />
      <span>Atualizando indicadores e gráficos...</span>
    </div>
  );
}

export function DashboardManager({
  areas,
  platforms,
  studyTypes,
  databaseReady,
  rememberFilters,
}: {
  areas: DashboardFilterOption[];
  platforms: DashboardFilterOption[];
  studyTypes: DashboardFilterOption[];
  databaseReady: boolean;
  rememberFilters: boolean;
}) {
  const [filters, setFilters] = useState<DashboardFilters>(defaultFilters);
  const [hydrated, setHydrated] = useState(false);
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(databaseReady);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
  const frame = window.requestAnimationFrame(() => {
    if (rememberFilters) {
      try {
        const stored = sessionStorage.getItem(storageKey);

        if (stored) {
          setFilters({
            ...defaultFilters,
            ...JSON.parse(stored),
          });
        }
      } catch {
        sessionStorage.removeItem(storageKey);
      }
    }

    setHydrated(true);
  });

  return () => {
    window.cancelAnimationFrame(frame);
  };
}, [rememberFilters]);

  useEffect(() => {
    if (!hydrated || !rememberFilters) return;
    sessionStorage.setItem(storageKey, JSON.stringify(filters));
  }, [filters, hydrated, rememberFilters]);

  const loadDashboard = useCallback(async () => {
    if (!databaseReady || !hydrated) return;
    setLoading(true);
    setError(null);
    const params = new URLSearchParams({ range: filters.range });
    if (filters.range === "custom") {
      if (filters.start) params.set("start", filters.start);
      if (filters.end) params.set("end", filters.end);
    }
    if (filters.areaId) params.set("areaId", filters.areaId);
    if (filters.platformId) params.set("platformId", filters.platformId);
    if (filters.courseStatus) params.set("courseStatus", filters.courseStatus);
    if (filters.studyTypeId) params.set("studyTypeId", filters.studyTypeId);

    try {
      const response = await fetch(`/api/dashboard?${params.toString()}`, { cache: "no-store" });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.message ?? "Não foi possível carregar o Dashboard.");
      setData(payload.dashboard as DashboardData);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Não foi possível carregar o Dashboard.");
    } finally {
      setLoading(false);
    }
  }, [databaseReady, filters, hydrated]);

  useEffect(() => {
    const timer = window.setTimeout(loadDashboard, 120);
    return () => window.clearTimeout(timer);
  }, [loadDashboard]);

  function clearFilters() {
    setFilters(defaultFilters);
    if (rememberFilters) sessionStorage.removeItem(storageKey);
  }

  const totalCourses = data?.coursesByStatus.reduce((sum, item) => sum + item.count, 0) ?? 0;
  const completedCount = data?.coursesByStatus.find((item) => item.status === "COMPLETED")?.count ?? 0;
  const completedShare = totalCourses > 0 ? (completedCount / totalCourses) * 100 : 0;
  const topStudyTypeShare = data && data.metrics.totalHours > 0 && data.studyTypes[0]
    ? (data.studyTypes[0].hours / data.metrics.totalHours) * 100
    : 0;
  const maxConsistencyHours = Math.max(...(data?.consistency.map((day) => day.hours) ?? []), 1);

  const filtersActive = useMemo(() => (
    filters.range !== "month" || Boolean(filters.areaId || filters.platformId || filters.courseStatus || filters.studyTypeId)
  ), [filters]);

  return (
    <>
      <PageHeader
        title="Dashboard"
        subtitle="Acompanhe sua evolução com filtros globais e indicadores calculados a partir dos seus dados reais."
        actions={data ? <span className="dashboard-period-pill">{data.period.label}</span> : undefined}
      />

      <div className="content">
        {!databaseReady && (
          <div className="notice error">O banco de dados ainda não está preparado para o Dashboard. Confirme as migrações das versões anteriores.</div>
        )}

        <section className="dashboard-filter-card" aria-label="Filtros do Dashboard">
          <div className="dashboard-filter-grid">
            <label>
              <span>Período</span>
              <select className="filter-select" value={filters.range} onChange={(event) => setFilters((current) => ({ ...current, range: event.target.value as DashboardRange }))}>
                {ranges.map((range) => <option key={range.value} value={range.value}>{range.label}</option>)}
              </select>
            </label>

            {filters.range === "custom" && (
              <>
                <label><span>Data inicial</span><input className="form-control" type="date" value={filters.start ?? ""} onChange={(event) => setFilters((current) => ({ ...current, start: event.target.value || null }))} /></label>
                <label><span>Data final</span><input className="form-control" type="date" value={filters.end ?? ""} onChange={(event) => setFilters((current) => ({ ...current, end: event.target.value || null }))} /></label>
              </>
            )}

            <label>
              <span>Área</span>
              <select className="filter-select" value={filters.areaId ?? ""} onChange={(event) => setFilters((current) => ({ ...current, areaId: event.target.value || null }))}>
                <option value="">Todas as áreas</option>
                {areas.map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}
              </select>
            </label>

            <label>
              <span>Plataforma</span>
              <select className="filter-select" value={filters.platformId ?? ""} onChange={(event) => setFilters((current) => ({ ...current, platformId: event.target.value || null }))}>
                <option value="">Todas as plataformas</option>
                {platforms.map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}
              </select>
            </label>

            <label>
              <span>Status do curso</span>
              <select className="filter-select" value={filters.courseStatus ?? ""} onChange={(event) => setFilters((current) => ({ ...current, courseStatus: (event.target.value || null) as CourseStatus | null }))}>
                <option value="">Todos os status</option>
                {statuses.map((status) => <option value={status} key={status}>{courseStatusLabels[status]}</option>)}
              </select>
            </label>

            <label>
              <span>Tipo de estudo</span>
              <select className="filter-select" value={filters.studyTypeId ?? ""} onChange={(event) => setFilters((current) => ({ ...current, studyTypeId: event.target.value || null }))}>
                <option value="">Todos os tipos</option>
                {studyTypes.map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}
              </select>
            </label>
          </div>

          <div className="dashboard-filter-actions">
            <span>{data?.period.label ?? "Carregando período..."}</span>
            <div>
              <button className="secondary-button" type="button" onClick={loadDashboard} disabled={loading}><RefreshCw size={15} /> Atualizar</button>
              <button className="secondary-button" type="button" onClick={clearFilters} disabled={!filtersActive && !loading}><FilterX size={15} /> Limpar filtros</button>
            </div>
          </div>
        </section>

        {error && <div className="notice error"><strong>Erro:</strong> {error} <button className="link-button" type="button" onClick={loadDashboard}>Tentar novamente</button></div>}
        {loading && !data ? <LoadingState /> : null}

        {data && (
          <div className={loading ? "dashboard-refreshing" : ""} aria-busy={loading}>
            <section className="metrics-grid">
              <MetricCard label="Total de horas" value={formatHours(data.metrics.totalHours)} helper={`no período · ${data.period.label}`} icon={Clock3} tone="blue" />
              <MetricCard label="Cursos concluídos" value={String(data.metrics.completedCourses)} helper="concluídos no período" icon={GraduationCap} tone="purple" />
              <MetricCard label="Em andamento" value={String(data.metrics.inProgressCourses)} helper="cursos ativos nos filtros" icon={PlayCircle} tone="orange" />
              <MetricCard label="Certificados obtidos" value={String(data.metrics.certificatesObtained)} helper="emitidos no período" icon={Award} tone="green" />
              <MetricCard label="Média mensal" value={formatHours(data.metrics.monthlyAverageHours)} helper="média no período selecionado" icon={Gauge} tone="cyan" />
              <MetricCard label="Progresso geral" value={percentage(data.metrics.generalProgress)} helper="ponderado pela carga horária" progress={data.metrics.generalProgress} icon={TrendingUp} tone="purple" />
            </section>

            <div className="dashboard-grid">
              <Panel title="Evolução mensal (horas)" className="span-4">
                {data.monthlyEvolution.length ? (
                  <MiniColumnChart values={data.monthlyEvolution.map((item) => Number(item.hours.toFixed(1)))} labels={data.monthlyEvolution.map((item) => item.label)} />
                ) : <EmptyState>Você ainda não possui horas de estudo neste período.</EmptyState>}
              </Panel>

              <Panel title="Horas por área" className="span-4">
                {data.hoursByArea.length ? (
                  <HorizontalBars rows={data.hoursByArea.slice(0, 8).map((item) => ({ label: item.label, value: item.hours, text: formatHours(item.hours) }))} />
                ) : <EmptyState>Não há horas por área para os filtros selecionados.</EmptyState>}
              </Panel>

              <Panel title="Cursos por status" className="span-4">
                {totalCourses > 0 ? (
                  <div className="donut-layout">
                    <Donut value={completedShare} center={String(totalCourses)} label="Cursos" size={135} tone="green" />
                    <div className="legend">
                      {data.coursesByStatus.map((item, index) => (
                        <div className="legend-row" key={item.status}><i className={`legend-dot dashboard-dot-${index % 6}`} /><span>{item.label}</span><strong>{item.count}</strong></div>
                      ))}
                    </div>
                  </div>
                ) : <EmptyState>Nenhum curso corresponde aos filtros atuais.</EmptyState>}
              </Panel>

              <Panel title="Progresso por curso" className="span-4" action={<Link className="link-button" href="/cursos">Ver cursos</Link>}>
                {data.courseProgress.length ? (
                  <div className="stat-stack">
                    {data.courseProgress.map((course) => (
                      <div key={course.id}>
                        <div className="stat-line"><Link href={`/cursos/${course.id}`}>{course.name}</Link><strong>{percentage(course.progress)}</strong></div>
                        <ProgressBar value={course.progress} />
                        <small className="dashboard-subline">Restam {formatHours(course.remainingHours)}</small>
                      </div>
                    ))}
                  </div>
                ) : <EmptyState>Não há cursos ativos com progresso para exibir.</EmptyState>}
              </Panel>

              <Panel title="Tipos de estudo" className="span-4">
                {data.studyTypes.length ? (
                  <div className="donut-layout">
                    <Donut value={topStudyTypeShare} center={formatHours(data.metrics.totalHours)} label="Total" size={135} />
                    <div className="legend">
                      {data.studyTypes.slice(0, 7).map((item, index) => (
                        <div className="legend-row" key={item.label}><i className={`legend-dot dashboard-dot-${index % 6}`} /><span>{item.label}</span><strong>{formatHours(item.hours)}</strong></div>
                      ))}
                    </div>
                  </div>
                ) : <EmptyState>Nenhuma sessão de estudo foi encontrada neste período.</EmptyState>}
              </Panel>

              <Panel title="Plataformas" className="span-4">
                {data.platforms.length ? (
                  <HorizontalBars rows={data.platforms.slice(0, 8).map((item) => ({ label: item.label, value: item.hours || item.courses, text: item.hours > 0 ? formatHours(item.hours) : `${item.courses} curso(s)` }))} />
                ) : <EmptyState>Nenhuma plataforma corresponde aos filtros atuais.</EmptyState>}
              </Panel>

              <Panel title="Próximos prazos" className="span-3" action={<Link className="link-button" href="/cursos">Ver todos</Link>}>
                {data.deadlines.length ? (
                  <div className="list">
                    {data.deadlines.map((item) => (
                      <div className="info-row" key={item.id}>
                        <Link href={`/cursos/${item.id}`}>{item.name}</Link>
                        <span><strong className={item.daysRemaining <= 7 ? "danger-text" : ""}>{formatDate(item.date)}</strong><small>{item.daysRemaining === 0 ? "hoje" : `${item.daysRemaining} dia(s)`}</small></span>
                      </div>
                    ))}
                  </div>
                ) : <EmptyState>Nenhum prazo futuro encontrado.</EmptyState>}
              </Panel>

              <Panel title="Cursos recentemente concluídos" className="span-3" action={<Link className="link-button" href="/cursos">Ver todos</Link>}>
                {data.recentlyCompleted.length ? (
                  <div className="list">
                    {data.recentlyCompleted.map((item) => (
                      <div className="list-item" key={item.id}>
                        <div className="list-item-main"><div className="list-icon" style={{ color: "var(--success)", background: "var(--success-soft)" }}><BookOpenCheck size={15} /></div><div><Link href={`/cursos/${item.id}`}><strong>{item.name}</strong></Link><small>Curso concluído</small></div></div>
                        <span className="list-item-value">{formatDate(item.date)}</span>
                      </div>
                    ))}
                  </div>
                ) : <EmptyState>Nenhum curso concluído dentro dos filtros atuais.</EmptyState>}
              </Panel>

              <Panel title="Últimos estudos" className="span-3" action={<Link className="link-button" href="/estudos">Ver estudos</Link>}>
                {data.latestStudies.length ? (
                  <div className="list">
                    {data.latestStudies.map((item) => (
                      <div className="list-item" key={item.id}>
                        <div className="list-item-main"><div className="list-icon">◎</div><div><strong>{item.courseName}</strong><small>{item.topic} · {item.studyType}</small></div></div>
                        <span className="list-item-value">{formatHours(item.hours)}<small>{formatDate(item.date)}</small></span>
                      </div>
                    ))}
                  </div>
                ) : <EmptyState>Nenhum estudo com horas registradas neste período.</EmptyState>}
              </Panel>

              <Panel title="Resumo do período" className="span-3">
                <div className="list">
                  <div className="list-item"><div className="list-item-main"><div className="list-icon">◎</div><div><strong>{data.summary.topArea ? `Maior foco em ${data.summary.topArea}` : "Sem área predominante"}</strong><small>{data.summary.topArea ? `${percentage(data.summary.topAreaShare)} das horas do período` : "Registre estudos para gerar o resumo"}</small></div></div></div>
                  <div className="list-item"><div className="list-item-main"><div className="list-icon">▣</div><div><strong>{data.summary.studyDays} dia(s) com estudo</strong><small>Consistência dentro do período filtrado</small></div></div></div>
                  <div className="list-item"><div className="list-item-main"><div className="list-icon">↗</div><div><strong>Meta mensal em {percentage(data.summary.monthlyGoalProgress)}</strong><small>{data.summary.topPlatform ? `Plataforma com maior atividade: ${data.summary.topPlatform}` : "Nenhuma plataforma com atividade"}</small></div></div></div>
                </div>
              </Panel>

              <Panel title="Consistência de estudos" className="span-6">
                {data.consistency.length ? (
                  <>
                    <div className="dashboard-consistency" role="list" aria-label="Consistência diária">
                      {data.consistency.map((day) => {
                        const level = day.hours <= 0 ? 0 : day.hours >= maxConsistencyHours * .66 ? 3 : day.hours >= maxConsistencyHours * .33 ? 2 : 1;
                        return <span role="listitem" className={`level-${level}`} key={day.date} title={`${formatDate(day.date)} · ${formatHours(day.hours)} · ${day.sessions} sessão(ões)`} aria-label={`${formatDate(day.date)}: ${formatHours(day.hours)}`} />;
                      })}
                    </div>
                    <div className="heatmap-legend"><span><i className="level-3" /> Mais horas</span><span><i className="level-1" /> Menos horas</span><span><i /> Sem estudo</span></div>
                  </>
                ) : <EmptyState>Não há dias suficientes para montar o calendário de consistência.</EmptyState>}
              </Panel>

              <Panel title="Previsão de conclusão" className="span-6">
                {data.forecast.length ? (
                  <div className="list">
                    {data.forecast.map((item) => (
                      <div className="list-item" key={item.id}>
                        <div className="list-item-main"><div className="list-icon"><CalendarClock size={15} /></div><div><Link href={`/cursos/${item.id}`}><strong>{item.name}</strong></Link><small>{formatHours(item.remainingHours)} restantes</small></div></div>
                        <span className="list-item-value">{item.estimatedWeeks ? `~${item.estimatedWeeks} sem.` : "Sem média"}</span>
                      </div>
                    ))}
                  </div>
                ) : <EmptyState>Não há cursos ativos suficientes para gerar uma previsão.</EmptyState>}
              </Panel>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
