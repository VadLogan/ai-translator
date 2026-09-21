import type { StorybookConfig } from '@storybook/react-vite';
import tailwindcss from '@tailwindcss/vite';

// WXT keeps its Vite config inside wxt.config.ts, so there is no vite.config.ts for Storybook to
// inherit -- the Tailwind plugin has to be added here too or src/ui/theme.css arrives unprocessed.
const config: StorybookConfig = {
  stories: ['../src/**/*.stories.tsx'],
  framework: { name: '@storybook/react-vite', options: {} },
  viteFinal: (viteConfig) => ({ ...viteConfig, plugins: [...(viteConfig.plugins ?? []), tailwindcss()] }),
};

export default config;
