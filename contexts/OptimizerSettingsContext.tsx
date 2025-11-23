/**
 * Optimizer Settings Context
 * Stores user preferences for the Smart Allocation Optimizer
 */
import AsyncStorage from "@react-native-async-storage/async-storage";

import React, { ReactNode, createContext, useContext, useEffect, useState } from "react";

export interface OptimizerSettings {
    minimumMonthlyExpenses: number;
    spendingPercentage: number; // 0.15 = 15%
    country: string;
}

const DEFAULT_SETTINGS: OptimizerSettings = {
    minimumMonthlyExpenses: 800,
    spendingPercentage: 0.15, // 15%
    country: "argentina",
};

const STORAGE_KEY = "@optimizer_settings";

interface OptimizerSettingsContextType {
    settings: OptimizerSettings;
    updateSettings: (updates: Partial<OptimizerSettings>) => Promise<void>;
    resetSettings: () => Promise<void>;
}

const OptimizerSettingsContext = createContext<OptimizerSettingsContextType | undefined>(undefined);

export function OptimizerSettingsProvider({ children }: { children: ReactNode }) {
    const [settings, setSettings] = useState<OptimizerSettings>(DEFAULT_SETTINGS);
    const [loaded, setLoaded] = useState(false);

    // Load settings from AsyncStorage on mount
    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            const stored = await AsyncStorage.getItem(STORAGE_KEY);
            if (stored) {
                const parsed = JSON.parse(stored);
                setSettings({ ...DEFAULT_SETTINGS, ...parsed });
            }
        } catch (error) {
            console.warn("Failed to load optimizer settings:", error);
        } finally {
            setLoaded(true);
        }
    };

    const updateSettings = async (updates: Partial<OptimizerSettings>) => {
        const newSettings = { ...settings, ...updates };
        setSettings(newSettings);
        try {
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newSettings));
        } catch (error) {
            console.warn("Failed to save optimizer settings:", error);
        }
    };

    const resetSettings = async () => {
        setSettings(DEFAULT_SETTINGS);
        try {
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_SETTINGS));
        } catch (error) {
            console.warn("Failed to reset optimizer settings:", error);
        }
    };

    return (
        <OptimizerSettingsContext.Provider value={{ settings, updateSettings, resetSettings }}>
            {children}
        </OptimizerSettingsContext.Provider>
    );
}

export function useOptimizerSettings() {
    const context = useContext(OptimizerSettingsContext);
    if (context === undefined) {
        throw new Error("useOptimizerSettings must be used within an OptimizerSettingsProvider");
    }
    return context;
}
