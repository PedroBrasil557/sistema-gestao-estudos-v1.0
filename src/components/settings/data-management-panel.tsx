"use client";

import { useState } from "react";
import { ArchiveRestore, DatabaseBackup, Download, FileJson2, FileSpreadsheet, LoaderCircle, ShieldCheck } from "lucide-react";

type ExportItem = {
  label: string;
  description: string;
  scope: "courses" | "study-sessions" | "notes" | "certificates";
};

const exportsList: ExportItem[] = [
  { label: "Cursos", description: "Cursos, certificações, progresso e prazos.", scope: "courses" },
  { label: "Sessões de estudo", description: "Histórico de estudos, horas, status e assuntos.", scope: "study-sessions" },
  { label: "Anotações", description: "Notas, revisões, tags e conteúdos registrados.", scope: "notes" },
  { label: "Certificados", description: "Credenciais, datas e metadados dos arquivos.", scope: "certificates" },
];

function filenameFromDisposition(disposition: string | null, fallback: string) {
  const match = disposition?.match(/filename="?([^";]+)"?/i);
  return match?.[1] ?? fallback;
}

export function DataManagementPanel() {
  const [loading, setLoading] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ type: "success" | "error"; text: string } | null>(null);

  async function download(scope: string, format: "csv" | "json") {
    setLoading(`${scope}:${format}`);
    setNotice(null);
    try {
      const response = await fetch(`/api/export?scope=${encodeURIComponent(scope)}&format=${format}`, { cache: "no-store" });
      if (!response.ok) {
        const payload = (await response.json().catch(() => ({}))) as { message?: string };
        throw new Error(payload.message ?? "Não foi possível gerar o arquivo.");
      }
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = objectUrl;
      anchor.download = filenameFromDisposition(response.headers.get("content-disposition"), `gestao-estudos-${scope}.${format}`);
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(objectUrl);
      setNotice({ type: "success", text: scope === "backup" ? "Backup completo gerado com sucesso." : "Exportação concluída com sucesso." });
    } catch (error) {
      setNotice({ type: "error", text: error instanceof Error ? error.message : "Não foi possível gerar o arquivo." });
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="data-management-stack">
      <section className="settings-live-card settings-full-card">
        <div className="settings-card-heading">
          <div><DatabaseBackup size={19} /><div><h2>Backup completo da conta</h2><p>Baixe um arquivo JSON com configurações, listas, cursos, estudos, anotações, certificados e histórico técnico.</p></div></div>
        </div>
        <div className="backup-callout">
          <div className="backup-callout-icon"><ShieldCheck size={21} /></div>
          <div><strong>Backup lógico privado</strong><p>O arquivo pode conter dados pessoais e anotações. Guarde-o em local seguro. Documentos de certificados permanecem no Storage privado e são relacionados por um manifesto no backup.</p></div>
        </div>
        <button className="primary-button data-download-button" type="button" disabled={loading !== null} onClick={() => download("backup", "json")}>
          {loading === "backup:json" ? <LoaderCircle className="spin" size={16} /> : <FileJson2 size={16} />}
          {loading === "backup:json" ? "Preparando backup..." : "Baixar backup completo (JSON)"}
        </button>
      </section>

      <section className="settings-live-card settings-full-card">
        <div className="settings-card-heading">
          <div><Download size={19} /><div><h2>Exportações individuais</h2><p>Arquivos CSV em UTF-8, prontos para abrir no Excel e outras ferramentas.</p></div></div>
        </div>
        <div className="data-export-grid">
          {exportsList.map((item) => {
            const id = `${item.scope}:csv`;
            return (
              <div className="data-export-item" key={item.scope}>
                <div><strong>{item.label}</strong><p>{item.description}</p></div>
                <button className="secondary-button compact-button" type="button" disabled={loading !== null} onClick={() => download(item.scope, "csv")}>
                  {loading === id ? <LoaderCircle className="spin" size={14} /> : <FileSpreadsheet size={14} />}
                  {loading === id ? "Gerando..." : "Baixar CSV"}
                </button>
              </div>
            );
          })}
        </div>
      </section>

      <section className="settings-live-card settings-full-card">
        <div className="settings-card-heading">
          <div><ArchiveRestore size={19} /><div><h2>Restauração</h2><p>A restauração é um procedimento controlado para evitar duplicação ou perda de dados.</p></div></div>
        </div>
        <div className="privacy-points">
          <p><ShieldCheck size={16} /> Faça um backup novo antes de qualquer restauração.</p>
          <p><ShieldCheck size={16} /> Valide o arquivo e restaure primeiro em um ambiente de homologação.</p>
          <p><ShieldCheck size={16} /> O procedimento completo está em <code>supabase/BACKUP_RESTORE_V1.0.md</code>.</p>
        </div>
      </section>

      {notice && <div className={`settings-notice global ${notice.type}`} role="status" aria-live="polite">{notice.text}</div>}
    </div>
  );
}
