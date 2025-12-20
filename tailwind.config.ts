import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Money Green Theme (Primary)
        primary: '#69DB7C',          // Money green
        'primary-light': '#8CE99A',   // Light money green
        'primary-dark': '#51CF66',    // Dark money green
        'money-green': '#69DB7C',     // Main brand color
        
        // Black & Grey Scale
        black: '#000000',             // Pure black
        'grey-50': '#f5f5f5',
        'grey-100': '#e5e5e5',
        'grey-200': '#d4d4d4',
        'grey-300': '#a3a3a3',
        'grey-400': '#737373',
        'grey-500': '#525252',
        'grey-600': '#404040',
        'grey-700': '#2a2a2a',
        'grey-800': '#1a1a1a',
        'grey-900': '#0a0a0a',
        
        // Accent for yes/no
        'success': '#85BB65',
        'danger': '#ef4444',
        
        // Utility
        dark: '#000000',
        darkAlt: '#1a1a1a',
        light: '#f5f5f5',
      },
    },
  },
  plugins: [],
}
export default config
