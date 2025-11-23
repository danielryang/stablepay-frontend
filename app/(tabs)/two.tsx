import { useTransactions } from "@/contexts/TransactionContext";
import { ScrollView, StyleSheet, Text, View } from "react-native";

export default function ActivityScreen() {
    const { transactions } = useTransactions();
    return (
        <View style={styles.container}>
            <ScrollView style={styles.scrollView}>
                <View style={styles.content}>
                    <Text style={styles.title}>Account 1</Text>
                    <Text style={styles.subtitle}>Transactions</Text>

                    <View style={styles.transactionsList}>
                        {transactions.map((tx) => (
                            <View key={tx.id} style={styles.transactionCard}>
                                <View style={styles.transactionHeader}>
                                    <View style={styles.headerLeft}>
                                        <View style={styles.iconContainer}>
                                            <Text style={styles.icon}>↗</Text>
                                        </View>
                                        <View>
                                            <Text style={styles.date}>{tx.date}</Text>
                                            <Text style={styles.status}>{tx.status}</Text>
                                        </View>
                                    </View>
                                    <View style={styles.amounts}>
                                        <Text style={styles.fromAmount}>
                                            -{tx.fromAmount} {tx.fromToken}
                                        </Text>
                                        <Text style={styles.toAmount}>
                                            +{tx.toAmount} {tx.toToken}
                                        </Text>
                                    </View>
                                </View>

                                <View style={styles.divider} />

                                <View style={styles.addressRow}>
                                    <Text style={styles.addressLeft}>{tx.fromAddress}</Text>
                                    <Text style={styles.arrow}>→</Text>
                                    <Text style={styles.addressRight}>{tx.toAddress}</Text>
                                </View>

                                <View style={styles.divider} />

                                <View style={styles.detailsSection}>
                                    <View style={styles.detailRow}>
                                        <Text style={styles.detailLabel}>Transaction Fee:</Text>
                                        <Text style={styles.detailValue}>{tx.transactionFee}</Text>
                                    </View>
                                    <View style={styles.detailRow}>
                                        <Text style={styles.detailLabel}>Speed:</Text>
                                        <Text style={styles.detailValue}>{tx.speed}</Text>
                                    </View>
                                    <View style={styles.detailRow}>
                                        <Text style={styles.detailLabel}>Total Fees Saved:</Text>
                                        <Text style={styles.detailValueSuccess}>{tx.feesSaved}</Text>
                                    </View>
                                    <View style={styles.detailRow}>
                                        <Text style={styles.detailLabelBold}>Final Total:</Text>
                                        <Text style={styles.detailValueBold}>{tx.finalTotal}</Text>
                                    </View>
                                </View>
                            </View>
                        ))}
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
    scrollView: {
        flex: 1,
    },
    content: {
        padding: 16,
    },
    title: {
        fontSize: 18,
        fontWeight: '600',
        color: '#29343D',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 14,
        color: '#737A82',
        marginBottom: 16,
    },
    transactionsList: {
        gap: 12,
    },
    transactionCard: {
        padding: 16,
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E1E4E8',
    },
    transactionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    headerLeft: {
        flexDirection: 'row',
        gap: 12,
        alignItems: 'flex-start',
    },
    iconContainer: {
        backgroundColor: '#E0F2FE',
        borderRadius: 999,
        padding: 8,
        marginTop: 4,
        width: 32,
        height: 32,
        alignItems: 'center',
        justifyContent: 'center',
    },
    icon: {
        color: '#0891D1',
        fontSize: 14,
        fontWeight: 'bold',
    },
    date: {
        fontSize: 14,
        fontWeight: '500',
        color: '#29343D',
    },
    status: {
        fontSize: 12,
        color: '#22C55E',
        marginTop: 2,
    },
    amounts: {
        alignItems: 'flex-end',
    },
    fromAmount: {
        fontSize: 14,
        fontWeight: '600',
        color: '#29343D',
    },
    toAmount: {
        fontSize: 14,
        color: '#737A82',
        marginTop: 2,
    },
    divider: {
        height: 1,
        backgroundColor: '#E1E4E8',
        marginVertical: 12,
    },
    addressRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 8,
    },
    addressLeft: {
        fontSize: 12,
        color: '#737A82',
        flex: 1,
        textAlign: 'left',
    },
    addressRight: {
        fontSize: 12,
        color: '#737A82',
        flex: 1,
        textAlign: 'right',
    },
    arrow: {
        fontSize: 12,
        color: '#737A82',
    },
    detailsSection: {
        gap: 8,
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    detailLabel: {
        fontSize: 12,
        color: '#737A82',
    },
    detailValue: {
        fontSize: 12,
        fontWeight: '500',
        color: '#29343D',
    },
    detailValueSuccess: {
        fontSize: 12,
        fontWeight: '500',
        color: '#22C55E',
    },
    detailLabelBold: {
        fontSize: 12,
        fontWeight: '600',
        color: '#29343D',
    },
    detailValueBold: {
        fontSize: 12,
        fontWeight: '600',
        color: '#29343D',
    },
});
