/** @type { import('@storybook/react').Preview } */
import '../../../client/src/index.css'; // Import app styles

const preview = {
  parameters: {
    actions: { argTypesRegex: '^on[A-Z].*' },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/,
      },
    },
    backgrounds: {
      default: 'light',
      values: [
        {
          name: 'light',
          value: '#f8f9fa',
        },
        {
          name: 'dark',
          value: '#1a1a1a',
        },
        {
          name: 'terrafusion-primary',
          value: '#0f766e', // Teal-700
        },
      ],
    },
    layout: 'centered',
  },
};

export default preview;