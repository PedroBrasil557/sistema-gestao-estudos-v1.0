export type ThemePreference = "light" | "dark" | "system";
export type InterfaceDensity = "compact" | "default" | "comfortable";
export type RoundingPreference = "small" | "default" | "large";
export type HomePage = "estudos" | "cursos" | "dashboard" | "anotacoes" | "certificados";
export type DateFormat = "DD/MM/AAAA" | "AAAA-MM-DD";
export type TimeFormat = "24h" | "12h";

export type UserSettings = {
  monthlyGoalHours: number;
  annualCertificateGoal: number;
  trackingYear: number;
  consistencyDays: number;
  currentCourseId: string | null;
  homePage: HomePage;
  timezone: string;
  locale: string;
  dateFormat: DateFormat;
  timeFormat: TimeFormat;
  theme: ThemePreference;
  accentColor: string;
  sidebarColor: string;
  buttonColor: string;
  cardTone: "soft" | "neutral" | "vivid";
  interfaceDensity: InterfaceDensity;
  rounding: RoundingPreference;
  rememberFilters: boolean;
  showTips: boolean;
  saveCurrentCourse: boolean;
};

export const configurableListKinds = [
  "platforms",
  "areas",
  "study-types",
  "note-categories",
] as const;

export type ConfigurableListKind = (typeof configurableListKinds)[number];

export type ConfigurableListItem = {
  id: string;
  name: string;
  color?: string;
  isSystem: boolean;
  archivedAt: string | null;
};

export type ConfigurableLists = Record<ConfigurableListKind, ConfigurableListItem[]>;
