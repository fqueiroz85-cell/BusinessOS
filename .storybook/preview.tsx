import type { Preview } from '@storybook/nextjs-vite'
import { Inter, Space_Grotesk } from 'next/font/google'
import '../app/globals.css'

const inter = Inter({
  variable: '--font-sans',
  subsets: ['latin'],
})

const spaceGrotesk = Space_Grotesk({
  variable: '--font-heading',
  subsets: ['latin'],
})

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
       color: /(background|color)$/i,
       date: /Date$/i,
      },
    },

    a11y: {
      // 'todo' - show a11y violations in the test UI only
      // 'error' - fail CI on a11y violations
      // 'off' - skip a11y checks entirely
      test: 'todo'
    }
  },
  decorators: [
    (Story) => (
      <div className={`${inter.variable} ${spaceGrotesk.variable} font-sans antialiased`}>
        <Story />
      </div>
    ),
  ],
};

export default preview;