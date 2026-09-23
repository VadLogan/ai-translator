import type { ElementType, ReactNode } from 'react';

/*
 * The design's type scale as a component. The same steps exist as plain utilities (`tm-body`,
 * `tm-meta`, ...) in theme.css for places that already have a className -- button labels, menu
 * rows -- where wrapping text in another element would be noise.
 */

/** Scale step → its utility and the colour the sheet pairs it with. */
const VARIANT = {
  pageTitle: ['tm-page-title', 'ink'],
  dialogTitle: ['tm-dialog-title', 'ink'],
  sectionTitle: ['tm-section-title', 'ink'],
  body: ['tm-body', 'ink'],
  label: ['tm-label', 'ink'],
  helper: ['tm-helper', 'muted'],
  groupLabel: ['tm-group-label', 'muted'],
  meta: ['tm-meta', 'muted'],
} as const;

export const TEXT_TONE = {
  ink: 'text-tm-ink',
  secondary: 'text-tm-secondary',
  muted: 'text-tm-muted',
  placeholder: 'text-tm-placeholder',
  /** Only on a `bg-tm-soft` fill. */
  accent: 'text-tm-accent-text',
} as const;

export type TextVariant = keyof typeof VARIANT;
export type TextTone = keyof typeof TEXT_TONE;

export function Text({
  variant = 'body',
  tone,
  as: Tag = 'span',
  className = '',
  children,
}: {
  variant?: TextVariant;
  /** Overrides the colour the variant comes with. */
  tone?: TextTone;
  as?: ElementType;
  className?: string;
  children: ReactNode;
}) {
  const [type, defaultTone] = VARIANT[variant];
  return <Tag className={`${type} ${TEXT_TONE[tone ?? defaultTone]} ${className}`}>{children}</Tag>;
}

/** "Type" in ink, "Meant" in accent. Brand only. */
export function Wordmark({ size = 56 }: { size?: number }) {
  return (
    <span className="tm-wordmark text-tm-ink" style={{ fontSize: size }}>
      Type<span className="text-tm-accent">Meant</span>
    </span>
  );
}
