"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Archive,
  Bell,
  Check,
  CircleHelp,
  Globe2,
  ListChecks,
  LoaderCircle,
  LockKeyhole,
  Palette,
  Pencil,
  Plus,
  RotateCcw,
  Save,
  Settings2,
  Sun,
  Moon,
  Monitor,
  UserRound,
  X,
} from "lucide-react";
import { listLabels } from "@/lib/settings/lists";
import { DataManagementPanel } from "@/components/settings/data-management-panel";
import type {
  ConfigurableListItem,
  ConfigurableListKind,
  ConfigurableLists,
  UserSettings,
} from "@/types/settings";

type Notice = { type: "success" | "error"; text: string } | null;
type Tab = "geral" | "metas" | "listas" | "aparencia" | "privacidade" | "conta";

const accentColors = ["#1768d3", "#159bb3", "#7655d8", "#14945b", "#ef8d20", "#dc4b4b", "#64748b"];

const tabs: { id: Tab; label: string; icon: typeof Settings2 }[] = [
  { id: "geral", label: "Geral", icon: Settings2 },
  { id: "metas", label: "Metas", icon: CircleHelp },
  { id: "listas", label: "Listas e padrões", icon: ListChecks },
  { id: "aparencia", label: "Aparência", icon: Palette },
  { id: "privacidade", label: "Privacidade", icon: LockKeyhole },
  { id: "conta", label: "Conta", icon: UserRound },
];

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (value: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      className={`toggle ${checked ? "on" : ""}`}
      aria-label={label}
      aria-pressed={checked}
      onClick={() => onChange(!checked)}
    />
  );
}

function ListManager({ initialLists }: { initialLists: ConfigurableLists }) {
  const [kind, setKind] = useState<ConfigurableListKind>("platforms");
  const [lists, setLists] = useState(initialLists);
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [notice, setNotice] = useState<Notice>(null);

  const items = lists[kind];
  const activeItems = useMemo(() => items.filter((item) => !item.archivedAt), [items]);
  const archivedItems = useMemo(() => items.filter((item) => item.archivedAt), [items]);

  function replaceItem(updated: ConfigurableListItem) {
    setLists((current) => ({
      ...current,
      [kind]: current[kind].map((item) => (item.id === updated.id ? updated : item)),
    }));
  }

  async function addItem(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice(null);
    const name = newName.trim();
    if (name.length < 2) {
      setNotice({ type: "error", text: "Digite um nome com pelo menos 2 caracteres." });
      return;
    }

    setAdding(true);
    const response = await fetch(`/api/lists/${kind}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    const payload = (await response.json().catch(() => ({}))) as { message?: string; item?: ConfigurableListItem };
    setAdding(false);

    if (!response.ok || !payload.item) {
      setNotice({ type: "error", text: payload.message ?? "Não foi possível adicionar o item." });
      return;
    }

    setLists((current) => ({ ...current, [kind]: [...current[kind], payload.item!] }));
    setNewName("");
    setNotice({ type: "success", text: payload.message ?? "Item adicionado." });
  }

  async function updateItem(id: string, body: { name?: string; archived?: boolean }) {
    setNotice(null);
    setLoadingId(id);
    const response = await fetch(`/api/lists/${kind}/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const payload = (await response.json().catch(() => ({}))) as { message?: string; item?: ConfigurableListItem };
    setLoadingId(null);

    if (!response.ok || !payload.item) {
      setNotice({ type: "error", text: payload.message ?? "Não foi possível atualizar o item." });
      return;
    }

    replaceItem(payload.item);
    setEditingId(null);
    setEditingName("");
    setNotice({ type: "success", text: payload.message ?? "Item atualizado." });
  }

  return (
    <section className="settings-live-card settings-list-manager">
      <div className="settings-card-heading">
        <div><ListChecks size={19} /><div><h2>Listas personalizadas</h2><p>Cadastre, renomeie, arquive e restaure os valores usados nos formulários.</p></div></div>
      </div>

      <div className="list-kind-tabs" role="tablist" aria-label="Tipos de lista">
        {(Object.keys(listLabels) as ConfigurableListKind[]).map((listKind) => (
          <button
            key={listKind}
            type="button"
            className={kind === listKind ? "active" : ""}
            onClick={() => { setKind(listKind); setNotice(null); setEditingId(null); }}
          >
            {listLabels[listKind].plural}
            <span>{lists[listKind].filter((item) => !item.archivedAt).length}</span>
          </button>
        ))}
      </div>

      <form className="list-add-form" onSubmit={addItem}>
        <div className="form-field">
          <label htmlFor="new-list-item">Nova {listLabels[kind].singular}</label>
          <input
            id="new-list-item"
            className="form-control"
            value={newName}
            onChange={(event) => setNewName(event.target.value)}
            placeholder={`Ex.: ${kind === "platforms" ? "Coursera" : kind === "areas" ? "Administração" : kind === "study-types" ? "Laboratório" : "Checklist"}`}
            maxLength={80}
          />
        </div>
        <button className="primary-button" type="submit" disabled={adding}>
          {adding ? <LoaderCircle className="spin" size={16} /> : <Plus size={16} />}
          {adding ? "Adicionando..." : "Adicionar"}
        </button>
      </form>

      {notice && <div className={`settings-notice ${notice.type}`} role="alert">{notice.text}</div>}

      <div className="list-items-block">
        <h3>Itens ativos <span>{activeItems.length}</span></h3>
        <div className="config-list">
          {activeItems.map((item) => (
            <div className="config-list-row" key={item.id}>
              {editingId === item.id ? (
                <>
                  <input className="form-control" value={editingName} onChange={(event) => setEditingName(event.target.value)} maxLength={80} autoFocus />
                  <div className="row-actions">
                    <button type="button" className="icon-action success" aria-label="Salvar nome" disabled={loadingId === item.id} onClick={() => updateItem(item.id, { name: editingName })}><Check size={15} /></button>
                    <button type="button" className="icon-action" aria-label="Cancelar edição" onClick={() => { setEditingId(null); setEditingName(""); }}><X size={15} /></button>
                  </div>
                </>
              ) : (
                <>
                  <div className="config-list-copy"><strong>{item.name}</strong><small>{item.isSystem ? "Valor inicial do sistema" : "Criado por você"}</small></div>
                  <div className="row-actions">
                    <button type="button" className="icon-action" aria-label={`Renomear ${item.name}`} onClick={() => { setEditingId(item.id); setEditingName(item.name); }}><Pencil size={15} /></button>
                    <button type="button" className="icon-action warning" aria-label={`Arquivar ${item.name}`} disabled={loadingId === item.id} onClick={() => updateItem(item.id, { archived: true })}>{loadingId === item.id ? <LoaderCircle className="spin" size={15} /> : <Archive size={15} />}</button>
                  </div>
                </>
              )}
            </div>
          ))}
          {activeItems.length === 0 && <div className="settings-empty">Nenhum item ativo nesta lista.</div>}
        </div>
      </div>

      {archivedItems.length > 0 && (
        <details className="archived-list">
          <summary>Itens arquivados ({archivedItems.length})</summary>
          <div className="config-list">
            {archivedItems.map((item) => (
              <div className="config-list-row archived" key={item.id}>
                <div className="config-list-copy"><strong>{item.name}</strong><small>Não aparece em novos cadastros</small></div>
                <button type="button" className="secondary-button compact-button" disabled={loadingId === item.id} onClick={() => updateItem(item.id, { archived: false })}>
                  {loadingId === item.id ? <LoaderCircle className="spin" size={14} /> : <RotateCcw size={14} />} Restaurar
                </button>
              </div>
            ))}
          </div>
        </details>
      )}
    </section>
  );
}

export function SettingsCenter({ initialSettings, initialLists, databaseReady }: { initialSettings: UserSettings; initialLists: ConfigurableLists; databaseReady: boolean }) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>("geral");
  const [settings, setSettings] = useState(initialSettings);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<Notice>(null);

  function update<K extends keyof UserSettings>(key: K, value: UserSettings[K]) {
    setSettings((current) => ({ ...current, [key]: value }));
  }

  async function saveSettings(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    setNotice(null);
    setSaving(true);
    const response = await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings),
    });
    const payload = (await response.json().catch(() => ({}))) as { message?: string; settings?: UserSettings };
    setSaving(false);

    if (!response.ok || !payload.settings) {
      setNotice({ type: "error", text: payload.message ?? "Não foi possível salvar as configurações." });
      return;
    }

    setSettings(payload.settings);
    setNotice({ type: "success", text: payload.message ?? "Configurações salvas." });
    router.refresh();
  }

  if (!databaseReady) {
    return (
      <div className="migration-required">
        <div className="migration-icon"><Settings2 size={25} /></div>
        <div>
          <h2>O banco da versão 0.4 ainda precisa ser preparado</h2>
          <p>Execute o arquivo SQL da pasta <code>supabase/migrations</code> no SQL Editor do seu projeto Supabase. Depois atualize esta página.</p>
          <p className="migration-file">202607240001_v0_4_settings_and_lists.sql</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="settings-tabs tabs" role="tablist" aria-label="Seções de configurações">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button key={id} className={`tab-button ${activeTab === id ? "active" : ""}`} role="tab" aria-selected={activeTab === id} onClick={() => { setActiveTab(id); setNotice(null); }}>
            <Icon size={14} /> {label}
          </button>
        ))}
      </div>

      {notice && <div className={`settings-notice global ${notice.type}`} role="alert">{notice.text}</div>}

      {(activeTab === "geral" || activeTab === "metas" || activeTab === "aparencia") && (
        <form onSubmit={saveSettings} className="settings-live-grid">
          {activeTab === "geral" && (
            <>
              <section className="settings-live-card">
                <div className="settings-card-heading"><div><Globe2 size={19} /><div><h2>Preferências regionais</h2><p>Datas e horários usados nos relatórios e registros.</p></div></div></div>
                <div className="settings-fields-grid">
                  <div className="form-field"><label htmlFor="locale">Idioma</label><select id="locale" className="form-control" value={settings.locale} onChange={(event) => update("locale", event.target.value)}><option value="pt-BR">Português (Brasil)</option></select></div>
                  <div className="form-field"><label htmlFor="timezone">Fuso horário</label><select id="timezone" className="form-control" value={settings.timezone} onChange={(event) => update("timezone", event.target.value)}><option value="America/Sao_Paulo">Brasília — America/Sao_Paulo</option><option value="America/Manaus">Manaus — America/Manaus</option><option value="America/Belem">Belém — America/Belem</option><option value="America/Rio_Branco">Rio Branco — America/Rio_Branco</option></select></div>
                  <div className="form-field"><label htmlFor="date-format">Formato de data</label><select id="date-format" className="form-control" value={settings.dateFormat} onChange={(event) => update("dateFormat", event.target.value as UserSettings["dateFormat"])}><option value="DD/MM/AAAA">DD/MM/AAAA</option><option value="AAAA-MM-DD">AAAA-MM-DD</option></select></div>
                  <div className="form-field"><label htmlFor="time-format">Formato de hora</label><select id="time-format" className="form-control" value={settings.timeFormat} onChange={(event) => update("timeFormat", event.target.value as UserSettings["timeFormat"])}><option value="24h">24 horas</option><option value="12h">12 horas</option></select></div>
                </div>
              </section>

              <section className="settings-live-card">
                <div className="settings-card-heading"><div><Settings2 size={19} /><div><h2>Preferências de uso</h2><p>Defina o comportamento padrão do sistema.</p></div></div></div>
                <div className="form-field"><label htmlFor="home-page">Página inicial após o login</label><select id="home-page" className="form-control" value={settings.homePage} onChange={(event) => update("homePage", event.target.value as UserSettings["homePage"])}><option value="estudos">Estudos</option><option value="cursos">Cursos</option><option value="dashboard">Dashboard</option><option value="anotacoes">Anotações</option><option value="certificados">Certificados</option></select></div>
                <div className="toggle-row"><div className="toggle-copy"><strong>Salvar curso atual automaticamente</strong><small>Manter o último curso selecionado.</small></div><Toggle checked={settings.saveCurrentCourse} onChange={(value) => update("saveCurrentCourse", value)} label="Salvar curso atual automaticamente" /></div>
                <div className="toggle-row"><div className="toggle-copy"><strong>Lembrar filtros nas páginas</strong><small>Recuperar filtros aplicados durante o uso.</small></div><Toggle checked={settings.rememberFilters} onChange={(value) => update("rememberFilters", value)} label="Lembrar filtros" /></div>
                <div className="toggle-row"><div className="toggle-copy"><strong>Exibir dicas e sugestões</strong><small>Mostrar orientações contextuais.</small></div><Toggle checked={settings.showTips} onChange={(value) => update("showTips", value)} label="Exibir dicas e sugestões" /></div>
              </section>
            </>
          )}

          {activeTab === "metas" && (
            <>
              <section className="settings-live-card">
                <div className="settings-card-heading"><div><CircleHelp size={19} /><div><h2>Metas de estudo</h2><p>Estes valores alimentarão os indicadores nas próximas versões.</p></div></div></div>
                <div className="settings-fields-grid">
                  <div className="form-field"><label htmlFor="monthly-goal">Meta mensal de horas</label><input id="monthly-goal" className="form-control" type="number" min="0.01" max="744" step="0.25" value={settings.monthlyGoalHours} onChange={(event) => update("monthlyGoalHours", Number(event.target.value))} /></div>
                  <div className="form-field"><label htmlFor="certificate-goal">Meta anual de certificados</label><input id="certificate-goal" className="form-control" type="number" min="0" max="999" step="1" value={settings.annualCertificateGoal} onChange={(event) => update("annualCertificateGoal", Number(event.target.value))} /></div>
                  <div className="form-field"><label htmlFor="tracking-year">Ano de acompanhamento</label><input id="tracking-year" className="form-control" type="number" min="2000" max="2100" step="1" value={settings.trackingYear} onChange={(event) => update("trackingYear", Number(event.target.value))} /></div>
                  <div className="form-field"><label htmlFor="consistency-days">Dias no calendário de consistência</label><select id="consistency-days" className="form-control" value={settings.consistencyDays} onChange={(event) => update("consistencyDays", Number(event.target.value))}><option value={30}>30 dias</option><option value={60}>60 dias</option><option value={90}>90 dias</option><option value={180}>180 dias</option><option value={365}>365 dias</option></select></div>
                </div>
              </section>

              <section className="settings-live-card settings-preview-card">
                <div className="settings-card-heading"><div><Bell size={19} /><div><h2>Prévia das metas</h2><p>Confirme os números antes de salvar.</p></div></div></div>
                <div className="goal-preview"><span>Meta mensal</span><strong>{settings.monthlyGoalHours.toLocaleString("pt-BR")}h</strong></div>
                <div className="goal-preview"><span>Meta anual</span><strong>{settings.annualCertificateGoal} certificados</strong></div>
                <div className="goal-preview"><span>Ano padrão</span><strong>{settings.trackingYear}</strong></div>
                <div className="goal-preview"><span>Calendário</span><strong>{settings.consistencyDays} dias</strong></div>
              </section>
            </>
          )}

          {activeTab === "aparencia" && (
            <section className="settings-live-card settings-full-card">
              <div className="settings-card-heading"><div><Palette size={19} /><div><h2>Aparência do sistema</h2><p>O tema e a cor são aplicados depois de salvar.</p></div></div></div>
              <div className="form-field"><label>Tema</label><div className="theme-options interactive"><button type="button" className={`theme-option ${settings.theme === "light" ? "active" : ""}`} onClick={() => update("theme", "light")}><Sun size={20} /><span>Claro</span></button><button type="button" className={`theme-option ${settings.theme === "dark" ? "active" : ""}`} onClick={() => update("theme", "dark")}><Moon size={20} /><span>Escuro</span></button><button type="button" className={`theme-option ${settings.theme === "system" ? "active" : ""}`} onClick={() => update("theme", "system")}><Monitor size={20} /><span>Sistema</span></button></div></div>
              <div className="form-field"><label>Cor principal</label><div className="color-options">{accentColors.map((color) => <button key={color} type="button" className={`color-swatch ${settings.accentColor === color ? "active" : ""}`} style={{ background: color }} aria-label={`Selecionar cor ${color}`} onClick={() => update("accentColor", color)} />)}</div></div>
              <div className="settings-fields-grid">
                <div className="form-field"><label htmlFor="density">Densidade da interface</label><select id="density" className="form-control" value={settings.interfaceDensity} onChange={(event) => update("interfaceDensity", event.target.value as UserSettings["interfaceDensity"])}><option value="compact">Compacta</option><option value="default">Padrão</option><option value="comfortable">Confortável</option></select></div>
                <div className="form-field"><label htmlFor="rounding">Arredondamento</label><select id="rounding" className="form-control" value={settings.rounding} onChange={(event) => update("rounding", event.target.value as UserSettings["rounding"])}><option value="small">Menor</option><option value="default">Padrão</option><option value="large">Maior</option></select></div>
              </div>
            </section>
          )}

          <div className="settings-save-bar">
            <div><strong>Alterações pendentes</strong><small>As configurações serão gravadas no Supabase e ficarão disponíveis em outros dispositivos.</small></div>
            <button className="primary-button" type="submit" disabled={saving}>{saving ? <LoaderCircle className="spin" size={16} /> : <Save size={16} />}{saving ? "Salvando..." : "Salvar configurações"}</button>
          </div>
        </form>
      )}

      {activeTab === "listas" && <ListManager initialLists={initialLists} />}

      {activeTab === "privacidade" && (
        <div className="settings-live-grid">
          <section className="settings-live-card settings-full-card"><div className="settings-card-heading"><div><LockKeyhole size={19} /><div><h2>Privacidade e segurança</h2><p>Os registros ficam isolados por usuário através de Row Level Security e as exportações exigem uma sessão válida.</p></div></div></div><div className="privacy-points"><p><Check size={16} /> Cada consulta valida o usuário autenticado.</p><p><Check size={16} /> Cursos, estudos, anotações, certificados e listas são particulares da conta.</p><p><Check size={16} /> Arquivos de certificados permanecem em bucket privado.</p><p><Check size={16} /> Exportações e backups são registrados em logs técnicos sem armazenar o conteúdo exportado.</p></div></section>
          <DataManagementPanel />
        </div>
      )}

      {activeTab === "conta" && (
        <div className="settings-live-grid">
          <section className="settings-live-card settings-full-card"><div className="settings-card-heading"><div><UserRound size={19} /><div><h2>Conta e acesso</h2><p>Nome, e-mail, foto e senha continuam na tela protegida de perfil.</p></div></div></div><Link className="primary-button settings-profile-link" href="/perfil">Abrir meu perfil</Link></section>
        </div>
      )}
    </>
  );
}
