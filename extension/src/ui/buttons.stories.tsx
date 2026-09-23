import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ReactNode } from 'react';
import { IconButton, Kbd, PillButton } from './buttons';
import { Icon as Glyph } from './icons';

const meta = { title: 'UI/Buttons' } satisfies Meta;
export default meta;

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex min-h-10 items-center gap-4">
      <span className="w-30 shrink-0 text-[12.5px] font-medium text-tm-secondary">{label}</span>
      <div className="flex flex-wrap items-center gap-2.5">{children}</div>
    </div>
  );
}

export const Pill: StoryObj = {
  render: () => (
    <div className="flex max-w-[600px] flex-col gap-3.5 rounded-3xl bg-tm-surface p-5 font-tm shadow-tm-card">
      <Row label="Primary">
        <PillButton variant="primary">Translate to English</PillButton>
        <PillButton variant="primary" size="md">
          Replace <Kbd tone="onAccent">↵</Kbd>
        </PillButton>
      </Row>
      <Row label="Secondary">
        <PillButton>Not now</PillButton>
        <PillButton size="sm"><Glyph name="copy" size={14} strokeWidth={1.9} />Copy</PillButton>
      </Row>
      <Row label="Soft accent">
        <PillButton variant="soft" size="sm"><Glyph name="retry" size={13} strokeWidth={2.2} />Try another</PillButton>
        <PillButton variant="soft" size="xs">Sign in — free</PillButton>
      </Row>
      <Row label="Ghost">
        <PillButton variant="ghost" size="sm">Cancel</PillButton>
        <PillButton variant="ghost" size="xs" className="text-[13px]">Change</PillButton>
      </Row>
      <Row label="Dashed add">
        <PillButton variant="dashed" size="sm"><Glyph name="add" size={14} strokeWidth={2.2} />Add a language</PillButton>
      </Row>
      <Row label="Disabled">
        <PillButton size="md" isDisabled className="px-[18px] text-[14px]">Send</PillButton>
      </Row>
    </div>
  ),
};

export const Icon: StoryObj = {
  render: () => (
    <div className="flex max-w-[600px] flex-col gap-3.5 rounded-3xl bg-tm-surface p-5 font-tm shadow-tm-card">
      <Row label="Filled round">
        <IconButton aria-label="Good"><Glyph name="like" size={15} strokeWidth={1.9} /></IconButton>
        <IconButton aria-label="Bad"><Glyph name="dislike" size={15} strokeWidth={1.9} /></IconButton>
        <IconButton aria-label="Swap" size={36}><Glyph name="swap" size={15} strokeWidth={1.9} /></IconButton>
      </Row>
      <Row label="Pressed states">
        <IconButton aria-label="Liked" aria-pressed tone="accent"><Glyph name="like" size={15} strokeWidth={1.9} /></IconButton>
        <IconButton aria-label="Disliked" aria-pressed tone="danger"><Glyph name="dislike" size={15} strokeWidth={1.9} /></IconButton>
      </Row>
      <Row label="Primary round">
        <IconButton aria-label="Start speaking" tone="primary" size={36}><Glyph name="mic" size={17} strokeWidth={1.9} /></IconButton>
      </Row>
      <Row label="Ghost round">
        <IconButton aria-label="Close" tone="ghost" size={26}><Glyph name="close" size={15} strokeWidth={1.9} /></IconButton>
        <IconButton aria-label="Back" tone="ghost" size={28}><Glyph name="back" size={15} strokeWidth={1.9} /></IconButton>
      </Row>
    </div>
  ),
};
