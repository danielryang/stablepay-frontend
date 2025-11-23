import { Pressable, StyleSheet, Text, View } from "react-native";

import { useRouter } from "expo-router";

export default function OnboardingScreen() {
    const router = useRouter();

    return (
        <View style={styles.container}>
            <View style={styles.content}>
                <View style={styles.logoContainer}>
                    <View style={styles.logo}>
                        <Text style={styles.logoIcon}>💲</Text>
                    </View>
                    <Text style={styles.title}>StablePay</Text>
                    <Text style={styles.subtitle}>Welcome to your Solana wallet</Text>
                </View>

                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Get Started</Text>
                    <Text style={styles.cardSubtitle}>
                        Create a new wallet or restore an existing one
                    </Text>

                    <View style={styles.buttonGroup}>
                        <Pressable
                            style={styles.primaryButton}
                            onPress={() => router.push("/create-wallet")}
                        >
                            <Text style={styles.primaryButtonText}>Create New Wallet</Text>
                        </Pressable>

                        <Pressable
                            style={styles.secondaryButton}
                            onPress={() => router.push("/restore-wallet")}
                        >
                            <Text style={styles.secondaryButtonText}>Restore Wallet</Text>
                        </Pressable>
                    </View>
                </View>

                <View style={styles.footer}>
                    <Text style={styles.footerText}>
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
    buttonGroup: {
        gap: 12,
        marginTop: 8,
    },
    primaryButton: {
        backgroundColor: "#0891D1",
        borderRadius: 8,
        padding: 16,
        alignItems: "center",
    },
    primaryButtonText: {
        color: "#FFFFFF",
        fontSize: 16,
        fontWeight: "600",
    },
    secondaryButton: {
        backgroundColor: "#EFF1F3",
        borderRadius: 8,
        padding: 16,
        alignItems: "center",
        borderWidth: 1,
        borderColor: "#E1E4E8",
    },
    secondaryButtonText: {
        color: "#29343D",
        fontSize: 16,
        fontWeight: "600",
    },
    footer: {
        alignItems: "center",
    },
    footerText: {
        fontSize: 12,
        color: "#737A82",
        textAlign: "center",
    },
});
