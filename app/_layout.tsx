import { useEffect } from "react";
import "react-native-reanimated";

import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { View } from "react-native";

import FontAwesome from "@expo/vector-icons/FontAwesome";

import { DarkTheme, DefaultTheme, ThemeProvider } from "@react-navigation/native";

import { useColorScheme } from "@/components/useColorScheme";
import { TransactionProvider } from "@/contexts/TransactionContext";

import "../global.css";

export {
    // Catch any errors thrown by the Layout component.
    ErrorBoundary
} from "expo-router";

export const unstable_settings = {
    // Ensure that reloading on `/modal` keeps a back button present.
    initialRouteName: "login",
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
    const [loaded, error] = useFonts({
        ...FontAwesome.font,
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
    const colorScheme = useColorScheme();

    return (
        <TransactionProvider>
            <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
                <View style={{ flex: 1, paddingTop: 30, backgroundColor: '#FFFFFF' }}>
                    <Stack>
                        <Stack.Screen name="login" options={{ headerShown: false }} />
                        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                        <Stack.Screen name="send" options={{ headerShown: false }} />
                        <Stack.Screen name="receive" options={{ headerShown: false }} />
                        <Stack.Screen name="activity" options={{ headerShown: false }} />
                        <Stack.Screen name="settings" options={{ headerShown: false }} />
                        <Stack.Screen name="modal" options={{ presentation: "modal" }} />
                    </Stack>
                </View>
            </ThemeProvider>
        </TransactionProvider>
    );
}
