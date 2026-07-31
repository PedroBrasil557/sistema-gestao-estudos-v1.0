import type { ConfigurableListItem, ConfigurableListKind } from "@/types/settings";

export const listTableMap: Record<ConfigurableListKind, string> = {
  platforms: "platforms",
  areas: "areas",
  "study-types": "study_types",
  "note-categories": "note_categories",
};

export const listLabels: Record<ConfigurableListKind, { singular: string; plural: string }> = {
  platforms: { singular: "plataforma", plural: "Plataformas" },
  areas: { singular: "área", plural: "Áreas de estudo" },
  "study-types": { singular: "tipo de estudo", plural: "Tipos de estudo" },
  "note-categories": { singular: "categoria", plural: "Categorias de anotações" },
};

export function isConfigurableListKind(value: string): value is ConfigurableListKind {
  return Object.prototype.hasOwnProperty.call(listTableMap, value);
}

export function normalizeListName(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();
}

export function mapListItem(row: Record<string, unknown>): ConfigurableListItem {
  return {
    id: String(row.id),
    name: String(row.name),
    isSystem: Boolean(row.is_system),
    archivedAt: typeof row.archived_at === "string" ? row.archived_at : null,
  };
}
