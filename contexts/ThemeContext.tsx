/**
 * Theme Context
 * Manages app theme (light/dark) with AsyncStorage persistence
 */
import AsyncStorage from "@react-native-async-storage/async-storage";

import React, { ReactNode, createContext, useContext, useEffect, useState } from "react";

export type ThemeMode = "light" | "dark";

interface ThemeContextType {
    theme: ThemeMode;
    setTheme: (theme: ThemeMode) => Promise<void>;
    isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const STORAGE_KEY = "@app_theme";

export function ThemeProvider({ children }: { children: ReactNode }) {
    const [theme, setThemeState] = useState<ThemeMode>("light");
    const [loaded, setLoaded] = useState(false);

    // Load theme from AsyncStorage on mount
    useEffect(() => {
        loadTheme();
    }, []);

    const loadTheme = async () => {
        try {
            const stored = await AsyncStorage.getItem(STORAGE_KEY);
            if (stored && (stored === "light" || stored === "dark")) {
                setThemeState(stored as ThemeMode);
            }
        } catch (error) {
            console.warn("Failed to load theme:", error);
        } finally {
            setLoaded(true);
        }
    };

    const setTheme = async (newTheme: ThemeMode) => {
        setThemeState(newTheme);
        try {
            await AsyncStorage.setItem(STORAGE_KEY, newTheme);
        } catch (error) {
            console.warn("Failed to save theme:", error);
        }
    };

    // Don't render children until theme is loaded to prevent flash of wrong theme
    if (!loaded) {
        return null;
    }

    return (
        <ThemeContext.Provider value={{ theme, setTheme, isDark: theme === "dark" }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error("useTheme must be used within a ThemeProvider");
    }
    return context;
}
