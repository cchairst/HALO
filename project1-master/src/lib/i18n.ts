import "server-only";
import { cookies } from "next/headers";
import { DEFAULT_LOCALE, isLocale, LOCALE_COOKIE, type LocaleCode } from "@/lib/locales";

// Dynamic imports keep the unused locales out of the server bundle for any
// given request — the runtime only loads the file for the locale we resolve.
const LOADERS: Record<LocaleCode, () => Promise<Dictionary>> = {
  en: () => import("@/messages/en.json").then((m) => m.default),
  es: () => import("@/messages/es.json").then((m) => m.default),
  zh: () => import("@/messages/zh.json").then((m) => m.default),
  vi: () => import("@/messages/vi.json").then((m) => m.default),
  ar: () => import("@/messages/ar.json").then((m) => m.default),
  fr: () => import("@/messages/fr.json").then((m) => m.default),
};

// The English dictionary is the source of truth for the shape — every other
// locale must mirror it. Translate-don't-extend.
export type Dictionary = typeof import("@/messages/en.json");

export type DictKey =
  | `${keyof Dictionary & string}.${string}`;

// Resolve the active locale for a server request:
//   1. The halo_locale cookie (set on sign-up + locale change).
//   2. Default ("en").
// We deliberately don't sniff Accept-Language — the user already picked a
// language at sign-up, and respecting that is more predictable than guessing
// from headers that may flip across browsers.
export async function resolveLocale(): Promise<LocaleCode> {
  const c = await cookies();
  const v = c.get(LOCALE_COOKIE)?.value;
  if (v && isLocale(v)) return v;
  return DEFAULT_LOCALE;
}

const dictCache = new Map<LocaleCode, Promise<Dictionary>>();

export async function getDictionary(locale?: LocaleCode): Promise<Dictionary> {
  const code = locale ?? (await resolveLocale());
  let p = dictCache.get(code);
  if (!p) {
    p = LOADERS[code]().catch((err) => {
      console.error("[i18n] failed loading", code, err);
      return LOADERS.en();
    });
    dictCache.set(code, p);
  }
  return p;
}

// Tiny dotted-path lookup — `t(dict, "onboarding.continueToHalo")`.
// Falls back to the key itself so missing keys are visible in dev rather
// than silently empty.
export function t(dict: Dictionary, key: string): string {
  const parts = key.split(".");
  let cur: unknown = dict;
  for (const p of parts) {
    if (cur && typeof cur === "object" && p in (cur as object)) {
      cur = (cur as Record<string, unknown>)[p];
    } else {
      return key;
    }
  }
  return typeof cur === "string" ? cur : key;
}

// Replace `{var}` placeholders in a string with values from a record. Used
// for greeting strings like "Welcome, {name}" so each locale can place the
// name where the grammar wants it.
export function fmt(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, k) => {
    const v = vars[k];
    return v === undefined ? `{${k}}` : String(v);
  });
}
