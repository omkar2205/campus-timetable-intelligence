import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}", "./components/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        navy: "#0F172A",
        slateBrand: "#1E293B",
        soft: "#F8FAFC",
        tealBrand: "#14B8A6"
      },
      boxShadow: {
        executive: "0 24px 80px rgba(15, 23, 42, 0.12)",
        card: "0 8px 30px rgba(15, 23, 42, 0.08)"
      },
      borderRadius: {
        xl2: "1.25rem"
      }
    },
  },
  plugins: [],
};
export default config;
