export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "!./src/**/node_modules/**",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#2563eb',
          50: '#e8eef8',
          100: '#d1ddf1',
          200: '#a3bbe3',
          300: '#7599d5',
          400: '#4777c7',
          500: '#1955b9',
          600: '#1241a1',
          700: '#0d3280',
          800: '#092460',
          900: '#051640',
        },
        secondary: '#1e40af',
        success: '#16a34a',
        error: '#dc2626',
        warning: '#f59e0b',
        info: '#0ea5e9',
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'custom': '0 4px 6px rgba(0, 0, 0, 0.1)',
        'ambient': '0 20px 40px -15px rgba(0, 0, 0, 0.05)',
        'deep': '0 30px 60px -20px rgba(0, 0, 0, 0.08)',
      },
    },
  },
  plugins: [],
}