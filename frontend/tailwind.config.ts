import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // MBTA brand colors
        'mbta-red': '#DA291C',
        'mbta-orange': '#ED8B00',
        'mbta-blue': '#003DA5',
        'mbta-green': '#00843D',
        'mbta-silver': '#7C878E',
        'mbta-purple': '#80276C',
        
        // Custom colors for reliability indicators
        'reliability': {
          'high': '#10B981',    // Green
          'medium': '#F59E0B',  // Amber
          'low': '#EF4444',     // Red
        },
        
        // Risk level colors
        'risk': {
          'low': '#10B981',     // Green
          'medium': '#F59E0B',  // Amber
          'high': '#EF4444',    // Red
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}

export default config
