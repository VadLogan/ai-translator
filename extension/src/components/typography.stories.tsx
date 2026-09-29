import type { Meta, StoryObj } from '@storybook/react-vite';
import { TEXT_TONE, Text, Wordmark, type TextTone, type TextVariant } from './typography';

const meta = { title: 'UI/Typography' } satisfies Meta;
export default meta;

const CARD = 'max-w-[1000px] rounded-3xl bg-tm-surface p-5 font-tm shadow-tm-card';

const SCALE: [TextVariant, string, string, string][] = [
  ['pageTitle', 'Page title', '22 / 600', 'Settings'],
  ['dialogTitle', 'Dialog title', '17 / 600', 'Sign in — it stays free'],
  ['sectionTitle', 'Section / app name', '15 / 600', 'Grammar fixed'],
  ['body', 'Body', '14 / 400 · line 1.5', 'Dzień dobry, w załączniku przesyłam zaktualizowany kosztorys.'],
  ['label', 'Button · menu item', '14 / 500', 'Translate to English'],
  ['helper', 'Helper text', '13 / 400 · muted', 'Pre-selected every time the popup opens.'],
  ['groupLabel', 'Group label', '12 / 500 · muted', 'Translate to'],
  ['meta', 'Meta', '11.5 / 400 · muted', 'web.whatsapp.com · 09:41'],
];

function Caption({ title, spec }: { title: string; spec: string }) {
  return (
    <span className="flex w-[170px] shrink-0 flex-col gap-0.5">
      <span className="text-[12.5px] font-semibold text-tm-ink">{title}</span>
      <Text variant="meta">{spec}</Text>
    </span>
  );
}

export const Scale: StoryObj = {
  render: () => (
    <div className={`${CARD} flex flex-col`}>
      <div className="flex items-baseline gap-6 border-b border-tm-line py-3">
        <Caption title="Wordmark" spec="700 · tracking −3.5% · Brand only" />
        <Wordmark />
      </div>
      {SCALE.map(([variant, title, spec, sample]) => (
        <div key={variant} className="flex items-baseline gap-6 border-b border-tm-line py-3 last:border-b-0">
          <Caption title={title} spec={spec} />
          <Text variant={variant}>{sample}</Text>
        </div>
      ))}
    </div>
  ),
};

const TONES: [TextTone, string][] = [
  ['ink', 'Body, titles, buttons'],
  ['secondary', 'Board captions, tabs'],
  ['muted', 'Helpers, labels, meta'],
  ['placeholder', 'Empty fields, disabled'],
  ['accent', 'On the soft accent fill only'],
];

export const Colours: StoryObj = {
  render: () => (
    <div className={`${CARD} grid grid-cols-5 gap-4`}>
      {TONES.map(([tone, use]) => (
        <span key={tone} className="flex items-center gap-3">
          <span className={`size-9 shrink-0 rounded-[10px] bg-current ${TEXT_TONE[tone]}`} />
          <span className="flex flex-col gap-px">
            <Text variant="label" tone={tone} className={tone === 'accent' ? 'rounded bg-tm-soft px-1' : ''}>
              {tone}
            </Text>
            <Text variant="meta">{use}</Text>
          </span>
        </span>
      ))}
    </div>
  ),
};
