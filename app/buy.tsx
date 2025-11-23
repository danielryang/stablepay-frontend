import { useTransactions } from "@/contexts/TransactionContext";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Alert, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

export default function BuyScreen() {
    const router = useRouter();
    const { addTransaction } = useTransactions();
    const [amount, setAmount] = useState("100");
    const [currency, setCurrency] = useState("USDC");
    const [cardNumber, setCardNumber] = useState("1234 5678 9012 3456");
    const [cardHolder, setCardHolder] = useState("John Doe");
    const [expiryDate, setExpiryDate] = useState("12/25");
    const [cvv, setCvv] = useState("123");

    const handleBuy = () => {
        const now = new Date();
        const dateString = now.toLocaleString("en-US", {
            month: "short",
            day: "numeric",
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
        });

        const transactionFee = 2.00;
        const feesSaved = 8.50;
        const finalTotal = parseFloat(amount) + transactionFee;

        addTransaction({
            date: dateString,
            fromAddress: `Card ending ${cardNumber.slice(-4)}`,
            toAddress: "Your Wallet",
            fromAmount: parseFloat(amount).toFixed(2),
            fromToken: "USD",
            toAmount: parseFloat(amount).toFixed(2),
            toToken: currency,
            type: "bought",
            status: "Confirmed",
            transactionFee: `${transactionFee} ${currency}`,
            speed: "2s",
            feesSaved: `${feesSaved} ${currency}`,
            finalTotal: `${finalTotal.toFixed(2)} ${currency}`,
        });

        // Navigate to home immediately
        router.push("/(tabs)");
        
        // Show success alert after navigation
        setTimeout(() => {
            Alert.alert("Success", "Purchase completed successfully!");
        }, 100);
    };

    const formatCardNumber = (text: string) => {
        // Remove all non-digits
        const cleaned = text.replace(/\D/g, '');
        // Add space every 4 digits
        const formatted = cleaned.match(/.{1,4}/g)?.join(' ') || cleaned;
        return formatted.slice(0, 19); // Limit to 16 digits + 3 spaces
    };

    const handleCardNumberChange = (text: string) => {
        const formatted = formatCardNumber(text);
        setCardNumber(formatted);
    };

    const formatExpiryDate = (text: string) => {
        const cleaned = text.replace(/\D/g, '');
        if (cleaned.length >= 2) {
            return cleaned.slice(0, 2) + '/' + cleaned.slice(2, 4);
        }
        return cleaned;
    };

    const handleExpiryChange = (text: string) => {
        const formatted = formatExpiryDate(text);
        setExpiryDate(formatted);
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Pressable onPress={() => router.back()} style={styles.backButton}>
                    <Text style={styles.backText}>←</Text>
                </Pressable>
                <Text style={styles.headerTitle}>Buy Crypto</Text>
            </View>

            <ScrollView style={styles.scrollView}>
                <View style={styles.content}>
                    <View style={styles.card}>
                        <View style={styles.cardSection}>
                            <Text style={styles.sectionLabel}>Payment Method</Text>
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Card Number</Text>
                                <TextInput
                                    value={cardNumber}
                                    onChangeText={handleCardNumberChange}
                                    style={styles.input}
                                    placeholder="1234 5678 9012 3456"
                                    placeholderTextColor="#737A82"
                                    keyboardType="numeric"
                                    maxLength={19}
                                />
                            </View>
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Cardholder Name</Text>
                                <TextInput
                                    value={cardHolder}
                                    onChangeText={setCardHolder}
                                    style={styles.input}
                                    placeholder="John Doe"
                                    placeholderTextColor="#737A82"
                                />
                            </View>
                            <View style={styles.cardRow}>
                                <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                                    <Text style={styles.label}>Expiry Date</Text>
                                    <TextInput
                                        value={expiryDate}
                                        onChangeText={handleExpiryChange}
                                        style={styles.input}
                                        placeholder="MM/YY"
                                        placeholderTextColor="#737A82"
                                        keyboardType="numeric"
                                        maxLength={5}
                                    />
                                </View>
                                <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                                    <Text style={styles.label}>CVV</Text>
                                    <TextInput
                                        value={cvv}
                                        onChangeText={(text) => setCvv(text.replace(/\D/g, '').slice(0, 3))}
                                        style={styles.input}
                                        placeholder="123"
                                        placeholderTextColor="#737A82"
                                        keyboardType="numeric"
                                        maxLength={3}
                                        secureTextEntry
                                    />
                                </View>
                            </View>
                        </View>

                        <View style={styles.divider} />

                        <View style={styles.amountSection}>
                            <Text style={styles.amountLabel}>Amount to Buy</Text>
                            <View style={styles.amountContainer}>
                                <Text style={styles.dollarSign}>$</Text>
                                <TextInput
                                    value={amount}
                                    onChangeText={setAmount}
                                    keyboardType="numeric"
                                    style={styles.amountInput}
                                    placeholderTextColor="#737A82"
                                />
                                <Text style={styles.currencyLabel}>USD</Text>
                                <Text style={styles.equals}>→</Text>
                                <Text style={styles.convertedValue}>
                                    {parseFloat(amount || "0").toFixed(2)}
                                </Text>
                                <TextInput
                                    value={currency}
                                    onChangeText={setCurrency}
                                    style={styles.currencyInput}
                                    placeholderTextColor="#737A82"
                                />
                            </View>
                        </View>

                        <View style={styles.divider} />

                        <View style={styles.feesSection}>
                            <View style={styles.feeRow}>
                                <Text style={styles.feeLabel}>Total Fees Saved:</Text>
                                <Text style={styles.feeValueSuccess}>8.50 {currency}</Text>
                            </View>
                            <View style={styles.feeRow}>
                                <Text style={styles.feeLabel}>Transaction Fee:</Text>
                                <Text style={styles.feeValue}>2.00 {currency}</Text>
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
                        <Pressable onPress={handleBuy} style={styles.buyButton}>
                            <Text style={styles.buyButtonText}>Buy</Text>
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
    cardSection: {
        gap: 16,
    },
    sectionLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#29343D',
        marginBottom: 8,
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
        fontSize: 14,
        color: '#29343D',
    },
    cardRow: {
        flexDirection: 'row',
        gap: 0,
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
    amountContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        ...(Platform.OS === 'web' ? {} : { gap: 2 }),
        flexWrap: 'wrap',
        paddingHorizontal: 8,
    },
    dollarSign: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#29343D',
        ...(Platform.OS === 'web' ? {
            marginRight: 2,
        } : {}),
    },
    amountInput: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#29343D',
        textAlign: 'center',
        paddingHorizontal: 0,
        ...(Platform.OS === 'web' ? {
            marginRight: 2,
            padding: 0,
            borderWidth: 0,
            outline: 'none',
            width: 'auto',
        } : {}),
    },
    currencyLabel: {
        fontSize: 18,
        color: '#737A82',
        ...(Platform.OS === 'web' ? {
            marginRight: 2,
        } : {}),
    },
    equals: {
        fontSize: 18,
        color: '#737A82',
        ...(Platform.OS === 'web' ? {
            marginLeft: 2,
            marginRight: 2,
        } : {}),
    },
    convertedValue: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#29343D',
        ...(Platform.OS === 'web' ? {
            marginLeft: 2,
            marginRight: 2,
        } : {}),
    },
    currencyInput: {
        fontSize: 18,
        color: '#737A82',
        textAlign: 'center',
        ...(Platform.OS === 'web' ? {
            marginLeft: 0,
            padding: 0,
            borderWidth: 0,
            outline: 'none',
            width: 'auto',
        } : {}),
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
    buyButton: {
        flex: 1,
        height: 48,
        backgroundColor: '#0891D1',
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    buyButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '500',
    },
});

