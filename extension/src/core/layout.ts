/**
 * Fixes text typed with the wrong keyboard layout: "ghbdtn" for "привет", "ерші" for "this".
 * Pure key-position mapping, so it costs nothing and can't hallucinate -- deciding *whether* a
 * selection needs it is the model's job (`mistyped` on POST /detect), which reads the text as a whole.
 */

// US QWERTY and Ukrainian ЙЦУКЕН, key for key: rows 1-3 plus the backtick key.
const QWERTY = "qwertyuiop[]asdfghjkl;'zxcvbnm,./`";
const UKRAINIAN = "йцукенгшщзхїфівапролджєячсмитьбю.'";
// Keys the Russian layout spells differently; only useful coming back to Latin.
const RUSSIAN_ONLY = { ы: 's', э: "'", ъ: ']', ё: '`' };

const toCyrillic = buildMap(QWERTY, UKRAINIAN);
const toLatin = new Map([
  ...buildMap(UKRAINIAN, QWERTY),
  ...buildMap(Object.keys(RUSSIAN_ONLY).join(''), Object.values(RUSSIAN_ONLY).join('')),
]);

function buildMap(from: string, to: string): Map<string, string> {
  const map = new Map<string, string>();
  for (const [index, char] of [...from].entries()) {
    const mapped = to[index] ?? char;
    map.set(char, mapped);
    map.set(char.toUpperCase(), mapped.toUpperCase());
  }
  return map;
}

const isCyrillic = (text: string): boolean => /[Ѐ-ӿ]/.test(text);

/** Re-types the text on the other layout. Characters that aren't on either one pass through. */
export function switchLayout(text: string): string {
  // One direction for the whole selection: a mistyped word is never half in each script.
  const map = isCyrillic(text) ? toLatin : toCyrillic;
  return [...text].map((char) => map.get(char) ?? char).join('');
}

/** What the mistyped text reads as, and what switchLayout turns it into -- the same direction rule. */
export const layoutLanguages = (text: string): { from: 'en' | 'uk'; to: 'en' | 'uk' } =>
  isCyrillic(text) ? { from: 'uk', to: 'en' } : { from: 'en', to: 'uk' };
