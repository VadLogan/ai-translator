export interface Language {
  code: string;
  name: string;
  /** "Translating to <this language>", written in the language itself: the busy label speaks the target language. */
  translating: string;
}

export const LANGUAGES: readonly Language[] = [
  { code: 'ar', name: 'Arabic', translating: 'جارٍ الترجمة إلى العربية' },
  { code: 'bg', name: 'Bulgarian', translating: 'Превеждам на български' },
  { code: 'zh', name: 'Chinese', translating: '正在翻译成中文' },
  { code: 'cs', name: 'Czech', translating: 'Překládám do češtiny' },
  { code: 'da', name: 'Danish', translating: 'Oversætter til dansk' },
  { code: 'nl', name: 'Dutch', translating: 'Vertalen naar het Nederlands' },
  { code: 'en', name: 'English', translating: 'Translating to English' },
  { code: 'et', name: 'Estonian', translating: 'Tõlgin eesti keelde' },
  { code: 'fi', name: 'Finnish', translating: 'Käännetään suomeksi' },
  { code: 'fr', name: 'French', translating: 'Traduction en français' },
  { code: 'de', name: 'German', translating: 'Übersetze ins Deutsche' },
  { code: 'el', name: 'Greek', translating: 'Μετάφραση στα ελληνικά' },
  { code: 'he', name: 'Hebrew', translating: 'מתרגם לעברית' },
  { code: 'hi', name: 'Hindi', translating: 'हिंदी में अनुवाद हो रहा है' },
  { code: 'hu', name: 'Hungarian', translating: 'Fordítás magyarra' },
  { code: 'id', name: 'Indonesian', translating: 'Menerjemahkan ke bahasa Indonesia' },
  { code: 'it', name: 'Italian', translating: 'Traduzione in italiano' },
  { code: 'ja', name: 'Japanese', translating: '日本語に翻訳中' },
  { code: 'ko', name: 'Korean', translating: '한국어로 번역 중' },
  { code: 'lv', name: 'Latvian', translating: 'Tulkoju latviski' },
  { code: 'lt', name: 'Lithuanian', translating: 'Verčiama į lietuvių kalbą' },
  { code: 'no', name: 'Norwegian', translating: 'Oversetter til norsk' },
  { code: 'pl', name: 'Polish', translating: 'Tłumaczę na polski' },
  { code: 'pt', name: 'Portuguese', translating: 'Traduzindo para português' },
  { code: 'ro', name: 'Romanian', translating: 'Se traduce în română' },
  { code: 'sk', name: 'Slovak', translating: 'Prekladám do slovenčiny' },
  { code: 'es', name: 'Spanish', translating: 'Traduciendo al español' },
  { code: 'sv', name: 'Swedish', translating: 'Översätter till svenska' },
  { code: 'tr', name: 'Turkish', translating: 'Türkçeye çevriliyor' },
  { code: 'uk', name: 'Ukrainian', translating: 'Перекладаю українською' },
  { code: 'vi', name: 'Vietnamese', translating: 'Đang dịch sang tiếng Việt' },
];

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
