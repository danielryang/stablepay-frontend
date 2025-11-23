import {
    ActivityIndicator,
    Animated,
    Image,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";

import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";

import FontAwesome from "@expo/vector-icons/FontAwesome";

import { WalletHeader } from "@/components/WalletHeader";
import { useColorScheme } from "@/components/useColorScheme";
import Colors from "@/constants/Colors";
import { useWallet } from "@/contexts/WalletContext";
import { getStoredARSBalance, getStoredARSExchangeRate } from "@/utils/arsExchangeRate";
import { fetchFiatExchangeRate } from "@/utils/realDataFetcher";

export default function HomeScreen() {
    const router = useRouter();
    const { publicKeyString, balance, refreshBalance, isLoading } = useWallet();
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme];
    const [arsRate, setArsRate] = useState<number | null>(null);
    const [arsBalance, setArsBalance] = useState<number>(50000);
    const [isLoadingRate, setIsLoadingRate] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const rotateAnim = useRef(new Animated.Value(0)).current;

    // Load ARS exchange rate and balance on mount
    useEffect(() => {
        const loadARSData = async () => {
            setIsLoadingRate(true);
            try {
                // Load ARS balance from storage
                const balance = await getStoredARSBalance();
                setArsBalance(balance);

                // Try to get stored rate first
                let rate = await getStoredARSExchangeRate();

                // If no stored rate or expired, fetch new one
                if (rate === null) {
                    try {
                        const exchangeRate = await fetchFiatExchangeRate("ARS");
                        rate = exchangeRate.usdRate;
                    } catch (error) {
                        console.warn("Failed to fetch ARS rate, using default:", error);
                        rate = 1100; // Fallback default
                    }
                }

                setArsRate(rate);
            } catch (error) {
                console.error("Error loading ARS data:", error);
                setArsRate(1100); // Fallback default
            } finally {
                setIsLoadingRate(false);
            }
        };

        loadARSData();
    }, []);

    const formatBalance = (bal: number | null) => {
        if (bal === null) return "0.00";
        return bal.toFixed(4);
    };

    const formatARS = (amount: number) => {
        return new Intl.NumberFormat("es-AR", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(amount);
    };

    // Calculate portfolio worth in ARS
    // Portfolio worth = (USDC balance in USD + ARS balance converted to USD) * ARS rate
    const calculatePortfolioWorth = (): number => {
        if (arsRate === null || balance === null) return 0;
        const usdcBalanceUSD = balance || 0;
        const arsBalanceUSD = arsBalance / arsRate;
        const totalUSD = usdcBalanceUSD + arsBalanceUSD;
        return totalUSD * arsRate;
    };

    // Convert USDC balance to ARS
    const getUSDCBalanceInARS = (): number => {
        if (arsRate === null || balance === null) return 0;
        return balance * arsRate;
    };

    // Handle refresh with animation
    const handleRefresh = async () => {
        if (isRefreshing) return; // Prevent multiple simultaneous refreshes

        setIsRefreshing(true);

        // Start rotation animation
        rotateAnim.setValue(0);
        Animated.loop(
            Animated.timing(rotateAnim, {
                toValue: 1,
                duration: 1000,
                useNativeDriver: true,
            })
        ).start();

        try {
            // Refresh balance
            await refreshBalance();

            // Optionally refresh ARS rate
            try {
                const exchangeRate = await fetchFiatExchangeRate("ARS");
                setArsRate(exchangeRate.usdRate);
            } catch (error) {
                console.warn("Failed to refresh ARS rate:", error);
            }
        } finally {
            // Stop animation after a short delay
            setTimeout(() => {
                Animated.timing(rotateAnim, {
                    toValue: 0,
                    duration: 200,
                    useNativeDriver: true,
                }).start(() => {
                    setIsRefreshing(false);
                });
            }, 500);
        }
    };

    // Interpolate rotation value
    const rotation = rotateAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ["0deg", "360deg"],
    });

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <WalletHeader />

            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                <View style={styles.mainContent}>
                    <View style={[styles.balanceCard, { backgroundColor: colors.cardBackground }]}>
                        <Text style={[styles.balanceLabel, { color: colors.textSecondary }]}>
                            Portfolio Worth
                        </Text>
                        {isLoading || isLoadingRate ? (
                            <ActivityIndicator
                                size="small"
                                color={colors.primary}
                                style={{ marginTop: 12 }}
                            />
                        ) : (
                            <Text style={[styles.balanceAmount, { color: colors.text }]}>
                                ₱{formatARS(calculatePortfolioWorth())}
                            </Text>
                        )}
                        {publicKeyString && (
                            <Pressable
                                onPress={handleRefresh}
                                style={styles.refreshButton}
                                disabled={isRefreshing}
                            >
                                <View style={styles.refreshButtonContent}>
                                    <Animated.View
                                        style={{
                                            transform: [{ rotate: rotation }],
                                        }}
                                    >
                                        <FontAwesome
                                            name="refresh"
                                            size={12}
                                            color={colors.primary}
                                            style={{ marginRight: 4 }}
                                        />
                                    </Animated.View>
                                    <Text style={[styles.refreshText, { color: colors.primary }]}>
                                        Refresh
                                    </Text>
                                </View>
                            </Pressable>
                        )}
                    </View>

                    <View style={styles.actionsGrid}>
                        <Pressable
                            style={[
                                styles.actionButton,
                                { backgroundColor: colors.cardBackground },
                            ]}
                            onPress={() => router.push("/convert")}
                        >
                            <View style={[styles.actionIcon, { backgroundColor: colors.primary }]}>
                                <FontAwesome name="exchange" size={18} color={colors.textInverse} />
                            </View>
                            <Text style={[styles.actionLabel, { color: colors.text }]}>
                                Convert
                            </Text>
                        </Pressable>

                        <Pressable
                            style={[
                                styles.actionButton,
                                { backgroundColor: colors.cardBackground },
                            ]}
                            onPress={() => router.push("/send")}
                        >
                            <View style={[styles.actionIcon, { backgroundColor: colors.primary }]}>
                                <FontAwesome
                                    name="paper-plane"
                                    size={18}
                                    color={colors.textInverse}
                                />
                            </View>
                            <Text style={[styles.actionLabel, { color: colors.text }]}>Send</Text>
                        </Pressable>

                        <Pressable
                            style={[
                                styles.actionButton,
                                { backgroundColor: colors.cardBackground },
                            ]}
                            onPress={() => router.push("/receive")}
                        >
                            <View style={[styles.actionIcon, { backgroundColor: colors.primary }]}>
                                <FontAwesome
                                    name="arrow-down"
                                    size={18}
                                    color={colors.textInverse}
                                />
                            </View>
                            <Text style={[styles.actionLabel, { color: colors.text }]}>
                                Receive
                            </Text>
                        </Pressable>
                    </View>

                    <View style={styles.tokensSection}>
                        <Text style={[styles.sectionTitle, { color: colors.text }]}>Tokens</Text>

                        <View
                            style={[
                                styles.tokenCard,
                                {
                                    backgroundColor: colors.cardBackground,
                                },
                            ]}
                        >
                            <View style={styles.tokenInfo}>
                                <View style={styles.tokenIconContainer}>
                                    <Image
                                        source={require("@/assets/images/usdc.png")}
                                        style={styles.tokenIconImage}
                                        resizeMode="contain"
                                    />
                                </View>
                                <View>
                                    <Text style={[styles.tokenName, { color: colors.text }]}>
                                        USDC
                                    </Text>
                                    <Text
                                        style={[
                                            styles.tokenSubtext,
                                            { color: colors.textSecondary },
                                        ]}
                                    >
                                        USDC Coin • Solana
                                    </Text>
                                </View>
                            </View>
                            <View style={styles.tokenBalance}>
                                {isLoading || isLoadingRate ? (
                                    <ActivityIndicator size="small" color={colors.primary} />
                                ) : (
                                    <>
                                        <Text style={[styles.tokenAmount, { color: colors.text }]}>
                                            ₱{formatARS(getUSDCBalanceInARS())}
                                        </Text>
                                        <Text
                                            style={[
                                                styles.tokenSubtext,
                                                { color: colors.textSecondary },
                                            ]}
                                        >
                                            {formatBalance(balance)} USDC
                                        </Text>
                                    </>
                                )}
                            </View>
                        </View>
                    </View>

                    <View style={styles.fiatSection}>
                        <Text style={[styles.sectionTitle, { color: colors.text }]}>Fiat</Text>

                        <View
                            style={[
                                styles.tokenCard,
                                {
                                    backgroundColor: colors.cardBackground,
                                },
                            ]}
                        >
                            <View style={styles.tokenInfo}>
                                <View style={styles.tokenIconContainer}>
                                    <Image
                                        source={require("@/assets/images/ars.png")}
                                        style={styles.tokenIconImage}
                                        resizeMode="contain"
                                    />
                                </View>
                                <View>
                                    <Text style={[styles.tokenName, { color: colors.text }]}>
                                        ARS
                                    </Text>
                                    <Text
                                        style={[
                                            styles.tokenSubtext,
                                            { color: colors.textSecondary },
                                        ]}
                                    >
                                        Argentine Peso
                                    </Text>
                                </View>
                            </View>
                            <View style={styles.tokenBalance}>
                                {isLoadingRate ? (
                                    <ActivityIndicator size="small" color={colors.primary} />
                                ) : (
                                    <>
                                        <Text style={[styles.tokenAmount, { color: colors.text }]}>
                                            ₱{formatARS(arsBalance)}
                                        </Text>
                                        <Text
                                            style={[
                                                styles.tokenSubtext,
                                                { color: colors.textSecondary },
                                            ]}
                                        >
                                            {formatARS(arsBalance)} ARS
                                        </Text>
                                    </>
                                )}
                            </View>
                        </View>
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
    refreshButtonContent: {
        flexDirection: "row",
        alignItems: "center",
    },
    scrollView: {
        flex: 1,
    },
    mainContent: {
        padding: 20,
        gap: 28,
    },
    balanceCard: {
        padding: 28,
        borderRadius: 20,
    },
    balanceLabel: {
        fontSize: 15,
        marginBottom: 12,
        fontWeight: "500",
    },
    balanceAmount: {
        fontSize: 52,
        fontWeight: "bold",
        letterSpacing: -1,
    },
    refreshButton: {
        marginTop: 12,
        padding: 10,
        alignSelf: "flex-start",
    },
    refreshText: {
        fontSize: 13,
        fontWeight: "600",
    },
    actionsGrid: {
        flexDirection: "row",
        gap: 14,
    },
    actionButton: {
        flex: 1,
        alignItems: "center",
        gap: 10,
        padding: 20,
        borderRadius: 18,
    },
    actionIcon: {
        borderRadius: 999,
        padding: 14,
        width: 52,
        height: 52,
        alignItems: "center",
        justifyContent: "center",
    },
    actionIconText: {
        fontSize: 18,
        fontWeight: "bold",
    },
    actionLabel: {
        fontSize: 13,
        fontWeight: "600",
    },
    tokensSection: {
        gap: 16,
    },
    fiatSection: {
        gap: 16,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: "700",
        letterSpacing: -0.3,
        marginBottom: 4,
    },
    tokenCard: {
        padding: 18,
        borderRadius: 18,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    tokenInfo: {
        flexDirection: "row",
        alignItems: "center",
        gap: 14,
    },
    tokenIconContainer: {
        width: 44,
        height: 44,
        borderRadius: 999,
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
    },
    tokenIconImage: {
        width: 44,
        height: 44,
    },
    tokenIconText: {
        fontSize: 14,
        fontWeight: "bold",
    },
    tokenName: {
        fontSize: 17,
        fontWeight: "600",
    },
    tokenSubtext: {
        fontSize: 14,
        marginTop: 3,
    },
    tokenBalance: {
        alignItems: "flex-end",
    },
    tokenAmount: {
        fontSize: 17,
        fontWeight: "600",
    },
    fiatLabel: {
        fontSize: 14,
    },
});
