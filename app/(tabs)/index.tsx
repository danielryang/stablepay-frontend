import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { useRouter } from "expo-router";

import { useColorScheme } from "@/components/useColorScheme";
import Colors from "@/constants/Colors";
import { useWallet } from "@/contexts/WalletContext";

export default function HomeScreen() {
    const router = useRouter();
    const { publicKeyString, balance, refreshBalance, isLoading } = useWallet();
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme];

    const formatAddress = (address: string | null) => {
        if (!address) return "Not available";
        return `${address.slice(0, 4)}...${address.slice(-4)}`;
    };

    const formatBalance = (bal: number | null) => {
        if (bal === null) return "0.00";
        return bal.toFixed(4);
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.backgroundSecondary }]}>
            <View
                style={[
                    styles.header,
                    { backgroundColor: colors.background, borderBottomColor: colors.border },
                ]}
            >
                <View>
                    <Text style={[styles.headerTitle, { color: colors.text }]}>Solana Wallet</Text>
                    {publicKeyString && (
                        <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
                            {formatAddress(publicKeyString)}
                        </Text>
                    )}
                </View>
                <Pressable onPress={() => router.push("/settings")}>
                    <Text style={styles.settingsIcon}>⚙️</Text>
                </Pressable>
            </View>

            <ScrollView style={styles.scrollView}>
                <View style={styles.mainContent}>
                    <View
                        style={[
                            styles.balanceCard,
                            { backgroundColor: colors.cardBackground, borderColor: colors.border },
                        ]}
                    >
                        <Text style={[styles.balanceLabel, { color: colors.textSecondary }]}>
                            USDC Balance
                        </Text>
                        {isLoading ? (
                            <ActivityIndicator
                                size="small"
                                color={colors.primary}
                                style={{ marginTop: 8 }}
                            />
                        ) : (
                            <Text style={[styles.balanceAmount, { color: colors.text }]}>
                                ${formatBalance(balance)}
                            </Text>
                        )}
                        {publicKeyString && (
                            <Pressable onPress={refreshBalance} style={styles.refreshButton}>
                                <Text style={[styles.refreshText, { color: colors.primary }]}>
                                    🔄 Refresh
                                </Text>
                            </Pressable>
                        )}
                    </View>

                    <View style={styles.actionsGrid}>
                        <Pressable
                            style={[
                                styles.actionButton,
                                { backgroundColor: colors.cardBackground },
                            ]}
                            onPress={() => router.push("/convert")}
                        >
                            <View style={[styles.actionIcon, { backgroundColor: colors.primary }]}>
                                <Text style={[styles.actionIconText, { color: colors.textInverse }]}>⟳</Text>
                            </View>
                            <Text style={[styles.actionLabel, { color: colors.text }]}>
                                Convert
                            </Text>
                        </Pressable>

                        <Pressable
                            style={[
                                styles.actionButton,
                                { backgroundColor: colors.cardBackground },
                            ]}
                            onPress={() => router.push("/send")}
                        >
                            <View style={[styles.actionIcon, { backgroundColor: colors.primary }]}>
                                <Text style={[styles.actionIconText, { color: colors.textInverse }]}>↗</Text>
                            </View>
                            <Text style={[styles.actionLabel, { color: colors.text }]}>Send</Text>
                        </Pressable>

                        <Pressable
                            style={[
                                styles.actionButton,
                                { backgroundColor: colors.cardBackground },
                            ]}
                            onPress={() => router.push("/receive")}
                        >
                            <View style={[styles.actionIcon, { backgroundColor: colors.primary }]}>
                                <Text style={[styles.actionIconText, { color: colors.textInverse }]}>↙</Text>
                            </View>
                            <Text style={[styles.actionLabel, { color: colors.text }]}>
                                Receive
                            </Text>
                        </Pressable>
                    </View>

                    <View style={styles.tokensSection}>
                        <Text style={[styles.sectionTitle, { color: colors.text }]}>Tokens</Text>

                        <View
                            style={[
                                styles.tokenCard,
                                {
                                    backgroundColor: colors.cardBackground,
                                    borderColor: colors.border,
                                },
                            ]}
                        >
                            <View style={styles.tokenInfo}>
                                <View
                                    style={[
                                        styles.tokenIconContainer,
                                        { backgroundColor: colors.primaryLight },
                                    ]}
                                >
                                    <Text style={[styles.tokenIconText, { color: colors.primary }]}>
                                        $
                                    </Text>
                                </View>
                                <View>
                                    <Text style={[styles.tokenName, { color: colors.text }]}>
                                        USDC
                                    </Text>
                                    <Text
                                        style={[
                                            styles.tokenSubtext,
                                            { color: colors.textSecondary },
                                        ]}
                                    >
                                        USD Coin • Ethereum
                                    </Text>
                                </View>
                            </View>
                            <View style={styles.tokenBalance}>
                                {isLoading ? (
                                    <ActivityIndicator size="small" color={colors.primary} />
                                ) : (
                                    <>
                                        <Text style={[styles.tokenAmount, { color: colors.text }]}>
                                            ${formatBalance(balance)}
                                        </Text>
                                        <Text
                                            style={[
                                                styles.tokenSubtext,
                                                { color: colors.textSecondary },
                                            ]}
                                        >
                                            {formatBalance(balance)} USDC
                                        </Text>
                                    </>
                                )}
                            </View>
                        </View>

                        <View
                            style={[
                                styles.tokenCard,
                                {
                                    backgroundColor: colors.cardBackground,
                                    borderColor: colors.border,
                                },
                            ]}
                        >
                            <View style={styles.tokenInfo}>
                                <View
                                    style={[
                                        styles.tokenIconContainer,
                                        { backgroundColor: colors.successLight },
                                    ]}
                                >
                                    <Text style={[styles.tokenIconText, { color: colors.success }]}>
                                        T
                                    </Text>
                                </View>
                                <View>
                                    <Text style={[styles.tokenName, { color: colors.text }]}>
                                        USDT
                                    </Text>
                                    <Text
                                        style={[
                                            styles.tokenSubtext,
                                            { color: colors.textSecondary },
                                        ]}
                                    >
                                        Tether • Polygon
                                    </Text>
                                </View>
                            </View>
                            <View style={styles.tokenBalance}>
                                <Text style={[styles.tokenAmount, { color: colors.text }]}>
                                    $700
                                </Text>
                                <Text
                                    style={[styles.tokenSubtext, { color: colors.textSecondary }]}
                                >
                                    700 USDT
                                </Text>
                            </View>
                        </View>

                        <View
                            style={[
                                styles.tokenCard,
                                {
                                    backgroundColor: colors.cardBackground,
                                    borderColor: colors.border,
                                },
                            ]}
                        >
                            <View style={styles.tokenInfo}>
                                <View
                                    style={[
                                        styles.tokenIconContainer,
                                        { backgroundColor: colors.warningLight },
                                    ]}
                                >
                                    <Text style={[styles.tokenIconText, { color: colors.warning }]}>
                                        ₱
                                    </Text>
                                </View>
                                <View>
                                    <Text style={[styles.tokenName, { color: colors.text }]}>
                                        ARS
                                    </Text>
                                    <Text
                                        style={[
                                            styles.tokenSubtext,
                                            { color: colors.textSecondary },
                                        ]}
                                    >
                                        Argentine Peso
                                    </Text>
                                </View>
                            </View>
                            <View style={styles.tokenBalance}>
                                <Text style={[styles.tokenAmount, { color: colors.text }]}>
                                    ₱50,000
                                </Text>
                                <Text
                                    style={[styles.tokenSubtext, { color: colors.textSecondary }]}
                                >
                                    50,000 ARS
                                </Text>
                            </View>
                        </View>
                    </View>
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: "row",
        alignItems: "flex-end",
        justifyContent: "space-between",
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 12,
        borderBottomWidth: 1,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: "bold",
    },
    headerSubtitle: {
        fontSize: 12,
        marginTop: 2,
        fontFamily: "monospace",
    },
    settingsIcon: {
        fontSize: 20,
    },
    scrollView: {
        flex: 1,
    },
    mainContent: {
        padding: 16,
        gap: 24,
    },
    balanceCard: {
        padding: 24,
        borderRadius: 12,
        borderWidth: 1,
    },
    balanceLabel: {
        fontSize: 14,
        marginBottom: 8,
    },
    balanceAmount: {
        fontSize: 48,
        fontWeight: "bold",
    },
    refreshButton: {
        marginTop: 8,
        padding: 8,
        alignSelf: "flex-start",
    },
    refreshText: {
        fontSize: 12,
        fontWeight: "500",
    },
    actionsGrid: {
        flexDirection: "row",
        gap: 12,
        marginTop: 24,
    },
    actionButton: {
        flex: 1,
        alignItems: "center",
        gap: 8,
        padding: 16,
        borderRadius: 12,
    },
    actionIcon: {
        borderRadius: 999,
        padding: 12,
        width: 48,
        height: 48,
        alignItems: "center",
        justifyContent: "center",
    },
    actionIconText: {
        fontSize: 18,
        fontWeight: "bold",
    },
    actionLabel: {
        fontSize: 12,
        fontWeight: "500",
    },
    tokensSection: {
        gap: 16,
        marginTop: 24,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: "600",
    },
    tokenCard: {
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    tokenInfo: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
    },
    tokenIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 999,
        alignItems: "center",
        justifyContent: "center",
    },
    tokenIconText: {
        fontSize: 14,
        fontWeight: "bold",
    },
    tokenName: {
        fontSize: 16,
        fontWeight: "600",
    },
    tokenSubtext: {
        fontSize: 14,
        marginTop: 2,
    },
    tokenBalance: {
        alignItems: "flex-end",
    },
    tokenAmount: {
        fontSize: 16,
        fontWeight: "600",
    },
    fiatLabel: {
        fontSize: 14,
    },
});
