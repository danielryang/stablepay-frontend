/**
 * ENHANCED OPTIMIZER
 * Now includes: timing recommendations + stablecoin selection
 */

import { analyzeOptimalTiming, ChainHistoricalData, HistoricalDataResult, StablecoinLiquidityData } from './realDataFetcher';
import { selectOptimalStablecoin, shouldSwitchStablecoin, UserContext, StablecoinScore } from './stablecoinSelector';

export interface UserBalance {
    chain: string;
    token: string;
    amount: number;
}

export interface UpcomingExpense {
    amount: number;
    dueDate: string;
    type?: string;
}

export interface CurrentPrice {
    [chain: string]: {
        estimatedTransferCostUSD: number;
    };
}

export interface AnalysisItem {
    chain: string;
    currentToken: string;
    amount: number;
    avgGasCost: number;
    currentGasCost: number;
    volatility: number;
    predictedMonthlyCost: number;
    costPercentage: number;
    efficiency: number;
    timingData: ReturnType<typeof analyzeOptimalTiming>;
    recommendedStablecoin: {
        name: string;
        totalScore: number;
        liquidityScore: number;
        conversionFee: number;
        regionalFit: number;
        reasons: string[];
        price: number;
        volume24h: number;
    };
    currentStablecoinScore?: StablecoinScore;
}

export interface Recommendation {
    type: 'switch_stablecoin' | 'convert_with_timing' | 'bridge' | 'timing_insight';
    priority?: 'high' | 'medium';
    chain?: string;
    from?: string;
    to?: string;
    amount?: number;
    reason?: string;
    monthlySavings?: string;
    sixMonthSavings?: string;
    details?: {
        currentFee?: string;
        newFee?: string;
        liquidityImprovement?: boolean;
        regionalFit?: string[];
    };
    timing?: 'urgent' | 'wait' | 'now';
    token?: string;
    dueDate?: string;
    daysUntil?: number;
    estimatedFee?: string;
    timingAdvice?: {
        recommendation: string;
        potentialSavings?: string;
        bestTime: string;
        currentPercentile: string;
    };
    cost?: number;
    breakEvenMonths?: string;
    insights?: Array<{
        chain: string;
        bestDay: string;
        worstDay: string;
        bestTimeOfDay: string;
        avoidTimeOfDay: string;
        weekendVsWeekday: string;
        volatilityWarning: string | null;
    }>;
}

export interface OptimizationResult {
    analysis: AnalysisItem[];
    recommendations: Recommendation[];
    timingRecommendations: { [chain: string]: ReturnType<typeof analyzeOptimalTiming> };
    stablecoinRecommendations: { [chain: string]: ReturnType<typeof selectOptimalStablecoin> };
    mostEfficientChain: string;
    totalPotentialSavings: number;
}

/**
 * ENHANCED OPTIMIZER
 * Now includes: timing recommendations + stablecoin selection
 */
export function analyzeAndOptimize(
    userBalances: UserBalance[],
    historicalData: HistoricalDataResult,
    currentPrices: CurrentPrice,
    stablecoinLiquidityData: {
        USDC: StablecoinLiquidityData;
        USDT: StablecoinLiquidityData;
        DAI: StablecoinLiquidityData;
    },
    userContext: UserContext & { monthlyTransactionFrequency?: number; monthlyExpenses?: number; upcomingExpenses?: UpcomingExpense[] }
): OptimizationResult {
    const analysis: AnalysisItem[] = [];
    const timingRecommendations: { [chain: string]: ReturnType<typeof analyzeOptimalTiming> } = {};
    const stablecoinRecommendations: { [chain: string]: ReturnType<typeof selectOptimalStablecoin> } = {};

    // Step 1: Analyze each balance position
    for (const balance of userBalances) {
        const chainHistory = historicalData.chains[balance.chain];

        if (!chainHistory) {
            console.warn(`No data for ${balance.chain}, skipping`);
            continue;
        }

        // Extract real statistics
        const costs = chainHistory.map(d => d.estimatedGasCostUSD);
        const avgMonthlyCost = mean(costs) * (userContext.monthlyTransactionFrequency || 15);
        const currentCost = currentPrices[balance.chain]?.estimatedTransferCostUSD || mean(costs);
        const volatility = calculateStdDev(costs) / mean(costs);

        // Analyze optimal timing for this chain
        const timingAnalysis = analyzeOptimalTiming(
            chainHistory,
            currentCost
        );
        timingRecommendations[balance.chain] = timingAnalysis;

        // Analyze optimal stablecoin for this chain
        const stablecoinAnalysis = selectOptimalStablecoin(
            userContext,
            stablecoinLiquidityData,
            balance.chain
        );
        stablecoinRecommendations[balance.chain] = stablecoinAnalysis;

        // Calculate conversion fees
        const currentStableData = stablecoinLiquidityData[balance.token as keyof typeof stablecoinLiquidityData] || stablecoinLiquidityData.USDC;
        const monthlyConversionCost = ((userContext.monthlyExpenses || 800) / 12) * (currentStableData.conversionFees[balance.chain] || 0.02);

        // Total monthly cost
        const totalMonthlyCost = avgMonthlyCost + monthlyConversionCost;

        // Find current stablecoin score
        const currentStablecoinScore = stablecoinAnalysis.comparison.find(s => s.name === balance.token);

        analysis.push({
            chain: balance.chain,
            currentToken: balance.token,
            amount: balance.amount,
            avgGasCost: mean(costs),
            currentGasCost: currentCost,
            volatility: volatility,
            predictedMonthlyCost: totalMonthlyCost,
            costPercentage: (totalMonthlyCost / balance.amount) * 100,
            efficiency: 1 / totalMonthlyCost,
            timingData: timingAnalysis,
            recommendedStablecoin: stablecoinAnalysis.recommended,
            currentStablecoinScore: currentStablecoinScore
        });
    }

    // Find most efficient chain
    const mostEfficient = analysis.reduce((best, current) =>
        current.efficiency > best.efficiency ? current : best
    );

    // Generate comprehensive recommendations
    const recommendations = generateEnhancedRecommendations(
        analysis,
        mostEfficient,
        userBalances,
        userContext,
        timingRecommendations,
        stablecoinRecommendations,
        stablecoinLiquidityData
    );

    return {
        analysis,
        recommendations,
        timingRecommendations,
        stablecoinRecommendations,
        mostEfficientChain: mostEfficient.chain,
        totalPotentialSavings: calculateSavings(recommendations)
    };
}

function generateEnhancedRecommendations(
    analysis: AnalysisItem[],
    mostEfficient: AnalysisItem,
    userBalances: UserBalance[],
    userContext: UserContext & { monthlyTransactionFrequency?: number; monthlyExpenses?: number; upcomingExpenses?: UpcomingExpense[] },
    timingData: { [chain: string]: ReturnType<typeof analyzeOptimalTiming> },
    stablecoinData: { [chain: string]: ReturnType<typeof selectOptimalStablecoin> },
    liquidityData: {
        USDC: StablecoinLiquidityData;
        USDT: StablecoinLiquidityData;
        DAI: StablecoinLiquidityData;
    }
): Recommendation[] {
    const recommendations: Recommendation[] = [];

    // CATEGORY 1: Stablecoin switch recommendations
    for (const position of analysis) {
        const balance = userBalances.find(b => b.chain === position.chain);
        const recommended = position.recommendedStablecoin;
        const current = position.currentStablecoinScore;

        if (balance && balance.token !== recommended.name) {
            const switchAnalysis = shouldSwitchStablecoin(
                current,
                recommended,
                balance.amount
            );

            if (switchAnalysis.shouldSwitch) {
                recommendations.push({
                    type: 'switch_stablecoin',
                    priority: switchAnalysis.sixMonthSavings > 50 ? 'high' : 'medium',
                    chain: position.chain,
                    from: balance.token,
                    to: recommended.name,
                    amount: balance.amount,
                    reason: switchAnalysis.reason,
                    monthlySavings: switchAnalysis.monthlySavings.toFixed(2),
                    sixMonthSavings: switchAnalysis.sixMonthSavings.toFixed(2),
                    details: {
                        currentFee: current ? (current.conversionFee * 100).toFixed(2) + '%' : 'N/A',
                        newFee: (recommended.conversionFee * 100).toFixed(2) + '%',
                        liquidityImprovement: recommended.liquidityScore > (current?.liquidityScore || 0),
                        regionalFit: recommended.reasons
                    }
                });
            }
        }
    }

    // CATEGORY 2: Timing recommendations for upcoming conversions
    if (userContext.upcomingExpenses && userContext.upcomingExpenses.length > 0) {
        for (const expense of userContext.upcomingExpenses) {
            const daysUntil = calculateDaysUntil(expense.dueDate);

            if (daysUntil < 14) {
                // Find best chain to convert from
                const suitable = analysis.filter(a => {
                    const balance = userBalances.find(b => b.chain === a.chain);
                    return balance && balance.amount >= expense.amount;
                });

                if (suitable.length > 0) {
                    const best = suitable.reduce((bestChain, current) =>
                        current.currentGasCost < bestChain.currentGasCost ? current : bestChain
                    );

                    const timing = timingData[best.chain];

                    // Determine if should wait or convert now
                    const shouldWait = !timing.currentStatus.isGoodTimeNow && daysUntil > 3;

                    recommendations.push({
                        type: 'convert_with_timing',
                        timing: daysUntil < 2 ? 'urgent' : shouldWait ? 'wait' : 'now',
                        chain: best.chain,
                        token: best.currentToken,
                        amount: expense.amount,
                        dueDate: expense.dueDate,
                        daysUntil: daysUntil,
                        estimatedFee: (best.currentGasCost + expense.amount * 0.02).toFixed(2),
                        reason: `${expense.type || 'payment'} due ${expense.dueDate}`,
                        timingAdvice: shouldWait
                            ? {
                                recommendation: `Wait for ${timing.bestDayOfWeek.dayName}`,
                                potentialSavings: timing.potentialSavings.amount.toFixed(2),
                                bestTime: timing.timeOfDayRecommendations[best.chain]?.best || 'Check timing',
                                currentPercentile: `Currently ${(timing.currentStatus.percentile * 100).toFixed(0)}th percentile (higher = more expensive)`
                            }
                            : {
                                recommendation: 'Convert now - good timing',
                                currentPercentile: `Currently ${(timing.currentStatus.percentile * 100).toFixed(0)}th percentile`,
                                bestTime: timing.timeOfDayRecommendations[best.chain]?.best || 'Check timing'
                            }
                    });
                }
            }
        }
    }

    // CATEGORY 3: Bridge recommendations
    const bridgeCosts: { [from: string]: { [to: string]: number } } = {
        ethereum: { polygon: 8, arbitrum: 6, solana: 12 },
        polygon: { ethereum: 5, arbitrum: 3, solana: 10 },
        arbitrum: { ethereum: 5, polygon: 3, solana: 9 },
        solana: { ethereum: 12, polygon: 10, arbitrum: 9 }
    };

    for (const current of analysis) {
        if (current.chain === mostEfficient.chain) continue;
        if (current.amount < 100) continue;

        const monthlySavings = current.predictedMonthlyCost - mostEfficient.predictedMonthlyCost;
        const bridgeCost = bridgeCosts[current.chain]?.[mostEfficient.chain] || 10;
        const breakEvenMonths = monthlySavings > 0 ? bridgeCost / monthlySavings : Infinity;

        if (breakEvenMonths < 4 && monthlySavings > 2) {
            recommendations.push({
                type: 'bridge',
                priority: breakEvenMonths < 2 ? 'high' : 'medium',
                from: current.chain,
                to: mostEfficient.chain,
                amount: current.amount * 0.6,
                cost: bridgeCost,
                monthlySavings: monthlySavings.toFixed(2),
                breakEvenMonths: breakEvenMonths.toFixed(1),
                sixMonthSavings: (monthlySavings * 6 - bridgeCost).toFixed(2),
                timingAdvice: timingData[current.chain]?.currentStatus.isGoodTimeNow
                    ? 'Good time to bridge (low gas)'
                    : `Consider waiting for ${timingData[current.chain]?.bestDayOfWeek.dayName} for lower gas fees`
            });
        }
    }

    // CATEGORY 4: General timing insights
    recommendations.push({
        type: 'timing_insight',
        insights: Object.entries(timingData).map(([chain, data]) => ({
            chain,
            bestDay: data.bestDayOfWeek.dayName,
            worstDay: data.worstDayOfWeek.dayName,
            bestTimeOfDay: data.timeOfDayRecommendations[chain]?.best || 'N/A',
            avoidTimeOfDay: data.timeOfDayRecommendations[chain]?.avoid || 'N/A',
            weekendVsWeekday: data.weekendVsWeekday.recommendation,
            volatilityWarning: data.volatilityWarning ? 'High volatility - timing matters more' : null
        }))
    });

    return recommendations;
}

function calculateSavings(recommendations: Recommendation[]): number {
    return recommendations.reduce((sum, rec) => {
        if (rec.type === 'bridge' && rec.sixMonthSavings) {
            return sum + parseFloat(rec.sixMonthSavings);
        }
        if (rec.type === 'switch_stablecoin' && rec.sixMonthSavings) {
            return sum + parseFloat(rec.sixMonthSavings);
        }
        if (rec.type === 'convert_with_timing' && rec.timingAdvice?.potentialSavings) {
            return sum + parseFloat(rec.timingAdvice.potentialSavings);
        }
        return sum;
    }, 0);
}

function calculateDaysUntil(dateString: string): number {
    const target = new Date(dateString);
    const now = new Date();
    return Math.max(0, Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
}

function mean(arr: number[]): number {
    if (arr.length === 0) return 0;
    return arr.reduce((sum, val) => sum + val, 0) / arr.length;
}

function calculateStdDev(arr: number[]): number {
    const avg = mean(arr);
    const squareDiffs = arr.map(val => Math.pow(val - avg, 2));
    return Math.sqrt(mean(squareDiffs));
}

