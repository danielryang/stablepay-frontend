import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";

import { useRouter } from "expo-router";

import Colors from "@/constants/Colors";
import { useColorScheme } from "@/components/useColorScheme";
import { useWallet } from "@/contexts/WalletContext";

export default function LoginScreen() {
    const router = useRouter();
    const { login, isInitialized, isLoading, hasWallet, keypair, switchAccount } = useWallet();
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme];
    const [password, setPassword] = useState("");
    const [isLoggingIn, setIsLoggingIn] = useState(false);

    useEffect(() => {
        if (isInitialized && !isLoading) {
            // If wallet is already loaded (unlocked), redirect to tabs
            if (keypair) {
                router.replace("/(tabs)");
                return;
            }
            // If no wallet exists, redirect to onboarding
            if (!hasWallet) {
                router.replace("/onboarding");
                return;
            }
            // If wallet exists but not unlocked, stay on login screen
            // User needs to enter password to unlock
        }
    }, [isInitialized, isLoading, hasWallet, keypair, router]);

    const handleLogin = async () => {
        if (!password) {
            Alert.alert("Error", "Please enter your password");
            return;
        }

        try {
            setIsLoggingIn(true);
            await login(password);
            router.replace("/(tabs)");
        } catch (error: any) {
            Alert.alert("Error", error.message || "Invalid password. Please try again.");
        } finally {
            setIsLoggingIn(false);
        }
    };

    const handleSwitchAccount = () => {
        Alert.alert(
            "Switch Account",
            "This will delete the current wallet from this device. You can create a new wallet or restore an existing one.",
            [
                {
                    text: "Cancel",
                    style: "cancel",
                },
                {
                    text: "Switch Account",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            await switchAccount();
                            router.replace("/onboarding");
                        } catch (error: any) {
                            Alert.alert("Error", error.message || "Failed to switch account");
                        }
                    },
                },
            ]
        );
    };

    if (isLoading || !isInitialized) {
        return (
            <View style={[styles.container, { backgroundColor: colors.backgroundSecondary }]}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: colors.backgroundSecondary }]}>
            <View style={styles.content}>
                <View style={styles.logoContainer}>
                    <View style={[styles.logo, { backgroundColor: colors.primary }]}>
                        <Text style={styles.logoIcon}>💲</Text>
                    </View>
                    <Text style={[styles.title, { color: colors.text }]}>StablePay</Text>
                    <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                        Unlock your wallet
                    </Text>
                </View>

                <View
                    style={[
                        styles.card,
                        { backgroundColor: colors.cardBackground, borderColor: colors.border },
                    ]}
                >
                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, { color: colors.text }]}>Password</Text>
                        <TextInput
                            value={password}
                            onChangeText={setPassword}
                            placeholder="Enter your wallet password"
                            secureTextEntry
                            style={[
                                styles.input,
                                {
                                    backgroundColor: colors.inputBackground,
                                    borderColor: colors.inputBorder,
                                    color: colors.inputText,
                                },
                            ]}
                            placeholderTextColor={colors.inputPlaceholder}
                            onSubmitEditing={handleLogin}
                            autoFocus
                        />
                    </View>
                    <Pressable
                        onPress={handleLogin}
                        style={[
                            styles.loginButton,
                            { backgroundColor: colors.buttonPrimary },
                            isLoggingIn && { opacity: 0.5 },
                        ]}
                        disabled={isLoggingIn}
                    >
                        {isLoggingIn ? (
                            <ActivityIndicator color={colors.buttonPrimaryText} />
                        ) : (
                            <Text
                                style={[
                                    styles.loginButtonText,
                                    { color: colors.buttonPrimaryText },
                                ]}
                            >
                                Unlock Wallet
                            </Text>
                        )}
                    </Pressable>

                    <Pressable onPress={handleSwitchAccount} style={styles.switchAccountButton}>
                        <Text style={[styles.switchAccountText, { color: colors.textSecondary }]}>
                            Switch Account
                        </Text>
                    </Pressable>
                </View>

                <View style={styles.footer}>
                    <Text style={[styles.footerText, { color: colors.textSecondary }]}>
                        Your wallet is encrypted and stored securely on your device
                    </Text>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
    },
    content: {
        width: "100%",
        maxWidth: 400,
        gap: 32,
    },
    logoContainer: {
        alignItems: "center",
        gap: 8,
    },
    logo: {
        borderRadius: 999,
        padding: 16,
        width: 80,
        height: 80,
        alignItems: "center",
        justifyContent: "center",
    },
    logoIcon: {
        fontSize: 48,
    },
    title: {
        fontSize: 30,
        fontWeight: "bold",
    },
    subtitle: {
        fontSize: 14,
    },
    card: {
        padding: 24,
        borderRadius: 12,
        borderWidth: 1,
        gap: 16,
    },
    inputGroup: {
        gap: 8,
    },
    label: {
        fontSize: 14,
        fontWeight: "500",
    },
    input: {
        borderWidth: 1,
        borderRadius: 8,
        padding: 12,
        fontSize: 14,
    },
    loginButton: {
        borderRadius: 8,
        padding: 12,
        alignItems: "center",
        minHeight: 48,
        justifyContent: "center",
    },
    loginButtonText: {
        fontSize: 16,
        fontWeight: "500",
    },
    switchAccountButton: {
        marginTop: 12,
        padding: 12,
        alignItems: "center",
        justifyContent: "center",
    },
    switchAccountText: {
        fontSize: 14,
        fontWeight: "500",
    },
    footer: {
        alignItems: "center",
    },
    footerText: {
        fontSize: 14,
    },
    signUpLink: {
        // Color handled inline with theme
    },
});
