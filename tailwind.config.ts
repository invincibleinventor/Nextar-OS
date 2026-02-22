import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: 'class',
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        accent: 'var(--accent-color)',
        base: 'var(--bg-base)',
        surface: 'var(--bg-surface)',
        overlay: 'var(--bg-overlay)',
        'pastel-red': 'var(--pastel-red)',
        'pastel-peach': 'var(--pastel-peach)',
        'pastel-yellow': 'var(--pastel-yellow)',
        'pastel-green': 'var(--pastel-green)',
        'pastel-teal': 'var(--pastel-teal)',
        'pastel-blue': 'var(--pastel-blue)',
        'pastel-lavender': 'var(--pastel-lavender)',
        'pastel-pink': 'var(--pastel-pink)',
        'pastel-mauve': 'var(--pastel-mauve)',
      },
      cursor: {
        'fancy': 'url(/cursor.png), default',
      },

      fontFamily: {
        sf: ['"SF Pro"', 'sans-serif'],
        mono: ['var(--font-mono)', '"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      borderColor: {
        DEFAULT: 'var(--border-color)',
      },
      screens: {
        '3xs': '440px',

        '2xs': '540px',
      },
      fontSize: {
        '2xs': ['0.625rem', { lineHeight: '0.75rem' }],
        '3xs': ['0.5rem', { lineHeight: '0.65rem' }],
      },
    },
  },
  plugins: [
    require('@tailwindcss/container-queries'),
  ],
};

export default config;
