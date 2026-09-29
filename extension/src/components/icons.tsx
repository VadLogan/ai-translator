import { useId, type ReactNode } from 'react';

/*
 * The design's icon set: line icons on a 24 grid, round caps and joins, colour from the text.
 * Used at 14–18 px; 16 in menu rows. Inline JSX, so the extension still ships no icon dependency.
 */

const THUMB = (
  <>
    <path d="M7 11v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-8a1 1 0 0 1 1-1z" />
    <path d="M7 11l4.5-8a2 2 0 0 1 3 2.4L13.5 9H19a2 2 0 0 1 2 2.3l-1.2 7A2 2 0 0 1 17.8 20H7" />
  </>
);

const PATHS = {
  translate: <><path d="m5 8 6 6" /><path d="m4 14 6-6 2-3" /><path d="M2 5h12" /><path d="M7 2h1" /><path d="m22 22-5-10-5 10" /><path d="M14 18h6" /></>,
  fixGrammar: <><path d="M4 6h16" /><path d="M4 12h9" /><path d="M14 17l2.5 2.5L21 15" /></>,
  moreNative: <><path d="M9.5 3 11 7.5 15.5 9 11 10.5 9.5 15 8 10.5 3.5 9 8 7.5z" /><path d="M18 13l.9 2.6L21.5 16.5 18.9 17.4 18 20l-.9-2.6L14.5 16.5l2.6-.9z" /></>,
  moreOfficial: <><path d="M14 3v5h5" /><path d="M15 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" /><path d="M9 13h6" /><path d="M9 17h4" /></>,
  /** Not in the sheet: the rewrite menu's "Shorter" needed one. */
  shorter: <><path d="M4 7h16" /><path d="M4 12h11" /><path d="M4 17h6" /></>,
  email: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></>,
  mic: <><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" /><path d="M12 19v3" /></>,
  listen: <><path d="M11 5 6 9H2v6h4l5 4z" /><path d="M15.5 8.5a5 5 0 0 1 0 7" /><path d="M19 5a9 9 0 0 1 0 14" /></>,
  /** A letter in a ring: "reads as" a script / language. */
  script: <><circle cx="12" cy="12" r="8" strokeOpacity={0.5} strokeWidth={1.6} /><path d="M12 7.5v8.5M9 7.5h6" strokeWidth={2.4} /><circle cx="16.3" cy="16.3" r="1.9" fill="currentColor" stroke="none" /></>,
  question: <><circle cx="12" cy="12" r="9" /><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.6v.4" /><path d="M12 17h.01" /></>,
  keyboard: <><rect x="2" y="6" width="20" height="12" rx="2" /><path d="M6 10h.01" /><path d="M10 10h.01" /><path d="M14 10h.01" /><path d="M18 10h.01" /><path d="M7 14h10" /></>,
  search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></>,
  swap: <><path d="m16 3 4 4-4 4" /><path d="M20 7H4" /><path d="m8 21-4-4 4-4" /><path d="M4 17h16" /></>,
  copy: <><rect x="9" y="9" width="12" height="12" rx="2" /><path d="M5 15V5a2 2 0 0 1 2-2h10" /></>,
  insert: <><path d="m9 10-5 5 5 5" /><path d="M20 4v7a4 4 0 0 1-4 4H4" /></>,
  like: THUMB,
  dislike: <g transform="rotate(180 12 12)">{THUMB}</g>,
  retry: <><path d="M3 12a9 9 0 0 1 15.5-6.2L21 8" /><path d="M21 3v5h-5" /></>,
  history: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  settings: <><path d="M21 4h-7" /><path d="M10 4H3" /><path d="M21 12h-9" /><path d="M8 12H3" /><path d="M21 20h-5" /><path d="M12 20H3" /><path d="M14 2v4" /><path d="M8 10v4" /><path d="M16 18v4" /></>,
  lock: <><rect x="4" y="11" width="16" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></>,
  add: <><path d="M12 5v14" /><path d="M5 12h14" /></>,
  ban: <><circle cx="12" cy="12" r="9" /><path d="m5.7 5.7 12.6 12.6" /></>,
  trash: <><path d="M4 7h16" /><path d="M10 11v6" /><path d="M14 11v6" /><path d="M6 7l1 13a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-13" /><path d="M9 7V4h6v3" /></>,
  close: <><path d="M18 6 6 18" /><path d="m6 6 12 12" /></>,
  check: <path d="M20 6 9 17l-5-5" />,
  chevronDown: <path d="m6 9 6 6 6-6" />,
  back: <path d="m15 18-6-6 6-6" />,
  /** A sub-screen's way home. */
  arrowBack: <><path d="M19 12H5" /><path d="m12 19-7-7 7-7" /></>,
  forward: <path d="m9 18 6-6-6-6" />,
} satisfies Record<string, ReactNode>;

export type IconName = keyof typeof PATHS;
export const ICON_NAMES = Object.keys(PATHS) as IconName[];

/*
 * Size goes in `style` as well as the attributes: HeroUI forces every svg inside a Button to
 * 16–20px (and nudges its margins), and only an inline style outranks that rule.
 */
const fixed = (width: number, height = width) => ({ width, height, margin: 0 });

export function Icon({ name, size = 16, strokeWidth = 1.8, className }: { name: IconName; size?: number; strokeWidth?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={className} style={fixed(size)}>
      {PATHS[name]}
    </svg>
  );
}

/** The app mark. `tile` (r10) for headers, `round` for the split icon. */
export function BrandMark({ size = 32, shape = 'tile' }: { size?: number; shape?: 'tile' | 'round' }) {
  // Gradient ids are document-global; two marks with the same id would share (or lose) a gradient.
  const id = useId();
  return (
    <span className={`flex shrink-0 overflow-hidden ${shape === 'round' ? 'rounded-full' : 'rounded-[10px]'}`} style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox="0 0 128 128" aria-hidden="true" style={fixed(size)}>
        <defs>
          <linearGradient id={`${id}v`} gradientUnits="userSpaceOnUse" x1="64" y1="36" x2="64" y2="92">
            <stop offset="0" stopColor="#FFFFFF" />
            <stop offset="1" stopColor="#FFFFFF" stopOpacity="0" />
          </linearGradient>
          <linearGradient id={`${id}h`} gradientUnits="userSpaceOnUse" x1="30" y1="92" x2="66" y2="92">
            <stop offset="0" stopColor="#D3D3D3" stopOpacity="0" />
            <stop offset="1" stopColor="#D3D3D3" />
          </linearGradient>
        </defs>
        <rect width="128" height="128" rx="30" fill="#4A6FA5" />
        <circle cx="64" cy="64" r="42" fill="none" stroke="#FFFFFF" strokeOpacity="0.35" strokeWidth="4" />
        <path d="M64 36v56" stroke={`url(#${id}v)`} strokeWidth="10" strokeLinecap="round" />
        <path d="M44 36h40" stroke="#FFFFFF" strokeWidth="10" strokeLinecap="round" />
        <path d="M30 92h36" stroke={`url(#${id}h)`} strokeWidth="10" strokeLinecap="round" />
      </svg>
    </span>
  );
}

// flag-icons ships one SVG per country (4:3, no width/height attrs -- `[&>svg]:size-full` below
// fills the wrapper). Static imports, not a glob: this is the fixed set LANGUAGES needs, and a
// static list is what lets the bundler drop the other 240-odd countries.
import gb from 'flag-icons/flags/4x3/gb.svg?raw';
import arab from 'flag-icons/flags/4x3/arab.svg?raw';
import bg from 'flag-icons/flags/4x3/bg.svg?raw';
import cn from 'flag-icons/flags/4x3/cn.svg?raw';
import cz from 'flag-icons/flags/4x3/cz.svg?raw';
import dk from 'flag-icons/flags/4x3/dk.svg?raw';
import nl from 'flag-icons/flags/4x3/nl.svg?raw';
import ee from 'flag-icons/flags/4x3/ee.svg?raw';
import fi from 'flag-icons/flags/4x3/fi.svg?raw';
import fr from 'flag-icons/flags/4x3/fr.svg?raw';
import de from 'flag-icons/flags/4x3/de.svg?raw';
import gr from 'flag-icons/flags/4x3/gr.svg?raw';
import il from 'flag-icons/flags/4x3/il.svg?raw';
import inFlag from 'flag-icons/flags/4x3/in.svg?raw';
import hu from 'flag-icons/flags/4x3/hu.svg?raw';
import id from 'flag-icons/flags/4x3/id.svg?raw';
import it from 'flag-icons/flags/4x3/it.svg?raw';
import jp from 'flag-icons/flags/4x3/jp.svg?raw';
import kr from 'flag-icons/flags/4x3/kr.svg?raw';
import lv from 'flag-icons/flags/4x3/lv.svg?raw';
import lt from 'flag-icons/flags/4x3/lt.svg?raw';
import no from 'flag-icons/flags/4x3/no.svg?raw';
import pl from 'flag-icons/flags/4x3/pl.svg?raw';
import pt from 'flag-icons/flags/4x3/pt.svg?raw';
import ro from 'flag-icons/flags/4x3/ro.svg?raw';
import sk from 'flag-icons/flags/4x3/sk.svg?raw';
import es from 'flag-icons/flags/4x3/es.svg?raw';
import se from 'flag-icons/flags/4x3/se.svg?raw';
import tr from 'flag-icons/flags/4x3/tr.svg?raw';
import ua from 'flag-icons/flags/4x3/ua.svg?raw';
import vn from 'flag-icons/flags/4x3/vn.svg?raw';

/** LANGUAGES code -> flag-icons country code. One entry per language.ts, kept in sync by hand. */
const LANG_FLAG: Record<string, string> = {
  ar: arab, bg, zh: cn, cs: cz, da: dk, nl, en: gb, et: ee, fi, fr, de, el: gr, he: il, hi: inFlag,
  hu, id, it, ja: jp, ko: kr, lv, lt, no, pl, pt, ro, sk, es, sv: se, tr, uk: ua, vi: vn,
};

/*
 * 20×14, r3, hairline edge so white stripes (e.g. Poland) don't vanish into the card. Null for a
 * language with no flag mapped. Some flags (kr, in, pt, ...) reuse internal ids for clipPaths --
 * ponytail: harmless when the same flag repeats on a page (both copies resolve to the same
 * artwork), but rewrite to unique ids with useId() if that ever stops being true.
 */
export function Flag({ lang, width = 20 }: { lang: string; width?: number }) {
  const svg = LANG_FLAG[lang];
  if (!svg) return null;
  const height = (width * 3) / 4;
  return (
    <span
      aria-hidden="true"
      style={{ width, height }}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
