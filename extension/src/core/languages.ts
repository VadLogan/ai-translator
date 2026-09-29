import type { Language } from '../../../shared/contract';
import { LANGUAGES } from '../../../shared/contants';

// The list moved to shared/ so the API can offer the same codes to the detector; re-exported for the extension's imports.
export { LANGUAGES, type Language };

export function findLanguage(code: string): Language | undefined {
  return LANGUAGES.find((language) => language.code === code);
}

/**
 * The browser's preferred languages reduced to supported base codes ("en-US" -> "en"), deduped,
 * in preference order. The first one is the default target. Falls back to English.
 */
export function browserLanguages(
  preferred: readonly string[] = navigator.languages?.length ? navigator.languages : [navigator.language],
): string[] {
  const codes = preferred.map((tag) => tag.split('-')[0]!.toLowerCase()).filter((code) => findLanguage(code));
  return codes.length ? [...new Set(codes)] : ['en'];
}

/** The language's name in itself ("Polski"), from the browser's own CLDR data. Falls back to the English name. */
export function nativeName(code: string): string {
  try {
    const name = new Intl.DisplayNames([code], { type: 'language' }).of(code);
    if (name && name !== code) return name[0]!.toLocaleUpperCase(code) + name.slice(1);
  } catch {
    // An engine without the locale; the English name below will do.
  }
  return findLanguage(code)?.name ?? code;
}

/** LANGUAGES matching a typed query by English name, native name or code. Empty query: all of them. */
export function searchLanguages(query: string): Language[] {
  const q = query.trim().toLowerCase();
  if (!q) return [...LANGUAGES];
  return LANGUAGES.filter(
    ({ code, name }) => code === q || name.toLowerCase().includes(q) || nativeName(code).toLowerCase().includes(q),
  );
}
