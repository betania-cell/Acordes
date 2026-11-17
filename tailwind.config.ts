import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{js,ts,jsx,tsx,mdx}', './components/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        ink: '#0f172a',
        mist: '#e2e8f0',
        gold: '#f59e0b',
        accent: '#7c3aed'
      },
      boxShadow: {
        soft: '0 18px 45px rgba(15, 23, 42, 0.12)'
      }
    },
  },
  plugins: [],
};

export default config;