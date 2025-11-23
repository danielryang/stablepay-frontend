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

import * as Clipboard from "expo-clipboard";
import { useRouter } from "expo-router";

import Colors from "@/constants/Colors";
import { useColorScheme } from "@/components/useColorScheme";
import { useWallet } from "@/contexts/WalletContext";

export default function CreateWalletScreen() {
    const router = useRouter();
    const { generateMnemonic, createWallet } = useWallet();
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme];
    const [step, setStep] = useState<"mnemonic" | "warning" | "confirm" | "password">("mnemonic");
    const [mnemonic, setMnemonic] = useState<string[]>([]);
    const [confirmedWords, setConfirmedWords] = useState<string[]>([]);
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [isCreating, setIsCreating] = useState(false);

    // Generate mnemonic on mount
    useEffect(() => {
        if (step === "mnemonic" && mnemonic.length === 0) {
            const newMnemonic = generateMnemonic();
            setMnemonic(newMnemonic.split(" "));
        }
    }, [step, mnemonic.length, generateMnemonic]);

    const handleCopyMnemonic = async () => {
        if (mnemonic.length > 0) {
            try {
                await Clipboard.setStringAsync(mnemonic.join(" "));
                Alert.alert("Copied", "Recovery phrase copied to clipboard");
            } catch (error) {
                Alert.alert("Error", "Failed to copy recovery phrase");
            }
        }
    };

    const handleContinueFromMnemonic = () => {
        setStep("warning");
    };

    const handleContinueFromWarning = () => {
        setStep("confirm");
        setConfirmedWords(Array(mnemonic.length).fill(""));
    };

    const handleWordChange = (index: number, word: string) => {
        const newConfirmed = [...confirmedWords];
        newConfirmed[index] = word.toLowerCase().trim();
        setConfirmedWords(newConfirmed);
    };

    const handleVerifyMnemonic = () => {
        const isCorrect = mnemonic.every((word, index) => word === confirmedWords[index]);
        if (isCorrect) {
            setStep("password");
        } else {
            Alert.alert("Error", "Recovery phrase words do not match. Please try again.");
        }
    };

    const handleCreateWallet = async () => {
        if (password.length < 8) {
            Alert.alert("Error", "Password must be at least 8 characters");
            return;
        }
        if (password !== confirmPassword) {
            Alert.alert("Error", "Passwords do not match");
            return;
        }

        // Set loading state immediately - this triggers a re-render
        setIsCreating(true);

        // Yield to React to allow it to render the loading state before heavy computation
        // Use a small delay to ensure React processes the state update and renders first
        setTimeout(async () => {
            try {
                await createWallet(mnemonic.join(" "), password);
                // Navigate immediately without showing alert to speed up flow
                router.replace("/(tabs)");
            } catch (error: any) {
                setIsCreating(false);
                Alert.alert("Error", error.message || "Failed to create wallet");
            }
        }, 50); // Small delay to ensure UI renders loading state
    };

    // Step 1: Show mnemonic
    if (step === "mnemonic") {
        return (
            <View style={[styles.container, { backgroundColor: colors.backgroundSecondary }]}>
                <ScrollView style={styles.scrollView}>
                    <View style={styles.content}>
                        <View
                            style={[
                                styles.header,
                                {
                                    backgroundColor: colors.background,
                                    borderBottomColor: colors.border,
                                },
                            ]}
                        >
                            <Pressable onPress={() => router.back()} style={styles.backButton}>
                                <Text style={[styles.backText, { color: colors.text }]}>←</Text>
                            </Pressable>
                            <Text style={[styles.headerTitle, { color: colors.text }]}>
                                Your Recovery Phrase
                            </Text>
                        </View>

                        <View
                            style={[
                                styles.card,
                                {
                                    backgroundColor: colors.cardBackground,
                                    borderColor: colors.border,
                                },
                            ]}
                        >
                            <Text style={[styles.cardTitle, { color: colors.text }]}>
                                Write Down Your Recovery Phrase
                            </Text>
                            <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>
                                This is the only way to recover your wallet. Store it somewhere safe
                                and never share it with anyone.
                            </Text>

                            <View style={styles.mnemonicGrid}>
                                {mnemonic.map((word, index) => (
                                    <View
                                        key={index}
                                        style={[
                                            styles.mnemonicWord,
                                            { backgroundColor: colors.backgroundTertiary },
                                        ]}
                                    >
                                        <Text
                                            style={[
                                                styles.mnemonicIndex,
                                                { color: colors.textSecondary },
                                            ]}
                                        >
                                            {index + 1}
                                        </Text>
                                        <Text style={[styles.mnemonicText, { color: colors.text }]}>
                                            {word}
                                        </Text>
                                    </View>
                                ))}
                            </View>

                            <Pressable
                                style={[
                                    styles.copyButton,
                                    {
                                        backgroundColor: colors.buttonSecondary,
                                        borderColor: colors.border,
                                    },
                                ]}
                                onPress={handleCopyMnemonic}
                            >
                                <Text
                                    style={[
                                        styles.copyButtonText,
                                        { color: colors.buttonSecondaryText },
                                    ]}
                                >
                                    📋 Copy to Clipboard
                                </Text>
                            </Pressable>

                            <Pressable
                                style={[styles.button, { backgroundColor: colors.buttonPrimary }]}
                                onPress={handleContinueFromMnemonic}
                            >
                                <Text
                                    style={[styles.buttonText, { color: colors.buttonPrimaryText }]}
                                >
                                    I've Written It Down
                                </Text>
                            </Pressable>
                        </View>
                    </View>
                </ScrollView>
            </View>
        );
    }

    // Step 2: Warning
    if (step === "warning") {
        return (
            <View style={[styles.container, { backgroundColor: colors.backgroundSecondary }]}>
                <ScrollView style={styles.scrollView}>
                    <View style={styles.content}>
                        <View
                            style={[
                                styles.header,
                                {
                                    backgroundColor: colors.background,
                                    borderBottomColor: colors.border,
                                },
                            ]}
                        >
                            <Pressable
                                onPress={() => setStep("mnemonic")}
                                style={styles.backButton}
                            >
                                <Text style={[styles.backText, { color: colors.text }]}>←</Text>
                            </Pressable>
                            <Text style={[styles.headerTitle, { color: colors.text }]}>
                                Important Warning
                            </Text>
                        </View>

                        <View
                            style={[
                                styles.card,
                                {
                                    backgroundColor: colors.cardBackground,
                                    borderColor: colors.border,
                                },
                            ]}
                        >
                            <View
                                style={[
                                    styles.warningBox,
                                    {
                                        backgroundColor: colors.warningLight,
                                        borderColor: colors.warning,
                                    },
                                ]}
                            >
                                <Text style={styles.warningIcon}>⚠️</Text>
                                <Text style={[styles.warningTitle, { color: colors.warning }]}>
                                    This is Your Only Way to Recover Your Wallet
                                </Text>
                                <Text style={[styles.warningText, { color: colors.text }]}>
                                    If you lose your recovery phrase, you will permanently lose
                                    access to your wallet and all funds.
                                </Text>
                                <Text style={[styles.warningText, { color: colors.text }]}>
                                    • Store it in a secure location{"\n"}• Never share it with
                                    anyone{"\n"}• Never store it digitally (screenshots, cloud
                                    storage, etc.){"\n"}• Write it down on paper and keep it safe
                                </Text>
                            </View>

                            <Pressable
                                style={[styles.button, { backgroundColor: colors.buttonPrimary }]}
                                onPress={handleContinueFromWarning}
                            >
                                <Text
                                    style={[styles.buttonText, { color: colors.buttonPrimaryText }]}
                                >
                                    I Understand, Continue
                                </Text>
                            </Pressable>
                        </View>
                    </View>
                </ScrollView>
            </View>
        );
    }

    // Step 3: Confirm mnemonic
    if (step === "confirm") {
        return (
            <View style={[styles.container, { backgroundColor: colors.backgroundSecondary }]}>
                <ScrollView style={styles.scrollView}>
                    <View style={styles.content}>
                        <View
                            style={[
                                styles.header,
                                {
                                    backgroundColor: colors.background,
                                    borderBottomColor: colors.border,
                                },
                            ]}
                        >
                            <Pressable onPress={() => setStep("warning")} style={styles.backButton}>
                                <Text style={[styles.backText, { color: colors.text }]}>←</Text>
                            </Pressable>
                            <Text style={[styles.headerTitle, { color: colors.text }]}>
                                Confirm Recovery Phrase
                            </Text>
                        </View>

                        <View
                            style={[
                                styles.card,
                                {
                                    backgroundColor: colors.cardBackground,
                                    borderColor: colors.border,
                                },
                            ]}
                        >
                            <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>
                                Enter your recovery phrase to confirm you've saved it correctly
                            </Text>

                            <View style={styles.confirmGrid}>
                                {mnemonic.map((_, index) => (
                                    <View
                                        key={index}
                                        style={[
                                            styles.confirmWord,
                                            { backgroundColor: colors.backgroundTertiary },
                                        ]}
                                    >
                                        <Text
                                            style={[
                                                styles.confirmIndex,
                                                { color: colors.textSecondary },
                                            ]}
                                        >
                                            {index + 1}
                                        </Text>
                                        <TextInput
                                            value={confirmedWords[index] || ""}
                                            onChangeText={text => handleWordChange(index, text)}
                                            placeholder={`Word ${index + 1}`}
                                            style={[styles.confirmInput, { color: colors.text }]}
                                            placeholderTextColor={colors.inputPlaceholder}
                                            autoCapitalize="none"
                                        />
                                    </View>
                                ))}
                            </View>

                            <Pressable
                                style={[styles.button, { backgroundColor: colors.buttonPrimary }]}
                                onPress={handleVerifyMnemonic}
                            >
                                <Text
                                    style={[styles.buttonText, { color: colors.buttonPrimaryText }]}
                                >
                                    Verify
                                </Text>
                            </Pressable>
                        </View>
                    </View>
                </ScrollView>
            </View>
        );
    }

    // Step 4: Set password
    return (
        <View style={[styles.container, { backgroundColor: colors.backgroundSecondary }]}>
            {isCreating && (
                <View
                    style={[
                        styles.fullScreenLoader,
                        {
                            backgroundColor:
                                colorScheme === "dark"
                                    ? "rgba(15, 23, 42, 0.95)"
                                    : "rgba(255, 255, 255, 0.95)",
                        },
                    ]}
                >
                    <ActivityIndicator size="large" color={colors.primary} />
                    <Text style={[styles.loaderText, { color: colors.text }]}>
                        Creating your wallet...
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
                        { backgroundColor: colors.background, borderBottomColor: colors.border },
                    ]}
                >
                    <Pressable
                        onPress={() => setStep("confirm")}
                        style={styles.backButton}
                        disabled={isCreating}
                    >
                        <Text style={[styles.backText, { color: colors.text }]}>←</Text>
                    </Pressable>
                    <Text style={[styles.headerTitle, { color: colors.text }]}>Set Password</Text>
                </View>

                <View
                    style={[
                        styles.card,
                        { backgroundColor: colors.cardBackground, borderColor: colors.border },
                    ]}
                >
                    <Text style={[styles.cardTitle, { color: colors.text }]}>
                        Create a Password
                    </Text>
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
                                    borderColor: colors.inputBorder,
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
                                    borderColor: colors.inputBorder,
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
                            isCreating && { opacity: 0.5 },
                        ]}
                        onPress={handleCreateWallet}
                        disabled={isCreating}
                    >
                        {isCreating ? (
                            <View style={styles.loadingContainer}>
                                <ActivityIndicator size="small" color={colors.buttonPrimaryText} />
                                <Text
                                    style={[styles.buttonText, { color: colors.buttonPrimaryText }]}
                                >
                                    Creating Wallet...
                                </Text>
                            </View>
                        ) : (
                            <Text style={[styles.buttonText, { color: colors.buttonPrimaryText }]}>
                                Create Wallet
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
        padding: 16,
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 24,
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 12,
        borderBottomWidth: 1,
    },
    backButton: {
        marginRight: 12,
    },
    backText: {
        fontSize: 24,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: "bold",
    },
    card: {
        padding: 24,
        borderRadius: 12,
        borderWidth: 1,
        gap: 16,
    },
    cardTitle: {
        fontSize: 20,
        fontWeight: "bold",
    },
    cardSubtitle: {
        fontSize: 14,
        marginBottom: 8,
        lineHeight: 20,
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
    button: {
        borderRadius: 8,
        padding: 16,
        alignItems: "center",
        marginTop: 8,
    },
    buttonText: {
        fontSize: 16,
        fontWeight: "600",
    },
    copyButton: {
        borderRadius: 8,
        padding: 12,
        alignItems: "center",
        borderWidth: 1,
    },
    copyButtonText: {
        fontSize: 14,
        fontWeight: "500",
    },
    warningBox: {
        borderRadius: 12,
        padding: 20,
        borderWidth: 2,
        gap: 12,
    },
    warningIcon: {
        fontSize: 32,
        textAlign: "center",
    },
    warningTitle: {
        fontSize: 18,
        fontWeight: "bold",
        textAlign: "center",
    },
    warningText: {
        fontSize: 14,
        lineHeight: 20,
    },
    mnemonicGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 8,
        marginBottom: 16,
    },
    mnemonicWord: {
        flexDirection: "row",
        alignItems: "center",
        borderRadius: 8,
        padding: 12,
        minWidth: "30%",
        gap: 8,
    },
    mnemonicIndex: {
        fontSize: 12,
        fontWeight: "600",
    },
    mnemonicText: {
        fontSize: 14,
        fontWeight: "600",
    },
    confirmGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 8,
        marginBottom: 16,
    },
    confirmWord: {
        flexDirection: "row",
        alignItems: "center",
        borderRadius: 8,
        padding: 8,
        minWidth: "30%",
        gap: 8,
    },
    confirmIndex: {
        fontSize: 12,
        fontWeight: "600",
    },
    confirmInput: {
        flex: 1,
        fontSize: 14,
        padding: 4,
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
        zIndex: 1000,
        justifyContent: "center",
        alignItems: "center",
        gap: 16,
    },
    loaderText: {
        fontSize: 18,
        fontWeight: "600",
    },
    loaderSubtext: {
        fontSize: 14,
    },
});
