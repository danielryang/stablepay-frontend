import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Image,
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
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={styles.content}>
                <View style={styles.logoContainer}>
                    <Image
                        source={require("@/assets/images/logo.png")}
                        style={styles.logoImage}
                        resizeMode="contain"
                    />
                    <Text style={[styles.title, { color: colors.text }]}>StablePay</Text>
                    <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                        Unlock your wallet
                    </Text>
                </View>

                <View
                    style={[
                        styles.card,
                        { backgroundColor: colors.cardBackground },
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
        padding: 24,
    },
    content: {
        width: "100%",
        maxWidth: 400,
        gap: 40,
    },
    logoContainer: {
        alignItems: "center",
        gap: 16,
    },
    logo: {
        width: 80,
        height: 80,
        alignItems: "center",
        justifyContent: "center",
    },
    logoImage: {
        width: 100,
        height: 100,
    },
    title: {
        fontSize: 32,
        fontWeight: "bold",
        letterSpacing: -0.5,
    },
    subtitle: {
        fontSize: 16,
        fontWeight: "400",
    },
    card: {
        padding: 28,
        borderRadius: 20,
        gap: 20,
    },
    inputGroup: {
        gap: 10,
    },
    label: {
        fontSize: 15,
        fontWeight: "600",
    },
    input: {
        borderRadius: 14,
        padding: 16,
        fontSize: 16,
    },
    loginButton: {
        borderRadius: 16,
        paddingVertical: 16,
        paddingHorizontal: 24,
        alignItems: "center",
        minHeight: 56,
        justifyContent: "center",
        marginTop: 8,
    },
    loginButtonText: {
        fontSize: 17,
        fontWeight: "600",
        letterSpacing: 0.2,
    },
    switchAccountButton: {
        marginTop: 8,
        padding: 14,
        alignItems: "center",
        justifyContent: "center",
    },
    switchAccountText: {
        fontSize: 15,
        fontWeight: "500",
    },
    footer: {
        alignItems: "center",
    },
    footerText: {
        fontSize: 13,
        textAlign: "center",
        fontWeight: "400",
    },
    signUpLink: {
        // Color handled inline with theme
    },
});
