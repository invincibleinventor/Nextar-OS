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
        'pastel-red': '#ed8796',
        'pastel-peach': '#f5a97f',
        'pastel-yellow': '#eed49f',
        'pastel-green': '#a6da95',
        'pastel-teal': '#8bd5ca',
        'pastel-blue': '#8aadf4',
        'pastel-lavender': '#b7bdf8',
        'pastel-pink': '#f5bde6',
        'pastel-mauve': '#c6a0f6',
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
