import { useRouter } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View, ActivityIndicator } from "react-native";
import { useWallet } from "@/contexts/WalletContext";

export default function HomeScreen() {
    const router = useRouter();
    const { publicKeyString, balance, refreshBalance, isLoading } = useWallet();

    const formatAddress = (address: string | null) => {
        if (!address) return "Not available";
        return `${address.slice(0, 4)}...${address.slice(-4)}`;
    };

    const formatBalance = (bal: number | null) => {
        if (bal === null) return "0.00";
        return bal.toFixed(4);
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <View>
                    <Text style={styles.headerTitle}>Solana Wallet</Text>
                    {publicKeyString && (
                        <Text style={styles.headerSubtitle}>{formatAddress(publicKeyString)}</Text>
                    )}
                </View>
                <Pressable onPress={() => router.push("/settings")}>
                    <Text style={styles.settingsIcon}>⚙️</Text>
                </Pressable>
            </View>

            <ScrollView style={styles.scrollView}>
                <View style={styles.mainContent}>
                    <View style={styles.balanceCard}>
                        <Text style={styles.balanceLabel}>USDC Balance</Text>
                        {isLoading ? (
                            <ActivityIndicator size="small" color="#0891D1" style={{ marginTop: 8 }} />
                        ) : (
                            <Text style={styles.balanceAmount}>${formatBalance(balance)}</Text>
                        )}
                        {publicKeyString && (
                            <Pressable onPress={refreshBalance} style={styles.refreshButton}>
                                <Text style={styles.refreshText}>🔄 Refresh</Text>
                            </Pressable>
                        )}
                    </View>

                    <View style={styles.actionsGrid}>
                        <Pressable
                            style={styles.actionButton}
                            onPress={() => router.push("/convert")}
                        >
                            <View style={styles.actionIcon}>
                                <Text style={styles.actionIconText}>⟳</Text>
                            </View>
                            <Text style={styles.actionLabel}>Convert</Text>
                        </Pressable>

                        <Pressable
                            style={styles.actionButton}
                            onPress={() => router.push("/send")}
                        >
                            <View style={styles.actionIcon}>
                                <Text style={styles.actionIconText}>↗</Text>
                            </View>
                            <Text style={styles.actionLabel}>Send</Text>
                        </Pressable>

                        <Pressable
                            style={styles.actionButton}
                            onPress={() => router.push("/receive")}
                        >
                            <View style={styles.actionIcon}>
                                <Text style={styles.actionIconText}>↙</Text>
                            </View>
                            <Text style={styles.actionLabel}>Receive</Text>
                        </Pressable>
                    </View>

                    <View style={styles.tokensSection}>
                        <Text style={styles.sectionTitle}>Tokens</Text>

                        <View style={styles.tokenCard}>
                            <View style={styles.tokenInfo}>
                                <View style={[styles.tokenIconContainer, { backgroundColor: '#E0F2FE' }]}>
                                    <Text style={styles.tokenIconText}>$</Text>
                                </View>
                                <View>
                                    <Text style={styles.tokenName}>USDC</Text>
                                    <Text style={styles.tokenSubtext}>USD Coin</Text>
                                </View>
                            </View>
                            <View style={styles.tokenBalance}>
                                {isLoading ? (
                                    <ActivityIndicator size="small" color="#0891D1" />
                                ) : (
                                    <>
                                        <Text style={styles.tokenAmount}>${formatBalance(balance)}</Text>
                                        <Text style={styles.tokenSubtext}>{formatBalance(balance)} USDC</Text>
                                    </>
                                )}
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
        backgroundColor: '#FAFAFA',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#E1E4E8',
        backgroundColor: '#FFFFFF',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#29343D',
    },
    headerSubtitle: {
        fontSize: 12,
        color: '#737A82',
        marginTop: 2,
        fontFamily: 'monospace',
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
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E1E4E8',
    },
    balanceLabel: {
        fontSize: 14,
        color: '#737A82',
        marginBottom: 8,
    },
    balanceAmount: {
        fontSize: 48,
        fontWeight: 'bold',
        color: '#29343D',
    },
    refreshButton: {
        marginTop: 8,
        padding: 8,
        alignSelf: 'flex-start',
    },
    refreshText: {
        fontSize: 12,
        color: '#0891D1',
        fontWeight: '500',
    },
    actionsGrid: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 24,
    },
    actionButton: {
        flex: 1,
        alignItems: 'center',
        gap: 8,
        padding: 16,
        borderRadius: 12,
        backgroundColor: '#EFF1F3',
    },
    actionIcon: {
        backgroundColor: '#0891D1',
        borderRadius: 999,
        padding: 12,
        width: 48,
        height: 48,
        alignItems: 'center',
        justifyContent: 'center',
    },
    actionIconText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: 'bold',
    },
    actionLabel: {
        fontSize: 12,
        fontWeight: '500',
        color: '#29343D',
    },
    tokensSection: {
        gap: 16,
        marginTop: 24,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#29343D',
    },
    tokenCard: {
        padding: 16,
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E1E4E8',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    tokenInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    tokenIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 999,
        alignItems: 'center',
        justifyContent: 'center',
    },
    tokenIconText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#0891D1',
    },
    tokenName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#29343D',
    },
    tokenSubtext: {
        fontSize: 14,
        color: '#737A82',
        marginTop: 2,
    },
    tokenBalance: {
        alignItems: 'flex-end',
    },
    tokenAmount: {
        fontSize: 16,
        fontWeight: '600',
        color: '#29343D',
    },
    fiatLabel: {
        fontSize: 14,
        color: '#737A82',
    },
});
