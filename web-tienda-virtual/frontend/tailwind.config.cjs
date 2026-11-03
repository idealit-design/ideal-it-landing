module.exports = {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#20231f",
        paper: "#f7f5ef",
        moss: "#45634d",
        clay: "#b76f50",
        line: "#e7e4dc",
      },
      fontFamily: {
        display: ["Georgia", "serif"],
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      boxShadow: {
        soft: "0 16px 48px rgba(32, 35, 31, 0.08)",
      },
    },
  },
  plugins: [],
};
