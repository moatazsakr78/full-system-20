import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'pos-dark': '#2B3544',
        'pos-darker': '#1F2937',
        'pos-blue': '#3B82F6',
        'pos-green': '#10B981',
        'pos-red': '#EF4444',
        'pos-orange': '#F59E0B',
        'pos-gray': '#6B7280',
        'pos-light-gray': '#9CA3AF',
      },
      fontFamily: {
        'arabic': ['Cairo', 'Arial', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
export default config