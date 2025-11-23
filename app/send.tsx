import { useCallback, useEffect, useState } from "react";
import {
    Alert,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    View,
} from "react-native";

import * as AuthSession from "expo-auth-session";
import { useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";

import Colors from "@/constants/Colors";
import { useColorScheme } from "@/components/useColorScheme";
import { useTransactions } from "@/contexts/TransactionContext";
import { fetchFeeInfo } from "@/utils/feeApi";

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
    const [payPalConnecting, setPayPalConnecting] = useState(false);
    const [amount, setAmount] = useState("40");
    const [fromCurrency, setFromCurrency] = useState("USDC");
    const [toCurrency, setToCurrency] = useState("ARS");
    const [fromAddress, setFromAddress] = useState("0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1");
    const [toAddress, setToAddress] = useState("0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063");
    const exchangeRate = 1050;
    const convertedAmount = (parseFloat(amount) || 0) * exchangeRate;

    // Fee state
    const [minimizedFee, setMinimizedFee] = useState<number>(2.0);
    const [feesSaved, setFeesSaved] = useState<number>(8.5);
    const [feesLoading, setFeesLoading] = useState<boolean>(false);
    const [feesError, setFeesError] = useState<string | null>(null);

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

    // Fetch fees when amount or currency changes
    useEffect(() => {
        const amountNum = parseFloat(amount);
        if (isNaN(amountNum) || amountNum <= 0) {
            // Reset to default values if amount is invalid
            setMinimizedFee(2.0);
            setFeesSaved(8.5);
            setFeesError(null);
            return;
        }

        const fetchFees = async () => {
            setFeesLoading(true);
            setFeesError(null);
            try {
                // Use the converted amount (in destination currency) for fee calculation
                const feeInfo = await fetchFeeInfo(convertedAmount, toCurrency);
                setMinimizedFee(feeInfo.minimizedFee);
                setFeesSaved(feeInfo.feesSaved);
            } catch (error: any) {
                console.error("Failed to fetch fees:", error);
                setFeesError(error.message || "Failed to fetch fees");
                // Keep previous values on error
            } finally {
                setFeesLoading(false);
            }
        };

        // Debounce the API call to avoid too many requests
        const timeoutId = setTimeout(fetchFees, 500);
        return () => clearTimeout(timeoutId);
    }, [amount, toCurrency, convertedAmount]);

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
        if (sendToPayPal && !payPalConnected) {
            Alert.alert("Error", "Please connect your PayPal account first");
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

        // Use the minimized fee as the transaction fee
        const transactionFee = minimizedFee;
        const finalTotal = convertedAmount + transactionFee;

        const toAddressDisplay = sendToPayPal
            ? `PayPal: ${payPalEmail}`
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
            transactionFee: `${transactionFee} ${toCurrency}`,
            speed: "2s",
            feesSaved: `${feesSaved} ${toCurrency}`,
            finalTotal: `${finalTotal.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${toCurrency}`,
        });

        // Navigate to home immediately
        router.push("/(tabs)");

        // Show success alert after navigation
        const successMessage = sendToPayPal
            ? `Payment sent to PayPal (${payPalEmail}) successfully!`
            : "Transaction sent successfully!";

        setTimeout(() => {
            Alert.alert("Success", successMessage);
        }, 100);
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.backgroundSecondary }]}>
            <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
                <Pressable onPress={() => router.back()} style={styles.backButton}>
                    <Text style={[styles.backText, { color: colors.text }]}>←</Text>
                </Pressable>
                <Text style={[styles.headerTitle, { color: colors.text }]}>Sending Page</Text>
            </View>

            <ScrollView style={styles.scrollView}>
                <View style={styles.content}>
                    <View style={[styles.card, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
                        <View style={styles.switchSection}>
                            <View style={styles.switchRow}>
                                <View style={styles.switchLabelContainer}>
                                    <Text style={styles.switchLabel}>Send to Address</Text>
                                    <Text style={styles.switchSubtext}>Crypto wallet address</Text>
                                </View>
                                <Switch
                                    value={sendToPayPal}
                                    onValueChange={setSendToPayPal}
                                    trackColor={{ false: "#E1E4E8", true: "#0891D1" }}
                                    thumbColor="#FFFFFF"
                                />
                                <View style={styles.switchLabelContainer}>
                                    <Text style={styles.switchLabel}>Send to PayPal</Text>
                                    <Text style={styles.switchSubtext}>Fiat payment</Text>
                                </View>
                            </View>
                        </View>

                        <View style={styles.divider} />

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
                            {!sendToPayPal ? (
                                <View style={styles.inputGroup}>
                                    <Text style={styles.label}>To Wallet Address</Text>
                                    <TextInput
                                        value={toAddress}
                                        onChangeText={setToAddress}
                                        style={styles.input}
                                        placeholderTextColor="#737A82"
                                    />
                                </View>
                            ) : (
                                <View style={styles.paypalSection}>
                                    {payPalConnecting ? (
                                        <View style={styles.connectingSection}>
                                            <Text style={styles.connectingTitle}>
                                                Connecting to PayPal...
                                            </Text>
                                            <Text style={styles.connectingSubtext}>
                                                Please complete the login in your browser, then
                                                return to this app.
                                            </Text>
                                            <View style={styles.loadingIndicator}>
                                                <Text style={styles.loadingText}>⏳</Text>
                                            </View>
                                        </View>
                                    ) : !payPalConnected ? (
                                        <>
                                            <Text style={styles.paypalTitle}>
                                                Connect PayPal Account
                                            </Text>
                                            <Text style={styles.paypalDescription}>
                                                You'll be redirected to PayPal to securely log in
                                                and authorize the connection.
                                            </Text>
                                            <Pressable
                                                onPress={handlePayPalLogin}
                                                style={styles.connectButton}
                                            >
                                                <Text style={styles.connectButtonText}>
                                                    🔵 Connect with PayPal
                                                </Text>
                                            </Pressable>
                                        </>
                                    ) : (
                                        <View style={styles.connectedSection}>
                                            <View style={styles.connectedHeader}>
                                                <Text style={styles.connectedTitle}>
                                                    PayPal Connected
                                                </Text>
                                                <Pressable onPress={handlePayPalDisconnect}>
                                                    <Text style={styles.disconnectText}>
                                                        Disconnect
                                                    </Text>
                                                </Pressable>
                                            </View>
                                            <View style={styles.connectedInfo}>
                                                <Text style={styles.connectedEmail}>
                                                    {payPalEmail}
                                                </Text>
                                                <Text style={styles.connectedStatus}>
                                                    ✓ Verified Account
                                                </Text>
                                            </View>
                                        </View>
                                    )}
                                </View>
                            )}
                        </View>

                        <View style={styles.divider} />

                        <View style={styles.amountSection}>
                            <Text style={styles.amountLabel}>Amount</Text>
                            <View style={styles.conversionContainer}>
                                <TextInput
                                    value={amount}
                                    onChangeText={setAmount}
                                    keyboardType="numeric"
                                    style={styles.amountInput}
                                    placeholderTextColor="#737A82"
                                />
                                <TextInput
                                    value={fromCurrency}
                                    onChangeText={setFromCurrency}
                                    style={styles.currencyInput}
                                    placeholderTextColor="#737A82"
                                />
                                <Text style={styles.equals}>=</Text>
                                <Text style={styles.convertedValue}>
                                    {convertedAmount.toLocaleString("en-US", {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2,
                                    })}
                                </Text>
                                <TextInput
                                    value={toCurrency}
                                    onChangeText={setToCurrency}
                                    style={styles.currencyInput}
                                    placeholderTextColor="#737A82"
                                />
                            </View>
                        </View>

                        <View style={styles.divider} />

                        <View style={styles.feesSection}>
                            <View style={styles.feeRow}>
                                <Text style={styles.feeLabel}>Total Fees Saved:</Text>
                                {feesLoading ? (
                                    <Text style={styles.feeValue}>Loading...</Text>
                                ) : feesError ? (
                                    <Text style={styles.feeValueError}>Error</Text>
                                ) : (
                                    <Text style={styles.feeValueSuccess}>
                                        {feesSaved.toFixed(2)} {toCurrency}
                                    </Text>
                                )}
                            </View>
                            <View style={styles.feeRow}>
                                <Text style={styles.feeLabel}>Transaction Fee:</Text>
                                {feesLoading ? (
                                    <Text style={styles.feeValue}>Loading...</Text>
                                ) : feesError ? (
                                    <Text style={styles.feeValueError}>Error</Text>
                                ) : (
                                    <Text style={styles.feeValue}>
                                        {minimizedFee.toFixed(2)} {toCurrency}
                                    </Text>
                                )}
                            </View>
                            <View style={styles.feeRow}>
                                <Text style={styles.feeLabel}>Speed:</Text>
                                <Text style={styles.feeValue}>2s</Text>
                            </View>
                        </View>
                    </View>

                    <View style={styles.buttonContainer}>
                        <Pressable onPress={() => router.back()} style={styles.cancelButton}>
                            <Text style={styles.cancelButtonText}>Cancel</Text>
                        </Pressable>
                        <Pressable
                            onPress={handleSend}
                            style={[
                                styles.sendButton,
                                sendToPayPal && !payPalConnected && styles.sendButtonDisabled,
                            ]}
                            disabled={sendToPayPal && !payPalConnected}
                        >
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
        backgroundColor: "#FAFAFA",
    },
    header: {
        flexDirection: "row",
        alignItems: "flex-end",
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: "#E1E4E8",
        backgroundColor: "#FFFFFF",
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
        backgroundColor: "#FFFFFF",
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#E1E4E8",
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
        color: "#737A82",
    },
    input: {
        backgroundColor: "#E1E4E8",
        borderWidth: 1,
        borderColor: "#E1E4E8",
        borderRadius: 12,
        padding: 16,
        fontSize: 12,
        color: "#29343D",
    },
    inputRight: {
        textAlign: "right",
    },
    divider: {
        height: 1,
        backgroundColor: "#E1E4E8",
    },
    amountSection: {
        alignItems: "center",
        gap: 12,
    },
    amountLabel: {
        fontSize: 14,
        color: "#737A82",
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
        color: "#29343D",
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
        color: "#737A82",
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
        color: "#29343D",
        ...(Platform.OS === "web"
            ? {
                  marginLeft: 2,
                  marginRight: 2,
              }
            : {}),
    },
    equals: {
        fontSize: 18,
        color: "#737A82",
        ...(Platform.OS === "web"
            ? {
                  marginLeft: 2,
                  marginRight: 2,
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
        color: "#737A82",
    },
    feeValue: {
        fontSize: 14,
        fontWeight: "500",
        color: "#29343D",
    },
    feeValueSuccess: {
        fontSize: 14,
        fontWeight: "500",
        color: "#22C55E",
    },
    feeValueError: {
        fontSize: 14,
        fontWeight: "500",
        color: "#EF4444",
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
        borderColor: "#E1E4E8",
        borderRadius: 8,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#FFFFFF",
    },
    cancelButtonText: {
        color: "#29343D",
        fontSize: 16,
    },
    sendButton: {
        flex: 1,
        height: 48,
        backgroundColor: "#0891D1",
        borderRadius: 8,
        alignItems: "center",
        justifyContent: "center",
    },
    sendButtonText: {
        color: "#FFFFFF",
        fontSize: 16,
        fontWeight: "500",
    },
    sendButtonDisabled: {
        backgroundColor: "#E1E4E8",
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
        color: "#29343D",
        marginBottom: 2,
    },
    switchSubtext: {
        fontSize: 12,
        color: "#737A82",
    },
    paypalSection: {
        gap: 16,
    },
    paypalTitle: {
        fontSize: 16,
        fontWeight: "600",
        color: "#29343D",
        marginBottom: 8,
    },
    paypalDescription: {
        fontSize: 14,
        color: "#737A82",
        marginBottom: 16,
        lineHeight: 20,
    },
    connectButton: {
        backgroundColor: "#0891D1",
        borderRadius: 8,
        padding: 16,
        alignItems: "center",
        marginTop: 8,
    },
    connectButtonText: {
        color: "#FFFFFF",
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
        color: "#29343D",
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
        padding: 16,
        backgroundColor: "#EFF1F3",
        borderRadius: 8,
        gap: 12,
    },
    connectedHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    connectedTitle: {
        fontSize: 16,
        fontWeight: "600",
        color: "#29343D",
    },
    disconnectText: {
        fontSize: 14,
        color: "#0891D1",
        fontWeight: "500",
    },
    connectedInfo: {
        gap: 4,
    },
    connectedEmail: {
        fontSize: 14,
        color: "#29343D",
        fontWeight: "500",
    },
    connectedStatus: {
        fontSize: 12,
        color: "#22C55E",
    },
});
