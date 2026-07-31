"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Award, CalendarClock, CheckCircle2, Download, ExternalLink, Eye, FileBadge2, Hourglass, LoaderCircle, Pencil, Plus, RotateCcw, Search, ShieldCheck, Target, Trash2, Trophy } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Badge, Donut, MetricCard, MiniColumnChart, Panel } from "@/components/ui";
import { CertificateFormModal } from "@/components/certificates/certificate-form-modal";
import type { Certificate, CertificateCourse } from "@/types/certificate";

type DeletedFilter = "active" | "deleted" | "all";
type AvailableFilter = "all" | "available" | "pending";
type ValidityFilter = "all" | "expiring" | "expired";

function formatDate(value: string | null) {
  if (!value) return "—";
  const [year, month, day] = value.slice(0, 10).split("-");
  return `${day}/${month}/${year}`;
}

function formatBytes(value: number | null) {
  if (!value) return "";
  if (value < 1024 * 1024) return `${Math.max(1, Math.round(value / 1024))} KB`;
  return `${(value / (1024 * 1024)).toFixed(1).replace(".", ",")} MB`;
}

function localDate() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

function datePlusDays(days: number) {
  const date = new Date(); date.setDate(date.getDate() + days);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function validity(certificate: Certificate) {
  if (!certificate.expirationDate) return { text: "Sem validade", tone: "gray" as const };
  const today = localDate();
  if (certificate.expirationDate < today) return { text: "Expirado", tone: "red" as const };
  if (certificate.expirationDate <= datePlusDays(60)) return { text: "Vence em breve", tone: "orange" as const };
  return { text: "Válido", tone: "green" as const };
}

export function CertificatesManager({ initialCertificates, courses, annualGoal, trackingYear, databaseReady, defaultCourseId, initialOpen }: { initialCertificates: Certificate[]; courses: CertificateCourse[]; annualGoal: number; trackingYear: number; databaseReady: boolean; defaultCourseId?: string | null; initialOpen?: boolean }) {
  const [certificates, setCertificates] = useState(initialCertificates);
  const [modalOpen, setModalOpen] = useState(Boolean(initialOpen));
  const [editing, setEditing] = useState<Certificate | null>(null);
  const [notice, setNotice] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [availableFilter, setAvailableFilter] = useState<AvailableFilter>("all");
  const [validityFilter, setValidityFilter] = useState<ValidityFilter>("all");
  const [platformId, setPlatformId] = useState("");
  const [areaId, setAreaId] = useState("");
  const [deletedFilter, setDeletedFilter] = useState<DeletedFilter>("active");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const platforms = useMemo(() => Array.from(new Map(courses.map((course) => [course.platform.id, course.platform])).values()).sort((a,b) => a.name.localeCompare(b.name, "pt-BR")), [courses]);
  const areas = useMemo(() => Array.from(new Map(courses.map((course) => [course.area.id, course.area])).values()).sort((a,b) => a.name.localeCompare(b.name, "pt-BR")), [courses]);

  const active = certificates.filter((certificate) => !certificate.deletedAt);
  const obtained = active.filter((certificate) => certificate.isAvailable);
  const obtainedYear = obtained.filter((certificate) => (certificate.issueDate ?? certificate.completionDate ?? "").startsWith(String(trackingYear))).length;
  const expiring = obtained.filter((certificate) => certificate.expirationDate && certificate.expirationDate >= localDate() && certificate.expirationDate <= datePlusDays(60)).length;
  const expired = obtained.filter((certificate) => certificate.expirationDate && certificate.expirationDate < localDate()).length;
  const expectedCourseIds = new Set(active.map((certificate) => certificate.course.id));
  const expectedPending = courses.filter((course) => (course.emitsCertificate || course.kind === "CERTIFICATION") && !expectedCourseIds.has(course.id) && course.status !== "CANCELLED");
  const pendingCount = active.filter((certificate) => !certificate.isAvailable).length + expectedPending.length;
  const goalProgress = annualGoal > 0 ? Math.round((obtainedYear / annualGoal) * 100) : 0;

  const filtered = certificates.filter((certificate) => {
    const deletedMatch = deletedFilter === "all" || (deletedFilter === "deleted" ? Boolean(certificate.deletedAt) : !certificate.deletedAt);
    const availableMatch = availableFilter === "all" || (availableFilter === "available" ? certificate.isAvailable : !certificate.isAvailable);
    const valid = validity(certificate).text;
    const validityMatch = validityFilter === "all" || (validityFilter === "expired" ? valid === "Expirado" : valid === "Vence em breve");
    const platformMatch = !platformId || certificate.course.platform.id === platformId;
    const areaMatch = !areaId || certificate.course.area.id === areaId;
    const haystack = `${certificate.course.name} ${certificate.course.platform.name} ${certificate.course.area.name} ${certificate.credentialCode ?? ""} ${certificate.notes ?? ""}`.toLocaleLowerCase("pt-BR");
    const searchMatch = !search.trim() || haystack.includes(search.trim().toLocaleLowerCase("pt-BR"));
    return deletedMatch && availableMatch && validityMatch && platformMatch && areaMatch && searchMatch;
  }).sort((a, b) => (b.issueDate ?? b.completionDate ?? b.createdAt).localeCompare(a.issueDate ?? a.completionDate ?? a.createdAt));

  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, pages);
  const visible = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  const monthly = useMemo(() => Array.from({ length: 12 }, (_, month) => obtained.filter((certificate) => {
    const date = certificate.issueDate ?? certificate.completionDate;
    if (!date) return false;
    return date.startsWith(`${trackingYear}-${String(month + 1).padStart(2, "0")}`);
  }).length), [obtained, trackingYear]);

  const byArea = useMemo(() => Array.from(obtained.reduce((map, certificate) => map.set(certificate.course.area.name, (map.get(certificate.course.area.name) ?? 0) + 1), new Map<string, number>()).entries()).sort((a,b) => b[1]-a[1]).slice(0, 5), [obtained]);

  function upsert(saved: Certificate) {
    setCertificates((current) => {
      const exists = current.some((item) => item.id === saved.id);
      return exists ? current.map((item) => item.id === saved.id ? saved : item) : [saved, ...current];
    });
  }

  function openCreate() { setEditing(null); setModalOpen(true); setNotice(null); }
  function openEdit(certificate: Certificate) { setEditing(certificate); setModalOpen(true); setNotice(null); }

  async function remove(certificate: Certificate) {
    if (!window.confirm(`Mover o certificado de “${certificate.course.name}” para a lixeira? O arquivo privado será preservado.`)) return;
    setLoadingId(certificate.id);
    const response = await fetch(`/api/certificates/${certificate.id}`, { method: "DELETE" });
    const result = await response.json().catch(() => ({})) as { message?: string; certificate?: Certificate };
    setLoadingId(null);
    if (!response.ok || !result.certificate) { setNotice({ type: "error", text: result.message ?? "Não foi possível excluir." }); return; }
    upsert(result.certificate); setNotice({ type: "success", text: result.message ?? "Certificado excluído." });
  }

  async function restore(certificate: Certificate) {
    setLoadingId(certificate.id);
    const response = await fetch(`/api/certificates/${certificate.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "restore" }) });
    const result = await response.json().catch(() => ({})) as { message?: string; certificate?: Certificate };
    setLoadingId(null);
    if (!response.ok || !result.certificate) { setNotice({ type: "error", text: result.message ?? "Não foi possível restaurar." }); return; }
    upsert(result.certificate); setNotice({ type: "success", text: result.message ?? "Certificado restaurado." });
  }

  function clearFilters() { setSearch(""); setAvailableFilter("all"); setValidityFilter("all"); setPlatformId(""); setAreaId(""); setDeletedFilter("active"); setPage(1); }

  return <>
    <PageHeader title="Certificados" subtitle="Acompanhe, gerencie e celebre cada conquista da sua jornada." actions={<button className="header-button" type="button" onClick={openCreate} disabled={!databaseReady}><Plus size={17} /><span className="button-label">Novo certificado</span></button>} />
    <div className="content">
      {!databaseReady && <div className="settings-notice error"><strong>Banco da v0.10 ainda não preparado.</strong> Execute a migração <code>202607290006_v0_10_certificates.sql</code> no Supabase.</div>}
      {notice && <div className={`settings-notice ${notice.type}`} role="status">{notice.text}</div>}
      <section className="metrics-grid five">
        <MetricCard label="Certificados obtidos" value={String(obtained.length)} helper="disponíveis" icon={Trophy} tone="green" />
        <MetricCard label={`Obtidos em ${trackingYear}`} value={String(obtainedYear)} helper="conquistas no ano" icon={Award} tone="blue" />
        <MetricCard label="Pendentes" value={String(pendingCount)} helper="emitidos ou esperados" icon={Hourglass} tone="orange" />
        <MetricCard label="Validade próxima" value={String(expiring)} helper={expired ? `${expired} expirado(s)` : "próximos 60 dias"} icon={CalendarClock} tone={expired ? "red" : "purple"} />
        <MetricCard label="Meta anual" value={`${obtainedYear}/${annualGoal}`} helper={`${goalProgress}% alcançada`} progress={goalProgress} icon={Target} tone="cyan" />
      </section>

      <div className="dashboard-grid">
        <Panel title="Meus certificados" className="span-9">
          <div className="toolbar certificate-toolbar">
            <div className="search-box"><Search size={16} /><input aria-label="Buscar certificados" placeholder="Buscar curso, código ou observação..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} /></div>
            <select className="filter-select" aria-label="Disponibilidade" value={availableFilter} onChange={(e) => { setAvailableFilter(e.target.value as AvailableFilter); setPage(1); }}><option value="all">Todos os status</option><option value="available">Disponíveis</option><option value="pending">Não emitidos</option></select>
            <select className="filter-select" aria-label="Área" value={areaId} onChange={(e) => { setAreaId(e.target.value); setPage(1); }}><option value="">Todas as áreas</option>{areas.map((area) => <option key={area.id} value={area.id}>{area.name}</option>)}</select>
            <select className="filter-select" aria-label="Plataforma" value={platformId} onChange={(e) => { setPlatformId(e.target.value); setPage(1); }}><option value="">Todas as plataformas</option>{platforms.map((platform) => <option key={platform.id} value={platform.id}>{platform.name}</option>)}</select>
            <select className="filter-select" aria-label="Validade" value={validityFilter} onChange={(e) => { setValidityFilter(e.target.value as ValidityFilter); setPage(1); }}><option value="all">Toda validade</option><option value="expiring">Vence em 60 dias</option><option value="expired">Expirados</option></select>
            <select className="filter-select" aria-label="Lixeira" value={deletedFilter} onChange={(e) => { setDeletedFilter(e.target.value as DeletedFilter); setPage(1); }}><option value="active">Ativos</option><option value="deleted">Lixeira</option><option value="all">Todos</option></select>
            <button className="secondary-button" type="button" onClick={clearFilters}>Limpar filtros</button>
          </div>

          {visible.length ? <>
            <div className="data-table-wrap"><table className="data-table"><thead><tr><th>Curso / Certificação</th><th>Status</th><th>Plataforma</th><th>Emissão</th><th>Validade</th><th>Código / Arquivo</th><th aria-label="Ações" /></tr></thead><tbody>{visible.map((certificate) => {
              const valid = validity(certificate);
              return <tr key={certificate.id} className={certificate.deletedAt ? "note-row-deleted" : ""}>
                <td><div className="list-item-main"><div className="list-icon" style={{ color: certificate.isAvailable ? "var(--success)" : "var(--warning)", background: certificate.isAvailable ? "var(--success-soft)" : "var(--warning-soft)" }}>{certificate.isAvailable ? <CheckCircle2 size={15} /> : <FileBadge2 size={15} />}</div><div><Link href={`/cursos/${certificate.course.id}`} className="table-title">{certificate.course.name}</Link><span className="table-subtitle">{certificate.course.area.name} • {certificate.course.workloadHours || 0}h</span></div></div></td>
                <td data-label="Status"><Badge tone={certificate.isAvailable ? "green" : "orange"}>{certificate.isAvailable ? "Disponível" : "Pendente"}</Badge></td>
                <td data-label="Plataforma">{certificate.course.platform.name}</td>
                <td data-label="Emissão">{formatDate(certificate.issueDate ?? certificate.completionDate)}</td>
                <td data-label="Validade"><div className="review-badge-line"><Badge tone={valid.tone}>{valid.text}</Badge>{certificate.expirationDate && <span className="table-subtitle">{formatDate(certificate.expirationDate)}</span>}</div></td>
                <td data-label="Código / Arquivo"><span className="table-title">{certificate.credentialCode || "—"}</span>{certificate.fileName && <span className="table-subtitle">{certificate.fileName} {formatBytes(certificate.size)}</span>}</td>
                <td data-label="Ações"><div className="table-actions">{loadingId === certificate.id ? <LoaderCircle className="spin" size={15} /> : certificate.deletedAt ? <button className="table-icon-button" type="button" title="Restaurar" onClick={() => restore(certificate)}><RotateCcw size={14} /></button> : <>
                  {certificate.fileKey && <a className="table-icon-button" href={`/api/certificates/${certificate.id}/file`} target="_blank" rel="noreferrer" title="Visualizar arquivo"><Eye size={14} /></a>}
                  {certificate.fileKey && <a className="table-icon-button" href={`/api/certificates/${certificate.id}/file?download=1`} title="Baixar arquivo"><Download size={14} /></a>}
                  {certificate.validationUrl && <a className="table-icon-button" href={certificate.validationUrl} target="_blank" rel="noreferrer" title="Validar credencial"><ShieldCheck size={14} /></a>}
                  <button className="table-icon-button" type="button" title="Editar" onClick={() => openEdit(certificate)}><Pencil size={14} /></button>
                  <button className="table-icon-button" type="button" title="Excluir" onClick={() => remove(certificate)}><Trash2 size={14} /></button>
                </>}</div></td>
              </tr>;
            })}</tbody></table></div>
            <div className="table-footer"><span>Mostrando {(safePage - 1) * pageSize + 1} a {Math.min(safePage * pageSize, filtered.length)} de {filtered.length} certificados</span><div className="pagination"><button className="page-button" type="button" disabled={safePage <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>‹</button>{Array.from({ length: Math.min(5, pages) }, (_, index) => index + 1).map((item) => <button className={`page-button ${safePage === item ? "active" : ""}`} type="button" key={item} onClick={() => setPage(item)}>{item}</button>)}<button className="page-button" type="button" disabled={safePage >= pages} onClick={() => setPage((p) => Math.min(pages, p + 1))}>›</button></div></div>
          </> : <div className="courses-empty compact"><p>Nenhum certificado corresponde aos filtros atuais.</p><button className="primary-button" type="button" onClick={openCreate} disabled={!databaseReady}><Plus size={15} /> Novo certificado</button></div>}
        </Panel>

        <div className="span-3" style={{ display: "grid", gap: 12, alignContent: "start" }}>
          <Panel title="Progresso da meta"><div className="donut-layout"><Donut value={goalProgress} center={`${goalProgress}%`} label={`meta ${trackingYear}`} size={128} tone="green" /><div className="legend"><div className="legend-row"><i className="legend-dot green" /><span>Obtidos no ano</span><strong>{obtainedYear}</strong></div><div className="legend-row"><i className="legend-dot orange" /><span>Faltam</span><strong>{Math.max(annualGoal - obtainedYear, 0)}</strong></div><div className="legend-row"><i className="legend-dot gray" /><span>Meta</span><strong>{annualGoal}</strong></div></div></div></Panel>
          <Panel title="Próximos certificados">{expectedPending.length ? <div className="list">{expectedPending.slice(0, 6).map((course) => <div className="list-item" key={course.id}><div><Link href={`/cursos/${course.id}`}><strong>{course.name}</strong></Link><small>{course.platform.name}{course.targetCompletionDate ? ` • Meta: ${formatDate(course.targetCompletionDate)}` : ""}</small></div><Badge tone={course.status === "IN_PROGRESS" ? "orange" : "gray"}>{course.status === "IN_PROGRESS" ? "Em andamento" : "Pendente"}</Badge></div>)}</div> : <div className="panel-empty">Nenhum certificado esperado sem registro.</div>}</Panel>
          <Panel title="Segurança dos arquivos"><div className="side-list"><div className="side-list-item"><ShieldCheck size={16} /><span>Arquivos ficam em bucket privado no Supabase.</span></div><div className="side-list-item"><ExternalLink size={16} /><span>Visualização usa link temporário assinado por 60 segundos.</span></div><div className="side-list-item"><FileBadge2 size={16} /><span>PDF e imagens até 10 MB.</span></div></div></Panel>
        </div>

        <Panel title="Distribuição por área" className="span-4">{byArea.length ? <div className="stat-stack">{byArea.map(([area, count]) => <div key={area}><div className="stat-line"><span>{area}</span><strong>{count}</strong></div><div className="progress"><span className="tone-green" style={{ width: `${Math.max(8, (count / Math.max(obtained.length, 1)) * 100)}%` }} /></div></div>)}</div> : <div className="panel-empty">Nenhum certificado disponível para calcular.</div>}</Panel>
        <Panel title={`Evolução de certificados (${trackingYear})`} className="span-5"><MiniColumnChart values={monthly} labels={["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"]} unit="" /></Panel>
        <Panel title="Tipos de conquista" className="span-3"><div className="stat-stack"><div><div className="stat-line"><span>Cursos</span><strong>{obtained.filter((item) => item.course.kind === "COURSE").length}</strong></div></div><div><div className="stat-line"><span>Certificações profissionais</span><strong>{obtained.filter((item) => item.course.kind === "CERTIFICATION").length}</strong></div></div><div><div className="stat-line"><span>Com arquivo</span><strong>{obtained.filter((item) => item.fileKey).length}</strong></div></div></div></Panel>
      </div>
    </div>
    {modalOpen && <CertificateFormModal certificate={editing} courses={courses} defaultCourseId={defaultCourseId} onClose={() => { setModalOpen(false); setEditing(null); }} onSaved={(saved, message) => { upsert(saved); setModalOpen(false); setEditing(null); setNotice({ type: "success", text: message }); }} />}
  </>;
}
