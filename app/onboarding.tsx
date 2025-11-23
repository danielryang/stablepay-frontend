import { Pressable, StyleSheet, Text, View } from "react-native";

import { useRouter } from "expo-router";

import Colors from "@/constants/Colors";
import { useColorScheme } from "@/components/useColorScheme";

export default function OnboardingScreen() {
    const router = useRouter();
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme];

    return (
        <View style={[styles.container, { backgroundColor: colors.backgroundSecondary }]}>
            <View style={styles.content}>
                <View style={styles.logoContainer}>
                    <View style={[styles.logo, { backgroundColor: colors.primary }]}>
                        <Text style={styles.logoIcon}>💲</Text>
                    </View>
                    <Text style={[styles.title, { color: colors.text }]}>StablePay</Text>
                    <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Welcome to your Solana wallet</Text>
                </View>

                <View style={[styles.card, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
                    <Text style={[styles.cardTitle, { color: colors.text }]}>Get Started</Text>
                    <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>
                        Create a new wallet or restore an existing one
                    </Text>

                    <View style={styles.buttonGroup}>
                        <Pressable
                            style={[styles.primaryButton, { backgroundColor: colors.buttonPrimary }]}
                            onPress={() => router.push("/create-wallet")}
                        >
                            <Text style={[styles.primaryButtonText, { color: colors.buttonPrimaryText }]}>Create New Wallet</Text>
                        </Pressable>

                        <Pressable
                            style={[styles.secondaryButton, { backgroundColor: colors.buttonSecondary, borderColor: colors.border }]}
                            onPress={() => router.push("/restore-wallet")}
                        >
                            <Text style={[styles.secondaryButtonText, { color: colors.buttonSecondaryText }]}>Restore Wallet</Text>
                        </Pressable>
                    </View>
                </View>

                <View style={styles.footer}>
                    <Text style={[styles.footerText, { color: colors.textSecondary }]}>
                        Your wallet is stored securely on your device
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
    cardTitle: {
        fontSize: 20,
        fontWeight: "bold",
    },
    cardSubtitle: {
        fontSize: 14,
        marginBottom: 8,
    },
    buttonGroup: {
        gap: 12,
        marginTop: 8,
    },
    primaryButton: {
        borderRadius: 8,
        padding: 16,
        alignItems: "center",
    },
    primaryButtonText: {
        fontSize: 16,
        fontWeight: "600",
    },
    secondaryButton: {
        borderRadius: 8,
        padding: 16,
        alignItems: "center",
        borderWidth: 1,
    },
    secondaryButtonText: {
        fontSize: 16,
        fontWeight: "600",
    },
    footer: {
        alignItems: "center",
    },
    footerText: {
        fontSize: 12,
        textAlign: "center",
    },
});
