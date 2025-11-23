import "../polyfills";

// IMPORTANT: Polyfills must be imported FIRST before any other imports
import { useEffect } from "react";
import { View } from "react-native";
import "react-native-reanimated";

import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";

import {
    Inter_100Thin,
    Inter_200ExtraLight,
    Inter_300Light,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_800ExtraBold,
    Inter_900Black,
} from "@expo-google-fonts/inter";
import FontAwesome from "@expo/vector-icons/FontAwesome";

import {
    DarkTheme,
    DefaultTheme,
    ThemeProvider as NavigationThemeProvider,
} from "@react-navigation/native";

import { useColorScheme } from "@/components/useColorScheme";
import Colors from "@/constants/Colors";
import { OptimizerSettingsProvider } from "@/contexts/OptimizerSettingsContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { TransactionProvider } from "@/contexts/TransactionContext";
import { WalletProvider } from "@/contexts/WalletContext";

export {
    // Catch any errors thrown by the Layout component.
    ErrorBoundary
} from "expo-router";

export const unstable_settings = {
    initialRouteName: "login",
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
    const [loaded, error] = useFonts({
        ...FontAwesome.font,
        Inter_100Thin,
        Inter_200ExtraLight,
        Inter_300Light,
        Inter_400Regular,
        Inter_500Medium,
        Inter_600SemiBold,
        Inter_700Bold,
        Inter_800ExtraBold,
        Inter_900Black,
    });

    // Expo Router uses Error Boundaries to catch errors in the navigation tree.
    useEffect(() => {
        if (error) throw error;
    }, [error]);

    useEffect(() => {
        if (loaded) {
            SplashScreen.hideAsync();
        }
    }, [loaded]);

    if (!loaded) {
        return null;
    }

    return <RootLayoutNav />;
}

function RootLayoutNav() {
    return (
        <ThemeProvider>
            <RootLayoutNavInner />
        </ThemeProvider>
    );
}

function RootLayoutNavInner() {
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? "light"];

    return (
        <WalletProvider>
            <TransactionProvider>
                <OptimizerSettingsProvider>
                    <NavigationThemeProvider
                        value={colorScheme === "dark" ? DarkTheme : DefaultTheme}
                    >
                        <View
                            style={{
                                flex: 1,
                                paddingTop: 30,
                                backgroundColor: colors.background,
                            }}
                        >
                            <Stack>
                                <Stack.Screen name="login" options={{ headerShown: false }} />
                                <Stack.Screen name="onboarding" options={{ headerShown: false }} />
                                <Stack.Screen
                                    name="create-wallet"
                                    options={{ headerShown: false }}
                                />
                                <Stack.Screen
                                    name="restore-wallet"
                                    options={{ headerShown: false }}
                                />
                                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                                <Stack.Screen name="send" options={{ headerShown: false }} />
                                <Stack.Screen name="receive" options={{ headerShown: false }} />
                                <Stack.Screen name="convert" options={{ headerShown: false }} />
                                <Stack.Screen name="settings" options={{ headerShown: false }} />
                            </Stack>
                        </View>
                    </NavigationThemeProvider>
                </OptimizerSettingsProvider>
            </TransactionProvider>
        </WalletProvider>
    );
}
