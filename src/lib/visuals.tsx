import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  BookOpen,
  Database,
  FileText,
  Languages,
  LayoutDashboard,
  NotebookTabs,
  Sheet,
  WalletCards,
  Award,
  Calculator,
  BrainCircuit,
  Code2,
  GraduationCap,
  Lightbulb,
  MessageCircle,
  Sigma,
  Sparkles,
} from "lucide-react";

export const coursePalette = [
  "#2F6BFF",
  "#7C3AED",
  "#EC4899",
  "#16A34A",
  "#F97316",
  "#EAB308",
  "#0D9488",
  "#DC3545",
];

export const pastelByColor: Record<string, string> = {
  "#2F6BFF": "#EEF4FF",
  "#7C3AED": "#F4EFFF",
  "#EC4899": "#FFF0F7",
  "#16A34A": "#EFFAF2",
  "#F97316": "#FFF3EA",
  "#EAB308": "#FFF9E6",
  "#0D9488": "#ECFCF9",
  "#DC3545": "#FFF0F1",
};

export function normalizeHex(color?: string | null) {
  if (color && /^#[0-9a-fA-F]{6}$/.test(color)) return color.toUpperCase();
  return "#2F6BFF";
}

export function pastelColor(color?: string | null) {
  const normalized = normalizeHex(color);
  if (pastelByColor[normalized]) return pastelByColor[normalized];
  const r = Number.parseInt(normalized.slice(1, 3), 16);
  const g = Number.parseInt(normalized.slice(3, 5), 16);
  const b = Number.parseInt(normalized.slice(5, 7), 16);
  const mix = (value: number) => Math.round(value + (255 - value) * 0.9).toString(16).padStart(2, "0");
  return `#${mix(r)}${mix(g)}${mix(b)}`;
}

export function courseIcon(name?: string | null, fallbackName = ""): LucideIcon {
  const key = `${name ?? ""} ${fallbackName}`.toLowerCase();
  if (key.includes("language") || key.includes("idioma")) return Languages;
  if (key.includes("sheet") || key.includes("excel")) return Sheet;
  if (key.includes("bar") || key.includes("power bi")) return BarChart3;
  if (key.includes("database") || key.includes("sql")) return Database;
  if (key.includes("wallet") || key.includes("finance")) return WalletCards;
  if (key.includes("file") || key.includes("word")) return FileText;
  if (key.includes("award") || key.includes("cert")) return Award;
  if (key.includes("code") || key.includes("program")) return Code2;
  if (key.includes("brain") || key.includes("ia")) return BrainCircuit;
  if (key.includes("calculator") || key.includes("matem")) return Calculator;
  if (key.includes("message") || key.includes("comunica")) return MessageCircle;
  if (key.includes("sigma") || key.includes("estat")) return Sigma;
  if (key.includes("light") || key.includes("idea")) return Lightbulb;
  if (key.includes("spark")) return Sparkles;
  if (key.includes("graduation")) return GraduationCap;
  if (key.includes("dashboard")) return LayoutDashboard;
  if (key.includes("note")) return NotebookTabs;
  return BookOpen;
}

export function suggestedCourseColor(name: string, area?: string) {
  const value = `${name} ${area ?? ""}`.toLocaleLowerCase("pt-BR");
  if (value.includes("inglês") || value.includes("ingles")) return "#2F6BFF";
  if (value.includes("alemão") || value.includes("alemao")) return "#7C3AED";
  if (value.includes("francês") || value.includes("frances")) return "#EC4899";
  if (value.includes("espanhol")) return "#F97316";
  if (value.includes("excel")) return "#16A34A";
  if (value.includes("word")) return "#2F6BFF";
  if (value.includes("power bi")) return "#EAB308";
  if (value.includes("finan") || value.includes("contab")) return "#0D9488";
  if (value.includes("sql") || value.includes("banco")) return "#7C3AED";
  return "#2F6BFF";
}

export function isLanguageName(name: string, area?: string) {
  const value = `${name} ${area ?? ""}`.toLocaleLowerCase("pt-BR");
  return ["idioma", "inglês", "ingles", "alemão", "alemao", "francês", "frances", "espanhol", "italiano", "japonês", "japones", "mandarim"].some((token) => value.includes(token));
}
