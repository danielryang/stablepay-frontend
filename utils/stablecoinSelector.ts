/**
 * Determines which stablecoin is best for user's situation
 * Considers: chain, country, liquidity, conversion fees, stability
 */
import { StablecoinLiquidityData } from "./realDataFetcher";

export interface UserContext {
    country: string;
    primaryUse: string;
    monthlyTransactionVolume: number;
}

export interface StablecoinScore {
    totalScore: number;
    liquidityScore: number;
    conversionFee: number;
    regionalFit: number;
    reasons: string[];
    price: number;
    volume24h: number;
}

export interface StablecoinRecommendation {
    recommended: {
        name: string;
        totalScore: number;
        liquidityScore: number;
        conversionFee: number;
        regionalFit: number;
        reasons: string[];
        price: number;
        volume24h: number;
    };
    alternatives: Array<{
        name: string;
        totalScore: number;
        liquidityScore: number;
        conversionFee: number;
        regionalFit: number;
        reasons: string[];
        price: number;
        volume24h: number;
    }>;
    comparison: Array<{
        name: string;
        totalScore: number;
        liquidityScore: number;
        conversionFee: number;
        regionalFit: number;
        reasons: string[];
        price: number;
        volume24h: number;
    }>;
}

export interface SwitchAnalysis {
    shouldSwitch: boolean;
    reason: string;
    monthlySavings: number;
    breakEvenMonths: number;
    switchCost: number;
    sixMonthSavings: number;
}

/**
 * Determines which stablecoin is best for user's situation
 * Considers: chain, country, liquidity, conversion fees, stability
 */
export function selectOptimalStablecoin(
    userContext: UserContext,
    stablecoinLiquidityData: {
        USDC: StablecoinLiquidityData;
        USDT: StablecoinLiquidityData;
        DAI: StablecoinLiquidityData;
    },
    targetChain: string
): StablecoinRecommendation {
    const { country } = userContext;

    const stablecoins = ["USDC", "USDT", "DAI"];
    const scores: { [key: string]: StablecoinScore } = {};

    for (const stable of stablecoins) {
        const data = stablecoinLiquidityData[stable as keyof typeof stablecoinLiquidityData];
        if (!data) continue;

        let score = 0;
        const reasons: string[] = [];

        // Factor 1: Chain liquidity (40% weight)
        const liquidityScore = data.chainScores[targetChain] || 0;
        score += liquidityScore * 40;
        if (liquidityScore > 0.7) {
            reasons.push(`Excellent liquidity on ${targetChain}`);
        } else if (liquidityScore < 0.5) {
            reasons.push(`Limited liquidity on ${targetChain}`);
        }

        // Factor 2: Conversion fees (30% weight)
        const conversionFee = data.conversionFees[targetChain] || 0.03;
        const feeScore = (0.03 - conversionFee) / 0.015; // Normalize 1.5%-3% range
        score += Math.max(0, feeScore) * 30;
        reasons.push(`~${(conversionFee * 100).toFixed(1)}% conversion fee`);

        // Factor 3: Regional preference (20% weight)
        const regionalPreferences: { [key: string]: { [key: string]: number } } = {
            argentina: { USDT: 1.2, USDC: 1.0, DAI: 0.8 }, // USDT popular in LatAm
            venezuela: { USDT: 1.3, USDC: 0.9, DAI: 0.7 },
            turkey: { USDT: 1.1, USDC: 1.0, DAI: 0.9 },
            default: { USDC: 1.0, USDT: 1.0, DAI: 1.0 },
        };
        const regionalBonus =
            (regionalPreferences[country.toLowerCase()] || regionalPreferences.default)[stable] ||
            1.0;
        score += (regionalBonus - 0.7) * 20; // Normalize
        if (regionalBonus > 1.0) {
            reasons.push(`Popular in ${country}`);
        }

        // Factor 4: Price stability (10% weight)
        // USDC and USDT are typically more stable than DAI
        const stabilityScores: { [key: string]: number } = {
            USDC: 1.0, // Most stable (Circle backed)
            USDT: 0.95, // Very stable (Tether)
            DAI: 0.9, // Decentralized, slightly more volatile
        };
        score += stabilityScores[stable] * 10;

        scores[stable] = {
            totalScore: score,
            liquidityScore: liquidityScore,
            conversionFee: conversionFee,
            regionalFit: regionalBonus,
            reasons: reasons,
            price: data.price,
            volume24h: data.volume24h,
        };
    }

    // Rank stablecoins
    const ranked = Object.entries(scores)
        .sort(([, a], [, b]) => b.totalScore - a.totalScore)
        .map(([name, data]) => ({ name, ...data }));

    return {
        recommended: ranked[0],
        alternatives: ranked.slice(1),
        comparison: ranked,
    };
}

/**
 * Determine if user should SWITCH stablecoins
 */
export function shouldSwitchStablecoin(
    currentStable: StablecoinScore | undefined,
    recommendedStable: StablecoinScore,
    currentBalance: number,
    switchCost: number = 10
): SwitchAnalysis {
    const scoreDifference = recommendedStable.totalScore - (currentStable?.totalScore || 0);
    const feeDifference = (currentStable?.conversionFee || 0.025) - recommendedStable.conversionFee;

    // Calculate monthly savings
    const monthlyVolume = currentBalance * 0.5; // Assume user converts 50% monthly
    const monthlySavings = monthlyVolume * feeDifference;

    // Break-even analysis
    const breakEvenMonths = monthlySavings > 0 ? switchCost / monthlySavings : Infinity;

    const shouldSwitch = breakEvenMonths < 6 && scoreDifference > 10;

    return {
        shouldSwitch: shouldSwitch,
        reason: shouldSwitch
            ? `Switch saves ${(feeDifference * 100).toFixed(2)}% on fees - breaks even in ${breakEvenMonths.toFixed(1)} months`
            : `Not worth switching - would take ${breakEvenMonths.toFixed(1)} months to break even`,
        monthlySavings: monthlySavings,
        breakEvenMonths: breakEvenMonths,
        switchCost: switchCost,
        sixMonthSavings: monthlySavings * 6 - switchCost,
    };
}
