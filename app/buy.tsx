import { useState } from "react";
import {
    Alert,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";

import { useRouter } from "expo-router";

import Colors from "@/constants/Colors";
import { useColorScheme } from "@/components/useColorScheme";
import { useTransactions } from "@/contexts/TransactionContext";

export default function BuyScreen() {
    const router = useRouter();
    const { addTransaction } = useTransactions();
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme];
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

        const transactionFee = 2.0;
        const feesSaved = 8.5;
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
        const cleaned = text.replace(/\D/g, "");
        // Add space every 4 digits
        const formatted = cleaned.match(/.{1,4}/g)?.join(" ") || cleaned;
        return formatted.slice(0, 19); // Limit to 16 digits + 3 spaces
    };

    const handleCardNumberChange = (text: string) => {
        const formatted = formatCardNumber(text);
        setCardNumber(formatted);
    };

    const formatExpiryDate = (text: string) => {
        const cleaned = text.replace(/\D/g, "");
        if (cleaned.length >= 2) {
            return cleaned.slice(0, 2) + "/" + cleaned.slice(2, 4);
        }
        return cleaned;
    };

    const handleExpiryChange = (text: string) => {
        const formatted = formatExpiryDate(text);
        setExpiryDate(formatted);
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.backgroundSecondary }]}>
            <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
                <Pressable onPress={() => router.back()} style={styles.backButton}>
                    <Text style={[styles.backText, { color: colors.text }]}>←</Text>
                </Pressable>
                <Text style={[styles.headerTitle, { color: colors.text }]}>Buy Crypto</Text>
            </View>

            <ScrollView style={styles.scrollView}>
                <View style={styles.content}>
                    <View style={[styles.card, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
                        <View style={styles.cardSection}>
                            <Text style={[styles.sectionLabel, { color: colors.text }]}>Payment Method</Text>
                            <View style={styles.inputGroup}>
                                <Text style={[styles.label, { color: colors.textSecondary }]}>Card Number</Text>
                                <TextInput
                                    value={cardNumber}
                                    onChangeText={handleCardNumberChange}
                                    style={[styles.input, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder, color: colors.inputText }]}
                                    placeholder="1234 5678 9012 3456"
                                    placeholderTextColor={colors.inputPlaceholder}
                                    keyboardType="numeric"
                                    maxLength={19}
                                />
                            </View>
                            <View style={styles.inputGroup}>
                                <Text style={[styles.label, { color: colors.textSecondary }]}>Cardholder Name</Text>
                                <TextInput
                                    value={cardHolder}
                                    onChangeText={setCardHolder}
                                    style={[styles.input, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder, color: colors.inputText }]}
                                    placeholder="John Doe"
                                    placeholderTextColor={colors.inputPlaceholder}
                                />
                            </View>
                            <View style={styles.cardRow}>
                                <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                                    <Text style={[styles.label, { color: colors.textSecondary }]}>Expiry Date</Text>
                                    <TextInput
                                        value={expiryDate}
                                        onChangeText={handleExpiryChange}
                                        style={[styles.input, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder, color: colors.inputText }]}
                                        placeholder="MM/YY"
                                        placeholderTextColor={colors.inputPlaceholder}
                                        keyboardType="numeric"
                                        maxLength={5}
                                    />
                                </View>
                                <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                                    <Text style={[styles.label, { color: colors.textSecondary }]}>CVV</Text>
                                    <TextInput
                                        value={cvv}
                                        onChangeText={text =>
                                            setCvv(text.replace(/\D/g, "").slice(0, 3))
                                        }
                                        style={[styles.input, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder, color: colors.inputText }]}
                                        placeholder="123"
                                        placeholderTextColor={colors.inputPlaceholder}
                                        keyboardType="numeric"
                                        maxLength={3}
                                        secureTextEntry
                                    />
                                </View>
                            </View>
                        </View>

                        <View style={[styles.divider, { backgroundColor: colors.border }]} />

                        <View style={styles.amountSection}>
                            <Text style={[styles.amountLabel, { color: colors.textSecondary }]}>Amount to Buy</Text>
                            <View style={styles.amountContainer}>
                                <Text style={[styles.dollarSign, { color: colors.text }]}>$</Text>
                                <TextInput
                                    value={amount}
                                    onChangeText={setAmount}
                                    keyboardType="numeric"
                                    style={[styles.amountInput, { color: colors.text }]}
                                    placeholderTextColor={colors.inputPlaceholder}
                                />
                                <Text style={[styles.currencyLabel, { color: colors.textSecondary }]}>USD</Text>
                                <Text style={[styles.equals, { color: colors.textSecondary }]}>→</Text>
                                <Text style={[styles.convertedValue, { color: colors.text }]}>
                                    {parseFloat(amount || "0").toFixed(2)}
                                </Text>
                                <TextInput
                                    value={currency}
                                    onChangeText={setCurrency}
                                    style={[styles.currencyInput, { color: colors.textSecondary }]}
                                    placeholderTextColor={colors.inputPlaceholder}
                                />
                            </View>
                        </View>

                        <View style={[styles.divider, { backgroundColor: colors.border }]} />

                        <View style={styles.feesSection}>
                            <View style={styles.feeRow}>
                                <Text style={[styles.feeLabel, { color: colors.textSecondary }]}>Total Fees Saved:</Text>
                                <Text style={[styles.feeValueSuccess, { color: colors.success }]}>8.50 {currency}</Text>
                            </View>
                            <View style={styles.feeRow}>
                                <Text style={[styles.feeLabel, { color: colors.textSecondary }]}>Transaction Fee:</Text>
                                <Text style={[styles.feeValue, { color: colors.text }]}>2.00 {currency}</Text>
                            </View>
                            <View style={styles.feeRow}>
                                <Text style={[styles.feeLabel, { color: colors.textSecondary }]}>Speed:</Text>
                                <Text style={[styles.feeValue, { color: colors.text }]}>2s</Text>
                            </View>
                        </View>
                    </View>

                    <View style={styles.buttonContainer}>
                        <Pressable onPress={() => router.back()} style={[styles.cancelButton, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
                            <Text style={[styles.cancelButtonText, { color: colors.text }]}>Cancel</Text>
                        </Pressable>
                        <Pressable onPress={handleBuy} style={[styles.buyButton, { backgroundColor: colors.buttonPrimary }]}>
                            <Text style={[styles.buyButtonText, { color: colors.buttonPrimaryText }]}>Buy</Text>
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
    },
    header: {
        flexDirection: "row",
        alignItems: "flex-end",
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 12,
        borderBottomWidth: 1,
    },
    backButton: {
        marginRight: 8,
    },
    backText: {
        fontSize: 24,
        color: "#29343D",
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: "bold",
        color: "#29343D",
    },
    scrollView: {
        flex: 1,
    },
    content: {
        padding: 16,
    },
    card: {
        padding: 24,
        borderRadius: 12,
        borderWidth: 1,
        gap: 24,
    },
    cardSection: {
        gap: 16,
    },
    sectionLabel: {
        fontSize: 14,
        fontWeight: "600",
        marginBottom: 8,
    },
    inputGroup: {
        gap: 8,
    },
    label: {
        fontSize: 12,
    },
    input: {
        borderWidth: 1,
        borderRadius: 8,
        padding: 12,
        fontSize: 14,
    },
    cardRow: {
        flexDirection: "row",
        gap: 0,
    },
    divider: {
        height: 1,
    },
    amountSection: {
        alignItems: "center",
        gap: 12,
    },
    amountLabel: {
        fontSize: 14,
    },
    amountContainer: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        ...(Platform.OS === "web" ? {} : { gap: 2 }),
        flexWrap: "wrap",
        paddingHorizontal: 8,
    },
    dollarSign: {
        fontSize: 24,
        fontWeight: "bold",
        ...(Platform.OS === "web"
            ? {
                  marginRight: 2,
              }
            : {}),
    },
    amountInput: {
        fontSize: 28,
        fontWeight: "bold",
        textAlign: "center",
        paddingHorizontal: 0,
        ...(Platform.OS === "web"
            ? {
                  marginRight: 2,
                  padding: 0,
                  borderWidth: 0,
                  outline: "none",
                  width: "auto",
              }
            : {}),
    },
    currencyLabel: {
        fontSize: 18,
        ...(Platform.OS === "web"
            ? {
                  marginRight: 2,
              }
            : {}),
    },
    equals: {
        fontSize: 18,
        ...(Platform.OS === "web"
            ? {
                  marginLeft: 2,
                  marginRight: 2,
              }
            : {}),
    },
    convertedValue: {
        fontSize: 28,
        fontWeight: "bold",
        ...(Platform.OS === "web"
            ? {
                  marginLeft: 2,
                  marginRight: 2,
              }
            : {}),
    },
    currencyInput: {
        fontSize: 18,
        textAlign: "center",
        ...(Platform.OS === "web"
            ? {
                  marginLeft: 0,
                  padding: 0,
                  borderWidth: 0,
                  outline: "none",
                  width: "auto",
              }
            : {}),
    },
    feesSection: {
        gap: 12,
    },
    feeRow: {
        flexDirection: "row",
        justifyContent: "space-between",
    },
    feeLabel: {
        fontSize: 14,
    },
    feeValue: {
        fontSize: 14,
        fontWeight: "500",
    },
    feeValueSuccess: {
        fontSize: 14,
        fontWeight: "500",
    },
    buttonContainer: {
        flexDirection: "row",
        gap: 12,
        marginTop: 16,
    },
    cancelButton: {
        flex: 1,
        height: 48,
        borderWidth: 1,
        borderRadius: 8,
        alignItems: "center",
        justifyContent: "center",
    },
    cancelButtonText: {
        fontSize: 16,
    },
    buyButton: {
        flex: 1,
        height: 48,
        borderRadius: 8,
        alignItems: "center",
        justifyContent: "center",
    },
    buyButtonText: {
        fontSize: 16,
        fontWeight: "500",
    },
});
