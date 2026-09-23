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
  close: <><path d="M18 6 6 18" /><path d="m6 6 12 12" /></>,
  check: <path d="M20 6 9 17l-5-5" />,
  chevronDown: <path d="m6 9 6 6 6-6" />,
  back: <path d="m15 18-6-6 6-6" />,
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

// ponytail: only the three flags the design draws; add one here per language as the menu needs it.
const FLAGS: Record<string, ReactNode> = {
  en: (
    <>
      <rect width="20" height="14" fill="#012169" />
      <path d="M0 0L20 14M20 0L0 14" stroke="#FFFFFF" strokeWidth="3" />
      <path d="M0 0L20 14M20 0L0 14" stroke="#C8102E" strokeWidth="1.5" />
      <path d="M10 0v14M0 7h20" stroke="#FFFFFF" strokeWidth="4.5" />
      <path d="M10 0v14M0 7h20" stroke="#C8102E" strokeWidth="2.4" />
    </>
  ),
  pl: <><rect width="20" height="7" fill="#FFFFFF" /><rect y="7" width="20" height="7" fill="#DC143C" /></>,
  uk: <><rect width="20" height="7" fill="#005BBB" /><rect y="7" width="20" height="7" fill="#FFD500" /></>,
};

/** 20×14, r3, hairline edge so white stripes don't vanish. Null for a language with no flag yet. */
export function Flag({ lang, width = 20 }: { lang: string; width?: number }) {
  const flag = FLAGS[lang];
  if (!flag) return null;
  return (
    <svg width={width} height={(width * 14) / 20} style={fixed(width, (width * 14) / 20)} viewBox="0 0 20 14" aria-hidden="true" className="shrink-0 rounded-[3px] shadow-[0_0_0_1px_rgb(0_0_0/0.08)]">
      {flag}
    </svg>
  );
}
