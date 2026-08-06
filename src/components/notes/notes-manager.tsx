"use client";

import { useMemo, useState, type CSSProperties } from "react";
import {
  CalendarDays,
  Check,
  CheckCircle2,
  CircleHelp,
  ExternalLink,
  Lightbulb,
  LoaderCircle,
  MoreHorizontal,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  Star,
  Trash2,
} from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Badge, EmptyState, FilterChips } from "@/components/ui";
import { NoteFormModal } from "@/components/notes/note-form-modal";
import { courseIcon, pastelColor } from "@/lib/visuals";
import type { Note, NoteCategoryOption, NoteCourseOption } from "@/types/note";

type Scope = "all" | "languages" | "professional" | "doubts" | "reviews" | "important" | "deleted";
type Notice = { type: "success" | "error"; text: string } | null;

function localToday() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

function formatDate(value: string | null) {
  if (!value) return "Sem revisão definida";
  const [year, month, day] = value.slice(0, 10).split("-");
  return `${day}/${month}/${year}`;
}

function plainText(value: string) {
  return value
    .replace(/```[\s\S]*?```/g, "")
    .replace(/[`*_#>\[\]()~-]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function excerpt(value: string) {
  const text = plainText(value);
  return text.length > 130 ? `${text.slice(0, 130)}…` : text;
}

function normalize(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("pt-BR");
}

function includesCategory(note: Note, target: string) {
  return normalize(note.category.name).includes(target);
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
  const [scope, setScope] = useState<Scope>("all");
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(Boolean(initialOpen && databaseReady));
  const [editing, setEditing] = useState<Note | null>(null);
  const [menuId, setMenuId] = useState<string | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [notice, setNotice] = useState<Notice>(null);
  const today = useMemo(() => localToday(), []);

  const active = useMemo(() => notes.filter((note) => !note.deletedAt), [notes]);

  const filtered = useMemo(() => {
    const needle = normalize(search.trim());
    return notes
      .filter((note) => {
        if (scope === "deleted") {
          if (!note.deletedAt) return false;
        } else if (note.deletedAt) return false;
        if (scope === "languages" && note.course.group !== "LANGUAGE") return false;
        if (scope === "professional" && note.course.group === "LANGUAGE") return false;
        if (scope === "doubts" && !includesCategory(note, "duvida")) return false;
        if (scope === "reviews" && !note.reviewAt) return false;
        if (scope === "important" && !note.isImportant) return false;
        if (needle) {
          const haystack = normalize([
            note.title,
            note.content,
            note.topic ?? "",
            note.course.name,
            note.category.name,
            ...note.tags,
          ].join(" "));
          if (!haystack.includes(needle)) return false;
        }
        return true;
      })
      .sort((a, b) => Number(b.isImportant) - Number(a.isImportant) || b.updatedAt.localeCompare(a.updatedAt));
  }, [notes, scope, search]);

  const reviewsToday = useMemo(
    () => active.filter((note) => !note.isReviewed && note.reviewAt === today).slice(0, 5),
    [active, today],
  );
  const pendingDoubts = useMemo(
    () => active.filter((note) => includesCategory(note, "duvida") && !note.isReviewed).slice(0, 5),
    [active],
  );

  function upsert(saved: Note) {
    setNotes((current) => current.some((item) => item.id === saved.id)
      ? current.map((item) => item.id === saved.id ? saved : item)
      : [saved, ...current]);
  }

  async function patch(note: Note, body: Record<string, unknown>) {
    setLoadingId(note.id);
    setNotice(null);
    const response = await fetch(`/api/notes/${note.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const result = await response.json().catch(() => ({})) as { message?: string; note?: Note };
    setLoadingId(null);
    setMenuId(null);
    if (!response.ok || !result.note) {
      setNotice({ type: "error", text: result.message ?? "Não foi possível atualizar a anotação." });
      return;
    }
    upsert(result.note);
    setNotice({ type: "success", text: result.message ?? "Anotação atualizada." });
  }

  async function remove(note: Note) {
    if (!window.confirm(`Mover “${note.title}” para a lixeira?`)) return;
    setLoadingId(note.id);
    const response = await fetch(`/api/notes/${note.id}`, { method: "DELETE" });
    const result = await response.json().catch(() => ({})) as { message?: string; note?: Note };
    setLoadingId(null);
    setMenuId(null);
    if (!response.ok || !result.note) {
      setNotice({ type: "error", text: result.message ?? "Não foi possível excluir a anotação." });
      return;
    }
    upsert(result.note);
    setNotice({ type: "success", text: result.message ?? "Anotação movida para a lixeira." });
  }

  function openCreate() {
    setEditing(null);
    setModalOpen(true);
  }

  function openEdit(note: Note) {
    setEditing(note);
    setModalOpen(true);
    setMenuId(null);
  }

  const chips = [
    { value: "all", label: "Todas" },
    { value: "languages", label: "Idiomas" },
    { value: "professional", label: "Profissionalizantes" },
    { value: "doubts", label: "Dúvidas" },
    { value: "reviews", label: "Revisões" },
    { value: "important", label: "Importantes" },
  ];

  return (
    <>
      <PageHeader
        title="Anotações"
        subtitle="Seu caderno de estudos: organize ideias, resumos, dúvidas e revisões."
        actions={
          <button className="primary-button" type="button" onClick={openCreate} disabled={!databaseReady}>
            <Plus size={17} /> Nova anotação
          </button>
        }
      />

      <div className="content notes-page">
        {!databaseReady && (
          <div className="migration-required">
            <CircleHelp size={24} />
            <div><h2>Banco de anotações não preparado</h2><p>Execute as migrations pendentes do projeto no Supabase.</p></div>
          </div>
        )}
        {notice && <div className={`settings-notice global ${notice.type}`} role={notice.type === "error" ? "alert" : "status"}>{notice.text}</div>}

        <section className="notes-toolbar" aria-label="Busca e filtros de anotações">
          <label className="search-box notes-search">
            <Search size={18} />
            <span className="sr-only">Buscar anotações</span>
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar anotações, cursos ou palavras-chave..." />
          </label>
          <FilterChips items={chips} value={scope === "deleted" ? "all" : scope} onChange={(value) => setScope(value as Scope)} ariaLabel="Filtrar anotações" />
        </section>

        <div className="notes-layout">
          <section className="note-mural" aria-label="Mural de anotações">
            {filtered.length === 0 ? (
              <EmptyState
                title="Nenhuma anotação encontrada"
                description={search || scope !== "all" ? "Ajuste a busca ou os filtros para encontrar suas anotações." : "Crie sua primeira anotação para começar seu caderno de estudos."}
                action={!search && scope === "all" ? <button className="primary-button" type="button" onClick={openCreate}><Plus size={16} /> Nova anotação</button> : undefined}
              />
            ) : filtered.map((note) => {
              const color = note.color ?? note.course.color ?? note.category.color ?? "#2F6BFF";
              const Icon = courseIcon(note.course.icon, note.course.name);
              const overdue = Boolean(note.reviewAt && !note.isReviewed && note.reviewAt < today);
              return (
                <article
                  className={`note-card-redesign${note.isDraft ? " is-draft" : ""}`}
                  key={note.id}
                  style={{ "--note-color": color, "--note-bg": pastelColor(color) } as CSSProperties}
                >
                  <div className="note-card-topline">
                    <div className="note-course-label"><Icon size={16} /><span>{note.course.name}</span></div>
                    <div className="note-card-actions">
                      <button
                        className={`star-button${note.isImportant ? " active" : ""}`}
                        type="button"
                        onClick={() => void patch(note, { action: "toggle-important" })}
                        aria-label={note.isImportant ? "Remover dos importantes" : "Marcar como importante"}
                        disabled={loadingId === note.id}
                      ><Star size={17} fill={note.isImportant ? "currentColor" : "none"} /></button>
                      <div className="action-menu-wrap">
                        <button className="icon-action minimal" type="button" onClick={() => setMenuId((current) => current === note.id ? null : note.id)} aria-label="Mais ações"><MoreHorizontal size={18} /></button>
                        {menuId === note.id && (
                          <div className="floating-action-menu">
                            <button type="button" onClick={() => openEdit(note)}><Pencil size={15} /> Editar</button>
                            {!note.deletedAt && <button type="button" onClick={() => void patch(note, { action: note.isReviewed ? "unreview" : "review" })}><CheckCircle2 size={15} /> {note.isReviewed ? "Marcar pendente" : "Marcar revisada"}</button>}
                            {!note.deletedAt ? <button className="danger" type="button" onClick={() => void remove(note)}><Trash2 size={15} /> Excluir</button> : <button type="button" onClick={() => void patch(note, { action: "restore" })}><RotateCcw size={15} /> Restaurar</button>}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="note-card-badges">
                    <Badge color={note.category.color ?? color}>{note.category.name}</Badge>
                    {note.isDraft && <Badge color="#667085">Rascunho</Badge>}
                    {overdue && <Badge color="#DC3545">Revisão atrasada</Badge>}
                  </div>

                  <button className="note-card-body" type="button" onClick={() => openEdit(note)}>
                    <h2>{note.title}</h2>
                    <p>{excerpt(note.content) || "Anotação sem conteúdo textual."}</p>
                  </button>

                  {note.checklist.length > 0 && (
                    <div className="note-checklist-preview">
                      {note.checklist.slice(0, 3).map((item) => (
                        <div key={item.id} className={item.done ? "done" : ""}><span>{item.done ? <Check size={13} /> : null}</span>{item.text}</div>
                      ))}
                    </div>
                  )}

                  <footer className="note-card-footer">
                    <span className={overdue ? "overdue" : ""}><CalendarDays size={15} /> {formatDate(note.reviewAt)}</span>
                    {note.externalUrl && <a href={note.externalUrl} target="_blank" rel="noreferrer" aria-label="Abrir link da anotação"><ExternalLink size={15} /></a>}
                  </footer>
                  {loadingId === note.id && <div className="card-loading"><LoaderCircle className="spin" size={20} /></div>}
                </article>
              );
            })}
          </section>

          <aside className="notes-side-column">
            <section className="compact-side-panel">
              <header><div><CalendarDays size={17} /><h2>Revisões de hoje</h2></div><span>{reviewsToday.length}</span></header>
              {reviewsToday.length ? reviewsToday.map((note) => (
                <button key={note.id} className="side-note-row" type="button" onClick={() => openEdit(note)}>
                  <i style={{ background: note.color ?? note.course.color ?? "#2F6BFF" }} />
                  <span><strong>{note.title}</strong><small>{note.course.name}</small></span>
                  <em>Hoje</em>
                </button>
              )) : <p className="compact-empty">Nenhuma revisão agendada para hoje.</p>}
              <button className="side-panel-link" type="button" onClick={() => setScope("reviews")}>Ver todas as revisões</button>
            </section>

            <section className="compact-side-panel">
              <header><div><CircleHelp size={17} /><h2>Dúvidas pendentes</h2></div><span>{pendingDoubts.length}</span></header>
              {pendingDoubts.length ? pendingDoubts.map((note) => (
                <button key={note.id} className="side-note-row" type="button" onClick={() => openEdit(note)}>
                  <i style={{ background: note.color ?? note.course.color ?? "#7C3AED" }} />
                  <span><strong>{note.title}</strong><small>{note.course.name}</small></span>
                </button>
              )) : <p className="compact-empty">Nenhuma dúvida pendente.</p>}
              <button className="side-panel-link" type="button" onClick={() => setScope("doubts")}>Ver todas as dúvidas</button>
            </section>

            <section className="notes-encouragement">
              <Lightbulb size={24} />
              <h2>Pequenas anotações, grandes conquistas!</h2>
              <p>Continue registrando e revisando. Cada nota fortalece seu aprendizado.</p>
            </section>

            <button className="text-button notes-trash-link" type="button" onClick={() => setScope(scope === "deleted" ? "all" : "deleted")}>
              {scope === "deleted" ? "Voltar ao mural" : "Abrir lixeira"}
            </button>
          </aside>
        </div>
      </div>

      {modalOpen && (
        <NoteFormModal
          key={editing?.id ?? `new-${defaultCourseId ?? "none"}`}
          note={editing}
          courses={courses}
          categories={categories}
          defaultCourseId={defaultCourseId}
          onClose={() => { setModalOpen(false); setEditing(null); }}
          onSaved={(saved, message) => {
            upsert(saved);
            setModalOpen(false);
            setEditing(null);
            setNotice({ type: "success", text: message });
          }}
        />
      )}
    </>
  );
}
