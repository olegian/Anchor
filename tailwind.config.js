/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
      './app/**/*.{js,ts,jsx,tsx,mdx}',
      './components/**/*.{js,ts,jsx,tsx,mdx}',
    ],
    theme: {
      extend: {
        colors: {
          primary: {
            DEFAULT: '#3b82f6',
            dark: '#2563eb',
            light: '#60a5fa',
          },
          secondary: {
            DEFAULT: '#10b981',
            dark: '#059669',
            light: '#34d399',
          },
          background: {
            DEFAULT: '#ffffff',
            dark: '#f3f4f6',
          },
          ai: {
            highlight: 'rgba(96, 165, 250, 0.2)',
          },
        },
        boxShadow: {
          'sidebar': '0 0 10px rgba(0, 0, 0, 0.1)',
        },
        animation: {
          'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        },
      },
    },
    plugins: [],
  };