import { useState } from "react";
import {
    ActivityIndicator,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";

import Colors from "@/constants/Colors";
import { useColorScheme } from "@/components/useColorScheme";
import { useOptimizerSettings } from "@/contexts/OptimizerSettingsContext";
import { useTransactions } from "@/contexts/TransactionContext";
import {
    answerPortfolioQuestion,
    enhanceRecommendationWithAI,
    generateAISummary,
} from "@/utils/aiEnhancer";
import { FiatBalance, UserBalance, analyzeAndOptimize } from "@/utils/enhancedOptimizer";
import { MarkdownText } from "@/utils/markdownRenderer";
import { fetchMarketSentiment } from "@/utils/marketSentiment";
import {
    FiatExchangeRate,
    fetchFiatExchangeRate,
    fetchRealHistoricalData,
    fetchStablecoinLiquidityData,
} from "@/utils/realDataFetcher";
import { calculateMonthlyTransactionFrequency } from "@/utils/transactionUtils";
import { getUserPreferencesForAI, trackUserAction } from "@/utils/userLearning";

// Extract balances from home screen structure
// USDC: $500 on Ethereum, USDT: $700 on Polygon, ARS: 50,000 ARS
const getUserBalances = (): UserBalance[] => {
    return [
        { chain: "ethereum", token: "USDC", amount: 500 },
        { chain: "polygon", token: "USDT", amount: 700 },
    ];
};

// Extract fiat balances from home screen structure
const getFiatBalances = (): FiatBalance[] => {
    // TODO: Extract from actual home screen component
    // For now, hardcoded based on home screen: ARS: 50,000
    return [{ currency: "ARS", amount: 50000 }];
};

export default function OptimizerScreen() {
    const { settings } = useOptimizerSettings();
    const { transactions } = useTransactions();
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme];

    const [loading, setLoading] = useState(false);
    const [aiLoading, setAiLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [dataSource, setDataSource] = useState("");
    const [results, setResults] = useState<ReturnType<typeof analyzeAndOptimize> | null>(null);

    // AI-enhanced data
    const [aiEnhancedRecs, setAiEnhancedRecs] = useState<any[]>([]);
    const [aiSummary, setAiSummary] = useState<any>(null);
    const [marketSentiment, setMarketSentiment] = useState<any>(null);

    // Q&A state
    const [question, setQuestion] = useState("");
    const [aiAnswer, setAiAnswer] = useState("");
    const [answering, setAnswering] = useState(false);

    const generateReport = async () => {
        try {
            setLoading(true);
            setError(null);
            setResults(null);

            // Step 1: Get user balances
            const userBalances = getUserBalances();

            // Step 2: Get historical chain data
            console.log("📊 Loading real historical data...");
            console.log(
                "⚠️ Note: Making 5 API calls (4 chains + 1 batched stablecoin). Please wait..."
            );
            const historical = await fetchRealHistoricalData(90);

            // Check if API key is being used
            const hasApiKey =
                typeof process !== "undefined" && process.env?.EXPO_PUBLIC_COINGECKO_API_KEY;
            setDataSource(hasApiKey ? "CoinGecko API (with API key)" : "CoinGecko API (free tier)");

            // Verify we have data for required chains (ethereum and polygon)
            if (!historical.chains.ethereum || historical.chains.ethereum === null) {
                throw new Error(
                    "Failed to fetch Ethereum chain data. This is required for the optimizer. If you see CORS errors, this is a browser security restriction - try running on a native device or wait 1-2 minutes and retry."
                );
            }
            if (!historical.chains.polygon || historical.chains.polygon === null) {
                throw new Error(
                    "Failed to fetch Polygon chain data. This is required for the optimizer. If you see CORS errors, this is a browser security restriction - try running on a native device or wait 1-2 minutes and retry."
                );
            }

            // Step 3: Get current market data (simplified - use average from historical)
            const currentPrices: { [chain: string]: { estimatedTransferCostUSD: number } } = {};
            Object.keys(historical.chains).forEach(chain => {
                const chainData = historical.chains[chain];
                if (chainData && chainData.length > 0) {
                    const costs = chainData.map(d => d.estimatedGasCostUSD);
                    const avgCost = costs.reduce((sum, val) => sum + val, 0) / costs.length;
                    currentPrices[chain] = { estimatedTransferCostUSD: avgCost };
                }
            });

            // Step 4: Get stablecoin liquidity data
            console.log("🪙 Fetching stablecoin data...");
            const stablecoinData = await fetchStablecoinLiquidityData();
            if (!stablecoinData) {
                throw new Error("Failed to fetch stablecoin liquidity data");
            }

            // Step 4.5: Get fiat balances and exchange rates
            const fiatBalances = getFiatBalances();
            let fiatExchangeRate: FiatExchangeRate | undefined = undefined;

            if (fiatBalances.length > 0) {
                // Fetch exchange rate for the first fiat currency (assuming single fiat for now)
                try {
                    console.log(`💱 Fetching exchange rate for ${fiatBalances[0].currency}...`);
                    fiatExchangeRate = await fetchFiatExchangeRate(fiatBalances[0].currency);
                    console.log(
                        `✅ Exchange rate: 1 USD = ${fiatExchangeRate.usdRate} ${fiatExchangeRate.fiatCurrency}`
                    );
                } catch (error: any) {
                    console.warn(
                        `⚠️ Failed to fetch exchange rate for ${fiatBalances[0].currency}:`,
                        error.message
                    );
                    // Continue without fiat analysis if exchange rate fetch fails
                }
            }

            // Step 5: Run enhanced analysis
            console.log("🧮 Running enhanced analysis...");

            // Calculate monthly expenses from user balances using settings
            const totalBalance = userBalances.reduce((sum, b) => sum + b.amount, 0);
            // Use spending percentage from settings (default 15%)
            const estimatedMonthlyExpenses = Math.max(
                settings.minimumMonthlyExpenses,
                Math.round(totalBalance * settings.spendingPercentage)
            );

            // Calculate transaction frequency from actual transaction history
            const monthlyTransactionFrequency = calculateMonthlyTransactionFrequency(transactions);

            // Transaction volume multiplier: 1.5x monthly expenses (hardcoded as requested)
            // This represents that users typically transact more than they spend (includes transfers, conversions, etc.)
            const TRANSACTION_VOLUME_MULTIPLIER = 1.5;

            const optimization = analyzeAndOptimize(
                userBalances,
                historical,
                currentPrices,
                stablecoinData,
                {
                    country: settings.country,
                    primaryUse: "daily_expenses",
                    monthlyTransactionVolume:
                        estimatedMonthlyExpenses * TRANSACTION_VOLUME_MULTIPLIER,
                    monthlyTransactionFrequency: monthlyTransactionFrequency,
                    monthlyExpenses: estimatedMonthlyExpenses,
                    upcomingExpenses: [],
                },
                fiatBalances.length > 0 ? fiatBalances : undefined,
                fiatExchangeRate
            );

            setResults(optimization);
            console.log("✅ Analysis complete");

            // Step 6: Enhance with AI (if API key available)
            const hasAiKey =
                typeof process !== "undefined" &&
                (process.env?.EXPO_PUBLIC_ANTHROPIC_API_KEY ||
                    process.env?.EXPO_PUBLIC_CLAUDE_API_KEY);

            if (hasAiKey) {
                try {
                    setAiLoading(true);
                    console.log("🤖 Enhancing with AI...");
                    console.log(
                        "⚠️ Note: Anthropic API has CORS restrictions in browsers. AI features work best on native devices (iOS/Android)."
                    );

                    // Get user preferences for context
                    const userPrefs = await getUserPreferencesForAI();

                    // Enhance recommendations with AI explanations
                    const enhanced = await Promise.all(
                        optimization.recommendations.map(async rec => {
                            try {
                                return await enhanceRecommendationWithAI(rec, {
                                    userBalances,
                                    userCountry: settings.country,
                                    totalSavings: optimization.totalPotentialSavings,
                                });
                            } catch (error) {
                                // Silently fallback - CORS errors are expected in browsers
                                return rec; // Fallback to original
                            }
                        })
                    );
                    setAiEnhancedRecs(enhanced);

                    // Generate AI summary
                    try {
                        // Calculate monthly expenses using settings
                        const totalBalance = userBalances.reduce((sum, b) => sum + b.amount, 0);
                        const estimatedMonthlyExpenses = Math.max(
                            settings.minimumMonthlyExpenses,
                            Math.round(totalBalance * settings.spendingPercentage)
                        );

                        const summary = await generateAISummary(optimization, {
                            userCountry: settings.country,
                            monthlyExpenses: estimatedMonthlyExpenses,
                        });
                        setAiSummary(summary);
                    } catch (error) {
                        // Silently fail - CORS errors are expected in browsers
                        // Algorithmic results are still available
                    }

                    // Fetch market sentiment (this doesn't use Anthropic API, so it should work)
                    try {
                        const sentiment = await fetchMarketSentiment();
                        setMarketSentiment(sentiment);
                    } catch (error) {
                        console.warn("Market sentiment fetch failed:", error);
                    }

                    console.log("✅ AI enhancement complete");
                } catch (error) {
                    console.warn("AI enhancement failed:", error);
                    // Continue without AI - algorithmic results still available
                } finally {
                    setAiLoading(false);
                }
            }
        } catch (err) {
            console.error("❌ Initialization failed:", err);
            let errorMessage = "Unknown error occurred";
            if (err instanceof Error) {
                errorMessage = err.message;
                // Provide more helpful error messages for rate limits
                if (err.message.includes("Rate limited") || err.message.includes("429")) {
                    errorMessage =
                        "CoinGecko API rate limit exceeded. Please wait 1-2 minutes and try again. The free tier allows limited requests per minute.";
                } else if (err.message.includes("CORS")) {
                    errorMessage =
                        "CORS error: Unable to fetch data from CoinGecko API. This may be a browser security restriction. Try again in a few moments.";
                }
            }
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    // Q&A handler
    const handleAskQuestion = async () => {
        if (!question.trim() || !results) return;
        setAnswering(true);
        try {
            const answer = await answerPortfolioQuestion(question, results, {
                userBalances: getUserBalances(),
                userCountry: settings.country,
            });
            setAiAnswer(answer);
        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : String(error);
            if (errorMsg.includes("CORS_BLOCKED") || errorMsg.includes("CORS")) {
                setAiAnswer(
                    "⚠️ AI Q&A requires a native app (iOS/Android) or backend proxy due to CORS restrictions. The Anthropic API does not support browser requests. Algorithmic recommendations are still available above."
                );
            } else {
                setAiAnswer("Sorry, I couldn't process that question. Please try again.");
            }
        } finally {
            setAnswering(false);
        }
    };

    // Track user feedback
    const handleUserFeedback = async (
        recId: string,
        recType: string,
        action: "accepted" | "rejected"
    ) => {
        try {
            await trackUserAction({
                recommendationId: recId,
                type: recType as any,
                action,
                timestamp: Date.now(),
            });
            console.log(`✅ Tracked user action: ${action} for ${recType}`);
        } catch (error) {
            console.warn("Failed to track user action:", error);
        }
    };

    if (loading) {
        return (
            <View style={[styles.container, { backgroundColor: colors.backgroundSecondary }]}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={colors.primary} />
                    <Text style={[styles.loadingText, { color: colors.text }]}>
                        Analyzing market data...
                    </Text>
                    <Text style={[styles.loadingSubtext, { color: colors.textSecondary }]}>
                        Loading 90 days of real price data + stablecoin liquidity
                    </Text>
                </View>
            </View>
        );
    }

    if (aiLoading) {
        return (
            <View style={[styles.container, { backgroundColor: colors.backgroundSecondary }]}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={colors.primary} />
                    <Text style={[styles.loadingText, { color: colors.text }]}>
                        Enhancing with AI...
                    </Text>
                    <Text style={[styles.loadingSubtext, { color: colors.textSecondary }]}>
                        Generating explanations and insights
                    </Text>
                </View>
            </View>
        );
    }

    if (error) {
        return (
            <View style={[styles.container, { backgroundColor: colors.backgroundSecondary }]}>
                <ScrollView style={styles.scrollView}>
                    <View style={styles.errorContainer}>
                        <Text style={[styles.errorTitle, { color: colors.error }]}>⚠️ Error</Text>
                        <Text style={[styles.errorMessage, { color: colors.text }]}>{error}</Text>
                        <Pressable
                            style={[styles.retryButton, { backgroundColor: colors.buttonPrimary }]}
                            onPress={generateReport}
                        >
                            <Text
                                style={[
                                    styles.retryButtonText,
                                    { color: colors.buttonPrimaryText },
                                ]}
                            >
                                Retry
                            </Text>
                        </Pressable>
                    </View>
                </ScrollView>
            </View>
        );
    }

    // Separate recommendations by type
    const stablecoinRecs =
        results?.recommendations.filter(r => r.type === "switch_stablecoin") || [];
    const conversionRecs =
        results?.recommendations.filter(r => r.type === "convert_with_timing") || [];
    const bridgeRecs = results?.recommendations.filter(r => r.type === "bridge") || [];
    const fiatRecs = results?.recommendations.filter(r => r.type === "fiat_to_stablecoin") || [];
    const timingInsights = results?.recommendations.find(r => r.type === "timing_insight");

    return (
        <View style={[styles.container, { backgroundColor: colors.backgroundSecondary }]}>
            <ScrollView style={styles.scrollView}>
                <View style={styles.content}>
                    {/* Header */}
                    <View
                        style={[
                            styles.headerCard,
                            { backgroundColor: colors.cardBackground, borderColor: colors.border },
                        ]}
                    >
                        <Text style={[styles.headerTitle, { color: colors.text }]}>
                            Allocation Optimizer
                        </Text>
                        <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
                            Real data from {dataSource || "CoinGecko API"} • Analyzes timing,
                            stablecoins, and network efficiency
                        </Text>
                        {!results && (
                            <Pressable
                                style={[
                                    styles.generateButton,
                                    { backgroundColor: colors.buttonPrimary },
                                ]}
                                onPress={generateReport}
                            >
                                <Text
                                    style={[
                                        styles.generateButtonText,
                                        { color: colors.buttonPrimaryText },
                                    ]}
                                >
                                    Generate Report
                                </Text>
                            </Pressable>
                        )}
                    </View>

                    {results && (
                        <>
                            {/* CORS Warning Banner (if AI failed due to CORS) */}
                            {aiEnhancedRecs.length === 0 && results.recommendations.length > 0 && (
                                <View
                                    style={[
                                        styles.corsWarningCard,
                                        {
                                            backgroundColor: colors.warningLight,
                                            borderColor: colors.warning,
                                        },
                                    ]}
                                >
                                    <Text
                                        style={[styles.corsWarningTitle, { color: colors.warning }]}
                                    >
                                        {" "}
                                        AI Features Limited in Browser
                                    </Text>
                                    <Text style={[styles.corsWarningText, { color: colors.text }]}>
                                        Anthropic API doesn't support browser CORS. AI explanations
                                        work on native devices (iOS/Android) or require a backend
                                        proxy. Algorithmic recommendations are fully functional
                                        below.
                                    </Text>
                                </View>
                            )}

                            {/* AI Summary */}
                            {aiSummary && typeof aiSummary === "object" && aiSummary !== null && (
                                <View
                                    style={[
                                        styles.aiSummaryCard,
                                        {
                                            backgroundColor: colors.infoLight,
                                            borderColor: colors.info,
                                        },
                                    ]}
                                >
                                    <Text
                                        style={[styles.aiSummaryTitle, { color: colors.primary }]}
                                    >
                                        Analysis Summary
                                    </Text>
                                    {aiSummary.summary && typeof aiSummary.summary === "string" && (
                                        <Text
                                            style={[styles.aiSummaryText, { color: colors.text }]}
                                        >
                                            {aiSummary.summary}
                                        </Text>
                                    )}
                                    {aiSummary.keyInsights &&
                                        Array.isArray(aiSummary.keyInsights) &&
                                        aiSummary.keyInsights.length > 0 && (
                                            <View style={styles.aiInsightsContainer}>
                                                <Text
                                                    style={[
                                                        styles.aiInsightsTitle,
                                                        { color: colors.primary },
                                                    ]}
                                                >
                                                    Key Insights:
                                                </Text>
                                                {aiSummary.keyInsights.map(
                                                    (insight: string, i: number) => (
                                                        <Text
                                                            key={i}
                                                            style={[
                                                                styles.aiInsightItem,
                                                                { color: colors.text },
                                                            ]}
                                                        >
                                                            • {insight}
                                                        </Text>
                                                    )
                                                )}
                                            </View>
                                        )}
                                    {aiSummary.actionItems &&
                                        Array.isArray(aiSummary.actionItems) &&
                                        aiSummary.actionItems.length > 0 && (
                                            <View style={styles.aiInsightsContainer}>
                                                <Text
                                                    style={[
                                                        styles.aiInsightsTitle,
                                                        { color: colors.primary },
                                                    ]}
                                                >
                                                    Action Items:
                                                </Text>
                                                {aiSummary.actionItems.map(
                                                    (item: string, i: number) => (
                                                        <Text
                                                            key={i}
                                                            style={[
                                                                styles.aiInsightItem,
                                                                { color: colors.text },
                                                            ]}
                                                        >
                                                            • {item}
                                                        </Text>
                                                    )
                                                )}
                                            </View>
                                        )}
                                </View>
                            )}

                            {/* Market Sentiment */}
                            {marketSentiment && (
                                <View
                                    style={[
                                        styles.sentimentCard,
                                        {
                                            backgroundColor: colors.warningLight,
                                            borderColor: colors.warning,
                                        },
                                    ]}
                                >
                                    <Text
                                        style={[styles.sentimentTitle, { color: colors.warning }]}
                                    >
                                        Market Sentiment
                                    </Text>
                                    <View style={styles.sentimentRow}>
                                        <Text
                                            style={[styles.sentimentLabel, { color: colors.text }]}
                                        >
                                            Sentiment:
                                        </Text>
                                        <Text
                                            style={[
                                                styles.sentimentValue,
                                                {
                                                    color:
                                                        marketSentiment.sentiment === "bullish"
                                                            ? colors.success
                                                            : marketSentiment.sentiment ===
                                                                "bearish"
                                                              ? colors.error
                                                              : colors.text,
                                                },
                                            ]}
                                        >
                                            {marketSentiment.sentiment.toUpperCase()}
                                        </Text>
                                    </View>
                                    <View style={styles.sentimentRow}>
                                        <Text
                                            style={[styles.sentimentLabel, { color: colors.text }]}
                                        >
                                            Confidence:
                                        </Text>
                                        <Text
                                            style={[styles.sentimentValue, { color: colors.text }]}
                                        >
                                            {(marketSentiment.confidence * 100).toFixed(0)}%
                                        </Text>
                                    </View>
                                    <Text
                                        style={[styles.sentimentReasoning, { color: colors.text }]}
                                    >
                                        {marketSentiment.reasoning}
                                    </Text>
                                    {marketSentiment.indicators && (
                                        <View
                                            style={[
                                                styles.sentimentIndicators,
                                                { borderTopColor: colors.warning },
                                            ]}
                                        >
                                            <Text
                                                style={[
                                                    styles.sentimentIndicatorText,
                                                    { color: colors.text },
                                                ]}
                                            >
                                                Price Trend:{" "}
                                                {marketSentiment.indicators.priceTrend > 0
                                                    ? "+"
                                                    : ""}
                                                {marketSentiment.indicators.priceTrend.toFixed(2)}%
                                            </Text>
                                            <Text
                                                style={[
                                                    styles.sentimentIndicatorText,
                                                    { color: colors.text },
                                                ]}
                                            >
                                                Volatility:{" "}
                                                {(
                                                    marketSentiment.indicators.volatility * 100
                                                ).toFixed(1)}
                                                %
                                            </Text>
                                            <Text
                                                style={[
                                                    styles.sentimentIndicatorText,
                                                    { color: colors.text },
                                                ]}
                                            >
                                                Gas Trend: {marketSentiment.indicators.gasTrend}
                                            </Text>
                                        </View>
                                    )}
                                </View>
                            )}

                            {/* Fiat to Stablecoin Distribution Recommendations */}
                            {fiatRecs.length > 0 && (
                                <View
                                    style={[
                                        styles.sectionCard,
                                        {
                                            backgroundColor: colors.cardBackground,
                                            borderColor: colors.border,
                                        },
                                    ]}
                                >
                                    <Text style={[styles.sectionTitle, { color: colors.text }]}>
                                        Fiat to Stablecoin Distribution
                                    </Text>
                                    {fiatRecs.map((rec, idx) => {
                                        const enhancedRec =
                                            aiEnhancedRecs.find(
                                                (e: any) =>
                                                    e.type === rec.type &&
                                                    e.fiatCurrency === rec.fiatCurrency
                                            ) || rec;
                                        const recId = `${rec.type}-${rec.fiatCurrency}-${idx}`;

                                        return (
                                            <View
                                                key={idx}
                                                style={[
                                                    styles.recommendationCard,
                                                    { backgroundColor: colors.backgroundTertiary },
                                                ]}
                                            >
                                                <View style={styles.recommendationHeader}>
                                                    <View style={styles.recommendationHeaderLeft}>
                                                        <Text
                                                            style={[
                                                                styles.recommendationTitle,
                                                                { color: colors.text },
                                                            ]}
                                                        >
                                                            Convert{" "}
                                                            {rec.fiatAmount?.toLocaleString()}{" "}
                                                            {rec.fiatCurrency} to Stablecoins
                                                        </Text>
                                                        <Text
                                                            style={[
                                                                styles.recommendationReason,
                                                                { color: colors.textSecondary },
                                                            ]}
                                                        >
                                                            {rec.reason}
                                                        </Text>
                                                    </View>
                                                    <View
                                                        style={[
                                                            styles.priorityBadge,
                                                            rec.priority === "high"
                                                                ? {
                                                                      backgroundColor:
                                                                          colors.errorLight,
                                                                  }
                                                                : {
                                                                      backgroundColor:
                                                                          colors.warningLight,
                                                                  },
                                                        ]}
                                                    >
                                                        <Text
                                                            style={[
                                                                styles.priorityText,
                                                                { color: colors.text },
                                                            ]}
                                                        >
                                                            {rec.priority?.toUpperCase()}
                                                        </Text>
                                                    </View>
                                                </View>

                                                {/* Distribution Breakdown */}
                                                {rec.distribution &&
                                                    rec.distribution.length > 0 && (
                                                        <View
                                                            style={[
                                                                styles.distributionContainer,
                                                                {
                                                                    backgroundColor:
                                                                        colors.cardBackgroundSecondary,
                                                                    borderColor: colors.border,
                                                                },
                                                            ]}
                                                        >
                                                            <Text
                                                                style={[
                                                                    styles.distributionTitle,
                                                                    { color: colors.text },
                                                                ]}
                                                            >
                                                                Recommended Distribution:
                                                            </Text>
                                                            {rec.distribution.map(
                                                                (dist, distIdx) => (
                                                                    <View
                                                                        key={distIdx}
                                                                        style={[
                                                                            styles.distributionItem,
                                                                            {
                                                                                borderBottomColor:
                                                                                    colors.border,
                                                                            },
                                                                        ]}
                                                                    >
                                                                        <View
                                                                            style={
                                                                                styles.distributionHeader
                                                                            }
                                                                        >
                                                                            <Text
                                                                                style={[
                                                                                    styles.distributionStablecoin,
                                                                                    {
                                                                                        color: colors.text,
                                                                                    },
                                                                                ]}
                                                                            >
                                                                                {dist.stablecoin} on{" "}
                                                                                {dist.chain}
                                                                            </Text>
                                                                            <Text
                                                                                style={[
                                                                                    styles.distributionPercentage,
                                                                                    {
                                                                                        color: colors.primary,
                                                                                    },
                                                                                ]}
                                                                            >
                                                                                {dist.percentage.toFixed(
                                                                                    0
                                                                                )}
                                                                                %
                                                                            </Text>
                                                                        </View>
                                                                        <Text
                                                                            style={[
                                                                                styles.distributionAmount,
                                                                                {
                                                                                    color: colors.textSecondary,
                                                                                },
                                                                            ]}
                                                                        >
                                                                            $
                                                                            {dist.amountUSD.toFixed(
                                                                                2
                                                                            )}{" "}
                                                                            USD
                                                                        </Text>
                                                                        <Text
                                                                            style={[
                                                                                styles.distributionReason,
                                                                                {
                                                                                    color: colors.textSecondary,
                                                                                },
                                                                            ]}
                                                                        >
                                                                            {dist.reason}
                                                                        </Text>
                                                                    </View>
                                                                )
                                                            )}
                                                        </View>
                                                    )}

                                                <View style={styles.statsGrid}>
                                                    <View style={styles.statItem}>
                                                        <Text style={styles.statLabel}>
                                                            Total Conversion Fee
                                                        </Text>
                                                        <Text style={styles.statValue}>
                                                            {rec.totalConversionFee}
                                                        </Text>
                                                    </View>
                                                    <View style={styles.statItem}>
                                                        <Text style={styles.statLabel}>
                                                            6-Month Savings
                                                        </Text>
                                                        <Text style={styles.statValue}>
                                                            ${rec.estimatedSavings6Months}
                                                        </Text>
                                                    </View>
                                                </View>

                                                {/* AI Explanation */}
                                                {enhancedRec.aiExplanation && (
                                                    <View
                                                        style={[
                                                            styles.aiExplanationCard,
                                                            {
                                                                backgroundColor:
                                                                    colors.cardBackgroundSecondary,
                                                                borderLeftColor: colors.primary,
                                                            },
                                                        ]}
                                                    >
                                                        <Text
                                                            style={[
                                                                styles.aiExplanationLabel,
                                                                { color: colors.textSecondary },
                                                            ]}
                                                        >
                                                            AI Explanation:
                                                        </Text>
                                                        <MarkdownText
                                                            style={[
                                                                styles.aiExplanationText,
                                                                { color: colors.text },
                                                            ]}
                                                        >
                                                            {enhancedRec.aiExplanation}
                                                        </MarkdownText>
                                                    </View>
                                                )}
                                            </View>
                                        );
                                    })}
                                </View>
                            )}

                            {/* Stablecoin Recommendations */}
                            {stablecoinRecs.length > 0 && (
                                <View
                                    style={[
                                        styles.sectionCard,
                                        {
                                            backgroundColor: colors.cardBackground,
                                            borderColor: colors.border,
                                        },
                                    ]}
                                >
                                    <Text style={[styles.sectionTitle, { color: colors.text }]}>
                                        Stablecoin Optimization
                                    </Text>
                                    {stablecoinRecs.map((rec, idx) => {
                                        const enhancedRec =
                                            aiEnhancedRecs.find(
                                                (e: any) =>
                                                    e.type === rec.type &&
                                                    e.from === rec.from &&
                                                    e.to === rec.to
                                            ) || rec;
                                        const recId = `${rec.type}-${rec.from}-${rec.to}-${idx}`;

                                        return (
                                            <View
                                                key={idx}
                                                style={[
                                                    styles.recommendationCard,
                                                    { backgroundColor: colors.backgroundTertiary },
                                                ]}
                                            >
                                                <View style={styles.recommendationHeader}>
                                                    <View style={styles.recommendationHeaderLeft}>
                                                        <Text
                                                            style={[
                                                                styles.recommendationTitle,
                                                                { color: colors.text },
                                                            ]}
                                                        >
                                                            Switch from {rec.from} → {rec.to} on{" "}
                                                            {rec.chain}
                                                        </Text>
                                                        <Text
                                                            style={[
                                                                styles.recommendationReason,
                                                                { color: colors.textSecondary },
                                                            ]}
                                                        >
                                                            {rec.reason}
                                                        </Text>
                                                    </View>
                                                    <View
                                                        style={[
                                                            styles.priorityBadge,
                                                            rec.priority === "high"
                                                                ? {
                                                                      backgroundColor:
                                                                          colors.errorLight,
                                                                  }
                                                                : {
                                                                      backgroundColor:
                                                                          colors.warningLight,
                                                                  },
                                                        ]}
                                                    >
                                                        <Text
                                                            style={[
                                                                styles.priorityText,
                                                                { color: colors.text },
                                                            ]}
                                                        >
                                                            {rec.priority?.toUpperCase()}
                                                        </Text>
                                                    </View>
                                                </View>
                                                <View style={styles.statsGrid}>
                                                    <View style={styles.statItem}>
                                                        <Text
                                                            style={[
                                                                styles.statLabel,
                                                                { color: colors.textSecondary },
                                                            ]}
                                                        >
                                                            Monthly Savings
                                                        </Text>
                                                        <Text
                                                            style={[
                                                                styles.statValue,
                                                                { color: colors.text },
                                                            ]}
                                                        >
                                                            ${rec.monthlySavings}
                                                        </Text>
                                                    </View>
                                                    <View style={styles.statItem}>
                                                        <Text
                                                            style={[
                                                                styles.statLabel,
                                                                { color: colors.textSecondary },
                                                            ]}
                                                        >
                                                            Fee Improvement
                                                        </Text>
                                                        <Text
                                                            style={[
                                                                styles.statValue,
                                                                { color: colors.text },
                                                            ]}
                                                        >
                                                            {rec.details?.currentFee} →{" "}
                                                            {rec.details?.newFee}
                                                        </Text>
                                                    </View>
                                                    <View style={styles.statItem}>
                                                        <Text
                                                            style={[
                                                                styles.statLabel,
                                                                { color: colors.textSecondary },
                                                            ]}
                                                        >
                                                            6-Month Profit
                                                        </Text>
                                                        <Text
                                                            style={[
                                                                styles.statValue,
                                                                { color: colors.text },
                                                            ]}
                                                        >
                                                            ${rec.sixMonthSavings}
                                                        </Text>
                                                    </View>
                                                </View>
                                                {rec.details?.regionalFit && (
                                                    <Text style={styles.reasonText}>
                                                        ✓ {rec.details.regionalFit.join(" • ")}
                                                    </Text>
                                                )}

                                                {/* AI Explanation */}
                                                {enhancedRec.aiExplanation && (
                                                    <View
                                                        style={[
                                                            styles.aiExplanationCard,
                                                            {
                                                                backgroundColor:
                                                                    colors.cardBackgroundSecondary,
                                                                borderLeftColor: colors.primary,
                                                            },
                                                        ]}
                                                    >
                                                        <Text
                                                            style={[
                                                                styles.aiExplanationLabel,
                                                                { color: colors.textSecondary },
                                                            ]}
                                                        >
                                                            🤖 AI Explanation:
                                                        </Text>
                                                        <Text
                                                            style={[
                                                                styles.aiExplanationText,
                                                                { color: colors.text },
                                                            ]}
                                                        >
                                                            {enhancedRec.aiExplanation}
                                                        </Text>
                                                    </View>
                                                )}

                                                {/* AI Insights */}
                                                {enhancedRec.aiInsights &&
                                                    enhancedRec.aiInsights.length > 0 && (
                                                        <View style={styles.aiInsightsList}>
                                                            {enhancedRec.aiInsights.map(
                                                                (insight: string, i: number) => (
                                                                    <Text
                                                                        key={i}
                                                                        style={[
                                                                            styles.aiInsightText,
                                                                            {
                                                                                color: colors.textSecondary,
                                                                            },
                                                                        ]}
                                                                    >
                                                                        💡 {insight}
                                                                    </Text>
                                                                )
                                                            )}
                                                        </View>
                                                    )}

                                                {/* User Feedback Buttons */}
                                                <View style={styles.feedbackButtons}>
                                                    <Pressable
                                                        style={[
                                                            styles.feedbackButton,
                                                            {
                                                                backgroundColor:
                                                                    colors.successLight,
                                                                borderColor: colors.success,
                                                            },
                                                        ]}
                                                        onPress={() =>
                                                            handleUserFeedback(
                                                                recId,
                                                                rec.type || "switch_stablecoin",
                                                                "accepted"
                                                            )
                                                        }
                                                    >
                                                        <Text
                                                            style={[
                                                                styles.feedbackButtonText,
                                                                { color: colors.text },
                                                            ]}
                                                        >
                                                            ✓ Helpful
                                                        </Text>
                                                    </Pressable>
                                                    <Pressable
                                                        style={[
                                                            styles.feedbackButton,
                                                            {
                                                                backgroundColor: colors.errorLight,
                                                                borderColor: colors.error,
                                                            },
                                                        ]}
                                                        onPress={() =>
                                                            handleUserFeedback(
                                                                recId,
                                                                rec.type || "switch_stablecoin",
                                                                "rejected"
                                                            )
                                                        }
                                                    >
                                                        <Text
                                                            style={[
                                                                styles.feedbackButtonText,
                                                                { color: colors.text },
                                                            ]}
                                                        >
                                                            ✗ Not helpful
                                                        </Text>
                                                    </Pressable>
                                                </View>
                                            </View>
                                        );
                                    })}
                                </View>
                            )}

                            {/* Conversion Timing Recommendations */}
                            {conversionRecs.length > 0 && (
                                <View
                                    style={[
                                        styles.sectionCard,
                                        {
                                            backgroundColor: colors.cardBackground,
                                            borderColor: colors.border,
                                        },
                                    ]}
                                >
                                    <Text style={[styles.sectionTitle, { color: colors.text }]}>
                                        Optimal Conversion Timing
                                    </Text>
                                    {conversionRecs.map((rec, idx) => (
                                        <View
                                            key={idx}
                                            style={[
                                                styles.timingCard,
                                                {
                                                    borderLeftColor: colors.success,
                                                    backgroundColor: colors.successLight,
                                                },
                                            ]}
                                        >
                                            <View style={styles.timingHeader}>
                                                <View style={styles.timingHeaderLeft}>
                                                    <Text
                                                        style={[
                                                            styles.timingTitle,
                                                            { color: colors.text },
                                                        ]}
                                                    >
                                                        {rec.amount?.toFixed(0)} {rec.token} → Fiat
                                                    </Text>
                                                    <Text
                                                        style={[
                                                            styles.timingReason,
                                                            { color: colors.textSecondary },
                                                        ]}
                                                    >
                                                        {rec.reason}
                                                    </Text>
                                                </View>
                                                <View
                                                    style={[
                                                        styles.timingBadge,
                                                        rec.timing === "urgent"
                                                            ? { backgroundColor: colors.errorLight }
                                                            : rec.timing === "wait"
                                                              ? {
                                                                    backgroundColor:
                                                                        colors.warningLight,
                                                                }
                                                              : {
                                                                    backgroundColor:
                                                                        colors.successLight,
                                                                },
                                                    ]}
                                                >
                                                    <Text
                                                        style={[
                                                            styles.timingBadgeText,
                                                            { color: colors.text },
                                                        ]}
                                                    >
                                                        {rec.timing === "wait"
                                                            ? "WAIT FOR BETTER RATE"
                                                            : rec.timing === "urgent"
                                                              ? "CONVERT NOW"
                                                              : "GOOD TIME NOW"}
                                                    </Text>
                                                </View>
                                            </View>
                                            <View
                                                style={[
                                                    styles.timingAdviceCard,
                                                    { backgroundColor: colors.cardBackground },
                                                ]}
                                            >
                                                <Text
                                                    style={[
                                                        styles.timingAdviceTitle,
                                                        { color: colors.text },
                                                    ]}
                                                >
                                                    💡 {rec.timingAdvice?.recommendation}
                                                </Text>
                                                <View style={styles.timingAdviceGrid}>
                                                    <View style={styles.timingAdviceItem}>
                                                        <Text
                                                            style={[
                                                                styles.timingAdviceLabel,
                                                                { color: colors.textSecondary },
                                                            ]}
                                                        >
                                                            Best time to convert
                                                        </Text>
                                                        <Text
                                                            style={[
                                                                styles.timingAdviceValue,
                                                                { color: colors.text },
                                                            ]}
                                                        >
                                                            {rec.timingAdvice?.bestTime}
                                                        </Text>
                                                    </View>
                                                    {rec.timingAdvice?.potentialSavings && (
                                                        <View style={styles.timingAdviceItem}>
                                                            <Text
                                                                style={[
                                                                    styles.timingAdviceLabel,
                                                                    { color: colors.textSecondary },
                                                                ]}
                                                            >
                                                                Potential savings by waiting
                                                            </Text>
                                                            <Text
                                                                style={[
                                                                    styles.timingAdviceValue,
                                                                    { color: colors.success },
                                                                ]}
                                                            >
                                                                ${rec.timingAdvice.potentialSavings}
                                                            </Text>
                                                        </View>
                                                    )}
                                                </View>
                                                <Text
                                                    style={[
                                                        styles.timingPercentile,
                                                        { color: colors.textSecondary },
                                                    ]}
                                                >
                                                    {rec.timingAdvice?.currentPercentile}
                                                </Text>
                                            </View>
                                        </View>
                                    ))}
                                </View>
                            )}

                            {/* Current Holdings Analysis */}
                            <View
                                style={[
                                    styles.sectionCard,
                                    {
                                        backgroundColor: colors.cardBackground,
                                        borderColor: colors.border,
                                    },
                                ]}
                            >
                                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                                    Current Holdings Analysis
                                </Text>
                                {results.analysis.map((item, idx) => (
                                    <View
                                        key={idx}
                                        style={[styles.holdingCard, { borderColor: colors.border }]}
                                    >
                                        <View style={styles.holdingHeader}>
                                            <View style={styles.holdingHeaderLeft}>
                                                <View style={styles.holdingTitleRow}>
                                                    <Text
                                                        style={[
                                                            styles.holdingChain,
                                                            { color: colors.text },
                                                        ]}
                                                    >
                                                        {item.chain}
                                                    </Text>
                                                    <View
                                                        style={[
                                                            styles.tokenBadge,
                                                            {
                                                                backgroundColor:
                                                                    colors.primaryLight,
                                                            },
                                                        ]}
                                                    >
                                                        <Text
                                                            style={[
                                                                styles.tokenBadgeText,
                                                                { color: colors.primary },
                                                            ]}
                                                        >
                                                            {item.currentToken}
                                                        </Text>
                                                    </View>
                                                </View>
                                                <Text
                                                    style={[
                                                        styles.holdingAmount,
                                                        { color: colors.primary },
                                                    ]}
                                                >
                                                    ${item.amount.toFixed(2)}
                                                </Text>
                                            </View>
                                            <View style={styles.holdingCost}>
                                                <Text
                                                    style={[
                                                        styles.holdingCostLabel,
                                                        { color: colors.textSecondary },
                                                    ]}
                                                >
                                                    Monthly Cost
                                                </Text>
                                                <Text
                                                    style={[
                                                        styles.holdingCostValue,
                                                        { color: colors.text },
                                                    ]}
                                                >
                                                    ${item.predictedMonthlyCost.toFixed(2)}
                                                </Text>
                                            </View>
                                        </View>

                                        {item.currentToken !== item.recommendedStablecoin.name && (
                                            <View
                                                style={[
                                                    styles.switchWarning,
                                                    {
                                                        backgroundColor: colors.warningLight,
                                                        borderColor: colors.warning,
                                                    },
                                                ]}
                                            >
                                                <Text
                                                    style={[
                                                        styles.switchWarningText,
                                                        { color: colors.warning },
                                                    ]}
                                                >
                                                    ⚠️ Consider switching to{" "}
                                                    {item.recommendedStablecoin.name}
                                                </Text>
                                                <Text
                                                    style={[
                                                        styles.switchWarningSubtext,
                                                        { color: colors.text },
                                                    ]}
                                                >
                                                    {item.recommendedStablecoin.reasons.join(" • ")}
                                                </Text>
                                            </View>
                                        )}

                                        <View style={styles.holdingStats}>
                                            <View style={styles.holdingStat}>
                                                <Text
                                                    style={[
                                                        styles.holdingStatLabel,
                                                        { color: colors.textSecondary },
                                                    ]}
                                                >
                                                    Avg Gas
                                                </Text>
                                                <Text
                                                    style={[
                                                        styles.holdingStatValue,
                                                        { color: colors.text },
                                                    ]}
                                                >
                                                    ${item.avgGasCost.toFixed(4)}
                                                </Text>
                                            </View>
                                            <View style={styles.holdingStat}>
                                                <Text
                                                    style={[
                                                        styles.holdingStatLabel,
                                                        { color: colors.textSecondary },
                                                    ]}
                                                >
                                                    Current Gas
                                                </Text>
                                                <Text
                                                    style={[
                                                        styles.holdingStatValue,
                                                        { color: colors.text },
                                                    ]}
                                                >
                                                    ${item.currentGasCost.toFixed(4)}
                                                </Text>
                                            </View>
                                            <View style={styles.holdingStat}>
                                                <Text
                                                    style={[
                                                        styles.holdingStatLabel,
                                                        { color: colors.textSecondary },
                                                    ]}
                                                >
                                                    Volatility
                                                </Text>
                                                <Text
                                                    style={[
                                                        styles.holdingStatValue,
                                                        { color: colors.text },
                                                    ]}
                                                >
                                                    {(item.volatility * 100).toFixed(1)}%
                                                </Text>
                                            </View>
                                            <View style={styles.holdingStat}>
                                                <Text
                                                    style={[
                                                        styles.holdingStatLabel,
                                                        { color: colors.textSecondary },
                                                    ]}
                                                >
                                                    Cost/Balance
                                                </Text>
                                                <Text
                                                    style={[
                                                        styles.holdingStatValue,
                                                        { color: colors.text },
                                                    ]}
                                                >
                                                    {item.costPercentage.toFixed(2)}%
                                                </Text>
                                            </View>
                                        </View>
                                    </View>
                                ))}
                            </View>

                            {/* Bridge Recommendations */}
                            {bridgeRecs.length > 0 && (
                                <View
                                    style={[
                                        styles.sectionCard,
                                        {
                                            backgroundColor: colors.cardBackground,
                                            borderColor: colors.border,
                                        },
                                    ]}
                                >
                                    <Text style={[styles.sectionTitle, { color: colors.text }]}>
                                        Bridge Recommendations
                                    </Text>
                                    {bridgeRecs.map((rec, idx) => (
                                        <View
                                            key={idx}
                                            style={[
                                                styles.bridgeCard,
                                                {
                                                    borderLeftColor: colors.primary,
                                                    backgroundColor: colors.primaryLight,
                                                },
                                            ]}
                                        >
                                            <View style={styles.bridgeHeader}>
                                                <Text
                                                    style={[
                                                        styles.bridgeTitle,
                                                        { color: colors.text },
                                                    ]}
                                                >
                                                    Bridge ${rec.amount?.toFixed(2)} from {rec.from}{" "}
                                                    → {rec.to}
                                                </Text>
                                                <View
                                                    style={[
                                                        styles.priorityBadge,
                                                        rec.priority === "high"
                                                            ? { backgroundColor: colors.errorLight }
                                                            : {
                                                                  backgroundColor:
                                                                      colors.warningLight,
                                                              },
                                                    ]}
                                                >
                                                    <Text
                                                        style={[
                                                            styles.priorityText,
                                                            { color: colors.text },
                                                        ]}
                                                    >
                                                        {rec.priority?.toUpperCase()}
                                                    </Text>
                                                </View>
                                            </View>
                                            <View
                                                style={[
                                                    styles.bridgeStats,
                                                    { backgroundColor: colors.cardBackground },
                                                ]}
                                            >
                                                <View style={styles.bridgeStat}>
                                                    <Text
                                                        style={[
                                                            styles.bridgeStatLabel,
                                                            { color: colors.textSecondary },
                                                        ]}
                                                    >
                                                        Cost
                                                    </Text>
                                                    <Text
                                                        style={[
                                                            styles.bridgeStatValue,
                                                            { color: colors.text },
                                                        ]}
                                                    >
                                                        ${rec.cost}
                                                    </Text>
                                                </View>
                                                <View style={styles.bridgeStat}>
                                                    <Text
                                                        style={[
                                                            styles.bridgeStatLabel,
                                                            { color: colors.textSecondary },
                                                        ]}
                                                    >
                                                        Monthly Savings
                                                    </Text>
                                                    <Text
                                                        style={[
                                                            styles.bridgeStatValue,
                                                            { color: colors.success },
                                                        ]}
                                                    >
                                                        ${rec.monthlySavings}
                                                    </Text>
                                                </View>
                                                <View style={styles.bridgeStat}>
                                                    <Text
                                                        style={[
                                                            styles.bridgeStatLabel,
                                                            { color: colors.textSecondary },
                                                        ]}
                                                    >
                                                        Break Even
                                                    </Text>
                                                    <Text
                                                        style={[
                                                            styles.bridgeStatValue,
                                                            { color: colors.text },
                                                        ]}
                                                    >
                                                        {rec.breakEvenMonths}mo
                                                    </Text>
                                                </View>
                                                <View style={styles.bridgeStat}>
                                                    <Text
                                                        style={[
                                                            styles.bridgeStatLabel,
                                                            { color: colors.textSecondary },
                                                        ]}
                                                    >
                                                        6-Month Profit
                                                    </Text>
                                                    <Text
                                                        style={[
                                                            styles.bridgeStatValue,
                                                            { color: colors.success },
                                                        ]}
                                                    >
                                                        ${rec.sixMonthSavings}
                                                    </Text>
                                                </View>
                                            </View>
                                            {rec.timingAdvice && (
                                                <Text
                                                    style={[
                                                        styles.bridgeAdvice,
                                                        { color: colors.text },
                                                    ]}
                                                >
                                                    💡{" "}
                                                    {typeof rec.timingAdvice === "string"
                                                        ? rec.timingAdvice
                                                        : rec.timingAdvice.recommendation ||
                                                          "Timing advice available"}
                                                </Text>
                                            )}
                                        </View>
                                    ))}
                                </View>
                            )}

                            {/* Timing Insights */}
                            {timingInsights && (
                                <View
                                    style={[
                                        styles.sectionCard,
                                        {
                                            backgroundColor: colors.cardBackground,
                                            borderColor: colors.border,
                                        },
                                    ]}
                                >
                                    <Text style={[styles.sectionTitle, { color: colors.text }]}>
                                        Market Timing Insights
                                    </Text>
                                    {timingInsights.insights?.map((insight, idx) => (
                                        <View
                                            key={idx}
                                            style={[
                                                styles.insightCard,
                                                { borderColor: colors.border },
                                            ]}
                                        >
                                            <Text
                                                style={[
                                                    styles.insightChain,
                                                    { color: colors.text },
                                                ]}
                                            >
                                                {insight.chain}
                                            </Text>
                                            <View style={styles.insightRow}>
                                                <Text
                                                    style={[
                                                        styles.insightLabel,
                                                        { color: colors.textSecondary },
                                                    ]}
                                                >
                                                    Best day:
                                                </Text>
                                                <Text
                                                    style={[
                                                        styles.insightValue,
                                                        { color: colors.success },
                                                    ]}
                                                >
                                                    {insight.bestDay}
                                                </Text>
                                            </View>
                                            <View style={styles.insightRow}>
                                                <Text
                                                    style={[
                                                        styles.insightLabel,
                                                        { color: colors.textSecondary },
                                                    ]}
                                                >
                                                    Worst day:
                                                </Text>
                                                <Text
                                                    style={[
                                                        styles.insightValue,
                                                        { color: colors.error },
                                                    ]}
                                                >
                                                    {insight.worstDay}
                                                </Text>
                                            </View>
                                            <View style={styles.insightRow}>
                                                <Text
                                                    style={[
                                                        styles.insightLabel,
                                                        { color: colors.textSecondary },
                                                    ]}
                                                >
                                                    Best time:
                                                </Text>
                                                <Text
                                                    style={[
                                                        styles.insightValue,
                                                        { color: colors.text },
                                                    ]}
                                                >
                                                    {insight.bestTimeOfDay}
                                                </Text>
                                            </View>
                                            <View style={styles.insightRow}>
                                                <Text
                                                    style={[
                                                        styles.insightLabel,
                                                        { color: colors.textSecondary },
                                                    ]}
                                                >
                                                    Avoid:
                                                </Text>
                                                <Text
                                                    style={[
                                                        styles.insightValue,
                                                        { color: colors.text },
                                                    ]}
                                                >
                                                    {insight.avoidTimeOfDay}
                                                </Text>
                                            </View>
                                            <View
                                                style={[
                                                    styles.insightDivider,
                                                    { backgroundColor: colors.border },
                                                ]}
                                            />
                                            <Text
                                                style={[
                                                    styles.insightRecommendation,
                                                    { color: colors.text },
                                                ]}
                                            >
                                                {insight.weekendVsWeekday}
                                            </Text>
                                            {insight.volatilityWarning && (
                                                <View
                                                    style={[
                                                        styles.volatilityWarning,
                                                        {
                                                            backgroundColor: colors.warningLight,
                                                            borderColor: colors.warning,
                                                        },
                                                    ]}
                                                >
                                                    <Text
                                                        style={[
                                                            styles.volatilityWarningText,
                                                            { color: colors.warning },
                                                        ]}
                                                    >
                                                        ⚠️ {insight.volatilityWarning}
                                                    </Text>
                                                </View>
                                            )}
                                        </View>
                                    ))}
                                </View>
                            )}

                            {/* Total Savings */}
                            {results.totalPotentialSavings > 0 && (
                                <View
                                    style={[
                                        styles.savingsCard,
                                        { backgroundColor: colors.success },
                                    ]}
                                >
                                    <Text
                                        style={[styles.savingsTitle, { color: colors.textInverse }]}
                                    >
                                        Total Potential Savings
                                    </Text>
                                    <Text
                                        style={[
                                            styles.savingsAmount,
                                            { color: colors.textInverse },
                                        ]}
                                    >
                                        ${results.totalPotentialSavings.toFixed(2)}
                                    </Text>
                                    <Text
                                        style={[
                                            styles.savingsSubtitle,
                                            { color: colors.textInverse },
                                        ]}
                                    >
                                        Over 6 months by optimizing your stablecoins, timing, and
                                        network selection
                                    </Text>
                                    <Text
                                        style={[styles.savingsNote, { color: colors.textInverse }]}
                                    >
                                        * Based on 90 days of real market data from{" "}
                                        {dataSource || "CoinGecko API"}
                                    </Text>
                                </View>
                            )}

                            {/* Interactive Q&A */}
                            <View
                                style={[
                                    styles.qaSection,
                                    {
                                        backgroundColor: colors.cardBackground,
                                        borderColor: colors.border,
                                    },
                                ]}
                            >
                                <Text style={[styles.qaTitle, { color: colors.text }]}>
                                    Ask about your portfolio
                                </Text>
                                <TextInput
                                    value={question}
                                    onChangeText={setQuestion}
                                    placeholder="e.g., Should I switch to USDT?"
                                    style={[
                                        styles.qaInput,
                                        {
                                            backgroundColor: colors.inputBackground,
                                            borderColor: colors.inputBorder,
                                            color: colors.inputText,
                                        },
                                    ]}
                                    placeholderTextColor={colors.inputPlaceholder}
                                    multiline
                                />
                                <Pressable
                                    style={[
                                        styles.qaButton,
                                        { backgroundColor: colors.buttonPrimary },
                                        answering && {
                                            backgroundColor: colors.buttonDisabled,
                                            opacity: 0.6,
                                        },
                                    ]}
                                    onPress={handleAskQuestion}
                                    disabled={answering || !question.trim()}
                                >
                                    <Text
                                        style={[
                                            styles.qaButtonText,
                                            { color: colors.buttonPrimaryText },
                                        ]}
                                    >
                                        {answering ? "Thinking..." : "Ask AI"}
                                    </Text>
                                </Pressable>
                                {aiAnswer && (
                                    <View
                                        style={[
                                            styles.qaAnswer,
                                            {
                                                backgroundColor: colors.primaryLight,
                                                borderLeftColor: colors.primary,
                                            },
                                        ]}
                                    >
                                        <Text
                                            style={[
                                                styles.qaAnswerLabel,
                                                { color: colors.primary },
                                            ]}
                                        >
                                            AI Answer:
                                        </Text>
                                        <MarkdownText
                                            style={[styles.qaAnswerText, { color: colors.text }]}
                                        >
                                            {aiAnswer}
                                        </MarkdownText>
                                    </View>
                                )}
                            </View>
                        </>
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
        gap: 16,
    },
    loadingContainer: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        gap: 16,
    },
    loadingText: {
        fontSize: 18,
        fontWeight: "600",
    },
    loadingSubtext: {
        fontSize: 14,
        textAlign: "center",
        paddingHorizontal: 32,
    },
    errorContainer: {
        padding: 32,
        alignItems: "center",
        gap: 16,
    },
    errorTitle: {
        fontSize: 24,
        fontWeight: "bold",
    },
    errorMessage: {
        fontSize: 16,
        textAlign: "center",
    },
    retryButton: {
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 8,
    },
    retryButtonText: {
        fontSize: 16,
        fontWeight: "600",
    },
    headerCard: {
        padding: 24,
        borderRadius: 12,
        borderWidth: 1,
        gap: 12,
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: "bold",
    },
    headerSubtitle: {
        fontSize: 14,
    },
    generateButton: {
        marginTop: 8,
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: "center",
    },
    generateButtonText: {
        fontSize: 16,
        fontWeight: "600",
    },
    sectionCard: {
        borderRadius: 12,
        borderWidth: 1,
        padding: 16,
        gap: 12,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: "600",
        marginBottom: 4,
    },
    recommendationCard: {
        borderRadius: 8,
        padding: 16,
        gap: 12,
    },
    recommendationHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
    },
    recommendationHeaderLeft: {
        flex: 1,
    },
    recommendationTitle: {
        fontSize: 18,
        fontWeight: "600",
    },
    recommendationReason: {
        fontSize: 14,
        marginTop: 4,
    },
    priorityBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
    },
    priorityText: {
        fontSize: 10,
        fontWeight: "bold",
    },
    statsGrid: {
        flexDirection: "row",
        gap: 12,
        marginTop: 8,
    },
    statItem: {
        flex: 1,
    },
    statLabel: {
        fontSize: 12,
        marginBottom: 4,
    },
    statValue: {
        fontSize: 16,
        fontWeight: "600",
    },
    reasonText: {
        fontSize: 12,
        marginTop: 4,
    },
    timingCard: {
        borderLeftWidth: 4,
        borderRadius: 8,
        padding: 16,
        gap: 12,
    },
    timingHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
    },
    timingHeaderLeft: {
        flex: 1,
    },
    timingTitle: {
        fontSize: 16,
        fontWeight: "600",
    },
    timingReason: {
        fontSize: 14,
        marginTop: 4,
    },
    timingBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
    },
    timingBadgeText: {
        fontSize: 10,
        fontWeight: "bold",
    },
    timingAdviceCard: {
        borderRadius: 8,
        padding: 16,
        gap: 12,
    },
    timingAdviceTitle: {
        fontSize: 16,
        fontWeight: "600",
    },
    timingAdviceGrid: {
        flexDirection: "row",
        gap: 16,
    },
    timingAdviceItem: {
        flex: 1,
    },
    timingAdviceLabel: {
        fontSize: 12,
        marginBottom: 4,
    },
    timingAdviceValue: {
        fontSize: 14,
        fontWeight: "600",
    },
    timingPercentile: {
        fontSize: 12,
        marginTop: 4,
    },
    holdingCard: {
        borderWidth: 1,
        borderRadius: 8,
        padding: 16,
        gap: 12,
    },
    holdingHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
    },
    holdingHeaderLeft: {
        flex: 1,
    },
    holdingTitleRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        marginBottom: 8,
    },
    holdingChain: {
        fontSize: 16,
        fontWeight: "600",
        textTransform: "capitalize",
    },
    tokenBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    tokenBadgeText: {
        fontSize: 12,
        fontWeight: "600",
    },
    holdingAmount: {
        fontSize: 24,
        fontWeight: "bold",
    },
    holdingCost: {
        alignItems: "flex-end",
    },
    holdingCostLabel: {
        fontSize: 12,
        marginBottom: 4,
    },
    holdingCostValue: {
        fontSize: 20,
        fontWeight: "bold",
    },
    switchWarning: {
        borderWidth: 1,
        borderRadius: 8,
        padding: 12,
    },
    switchWarningText: {
        fontSize: 14,
        fontWeight: "500",
    },
    switchWarningSubtext: {
        fontSize: 12,
        marginTop: 4,
    },
    holdingStats: {
        flexDirection: "row",
        gap: 12,
    },
    holdingStat: {
        flex: 1,
    },
    holdingStatLabel: {
        fontSize: 12,
        marginBottom: 4,
    },
    holdingStatValue: {
        fontSize: 14,
        fontWeight: "600",
    },
    bridgeCard: {
        borderLeftWidth: 4,
        borderRadius: 8,
        padding: 16,
        gap: 12,
    },
    bridgeHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
    },
    bridgeTitle: {
        fontSize: 16,
        fontWeight: "600",
        flex: 1,
    },
    bridgeStats: {
        flexDirection: "row",
        gap: 12,
        borderRadius: 8,
        padding: 12,
    },
    bridgeStat: {
        flex: 1,
    },
    bridgeStatLabel: {
        fontSize: 12,
        marginBottom: 4,
    },
    bridgeStatValue: {
        fontSize: 14,
        fontWeight: "600",
    },
    bridgeAdvice: {
        fontSize: 14,
    },
    insightCard: {
        borderWidth: 1,
        borderRadius: 8,
        padding: 16,
        gap: 8,
    },
    insightChain: {
        fontSize: 16,
        fontWeight: "600",
        textTransform: "capitalize",
        marginBottom: 4,
    },
    insightRow: {
        flexDirection: "row",
        justifyContent: "space-between",
    },
    insightLabel: {
        fontSize: 14,
    },
    insightValue: {
        fontSize: 14,
        fontWeight: "600",
    },
    insightDivider: {
        height: 1,
        marginVertical: 8,
    },
    insightRecommendation: {
        fontSize: 14,
    },
    volatilityWarning: {
        borderWidth: 1,
        borderRadius: 6,
        padding: 8,
        marginTop: 8,
    },
    volatilityWarningText: {
        fontSize: 12,
    },
    savingsCard: {
        borderRadius: 12,
        padding: 24,
        alignItems: "center",
        gap: 8,
    },
    savingsTitle: {
        fontSize: 20,
        fontWeight: "600",
    },
    savingsAmount: {
        fontSize: 48,
        fontWeight: "bold",
    },
    savingsSubtitle: {
        fontSize: 16,
        textAlign: "center",
    },
    savingsNote: {
        fontSize: 12,
        marginTop: 8,
        textAlign: "center",
    },
    aiSummaryCard: {
        borderRadius: 12,
        padding: 20,
        borderWidth: 1,
        marginBottom: 16,
    },
    aiSummaryTitle: {
        fontSize: 20,
        fontWeight: "bold",
        marginBottom: 12,
    },
    aiSummaryText: {
        fontSize: 15,
        lineHeight: 22,
        marginBottom: 12,
    },
    aiInsightsContainer: {
        marginTop: 12,
    },
    aiInsightsTitle: {
        fontSize: 14,
        fontWeight: "600",
        marginBottom: 8,
    },
    aiInsightItem: {
        fontSize: 14,
        marginLeft: 8,
        marginBottom: 4,
    },
    sentimentCard: {
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        marginBottom: 16,
    },
    sentimentTitle: {
        fontSize: 18,
        fontWeight: "bold",
        marginBottom: 12,
    },
    sentimentRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 8,
    },
    sentimentLabel: {
        fontSize: 14,
        fontWeight: "600",
    },
    sentimentValue: {
        fontSize: 14,
        fontWeight: "bold",
    },
    sentimentReasoning: {
        fontSize: 13,
        marginTop: 8,
        lineHeight: 18,
    },
    sentimentIndicators: {
        marginTop: 12,
        paddingTop: 12,
        borderTopWidth: 1,
    },
    sentimentIndicatorText: {
        fontSize: 12,
        marginBottom: 4,
    },
    aiExplanationCard: {
        borderRadius: 8,
        padding: 12,
        marginTop: 12,
        borderLeftWidth: 3,
    },
    aiExplanationLabel: {
        fontSize: 12,
        fontWeight: "600",
        marginBottom: 6,
    },
    aiExplanationText: {
        fontSize: 14,
        lineHeight: 20,
    },
    aiInsightsList: {
        marginTop: 8,
    },
    aiInsightText: {
        fontSize: 13,
        color: "#6B7280",
        marginBottom: 4,
        lineHeight: 18,
    },
    feedbackButtons: {
        flexDirection: "row",
        gap: 8,
        marginTop: 12,
    },
    feedbackButton: {
        flex: 1,
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 6,
        alignItems: "center",
    },
    feedbackButtonPositive: {
        backgroundColor: "#DCFCE7",
        borderWidth: 1,
        borderColor: "#22C55E",
    },
    feedbackButtonNegative: {
        backgroundColor: "#FEE2E2",
        borderWidth: 1,
        borderColor: "#EF4444",
    },
    feedbackButtonText: {
        fontSize: 12,
        fontWeight: "600",
        color: "#29343D",
    },
    qaSection: {
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        marginTop: 16,
    },
    qaTitle: {
        fontSize: 18,
        fontWeight: "bold",
        marginBottom: 12,
    },
    qaInput: {
        borderWidth: 1,
        borderRadius: 8,
        padding: 12,
        fontSize: 14,
        minHeight: 60,
        marginBottom: 12,
        textAlignVertical: "top",
    },
    qaButton: {
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: "center",
    },
    qaButtonText: {
        fontSize: 16,
        fontWeight: "600",
    },
    qaAnswer: {
        marginTop: 16,
        padding: 12,
        borderRadius: 8,
        borderLeftWidth: 3,
    },
    qaAnswerLabel: {
        fontSize: 12,
        fontWeight: "600",
        marginBottom: 6,
    },
    qaAnswerText: {
        fontSize: 14,
        lineHeight: 20,
    },
    distributionContainer: {
        marginTop: 12,
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
    },
    distributionTitle: {
        fontSize: 14,
        fontWeight: "600",
        marginBottom: 12,
    },
    distributionItem: {
        marginBottom: 12,
        paddingBottom: 12,
        borderBottomWidth: 1,
    },
    distributionHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 4,
    },
    distributionStablecoin: {
        fontSize: 15,
        fontWeight: "600",
    },
    distributionPercentage: {
        fontSize: 15,
        fontWeight: "bold",
    },
    distributionAmount: {
        fontSize: 14,
        marginBottom: 4,
    },
    distributionReason: {
        fontSize: 13,
        lineHeight: 18,
    },
    corsWarningCard: {
        backgroundColor: "#FEF3C7",
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: "#FCD34D",
        marginBottom: 16,
    },
    corsWarningTitle: {
        fontSize: 16,
        fontWeight: "bold",
        color: "#92400E",
        marginBottom: 8,
    },
    corsWarningText: {
        fontSize: 14,
        color: "#78350F",
        lineHeight: 20,
    },
});
