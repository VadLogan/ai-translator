import { expect, it } from 'vitest';
import { remToPx, withPropertyDefaults } from './shadow-css';

it('re-declares @property defaults, which a shadow root ignores', () => {
  const css = '@property --tw-border-style { syntax: "*"; inherits: false; initial-value: solid; }\n@property --tw-leading{syntax:"*";inherits:false}';
  expect(withPropertyDefaults(css)).toContain(
    '@layer properties{*,::before,::after,::backdrop{--tw-border-style:solid;--tw-leading:initial;}}',
  );
});

it('pins rem to 16px, since rem follows the page root', () => {
  expect(remToPx('--spacing:.25rem;margin:-1.5rem 2rem;--x-2rem:0')).toBe('--spacing:4px;margin:-24px 32px;--x-2rem:0');
});
