import { useRouter } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

export default function HomeScreen() {
    const router = useRouter();

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Account 1</Text>
                <Pressable onPress={() => router.push("/settings")}>
                    <Text style={styles.settingsIcon}>⚙️</Text>
                </Pressable>
            </View>

            <ScrollView style={styles.scrollView}>
                <View style={styles.mainContent}>
                    <View style={styles.balanceCard}>
                        <Text style={styles.balanceLabel}>Total Balance</Text>
                        <Text style={styles.balanceAmount}>$0.00</Text>
                    </View>

                    <View style={styles.actionsGrid}>
                        <Pressable style={styles.actionButton}>
                            <View style={styles.actionIcon}>
                                <Text style={styles.actionIconText}>$</Text>
                            </View>
                            <Text style={styles.actionLabel}>Buy</Text>
                        </Pressable>

                        <Pressable style={styles.actionButton}>
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
                                <Text style={styles.tokenAmount}>$500</Text>
                                <Text style={styles.tokenSubtext}>500 USDC</Text>
                            </View>
                        </View>

                        <View style={styles.tokenCard}>
                            <View style={styles.tokenInfo}>
                                <View style={[styles.tokenIconContainer, { backgroundColor: '#DCFCE7' }]}>
                                    <Text style={[styles.tokenIconText, { color: '#22C55E' }]}>T</Text>
                                </View>
                                <View>
                                    <Text style={styles.tokenName}>USDT</Text>
                                    <Text style={styles.tokenSubtext}>Tether</Text>
                                </View>
                            </View>
                            <View style={styles.tokenBalance}>
                                <Text style={styles.tokenAmount}>$700</Text>
                                <Text style={styles.tokenSubtext}>700 USDT</Text>
                            </View>
                        </View>

                        <View style={{ paddingTop: 8 }}>
                            <Text style={styles.fiatLabel}>Fiat</Text>
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
