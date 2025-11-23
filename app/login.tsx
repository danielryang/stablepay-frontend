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

import { useWallet } from "@/contexts/WalletContext";

export default function LoginScreen() {
    const router = useRouter();
    const { login, isInitialized, isLoading, hasWallet, keypair, switchAccount } = useWallet();
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
            <View style={styles.container}>
                <ActivityIndicator size="large" color="#0891D1" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.content}>
                <View style={styles.logoContainer}>
                    <View style={styles.logo}>
                        <Text style={styles.logoIcon}>💲</Text>
                    </View>
                    <Text style={styles.title}>StablePay</Text>
                    <Text style={styles.subtitle}>Unlock your wallet</Text>
                </View>

                <View style={styles.card}>
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Password</Text>
                        <TextInput
                            value={password}
                            onChangeText={setPassword}
                            placeholder="Enter your wallet password"
                            secureTextEntry
                            style={styles.input}
                            placeholderTextColor="#737A82"
                            onSubmitEditing={handleLogin}
                            autoFocus
                        />
                    </View>
                    <Pressable
                        onPress={handleLogin}
                        style={[styles.loginButton, isLoggingIn && styles.loginButtonDisabled]}
                        disabled={isLoggingIn}
                    >
                        {isLoggingIn ? (
                            <ActivityIndicator color="#FFFFFF" />
                        ) : (
                            <Text style={styles.loginButtonText}>Unlock Wallet</Text>
                        )}
                    </Pressable>

                    <Pressable onPress={handleSwitchAccount} style={styles.switchAccountButton}>
                        <Text style={styles.switchAccountText}>Switch Account</Text>
                    </Pressable>
                </View>

                <View style={styles.footer}>
                    <Text style={styles.footerText}>
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
        backgroundColor: "#FAFAFA",
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
        backgroundColor: "#0891D1",
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
        color: "#29343D",
    },
    subtitle: {
        fontSize: 14,
        color: "#737A82",
    },
    card: {
        padding: 24,
        backgroundColor: "#FFFFFF",
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#E1E4E8",
        gap: 16,
    },
    inputGroup: {
        gap: 8,
    },
    label: {
        fontSize: 14,
        fontWeight: "500",
        color: "#29343D",
    },
    input: {
        backgroundColor: "#E1E4E8",
        borderWidth: 1,
        borderColor: "#E1E4E8",
        borderRadius: 8,
        padding: 12,
        fontSize: 14,
        color: "#29343D",
    },
    loginButton: {
        backgroundColor: "#0891D1",
        borderRadius: 8,
        padding: 12,
        alignItems: "center",
        minHeight: 48,
        justifyContent: "center",
    },
    loginButtonDisabled: {
        opacity: 0.5,
    },
    loginButtonText: {
        color: "#FFFFFF",
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
        color: "#737A82",
        fontSize: 14,
        fontWeight: "500",
    },
    footer: {
        alignItems: "center",
    },
    footerText: {
        fontSize: 14,
        color: "#737A82",
    },
    signUpLink: {
        color: "#0891D1",
    },
});
