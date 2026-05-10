import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        serif: ['"Source Serif 4"', 'Georgia', 'serif'],
        sans: ['"IBM Plex Sans"', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'monospace'],
      },
      colors: {
        paper:    { DEFAULT: 'oklch(0.985 0.005 85)', 2: 'oklch(0.965 0.006 85)', 3: 'oklch(0.94 0.008 85)' },
        ink:      { DEFAULT: 'oklch(0.20 0.01 270)', 2: 'oklch(0.36 0.01 270)', 3: 'oklch(0.55 0.01 270)', 4: 'oklch(0.74 0.008 270)' },
        rule:     { DEFAULT: 'oklch(0.90 0.008 270)', 2: 'oklch(0.95 0.005 270)' },
        indigo:   { DEFAULT: 'oklch(0.42 0.13 280)', 2: 'oklch(0.55 0.14 280)', soft: 'oklch(0.96 0.025 280)', edge: 'oklch(0.86 0.05 280)' },
        amber:    { DEFAULT: 'oklch(0.62 0.13 70)',  soft: 'oklch(0.965 0.025 80)', edge: 'oklch(0.88 0.06 75)' },
        correct:  { DEFAULT: 'oklch(0.52 0.10 155)', soft: 'oklch(0.965 0.025 155)', edge: 'oklch(0.85 0.05 155)' },
        partial:  { DEFAULT: 'oklch(0.58 0.13 70)',  soft: 'oklch(0.965 0.025 70)',  edge: 'oklch(0.86 0.06 70)'  },
        wrong:    { DEFAULT: 'oklch(0.52 0.16 27)',  soft: 'oklch(0.965 0.025 27)',  edge: 'oklch(0.86 0.06 27)'  },
        unsup:    { DEFAULT: 'oklch(0.50 0.10 295)', soft: 'oklch(0.965 0.025 295)', edge: 'oklch(0.86 0.06 295)' },
      },
      borderRadius: { sm: '5px', DEFAULT: '8px', lg: '12px' },
    },
  },
  plugins: [],
} satisfies Config;
