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
        // === PRISM COLOR PALETTE ===
        // Light-based colors that layer to create rainbow prism effects
        
        // Teal - Cool energy
        'prism-teal': '#00CED1',
        'prism-teal-light': '#40E0D0',
        'prism-teal-dark': '#008B8B',
        
        // Gold - Radiant power
        'prism-gold': '#FFD700',
        'prism-gold-light': '#FFE44D',
        'prism-gold-dark': '#DAA520',
        
        // Red - Intensity
        'prism-red': '#FF4757',
        'prism-red-light': '#FF6B7A',
        'prism-red-dark': '#DC3545',
        
        // Orange - Warmth
        'prism-orange': '#FF6B35',
        'prism-orange-light': '#FF8C5A',
        'prism-orange-dark': '#E55B2B',
        
        // Purple - Depth
        'prism-purple': '#8B5CF6',
        'prism-purple-light': '#A78BFA',
        'prism-purple-dark': '#7C3AED',
        
        // Pink - Vibrance
        'prism-pink': '#EC4899',
        'prism-pink-light': '#F472B6',
        'prism-pink-dark': '#DB2777',
        
        // Blue - Trust
        'prism-blue': '#3B82F6',
        'prism-blue-light': '#60A5FA',
        'prism-blue-dark': '#2563EB',
        
        // Dark UI
        'dark': '#050508',
        'dark-100': '#0A0A0F',
        'dark-200': '#12121A',
        'dark-300': '#1A1A24',
        'dark-400': '#24243A',
        'dark-500': '#2E2E44',
        'dark-border': '#3A3A52',
      },
      animation: {
        'prism-glow': 'prism-glow 4s ease-in-out infinite',
        'prism-border': 'prism-border 6s linear infinite',
        'float': 'float 6s ease-in-out infinite',
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'shimmer': 'shimmer 2.5s linear infinite',
        'gradient-shift': 'gradient-shift 8s ease infinite',
      },
      keyframes: {
        'prism-glow': {
          '0%, 100%': { 
            boxShadow: '0 0 30px rgba(0, 206, 209, 0.5), 0 0 60px rgba(139, 92, 246, 0.3)' 
          },
          '25%': { 
            boxShadow: '0 0 30px rgba(255, 215, 0, 0.5), 0 0 60px rgba(236, 72, 153, 0.3)' 
          },
          '50%': { 
            boxShadow: '0 0 30px rgba(255, 71, 87, 0.5), 0 0 60px rgba(255, 107, 53, 0.3)' 
          },
          '75%': { 
            boxShadow: '0 0 30px rgba(59, 130, 246, 0.5), 0 0 60px rgba(0, 206, 209, 0.3)' 
          },
        },
        'prism-border': {
          '0%, 100%': { borderColor: '#00CED1' },
          '14%': { borderColor: '#FFD700' },
          '28%': { borderColor: '#FF4757' },
          '42%': { borderColor: '#FF6B35' },
          '57%': { borderColor: '#8B5CF6' },
          '71%': { borderColor: '#EC4899' },
          '85%': { borderColor: '#3B82F6' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        'shimmer': {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'gradient-shift': {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
      },
    },
  },
  plugins: [],
}
export default config
