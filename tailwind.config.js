/** @type {import('tailwindcss').Config} */

module.exports = {
  content: ["./index.html", "./build/*.html", "./src/*.html", "./build/*.js"],
  darkMode: "class",
  theme: {
    screens: {
      compact: "480px",
      mobile: "640px",
      tablet: "1024px",
      laptop: "1440px",
      desktop: "1536px",
      widescreen: "1920px",
    },
    extend: {
      colors: {
        amber: {
          1: "#fffbeb",
          2: "#fef3c7",
          3: "#fde68a",
          4: "#fcd34d",
          5: "#fbbf24",
          6: "#f59e0b",
          7: "#d97706",
          8: "#b45309",
          9: "#92400e",
          10: "#78350f",
          11: "#451a03",
        },
        slate: {
          1: "#f8fafc",
          2: "#f1f5f9",
          3: "#e2e8f0",
          4: "#cbd5e1",
          5: "#94a3b8",
          6: "#64748b",
          7: "#475569",
          8: "#334155",
          9: "#1e293b",
          10: "#0f172a",
          11: "#020617",
        },
      },
      fontFamily: {
        logo: ["Nunito", "sans-serif"],
        serif3: ["Oswald", "sans-serif"],
        headerSerif: ["Cherry Swash", "serif"],
        serif1: ["Karla", "sans-serif"],
        serif2: ["Roboto", "sans-serif"],
      },
      spacing: {
        1: "0.4rem",
        2: "0.8rem",
        3: "1.2rem",
        4: "1.6rem",
        5: "2.4rem",
        6: "3.2rem",
        7: "4.8rem",
        8: "6.4rem",
        9: "8rem",
        10: "9.6rem",
        11: "12.8rem",
      },
      fontSize: {
        xxs: [
          "1.2rem",
          {
            lineHeight: "0.8rem",
            letterSpacing: "0em",
            fontWeight: "400",
          },
        ],
        xs: [
          "1.4rem",
          {
            lineHeight: "0.8rem",
            letterSpacing: "0em",
            fontWeight: "400",
          },
        ],
        sm: [
          "1.6rem",
          {
            lineHeight: "1.2rem",
            letterSpacing: "0em",
            fontWeight: "400",
          },
        ],
        base: [
          "2.2rem",
          {
            lineHeight: "1.8rem",
            letterSpacing: "0em",
            fontWeight: "500",
          },
        ],
        lg: [
          "2.4rem",
          {
            lineHeight: "2.6rem",
            letterSpacing: "0em",
            fontWeight: "500",
          },
        ],
        xl: [
          "3rem",
          {
            lineHeight: "3.2rem",
            letterSpacing: "-0.01em",
            fontWeight: "500",
          },
        ],
        "2xl": [
          "3.6rem",
          {
            lineHeight: "4rem",
            letterSpacing: "-0.01em",
            fontWeight: "500",
          },
        ],
        "3xl": [
          "4.4rem",
          {
            lineHeight: "4.8rem",
            letterSpacing: "-0.015em",
            fontWeight: "600",
          },
        ],
        "4xl": [
          "5.2rem",
          {
            lineHeight: "5.6rem",
            letterSpacing: "-0.02em",
            fontWeight: "600",
          },
        ],
        "5xl": [
          "6.2rem",
          {
            lineHeight: "6.8rem",
            letterSpacing: "-0.025em",
            fontWeight: "700",
          },
        ],
        "6xl": [
          "8.6rem",
          {
            lineHeight: "9.2rem",
            letterSpacing: "-0.03em",
            fontWeight: "700",
          },
        ],
        "7xl": [
          "9.8rem",
          {
            lineHeight: "10.5rem",
            letterSpacing: "-0.035em",
            fontWeight: "700",
          },
        ],
      },
      transitionDuration: {
        fast: "150ms",
        normal: "250ms",
        slow: "400ms",
        verySlow: "600ms",
      },
      fontWeight: {
        lighter: "300",
        light: "400",
        normal: "600",
        bold: "800",
        bolder: "900",
      },
    },
  },
  plugins: [],
};
