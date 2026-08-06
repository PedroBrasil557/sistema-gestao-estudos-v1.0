"use client";

import { useRef, useState, type FormEvent } from "react";
import { Bold, Check, CheckSquare, ChevronDown, Code2, Heading2, Link2, List, LoaderCircle, Save, X } from "lucide-react";
import { ColorPicker } from "@/components/ui";
import { coursePalette } from "@/lib/visuals";
import type { ChecklistItem, Note, NoteCategoryOption, NoteCourseOption, NoteInput } from "@/types/note";

type Props = { note: Note | null; courses: NoteCourseOption[]; categories: NoteCategoryOption[]; defaultCourseId?: string | null; onClose: () => void; onSaved: (note: Note, message: string) => void };

function localToday() { const now = new Date(); return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`; }

export function NoteFormModal({ note, courses, categories, defaultCourseId, onClose, onSaved }: Props) {
  const [form, setForm] = useState(() => ({
    noteDate: note?.noteDate ?? localToday(),
    courseId: note?.course.id ?? defaultCourseId ?? courses[0]?.id ?? "",
    topic: note?.topic ?? "",
    title: note?.title ?? "",
    categoryId: note?.category.id ?? categories[0]?.id ?? "",
    content: note?.content ?? "",
    color: note?.color ?? note?.course.color ?? courses.find((course) => course.id === (defaultCourseId ?? courses[0]?.id))?.color ?? "#2F6BFF",
    checklistText: note?.checklist.map((item) => `${item.done ? "[x]" : "[ ]"} ${item.text}`).join("\n") ?? "",
    isDraft: note?.isDraft ?? false,
    isImportant: note?.isImportant ?? false,
    reviewAt: note?.reviewAt ?? "",
    isReviewed: note?.isReviewed ?? false,
    externalUrl: note?.externalUrl ?? "",
    tags: note?.tags.join(", ") ?? "",
  }));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [moreOpen, setMoreOpen] = useState(Boolean(note));
  const contentRef = useRef<HTMLTextAreaElement | null>(null);

  function change<K extends keyof typeof form>(field: K, value: (typeof form)[K]) { setForm((current) => ({ ...current, [field]: value })); }
  function courseChanged(courseId: string) { const course = courses.find((item) => item.id === courseId); setForm((current) => ({ ...current, courseId, color: course?.color ?? current.color })); }
  function categoryChanged(categoryId: string) { const category = categories.find((item) => item.id === categoryId); setForm((current) => ({ ...current, categoryId, color: category?.color ?? current.color })); }

  function insertMarkdown(before: string, after = before, fallback = "texto") {
    const element = contentRef.current; if (!element) return;
    const start = element.selectionStart; const end = element.selectionEnd; const selected = form.content.slice(start, end) || fallback;
    const next = `${form.content.slice(0, start)}${before}${selected}${after}${form.content.slice(end)}`; change("content", next);
    requestAnimationFrame(() => { element.focus(); element.setSelectionRange(start + before.length, start + before.length + selected.length); });
  }

  function parseChecklist(): ChecklistItem[] {
    return form.checklistText.split(/\r?\n/).map((line, index) => { const trimmed = line.trim(); if (!trimmed) return null; const done = /^\[x\]/i.test(trimmed); const text = trimmed.replace(/^\[(?:x| )\]\s*/i, ""); return text ? { id: note?.checklist[index]?.id ?? crypto.randomUUID(), text, done } : null; }).filter((item): item is ChecklistItem => Boolean(item));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(null);
    const payload: NoteInput = {
      noteDate: form.noteDate, courseId: form.courseId, topic: form.topic.trim() || null, title: form.title,
      categoryId: form.categoryId, content: form.content, color: form.color || null, isDraft: form.isDraft,
      checklist: parseChecklist(), isImportant: form.isImportant, reviewAt: form.reviewAt || null, isReviewed: form.isReviewed,
      externalUrl: form.externalUrl.trim() || null, tags: form.tags.split(",").map((item) => item.trim()).filter(Boolean),
    };
    setSaving(true);
    const response = await fetch(note ? `/api/notes/${note.id}` : "/api/notes", { method: note ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    const result = await response.json().catch(() => ({})) as { message?: string; note?: Note }; setSaving(false);
    if (!response.ok || !result.note) { setError(result.message ?? "Não foi possível salvar a anotação."); return; }
    onSaved(result.note, result.message ?? (note ? "Anotação atualizada." : "Anotação criada."));
  }

  return <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !saving) onClose(); }}>
    <div className="modal-card redesign-modal note-modal" role="dialog" aria-modal="true" aria-labelledby="note-modal-title">
      <div className="modal-header"><div><h2 id="note-modal-title">{note ? "Editar anotação" : "Nova anotação"}</h2><p>Crie uma nota colorida, revisão, dúvida ou checklist para o seu caderno de estudos.</p></div><button className="icon-action" type="button" onClick={onClose} disabled={saving} aria-label="Fechar"><X size={18} /></button></div>
      <form onSubmit={submit} className="modal-body">
        {error && <div className="settings-notice error" role="alert">{error}</div>}
        <div className="note-primary-grid">
          <div className="form-field"><label htmlFor="note-course">Curso</label><select id="note-course" className="form-control" value={form.courseId} onChange={(event) => courseChanged(event.target.value)} required><option value="">Selecione</option>{courses.map((course) => <option key={course.id} value={course.id}>{course.name}</option>)}</select></div>
          <div className="form-field"><label htmlFor="note-category">Categoria</label><select id="note-category" className="form-control" value={form.categoryId} onChange={(event) => categoryChanged(event.target.value)} required><option value="">Selecione</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></div>
          <div className="form-field full"><label htmlFor="note-title">Título</label><input id="note-title" className="form-control" value={form.title} onChange={(event) => change("title", event.target.value)} maxLength={180} placeholder="Ex.: Função PROCV com exemplos" required /></div>
          <div className="form-field full"><label>Cor</label><ColorPicker value={form.color} onChange={(color) => change("color", color)} colors={coursePalette} /></div>
          <div className="form-field full"><label htmlFor="note-content">Conteúdo</label><div className="markdown-toolbar" aria-label="Ferramentas de formatação"><button type="button" onClick={() => insertMarkdown("## ", "", "Título")}><Heading2 size={15} /> Título</button><button type="button" onClick={() => insertMarkdown("**", "**", "negrito")}><Bold size={15} /> Negrito</button><button type="button" onClick={() => insertMarkdown("- ", "", "item")}><List size={15} /> Lista</button><button type="button" onClick={() => insertMarkdown("- [ ] ", "", "tarefa")}><CheckSquare size={15} /> Checklist</button><button type="button" onClick={() => insertMarkdown("[", "](https://)", "link")}><Link2 size={15} /> Link</button><button type="button" onClick={() => insertMarkdown("```\n", "\n```", "código")}><Code2 size={15} /> Código</button></div><textarea ref={contentRef} id="note-content" className="form-control textarea note-content-editor" value={form.content} onChange={(event) => change("content", event.target.value)} maxLength={20000} placeholder="Escreva seu resumo, ideia, fórmula ou dúvida..." /></div>
          <div className="form-field full"><label htmlFor="note-checklist">Checklist estruturado</label><textarea id="note-checklist" className="form-control textarea checklist-editor" value={form.checklistText} onChange={(event) => change("checklistText", event.target.value)} placeholder={'[ ] Revisar o conteúdo\n[x] Resolver exercício 1'} /><span className="field-hint">Use [ ] para pendente e [x] para concluído.</span></div>
        </div>

        <button className="more-options-toggle" type="button" onClick={() => setMoreOpen((value) => !value)} aria-expanded={moreOpen}><span>Mais opções</span><ChevronDown size={17} className={moreOpen ? "open" : ""} /></button>
        {moreOpen && <div className="course-form-grid more-options-panel"><div className="form-field"><label htmlFor="note-date">Data</label><input id="note-date" className="form-control" type="date" value={form.noteDate} onChange={(event) => change("noteDate", event.target.value)} required /></div><div className="form-field"><label htmlFor="note-topic">Módulo</label><input id="note-topic" className="form-control" value={form.topic} onChange={(event) => change("topic", event.target.value)} /></div><div className="form-field"><label htmlFor="note-review-at">Revisar em</label><input id="note-review-at" className="form-control" type="date" value={form.reviewAt} onChange={(event) => change("reviewAt", event.target.value)} /></div><div className="form-field"><label htmlFor="note-tags">Tags</label><input id="note-tags" className="form-control" value={form.tags} onChange={(event) => change("tags", event.target.value)} placeholder="excel, procv" /></div><div className="form-field full"><label htmlFor="note-url">Link</label><input id="note-url" className="form-control" type="url" value={form.externalUrl} onChange={(event) => change("externalUrl", event.target.value)} /></div><label className="checkbox-field"><input type="checkbox" checked={form.isImportant} onChange={(event) => change("isImportant", event.target.checked)} /><span>Importante</span></label><label className="checkbox-field"><input type="checkbox" checked={form.isReviewed} onChange={(event) => change("isReviewed", event.target.checked)} /><span>Resolvida / revisada</span></label><label className="checkbox-field"><input type="checkbox" checked={form.isDraft} onChange={(event) => change("isDraft", event.target.checked)} /><span>Salvar como rascunho</span></label></div>}

        <footer className="modal-footer"><button className="secondary-button" type="button" onClick={onClose} disabled={saving}>Cancelar</button><button className="secondary-button" type="button" onClick={() => change("isDraft", true)}><Save size={16} /> Rascunho</button><button className="primary-button" type="submit" disabled={saving || courses.length === 0 || categories.length === 0}>{saving ? <LoaderCircle className="spin" size={16} /> : <Check size={16} />}{saving ? "Salvando..." : note ? "Salvar alterações" : "Criar anotação"}</button></footer>
      </form>
    </div>
  </div>;
}
