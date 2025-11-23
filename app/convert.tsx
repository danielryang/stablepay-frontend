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

import { useColorScheme } from "@/components/useColorScheme";
import Colors from "@/constants/Colors";
import { useTransactions } from "@/contexts/TransactionContext";

export default function ConvertScreen() {
    const router = useRouter();
    const { addTransaction } = useTransactions();
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme];
    const [amount, setAmount] = useState("40");
    const [fromCurrency, setFromCurrency] = useState("USDC");
    const [toCurrency, setToCurrency] = useState("ARS");
    const exchangeRate = 1050;
    const convertedAmount = (parseFloat(amount) || 0) * exchangeRate;

    const handleConvert = () => {
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
        const finalTotal = convertedAmount + transactionFee;

        addTransaction({
            date: dateString,
            fromAddress: "Same Wallet",
            toAddress: "Same Wallet",
            fromAmount: parseFloat(amount).toFixed(2),
            fromToken: fromCurrency,
            toAmount: convertedAmount.toLocaleString("en-US", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
            }),
            toToken: toCurrency,
            type: "converted",
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
            Alert.alert("Success", "Conversion completed successfully!");
        }, 100);
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.backgroundSecondary }]}>
            <View
                style={[
                    styles.header,
                    { backgroundColor: colors.background, borderBottomColor: colors.border },
                ]}
            >
                <Pressable onPress={() => router.back()} style={styles.backButton}>
                    <Text style={[styles.backText, { color: colors.text }]}>←</Text>
                </Pressable>
                <Text style={[styles.headerTitle, { color: colors.text }]}>Convert</Text>
            </View>

            <ScrollView style={styles.scrollView}>
                <View style={styles.content}>
                    <View
                        style={[
                            styles.card,
                            { backgroundColor: colors.cardBackground, borderColor: colors.border },
                        ]}
                    >
                        <View style={styles.amountSection}>
                            <Text style={[styles.amountLabel, { color: colors.textSecondary }]}>
                                Amount
                            </Text>
                            <View style={styles.conversionContainer}>
                                <TextInput
                                    value={amount}
                                    onChangeText={setAmount}
                                    keyboardType="numeric"
                                    style={[styles.amountInput, { color: colors.text }]}
                                    placeholderTextColor={colors.inputPlaceholder}
                                />
                                <TextInput
                                    value={fromCurrency}
                                    onChangeText={setFromCurrency}
                                    style={[styles.currencyInput, { color: colors.textSecondary }]}
                                    placeholderTextColor={colors.inputPlaceholder}
                                />
                                <Text style={[styles.equals, { color: colors.textSecondary }]}>
                                    =
                                </Text>
                                <Text style={[styles.convertedValue, { color: colors.text }]}>
                                    {convertedAmount.toLocaleString("en-US", {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2,
                                    })}
                                </Text>
                                <TextInput
                                    value={toCurrency}
                                    onChangeText={setToCurrency}
                                    style={[styles.currencyInput, { color: colors.textSecondary }]}
                                    placeholderTextColor={colors.inputPlaceholder}
                                />
                            </View>
                        </View>

                        <View style={[styles.divider, { backgroundColor: colors.border }]} />

                        <View style={styles.feesSection}>
                            <View style={styles.feeRow}>
                                <Text style={[styles.feeLabel, { color: colors.textSecondary }]}>
                                    Total Fees Saved:
                                </Text>
                                <Text style={[styles.feeValueSuccess, { color: colors.success }]}>
                                    8.50 {toCurrency}
                                </Text>
                            </View>
                            <View style={styles.feeRow}>
                                <Text style={[styles.feeLabel, { color: colors.textSecondary }]}>
                                    Transaction Fee:
                                </Text>
                                <Text style={[styles.feeValue, { color: colors.text }]}>
                                    2.00 {toCurrency}
                                </Text>
                            </View>
                            <View style={styles.feeRow}>
                                <Text style={[styles.feeLabel, { color: colors.textSecondary }]}>
                                    Speed:
                                </Text>
                                <Text style={[styles.feeValue, { color: colors.text }]}>2s</Text>
                            </View>
                        </View>
                    </View>

                    <View style={styles.buttonContainer}>
                        <Pressable
                            onPress={() => router.back()}
                            style={[
                                styles.cancelButton,
                                {
                                    backgroundColor: colors.cardBackground,
                                    borderColor: colors.border,
                                },
                            ]}
                        >
                            <Text style={[styles.cancelButtonText, { color: colors.text }]}>
                                Cancel
                            </Text>
                        </Pressable>
                        <Pressable
                            onPress={handleConvert}
                            style={[
                                styles.convertButton,
                                { backgroundColor: colors.buttonPrimary },
                            ]}
                        >
                            <Text
                                style={[
                                    styles.convertButtonText,
                                    { color: colors.buttonPrimaryText },
                                ]}
                            >
                                Convert
                            </Text>
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
    amountSection: {
        alignItems: "center",
        gap: 12,
    },
    amountLabel: {
        fontSize: 14,
    },
    conversionContainer: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        ...(Platform.OS === "web" ? {} : { gap: 2 }),
        flexWrap: "wrap",
        paddingHorizontal: 8,
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
    currencyInput: {
        fontSize: 18,
        textAlign: "center",
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
    equals: {
        fontSize: 18,
        ...(Platform.OS === "web"
            ? {
                  marginLeft: 2,
                  marginRight: 2,
              }
            : {}),
    },
    divider: {
        height: 1,
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
    convertButton: {
        flex: 1,
        height: 48,
        borderRadius: 8,
        alignItems: "center",
        justifyContent: "center",
    },
    convertButtonText: {
        fontSize: 16,
        fontWeight: "500",
    },
});
