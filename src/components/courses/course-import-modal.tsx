"use client";

import { useMemo, useRef, useState, type ChangeEvent, type MouseEvent } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Database,
  Download,
  FileSpreadsheet,
  LoaderCircle,
  Upload,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui";
import { courseStatusLabels } from "@/lib/courses/constants";
import type {
  CourseImportPreview,
  CourseImportReport,
  CourseImportSource,
  DuplicateStrategy,
  RawCourseImportRow,
} from "@/types/course-import";

type Step = "choose" | "preview" | "result";
type RequestError = { message?: string };

const headerAliases: Record<string, keyof RawCourseImportRow> = {
  id: "sourceId",
  codigo: "sourceId",
  ordem: "sourceId",
  nome: "name",
  curso: "name",
  certificacao: "name",
  tipo: "kind",
  plataforma: "platform",
  area: "area",
  cargahoraria: "workloadHours",
  carga: "workloadHours",
  horas: "workloadHours",
  status: "status",
  prioridade: "priority",
  datadeinicio: "startDate",
  inicio: "startDate",
  metaconclusao: "targetCompletionDate",
  metaconclusão: "targetCompletionDate",
  prazoconclusao: "targetCompletionDate",
  datadeconclusao: "completionDate",
  conclusao: "completionDate",
  emitecertificado: "emitsCertificate",
  certificado: "emitsCertificate",
  link: "url",
  url: "url",
  observacoes: "notes",
  observacao: "notes",
  notas: "notes",
};

function normalizeHeader(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]/g, "")
    .toLocaleLowerCase("pt-BR");
}

function detectDelimiter(text: string) {
  const line = text.replace(/^\uFEFF/, "").split(/\r?\n/, 1)[0] ?? "";
  const semicolons = (line.match(/;/g) ?? []).length;
  const commas = (line.match(/,/g) ?? []).length;
  return semicolons >= commas ? ";" : ",";
}

function parseDelimited(text: string, delimiter: string) {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  const source = text.replace(/^\uFEFF/, "");

  for (let index = 0; index < source.length; index += 1) {
    const char = source[index];
    const next = source[index + 1];
    if (char === '"' && quoted && next === '"') {
      field += '"';
      index += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === delimiter && !quoted) {
      row.push(field.trim());
      field = "";
    } else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && next === "\n") index += 1;
      row.push(field.trim());
      field = "";
      if (row.some((value) => value.length > 0)) rows.push(row);
      row = [];
    } else {
      field += char;
    }
  }
  row.push(field.trim());
  if (row.some((value) => value.length > 0)) rows.push(row);
  return rows;
}

function parseCsv(text: string): RawCourseImportRow[] {
  const matrix = parseDelimited(text, detectDelimiter(text));
  if (matrix.length < 2) throw new Error("O CSV precisa ter uma linha de cabeçalho e pelo menos um registro.");
  const headers = matrix[0].map((header) => headerAliases[normalizeHeader(header)] ?? null);
  if (!headers.includes("name") || !headers.includes("platform") || !headers.includes("area")) {
    throw new Error("O CSV deve conter, no mínimo, as colunas Nome, Plataforma e Área.");
  }
  return matrix.slice(1).filter((values) => values.some(Boolean)).map((values) => {
    const item: RawCourseImportRow = {};
    headers.forEach((key, index) => {
      if (key) item[key] = values[index] ?? "";
    });
    return item;
  });
}

function downloadFile(name: string, content: string, type: string) {
  const blob = new Blob(["\ufeff", content], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = name;
  anchor.click();
  URL.revokeObjectURL(url);
}

function downloadTemplate() {
  const header = "ID;Nome;Tipo;Plataforma;Área;Carga Horária;Status;Prioridade;Data de Início;Meta de Conclusão;Data de Conclusão;Emite Certificado;Link;Observações";
  const example = "1;Curso de Exemplo;Curso;Plataforma de Exemplo;Área de Exemplo;20;Planejado;Média;;;;Sim;https://exemplo.com;Linha de exemplo — remova antes de importar";
  downloadFile("modelo-importacao-cursos-v0.6.csv", `${header}\n${example}\n`, "text/csv;charset=utf-8");
}

function formatState(state: CourseImportPreview["rows"][number]["state"]) {
  if (state === "READY") return <Badge tone="green">Pronto</Badge>;
  if (state === "DUPLICATE") return <Badge tone="orange">Duplicado</Badge>;
  return <Badge tone="red">Inválido</Badge>;
}

export function CourseImportModal({ onClose, onImported }: { onClose: () => void; onImported: () => void }) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [step, setStep] = useState<Step>("choose");
  const [source, setSource] = useState<CourseImportSource>("official");
  const [rows, setRows] = useState<RawCourseImportRow[]>([]);
  const [sourceName, setSourceName] = useState("Trilha oficial — 56 registros");
  const [preview, setPreview] = useState<CourseImportPreview | null>(null);
  const [report, setReport] = useState<CourseImportReport | null>(null);
  const [strategy, setStrategy] = useState<DuplicateStrategy>("skip");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const canImport = useMemo(() => Boolean(preview && preview.summary.invalid < preview.summary.total && !preview.alreadyImported), [preview]);

  async function requestPreview(nextSource = source, nextRows = rows, nextName = sourceName) {
    setLoading(true);
    setError("");
    setReport(null);
    try {
      const response = await fetch("/api/import/courses/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source: nextSource, rows: nextSource === "csv" ? nextRows : undefined, sourceName: nextName }),
      });
      const payload = await response.json().catch(() => ({})) as { preview?: CourseImportPreview } & RequestError;
      if (!response.ok || !payload.preview) throw new Error(payload.message ?? "Não foi possível gerar a pré-visualização.");
      setPreview(payload.preview);
      setStep("preview");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Não foi possível gerar a pré-visualização.");
    } finally {
      setLoading(false);
    }
  }

  async function readFile(file: File | undefined) {
    if (!file) return;
    setError("");
    if (!file.name.toLocaleLowerCase("pt-BR").endsWith(".csv")) {
      setError("Selecione um arquivo CSV. O XLSX será adicionado em uma versão futura.");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setError("O arquivo excede o limite de 2 MB.");
      return;
    }
    try {
      const parsed = parseCsv(await file.text());
      if (parsed.length > 500) throw new Error("O arquivo possui mais de 500 linhas. Divida-o em arquivos menores.");
      setRows(parsed);
      setSource("csv");
      setSourceName(file.name);
      await requestPreview("csv", parsed, file.name);
    } catch (fileError) {
      setError(fileError instanceof Error ? fileError.message : "Não foi possível ler o arquivo.");
    } finally {
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function commitImport() {
    if (!preview) return;
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/import/courses/commit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source, rows: source === "csv" ? rows : undefined, sourceName, duplicateStrategy: strategy }),
      });
      const payload = await response.json().catch(() => ({})) as { report?: CourseImportReport } & RequestError;
      if (!response.ok || !payload.report) throw new Error(payload.message ?? "Não foi possível concluir a importação.");
      setReport(payload.report);
      setStep("result");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Não foi possível concluir a importação.");
    } finally {
      setLoading(false);
    }
  }

  function downloadReport() {
    if (!report) return;
    const header = ["Linha", "ID original", "Nome", "Resultado", "Mensagem", "ID do curso"];
    const body = report.rows.map((row) => [row.rowNumber, row.sourceId ?? "", row.name, row.result, row.message, row.courseId ?? ""]);
    const csv = [header, ...body].map((line) => line.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(";")).join("\n");
    downloadFile(`relatorio-importacao-${report.importId}.csv`, csv, "text/csv;charset=utf-8");
  }

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event: MouseEvent<HTMLDivElement>) => { if (event.target === event.currentTarget && !loading) onClose(); }}>
      <section className="modal-card import-modal" role="dialog" aria-modal="true" aria-labelledby="course-import-title">
        <header className="modal-header">
          <div>
            <h2 id="course-import-title">Importar cursos e certificações</h2>
            <p>Pré-visualize os registros, confira erros e escolha como tratar duplicidades antes de gravar.</p>
          </div>
          <button className="icon-button" type="button" aria-label="Fechar importação" onClick={onClose} disabled={loading}><X size={18} /></button>
        </header>

        <div className="modal-body">
          <div className="import-stepper" aria-label="Etapas da importação">
            <span className={step === "choose" ? "active" : "done"}>1. Origem</span>
            <span className={step === "preview" ? "active" : step === "result" ? "done" : ""}>2. Conferência</span>
            <span className={step === "result" ? "active" : ""}>3. Relatório</span>
          </div>

          {error && <div className="settings-notice error import-alert" role="alert"><AlertTriangle size={16} /> <span>{error}</span></div>}

          {step === "choose" && <div className="import-source-grid">
            <button className={`import-source-card ${source === "official" ? "selected" : ""}`} type="button" onClick={() => { setSource("official"); setSourceName("Trilha oficial — 56 registros"); }}>
              <Database size={30} />
              <strong>Trilha oficial do projeto</strong>
              <span>Importa os 49 cursos e 7 certificações definidos na especificação.</span>
              <Badge tone="purple">56 registros</Badge>
            </button>
            <button className={`import-source-card ${source === "csv" ? "selected" : ""}`} type="button" onClick={() => inputRef.current?.click()}>
              <FileSpreadsheet size={30} />
              <strong>Arquivo CSV</strong>
              <span>Use um arquivo próprio com até 500 linhas e 2 MB.</span>
              <Badge tone="blue">CSV</Badge>
            </button>
            <input ref={inputRef} className="visually-hidden" type="file" accept=".csv,text/csv" onChange={(event: ChangeEvent<HTMLInputElement>) => void readFile(event.target.files?.[0])} />
            <div className="import-template-card">
              <Download size={22} />
              <div><strong>Precisa do formato correto?</strong><span>Baixe um modelo CSV com todos os cabeçalhos aceitos.</span></div>
              <button className="secondary-button" type="button" onClick={downloadTemplate}>Baixar modelo</button>
            </div>
          </div>}

          {step === "preview" && preview && <>
            <div className="import-summary-grid">
              <div><span>Total</span><strong>{preview.summary.total}</strong></div>
              <div className="success"><span>Prontos</span><strong>{preview.summary.ready}</strong></div>
              <div className="warning"><span>Duplicados</span><strong>{preview.summary.duplicates}</strong></div>
              <div className="danger"><span>Inválidos</span><strong>{preview.summary.invalid}</strong></div>
            </div>

            {preview.alreadyImported && <div className="settings-notice error import-alert"><AlertTriangle size={16} /><span>Esta mesma importação já foi concluída. Para evitar duplicidade, ela não poderá ser executada novamente.</span></div>}

            {(preview.summary.newPlatforms.length > 0 || preview.summary.newAreas.length > 0) && <div className="import-created-lists">
              <strong>Listas que serão criadas automaticamente</strong>
              {preview.summary.newPlatforms.length > 0 && <p><b>Plataformas:</b> {preview.summary.newPlatforms.join(", ")}</p>}
              {preview.summary.newAreas.length > 0 && <p><b>Áreas:</b> {preview.summary.newAreas.join(", ")}</p>}
            </div>}

            <div className="import-options">
              <label htmlFor="duplicate-strategy">Quando um curso já existir</label>
              <select id="duplicate-strategy" className="form-control" value={strategy} onChange={(event: ChangeEvent<HTMLSelectElement>) => setStrategy(event.target.value as DuplicateStrategy)}>
                <option value="skip">Manter o existente e ignorar a linha duplicada</option>
                <option value="update">Atualizar o existente com os dados importados</option>
              </select>
              <small>Registros inválidos nunca serão gravados. Os registros válidos continuam mesmo quando outras linhas possuem erro.</small>
            </div>

            <div className="import-preview-table-wrap">
              <table className="data-table import-preview-table">
                <thead><tr><th>Linha</th><th>Nome</th><th>Tipo</th><th>Plataforma</th><th>Área</th><th>Carga</th><th>Status</th><th>Validação</th></tr></thead>
                <tbody>{preview.rows.map((row) => <tr key={`${row.rowNumber}-${row.sourceId ?? "row"}`}>
                  <td>{row.sourceId ?? row.rowNumber}</td>
                  <td><span className="table-title">{row.data?.name ?? "Linha inválida"}</span>{[...row.errors, ...row.warnings].length > 0 && <span className="table-subtitle">{[...row.errors, ...row.warnings].join(" ")}</span>}</td>
                  <td>{row.data?.kind === "CERTIFICATION" ? "Certificação" : row.data ? "Curso" : "—"}</td>
                  <td>{row.data?.platform ?? "—"}{row.createsPlatform && <span className="table-subtitle">nova lista</span>}</td>
                  <td>{row.data?.area ?? "—"}{row.createsArea && <span className="table-subtitle">nova lista</span>}</td>
                  <td>{row.data ? `${row.data.workloadHours}h` : "—"}</td>
                  <td>{row.data ? courseStatusLabels[row.data.status] : "—"}</td>
                  <td>{formatState(row.state)}</td>
                </tr>)}</tbody>
              </table>
            </div>
          </>}

          {step === "result" && report && <div className="import-result">
            <div className="import-success-icon"><CheckCircle2 size={42} /></div>
            <h3>Importação processada</h3>
            <p>{report.sourceName}</p>
            <div className="import-summary-grid result">
              <div className="success"><span>Importados</span><strong>{report.importedRows}</strong></div>
              <div><span>Atualizados</span><strong>{report.updatedRows}</strong></div>
              <div className="warning"><span>Ignorados</span><strong>{report.skippedRows}</strong></div>
              <div className="danger"><span>Erros</span><strong>{report.errorRows}</strong></div>
            </div>
            {(report.createdPlatforms.length > 0 || report.createdAreas.length > 0) && <div className="import-created-lists">
              <strong>Novos itens adicionados às configurações</strong>
              {report.createdPlatforms.length > 0 && <p><b>Plataformas:</b> {report.createdPlatforms.join(", ")}</p>}
              {report.createdAreas.length > 0 && <p><b>Áreas:</b> {report.createdAreas.join(", ")}</p>}
            </div>}
            <div className="import-report-list">{report.rows.filter((row) => row.result === "ERROR").slice(0, 8).map((row) => <div key={row.rowNumber}><AlertTriangle size={14} /><span><strong>{row.name}:</strong> {row.message}</span></div>)}{report.errorRows === 0 && <div><CheckCircle2 size={14} /><span>Nenhum erro foi encontrado.</span></div>}</div>
          </div>}

          <footer className="modal-footer import-footer">
            {step === "choose" && <>
              <button className="secondary-button" type="button" onClick={onClose}>Cancelar</button>
              <button className="primary-button" type="button" disabled={loading} onClick={() => source === "official" ? void requestPreview("official", [], "Trilha oficial — 56 registros") : inputRef.current?.click()}>{loading ? <LoaderCircle className="spin" size={16} /> : source === "official" ? <Database size={16} /> : <Upload size={16} />} {source === "official" ? "Pré-visualizar trilha" : "Selecionar CSV"}</button>
            </>}
            {step === "preview" && <>
              <button className="secondary-button" type="button" disabled={loading} onClick={() => { setStep("choose"); setPreview(null); setError(""); }}>Voltar</button>
              <button className="primary-button" type="button" disabled={loading || !canImport} onClick={() => void commitImport()}>{loading ? <LoaderCircle className="spin" size={16} /> : <Upload size={16} />} Importar registros válidos</button>
            </>}
            {step === "result" && <>
              <button className="secondary-button" type="button" onClick={downloadReport}><Download size={16} /> Baixar relatório CSV</button>
              <button className="primary-button" type="button" onClick={onImported}><CheckCircle2 size={16} /> Atualizar lista de cursos</button>
            </>}
          </footer>
        </div>
      </section>
    </div>
  );
}
