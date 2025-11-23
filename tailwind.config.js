/** @type {import('tailwindcss').Config} */
module.exports = {
    content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
    presets: [require("nativewind/preset")],
    theme: {
        extend: {
            fontFamily: {
                sans: ["Inter_400Regular", "Inter", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
            },
            colors: {
                border: "#E1E4E8",
                input: "#E1E4E8",
                background: "#FAFAFA",
                foreground: "#29343D",
                primary: {
                    DEFAULT: "#0891D1",
                    foreground: "#FFFFFF",
                },
                secondary: {
                    DEFAULT: "#EFF1F3",
                    foreground: "#29343D",
                },
                muted: {
                    DEFAULT: "#F4F5F6",
                    foreground: "#737A82",
                },
                card: {
                    DEFAULT: "#FFFFFF",
                    foreground: "#29343D",
                },
                success: "#22C55E",
            },
        },
    },
    plugins: [],
};
