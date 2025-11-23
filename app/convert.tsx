import { useEffect, useState } from "react";
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
import { evaluatePath, PathEvaluationResponse } from "@/utils/pathApi";

export default function ConvertScreen() {
    const router = useRouter();
    const { addTransaction } = useTransactions();
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme];
    const [amount, setAmount] = useState("40");
    const [fromCurrency, setFromCurrency] = useState("USDC");
    const [toCurrency, setToCurrency] = useState("ARS");
    
    // Path evaluation state
    const [pathData, setPathData] = useState<PathEvaluationResponse | null>(null);
    const [conversionLoading, setConversionLoading] = useState<boolean>(false);
    const [conversionError, setConversionError] = useState<string | null>(null);
    
    // Derived values from path data
    const convertedAmount = pathData?.final_amount_ars || 0;
    const transactionFeeARS = pathData?.total_fee_ars || 0;
    const hops = pathData?.hops || [];
    const path = pathData?.path || [];

    // Evaluate path when amount or currencies change
    useEffect(() => {
        const amountNum = parseFloat(amount);
        if (isNaN(amountNum) || amountNum <= 0) {
            setPathData(null);
            setConversionError(null);
            return;
        }

        const evaluateConversionPath = async () => {
            setConversionLoading(true);
            setConversionError(null);
            try {
                const result = await evaluatePath(fromCurrency, toCurrency, amountNum);
                setPathData(result);
            } catch (error: any) {
                console.error("Failed to evaluate path:", error);
                setConversionError(error.message || "Failed to evaluate conversion path");
            } finally {
                setConversionLoading(false);
            }
        };

        const timeoutId = setTimeout(evaluateConversionPath, 500);
        return () => clearTimeout(timeoutId);
    }, [amount, fromCurrency, toCurrency]);

    const handleConvert = () => {
        const now = new Date();
        const dateString = now.toLocaleString("en-US", {
            month: "short",
            day: "numeric",
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
        });

        const finalTotal = convertedAmount + transactionFeeARS;

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
            transactionFee: `${transactionFeeARS.toFixed(2)} ARS`, // Always in ARS
            speed: "2s",
            feesSaved: "0 ARS",
            finalTotal: `${finalTotal.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ARS`,
            path: path,
            hops: hops,
        });

        // Navigate to home immediately
        router.push("/(tabs)");

        // Show success alert after navigation
        setTimeout(() => {
            Alert.alert("Success", "Conversion completed successfully!");
        }, 100);
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <View
                style={[
                    styles.header,
                    { backgroundColor: colors.background },
                ]}
            >
                <Pressable onPress={() => router.back()} style={styles.backButton}>
                    <Text style={[styles.backText, { color: colors.text }]}>←</Text>
                </Pressable>
                <Text style={[styles.headerTitle, { color: colors.text }]}>Convert</Text>
            </View>

            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                <View style={styles.content}>
                    <View
                        style={[
                            styles.card,
                            { backgroundColor: colors.cardBackground },
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
                                {conversionLoading ? (
                                    <Text style={[styles.convertedValue, { color: colors.textSecondary }]}>
                                        Loading...
                                    </Text>
                                ) : conversionError ? (
                                    <Text style={[styles.convertedValue, { color: colors.error }]}>
                                        Error
                                    </Text>
                                ) : (
                                    <Text style={[styles.convertedValue, { color: colors.text }]}>
                                        {convertedAmount.toLocaleString("en-US", {
                                            minimumFractionDigits: 2,
                                            maximumFractionDigits: 2,
                                        })}
                                    </Text>
                                )}
                                <TextInput
                                    value={toCurrency}
                                    onChangeText={setToCurrency}
                                    style={[styles.currencyInput, { color: colors.textSecondary }]}
                                    placeholderTextColor={colors.inputPlaceholder}
                                />
                            </View>
                        </View>

                        <View style={styles.divider} />

                        {/* Path/Hops Display */}
                        {path.length > 0 && (
                            <>
                                <View style={styles.pathSection}>
                                    <Text style={[styles.pathLabel, { color: colors.textSecondary }]}>Conversion Path:</Text>
                                    <View style={styles.pathContainer}>
                                        {path.map((currency, index) => (
                                            <View key={index} style={styles.pathItem}>
                                                <Text style={[styles.pathCurrency, { color: colors.text }]}>{currency}</Text>
                                                {index < path.length - 1 && (
                                                    <Text style={[styles.pathArrow, { color: colors.textSecondary }]}>→</Text>
                                                )}
                                            </View>
                                        ))}
                                    </View>
                                </View>
                                <View style={styles.divider} />
                            </>
                        )}

                        <View style={styles.feesSection}>
                            <View style={styles.feeRow}>
                                <Text style={[styles.feeLabel, { color: colors.textSecondary }]}>
                                    Transaction Fee:
                                </Text>
                                {conversionLoading ? (
                                    <Text style={[styles.feeValue, { color: colors.textSecondary }]}>Loading...</Text>
                                ) : conversionError ? (
                                    <Text style={[styles.feeValueError, { color: colors.error }]}>Error</Text>
                                ) : (
                                    <Text style={[styles.feeValue, { color: colors.text }]}>
                                        {transactionFeeARS.toFixed(2)} ARS
                                    </Text>
                                )}
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
                                    backgroundColor: colors.buttonSecondary,
                                },
                            ]}
                        >
                            <Text style={[styles.cancelButtonText, { color: colors.buttonSecondaryText }]}>
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
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 16,
    },
    backButton: {
        marginRight: 10,
    },
    backText: {
        fontSize: 26,
    },
    headerTitle: {
        fontSize: 26,
        fontWeight: "bold",
        letterSpacing: -0.3,
    },
    scrollView: {
        flex: 1,
    },
    content: {
        padding: 20,
    },
    card: {
        padding: 28,
        borderRadius: 20,
        gap: 28,
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
        backgroundColor: "transparent",
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
        height: 56,
        borderRadius: 16,
        alignItems: "center",
        justifyContent: "center",
    },
    cancelButtonText: {
        fontSize: 17,
        fontWeight: "600",
    },
    convertButton: {
        flex: 1,
        height: 56,
        borderRadius: 16,
        alignItems: "center",
        justifyContent: "center",
    },
    convertButtonText: {
        fontSize: 17,
        fontWeight: "600",
        letterSpacing: 0.2,
    },
    pathSection: {
        gap: 12,
    },
    pathLabel: {
        fontSize: 15,
        fontWeight: "500",
    },
    pathContainer: {
        flexDirection: "row",
        alignItems: "center",
        flexWrap: "wrap",
        gap: 8,
    },
    pathItem: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    pathCurrency: {
        fontSize: 15,
        fontWeight: "600",
    },
    pathArrow: {
        fontSize: 15,
        marginHorizontal: 4,
    },
    feeValueError: {
        fontSize: 14,
        fontWeight: "500",
    },
});
