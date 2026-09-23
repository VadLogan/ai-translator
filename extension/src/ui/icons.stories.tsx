import type { Meta, StoryObj } from '@storybook/react-vite';
import { BrandMark, Flag, ICON_NAMES, Icon } from './icons';

const meta = { title: 'UI/Icons' } satisfies Meta;
export default meta;

const CARD = 'flex max-w-[1000px] flex-col font-tm gap-3.5 rounded-3xl bg-tm-surface p-5 shadow-tm-card';

export const Interface: StoryObj = {
  render: () => (
    <div className={CARD}>
      <div className="grid grid-cols-8 gap-2.5">
        {ICON_NAMES.map((name) => (
          <span key={name} className="flex h-23 flex-col items-center justify-center gap-2.5 rounded-2xl bg-tm-subtle text-tm-ink">
            <Icon name={name} size={22} />
            <span className="tm-meta text-tm-secondary">{name}</span>
          </span>
        ))}
      </div>
    </div>
  ),
};

export const BrandAndFlags: StoryObj = {
  render: () => (
    <div className={`${CARD} flex-row flex-wrap items-center gap-7 text-[12.5px] text-tm-secondary`}>
      <span className="flex items-center gap-2.5"><BrandMark />App tile · headers</span>
      <span className="flex items-center gap-2.5"><BrandMark shape="round" />Round · split icon</span>
      <span className="flex items-center gap-2.5">
        <Flag lang="en" />
        <Flag lang="pl" />
        <Flag lang="uk" />
        Flags 20×14 · r3
      </span>
    </div>
  ),
};
