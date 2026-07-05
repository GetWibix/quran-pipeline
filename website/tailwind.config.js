/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,ts,tsx,css}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: '#2563eb',
        'primary-dark': '#1d4ed8',
        secondary: '#7c3aed',
        accent: '#34d399',
        gold: '#C9A84C',
        'gold-light': '#E8D48B',
        'gold-dark': '#A68B2E',
        cream: '#F5F0E1',
        'bg-dark': '#0a1628',
        'card': 'rgba(255,255,255,0.03)',
        'card-hover': 'rgba(255,255,255,0.07)',
        'border': 'rgba(255,255,255,0.08)',
        'text-primary': '#ffffff',
        'text-secondary': 'rgba(255,255,255,0.7)',
        'text-muted': 'rgba(255,255,255,0.4)',
      },
      fontFamily: {
        cairo: ['Cairo', 'sans-serif'],
        amiri: ['Amiri', 'serif'],
      },
      animation: {
        'glow': 'glow 2s ease-in-out infinite alternate',
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        glow: {
          '0%': { boxShadow: '0 0 20px rgba(37, 99, 235, 0.3)' },
          '100%': { boxShadow: '0 0 40px rgba(37, 99, 235, 0.6)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-20px)' },
        },
      },
    },
  },
  plugins: [],
};
