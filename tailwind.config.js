/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: '#12151c',
          soft: '#2a3140',
          muted: '#5c6578',
        },
        paper: {
          DEFAULT: '#f2f1ee',
          card: '#fbfaf8',
          line: '#ddd9d1',
        },
        pine: {
          DEFAULT: '#1f4a42',
          deep: '#163630',
          mist: '#d7e4df',
        },
        brass: {
          DEFAULT: '#b0893d',
          soft: '#e8d7ad',
        },
      },
      fontFamily: {
        display: ['Fraunces', 'Georgia', 'serif'],
        sans: ['Manrope', 'Segoe UI', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 18px 40px rgba(18, 21, 28, 0.08)',
      },
      backgroundImage: {
        'hero-mesh':
          'radial-gradient(ellipse 80% 60% at 20% 20%, rgba(31,74,66,0.45), transparent 55%), radial-gradient(ellipse 70% 50% at 85% 15%, rgba(176,137,61,0.22), transparent 50%), linear-gradient(145deg, #0f1715 0%, #1a2c28 42%, #243a35 100%)',
        grain:
          "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.08'/%3E%3C/svg%3E\")",
      },
      keyframes: {
        rise: {
          '0%': { opacity: '0', transform: 'translateY(18px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        drift: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
        },
      },
      animation: {
        rise: 'rise 0.8s ease-out both',
        'rise-slow': 'rise 1.1s ease-out both',
        drift: 'drift 7s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
