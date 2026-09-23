import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState, type ReactNode } from 'react';
import { Kbd } from './buttons';
import { Flag } from './icons';
import { LanguageCard, Meter, RemovableChip, SearchField, Segmented, Select, StatusChip, Switch, TextAreaCard, TextField } from './inputs';

const meta = { title: 'UI/Inputs' } satisfies Meta;
export default meta;

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex min-h-10 items-center gap-4">
      <span className="w-30 shrink-0 text-[12.5px] font-medium text-tm-secondary">{label}</span>
      <div className="flex flex-wrap items-center gap-2.5">{children}</div>
    </div>
  );
}

export const Fields: StoryObj = {
  render: () => (
    <div className="flex max-w-[600px] flex-col font-tm gap-3.5 rounded-3xl bg-tm-surface p-5 shadow-tm-card">
      <Row label="Text input">
        <TextField label="Email" placeholder="you@example.com" className="w-65" />
      </Row>
      <Row label="Search">
        <SearchField aria-label="Search languages" defaultValue="ge" className="w-65" />
      </Row>
      <Row label="Select">
        <Select aria-label="Target language" defaultValue="en" className="w-65">
          <option value="en">English</option>
          <option value="pl">Polish</option>
          <option value="uk">Українська</option>
        </Select>
      </Row>
      <Row label="Text area card">
        <TextAreaCard label="Text to translate" placeholder="Type, paste or speak" className="w-65" />
      </Row>
      <Row label="Language card">
        <div className="w-[170px]">
          <LanguageCard flag={<Flag lang="pl" width={18} />} caption="Detected" name="Polish" />
        </div>
      </Row>
    </div>
  ),
};

function ControlsDemo() {
  const [speed, setSpeed] = useState<'0.75' | '1' | '1.25'>('1');
  const [chips, setChips] = useState([
    { label: 'English', flag: <Flag lang="en" width={18} /> },
    { label: 'Українська', flag: <Flag lang="uk" width={18} /> },
  ]);
  return (
    <div className="flex max-w-[600px] flex-col font-tm gap-3.5 rounded-3xl bg-tm-surface p-5 shadow-tm-card">
      <Row label="Switch">
        <Switch aria-label="On" defaultChecked />
        <Switch aria-label="Off" />
      </Row>
      <Row label="Segmented">
        <Segmented
          aria-label="Speed"
          value={speed}
          onChange={setSpeed}
          options={[
            { value: '0.75', label: '0.75×' },
            { value: '1', label: '1×' },
            { value: '1.25', label: '1.25×' },
          ]}
        />
      </Row>
      <Row label="Removable chips">
        {chips.map((chip) => (
          <RemovableChip key={chip.label} {...chip} onRemove={() => setChips(chips.filter((c) => c !== chip))} />
        ))}
      </Row>
      <Row label="Status chips">
        <StatusChip>English</StatusChip>
        <StatusChip>Pro</StatusChip>
        <StatusChip tone="neutral">UK → EN</StatusChip>
        <StatusChip tone="warning">Draft</StatusChip>
      </Row>
      <Row label="Key hints">
        <Kbd tone="row">1</Kbd>
        <Kbd tone="row">G</Kbd>
        <Kbd tone="row">Esc</Kbd>
        <Kbd>⌥T</Kbd>
      </Row>
      <Row label="Meter">
        <Meter aria-label="Used today" value={14} max={20} tone="warning" />
        <Meter aria-label="Used today" value={62} />
      </Row>
    </div>
  );
}

export const Controls: StoryObj = { render: () => <ControlsDemo /> };
