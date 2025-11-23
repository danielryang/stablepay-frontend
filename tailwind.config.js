/** @type {import('tailwindcss').Config} */
module.exports = {
    content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
    presets: [require("nativewind/preset")],
    darkMode: "class",
    theme: {
        extend: {
            colors: {
                border: "#E1E4E8",
                input: "#E1E4E8",
                ring: "#0891D1",
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
                destructive: {
                    DEFAULT: "#DC2626",
                    foreground: "#FFFFFF",
                },
                muted: {
                    DEFAULT: "#F4F5F6",
                    foreground: "#737A82",
                },
                accent: {
                    DEFAULT: "#06B6D4",
                    foreground: "#FFFFFF",
                },
                card: {
                    DEFAULT: "#FFFFFF",
                    foreground: "#29343D",
                },
                success: {
                    DEFAULT: "#22C55E",
                    foreground: "#FFFFFF",
                },
                warning: {
                    DEFAULT: "#F59E0B",
                    foreground: "#FFFFFF",
                },
            },
            borderRadius: {
                lg: "16px",
                md: "14px",
                sm: "12px",
            },
        },
    },
    plugins: [],
};
