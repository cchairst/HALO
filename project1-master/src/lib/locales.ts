// Supported UI locales for Halo. Keep this list small and curated — every
// locale here ships with a hand-translated dictionary in messages/*.json.
// The first entry is the default and what every untranslated key falls back
// to.

export const LOCALES = [
  { code: "en", label: "English", native: "English" },
  { code: "es", label: "Spanish", native: "Español" },
  { code: "zh", label: "Chinese (Simplified)", native: "中文" },
  { code: "vi", label: "Vietnamese", native: "Tiếng Việt" },
  { code: "ar", label: "Arabic", native: "العربية" },
  { code: "fr", label: "French", native: "Français" },
] as const;

export type LocaleCode = (typeof LOCALES)[number]["code"];

export const DEFAULT_LOCALE: LocaleCode = "en";

export const LOCALE_COOKIE = "halo_locale";

export function isLocale(value: string): value is LocaleCode {
  return LOCALES.some((l) => l.code === value);
}

// Right-to-left locales — needed so the <html dir="..."> attribute can be
// set on the root layout. Add new RTL codes here as we add them.
const RTL = new Set<LocaleCode>(["ar"]);

export function isRtl(locale: LocaleCode): boolean {
  return RTL.has(locale);
}
