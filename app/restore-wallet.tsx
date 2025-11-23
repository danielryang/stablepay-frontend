import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";

import { useRouter } from "expo-router";

import Colors from "@/constants/Colors";
import { useColorScheme } from "@/components/useColorScheme";
import { useWallet } from "@/contexts/WalletContext";
import { validateMnemonic } from "@/utils/wallet";

export default function RestoreWalletScreen() {
    const router = useRouter();
    const { restoreWallet, keypair } = useWallet();
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme];
    const [step, setStep] = useState<"mnemonic" | "password">("mnemonic");
    const [mnemonic, setMnemonic] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [isRestoring, setIsRestoring] = useState(false);

    // Navigate to home when wallet is successfully restored
    useEffect(() => {
        if (keypair && isRestoring) {
            // Wallet was successfully restored, navigate to home
            // Use a delay to show loading screen before navigation
            const timer = setTimeout(() => {
                setIsRestoring(false);
                router.replace("/(tabs)");
            }, 1500); // Show loading screen for 1.5 seconds
            return () => clearTimeout(timer);
        }
    }, [keypair, isRestoring, router]);

    const handleMnemonicSubmit = () => {
        const trimmedMnemonic = mnemonic.trim();
        const words = trimmedMnemonic.split(/\s+/);

        if (words.length !== 12) {
            Alert.alert("Error", "Please enter a valid 12-word recovery phrase");
            return;
        }

        // Validate mnemonic using BIP39 validation
        if (!validateMnemonic(trimmedMnemonic)) {
            Alert.alert("Error", "Invalid recovery phrase. Please check your words and try again.");
            return;
        }

        setStep("password");
    };

    const handleRestoreWallet = async () => {
        if (password.length < 8) {
            Alert.alert("Error", "Password must be at least 8 characters");
            return;
        }
        if (password !== confirmPassword) {
            Alert.alert("Error", "Passwords do not match");
            return;
        }

        // Set loading state immediately - this triggers a re-render
        setIsRestoring(true);

        // Yield to React to allow it to render the loading state before heavy computation
        // Use a small delay to ensure React processes the state update and renders first
        setTimeout(async () => {
            try {
                await restoreWallet(mnemonic.trim(), password);
                // Navigation will happen automatically via useEffect when keypair is set
            } catch (error: any) {
                setIsRestoring(false);
                console.error("Restore wallet error:", error);
                Alert.alert("Error", error.message || "Failed to restore wallet");
            }
        }, 50); // Small delay to ensure UI renders loading state
    };

    if (step === "mnemonic") {
        return (
            <View style={[styles.container, { backgroundColor: colors.background }]}>
                <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                    <View style={styles.content}>
                        <View
                            style={[
                                styles.header,
                                {
                                    backgroundColor: colors.background,
                                },
                            ]}
                        >
                            <Pressable onPress={() => router.back()} style={styles.backButton}>
                                <Text style={[styles.backText, { color: colors.text }]}>←</Text>
                            </Pressable>
                            <Text style={[styles.headerTitle, { color: colors.text }]}>
                                Restore Wallet
                            </Text>
                        </View>

                        <View
                            style={[
                                styles.card,
                                {
                                    backgroundColor: colors.cardBackground,
                                },
                            ]}
                        >
                            <Text style={[styles.cardTitle, { color: colors.text }]}>
                                Enter Recovery Phrase
                            </Text>
                            <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>
                                Enter your 12-word recovery phrase to restore your wallet
                            </Text>

                            <View style={styles.inputGroup}>
                                <TextInput
                                    value={mnemonic}
                                    onChangeText={setMnemonic}
                                    placeholder="word1 word2 word3 ... word12"
                                    multiline
                                    numberOfLines={4}
                                    style={[
                                        styles.mnemonicInput,
                                        {
                                            backgroundColor: colors.inputBackground,
                                            color: colors.inputText,
                                        },
                                    ]}
                                    placeholderTextColor={colors.inputPlaceholder}
                                    autoCapitalize="none"
                                    textAlignVertical="top"
                                />
                            </View>

                            <Pressable
                                style={[styles.button, { backgroundColor: colors.buttonPrimary }]}
                                onPress={handleMnemonicSubmit}
                            >
                                <Text
                                    style={[styles.buttonText, { color: colors.buttonPrimaryText }]}
                                >
                                    Continue
                                </Text>
                            </Pressable>
                        </View>
                    </View>
                </ScrollView>
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            {isRestoring && (
                <View
                    style={[
                        styles.fullScreenLoader,
                        {
                            backgroundColor:
                                colorScheme === "dark"
                                    ? "rgba(18, 18, 18, 0.95)"
                                    : "rgba(255, 255, 255, 0.95)",
                        },
                    ]}
                >
                    <ActivityIndicator size="large" color={colors.primary} />
                    <Text style={[styles.loaderText, { color: colors.text }]}>
                        Restoring your wallet...
                    </Text>
                    <Text style={[styles.loaderSubtext, { color: colors.textSecondary }]}>
                        This may take a few seconds
                    </Text>
                </View>
            )}
            <View style={styles.content}>
                <View
                    style={[
                        styles.header,
                        { backgroundColor: colors.background },
                    ]}
                >
                    <Pressable
                        onPress={() => setStep("mnemonic")}
                        style={styles.backButton}
                        disabled={isRestoring}
                    >
                        <Text style={[styles.backText, { color: colors.text }]}>←</Text>
                    </Pressable>
                    <Text style={[styles.headerTitle, { color: colors.text }]}>Set Password</Text>
                </View>

                <View
                    style={[
                        styles.card,
                        { backgroundColor: colors.cardBackground },
                    ]}
                >
                    <Text style={[styles.cardTitle, { color: colors.text }]}>Set a Password</Text>
                    <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>
                        This password will encrypt your wallet and be required to unlock it. Make
                        sure it's strong and memorable.
                    </Text>

                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, { color: colors.text }]}>Password</Text>
                        <TextInput
                            value={password}
                            onChangeText={setPassword}
                            placeholder="Enter password (min 8 characters)"
                            secureTextEntry
                            style={[
                                styles.input,
                                {
                                    backgroundColor: colors.inputBackground,
                                    color: colors.inputText,
                                },
                            ]}
                            placeholderTextColor={colors.inputPlaceholder}
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, { color: colors.text }]}>Confirm Password</Text>
                        <TextInput
                            value={confirmPassword}
                            onChangeText={setConfirmPassword}
                            placeholder="Confirm password"
                            secureTextEntry
                            style={[
                                styles.input,
                                {
                                    backgroundColor: colors.inputBackground,
                                    color: colors.inputText,
                                },
                            ]}
                            placeholderTextColor={colors.inputPlaceholder}
                        />
                    </View>

                    <Pressable
                        style={[
                            styles.button,
                            { backgroundColor: colors.buttonPrimary },
                            isRestoring && { opacity: 0.5 },
                        ]}
                        onPress={handleRestoreWallet}
                        disabled={isRestoring}
                    >
                        {isRestoring ? (
                            <View style={styles.loadingContainer}>
                                <ActivityIndicator size="small" color={colors.buttonPrimaryText} />
                                <Text
                                    style={[styles.buttonText, { color: colors.buttonPrimaryText }]}
                                >
                                    Restoring Wallet...
                                </Text>
                            </View>
                        ) : (
                            <Text style={[styles.buttonText, { color: colors.buttonPrimaryText }]}>
                                Restore Wallet
                            </Text>
                        )}
                    </Pressable>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollView: {
        flex: 1,
    },
    content: {
        padding: 20,
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 16,
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 16,
    },
    backButton: {
        marginRight: 14,
    },
    backText: {
        fontSize: 26,
    },
    headerTitle: {
        fontSize: 26,
        fontWeight: "bold",
        letterSpacing: -0.3,
    },
    card: {
        padding: 28,
        borderRadius: 20,
        gap: 20,
    },
    cardTitle: {
        fontSize: 22,
        fontWeight: "bold",
        letterSpacing: -0.3,
    },
    cardSubtitle: {
        fontSize: 15,
        marginBottom: 12,
        lineHeight: 22,
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
    mnemonicInput: {
        borderRadius: 14,
        padding: 16,
        fontSize: 16,
        minHeight: 140,
    },
    button: {
        borderRadius: 16,
        paddingVertical: 16,
        paddingHorizontal: 24,
        alignItems: "center",
        marginTop: 12,
    },
    buttonText: {
        fontSize: 17,
        fontWeight: "600",
        letterSpacing: 0.2,
    },
    loadingContainer: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
    },
    fullScreenLoader: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 1000,
        justifyContent: "center",
        alignItems: "center",
        gap: 18,
    },
    loaderText: {
        fontSize: 20,
        fontWeight: "600",
    },
    loaderSubtext: {
        fontSize: 15,
    },
});
