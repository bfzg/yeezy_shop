import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        ink: "#111111",
        mute: "#777777",
        paper: "#ffffff",
        hairline: "#dedede"
      },
      fontFamily: {
        mono: ['"Courier New"', "Courier", "monospace"]
      }
    }
  },
  plugins: []
};

export default config;
