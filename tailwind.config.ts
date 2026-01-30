import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './contexts/**/*.{js,ts,jsx,tsx,mdx}',
    './hooks/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        beatmap: {
          bg: 'var(--beatmap-bg)',
          card: 'var(--beatmap-card)',
          primary: 'var(--beatmap-primary)',
          secondary: 'var(--beatmap-secondary)',
          accent: 'var(--beatmap-accent)',
          text: 'var(--beatmap-text)',
          muted: 'var(--beatmap-muted)',
          border: 'var(--beatmap-border)',
        },
      },
    },
  },
  plugins: [],
}

export default config
