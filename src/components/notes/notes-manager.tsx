"use client";

import { useMemo, useState } from "react";
import {
  CalendarClock,
  CheckCircle2,
  CircleHelp,
  ExternalLink,
  FilePenLine,
  Lightbulb,
  LoaderCircle,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  Star,
  Trash2,
} from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Badge, MetricCard, Panel } from "@/components/ui";
import { NoteFormModal } from "@/components/notes/note-form-modal";
import { noteCategoryTone } from "@/lib/notes/constants";
import type { Note, NoteCategoryOption, NoteCourseOption } from "@/types/note";

type DeletedFilter = "active" | "deleted" | "all";
type ReviewFilter = "all" | "pending" | "reviewed" | "overdue" | "today";
type Notice = { type: "success" | "error"; text: string } | null;

function todayLocal() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

function formatDate(value: string | null) {
  if (!value) return "—";
  const [year, month, day] = value.slice(0, 10).split("-");
  return `${day}/${month}/${year}`;
}

function summary(value: string) {
  const text = value.replace(/[`*_#>\[\]()]/g, "").replace(/\s+/g, " ").trim();
  return text.length > 125 ? `${text.slice(0, 125)}…` : text;
}

function categoryIs(name: string, target: string) {
  return name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("pt-BR").includes(target);
}

export function NotesManager({
  initialNotes,
  courses,
  categories,
  databaseReady,
  defaultCourseId,
  initialOpen,
}: {
  initialNotes: Note[];
  courses: NoteCourseOption[];
  categories: NoteCategoryOption[];
  databaseReady: boolean;
  defaultCourseId: string | null;
  initialOpen: boolean;
}) {
  const [notes, setNotes] = useState(initialNotes);
  const [notice, setNotice] = useState<Notice>(null);
  const [modalOpen, setModalOpen] = useState(Boolean(initialOpen && databaseReady));
  const [editing, setEditing] = useState<Note | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [courseId, setCourseId] = useState(defaultCourseId ?? "");
  const [categoryId, setCategoryId] = useState("");
  const [reviewFilter, setReviewFilter] = useState<ReviewFilter>("all");
  const [importantOnly, setImportantOnly] = useState(false);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [deletedFilter, setDeletedFilter] = useState<DeletedFilter>("active");
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const today = useMemo(() => todayLocal(), []);

  const activeNotes = useMemo(() => notes.filter((note) => !note.deletedAt), [notes]);
  const metrics = useMemo(() => ({
    total: activeNotes.length,
    important: activeNotes.filter((note) => note.isImportant).length,
    doubts: activeNotes.filter((note) => categoryIs(note.category.name, "duvida") && !note.isReviewed).length,
    todayReviews: activeNotes.filter((note) => !note.isReviewed && note.reviewAt === today).length,
    ideas: activeNotes.filter((note) => categoryIs(note.category.name, "ideia")).length,
  }), [activeNotes, today]);

  const reviewGroups = useMemo(() => {
    const pending = activeNotes.filter((note) => !note.isReviewed && note.reviewAt);
    return {
      overdue: pending.filter((note) => note.reviewAt! < today).sort((a, b) => a.reviewAt!.localeCompare(b.reviewAt!)).slice(0, 5),
      today: pending.filter((note) => note.reviewAt === today).sort((a, b) => a.title.localeCompare(b.title, "pt-BR")).slice(0, 5),
      upcoming: pending.filter((note) => note.reviewAt! > today).sort((a, b) => a.reviewAt!.localeCompare(b.reviewAt!)).slice(0, 5),
    };
  }, [activeNotes, today]);

  const pendingDoubts = useMemo(() => activeNotes.filter((note) => categoryIs(note.category.name, "duvida") && !note.isReviewed).slice(0, 5), [activeNotes]);
  const ideas = useMemo(() => activeNotes.filter((note) => categoryIs(note.category.name, "ideia")).slice(0, 5), [activeNotes]);
  const tagStats = useMemo(() => {
    const count = new Map<string, number>();
    for (const note of activeNotes) for (const tag of note.tags) count.set(tag, (count.get(tag) ?? 0) + 1);
    return [...count.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "pt-BR")).slice(0, 10);
  }, [activeNotes]);

  const filtered = useMemo(() => {
    const needle = search.trim().toLocaleLowerCase("pt-BR");
    return notes.filter((note) => {
      if (deletedFilter === "active" && note.deletedAt) return false;
      if (deletedFilter === "deleted" && !note.deletedAt) return false;
      if (courseId && note.course.id !== courseId) return false;
      if (categoryId && note.category.id !== categoryId) return false;
      if (importantOnly && !note.isImportant) return false;
      if (dateFrom && note.noteDate < dateFrom) return false;
      if (dateTo && note.noteDate > dateTo) return false;
      if (reviewFilter === "pending" && note.isReviewed) return false;
      if (reviewFilter === "reviewed" && !note.isReviewed) return false;
      if (reviewFilter === "overdue" && (note.isReviewed || !note.reviewAt || note.reviewAt >= today)) return false;
      if (reviewFilter === "today" && (note.isReviewed || note.reviewAt !== today)) return false;
      if (needle && ![note.title, note.topic ?? "", note.content, note.course.name, note.category.name, ...note.tags].join(" ").toLocaleLowerCase("pt-BR").includes(needle)) return false;
      return true;
    }).sort((a, b) => Number(b.isImportant) - Number(a.isImportant) || b.noteDate.localeCompare(a.noteDate) || b.updatedAt.localeCompare(a.updatedAt));
  }, [notes, deletedFilter, courseId, categoryId, importantOnly, dateFrom, dateTo, reviewFilter, search, today]);

  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, pages);
  const visible = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  function upsert(saved: Note) {
    setNotes((current) => current.some((note) => note.id === saved.id) ? current.map((note) => note.id === saved.id ? saved : note) : [saved, ...current]);
  }

  function openCreate() { setEditing(null); setModalOpen(true); }
  function openEdit(note: Note) { setEditing(note); setModalOpen(true); }
  function clearFilters() { setSearch(""); setCourseId(""); setCategoryId(""); setReviewFilter("all"); setImportantOnly(false); setDateFrom(""); setDateTo(""); setDeletedFilter("active"); setPage(1); }

  async function noteAction(note: Note, action: string, extra?: Record<string, unknown>) {
    setLoadingId(note.id);
    setNotice(null);
    const response = await fetch(`/api/notes/${note.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action, ...extra }) });
    const result = await response.json().catch(() => ({})) as { message?: string; note?: Note };
    setLoadingId(null);
    if (!response.ok || !result.note) { setNotice({ type: "error", text: result.message ?? "Não foi possível atualizar a anotação." }); return; }
    upsert(result.note);
    setNotice({ type: "success", text: result.message ?? "Anotação atualizada." });
  }

  async function remove(note: Note) {
    if (!window.confirm(`Mover “${note.title}” para a lixeira?`)) return;
    setLoadingId(note.id);
    const response = await fetch(`/api/notes/${note.id}`, { method: "DELETE" });
    const result = await response.json().catch(() => ({})) as { message?: string; note?: Note };
    setLoadingId(null);
    if (!response.ok || !result.note) { setNotice({ type: "error", text: result.message ?? "Não foi possível excluir a anotação." }); return; }
    upsert(result.note);
    setNotice({ type: "success", text: result.message ?? "Anotação movida para a lixeira." });
  }

  function reschedule(note: Note) {
    const value = window.prompt("Nova data de revisão (AAAA-MM-DD):", note.reviewAt ?? today);
    if (!value) return;
    void noteAction(note, "reschedule", { reviewAt: value });
  }

  const reviewStatus = (note: Note) => {
    if (note.isReviewed) return <Badge tone="green">Revisado</Badge>;
    if (!note.reviewAt) return <Badge tone="gray">Sem revisão</Badge>;
    if (note.reviewAt < today) return <Badge tone="red">Atrasada</Badge>;
    if (note.reviewAt === today) return <Badge tone="orange">Hoje</Badge>;
    return <Badge tone="blue">Agendada</Badge>;
  };

  return (
    <>
      <PageHeader
        title="Anotações"
        subtitle="Registre ideias, conceitos, dúvidas e aprendizados importantes."
        actions={<button className="header-button" type="button" onClick={openCreate} disabled={!databaseReady}><Plus size={17} /><span className="button-label">Nova anotação</span></button>}
      />
      <div className="content">
        {!databaseReady && <div className="migration-required"><CircleHelp size={24} /><div><h2>Banco da versão 0.9 ainda não preparado</h2><p>Execute a migração <strong>202607240005_v0_9_notes.sql</strong> no SQL Editor do Supabase e atualize esta página.</p></div></div>}
        {notice && <div className={`settings-notice global ${notice.type}`} role={notice.type === "error" ? "alert" : "status"}>{notice.text}</div>}

        <section className="metrics-grid five">
          <MetricCard label="Total de anotações" value={String(metrics.total)} helper="registros ativos" icon={FilePenLine} tone="blue" />
          <MetricCard label="Importantes" value={String(metrics.important)} helper="marcadas com estrela" icon={Star} tone="green" />
          <MetricCard label="Dúvidas pendentes" value={String(metrics.doubts)} helper="aguardando resolução" icon={CircleHelp} tone="purple" />
          <MetricCard label="Revisões para hoje" value={String(metrics.todayReviews)} helper="agendadas para hoje" icon={CalendarClock} tone="orange" />
          <MetricCard label="Ideias para projetos" value={String(metrics.ideas)} helper="registradas" icon={Lightbulb} tone="blue" />
        </section>

        <div className="dashboard-grid">
          <Panel title="Minhas anotações" className="span-9">
            <div className="toolbar note-toolbar">
              <div className="search-box"><Search size={16} /><input aria-label="Pesquisar anotações" placeholder="Pesquisar título, assunto, conteúdo ou tags..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} /></div>
              <select className="filter-select" aria-label="Curso" value={courseId} onChange={(e) => { setCourseId(e.target.value); setPage(1); }}><option value="">Todos os cursos</option>{courses.map((course) => <option key={course.id} value={course.id}>{course.name}</option>)}</select>
              <select className="filter-select" aria-label="Categoria" value={categoryId} onChange={(e) => { setCategoryId(e.target.value); setPage(1); }}><option value="">Todas as categorias</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select>
              <select className="filter-select" aria-label="Revisão" value={reviewFilter} onChange={(e) => { setReviewFilter(e.target.value as ReviewFilter); setPage(1); }}><option value="all">Todas as revisões</option><option value="pending">Pendentes</option><option value="reviewed">Revisadas</option><option value="overdue">Atrasadas</option><option value="today">Para hoje</option></select>
              <input className="filter-select note-date-filter" aria-label="Data inicial" type="date" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setPage(1); }} />
              <input className="filter-select note-date-filter" aria-label="Data final" type="date" value={dateTo} onChange={(e) => { setDateTo(e.target.value); setPage(1); }} />
              <select className="filter-select" aria-label="Lixeira" value={deletedFilter} onChange={(e) => { setDeletedFilter(e.target.value as DeletedFilter); setPage(1); }}><option value="active">Ativas</option><option value="deleted">Lixeira</option><option value="all">Todas</option></select>
              <label className="checkbox-field" style={{ minHeight: 38 }}><input type="checkbox" checked={importantOnly} onChange={(e) => { setImportantOnly(e.target.checked); setPage(1); }} /><span>Só importantes</span></label>
              <button className="secondary-button" type="button" onClick={clearFilters}>Limpar filtros</button>
            </div>

            {visible.length ? <>
              <div className="data-table-wrap">
                <table className="data-table">
                  <thead><tr><th>Título</th><th>Curso</th><th>Categoria</th><th>Tags</th><th>Revisão</th><th>Data</th><th aria-label="Ações" /></tr></thead>
                  <tbody>{visible.map((note) => <tr key={note.id} className={note.deletedAt ? "note-row-deleted" : ""}>
                    <td><div className="note-title"><button className={`star ${note.isImportant ? "active" : ""}`} type="button" aria-label={note.isImportant ? "Remover dos importantes" : "Marcar como importante"} onClick={() => noteAction(note, "toggle-important")} disabled={loadingId === note.id || Boolean(note.deletedAt)}><Star size={15} fill={note.isImportant ? "currentColor" : "none"} /></button><div><span className="table-title">{note.title}</span><span className="table-subtitle note-summary">{note.topic ? `${note.topic} — ` : ""}{summary(note.content)}</span></div></div></td>
                    <td data-label="Curso">{note.course.name}</td>
                    <td data-label="Categoria"><Badge tone={noteCategoryTone(note.category.name)}>{note.category.name}</Badge></td>
                    <td data-label="Tags"><div className="tag-list">{note.tags.length ? note.tags.slice(0, 4).map((tag) => <span className="tag" key={tag}>{tag}</span>) : <span className="table-subtitle">—</span>}</div></td>
                    <td data-label="Revisão"><div className="review-badge-line">{reviewStatus(note)}{note.reviewAt && <span className="table-subtitle">{formatDate(note.reviewAt)}</span>}</div></td>
                    <td data-label="Data">{formatDate(note.noteDate)}</td>
                    <td data-label="Ações"><div className="note-actions-compact">
                      {loadingId === note.id ? <LoaderCircle className="spin" size={15} /> : note.deletedAt ? <button className="table-icon-button" type="button" title="Restaurar" onClick={() => noteAction(note, "restore")}><RotateCcw size={14} /></button> : <>
                        {!note.isReviewed && <button className="table-icon-button" type="button" title="Marcar como revisada" onClick={() => noteAction(note, "mark-reviewed")}><CheckCircle2 size={14} /></button>}
                        {note.reviewAt && <button className="table-icon-button" type="button" title="Reagendar revisão" onClick={() => reschedule(note)}><CalendarClock size={14} /></button>}
                        {note.externalUrl && <a className="table-icon-button" href={note.externalUrl} target="_blank" rel="noreferrer" title="Abrir link"><ExternalLink size={14} /></a>}
                        <button className="table-icon-button" type="button" title="Editar" onClick={() => openEdit(note)}><Pencil size={14} /></button>
                        <button className="table-icon-button" type="button" title="Excluir" onClick={() => remove(note)}><Trash2 size={14} /></button>
                      </>}
                    </div></td>
                  </tr>)}</tbody>
                </table>
              </div>
              <div className="table-footer"><span>Mostrando {(safePage - 1) * pageSize + 1} a {Math.min(safePage * pageSize, filtered.length)} de {filtered.length} anotações</span><div className="pagination"><button className="page-button" type="button" disabled={safePage <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>‹</button>{Array.from({ length: Math.min(5, pages) }, (_, index) => index + 1).map((item) => <button className={`page-button ${safePage === item ? "active" : ""}`} type="button" key={item} onClick={() => setPage(item)}>{item}</button>)}<button className="page-button" type="button" disabled={safePage >= pages} onClick={() => setPage((p) => Math.min(pages, p + 1))}>›</button></div></div>
            </> : <div className="courses-empty compact"><p>Nenhuma anotação corresponde aos filtros atuais.</p><button className="primary-button" type="button" onClick={openCreate} disabled={!databaseReady}><Plus size={15} /> Criar anotação</button></div>}
          </Panel>

          <div className="span-3" style={{ display: "grid", gap: 12, alignContent: "start" }}>
            <Panel title="Painel de revisões">
              {reviewGroups.overdue.length + reviewGroups.today.length + reviewGroups.upcoming.length === 0 ? <div className="panel-empty">Nenhuma revisão pendente.</div> : <>
                {reviewGroups.overdue.length > 0 && <div className="review-side-group"><p className="review-side-label">Atrasadas</p>{reviewGroups.overdue.map((note) => <button className="review-item-button" type="button" key={note.id} onClick={() => openEdit(note)}><strong>{note.title}</strong><span>{formatDate(note.reviewAt)} • {note.course.name}</span></button>)}</div>}
                {reviewGroups.today.length > 0 && <div className="review-side-group"><p className="review-side-label">Hoje</p>{reviewGroups.today.map((note) => <button className="review-item-button" type="button" key={note.id} onClick={() => openEdit(note)}><strong>{note.title}</strong><span>{note.course.name}</span></button>)}</div>}
                {reviewGroups.upcoming.length > 0 && <div className="review-side-group"><p className="review-side-label">Próximas</p>{reviewGroups.upcoming.map((note) => <button className="review-item-button" type="button" key={note.id} onClick={() => openEdit(note)}><strong>{note.title}</strong><span>{formatDate(note.reviewAt)} • {note.course.name}</span></button>)}</div>}
              </>}
            </Panel>
            <Panel title="Dúvidas pendentes"><div className="side-list">{pendingDoubts.length ? pendingDoubts.map((note) => <button className="review-item-button" type="button" key={note.id} onClick={() => openEdit(note)}><strong>{note.title}</strong><span>{note.course.name}</span></button>) : <div className="panel-empty">Nenhuma dúvida pendente.</div>}</div></Panel>
            <Panel title="Ideias para projetos"><div className="side-list">{ideas.length ? ideas.map((note) => <button className="review-item-button" type="button" key={note.id} onClick={() => openEdit(note)}><strong>{note.title}</strong><span>{note.course.name}</span></button>) : <div className="panel-empty">Nenhuma ideia registrada.</div>}</div></Panel>
            <Panel title="Tags mais usadas"><div className="tag-list">{tagStats.length ? tagStats.map(([tag, count]) => <span className="tag" key={tag}>{tag} {count}</span>) : <span className="table-subtitle">Adicione tags às anotações para criar este resumo.</span>}</div></Panel>
          </div>
        </div>
      </div>

      {modalOpen && <NoteFormModal note={editing} courses={courses} categories={categories} defaultCourseId={defaultCourseId} onClose={() => { setModalOpen(false); setEditing(null); }} onSaved={(saved, message) => { upsert(saved); setModalOpen(false); setEditing(null); setNotice({ type: "success", text: message }); }} />}
    </>
  );
}
