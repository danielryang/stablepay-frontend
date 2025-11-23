import { useRouter } from "expo-router";
import { useState, useEffect } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View, Alert, ActivityIndicator } from "react-native";
import { useWallet } from "@/contexts/WalletContext";
import * as Clipboard from 'expo-clipboard';

export default function CreateWalletScreen() {
    const router = useRouter();
    const { generateMnemonic, createWallet } = useWallet();
    const [step, setStep] = useState<'mnemonic' | 'warning' | 'confirm' | 'password'>('mnemonic');
    const [mnemonic, setMnemonic] = useState<string[]>([]);
    const [confirmedWords, setConfirmedWords] = useState<string[]>([]);
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [isCreating, setIsCreating] = useState(false);

    // Generate mnemonic on mount
    useEffect(() => {
        if (step === 'mnemonic' && mnemonic.length === 0) {
            const newMnemonic = generateMnemonic();
            setMnemonic(newMnemonic.split(' '));
        }
    }, [step, mnemonic.length, generateMnemonic]);

    const handleCopyMnemonic = async () => {
        if (mnemonic.length > 0) {
            try {
                await Clipboard.setStringAsync(mnemonic.join(' '));
                Alert.alert("Copied", "Recovery phrase copied to clipboard");
            } catch (error) {
                Alert.alert("Error", "Failed to copy recovery phrase");
            }
        }
    };

    const handleContinueFromMnemonic = () => {
        setStep('warning');
    };

    const handleContinueFromWarning = () => {
        setStep('confirm');
        setConfirmedWords(Array(mnemonic.length).fill(''));
    };

    const handleWordChange = (index: number, word: string) => {
        const newConfirmed = [...confirmedWords];
        newConfirmed[index] = word.toLowerCase().trim();
        setConfirmedWords(newConfirmed);
    };

    const handleVerifyMnemonic = () => {
        const isCorrect = mnemonic.every((word, index) => word === confirmedWords[index]);
        if (isCorrect) {
            setStep('password');
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
                await createWallet(mnemonic.join(' '), password);
                // Navigate immediately without showing alert to speed up flow
                router.replace("/(tabs)");
            } catch (error: any) {
                setIsCreating(false);
                Alert.alert("Error", error.message || "Failed to create wallet");
            }
        }, 50); // Small delay to ensure UI renders loading state
    };

    // Step 1: Show mnemonic
    if (step === 'mnemonic') {
        return (
            <View style={styles.container}>
                <ScrollView style={styles.scrollView}>
                    <View style={styles.content}>
                        <View style={styles.header}>
                            <Pressable onPress={() => router.back()} style={styles.backButton}>
                                <Text style={styles.backText}>←</Text>
                            </Pressable>
                            <Text style={styles.headerTitle}>Your Recovery Phrase</Text>
                        </View>

                        <View style={styles.card}>
                            <Text style={styles.cardTitle}>Write Down Your Recovery Phrase</Text>
                            <Text style={styles.cardSubtitle}>
                                This is the only way to recover your wallet. Store it somewhere safe and never share it with anyone.
                            </Text>

                            <View style={styles.mnemonicGrid}>
                                {mnemonic.map((word, index) => (
                                    <View key={index} style={styles.mnemonicWord}>
                                        <Text style={styles.mnemonicIndex}>{index + 1}</Text>
                                        <Text style={styles.mnemonicText}>{word}</Text>
                                    </View>
                                ))}
                            </View>

                            <Pressable
                                style={styles.copyButton}
                                onPress={handleCopyMnemonic}
                            >
                                <Text style={styles.copyButtonText}>📋 Copy to Clipboard</Text>
                            </Pressable>

                            <Pressable
                                style={styles.button}
                                onPress={handleContinueFromMnemonic}
                            >
                                <Text style={styles.buttonText}>I've Written It Down</Text>
                            </Pressable>
                        </View>
                    </View>
                </ScrollView>
            </View>
        );
    }

    // Step 2: Warning
    if (step === 'warning') {
        return (
            <View style={styles.container}>
                <ScrollView style={styles.scrollView}>
                    <View style={styles.content}>
                        <View style={styles.header}>
                            <Pressable onPress={() => setStep('mnemonic')} style={styles.backButton}>
                                <Text style={styles.backText}>←</Text>
                            </Pressable>
                            <Text style={styles.headerTitle}>Important Warning</Text>
                        </View>

                        <View style={styles.card}>
                            <View style={styles.warningBox}>
                                <Text style={styles.warningIcon}>⚠️</Text>
                                <Text style={styles.warningTitle}>This is Your Only Way to Recover Your Wallet</Text>
                                <Text style={styles.warningText}>
                                    If you lose your recovery phrase, you will permanently lose access to your wallet and all funds.
                                </Text>
                                <Text style={styles.warningText}>
                                    • Store it in a secure location{'\n'}
                                    • Never share it with anyone{'\n'}
                                    • Never store it digitally (screenshots, cloud storage, etc.){'\n'}
                                    • Write it down on paper and keep it safe
                                </Text>
                            </View>

                            <Pressable
                                style={styles.button}
                                onPress={handleContinueFromWarning}
                            >
                                <Text style={styles.buttonText}>I Understand, Continue</Text>
                            </Pressable>
                        </View>
                    </View>
                </ScrollView>
            </View>
        );
    }

    // Step 3: Confirm mnemonic
    if (step === 'confirm') {
        return (
            <View style={styles.container}>
                <ScrollView style={styles.scrollView}>
                    <View style={styles.content}>
                        <View style={styles.header}>
                            <Pressable onPress={() => setStep('warning')} style={styles.backButton}>
                                <Text style={styles.backText}>←</Text>
                            </Pressable>
                            <Text style={styles.headerTitle}>Confirm Recovery Phrase</Text>
                        </View>

                        <View style={styles.card}>
                            <Text style={styles.cardSubtitle}>
                                Enter your recovery phrase to confirm you've saved it correctly
                            </Text>

                            <View style={styles.confirmGrid}>
                                {mnemonic.map((_, index) => (
                                    <View key={index} style={styles.confirmWord}>
                                        <Text style={styles.confirmIndex}>{index + 1}</Text>
                                        <TextInput
                                            value={confirmedWords[index] || ''}
                                            onChangeText={(text) => handleWordChange(index, text)}
                                            placeholder={`Word ${index + 1}`}
                                            style={styles.confirmInput}
                                            placeholderTextColor="#737A82"
                                            autoCapitalize="none"
                                        />
                                    </View>
                                ))}
                            </View>

                            <Pressable
                                style={styles.button}
                                onPress={handleVerifyMnemonic}
                            >
                                <Text style={styles.buttonText}>Verify</Text>
                            </Pressable>
                        </View>
                    </View>
                </ScrollView>
            </View>
        );
    }

    // Step 4: Set password
    return (
        <View style={styles.container}>
            {isCreating && (
                <View style={styles.fullScreenLoader}>
                    <ActivityIndicator size="large" color="#0891D1" />
                    <Text style={styles.loaderText}>Creating your wallet...</Text>
                    <Text style={styles.loaderSubtext}>This may take a few seconds</Text>
                </View>
            )}
            <View style={styles.content}>
                <View style={styles.header}>
                    <Pressable onPress={() => setStep('confirm')} style={styles.backButton} disabled={isCreating}>
                        <Text style={styles.backText}>←</Text>
                    </Pressable>
                    <Text style={styles.headerTitle}>Set Password</Text>
                </View>

                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Create a Password</Text>
                    <Text style={styles.cardSubtitle}>
                        This password will encrypt your wallet and be required to unlock it. Make sure it's strong and memorable.
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
                        style={[styles.button, isCreating && styles.buttonDisabled]}
                        onPress={handleCreateWallet}
                        disabled={isCreating}
                    >
                        {isCreating ? (
                            <View style={styles.loadingContainer}>
                                <ActivityIndicator size="small" color="#FFFFFF" />
                                <Text style={styles.buttonText}>Creating Wallet...</Text>
                            </View>
                        ) : (
                            <Text style={styles.buttonText}>Create Wallet</Text>
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
        backgroundColor: '#FAFAFA',
    },
    scrollView: {
        flex: 1,
    },
    content: {
        padding: 16,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 24,
    },
    backButton: {
        marginRight: 12,
    },
    backText: {
        fontSize: 24,
        color: '#29343D',
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#29343D',
    },
    card: {
        padding: 24,
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E1E4E8',
        gap: 16,
    },
    cardTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#29343D',
    },
    cardSubtitle: {
        fontSize: 14,
        color: '#737A82',
        marginBottom: 8,
        lineHeight: 20,
    },
    inputGroup: {
        gap: 8,
    },
    label: {
        fontSize: 14,
        fontWeight: '500',
        color: '#29343D',
    },
    input: {
        backgroundColor: '#EFF1F3',
        borderWidth: 1,
        borderColor: '#E1E4E8',
        borderRadius: 8,
        padding: 12,
        fontSize: 14,
        color: '#29343D',
    },
    button: {
        backgroundColor: '#0891D1',
        borderRadius: 8,
        padding: 16,
        alignItems: 'center',
        marginTop: 8,
    },
    buttonDisabled: {
        opacity: 0.5,
    },
    buttonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
    copyButton: {
        backgroundColor: '#EFF1F3',
        borderRadius: 8,
        padding: 12,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E1E4E8',
    },
    copyButtonText: {
        color: '#29343D',
        fontSize: 14,
        fontWeight: '500',
    },
    warningBox: {
        backgroundColor: '#FEF3C7',
        borderRadius: 12,
        padding: 20,
        borderWidth: 2,
        borderColor: '#F59E0B',
        gap: 12,
    },
    warningIcon: {
        fontSize: 32,
        textAlign: 'center',
    },
    warningTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#92400E',
        textAlign: 'center',
    },
    warningText: {
        fontSize: 14,
        color: '#78350F',
        lineHeight: 20,
    },
    mnemonicGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 16,
    },
    mnemonicWord: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#EFF1F3',
        borderRadius: 8,
        padding: 12,
        minWidth: '30%',
        gap: 8,
    },
    mnemonicIndex: {
        fontSize: 12,
        color: '#737A82',
        fontWeight: '600',
    },
    mnemonicText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#29343D',
    },
    confirmGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 16,
    },
    confirmWord: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#EFF1F3',
        borderRadius: 8,
        padding: 8,
        minWidth: '30%',
        gap: 8,
    },
    confirmIndex: {
        fontSize: 12,
        color: '#737A82',
        fontWeight: '600',
    },
    confirmInput: {
        flex: 1,
        fontSize: 14,
        color: '#29343D',
        padding: 4,
    },
    loadingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    fullScreenLoader: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        zIndex: 1000,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 16,
    },
    loaderText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#29343D',
    },
    loaderSubtext: {
        fontSize: 14,
        color: '#737A82',
    },
});
