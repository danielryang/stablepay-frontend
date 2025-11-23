import {
    ActivityIndicator,
    Image,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";

import { useRouter } from "expo-router";

import FontAwesome from "@expo/vector-icons/FontAwesome";

import { WalletHeader } from "@/components/WalletHeader";
import { useColorScheme } from "@/components/useColorScheme";
import Colors from "@/constants/Colors";
import { useWallet } from "@/contexts/WalletContext";

export default function HomeScreen() {
    const router = useRouter();
    const { publicKeyString, balance, refreshBalance, isLoading } = useWallet();
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme];

    const formatBalance = (bal: number | null) => {
        if (bal === null) return "0.00";
        return bal.toFixed(4);
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <WalletHeader />

            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                <View style={styles.mainContent}>
                    <View style={[styles.balanceCard, { backgroundColor: colors.cardBackground }]}>
                        <Text style={[styles.balanceLabel, { color: colors.textSecondary }]}>
                            USDC Balance
                        </Text>
                        {isLoading ? (
                            <ActivityIndicator
                                size="small"
                                color={colors.primary}
                                style={{ marginTop: 12 }}
                            />
                        ) : (
                            <Text style={[styles.balanceAmount, { color: colors.text }]}>
                                ${formatBalance(balance)}
                            </Text>
                        )}
                        {publicKeyString && (
                            <Pressable onPress={refreshBalance} style={styles.refreshButton}>
                                <View style={styles.refreshButtonContent}>
                                    <FontAwesome
                                        name="refresh"
                                        size={12}
                                        color={colors.primary}
                                        style={{ marginRight: 4 }}
                                    />
                                    <Text style={[styles.refreshText, { color: colors.primary }]}>
                                        Refresh
                                    </Text>
                                </View>
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
                                <FontAwesome name="exchange" size={18} color={colors.textInverse} />
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
                                <FontAwesome
                                    name="paper-plane"
                                    size={18}
                                    color={colors.textInverse}
                                />
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
                                <FontAwesome
                                    name="arrow-down"
                                    size={18}
                                    color={colors.textInverse}
                                />
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
                                },
                            ]}
                        >
                            <View style={styles.tokenInfo}>
                                <View style={styles.tokenIconContainer}>
                                    <Image
                                        source={require("@/assets/images/usdc.png")}
                                        style={styles.tokenIconImage}
                                        resizeMode="contain"
                                    />
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
                                        USDC Coin • Solana
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
                    </View>

                    <View style={styles.fiatSection}>
                        <Text style={[styles.sectionTitle, { color: colors.text }]}>Fiat</Text>

                        <View
                            style={[
                                styles.tokenCard,
                                {
                                    backgroundColor: colors.cardBackground,
                                },
                            ]}
                        >
                            <View style={styles.tokenInfo}>
                                <View style={styles.tokenIconContainer}>
                                    <Image
                                        source={require("@/assets/images/ars.png")}
                                        style={styles.tokenIconImage}
                                        resizeMode="contain"
                                    />
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
    refreshButtonContent: {
        flexDirection: "row",
        alignItems: "center",
    },
    scrollView: {
        flex: 1,
    },
    mainContent: {
        padding: 20,
        gap: 28,
    },
    balanceCard: {
        padding: 28,
        borderRadius: 20,
    },
    balanceLabel: {
        fontSize: 15,
        marginBottom: 12,
        fontWeight: "500",
    },
    balanceAmount: {
        fontSize: 52,
        fontWeight: "bold",
        letterSpacing: -1,
    },
    refreshButton: {
        marginTop: 12,
        padding: 10,
        alignSelf: "flex-start",
    },
    refreshText: {
        fontSize: 13,
        fontWeight: "600",
    },
    actionsGrid: {
        flexDirection: "row",
        gap: 14,
    },
    actionButton: {
        flex: 1,
        alignItems: "center",
        gap: 10,
        padding: 20,
        borderRadius: 18,
    },
    actionIcon: {
        borderRadius: 999,
        padding: 14,
        width: 52,
        height: 52,
        alignItems: "center",
        justifyContent: "center",
    },
    actionIconText: {
        fontSize: 18,
        fontWeight: "bold",
    },
    actionLabel: {
        fontSize: 13,
        fontWeight: "600",
    },
    tokensSection: {
        gap: 16,
    },
    fiatSection: {
        gap: 16,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: "700",
        letterSpacing: -0.3,
        marginBottom: 4,
    },
    tokenCard: {
        padding: 18,
        borderRadius: 18,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    tokenInfo: {
        flexDirection: "row",
        alignItems: "center",
        gap: 14,
    },
    tokenIconContainer: {
        width: 44,
        height: 44,
        borderRadius: 999,
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
    },
    tokenIconImage: {
        width: 44,
        height: 44,
    },
    tokenIconText: {
        fontSize: 14,
        fontWeight: "bold",
    },
    tokenName: {
        fontSize: 17,
        fontWeight: "600",
    },
    tokenSubtext: {
        fontSize: 14,
        marginTop: 3,
    },
    tokenBalance: {
        alignItems: "flex-end",
    },
    tokenAmount: {
        fontSize: 17,
        fontWeight: "600",
    },
    fiatLabel: {
        fontSize: 14,
    },
});
