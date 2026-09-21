import type { Decorator, Preview } from '@storybook/react-vite';
import '../src/ui/theme.css';

export const globalTypes = {
  theme: {
    description: 'HeroUI theme',
    toolbar: {
      icon: 'circlehollow',
      items: [
        { value: 'light', title: 'Light' },
        { value: 'dark', title: 'Dark' },
      ],
      dynamicTitle: true,
    },
  },
};

export const initialGlobals = { theme: 'light' };

/** HeroUI reads its theme from a `.light` / `.dark` ancestor -- the same thing both UIs do. */
const withTheme: Decorator = (Story, context) => (
  <div className={`${context.globals['theme']} min-h-svh bg-background p-6 text-foreground`}>
    <Story />
  </div>
);

const preview: Preview = { decorators: [withTheme] };

export default preview;
