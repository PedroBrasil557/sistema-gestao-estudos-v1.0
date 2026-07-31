"use client";

import { useMemo, useRef, useState, type FormEvent } from "react";
import { Bold, Check, Code2, Link2, List, LoaderCircle, X } from "lucide-react";
import type { Note, NoteCategoryOption, NoteCourseOption, NoteInput } from "@/types/note";

type Props = {
  note: Note | null;
  courses: NoteCourseOption[];
  categories: NoteCategoryOption[];
  defaultCourseId?: string | null;
  onClose: () => void;
  onSaved: (note: Note, message: string) => void;
};

function localToday() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function NoteFormModal({ note, courses, categories, defaultCourseId, onClose, onSaved }: Props) {
  const initial = useMemo(() => ({
    noteDate: note?.noteDate ?? localToday(),
    courseId: note?.course.id ?? defaultCourseId ?? courses[0]?.id ?? "",
    topic: note?.topic ?? "",
    title: note?.title ?? "",
    categoryId: note?.category.id ?? categories[0]?.id ?? "",
    content: note?.content ?? "",
    isImportant: note?.isImportant ?? false,
    reviewAt: note?.reviewAt ?? "",
    isReviewed: note?.isReviewed ?? false,
    externalUrl: note?.externalUrl ?? "",
    tags: note?.tags.join(", ") ?? "",
  }), [note, defaultCourseId, courses, categories]);

  const [form, setForm] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const contentRef = useRef<HTMLTextAreaElement | null>(null);

  function change<K extends keyof typeof form>(field: K, value: (typeof form)[K]) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function insertMarkdown(before: string, after = before, fallback = "texto") {
    const element = contentRef.current;
    if (!element) return;
    const start = element.selectionStart;
    const end = element.selectionEnd;
    const selected = form.content.slice(start, end) || fallback;
    const next = `${form.content.slice(0, start)}${before}${selected}${after}${form.content.slice(end)}`;
    change("content", next);
    requestAnimationFrame(() => {
      element.focus();
      element.setSelectionRange(start + before.length, start + before.length + selected.length);
    });
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const payload: NoteInput = {
      noteDate: form.noteDate,
      courseId: form.courseId,
      topic: form.topic.trim() || null,
      title: form.title,
      categoryId: form.categoryId,
      content: form.content,
      isImportant: form.isImportant,
      reviewAt: form.reviewAt || null,
      isReviewed: form.isReviewed,
      externalUrl: form.externalUrl.trim() || null,
      tags: form.tags.split(",").map((item) => item.trim()).filter(Boolean),
    };

    setSaving(true);
    const response = await fetch(note ? `/api/notes/${note.id}` : "/api/notes", {
      method: note ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const result = await response.json().catch(() => ({})) as { message?: string; note?: Note };
    setSaving(false);

    if (!response.ok || !result.note) {
      setError(result.message ?? "Não foi possível salvar a anotação.");
      return;
    }
    onSaved(result.note, result.message ?? (note ? "Anotação atualizada." : "Anotação criada."));
  }

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !saving) onClose(); }}>
      <div className="modal-card note-modal" role="dialog" aria-modal="true" aria-labelledby="note-modal-title">
        <div className="modal-header">
          <div><h2 id="note-modal-title">{note ? "Editar anotação" : "Nova anotação"}</h2><p>Registre o conteúdo uma vez e mantenha curso, revisão e histórico organizados.</p></div>
          <button className="icon-action" type="button" onClick={onClose} disabled={saving} aria-label="Fechar"><X size={18} /></button>
        </div>

        <form onSubmit={submit} className="modal-body">
          {error && <div className="settings-notice error" role="alert">{error}</div>}
          {courses.length === 0 && <div className="settings-notice error">Cadastre ou importe pelo menos um curso antes de criar anotações.</div>}
          {categories.length === 0 && <div className="settings-notice error">Nenhuma categoria de anotação está disponível nas Configurações.</div>}

          <div className="course-form-grid note-form-grid">
            <div className="form-field"><label htmlFor="note-date">Data</label><input id="note-date" className="form-control" type="date" value={form.noteDate} onChange={(e) => change("noteDate", e.target.value)} required /></div>
            <div className="form-field note-span-two"><label htmlFor="note-course">Curso</label><select id="note-course" className="form-control" value={form.courseId} onChange={(e) => change("courseId", e.target.value)} required><option value="">Selecione</option>{courses.map((course) => <option key={course.id} value={course.id}>{course.name}</option>)}</select></div>
            <div className="form-field note-span-two"><label htmlFor="note-title">Título</label><input id="note-title" className="form-control" value={form.title} onChange={(e) => change("title", e.target.value)} maxLength={180} placeholder="Ex.: Diferença entre DAX e Power Query" required /></div>
            <div className="form-field"><label htmlFor="note-category">Categoria</label><select id="note-category" className="form-control" value={form.categoryId} onChange={(e) => change("categoryId", e.target.value)} required><option value="">Selecione</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></div>
            <div className="form-field note-span-two"><label htmlFor="note-topic">Módulo ou assunto</label><input id="note-topic" className="form-control" value={form.topic} onChange={(e) => change("topic", e.target.value)} maxLength={240} placeholder="Opcional" /></div>
            <div className="form-field"><label htmlFor="note-review-at">Revisar em</label><input id="note-review-at" className="form-control" type="date" value={form.reviewAt} onChange={(e) => change("reviewAt", e.target.value)} /></div>
            <div className="form-field note-span-two"><label htmlFor="note-tags">Tags</label><input id="note-tags" className="form-control" value={form.tags} onChange={(e) => change("tags", e.target.value)} placeholder="excel, procx, fórmula" /><span className="field-hint">Separe por vírgulas. O sistema adiciona # automaticamente.</span></div>
            <div className="form-field"><label htmlFor="note-url">Link externo</label><input id="note-url" className="form-control" type="url" value={form.externalUrl} onChange={(e) => change("externalUrl", e.target.value)} placeholder="https://..." /></div>
            <label className="checkbox-field"><input type="checkbox" checked={form.isImportant} onChange={(e) => change("isImportant", e.target.checked)} /><span>Marcar como importante</span></label>
            <label className="checkbox-field"><input type="checkbox" checked={form.isReviewed} onChange={(e) => change("isReviewed", e.target.checked)} /><span>Já revisada / resolvida</span></label>

            <div className="form-field full">
              <label htmlFor="note-content">Conteúdo</label>
              <div className="markdown-toolbar" aria-label="Ferramentas de formatação">
                <button type="button" onClick={() => insertMarkdown("**", "**", "texto em negrito")} title="Negrito"><Bold size={15} /> Negrito</button>
                <button type="button" onClick={() => insertMarkdown("- ", "", "item da lista")} title="Lista"><List size={15} /> Lista</button>
                <button type="button" onClick={() => insertMarkdown("[", "](https://)", "texto do link")} title="Link"><Link2 size={15} /> Link</button>
                <button type="button" onClick={() => insertMarkdown("```\n", "\n```", "código ou fórmula")} title="Bloco de código"><Code2 size={15} /> Código</button>
              </div>
              <textarea ref={contentRef} id="note-content" className="form-control textarea note-content-editor" value={form.content} onChange={(e) => change("content", e.target.value)} maxLength={20000} placeholder="Escreva seu resumo, dúvida, fórmula, conceito ou revisão..." required />
              <span className="field-hint">Editor Markdown simples: use listas, negrito, links e blocos de código/fórmula.</span>
            </div>
          </div>

          <footer className="modal-footer">
            <button className="secondary-button" type="button" onClick={onClose} disabled={saving}>Cancelar</button>
            <button className="primary-button" type="submit" disabled={saving || courses.length === 0 || categories.length === 0}>{saving ? <LoaderCircle className="spin" size={16} /> : <Check size={16} />}{saving ? "Salvando..." : note ? "Salvar alterações" : "Criar anotação"}</button>
          </footer>
        </form>
      </div>
    </div>
  );
}
