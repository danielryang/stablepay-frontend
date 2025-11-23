import { useTransactions } from "@/contexts/TransactionContext";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

export default function SendScreen() {
    const router = useRouter();
    const { addTransaction } = useTransactions();
    const [amount, setAmount] = useState("40");
    const [fromCurrency, setFromCurrency] = useState("USDC");
    const [toCurrency, setToCurrency] = useState("ARS");
    const [fromAddress, setFromAddress] = useState("0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1");
    const [toAddress, setToAddress] = useState("0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063");
    const exchangeRate = 1050;
    const convertedAmount = (parseFloat(amount) || 0) * exchangeRate;

    const handleSend = () => {
        const now = new Date();
        const dateString = now.toLocaleString("en-US", {
            month: "short",
            day: "numeric",
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
        });

        const shortenAddress = (addr: string) => {
            if (addr.length > 10) {
                return `${addr.slice(0, 7)}...${addr.slice(-5)}`;
            }
            return addr;
        };

        const transactionFee = 2.00;
        const feesSaved = 8.50;
        const finalTotal = convertedAmount + transactionFee;

        addTransaction({
            date: dateString,
            fromAddress: shortenAddress(fromAddress),
            toAddress: shortenAddress(toAddress),
            fromAmount: parseFloat(amount).toFixed(2),
            fromToken: fromCurrency,
            toAmount: convertedAmount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
            toToken: toCurrency,
            type: "sent",
            status: "Confirmed",
            transactionFee: `${transactionFee} ${toCurrency}`,
            speed: "2s",
            feesSaved: `${feesSaved} ${toCurrency}`,
            finalTotal: `${finalTotal.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${toCurrency}`,
        });

        // Navigate to home immediately
        router.push("/(tabs)");
        
        // Show success alert after navigation
        setTimeout(() => {
            Alert.alert("Success", "Transaction sent successfully!");
        }, 100);
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Pressable onPress={() => router.back()} style={styles.backButton}>
                    <Text style={styles.backText}>←</Text>
                </Pressable>
                <Text style={styles.headerTitle}>Sending Page</Text>
            </View>

            <ScrollView style={styles.scrollView}>
                <View style={styles.content}>
                    <View style={styles.card}>
                        <View style={styles.addressSection}>
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>From Wallet Address</Text>
                                <TextInput
                                    value={fromAddress}
                                    onChangeText={setFromAddress}
                                    style={styles.input}
                                    placeholderTextColor="#737A82"
                                />
                            </View>
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>To Wallet Address</Text>
                                <TextInput
                                    value={toAddress}
                                    onChangeText={setToAddress}
                                    style={styles.input}
                                    placeholderTextColor="#737A82"
                                />
                            </View>
                        </View>

                        <View style={styles.divider} />

                        <View style={styles.amountSection}>
                            <Text style={styles.amountLabel}>Amount</Text>
                            <View style={styles.conversionContainer}>
                                <View style={styles.inputSide}>
                                    <TextInput
                                        value={amount}
                                        onChangeText={setAmount}
                                        keyboardType="numeric"
                                        style={[styles.amountInput, { width: Math.max(60, amount.length * 20) }]}
                                        placeholderTextColor="#737A82"
                                    />
                                    <TextInput
                                        value={fromCurrency}
                                        onChangeText={setFromCurrency}
                                        style={styles.currencyInput}
                                        placeholderTextColor="#737A82"
                                    />
                                </View>
                                <Text style={styles.equals}>=</Text>
                                <View style={styles.outputSide}>
                                    <Text style={styles.convertedValue}>
                                        {convertedAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </Text>
                                    <TextInput
                                        value={toCurrency}
                                        onChangeText={setToCurrency}
                                        style={styles.currencyInput}
                                        placeholderTextColor="#737A82"
                                    />
                                </View>
                            </View>
                        </View>

                        <View style={styles.divider} />

                        <View style={styles.feesSection}>
                            <View style={styles.feeRow}>
                                <Text style={styles.feeLabel}>Total Fees Saved:</Text>
                                <Text style={styles.feeValueSuccess}>8.50 {toCurrency}</Text>
                            </View>
                            <View style={styles.feeRow}>
                                <Text style={styles.feeLabel}>Transaction Fee:</Text>
                                <Text style={styles.feeValue}>2.00 {toCurrency}</Text>
                            </View>
                            <View style={styles.feeRow}>
                                <Text style={styles.feeLabel}>Speed:</Text>
                                <Text style={styles.feeValue}>2s</Text>
                            </View>
                        </View>
                    </View>

                    <View style={styles.buttonContainer}>
                        <Pressable
                            onPress={() => router.back()}
                            style={styles.cancelButton}
                        >
                            <Text style={styles.cancelButtonText}>Cancel</Text>
                        </Pressable>
                        <Pressable onPress={handleSend} style={styles.sendButton}>
                            <Text style={styles.sendButtonText}>Send</Text>
                        </Pressable>
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
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#E1E4E8',
        backgroundColor: '#FFFFFF',
    },
    backButton: {
        marginRight: 8,
    },
    backText: {
        fontSize: 24,
        color: '#29343D',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#29343D',
    },
    scrollView: {
        flex: 1,
    },
    content: {
        padding: 16,
    },
    card: {
        padding: 24,
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E1E4E8',
        gap: 24,
    },
    addressSection: {
        gap: 16,
    },
    inputGroup: {
        gap: 8,
    },
    label: {
        fontSize: 12,
        color: '#737A82',
    },
    input: {
        backgroundColor: '#E1E4E8',
        borderWidth: 1,
        borderColor: '#E1E4E8',
        borderRadius: 8,
        padding: 12,
        fontSize: 12,
        color: '#29343D',
    },
    inputRight: {
        textAlign: 'right',
    },
    divider: {
        height: 1,
        backgroundColor: '#E1E4E8',
    },
    amountSection: {
        alignItems: 'center',
        gap: 12,
    },
    amountLabel: {
        fontSize: 14,
        color: '#737A82',
    },
    conversionContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        flexWrap: 'wrap',
        paddingHorizontal: 8,
    },
    inputSide: {
        flexDirection: 'row',
        alignItems: 'baseline',
        gap: 4,
        flexShrink: 1,
    },
    outputSide: {
        flexDirection: 'row',
        alignItems: 'baseline',
        gap: 4,
        flexShrink: 1,
    },
    dollarSign: {
        fontSize: 18,
        color: '#29343D',
    },
    amountInput: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#29343D',
        textAlign: 'center',
        paddingHorizontal: 4,
    },
    currencyInput: {
        fontSize: 18,
        color: '#737A82',
        textAlign: 'center',
        minWidth: 50,
        maxWidth: 80,
    },
    convertedValue: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#29343D',
        flexShrink: 1,
    },
    equals: {
        fontSize: 18,
        color: '#737A82',
    },
    feesSection: {
        gap: 12,
    },
    feeRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    feeLabel: {
        fontSize: 14,
        color: '#737A82',
    },
    feeValue: {
        fontSize: 14,
        fontWeight: '500',
        color: '#29343D',
    },
    feeValueSuccess: {
        fontSize: 14,
        fontWeight: '500',
        color: '#22C55E',
    },
    buttonContainer: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 16,
    },
    cancelButton: {
        flex: 1,
        height: 48,
        borderWidth: 1,
        borderColor: '#E1E4E8',
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FFFFFF',
    },
    cancelButtonText: {
        color: '#29343D',
        fontSize: 16,
    },
    sendButton: {
        flex: 1,
        height: 48,
        backgroundColor: '#0891D1',
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    sendButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '500',
    },
});
