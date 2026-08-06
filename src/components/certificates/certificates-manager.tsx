"use client";

import Link from "next/link";
import { useMemo, useState, type CSSProperties } from "react";
import {
  Award,
  CalendarClock,
  Download,
  ExternalLink,
  Eye,
  FileBadge2,
  LoaderCircle,
  MoreHorizontal,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  Target,
  Trash2,
  Trophy,
} from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Badge, EmptyState, SummaryCard } from "@/components/ui";
import { CertificateFormModal } from "@/components/certificates/certificate-form-modal";
import { courseIcon, pastelColor } from "@/lib/visuals";
import type { Certificate, CertificateCourse } from "@/types/certificate";

type StatusFilter = "all" | "available" | "pending" | "expiring" | "expired" | "deleted";
type Notice = { type: "success" | "error"; text: string } | null;

function localDate() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

function datePlusDays(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function formatDate(value: string | null) {
  if (!value) return "Não informado";
  const [year, month, day] = value.slice(0, 10).split("-");
  return `${day}/${month}/${year}`;
}

function certificateState(certificate: Certificate) {
  if (!certificate.isAvailable) return { label: "Pendente", color: "#F97316" };
  if (!certificate.expirationDate) return { label: "Válido", color: "#16A34A" };
  if (certificate.expirationDate < localDate()) return { label: "Vencido", color: "#DC3545" };
  if (certificate.expirationDate <= datePlusDays(60)) return { label: "Vence em breve", color: "#EAB308" };
  return { label: "Válido", color: "#16A34A" };
}

export function CertificatesManager({
  initialCertificates,
  courses,
  annualGoal,
  trackingYear,
  databaseReady,
  defaultCourseId,
  initialOpen,
}: {
  initialCertificates: Certificate[];
  courses: CertificateCourse[];
  annualGoal: number;
  trackingYear: number;
  databaseReady: boolean;
  defaultCourseId?: string | null;
  initialOpen?: boolean;
}) {
  const [certificates, setCertificates] = useState(initialCertificates);
  const [modalOpen, setModalOpen] = useState(Boolean(initialOpen));
  const [editing, setEditing] = useState<Certificate | null>(null);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [group, setGroup] = useState("");
  const [platform, setPlatform] = useState("");
  const [menuId, setMenuId] = useState<string | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [notice, setNotice] = useState<Notice>(null);

  const active = useMemo(() => certificates.filter((certificate) => !certificate.deletedAt), [certificates]);
  const obtained = useMemo(() => active.filter((certificate) => certificate.isAvailable), [active]);
  const pending = useMemo(() => active.filter((certificate) => !certificate.isAvailable), [active]);
  const expiring = useMemo(() => obtained.filter((certificate) => certificate.expirationDate && certificate.expirationDate >= localDate() && certificate.expirationDate <= datePlusDays(60)), [obtained]);
  const obtainedYear = useMemo(() => obtained.filter((certificate) => (certificate.issueDate ?? certificate.completionDate ?? "").startsWith(String(trackingYear))).length, [obtained, trackingYear]);
  const goalProgress = annualGoal > 0 ? Math.round((obtainedYear / annualGoal) * 100) : 0;

  const platforms = useMemo(() => Array.from(new Set(courses.map((course) => course.platform.name))).sort((a, b) => a.localeCompare(b, "pt-BR")), [courses]);

  const filtered = useMemo(() => {
    const needle = search.trim().toLocaleLowerCase("pt-BR");
    return certificates
      .filter((certificate) => {
        if (status === "deleted") {
          if (!certificate.deletedAt) return false;
        } else if (certificate.deletedAt) return false;
        const state = certificateState(certificate);
        if (status === "available" && !certificate.isAvailable) return false;
        if (status === "pending" && certificate.isAvailable) return false;
        if (status === "expiring" && state.label !== "Vence em breve") return false;
        if (status === "expired" && state.label !== "Vencido") return false;
        if (group && certificate.course.group !== group) return false;
        if (platform && certificate.course.platform.name !== platform) return false;
        if (needle && ![
          certificate.course.name,
          certificate.course.platform.name,
          certificate.course.area.name,
          certificate.credentialCode ?? "",
          certificate.notes ?? "",
        ].join(" ").toLocaleLowerCase("pt-BR").includes(needle)) return false;
        return true;
      })
      .sort((a, b) => (b.issueDate ?? b.completionDate ?? b.createdAt).localeCompare(a.issueDate ?? a.completionDate ?? a.createdAt));
  }, [certificates, status, group, platform, search]);

  const recent = useMemo(() => obtained.slice().sort((a, b) => (b.issueDate ?? b.completionDate ?? "").localeCompare(a.issueDate ?? a.completionDate ?? "")).slice(0, 4), [obtained]);

  function upsert(saved: Certificate) {
    setCertificates((current) => current.some((item) => item.id === saved.id)
      ? current.map((item) => item.id === saved.id ? saved : item)
      : [saved, ...current]);
  }

  function openCreate() {
    setEditing(null);
    setModalOpen(true);
  }

  function openEdit(certificate: Certificate) {
    setEditing(certificate);
    setModalOpen(true);
    setMenuId(null);
  }

  async function remove(certificate: Certificate) {
    if (!window.confirm(`Mover o certificado de “${certificate.course.name}” para a lixeira?`)) return;
    setLoadingId(certificate.id);
    const response = await fetch(`/api/certificates/${certificate.id}`, { method: "DELETE" });
    const result = await response.json().catch(() => ({})) as { message?: string; certificate?: Certificate };
    setLoadingId(null);
    setMenuId(null);
    if (!response.ok || !result.certificate) {
      setNotice({ type: "error", text: result.message ?? "Não foi possível excluir o certificado." });
      return;
    }
    upsert(result.certificate);
    setNotice({ type: "success", text: result.message ?? "Certificado movido para a lixeira." });
  }

  async function restore(certificate: Certificate) {
    setLoadingId(certificate.id);
    const response = await fetch(`/api/certificates/${certificate.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "restore" }),
    });
    const result = await response.json().catch(() => ({})) as { message?: string; certificate?: Certificate };
    setLoadingId(null);
    setMenuId(null);
    if (!response.ok || !result.certificate) {
      setNotice({ type: "error", text: result.message ?? "Não foi possível restaurar o certificado." });
      return;
    }
    upsert(result.certificate);
    setNotice({ type: "success", text: result.message ?? "Certificado restaurado." });
  }

  return (
    <>
      <PageHeader
        title="Certificados"
        subtitle="Organize e acompanhe seus certificados e conquistas."
        actions={<button className="primary-button" type="button" onClick={openCreate} disabled={!databaseReady}><Plus size={17} /> Adicionar certificado</button>}
      />

      <div className="content certificates-page">
        {!databaseReady && <div className="migration-required"><FileBadge2 size={24} /><div><h2>Banco de certificados não preparado</h2><p>Execute as migrations pendentes no Supabase.</p></div></div>}
        {notice && <div className={`settings-notice global ${notice.type}`} role={notice.type === "error" ? "alert" : "status"}>{notice.text}</div>}

        <section className="certificate-summary-grid">
          <SummaryCard label="Obtidos" value={String(obtained.length)} helper="certificados" icon={Award} color="#16A34A" />
          <SummaryCard label="Pendentes" value={String(pending.length)} helper="em andamento" icon={CalendarClock} color="#F97316" />
          <SummaryCard label="Vencimento próximo" value={String(expiring.length)} helper="nos próximos 60 dias" icon={CalendarClock} color="#7C3AED" />
          <SummaryCard label="Meta anual" value={`${obtainedYear} / ${annualGoal}`} helper={`${goalProgress}% concluída`} icon={Target} color="#2F6BFF" progress={goalProgress} />
        </section>

        <section className="certificate-toolbar-redesign" aria-label="Busca e filtros de certificados">
          <label className="search-box certificate-search"><Search size={18} /><span className="sr-only">Buscar certificados</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar certificados, cursos ou instituições..." /></label>
          <select value={status} onChange={(event) => setStatus(event.target.value as StatusFilter)} aria-label="Status"><option value="all">Status: Todos</option><option value="available">Obtidos</option><option value="pending">Pendentes</option><option value="expiring">Vencimento próximo</option><option value="expired">Vencidos</option><option value="deleted">Lixeira</option></select>
          <select value={group} onChange={(event) => setGroup(event.target.value)} aria-label="Tipo"><option value="">Tipo: Todos</option><option value="LANGUAGE">Idiomas</option><option value="PROFESSIONAL">Profissionalizantes</option></select>
          <select value={platform} onChange={(event) => setPlatform(event.target.value)} aria-label="Instituição"><option value="">Instituição: Todas</option>{platforms.map((item) => <option key={item} value={item}>{item}</option>)}</select>
          <button className="secondary-button" type="button" onClick={() => { setSearch(""); setStatus("all"); setGroup(""); setPlatform(""); }}>Limpar filtros</button>
        </section>

        {filtered.length ? (
          <section className="certificate-card-grid" aria-label="Certificados">
            {filtered.map((certificate) => {
              const color = certificate.course.color || "#2F6BFF";
              const Icon = courseIcon(certificate.course.icon, certificate.course.name);
              const state = certificateState(certificate);
              return (
                <article className={`certificate-card-redesign${certificate.deletedAt ? " is-deleted" : ""}`} key={certificate.id} style={{ "--certificate-color": color, "--certificate-bg": pastelColor(color) } as CSSProperties}>
                  <header>
                    <div className="certificate-course-icon"><Icon size={24} /></div>
                    <Badge color={state.color}>{state.label}</Badge>
                    <div className="action-menu-wrap certificate-menu">
                      <button className="icon-action minimal" type="button" onClick={() => setMenuId((current) => current === certificate.id ? null : certificate.id)} aria-label="Mais ações"><MoreHorizontal size={18} /></button>
                      {menuId === certificate.id && <div className="floating-action-menu">
                        {!certificate.deletedAt && <button type="button" onClick={() => openEdit(certificate)}><Pencil size={15} /> Editar</button>}
                        {!certificate.deletedAt && certificate.fileKey && <a href={`/api/certificates/${certificate.id}/file?download=1`}><Download size={15} /> Baixar</a>}
                        {!certificate.deletedAt ? <button className="danger" type="button" onClick={() => void remove(certificate)}><Trash2 size={15} /> Excluir</button> : <button type="button" onClick={() => void restore(certificate)}><RotateCcw size={15} /> Restaurar</button>}
                      </div>}
                    </div>
                  </header>

                  <div className="certificate-card-title"><Link href={`/cursos/${certificate.course.id}`}>{certificate.course.name}</Link><span>{certificate.course.platform.name}</span></div>

                  <div className="certificate-card-main">
                    <div className="certificate-dates">
                      <span>Emitido em<strong>{formatDate(certificate.issueDate ?? certificate.completionDate)}</strong></span>
                      <span>Válido até<strong className={state.label === "Vencido" || state.label === "Vence em breve" ? "attention" : ""}>{certificate.expirationDate ? formatDate(certificate.expirationDate) : "Sem vencimento"}</strong></span>
                    </div>
                    <div className="certificate-preview" aria-hidden="true"><FileBadge2 size={34} /><span>{certificate.fileName ? certificate.fileName.split(".").pop()?.toUpperCase() : "CERT"}</span></div>
                  </div>

                  {(certificate.credentialCode || certificate.validationUrl) && <div className="certificate-credential-row">
                    {certificate.credentialCode && <span><Award size={14} /> Código: {certificate.credentialCode}</span>}
                    {certificate.validationUrl && <a href={certificate.validationUrl} target="_blank" rel="noreferrer" aria-label="Abrir validação"><ExternalLink size={14} /></a>}
                  </div>}

                  <footer>
                    {certificate.fileKey ? <a className="secondary-button compact" href={`/api/certificates/${certificate.id}/file`} target="_blank" rel="noreferrer"><Eye size={15} /> Visualizar</a> : <button className="secondary-button compact" type="button" onClick={() => openEdit(certificate)}><FileBadge2 size={15} /> Adicionar arquivo</button>}
                    <button className="secondary-button compact" type="button" onClick={() => openEdit(certificate)}><Pencil size={15} /> Editar</button>
                  </footer>
                  {loadingId === certificate.id && <div className="card-loading"><LoaderCircle className="spin" size={21} /></div>}
                </article>
              );
            })}
          </section>
        ) : (
          <EmptyState title="Nenhum certificado encontrado" description="Ajuste os filtros ou registre uma nova conquista." action={<button className="primary-button" type="button" onClick={openCreate}><Plus size={16} /> Adicionar certificado</button>} />
        )}

        <section className="certificate-bottom-row">
          <div className="recent-achievements-panel">
            <header><div><Trophy size={18} /><h2>Conquistas recentes</h2></div></header>
            <div className="recent-achievement-list">
              {recent.length ? recent.map((certificate) => {
                const Icon = courseIcon(certificate.course.icon, certificate.course.name);
                return <button type="button" key={certificate.id} onClick={() => openEdit(certificate)}><span style={{ color: certificate.course.color, background: pastelColor(certificate.course.color) }}><Icon size={18} /></span><div><strong>{certificate.course.name}</strong><small>{certificate.course.platform.name}</small></div><Badge color="#16A34A">Obtido</Badge></button>;
              }) : <p>Nenhum certificado obtido ainda.</p>}
            </div>
          </div>
          <div className="certificate-tip-panel"><Award size={29} /><div><h2>Dica</h2><p>Mantenha seus certificados atualizados e dentro do prazo de validade.</p></div></div>
        </section>
      </div>

      {modalOpen && (
        <CertificateFormModal
          key={editing?.id ?? `new-${defaultCourseId ?? "none"}`}
          certificate={editing}
          courses={courses}
          defaultCourseId={defaultCourseId}
          onClose={() => { setModalOpen(false); setEditing(null); }}
          onSaved={(saved, message) => { upsert(saved); setModalOpen(false); setEditing(null); setNotice({ type: "success", text: message }); }}
        />
      )}
    </>
  );
}
