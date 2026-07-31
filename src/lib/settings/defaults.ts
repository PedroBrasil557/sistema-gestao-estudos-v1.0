import type { UserSettings } from "@/types/settings";

export const defaultUserSettings: UserSettings = {
  monthlyGoalHours: 40,
  annualCertificateGoal: 12,
  trackingYear: new Date().getFullYear(),
  consistencyDays: 30,
  currentCourseId: null,
  homePage: "estudos",
  timezone: "America/Sao_Paulo",
  locale: "pt-BR",
  dateFormat: "DD/MM/AAAA",
  timeFormat: "24h",
  theme: "system",
  accentColor: "#1768d3",
  interfaceDensity: "default",
  rounding: "default",
  rememberFilters: true,
  showTips: true,
  saveCurrentCourse: true,
};

export function mapSettingsRow(row: Record<string, unknown> | null | undefined): UserSettings {
  if (!row) return defaultUserSettings;

  return {
    monthlyGoalHours: Number(row.monthly_goal_hours ?? defaultUserSettings.monthlyGoalHours),
    annualCertificateGoal: Number(row.annual_certificate_goal ?? defaultUserSettings.annualCertificateGoal),
    trackingYear: Number(row.tracking_year ?? defaultUserSettings.trackingYear),
    consistencyDays: Number(row.consistency_days ?? defaultUserSettings.consistencyDays),
    currentCourseId: typeof row.current_course_id === "string" ? row.current_course_id : null,
    homePage: (row.home_page as UserSettings["homePage"]) ?? defaultUserSettings.homePage,
    timezone: String(row.timezone ?? defaultUserSettings.timezone),
    locale: String(row.locale ?? defaultUserSettings.locale),
    dateFormat: (row.date_format as UserSettings["dateFormat"]) ?? defaultUserSettings.dateFormat,
    timeFormat: (row.time_format as UserSettings["timeFormat"]) ?? defaultUserSettings.timeFormat,
    theme: (row.theme as UserSettings["theme"]) ?? defaultUserSettings.theme,
    accentColor: String(row.accent_color ?? defaultUserSettings.accentColor),
    interfaceDensity: (row.interface_density as UserSettings["interfaceDensity"]) ?? defaultUserSettings.interfaceDensity,
    rounding: (row.rounding as UserSettings["rounding"]) ?? defaultUserSettings.rounding,
    rememberFilters: Boolean(row.remember_filters ?? defaultUserSettings.rememberFilters),
    showTips: Boolean(row.show_tips ?? defaultUserSettings.showTips),
    saveCurrentCourse: Boolean(row.save_current_course ?? defaultUserSettings.saveCurrentCourse),
  };
}

export function settingsToDatabase(settings: UserSettings) {
  return {
    monthly_goal_hours: settings.monthlyGoalHours,
    annual_certificate_goal: settings.annualCertificateGoal,
    tracking_year: settings.trackingYear,
    consistency_days: settings.consistencyDays,
    current_course_id: settings.currentCourseId,
    home_page: settings.homePage,
    timezone: settings.timezone,
    locale: settings.locale,
    date_format: settings.dateFormat,
    time_format: settings.timeFormat,
    theme: settings.theme,
    accent_color: settings.accentColor,
    interface_density: settings.interfaceDensity,
    rounding: settings.rounding,
    remember_filters: settings.rememberFilters,
    show_tips: settings.showTips,
    save_current_course: settings.saveCurrentCourse,
  };
}
