/**
 * AI/LLM Enhancement Layer for Smart Allocation Optimizer
 * 
 * This module adds AI-powered explanations, insights, and analysis
 * on top of the existing algorithmic recommendations.
 */

import { OptimizationResult, Recommendation } from './enhancedOptimizer';

/**
 * Get AI configuration from environment variables
 */
function getAIConfig() {
    // Get model from environment, default to Claude Haiku
    let model = 'claude-3-haiku-20240307'; // Default: Claude Haiku - fast and cost-effective
    
    if (typeof process !== 'undefined' && process.env) {
        model = process.env.EXPO_PUBLIC_ANTHROPIC_MODEL || 
                process.env.EXPO_PUBLIC_CLAUDE_MODEL ||
                model;
    } else {
        try {
            const Constants = require('expo-constants').default;
            model = Constants.expoConfig?.extra?.anthropicModel ||
                    Constants.expoConfig?.extra?.claudeModel ||
                    model;
        } catch {
            // Use default
        }
    }
    
    return {
        provider: 'anthropic' as 'openai' | 'anthropic' | 'gemini' | 'groq',
        model: model,
        temperature: 0.3, // Lower = more deterministic
        maxTokens: 500,
        cacheEnabled: true,
    };
}

// Configuration (dynamically loaded)
const AI_CONFIG = getAIConfig();

// Cache for AI responses (in-memory, could use AsyncStorage for persistence)
const aiCache = new Map<string, string>();

/**
 * Get API key from environment
 */
function getApiKey(): string | null {
    if (typeof process !== 'undefined' && process.env) {
        // Prioritize Anthropic/Claude API key
        return process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY ||
               process.env.EXPO_PUBLIC_CLAUDE_API_KEY ||
               process.env.EXPO_PUBLIC_OPENAI_API_KEY || 
               process.env.EXPO_PUBLIC_GEMINI_API_KEY ||
               null;
    }
    try {
        const Constants = require('expo-constants').default;
        return Constants.expoConfig?.extra?.anthropicApiKey ||
               Constants.expoConfig?.extra?.claudeApiKey ||
               Constants.expoConfig?.extra?.openaiApiKey ||
               Constants.expoConfig?.extra?.geminiApiKey ||
               null;
    } catch {
        return null;
    }
}

/**
 * Generate cache key from data
 */
function generateCacheKey(data: any): string {
    return JSON.stringify(data).substring(0, 100); // Use first 100 chars as key
}

/**
 * Call OpenAI API
 */
async function callOpenAI(prompt: string, systemPrompt: string): Promise<string> {
    const apiKey = getApiKey();
    if (!apiKey) {
        throw new Error('OpenAI API key not found. Add EXPO_PUBLIC_OPENAI_API_KEY to .env');
    }

    const config = getAIConfig();

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
            model: config.model,
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: prompt }
            ],
            temperature: config.temperature,
            max_tokens: config.maxTokens,
        }),
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(`OpenAI API error: ${error.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || 'Unable to generate explanation';
}

/**
 * Call Anthropic Claude API
 */
async function callAnthropic(prompt: string, systemPrompt: string): Promise<string> {
    const apiKey = getApiKey();
    if (!apiKey) {
        throw new Error('Anthropic API key not found');
    }

    // Get current config (in case model changed)
    const config = getAIConfig();
    console.log(`🔑 Using Claude model: ${config.model}`);

    // Anthropic API call - correct format per official docs
    // Note: CORS is blocked in browsers - this will only work on native devices
    try {
        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': apiKey,
                'anthropic-version': '2023-06-01', // Latest stable version
            },
            body: JSON.stringify({
                model: config.model,
                max_tokens: config.maxTokens,
                system: systemPrompt,
                messages: [
                    { role: 'user', content: prompt }
                ],
            }),
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({ error: { message: 'Unknown error' } }));
            throw new Error(`Anthropic API error: ${error.error?.message || 'Unknown error'}`);
        }

        const data = await response.json();
        return data.content[0]?.text || 'Unable to generate explanation';
    } catch (fetchError: any) {
        // CORS errors are expected in browsers - silently handle
        const errorMsg = fetchError?.message || String(fetchError);
        if (errorMsg.includes('Failed to fetch') || errorMsg.includes('CORS') || errorMsg.includes('Access-Control')) {
            // Silently handle CORS - expected behavior in browsers
            throw new Error('CORS_BLOCKED');
        }
        throw fetchError;
    }
}

/**
 * Call Google Gemini API
 */
async function callGemini(prompt: string, systemPrompt: string): Promise<string> {
    const apiKey = getApiKey();
    if (!apiKey) {
        throw new Error('Gemini API key not found');
    }

    const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`,
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: `${systemPrompt}\n\n${prompt}`
                    }]
                }],
                generationConfig: {
                    temperature: getAIConfig().temperature,
                    maxOutputTokens: getAIConfig().maxTokens,
                },
            }),
        }
    );

    if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(`Gemini API error: ${error.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    return data.candidates[0]?.content?.parts[0]?.text || 'Unable to generate explanation';
}

/**
 * Call Groq API (fast and free tier available)
 */
async function callGroq(prompt: string, systemPrompt: string): Promise<string> {
    const apiKey = getApiKey();
    if (!apiKey) {
        throw new Error('Groq API key not found');
    }

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
            model: 'llama-3.1-8b-instant', // Fast and free tier available
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: prompt }
            ],
            temperature: AI_CONFIG.temperature,
            max_tokens: AI_CONFIG.maxTokens,
        }),
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(`Groq API error: ${error.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || 'Unable to generate explanation';
}

/**
 * Main AI call function with provider selection and caching
 */
async function callAI(prompt: string, systemPrompt: string): Promise<string> {
    // Get current config (in case it changed)
    const config = getAIConfig();
    
    // Check cache first
    if (config.cacheEnabled) {
        const cacheKey = generateCacheKey({ prompt, systemPrompt });
        const cached = aiCache.get(cacheKey);
        if (cached) {
            console.log('✅ Using cached AI response');
            return cached;
        }
    }

    let result: string;
    
    try {
        switch (config.provider) {
            case 'openai':
                result = await callOpenAI(prompt, systemPrompt);
                break;
            case 'anthropic':
                result = await callAnthropic(prompt, systemPrompt);
                break;
            case 'gemini':
                result = await callGemini(prompt, systemPrompt);
                break;
            case 'groq':
                result = await callGroq(prompt, systemPrompt);
                break;
            default:
                throw new Error(`Unknown AI provider: ${config.provider}`);
        }

        // Cache the result
        if (config.cacheEnabled) {
            const cacheKey = generateCacheKey({ prompt, systemPrompt });
            aiCache.set(cacheKey, result);
        }

        return result;
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        
        // Check if it's a CORS error (browser restriction)
        // Suppress console errors for CORS - it's expected in browsers
        if (errorMessage.includes('CORS') || errorMessage.includes('Failed to fetch') || errorMessage.includes('Access-Control') || errorMessage.includes('CORS_BLOCKED')) {
            // Silently return fallback - don't spam console with CORS errors
            return generateFallbackExplanation(prompt);
        }
        
        // Only log non-CORS errors
        console.error('AI API call failed:', error);
        // Return fallback explanation
        return generateFallbackExplanation(prompt);
    }
}

/**
 * Generate fallback explanation if AI fails
 */
function generateFallbackExplanation(prompt: string): string {
    // Simple template-based fallback
    if (prompt.includes('stablecoin')) {
        return 'Based on liquidity, fees, and regional preferences, this stablecoin switch could save you money over time.';
    }
    if (prompt.includes('timing')) {
        return 'The current market conditions suggest this is a good time for this transaction.';
    }
    if (prompt.includes('bridge')) {
        return 'Moving funds to a more efficient chain could reduce your transaction costs.';
    }
    return 'This recommendation is based on real market data analysis.';
}

/**
 * Enhance recommendation with AI-generated explanation
 */
export async function enhanceRecommendationWithAI(
    recommendation: Recommendation,
    context: {
        userBalances: Array<{ chain: string; token: string; amount: number }>;
        userCountry: string;
        totalSavings: number;
    }
): Promise<Recommendation & { aiExplanation?: string; aiInsights?: string[] }> {
    const systemPrompt = `You are a financial advisor specializing in cryptocurrency and stablecoin optimization. 
Provide clear, concise explanations in plain language. Be factual and avoid financial advice disclaimers unless necessary.
Keep responses under 150 words.`;

    let prompt = '';
    
    switch (recommendation.type) {
        case 'switch_stablecoin':
            prompt = `Explain why switching from ${recommendation.from} to ${recommendation.to} on ${recommendation.chain} is recommended.
Context: User has $${recommendation.amount} in ${recommendation.from} on ${recommendation.chain}.
Monthly savings: $${recommendation.monthlySavings}. 6-month savings: $${recommendation.sixMonthSavings}.
User is in ${context.userCountry}.
Provide 2-3 key reasons in simple terms.`;
            break;
            
        case 'convert_with_timing':
            prompt = `Explain the timing recommendation for converting ${recommendation.amount} ${recommendation.token} to fiat.
Timing: ${recommendation.timing}. Due date: ${recommendation.dueDate}.
Best time: ${recommendation.timingAdvice?.bestTime}.
Explain why ${recommendation.timing === 'wait' ? 'waiting' : 'converting now'} makes sense.`;
            break;
            
        case 'bridge':
            prompt = `Explain why bridging $${recommendation.amount} from ${recommendation.from} to ${recommendation.to} is recommended.
Cost: $${recommendation.cost}. Monthly savings: $${recommendation.monthlySavings}.
Break-even: ${recommendation.breakEvenMonths} months.
Explain the benefits in simple terms.`;
            break;
            
        default:
            return recommendation as any;
    }

    try {
        const aiExplanation = await callAI(prompt, systemPrompt);
        
        // Extract insights (simple parsing)
        const insights = extractInsights(aiExplanation);
        
        return {
            ...recommendation,
            aiExplanation,
            aiInsights: insights,
        };
    } catch (error) {
        console.warn('AI enhancement failed, using original recommendation:', error);
        return recommendation as any;
    }
}

/**
 * Generate comprehensive AI summary of optimization results
 */
export async function generateAISummary(
    results: OptimizationResult,
    context: {
        userCountry: string;
        monthlyExpenses: number;
    }
): Promise<{
    summary: string;
    keyInsights: string[];
    actionItems: string[];
}> {
    const systemPrompt = `You are a financial advisor analyzing a cryptocurrency portfolio optimization report.
Summarize the key findings and provide actionable insights. Be concise and practical.`;

    const prompt = `Summarize this optimization analysis:
- Total potential savings: $${results.totalPotentialSavings.toFixed(2)}
- Most efficient chain: ${results.mostEfficientChain}
- Number of recommendations: ${results.recommendations.length}
- User country: ${context.userCountry}
- Monthly expenses: $${context.monthlyExpenses}

Provide:
1. A 2-3 sentence summary
2. Top 3 key insights
3. Top 3 action items

Format as JSON: { summary: string, keyInsights: string[], actionItems: string[] }`;

    try {
        const response = await callAI(prompt, systemPrompt);
        
        // Try to parse JSON response
        try {
            const parsed = JSON.parse(response);
            return {
                summary: parsed.summary || response,
                keyInsights: parsed.keyInsights || [],
                actionItems: parsed.actionItems || [],
            };
        } catch {
            // If not JSON, return as summary
            return {
                summary: response,
                keyInsights: extractInsights(response),
                actionItems: [],
            };
        }
    } catch (error) {
        console.warn('AI summary generation failed:', error);
        return {
            summary: `Based on 90 days of real market data, you could save $${results.totalPotentialSavings.toFixed(2)} over 6 months by optimizing your stablecoin allocation and transaction timing.`,
            keyInsights: [
                `Most efficient chain: ${results.mostEfficientChain}`,
                `${results.recommendations.length} optimization opportunities found`,
            ],
            actionItems: [
                'Review stablecoin switch recommendations',
                'Consider optimal timing for conversions',
                'Evaluate bridge recommendations',
            ],
        };
    }
}

/**
 * Answer user questions about their portfolio
 */
export async function answerPortfolioQuestion(
    question: string,
    results: OptimizationResult,
    context: {
        userBalances: Array<{ chain: string; token: string; amount: number }>;
        userCountry: string;
    }
): Promise<string> {
    const systemPrompt = `You are a helpful financial advisor. Answer questions about cryptocurrency portfolio optimization.
Use the provided data to give accurate, helpful answers. Be concise (under 200 words).`;

    const prompt = `User question: "${question}"

Portfolio data:
- Balances: ${JSON.stringify(context.userBalances)}
- Total savings potential: $${results.totalPotentialSavings.toFixed(2)}
- Most efficient chain: ${results.mostEfficientChain}
- Recommendations: ${results.recommendations.length} total
- User country: ${context.userCountry}

Answer the question based on this data.`;

    try {
        return await callAI(prompt, systemPrompt);
    } catch (error) {
        console.warn('AI question answering failed:', error);
        return 'I apologize, but I\'m unable to process that question right now. Please try rephrasing or check back later.';
    }
}

/**
 * Extract insights from AI response (simple parsing)
 */
function extractInsights(text: string): string[] {
    const insights: string[] = [];
    
    // Look for numbered lists or bullet points
    const lines = text.split('\n');
    for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.match(/^[\d•\-\*]/) || trimmed.length > 20 && trimmed.length < 150) {
            insights.push(trimmed.replace(/^[\d•\-\*]\s*/, ''));
        }
    }
    
    return insights.slice(0, 5); // Max 5 insights
}

/**
 * Analyze market sentiment (future enhancement)
 */
export async function analyzeMarketSentiment(
    historicalData: any,
    currentPrices: any
): Promise<{
    sentiment: 'bullish' | 'bearish' | 'neutral';
    confidence: number;
    reasoning: string;
}> {
    // This would analyze market trends and generate sentiment
    // For now, return neutral
    return {
        sentiment: 'neutral',
        confidence: 0.5,
        reasoning: 'Market sentiment analysis requires additional data sources.',
    };
}

