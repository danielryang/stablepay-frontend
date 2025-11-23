import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import Colors from "@/constants/Colors";
import { useColorScheme } from "@/components/useColorScheme";
import { useTransactions } from "@/contexts/TransactionContext";

export default function ActivityScreen() {
    const { transactions, isLoading, refreshTransactions } = useTransactions();
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme];
    return (
        <View style={[styles.container, { backgroundColor: colors.backgroundSecondary }]}>
            <ScrollView style={styles.scrollView}>
                <View style={styles.content}>
                    <View style={styles.header}>
                        <View>
                            <Text style={[styles.title, { color: colors.text }]}>Recent Transactions</Text>
                            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Your Solana transaction history</Text>
                        </View>
                        <Pressable onPress={refreshTransactions} style={styles.refreshButton}>
                            <Text style={styles.refreshText}>🔄</Text>
                        </Pressable>
                    </View>

                    {isLoading ? (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="large" color={colors.primary} />
                            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading transactions...</Text>
                        </View>
                    ) : transactions.length === 0 ? (
                        <View style={styles.emptyContainer}>
                            <Text style={[styles.emptyText, { color: colors.text }]}>No transactions yet</Text>
                            <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
                                Your transaction history will appear here
                            </Text>
                        </View>
                    ) : (
                        <View style={styles.transactionsList}>
                            {transactions.map(tx => (
                                <View key={tx.id} style={[styles.transactionCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
                                    <View style={styles.transactionHeader}>
                                        <View style={styles.headerLeft}>
                                            <View style={styles.iconContainer}>
                                                <Text style={styles.icon}>
                                                    {tx.type === "sent"
                                                        ? "↗"
                                                        : tx.type === "received"
                                                          ? "↙"
                                                          : "⟳"}
                                                </Text>
                                            </View>
                                            <View>
                                                <Text style={styles.date}>{tx.date}</Text>
                                                <Text
                                                    style={[
                                                        styles.status,
                                                        tx.status === "Failed" &&
                                                            styles.statusFailed,
                                                    ]}
                                                >
                                                    {tx.status}
                                                </Text>
                                            </View>
                                        </View>
                                        <View style={styles.amounts}>
                                            <Text
                                                style={[
                                                    styles.fromAmount,
                                                    tx.type === "received" && styles.receivedAmount,
                                                ]}
                                            >
                                                {tx.type === "sent" ? "-" : "+"}
                                                {tx.fromAmount} {tx.fromToken}
                                            </Text>
                                        </View>
                                    </View>

                                    <View style={styles.divider} />

                                    <View style={styles.addressRow}>
                                        <View style={styles.addressColumn}>
                                            <Text style={styles.addressLabel}>From</Text>
                                            <Text style={styles.addressLeft}>{tx.fromAddress}</Text>
                                        </View>
                                        <Text style={styles.arrow}>→</Text>
                                        <View style={styles.addressColumn}>
                                            <Text style={styles.addressLabel}>To</Text>
                                            <Text style={styles.addressRight}>{tx.toAddress}</Text>
                                        </View>
                                    </View>

                                    <View style={styles.divider} />

                                    <View style={styles.detailsSection}>
                                        <View style={styles.detailRow}>
                                            <Text style={styles.detailLabel}>Transaction Fee:</Text>
                                            <Text style={styles.detailValue}>
                                                {tx.transactionFee}
                                            </Text>
                                        </View>
                                        <View style={styles.detailRow}>
                                            <Text style={styles.detailLabel}>Speed:</Text>
                                            <Text style={styles.detailValue}>{tx.speed}</Text>
                                        </View>
                                        {tx.signature && (
                                            <View style={styles.detailRow}>
                                                <Text style={styles.detailLabel}>Signature:</Text>
                                                <Text
                                                    style={styles.signatureText}
                                                    numberOfLines={1}
                                                    ellipsizeMode="middle"
                                                >
                                                    {tx.signature.slice(0, 8)}...
                                                    {tx.signature.slice(-8)}
                                                </Text>
                                            </View>
                                        )}
                                    </View>
                                </View>
                            ))}
                        </View>
                    )}
                </View>
            </ScrollView>
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
        justifyContent: "space-between",
        alignItems: "flex-start",
        marginBottom: 16,
    },
    title: {
        fontSize: 18,
        fontWeight: "600",
        color: "#29343D",
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 14,
        color: "#737A82",
    },
    refreshButton: {
        padding: 8,
    },
    refreshText: {
        fontSize: 20,
    },
    loadingContainer: {
        alignItems: "center",
        justifyContent: "center",
        padding: 40,
    },
    loadingText: {
        marginTop: 12,
        fontSize: 14,
        color: "#737A82",
    },
    emptyContainer: {
        alignItems: "center",
        justifyContent: "center",
        padding: 40,
    },
    emptyText: {
        fontSize: 16,
        fontWeight: "600",
        color: "#29343D",
        marginBottom: 8,
    },
    emptySubtext: {
        fontSize: 14,
        color: "#737A82",
        textAlign: "center",
    },
    transactionsList: {
        gap: 12,
    },
    transactionCard: {
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
    },
    transactionHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
        marginBottom: 12,
    },
    headerLeft: {
        flexDirection: "row",
        gap: 12,
        alignItems: "flex-start",
    },
    iconContainer: {
        backgroundColor: "#E0F2FE",
        borderRadius: 999,
        padding: 8,
        marginTop: 4,
        width: 32,
        height: 32,
        alignItems: "center",
        justifyContent: "center",
    },
    icon: {
        color: "#0891D1",
        fontSize: 14,
        fontWeight: "bold",
    },
    date: {
        fontSize: 14,
        fontWeight: "500",
        color: "#29343D",
    },
    status: {
        fontSize: 12,
        color: "#22C55E",
        marginTop: 2,
    },
    statusFailed: {
        color: "#EF4444",
    },
    amounts: {
        alignItems: "flex-end",
    },
    fromAmount: {
        fontSize: 14,
        fontWeight: "600",
        color: "#29343D",
    },
    receivedAmount: {
        color: "#22C55E",
    },
    toAmount: {
        fontSize: 14,
        color: "#737A82",
        marginTop: 2,
    },
    addressColumn: {
        flex: 1,
    },
    addressLabel: {
        fontSize: 10,
        color: "#737A82",
        marginBottom: 4,
        fontWeight: "500",
    },
    divider: {
        height: 1,
        backgroundColor: "#E1E4E8",
        marginVertical: 12,
    },
    addressRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 8,
    },
    addressLeft: {
        fontSize: 12,
        color: "#737A82",
        flex: 1,
        textAlign: "left",
    },
    addressRight: {
        fontSize: 12,
        color: "#737A82",
        flex: 1,
        textAlign: "right",
    },
    arrow: {
        fontSize: 12,
        color: "#737A82",
    },
    detailsSection: {
        gap: 8,
    },
    detailRow: {
        flexDirection: "row",
        justifyContent: "space-between",
    },
    detailLabel: {
        fontSize: 12,
        color: "#737A82",
    },
    detailValue: {
        fontSize: 12,
        fontWeight: "500",
        color: "#29343D",
    },
    detailValueSuccess: {
        fontSize: 12,
        fontWeight: "500",
        color: "#22C55E",
    },
    detailLabelBold: {
        fontSize: 12,
        fontWeight: "600",
        color: "#29343D",
    },
    detailValueBold: {
        fontSize: 12,
        fontWeight: "600",
        color: "#29343D",
    },
    signatureText: {
        fontSize: 10,
        color: "#737A82",
        fontFamily: "monospace",
        maxWidth: 150,
    },
});
