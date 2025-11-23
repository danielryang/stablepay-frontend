/**
 * ENHANCED OPTIMIZER
 * Now includes: timing recommendations + stablecoin selection
 */

import { analyzeOptimalTiming, FiatExchangeRate, HistoricalDataResult, StablecoinLiquidityData } from './realDataFetcher';
import { selectOptimalStablecoin, shouldSwitchStablecoin, StablecoinScore, UserContext } from './stablecoinSelector';

export interface UserBalance {
    chain: string;
    token: string;
    amount: number;
}

export interface FiatBalance {
    currency: string; // e.g., 'ARS'
    amount: number; // Amount in fiat currency
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
    type: 'switch_stablecoin' | 'convert_with_timing' | 'bridge' | 'timing_insight' | 'fiat_to_stablecoin';
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
    fiatAmount?: number;
    fiatCurrency?: string;
    distribution?: Array<{
        stablecoin: string;
        chain: string;
        percentage: number;
        amountUSD: number;
        reason: string;
    }>;
    totalConversionFee?: string;
    estimatedSavings6Months?: string;
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
    userContext: UserContext & { monthlyTransactionFrequency?: number; monthlyExpenses?: number; upcomingExpenses?: UpcomingExpense[] },
    fiatBalances?: FiatBalance[],
    fiatExchangeRate?: FiatExchangeRate
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
        stablecoinLiquidityData,
        fiatBalances,
        fiatExchangeRate
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
    },
    fiatBalances?: FiatBalance[],
    fiatExchangeRate?: FiatExchangeRate
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

    // CATEGORY 4: Fiat to stablecoin distribution recommendations
    if (fiatBalances && fiatBalances.length > 0 && fiatExchangeRate) {
        console.log(`💰 Analyzing fiat distribution for ${fiatBalances.length} fiat balance(s)`);
        for (const fiatBalance of fiatBalances) {
            console.log(`💱 Processing ${fiatBalance.amount} ${fiatBalance.currency} (exchange rate: 1 USD = ${fiatExchangeRate.usdRate} ${fiatExchangeRate.fiatCurrency})`);
            const fiatDistribution = analyzeFiatToStablecoinDistribution(
                fiatBalance,
                fiatExchangeRate,
                analysis,
                stablecoinData,
                liquidityData,
                userContext,
                mostEfficient
            );
            
            if (fiatDistribution && fiatDistribution.distribution.length > 0) {
                console.log(`✅ Generated fiat distribution recommendation with ${fiatDistribution.distribution.length} allocations`);
                recommendations.push({
                    type: 'fiat_to_stablecoin',
                    priority: fiatBalance.amount > 1000 ? 'high' : 'medium',
                    fiatAmount: fiatBalance.amount,
                    fiatCurrency: fiatBalance.currency,
                    distribution: fiatDistribution.distribution,
                    totalConversionFee: fiatDistribution.totalConversionFee.toFixed(2) + '%',
                    estimatedSavings6Months: fiatDistribution.estimatedSavings6Months.toFixed(2),
                    reason: fiatDistribution.reason,
                    sixMonthSavings: fiatDistribution.estimatedSavings6Months.toFixed(2)
                });
            } else {
                console.warn(`⚠️ No fiat distribution generated for ${fiatBalance.currency}. Distribution result:`, fiatDistribution);
            }
        }
    } else {
        if (!fiatBalances || fiatBalances.length === 0) {
            console.log('ℹ️ No fiat balances provided for analysis');
        }
        if (!fiatExchangeRate) {
            console.warn('⚠️ No fiat exchange rate available - fiat distribution analysis skipped');
        }
    }

    // CATEGORY 5: General timing insights
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

/**
 * Analyze optimal distribution of fiat currency into stablecoins
 * Similar to stablecoin analysis but for fiat -> stablecoin conversion
 */
function analyzeFiatToStablecoinDistribution(
    fiatBalance: FiatBalance,
    exchangeRate: FiatExchangeRate,
    analysis: AnalysisItem[],
    stablecoinData: { [chain: string]: ReturnType<typeof selectOptimalStablecoin> },
    liquidityData: {
        USDC: StablecoinLiquidityData;
        USDT: StablecoinLiquidityData;
        DAI: StablecoinLiquidityData;
    },
    userContext: UserContext & { monthlyTransactionFrequency?: number; monthlyExpenses?: number },
    mostEfficient: AnalysisItem
): {
    distribution: Array<{
        stablecoin: string;
        chain: string;
        percentage: number;
        amountUSD: number;
        reason: string;
    }>;
    totalConversionFee: number;
    estimatedSavings6Months: number;
    reason: string;
} | null {
    // Convert fiat to USD
    const fiatAmountUSD = fiatBalance.amount / exchangeRate.usdRate;
    
    if (fiatAmountUSD < 10) {
        return null; // Too small to recommend
    }

    const monthlyExpenses = userContext.monthlyExpenses || 800;
    const monthlyTransactionFrequency = userContext.monthlyTransactionFrequency || 15;
    
    // Calculate optimal distribution based on:
    // 1. Daily expenses (30-40%): USDT on Polygon (lower fees, LatAm preference)
    // 2. Savings (40-50%): USDC on Ethereum (higher liquidity, stability)
    // 3. Active use (10-20%): DAI on Arbitrum (lower gas costs)
    
    const dailyExpensesPercent = Math.min(40, Math.max(30, (monthlyExpenses / fiatAmountUSD) * 100));
    const savingsPercent = Math.min(50, Math.max(40, 100 - dailyExpensesPercent - 15));
    const activeUsePercent = 100 - dailyExpensesPercent - savingsPercent;
    
    const distribution: Array<{
        stablecoin: string;
        chain: string;
        percentage: number;
        amountUSD: number;
        reason: string;
    }> = [];
    
    // 1. Daily expenses allocation
    const dailyExpensesUSD = fiatAmountUSD * (dailyExpensesPercent / 100);
    const polygonStablecoin = stablecoinData['polygon']?.recommended || stablecoinData['ethereum']?.recommended;
    if (polygonStablecoin) {
        const conversionFee = liquidityData[polygonStablecoin.name as keyof typeof liquidityData]?.conversionFees['polygon'] || 0.02;
        distribution.push({
            stablecoin: polygonStablecoin.name,
            chain: 'polygon',
            percentage: dailyExpensesPercent,
            amountUSD: dailyExpensesUSD,
            reason: `Daily expenses: USDT popular in ${userContext.country}, Polygon has lower fees (${(conversionFee * 100).toFixed(2)}%)`
        });
    }
    
    // 2. Savings allocation
    const savingsUSD = fiatAmountUSD * (savingsPercent / 100);
    const ethereumStablecoin = stablecoinData['ethereum']?.recommended || stablecoinData['polygon']?.recommended;
    if (ethereumStablecoin) {
        const conversionFee = liquidityData[ethereumStablecoin.name as keyof typeof liquidityData]?.conversionFees['ethereum'] || 0.02;
        distribution.push({
            stablecoin: ethereumStablecoin.name,
            chain: 'ethereum',
            percentage: savingsPercent,
            amountUSD: savingsUSD,
            reason: `Savings: Higher liquidity and stability, ${(conversionFee * 100).toFixed(2)}% conversion fee`
        });
    }
    
    // 3. Active use allocation (if significant amount)
    if (activeUsePercent > 5) {
        const activeUseUSD = fiatAmountUSD * (activeUsePercent / 100);
        const arbitrumStablecoin = stablecoinData['arbitrum']?.recommended || stablecoinData['ethereum']?.recommended;
        if (arbitrumStablecoin) {
            const conversionFee = liquidityData[arbitrumStablecoin.name as keyof typeof liquidityData]?.conversionFees['arbitrum'] || 0.02;
            const gasCost = analysis.find(a => a.chain === 'arbitrum')?.avgGasCost || 0.5;
            distribution.push({
                stablecoin: arbitrumStablecoin.name,
                chain: 'arbitrum',
                percentage: activeUsePercent,
                amountUSD: activeUseUSD,
                reason: `Active use: Lower gas costs ($${gasCost.toFixed(2)}), ${(conversionFee * 100).toFixed(2)}% conversion fee`
            });
        }
    }
    
    // Calculate total conversion fees
    const totalConversionFee = distribution.reduce((sum, dist) => {
        const fee = liquidityData[dist.stablecoin as keyof typeof liquidityData]?.conversionFees[dist.chain] || 0.02;
        return sum + (dist.amountUSD * fee);
    }, 0);
    const totalConversionFeePercent = (totalConversionFee / fiatAmountUSD) * 100;
    
    // Estimate 6-month savings based on:
    // - Lower conversion fees vs average
    // - Lower gas costs vs average
    // - Better liquidity = lower slippage
    const avgConversionFee = 0.025; // 2.5% average
    const avgGasCost = mean(analysis.map(a => a.avgGasCost));
    const optimizedGasCost = mean(distribution.map(d => {
        const chainAnalysis = analysis.find(a => a.chain === d.chain);
        return chainAnalysis?.avgGasCost || avgGasCost;
    }));
    
    const monthlyGasSavings = (avgGasCost - optimizedGasCost) * monthlyTransactionFrequency;
    const monthlyConversionSavings = (avgConversionFee - (totalConversionFeePercent / 100)) * monthlyExpenses;
    const estimatedSavings6Months = (monthlyGasSavings + monthlyConversionSavings) * 6;
    
    const reason = `Optimal distribution based on ${userContext.country} regional preferences, chain efficiency, and your spending patterns (${monthlyExpenses.toFixed(0)} USD/month expenses)`;
    
    return {
        distribution,
        totalConversionFee: totalConversionFeePercent,
        estimatedSavings6Months: Math.max(0, estimatedSavings6Months),
        reason
    };
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

