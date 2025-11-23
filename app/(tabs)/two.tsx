import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import FontAwesome from "@expo/vector-icons/FontAwesome";

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
                            <Text style={[styles.title, { color: colors.text }]}>
                                Recent Transactions
                            </Text>
                            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                                Your Solana transaction history
                            </Text>
                        </View>
                        <Pressable onPress={refreshTransactions} style={styles.refreshButton}>
                            <FontAwesome
                                name="refresh"
                                size={20}
                                color={colors.text}
                            />
                        </Pressable>
                    </View>

                    {isLoading ? (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="large" color={colors.primary} />
                            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
                                Loading transactions...
                            </Text>
                        </View>
                    ) : transactions.length === 0 ? (
                        <View style={styles.emptyContainer}>
                            <Text style={[styles.emptyText, { color: colors.text }]}>
                                No transactions yet
                            </Text>
                            <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
                                Your transaction history will appear here
                            </Text>
                        </View>
                    ) : (
                        <View style={styles.transactionsList}>
                            {transactions.map(tx => (
                                <View
                                    key={tx.id}
                                    style={[
                                        styles.transactionCard,
                                        {
                                            backgroundColor: colors.cardBackground,
                                            borderColor: colors.border,
                                        },
                                    ]}
                                >
                                    <View style={styles.transactionHeader}>
                                        <View style={styles.headerLeft}>
                                            <View style={[styles.iconContainer, { backgroundColor: colors.primaryLight }]}>
                                                <FontAwesome
                                                    name={
                                                        tx.type === "sent"
                                                            ? "arrow-up"
                                                            : tx.type === "received"
                                                              ? "arrow-down"
                                                              : "exchange"
                                                    }
                                                    size={14}
                                                    color={colors.primary}
                                                />
                                            </View>
                                            <View>
                                                <Text style={[styles.date, { color: colors.text }]}>{tx.date}</Text>
                                                <Text
                                                    style={[
                                                        styles.status,
                                                        { color: colors.success },
                                                        tx.status === "Failed" && { color: colors.error },
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
                                                    { color: colors.text },
                                                    tx.type === "received" && { color: colors.success },
                                                ]}
                                            >
                                                {tx.type === "sent" ? "-" : "+"}
                                                {tx.fromAmount} {tx.fromToken}
                                            </Text>
                                        </View>
                                    </View>

                                    <View style={[styles.divider, { backgroundColor: colors.border }]} />

                                    <View style={styles.addressRow}>
                                        <View style={styles.addressColumn}>
                                            <Text style={[styles.addressLabel, { color: colors.textSecondary }]}>From</Text>
                                            <Text style={[styles.addressLeft, { color: colors.textSecondary }]}>{tx.fromAddress}</Text>
                                        </View>
                                        <Text style={[styles.arrow, { color: colors.textSecondary }]}>→</Text>
                                        <View style={styles.addressColumn}>
                                            <Text style={[styles.addressLabel, { color: colors.textSecondary }]}>To</Text>
                                            <Text style={[styles.addressRight, { color: colors.textSecondary }]}>{tx.toAddress}</Text>
                                        </View>
                                    </View>

                                    <View style={[styles.divider, { backgroundColor: colors.border }]} />

                                    <View style={styles.detailsSection}>
                                        <View style={styles.detailRow}>
                                            <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Transaction Fee:</Text>
                                            <Text style={[styles.detailValue, { color: colors.text }]}>
                                                {tx.transactionFee}
                                            </Text>
                                        </View>
                                        <View style={styles.detailRow}>
                                            <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Speed:</Text>
                                            <Text style={[styles.detailValue, { color: colors.text }]}>{tx.speed}</Text>
                                        </View>
                                        {tx.signature && (
                                            <View style={styles.detailRow}>
                                                <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Signature:</Text>
                                                <Text
                                                    style={[styles.signatureText, { color: colors.textSecondary }]}
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
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 14,
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
    },
    emptyContainer: {
        alignItems: "center",
        justifyContent: "center",
        padding: 40,
    },
    emptyText: {
        fontSize: 16,
        fontWeight: "600",
        marginBottom: 8,
    },
    emptySubtext: {
        fontSize: 14,
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
        borderRadius: 999,
        padding: 8,
        marginTop: 4,
        width: 32,
        height: 32,
        alignItems: "center",
        justifyContent: "center",
    },
    icon: {
        fontSize: 14,
        fontWeight: "bold",
    },
    date: {
        fontSize: 14,
        fontWeight: "500",
    },
    status: {
        fontSize: 12,
        marginTop: 2,
    },
    statusFailed: {
        // Color handled inline
    },
    amounts: {
        alignItems: "flex-end",
    },
    fromAmount: {
        fontSize: 14,
        fontWeight: "600",
    },
    receivedAmount: {
        // Color handled inline
    },
    toAmount: {
        fontSize: 14,
        marginTop: 2,
    },
    addressColumn: {
        flex: 1,
    },
    addressLabel: {
        fontSize: 10,
        marginBottom: 4,
        fontWeight: "500",
    },
    divider: {
        height: 1,
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
        flex: 1,
        textAlign: "left",
    },
    addressRight: {
        fontSize: 12,
        flex: 1,
        textAlign: "right",
    },
    arrow: {
        fontSize: 12,
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
    },
    detailValue: {
        fontSize: 12,
        fontWeight: "500",
    },
    detailValueSuccess: {
        fontSize: 12,
        fontWeight: "500",
    },
    detailLabelBold: {
        fontSize: 12,
        fontWeight: "600",
    },
    detailValueBold: {
        fontSize: 12,
        fontWeight: "600",
    },
    signatureText: {
        fontSize: 10,
        fontFamily: "monospace",
        maxWidth: 150,
    },
});
