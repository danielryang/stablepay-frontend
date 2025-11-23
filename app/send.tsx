import { useCallback, useEffect, useState } from "react";
import {
    Alert,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View
} from "react-native";

import FontAwesome from "@expo/vector-icons/FontAwesome";
import * as AuthSession from "expo-auth-session";
import { useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";

import { useColorScheme } from "@/components/useColorScheme";
import Colors from "@/constants/Colors";
import { useTransactions } from "@/contexts/TransactionContext";
import { evaluatePath, PathEvaluationResponse } from "@/utils/pathApi";

// Complete auth session on web
if (Platform.OS === "web") {
    WebBrowser.maybeCompleteAuthSession();
}

export default function SendScreen() {
    const router = useRouter();
    const { addTransaction } = useTransactions();
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme];
    const [sendToPayPal, setSendToPayPal] = useState(false);
    const [payPalConnected, setPayPalConnected] = useState(false);
    const [payPalEmail, setPayPalEmail] = useState("");
    const [payPalUsername, setPayPalUsername] = useState("");
    const [payPalConnecting, setPayPalConnecting] = useState(false);
    const [amount, setAmount] = useState("40");
    const [fromCurrency, setFromCurrency] = useState("USDC");
    const [toCurrency, setToCurrency] = useState("ARS");
    const [fromAddress, setFromAddress] = useState("0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1");
    const [toAddress, setToAddress] = useState("0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063");
    
    // Path evaluation state
    const [pathData, setPathData] = useState<PathEvaluationResponse | null>(null);
    const [conversionLoading, setConversionLoading] = useState<boolean>(false);
    const [conversionError, setConversionError] = useState<string | null>(null);
    
    // Derived values from path data
    const convertedAmount = pathData?.final_amount_ars || 0;
    const transactionFeeARS = pathData?.total_fee_ars || 0;
    const hops = pathData?.hops || [];
    const path = pathData?.path || [];

    // PayPal OAuth configuration
    // makeRedirectUri automatically handles:
    // - Web/localhost: Uses Expo proxy URL (https://auth.expo.io/...) - works with PayPal
    // - Expo Go: Uses Expo proxy URL (https://auth.expo.io/...) - works with PayPal
    // - Development Build: Uses custom scheme (stablelivingfrontend://paypal-callback)
    // - Standalone Build: Uses custom scheme (stablelivingfrontend://paypal-callback)
    const redirectUri = AuthSession.makeRedirectUri({
        scheme: "stablelivingfrontend",
        path: "paypal-callback",
    });

    // Log the redirect URI for debugging (you'll need to add this to PayPal dashboard)
    // Check console to see what redirect URI is generated for your environment
    if (__DEV__) {
        console.log("PayPal Redirect URI:", redirectUri);
        console.log("Platform:", Platform.OS);
        console.log("Add this redirect URI to your PayPal app settings in the dashboard");
    }

    // PayPal OAuth discovery (for real OAuth flow)
    // Sandbox: https://api.sandbox.paypal.com/.well-known/openid_configuration
    // Production: https://api.paypal.com/.well-known/openid_configuration
    const discovery = {
        authorizationEndpoint:
            "https://www.paypal.com/webapps/auth/protocol/openidconnect/v1/authorize",
        tokenEndpoint: "https://api.paypal.com/v1/oauth2/token",
        userInfoEndpoint: "https://api.paypal.com/v1/identity/oauth2/userinfo",
    };

    const [request, response, promptAsync] = AuthSession.useAuthRequest(
        {
            clientId: process.env.EXPO_PUBLIC_PAYPAL_CLIENT_ID || "YOUR_PAYPAL_CLIENT_ID",
            responseType: AuthSession.ResponseType.Code,
            redirectUri,
            scopes: ["openid", "email", "profile"],
            usePKCE: true,
            extraParams: {},
        },
        discovery
    );

    const handlePayPalCallback = useCallback(
        async (authorizationCode: string) => {
            try {
                const clientId =
                    process.env.EXPO_PUBLIC_PAYPAL_CLIENT_ID || "YOUR_PAYPAL_CLIENT_ID";
                const clientSecret =
                    process.env.EXPO_PUBLIC_PAYPAL_CLIENT_SECRET || "YOUR_PAYPAL_CLIENT_SECRET";

                // Real OAuth token exchange
                // NOTE: In production, this should be done server-side for security (client secret should never be in client code)
                // For demo purposes, we'll simulate the API calls but show the real structure

                if (
                    clientId === "YOUR_PAYPAL_CLIENT_ID" ||
                    clientSecret === "YOUR_PAYPAL_CLIENT_SECRET"
                ) {
                    // Simulated flow for demo (no real credentials)
                    await new Promise(resolve => setTimeout(resolve, 1500));
                    const userInfo = {
                        email: "user@paypal.com",
                        verified: true,
                        name: "John Doe",
                    };
                    setPayPalConnecting(false);
                    setPayPalConnected(true);
                    setPayPalEmail(userInfo.email);
                    Alert.alert(
                        "Success",
                        `PayPal account (${userInfo.email}) connected successfully!`
                    );
                    return;
                }

                // Real API implementation (when credentials are provided)
                // Step 1: Exchange authorization code for access token
                const tokenResponse = await fetch(discovery.tokenEndpoint, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/x-www-form-urlencoded",
                        Authorization: `Basic ${btoa(`${clientId}:${clientSecret}`)}`,
                    },
                    body: new URLSearchParams({
                        grant_type: "authorization_code",
                        code: authorizationCode,
                        redirect_uri: redirectUri,
                    }).toString(),
                });

                if (!tokenResponse.ok) {
                    throw new Error("Failed to exchange authorization code");
                }

                const tokenData = await tokenResponse.json();
                const accessToken = tokenData.access_token;

                // Step 2: Get user info using access token
                const userInfoResponse = await fetch(discovery.userInfoEndpoint, {
                    method: "GET",
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                        "Content-Type": "application/json",
                    },
                });

                if (!userInfoResponse.ok) {
                    throw new Error("Failed to fetch user info");
                }

                const userInfo = await userInfoResponse.json();

                setPayPalConnecting(false);
                setPayPalConnected(true);
                setPayPalEmail(userInfo.email || userInfo.email_address);
                Alert.alert(
                    "Success",
                    `PayPal account (${userInfo.email || userInfo.email_address}) connected successfully!`
                );
            } catch (error) {
                setPayPalConnecting(false);
                Alert.alert("Error", "Failed to complete PayPal connection. Please try again.");
                console.error("PayPal OAuth error:", error);
            }
        },
        [discovery, redirectUri]
    );

    // Handle OAuth response
    useEffect(() => {
        if (response?.type === "success" && payPalConnecting) {
            const { code } = response.params;
            if (code) {
                handlePayPalCallback(code);
            }
        } else if (response?.type === "error" || response?.type === "dismiss") {
            setPayPalConnecting(false);
            if (response?.type === "error") {
                Alert.alert("Error", "PayPal authorization was cancelled or failed");
            }
        }
    }, [response, payPalConnecting, handlePayPalCallback]);

    // Evaluate path when amount or currencies change
    useEffect(() => {
        const amountNum = parseFloat(amount);
        if (isNaN(amountNum) || amountNum <= 0) {
            // Reset to default if amount is invalid
            setPathData(null);
            setConversionError(null);
            return;
        }

        const evaluateConversionPath = async () => {
            setConversionLoading(true);
            setConversionError(null);
            try {
                // Call API with correct direction: from_currency = fromCurrency, to_currency = toCurrency
                const result = await evaluatePath(fromCurrency, toCurrency, amountNum);
                setPathData(result);
            } catch (error: any) {
                console.error("Failed to evaluate path:", error);
                setConversionError(error.message || "Failed to evaluate conversion path");
                // Keep previous value on error
            } finally {
                setConversionLoading(false);
            }
        };

        // Debounce the API call to avoid too many requests
        const timeoutId = setTimeout(evaluateConversionPath, 500);
        return () => clearTimeout(timeoutId);
    }, [amount, fromCurrency, toCurrency]);

    const handlePayPalLogin = async () => {
        try {
            setPayPalConnecting(true);

            // Start OAuth flow using expo-auth-session
            // This will:
            // - Open PayPal authorization page in popup (web) or browser (mobile)
            // - Handle the callback automatically
            // - Return authorization code via response
            await promptAsync();
        } catch (error) {
            setPayPalConnecting(false);
            Alert.alert("Error", "Failed to start PayPal authorization");
            console.error("PayPal OAuth error:", error);
        }
    };

    const handlePayPalDisconnect = () => {
        setPayPalConnected(false);
        setPayPalEmail("");
    };

    const handleSend = () => {
        if (sendToPayPal && !payPalUsername.trim()) {
            Alert.alert("Error", "Please enter a PayPal username");
            return;
        }

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

        // Use path data for fees (always in ARS)
        const finalTotal = convertedAmount + transactionFeeARS;

        const toAddressDisplay = sendToPayPal
            ? `PayPal: ${payPalUsername}`
            : shortenAddress(toAddress);

        addTransaction({
            date: dateString,
            fromAddress: shortenAddress(fromAddress),
            toAddress: toAddressDisplay,
            fromAmount: parseFloat(amount).toFixed(2),
            fromToken: fromCurrency,
            toAmount: convertedAmount.toLocaleString("en-US", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
            }),
            toToken: toCurrency,
            type: "sent",
            status: "Confirmed",
            transactionFee: `${transactionFeeARS.toFixed(2)} ARS`, // Always in ARS
            feesSaved: "0 ARS", // Can be calculated if needed
            finalTotal: `${finalTotal.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ARS`,
            path: path, // Add path array
            hops: hops, // Add hops array
        });

        // Navigate to home immediately
        router.push("/(tabs)");

        // Show success alert after navigation
        const successMessage = sendToPayPal
            ? `Payment sent to PayPal (${payPalUsername}) successfully!`
            : "Transaction sent successfully!";

        setTimeout(() => {
            Alert.alert("Success", successMessage);
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
                <Text style={[styles.headerTitle, { color: colors.text }]}>Send</Text>
            </View>

            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                <View style={styles.content}>
                    <View
                        style={[
                            styles.card,
                            { backgroundColor: colors.cardBackground },
                        ]}
                    >
                        {/* Tab System */}
                        <View style={styles.tabContainer}>
                            <Pressable
                                style={[
                                    styles.tab,
                                    !sendToPayPal && { backgroundColor: colors.primary, borderColor: colors.primary },
                                    sendToPayPal && { backgroundColor: colors.cardBackgroundSecondary, borderColor: colors.border },
                                ]}
                                onPress={() => setSendToPayPal(false)}
                            >
                                <FontAwesome name="credit-card" size={16} color={!sendToPayPal ? colors.textInverse : colors.textSecondary} />
                                <Text style={[styles.tabText, { color: !sendToPayPal ? colors.textInverse : colors.textSecondary }]}>
                                    Address
                                </Text>
                            </Pressable>
                            <Pressable
                                style={[
                                    styles.tab,
                                    sendToPayPal && { backgroundColor: colors.primary, borderColor: colors.primary },
                                    !sendToPayPal && { backgroundColor: colors.cardBackgroundSecondary, borderColor: colors.border },
                                ]}
                                onPress={() => setSendToPayPal(true)}
                            >
                                <FontAwesome name="paypal" size={16} color={sendToPayPal ? colors.textInverse : colors.textSecondary} />
                                <Text style={[styles.tabText, { color: sendToPayPal ? colors.textInverse : colors.textSecondary }]}>
                                    PayPal
                                </Text>
                            </Pressable>
                        </View>

                        <View style={styles.addressSection}>
                            <View style={styles.inputGroup}>
                                <Text style={[styles.label, { color: colors.text }]}>From Wallet Address</Text>
                                <View style={[styles.inputContainer, { backgroundColor: colors.inputBackground }]}>
                                    <TextInput
                                        value={fromAddress}
                                        onChangeText={setFromAddress}
                                        style={[styles.input, { color: colors.text }]}
                                        placeholderTextColor={colors.inputPlaceholder}
                                    />
                                </View>
                            </View>
                            <View style={styles.inputGroup}>
                                <Text style={[styles.label, { color: colors.text }]}>
                                    {sendToPayPal ? "PayPal Username" : "To Wallet Address"}
                                </Text>
                                <View style={[styles.inputContainer, { backgroundColor: colors.inputBackground }]}>
                                    {sendToPayPal ? (
                                        <TextInput
                                            value={payPalUsername}
                                            onChangeText={setPayPalUsername}
                                            style={[styles.input, { color: colors.text }]}
                                            placeholder="Enter PayPal username"
                                            placeholderTextColor={colors.inputPlaceholder}
                                        />
                                    ) : (
                                        <TextInput
                                            value={toAddress}
                                            onChangeText={setToAddress}
                                            style={[styles.input, { color: colors.text }]}
                                            placeholderTextColor={colors.inputPlaceholder}
                                        />
                                    )}
                                </View>
                            </View>
                        </View>

                        <View style={styles.divider} />

                        <View style={styles.amountSection}>
                            <Text style={[styles.amountLabel, { color: colors.textSecondary }]}>Amount</Text>
                            <View style={[styles.conversionCard, { backgroundColor: colors.backgroundTertiary }]}>
                                <View style={styles.conversionRow}>
                                    <View style={styles.currencyGroup}>
                                        <TextInput
                                            value={amount}
                                            onChangeText={setAmount}
                                            keyboardType="numeric"
                                            style={[styles.amountInput, { color: colors.text }]}
                                            placeholderTextColor={colors.inputPlaceholder}
                                        />
                                        <View style={[styles.currencyBadge, { backgroundColor: colors.primaryLight }]}>
                                            <TextInput
                                                value={fromCurrency}
                                                onChangeText={setFromCurrency}
                                                style={[styles.currencyInput, { color: colors.primary }]}
                                                placeholderTextColor={colors.inputPlaceholder}
                                            />
                                        </View>
                                    </View>
                                    
                                    <View style={styles.arrowContainer}>
                                        <FontAwesome name="arrow-right" size={16} color={colors.primary} />
                                    </View>
                                    
                                    <View style={styles.currencyGroup}>
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
                                        <View style={[styles.currencyBadge, { backgroundColor: colors.primaryLight }]}>
                                            <TextInput
                                                value={toCurrency}
                                                onChangeText={setToCurrency}
                                                style={[styles.currencyInput, { color: colors.primary }]}
                                                placeholderTextColor={colors.inputPlaceholder}
                                            />
                                        </View>
                                    </View>
                                </View>
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
                                <Text style={[styles.feeLabel, { color: colors.textSecondary }]}>Total Fees Saved:</Text>
                                <Text style={[styles.feeValueSuccess, { color: colors.success }]}>
                                    8.50 {toCurrency}
                                </Text>
                            </View>
                            <View style={styles.feeRow}>
                                <Text style={[styles.feeLabel, { color: colors.textSecondary }]}>Transaction Fee:</Text>
                                <Text style={[styles.feeValue, { color: colors.text }]}>
                                    2.00 {toCurrency}
                                </Text>
                            </View>
                            <View style={styles.feeRow}>
                                <Text style={[styles.feeLabel, { color: colors.textSecondary }]}>Speed:</Text>
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
                            onPress={handleSend}
                            style={[
                                styles.sendButton,
                                { backgroundColor: colors.buttonPrimary },
                            ]}
                        >
                            <Text style={[styles.sendButtonText, { color: colors.buttonPrimaryText }]}>
                                Send
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
        padding: 20,
        borderRadius: 20,
        gap: 16,
    },
    tabContainer: {
        flexDirection: "row",
        gap: 8,
        marginBottom: 4,
    },
    tab: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 12,
        borderWidth: 1,
    },
    tabText: {
        fontSize: 14,
        fontWeight: "600",
    },
    addressSection: {
        gap: 14,
    },
    inputGroup: {
        gap: 10,
    },
    label: {
        fontSize: 15,
        fontWeight: "600",
    },
    inputContainer: {
        borderRadius: 14,
        paddingHorizontal: 16,
        paddingVertical: 4,
    },
    input: {
        fontSize: 15,
        paddingVertical: 12,
    },
    inputRight: {
        textAlign: "right",
    },
    divider: {
        height: 1,
        backgroundColor: "transparent",
    },
    amountSection: {
        alignItems: "center",
        gap: 12,
    },
    amountLabel: {
        fontSize: 13,
        fontWeight: "500",
    },
    conversionCard: {
        width: "100%",
        padding: 18,
        borderRadius: 16,
    },
    conversionRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
    },
    currencyGroup: {
        flex: 1,
        alignItems: "center",
        gap: 8,
    },
    amountInput: {
        fontSize: 26,
        fontWeight: "bold",
        textAlign: "center",
        paddingHorizontal: 0,
        minWidth: 70,
        ...(Platform.OS === "web"
            ? {
                  padding: 0,
                  borderWidth: 0,
                  outline: "none",
              }
            : {}),
    },
    currencyBadge: {
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 8,
        minWidth: 60,
    },
    currencyInput: {
        fontSize: 13,
        fontWeight: "600",
        textAlign: "center",
        ...(Platform.OS === "web"
            ? {
                  padding: 0,
                  borderWidth: 0,
                  outline: "none",
              }
            : {}),
    },
    convertedValue: {
        fontSize: 26,
        fontWeight: "bold",
        textAlign: "center",
        minWidth: 90,
    },
    arrowContainer: {
        padding: 6,
    },
    equals: {
        fontSize: 18,
    },
    feesSection: {
        gap: 10,
    },
    feeCard: {
        padding: 12,
        borderRadius: 12,
        marginBottom: 2,
    },
    feeRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    feeLabelContainer: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
    },
    feeLabel: {
        fontSize: 14,
        fontWeight: "500",
    },
    feeValue: {
        fontSize: 15,
        fontWeight: "600",
    },
    feeValueSuccess: {
        fontSize: 15,
        fontWeight: "600",
    },
    feeValueError: {
        fontSize: 15,
        fontWeight: "600",
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
    sendButton: {
        flex: 1,
        height: 56,
        borderRadius: 16,
        alignItems: "center",
        justifyContent: "center",
    },
    sendButtonText: {
        fontSize: 17,
        fontWeight: "600",
        letterSpacing: 0.2,
    },
    sendButtonDisabled: {
        opacity: 0.6,
    },
    switchSection: {
        marginBottom: 8,
    },
    switchRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
    },
    switchLabelContainer: {
        flex: 1,
        alignItems: "center",
    },
    switchLabel: {
        fontSize: 14,
        fontWeight: "500",
        marginBottom: 2,
    },
    switchSubtext: {
        fontSize: 12,
    },
    paypalSection: {
        gap: 16,
    },
    paypalTitle: {
        fontSize: 16,
        fontWeight: "600",
        marginBottom: 8,
    },
    paypalDescription: {
        fontSize: 14,
        marginBottom: 16,
        lineHeight: 20,
    },
    connectButton: {
        borderRadius: 8,
        padding: 16,
        alignItems: "center",
        marginTop: 8,
    },
    connectButtonText: {
        fontSize: 16,
        fontWeight: "500",
    },
    connectingSection: {
        padding: 24,
        alignItems: "center",
        gap: 12,
    },
    connectingTitle: {
        fontSize: 18,
        fontWeight: "600",
    },
    connectingSubtext: {
        fontSize: 14,
        color: "#737A82",
        textAlign: "center",
        lineHeight: 20,
    },
    loadingIndicator: {
        marginTop: 16,
    },
    loadingText: {
        fontSize: 32,
    },
    connectedSection: {
        padding: 18,
        borderRadius: 14,
        gap: 14,
    },
    connectedHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    connectedTitle: {
        fontSize: 17,
        fontWeight: "600",
    },
    disconnectText: {
        fontSize: 15,
        fontWeight: "600",
    },
    connectedInfo: {
        gap: 6,
    },
    connectedEmail: {
        fontSize: 15,
        fontWeight: "600",
    },
    connectedStatus: {
        fontSize: 13,
        fontWeight: "500",
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
});
