/** @type {import('tailwindcss').Config} */
export default {
    content: [
      "./index.html",
      "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
      extend: {
        colors: {
          'editor-bg': '#1e1e1e',
          'sidebar-bg': '#252526',
          'titlebar-bg': '#2d2d2d',
          'border': '#404040',
          'text-primary': '#e0e0e0',
          'text-secondary': '#cccccc',
          'text-muted': '#999999',
          'accent': '#007acc',
          'accent-hover': '#005a9e',
          'success': '#4caf50',
          'error': '#f44336',
          'warning': '#ff9800',
        },
        fontFamily: {
          'mono': ['Consolas', 'Monaco', 'Courier New', 'monospace'],
        },
      },
    },
    plugins: [],
  }