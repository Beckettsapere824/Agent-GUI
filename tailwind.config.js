/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        desktop: "#0f1115",
        panel: "#161a22",
        border: "#2a2f3a",
        accent: "#3b82f6",
        muted: "#6b7280",
      },
    },
  },
  plugins: [],
};