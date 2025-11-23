import { useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { fetchRealHistoricalData, fetchStablecoinLiquidityData } from "@/utils/realDataFetcher";
import { analyzeAndOptimize, UserBalance } from "@/utils/enhancedOptimizer";

// Extract balances from home screen structure
// USDC: $500 on Ethereum, USDT: $700 on Polygon, ARS: 50,000 ARS
const getUserBalances = (): UserBalance[] => {
    return [
        { chain: 'ethereum', token: 'USDC', amount: 500 },
        { chain: 'polygon', token: 'USDT', amount: 700 },
    ];
};

export default function OptimizerScreen() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [dataSource, setDataSource] = useState('');
    const [results, setResults] = useState<ReturnType<typeof analyzeAndOptimize> | null>(null);

    const generateReport = async () => {
        try {
            setLoading(true);
            setError(null);
            setResults(null);

            // Step 1: Get user balances
            const userBalances = getUserBalances();

            // Step 2: Get historical chain data
            console.log('📊 Loading real historical data...');
            console.log('⚠️ Note: Making 5 API calls (4 chains + 1 batched stablecoin). Please wait...');
            const historical = await fetchRealHistoricalData(90);
            
            // Check if API key is being used
            const hasApiKey = typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_COINGECKO_API_KEY;
            setDataSource(hasApiKey ? 'CoinGecko API (with API key)' : 'CoinGecko API (free tier)');
            
            // Verify we have data for required chains (ethereum and polygon)
            if (!historical.chains.ethereum || historical.chains.ethereum === null) {
                throw new Error('Failed to fetch Ethereum chain data. This is required for the optimizer. If you see CORS errors, this is a browser security restriction - try running on a native device or wait 1-2 minutes and retry.');
            }
            if (!historical.chains.polygon || historical.chains.polygon === null) {
                throw new Error('Failed to fetch Polygon chain data. This is required for the optimizer. If you see CORS errors, this is a browser security restriction - try running on a native device or wait 1-2 minutes and retry.');
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
            console.log('🪙 Fetching stablecoin data...');
            const stablecoinData = await fetchStablecoinLiquidityData();
            if (!stablecoinData) {
                throw new Error('Failed to fetch stablecoin liquidity data');
            }

            // Step 5: Run enhanced analysis
            console.log('🧮 Running enhanced analysis...');
            const optimization = analyzeAndOptimize(
                userBalances,
                historical,
                currentPrices,
                stablecoinData,
                {
                    country: 'argentina',
                    primaryUse: 'daily_expenses',
                    monthlyTransactionVolume: 1200,
                    monthlyTransactionFrequency: 15,
                    monthlyExpenses: 800,
                    upcomingExpenses: []
                }
            );

            setResults(optimization);
            console.log('✅ Analysis complete');

        } catch (err) {
            console.error('❌ Initialization failed:', err);
            let errorMessage = 'Unknown error occurred';
            if (err instanceof Error) {
                errorMessage = err.message;
                // Provide more helpful error messages for rate limits
                if (err.message.includes('Rate limited') || err.message.includes('429')) {
                    errorMessage = 'CoinGecko API rate limit exceeded. Please wait 1-2 minutes and try again. The free tier allows limited requests per minute.';
                } else if (err.message.includes('CORS')) {
                    errorMessage = 'CORS error: Unable to fetch data from CoinGecko API. This may be a browser security restriction. Try again in a few moments.';
                }
            }
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <View style={styles.container}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#0891D1" />
                    <Text style={styles.loadingText}>Analyzing market data...</Text>
                    <Text style={styles.loadingSubtext}>Loading 90 days of real price data + stablecoin liquidity</Text>
                </View>
            </View>
        );
    }

    if (error) {
        return (
            <View style={styles.container}>
                <ScrollView style={styles.scrollView}>
                    <View style={styles.errorContainer}>
                        <Text style={styles.errorTitle}>⚠️ Error</Text>
                        <Text style={styles.errorMessage}>{error}</Text>
                        <Pressable
                            style={styles.retryButton}
                            onPress={generateReport}
                        >
                            <Text style={styles.retryButtonText}>Retry</Text>
                        </Pressable>
                    </View>
                </ScrollView>
            </View>
        );
    }

    // Separate recommendations by type
    const stablecoinRecs = results?.recommendations.filter(r => r.type === 'switch_stablecoin') || [];
    const conversionRecs = results?.recommendations.filter(r => r.type === 'convert_with_timing') || [];
    const bridgeRecs = results?.recommendations.filter(r => r.type === 'bridge') || [];
    const timingInsights = results?.recommendations.find(r => r.type === 'timing_insight');

    return (
        <View style={styles.container}>
            <ScrollView style={styles.scrollView}>
                <View style={styles.content}>
                    {/* Header */}
                    <View style={styles.headerCard}>
                        <Text style={styles.headerTitle}>Smart Allocation Optimizer</Text>
                        <Text style={styles.headerSubtitle}>
                            Real data from {dataSource || 'CoinGecko API'} • Analyzes timing, stablecoins, and network efficiency
                        </Text>
                        {!results && (
                            <Pressable
                                style={styles.generateButton}
                                onPress={generateReport}
                            >
                                <Text style={styles.generateButtonText}>Generate Report</Text>
                            </Pressable>
                        )}
                    </View>

                    {results && (
                        <>
                            {/* Stablecoin Recommendations */}
                            {stablecoinRecs.length > 0 && (
                                <View style={styles.sectionCard}>
                                    <Text style={styles.sectionTitle}>Stablecoin Optimization</Text>
                                    {stablecoinRecs.map((rec, idx) => (
                                        <View key={idx} style={styles.recommendationCard}>
                                            <View style={styles.recommendationHeader}>
                                                <View style={styles.recommendationHeaderLeft}>
                                                    <Text style={styles.recommendationTitle}>
                                                        Switch from {rec.from} → {rec.to} on {rec.chain}
                                                    </Text>
                                                    <Text style={styles.recommendationReason}>{rec.reason}</Text>
                                                </View>
                                                <View style={[styles.priorityBadge, rec.priority === 'high' ? styles.priorityHigh : styles.priorityMedium]}>
                                                    <Text style={styles.priorityText}>{rec.priority?.toUpperCase()}</Text>
                                                </View>
                                            </View>
                                            <View style={styles.statsGrid}>
                                                <View style={styles.statItem}>
                                                    <Text style={styles.statLabel}>Monthly Savings</Text>
                                                    <Text style={styles.statValue}>${rec.monthlySavings}</Text>
                                                </View>
                                                <View style={styles.statItem}>
                                                    <Text style={styles.statLabel}>Fee Improvement</Text>
                                                    <Text style={styles.statValue}>
                                                        {rec.details?.currentFee} → {rec.details?.newFee}
                                                    </Text>
                                                </View>
                                                <View style={styles.statItem}>
                                                    <Text style={styles.statLabel}>6-Month Profit</Text>
                                                    <Text style={styles.statValue}>${rec.sixMonthSavings}</Text>
                                                </View>
                                            </View>
                                            {rec.details?.regionalFit && (
                                                <Text style={styles.reasonText}>
                                                    ✓ {rec.details.regionalFit.join(' • ')}
                                                </Text>
                                            )}
                                        </View>
                                    ))}
                                </View>
                            )}

                            {/* Conversion Timing Recommendations */}
                            {conversionRecs.length > 0 && (
                                <View style={styles.sectionCard}>
                                    <Text style={styles.sectionTitle}>Optimal Conversion Timing</Text>
                                    {conversionRecs.map((rec, idx) => (
                                        <View key={idx} style={styles.timingCard}>
                                            <View style={styles.timingHeader}>
                                                <View style={styles.timingHeaderLeft}>
                                                    <Text style={styles.timingTitle}>
                                                        {rec.amount?.toFixed(0)} {rec.token} → Fiat
                                                    </Text>
                                                    <Text style={styles.timingReason}>{rec.reason}</Text>
                                                </View>
                                                <View style={[
                                                    styles.timingBadge,
                                                    rec.timing === 'urgent' ? styles.timingUrgent :
                                                    rec.timing === 'wait' ? styles.timingWait : styles.timingNow
                                                ]}>
                                                    <Text style={styles.timingBadgeText}>
                                                        {rec.timing === 'wait' ? 'WAIT FOR BETTER RATE' :
                                                            rec.timing === 'urgent' ? 'CONVERT NOW' : 'GOOD TIME NOW'}
                                                    </Text>
                                                </View>
                                            </View>
                                            <View style={styles.timingAdviceCard}>
                                                <Text style={styles.timingAdviceTitle}>
                                                    💡 {rec.timingAdvice?.recommendation}
                                                </Text>
                                                <View style={styles.timingAdviceGrid}>
                                                    <View style={styles.timingAdviceItem}>
                                                        <Text style={styles.timingAdviceLabel}>Best time to convert</Text>
                                                        <Text style={styles.timingAdviceValue}>{rec.timingAdvice?.bestTime}</Text>
                                                    </View>
                                                    {rec.timingAdvice?.potentialSavings && (
                                                        <View style={styles.timingAdviceItem}>
                                                            <Text style={styles.timingAdviceLabel}>Potential savings by waiting</Text>
                                                            <Text style={[styles.timingAdviceValue, styles.savingsValue]}>
                                                                ${rec.timingAdvice.potentialSavings}
                                                            </Text>
                                                        </View>
                                                    )}
                                                </View>
                                                <Text style={styles.timingPercentile}>
                                                    {rec.timingAdvice?.currentPercentile}
                                                </Text>
                                            </View>
                                        </View>
                                    ))}
                                </View>
                            )}

                            {/* Current Holdings Analysis */}
                            <View style={styles.sectionCard}>
                                <Text style={styles.sectionTitle}>Current Holdings Analysis</Text>
                                {results.analysis.map((item, idx) => (
                                    <View key={idx} style={styles.holdingCard}>
                                        <View style={styles.holdingHeader}>
                                            <View style={styles.holdingHeaderLeft}>
                                                <View style={styles.holdingTitleRow}>
                                                    <Text style={styles.holdingChain}>{item.chain}</Text>
                                                    <View style={styles.tokenBadge}>
                                                        <Text style={styles.tokenBadgeText}>{item.currentToken}</Text>
                                                    </View>
                                                </View>
                                                <Text style={styles.holdingAmount}>${item.amount.toFixed(2)}</Text>
                                            </View>
                                            <View style={styles.holdingCost}>
                                                <Text style={styles.holdingCostLabel}>Monthly Cost</Text>
                                                <Text style={styles.holdingCostValue}>${item.predictedMonthlyCost.toFixed(2)}</Text>
                                            </View>
                                        </View>

                                        {item.currentToken !== item.recommendedStablecoin.name && (
                                            <View style={styles.switchWarning}>
                                                <Text style={styles.switchWarningText}>
                                                    ⚠️ Consider switching to {item.recommendedStablecoin.name}
                                                </Text>
                                                <Text style={styles.switchWarningSubtext}>
                                                    {item.recommendedStablecoin.reasons.join(' • ')}
                                                </Text>
                                            </View>
                                        )}

                                        <View style={styles.holdingStats}>
                                            <View style={styles.holdingStat}>
                                                <Text style={styles.holdingStatLabel}>Avg Gas</Text>
                                                <Text style={styles.holdingStatValue}>${item.avgGasCost.toFixed(4)}</Text>
                                            </View>
                                            <View style={styles.holdingStat}>
                                                <Text style={styles.holdingStatLabel}>Current Gas</Text>
                                                <Text style={styles.holdingStatValue}>${item.currentGasCost.toFixed(4)}</Text>
                                            </View>
                                            <View style={styles.holdingStat}>
                                                <Text style={styles.holdingStatLabel}>Volatility</Text>
                                                <Text style={styles.holdingStatValue}>{(item.volatility * 100).toFixed(1)}%</Text>
                                            </View>
                                            <View style={styles.holdingStat}>
                                                <Text style={styles.holdingStatLabel}>Cost/Balance</Text>
                                                <Text style={styles.holdingStatValue}>{item.costPercentage.toFixed(2)}%</Text>
                                            </View>
                                        </View>
                                    </View>
                                ))}
                            </View>

                            {/* Bridge Recommendations */}
                            {bridgeRecs.length > 0 && (
                                <View style={styles.sectionCard}>
                                    <Text style={styles.sectionTitle}>Bridge Recommendations</Text>
                                    {bridgeRecs.map((rec, idx) => (
                                        <View key={idx} style={styles.bridgeCard}>
                                            <View style={styles.bridgeHeader}>
                                                <Text style={styles.bridgeTitle}>
                                                    Bridge ${rec.amount?.toFixed(2)} from {rec.from} → {rec.to}
                                                </Text>
                                                <View style={[styles.priorityBadge, rec.priority === 'high' ? styles.priorityHigh : styles.priorityMedium]}>
                                                    <Text style={styles.priorityText}>{rec.priority?.toUpperCase()}</Text>
                                                </View>
                                            </View>
                                            <View style={styles.bridgeStats}>
                                                <View style={styles.bridgeStat}>
                                                    <Text style={styles.bridgeStatLabel}>Cost</Text>
                                                    <Text style={styles.bridgeStatValue}>${rec.cost}</Text>
                                                </View>
                                                <View style={styles.bridgeStat}>
                                                    <Text style={styles.bridgeStatLabel}>Monthly Savings</Text>
                                                    <Text style={[styles.bridgeStatValue, styles.savingsValue]}>${rec.monthlySavings}</Text>
                                                </View>
                                                <View style={styles.bridgeStat}>
                                                    <Text style={styles.bridgeStatLabel}>Break Even</Text>
                                                    <Text style={styles.bridgeStatValue}>{rec.breakEvenMonths}mo</Text>
                                                </View>
                                                <View style={styles.bridgeStat}>
                                                    <Text style={styles.bridgeStatLabel}>6-Month Profit</Text>
                                                    <Text style={[styles.bridgeStatValue, styles.savingsValue]}>${rec.sixMonthSavings}</Text>
                                                </View>
                                            </View>
                                            <Text style={styles.bridgeAdvice}>💡 {rec.timingAdvice}</Text>
                                        </View>
                                    ))}
                                </View>
                            )}

                            {/* Timing Insights */}
                            {timingInsights && (
                                <View style={styles.sectionCard}>
                                    <Text style={styles.sectionTitle}>Market Timing Insights</Text>
                                    {timingInsights.insights?.map((insight, idx) => (
                                        <View key={idx} style={styles.insightCard}>
                                            <Text style={styles.insightChain}>{insight.chain}</Text>
                                            <View style={styles.insightRow}>
                                                <Text style={styles.insightLabel}>Best day:</Text>
                                                <Text style={[styles.insightValue, styles.insightGood]}>{insight.bestDay}</Text>
                                            </View>
                                            <View style={styles.insightRow}>
                                                <Text style={styles.insightLabel}>Worst day:</Text>
                                                <Text style={[styles.insightValue, styles.insightBad]}>{insight.worstDay}</Text>
                                            </View>
                                            <View style={styles.insightRow}>
                                                <Text style={styles.insightLabel}>Best time:</Text>
                                                <Text style={styles.insightValue}>{insight.bestTimeOfDay}</Text>
                                            </View>
                                            <View style={styles.insightRow}>
                                                <Text style={styles.insightLabel}>Avoid:</Text>
                                                <Text style={styles.insightValue}>{insight.avoidTimeOfDay}</Text>
                                            </View>
                                            <View style={styles.insightDivider} />
                                            <Text style={styles.insightRecommendation}>{insight.weekendVsWeekday}</Text>
                                            {insight.volatilityWarning && (
                                                <View style={styles.volatilityWarning}>
                                                    <Text style={styles.volatilityWarningText}>⚠️ {insight.volatilityWarning}</Text>
                                                </View>
                                            )}
                                        </View>
                                    ))}
                                </View>
                            )}

                            {/* Total Savings */}
                            {results.totalPotentialSavings > 0 && (
                                <View style={styles.savingsCard}>
                                    <Text style={styles.savingsTitle}>Total Potential Savings</Text>
                                    <Text style={styles.savingsAmount}>${results.totalPotentialSavings.toFixed(2)}</Text>
                                    <Text style={styles.savingsSubtitle}>
                                        Over 6 months by optimizing your stablecoins, timing, and network selection
                                    </Text>
                                    <Text style={styles.savingsNote}>
                                        * Based on 90 days of real market data from {dataSource}
                                    </Text>
                                </View>
                            )}
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
        backgroundColor: '#FAFAFA',
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
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16,
    },
    loadingText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#29343D',
    },
    loadingSubtext: {
        fontSize: 14,
        color: '#737A82',
        textAlign: 'center',
        paddingHorizontal: 32,
    },
    errorContainer: {
        padding: 32,
        alignItems: 'center',
        gap: 16,
    },
    errorTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#EF4444',
    },
    errorMessage: {
        fontSize: 16,
        color: '#29343D',
        textAlign: 'center',
    },
    retryButton: {
        paddingHorizontal: 24,
        paddingVertical: 12,
        backgroundColor: '#0891D1',
        borderRadius: 8,
    },
    retryButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
    headerCard: {
        padding: 24,
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E1E4E8',
        gap: 12,
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#29343D',
    },
    headerSubtitle: {
        fontSize: 14,
        color: '#737A82',
    },
    generateButton: {
        marginTop: 8,
        paddingVertical: 16,
        backgroundColor: '#0891D1',
        borderRadius: 12,
        alignItems: 'center',
    },
    generateButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
    sectionCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E1E4E8',
        padding: 16,
        gap: 12,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: '#29343D',
        marginBottom: 4,
    },
    recommendationCard: {
        backgroundColor: '#F3F4F6',
        borderRadius: 8,
        padding: 16,
        gap: 12,
    },
    recommendationHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    recommendationHeaderLeft: {
        flex: 1,
    },
    recommendationTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#29343D',
    },
    recommendationReason: {
        fontSize: 14,
        color: '#737A82',
        marginTop: 4,
    },
    priorityBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
    },
    priorityHigh: {
        backgroundColor: '#FEE2E2',
    },
    priorityMedium: {
        backgroundColor: '#FEF3C7',
    },
    priorityText: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#29343D',
    },
    statsGrid: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 8,
    },
    statItem: {
        flex: 1,
    },
    statLabel: {
        fontSize: 12,
        color: '#737A82',
        marginBottom: 4,
    },
    statValue: {
        fontSize: 16,
        fontWeight: '600',
        color: '#29343D',
    },
    reasonText: {
        fontSize: 12,
        color: '#29343D',
        marginTop: 4,
    },
    timingCard: {
        borderLeftWidth: 4,
        borderLeftColor: '#22C55E',
        backgroundColor: '#F0FDF4',
        borderRadius: 8,
        padding: 16,
        gap: 12,
    },
    timingHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    timingHeaderLeft: {
        flex: 1,
    },
    timingTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#29343D',
    },
    timingReason: {
        fontSize: 14,
        color: '#737A82',
        marginTop: 4,
    },
    timingBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
    },
    timingUrgent: {
        backgroundColor: '#FEE2E2',
    },
    timingWait: {
        backgroundColor: '#FEF3C7',
    },
    timingNow: {
        backgroundColor: '#DCFCE7',
    },
    timingBadgeText: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#29343D',
    },
    timingAdviceCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 8,
        padding: 16,
        gap: 12,
    },
    timingAdviceTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#29343D',
    },
    timingAdviceGrid: {
        flexDirection: 'row',
        gap: 16,
    },
    timingAdviceItem: {
        flex: 1,
    },
    timingAdviceLabel: {
        fontSize: 12,
        color: '#737A82',
        marginBottom: 4,
    },
    timingAdviceValue: {
        fontSize: 14,
        fontWeight: '600',
        color: '#29343D',
    },
    savingsValue: {
        color: '#22C55E',
    },
    timingPercentile: {
        fontSize: 12,
        color: '#737A82',
        marginTop: 4,
    },
    holdingCard: {
        borderWidth: 1,
        borderColor: '#E1E4E8',
        borderRadius: 8,
        padding: 16,
        gap: 12,
    },
    holdingHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    holdingHeaderLeft: {
        flex: 1,
    },
    holdingTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 8,
    },
    holdingChain: {
        fontSize: 16,
        fontWeight: '600',
        color: '#29343D',
        textTransform: 'capitalize',
    },
    tokenBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        backgroundColor: '#E0F2FE',
        borderRadius: 6,
    },
    tokenBadgeText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#0891D1',
    },
    holdingAmount: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#0891D1',
    },
    holdingCost: {
        alignItems: 'flex-end',
    },
    holdingCostLabel: {
        fontSize: 12,
        color: '#737A82',
        marginBottom: 4,
    },
    holdingCostValue: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#29343D',
    },
    switchWarning: {
        backgroundColor: '#FEF3C7',
        borderWidth: 1,
        borderColor: '#FCD34D',
        borderRadius: 8,
        padding: 12,
    },
    switchWarningText: {
        fontSize: 14,
        fontWeight: '500',
        color: '#92400E',
    },
    switchWarningSubtext: {
        fontSize: 12,
        color: '#92400E',
        marginTop: 4,
    },
    holdingStats: {
        flexDirection: 'row',
        gap: 12,
    },
    holdingStat: {
        flex: 1,
    },
    holdingStatLabel: {
        fontSize: 12,
        color: '#737A82',
        marginBottom: 4,
    },
    holdingStatValue: {
        fontSize: 14,
        fontWeight: '600',
        color: '#29343D',
    },
    bridgeCard: {
        borderLeftWidth: 4,
        borderLeftColor: '#0891D1',
        backgroundColor: '#EFF6FF',
        borderRadius: 8,
        padding: 16,
        gap: 12,
    },
    bridgeHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    bridgeTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#29343D',
        flex: 1,
    },
    bridgeStats: {
        flexDirection: 'row',
        gap: 12,
        backgroundColor: '#FFFFFF',
        borderRadius: 8,
        padding: 12,
    },
    bridgeStat: {
        flex: 1,
    },
    bridgeStatLabel: {
        fontSize: 12,
        color: '#737A82',
        marginBottom: 4,
    },
    bridgeStatValue: {
        fontSize: 14,
        fontWeight: '600',
        color: '#29343D',
    },
    bridgeAdvice: {
        fontSize: 14,
        color: '#29343D',
    },
    insightCard: {
        borderWidth: 1,
        borderColor: '#E1E4E8',
        borderRadius: 8,
        padding: 16,
        gap: 8,
    },
    insightChain: {
        fontSize: 16,
        fontWeight: '600',
        color: '#29343D',
        textTransform: 'capitalize',
        marginBottom: 4,
    },
    insightRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    insightLabel: {
        fontSize: 14,
        color: '#737A82',
    },
    insightValue: {
        fontSize: 14,
        fontWeight: '600',
        color: '#29343D',
    },
    insightGood: {
        color: '#22C55E',
    },
    insightBad: {
        color: '#EF4444',
    },
    insightDivider: {
        height: 1,
        backgroundColor: '#E1E4E8',
        marginVertical: 8,
    },
    insightRecommendation: {
        fontSize: 14,
        color: '#29343D',
    },
    volatilityWarning: {
        backgroundColor: '#FEF3C7',
        borderWidth: 1,
        borderColor: '#FCD34D',
        borderRadius: 6,
        padding: 8,
        marginTop: 8,
    },
    volatilityWarningText: {
        fontSize: 12,
        color: '#92400E',
    },
    savingsCard: {
        backgroundColor: '#22C55E',
        borderRadius: 12,
        padding: 24,
        alignItems: 'center',
        gap: 8,
    },
    savingsTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    savingsAmount: {
        fontSize: 48,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
    savingsSubtitle: {
        fontSize: 16,
        color: '#D1FAE5',
        textAlign: 'center',
    },
    savingsNote: {
        fontSize: 12,
        color: '#A7F3D0',
        marginTop: 8,
        textAlign: 'center',
    },
});

