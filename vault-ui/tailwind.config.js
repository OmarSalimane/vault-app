/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        // This overrides the default font with Inter
        sans: ['Inter', 'sans-serif'], 
      },
      colors: {
        vaultDark: '#1e293b',
        vaultBlue: '#0ea5e9',
      }
    },
  },
  plugins: [],
}