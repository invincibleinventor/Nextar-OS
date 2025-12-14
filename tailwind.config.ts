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
      cursor: {
        'fancy': 'url(/cursor.png), default',
      },

      fontFamily: {
        sf: ['"SF Pro"', 'sans-serif'], // Define your custom font
      },
      backdropBlur: {
        'none': 'none',
        'sm': '4px',
        'md': '8px',
        'lg': '12px',
        'xl': '16px',
      },
      screens: {
        '2xs': '540px',
      },
      fontSize: {
        '2xs': ['0.625rem', { lineHeight: '0.75rem' }], // 10px
        '3xs': ['0.5rem', { lineHeight: '0.65rem' }],   
      },
    },
  },
  plugins: [

  ],
};

export default config;
