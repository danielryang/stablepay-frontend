import { Image, Pressable, StyleSheet, Text, View } from "react-native";

import { useRouter } from "expo-router";

import { useColorScheme } from "@/components/useColorScheme";
import Colors from "@/constants/Colors";

export default function OnboardingScreen() {
    const router = useRouter();
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme];

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
                        Manage your stablecoin assets
                    </Text>
                </View>

                <View style={styles.buttonContainer}>
                    <Pressable
                        style={[styles.primaryButton, { backgroundColor: colors.buttonPrimary }]}
                        onPress={() => router.push("/create-wallet")}
                    >
                        <Text
                            style={[styles.primaryButtonText, { color: colors.buttonPrimaryText }]}
                        >
                            Create New Wallet
                        </Text>
                    </Pressable>

                    <Pressable
                        style={styles.restoreLink}
                        onPress={() => router.push("/restore-wallet")}
                    >
                        <Text style={[styles.restoreLinkText, { color: colors.text }]}>
                            Restore Wallet
                        </Text>
                    </Pressable>
                </View>

                <View style={styles.footer}>
                    <Text style={[styles.footerText, { color: colors.textSecondary }]}>
                        Secured and encrypted on your device
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
        alignItems: "center",
        justifyContent: "center",
        gap: 48,
    },
    logoContainer: {
        alignItems: "center",
        gap: 16,
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
    buttonContainer: {
        width: "100%",
        gap: 20,
        alignItems: "center",
    },
    primaryButton: {
        width: "100%",
        borderRadius: 16,
        paddingVertical: 18,
        paddingHorizontal: 24,
        alignItems: "center",
        justifyContent: "center",
        minHeight: 56,
    },
    primaryButtonText: {
        fontSize: 17,
        fontWeight: "600",
        letterSpacing: 0.2,
    },
    restoreLink: {
        paddingVertical: 12,
        paddingHorizontal: 16,
    },
    restoreLinkText: {
        fontSize: 16,
        fontWeight: "500",
    },
    footer: {
        alignItems: "center",
        marginTop: 8,
    },
    footerText: {
        fontSize: 13,
        textAlign: "center",
        fontWeight: "400",
    },
});
