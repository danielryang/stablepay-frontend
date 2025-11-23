import { useState, useEffect } from "react";
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

import { useWallet } from "@/contexts/WalletContext";
import { validateMnemonic } from "@/utils/wallet";

export default function RestoreWalletScreen() {
    const router = useRouter();
    const { restoreWallet, keypair } = useWallet();
    const [step, setStep] = useState<"mnemonic" | "password">("mnemonic");
    const [mnemonic, setMnemonic] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [isRestoring, setIsRestoring] = useState(false);

    // Navigate to home when wallet is successfully restored
    useEffect(() => {
        if (keypair && isRestoring) {
            // Wallet was successfully restored, navigate to home
            // Use a small delay to ensure state is fully updated
            const timer = setTimeout(() => {
                router.replace("/(tabs)");
            }, 200);
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

        try {
            await restoreWallet(mnemonic.trim(), password);
            // Navigation will happen automatically via useEffect when keypair is set
        } catch (error: any) {
            setIsRestoring(false);
            console.error("Restore wallet error:", error);
            Alert.alert("Error", error.message || "Failed to restore wallet");
        }
    };

    if (step === "mnemonic") {
        return (
            <View style={styles.container}>
                <ScrollView style={styles.scrollView}>
                    <View style={styles.content}>
                        <View style={styles.header}>
                            <Pressable onPress={() => router.back()} style={styles.backButton}>
                                <Text style={styles.backText}>←</Text>
                            </Pressable>
                            <Text style={styles.headerTitle}>Restore Wallet</Text>
                        </View>

                        <View style={styles.card}>
                            <Text style={styles.cardTitle}>Enter Recovery Phrase</Text>
                            <Text style={styles.cardSubtitle}>
                                Enter your 12-word recovery phrase to restore your wallet
                            </Text>

                            <View style={styles.inputGroup}>
                                <TextInput
                                    value={mnemonic}
                                    onChangeText={setMnemonic}
                                    placeholder="word1 word2 word3 ... word12"
                                    multiline
                                    numberOfLines={4}
                                    style={styles.mnemonicInput}
                                    placeholderTextColor="#737A82"
                                    autoCapitalize="none"
                                    textAlignVertical="top"
                                />
                            </View>

                            <Pressable style={styles.button} onPress={handleMnemonicSubmit}>
                                <Text style={styles.buttonText}>Continue</Text>
                            </Pressable>
                        </View>
                    </View>
                </ScrollView>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {isRestoring && (
                <View style={styles.fullScreenLoader}>
                    <ActivityIndicator size="large" color="#0891D1" />
                    <Text style={styles.loaderText}>Restoring your wallet...</Text>
                    <Text style={styles.loaderSubtext}>This may take a few seconds</Text>
                </View>
            )}
            <View style={styles.content}>
                <View style={styles.header}>
                    <Pressable
                        onPress={() => setStep("mnemonic")}
                        style={styles.backButton}
                        disabled={isRestoring}
                    >
                        <Text style={styles.backText}>←</Text>
                    </Pressable>
                    <Text style={styles.headerTitle}>Set Password</Text>
                </View>

                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Set a Password</Text>
                    <Text style={styles.cardSubtitle}>
                        This password will encrypt your wallet and be required to unlock it. Make
                        sure it's strong and memorable.
                    </Text>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Password</Text>
                        <TextInput
                            value={password}
                            onChangeText={setPassword}
                            placeholder="Enter password (min 8 characters)"
                            secureTextEntry
                            style={styles.input}
                            placeholderTextColor="#737A82"
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Confirm Password</Text>
                        <TextInput
                            value={confirmPassword}
                            onChangeText={setConfirmPassword}
                            placeholder="Confirm password"
                            secureTextEntry
                            style={styles.input}
                            placeholderTextColor="#737A82"
                        />
                    </View>

                    <Pressable
                        style={[styles.button, isRestoring && styles.buttonDisabled]}
                        onPress={handleRestoreWallet}
                        disabled={isRestoring}
                    >
                        {isRestoring ? (
                            <View style={styles.loadingContainer}>
                                <ActivityIndicator size="small" color="#FFFFFF" />
                                <Text style={styles.buttonText}>Restoring Wallet...</Text>
                            </View>
                        ) : (
                            <Text style={styles.buttonText}>Restore Wallet</Text>
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
        backgroundColor: "#FAFAFA",
    },
    scrollView: {
        flex: 1,
    },
    content: {
        padding: 16,
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 24,
    },
    backButton: {
        marginRight: 12,
    },
    backText: {
        fontSize: 24,
        color: "#29343D",
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: "bold",
        color: "#29343D",
    },
    card: {
        padding: 24,
        backgroundColor: "#FFFFFF",
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#E1E4E8",
        gap: 16,
    },
    cardTitle: {
        fontSize: 20,
        fontWeight: "bold",
        color: "#29343D",
    },
    cardSubtitle: {
        fontSize: 14,
        color: "#737A82",
        marginBottom: 8,
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
    mnemonicInput: {
        backgroundColor: "#E1E4E8",
        borderWidth: 1,
        borderColor: "#E1E4E8",
        borderRadius: 8,
        padding: 12,
        fontSize: 14,
        color: "#29343D",
        minHeight: 120,
    },
    button: {
        backgroundColor: "#0891D1",
        borderRadius: 8,
        padding: 16,
        alignItems: "center",
        marginTop: 8,
    },
    buttonDisabled: {
        opacity: 0.5,
    },
    buttonText: {
        color: "#FFFFFF",
        fontSize: 16,
        fontWeight: "600",
    },
    loadingContainer: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    fullScreenLoader: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(255, 255, 255, 0.95)",
        zIndex: 1000,
        justifyContent: "center",
        alignItems: "center",
        gap: 16,
    },
    loaderText: {
        fontSize: 18,
        fontWeight: "600",
        color: "#29343D",
    },
    loaderSubtext: {
        fontSize: 14,
        color: "#737A82",
    },
});
