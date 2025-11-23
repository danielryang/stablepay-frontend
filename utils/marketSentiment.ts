/**
 * Market Sentiment Analysis
 * Uses real data - no placeholders
 * 
 * Strategy:
 * 1. Try CryptoPanic API (if available) for news sentiment
 * 2. Fallback to price volatility analysis (uses existing CoinGecko data)
 * 3. Use gas price trends as additional signal
 */

import { fetchRealHistoricalData } from './realDataFetcher';

export interface MarketSentimentResult {
    sentiment: 'bullish' | 'bearish' | 'neutral';
    confidence: number;
    reasoning: string;
    recentNews?: Array<{ title: string; sentiment: string }>;
    indicators: {
        priceTrend: number; // Percentage change
        volatility: number; // 0-1 scale
        gasTrend: 'increasing' | 'decreasing' | 'stable';
    };
}

/**
 * Calculate volatility from price array
 */
function calculateVolatility(prices: number[]): number {
    if (prices.length < 2) return 0;
    
    const returns: number[] = [];
    for (let i = 1; i < prices.length; i++) {
        const change = (prices[i] - prices[i-1]) / prices[i-1];
        returns.push(change);
    }
    
    const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / returns.length;
    return Math.sqrt(variance);
}

/**
 * Analyze gas price trends
 */
function analyzeGasTrend(historicalData: any): 'increasing' | 'decreasing' | 'stable' {
    if (!historicalData || historicalData.length < 7) return 'stable';
    
    const gasCosts = historicalData.map((d: any) => d.estimatedGasCostUSD);
    const recent = gasCosts.slice(-7);
    const older = gasCosts.slice(0, -7);
    
    if (older.length === 0) return 'stable';
    
    const recentAvg = recent.reduce((a: number, b: number) => a + b, 0) / recent.length;
    const olderAvg = older.reduce((a: number, b: number) => a + b, 0) / older.length;
    
    const change = ((recentAvg - olderAvg) / olderAvg) * 100;
    
    if (change > 10) return 'increasing';
    if (change < -10) return 'decreasing';
    return 'stable';
}

/**
 * Fetch market sentiment from CryptoPanic API
 */
async function fetchCryptoPanicSentiment(): Promise<{
    sentiment: 'bullish' | 'bearish' | 'neutral';
    confidence: number;
    reasoning: string;
    recentNews: Array<{ title: string; sentiment: string }>;
} | null> {
    const apiKey = typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_CRYPTOPANIC_API_KEY;
    
    if (!apiKey) {
        return null; // No API key, skip
    }
    
    try {
        const response = await fetch(
            `https://cryptopanic.com/api/v1/posts/?auth_token=${apiKey}&public=true&currencies=USDC,USDT,DAI&filter=hot&limit=10`,
            {
                headers: { 'Accept': 'application/json' },
                mode: 'cors',
            }
        );
        
        if (!response.ok) {
            console.warn('CryptoPanic API failed:', response.status);
            return null;
        }
        
        const data = await response.json();
        const posts = data.results || [];
        
        if (posts.length === 0) {
            return null;
        }
        
        // Analyze sentiment
        const sentiments = posts.map((post: any) => {
            // CryptoPanic provides: positive, negative, or neutral
            return post.sentiment || 'neutral';
        });
        
        const positiveCount = sentiments.filter((s: string) => s === 'positive').length;
        const negativeCount = sentiments.filter((s: string) => s === 'negative').length;
        const total = sentiments.length;
        
        let sentiment: 'bullish' | 'bearish' | 'neutral' = 'neutral';
        let confidence = 0.5;
        
        if (total > 0) {
            const positiveRatio = positiveCount / total;
            const negativeRatio = negativeCount / total;
            
            if (positiveRatio > 0.6) {
                sentiment = 'bullish';
                confidence = Math.min(0.9, positiveRatio);
            } else if (negativeRatio > 0.6) {
                sentiment = 'bearish';
                confidence = Math.min(0.9, negativeRatio);
            } else {
                sentiment = 'neutral';
                confidence = 0.5;
            }
        }
        
        return {
            sentiment,
            confidence,
            reasoning: `Based on ${total} recent news articles: ${positiveCount} positive, ${negativeCount} negative, ${total - positiveCount - negativeCount} neutral`,
            recentNews: posts.slice(0, 3).map((post: any) => ({
                title: post.title,
                sentiment: post.sentiment || 'neutral'
            }))
        };
    } catch (error) {
        console.warn('CryptoPanic API error:', error);
        return null;
    }
}

/**
 * Analyze sentiment from price data (fallback method - uses real data)
 */
function analyzePriceSentiment(historicalData: any): {
    sentiment: 'bullish' | 'bearish' | 'neutral';
    confidence: number;
    reasoning: string;
    priceTrend: number;
    volatility: number;
} {
    // Use Ethereum as proxy for overall market (most liquid)
    const ethData = historicalData.chains?.ethereum;
    
    if (!ethData || ethData.length < 7) {
        return {
            sentiment: 'neutral',
            confidence: 0.3,
            reasoning: 'Insufficient data for sentiment analysis',
            priceTrend: 0,
            volatility: 0
        };
    }
    
    const prices = ethData.map((d: any) => d.tokenPrice);
    const recentPrices = prices.slice(-7); // Last 7 days
    const olderPrices = prices.slice(0, -7); // Previous days
    
    if (olderPrices.length === 0) {
        return {
            sentiment: 'neutral',
            confidence: 0.3,
            reasoning: 'Insufficient historical data',
            priceTrend: 0,
            volatility: calculateVolatility(prices)
        };
    }
    
    const recentAvg = recentPrices.reduce((a, b) => a + b, 0) / recentPrices.length;
    const olderAvg = olderPrices.reduce((a, b) => a + b, 0) / olderPrices.length;
    
    const priceTrend = ((recentAvg - olderAvg) / olderAvg) * 100;
    const volatility = calculateVolatility(prices);
    
    let sentiment: 'bullish' | 'bearish' | 'neutral' = 'neutral';
    let confidence = 0.5;
    let reasoning = '';
    
    // Determine sentiment based on price trend and volatility
    if (priceTrend > 5 && volatility < 0.2) {
        sentiment = 'bullish';
        confidence = Math.min(0.9, 0.5 + (priceTrend / 100));
        reasoning = `Strong upward trend (+${priceTrend.toFixed(2)}%) with low volatility`;
    } else if (priceTrend < -5 && volatility < 0.2) {
        sentiment = 'bearish';
        confidence = Math.min(0.9, 0.5 + (Math.abs(priceTrend) / 100));
        reasoning = `Downward trend (${priceTrend.toFixed(2)}%) with low volatility`;
    } else if (volatility > 0.3) {
        sentiment = 'bearish';
        confidence = Math.min(0.8, volatility);
        reasoning = `High volatility (${(volatility * 100).toFixed(1)}%) indicates market uncertainty`;
    } else if (Math.abs(priceTrend) < 2) {
        sentiment = 'neutral';
        confidence = 0.5;
        reasoning = `Stable market conditions (${priceTrend > 0 ? '+' : ''}${priceTrend.toFixed(2)}% change)`;
    } else {
        sentiment = priceTrend > 0 ? 'bullish' : 'bearish';
        confidence = 0.6;
        reasoning = `Moderate ${priceTrend > 0 ? 'upward' : 'downward'} trend (${priceTrend > 0 ? '+' : ''}${priceTrend.toFixed(2)}%)`;
    }
    
    return {
        sentiment,
        confidence,
        reasoning,
        priceTrend,
        volatility
    };
}

/**
 * Main function to fetch market sentiment
 * Uses real data - no placeholders
 */
export async function fetchMarketSentiment(): Promise<MarketSentimentResult> {
    try {
        // Try CryptoPanic API first (if available)
        const newsSentiment = await fetchCryptoPanicSentiment();
        
        // Always fetch price data for analysis
        const historicalData = await fetchRealHistoricalData(30); // Last 30 days
        
        // Analyze price sentiment
        const priceAnalysis = analyzePriceSentiment(historicalData);
        
        // Analyze gas trends
        const ethData = historicalData.chains?.ethereum;
        const gasTrend = ethData ? analyzeGasTrend(ethData) : 'stable';
        
        // Combine news sentiment (if available) with price analysis
        if (newsSentiment) {
            // Weight: 60% news, 40% price
            const combinedConfidence = (newsSentiment.confidence * 0.6) + (priceAnalysis.confidence * 0.4);
            
            // If both agree, use that sentiment
            // If they disagree, use neutral with lower confidence
            let finalSentiment = newsSentiment.sentiment;
            let finalConfidence = combinedConfidence;
            
            if (newsSentiment.sentiment !== priceAnalysis.sentiment) {
                // Disagreement - use neutral
                finalSentiment = 'neutral';
                finalConfidence = Math.max(0.4, combinedConfidence * 0.7);
            }
            
            return {
                sentiment: finalSentiment,
                confidence: finalConfidence,
                reasoning: `${newsSentiment.reasoning}. Price analysis: ${priceAnalysis.reasoning}`,
                recentNews: newsSentiment.recentNews,
                indicators: {
                    priceTrend: priceAnalysis.priceTrend,
                    volatility: priceAnalysis.volatility,
                    gasTrend
                }
            };
        } else {
            // No news API - use price analysis only
            return {
                sentiment: priceAnalysis.sentiment,
                confidence: priceAnalysis.confidence * 0.8, // Lower confidence without news
                reasoning: `Price-based analysis: ${priceAnalysis.reasoning}`,
                indicators: {
                    priceTrend: priceAnalysis.priceTrend,
                    volatility: priceAnalysis.volatility,
                    gasTrend
                }
            };
        }
    } catch (error) {
        console.error('Market sentiment analysis failed:', error);
        
        // Return neutral with low confidence
        return {
            sentiment: 'neutral',
            confidence: 0.3,
            reasoning: 'Unable to analyze market sentiment - using neutral as default',
            indicators: {
                priceTrend: 0,
                volatility: 0,
                gasTrend: 'stable'
            }
        };
    }
}

