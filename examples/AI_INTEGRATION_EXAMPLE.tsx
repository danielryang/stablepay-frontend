/**
 * Example: How to integrate AI enhancements into the optimizer
 * 
 * This shows how to enhance recommendations with AI-generated explanations
 */

import {
    enhanceRecommendationWithAI,
    generateAISummary
} from "@/utils/aiEnhancer";
import { UserBalance } from "@/utils/enhancedOptimizer";
import { useState } from "react";
import { ActivityIndicator, Pressable, Text, TextInput, View } from "react-native";

export default function OptimizerWithAI() {
    const [loading, setLoading] = useState(false);
    const [aiLoading, setAiLoading] = useState(false);
    const [results, setResults] = useState<any>(null);
    const [aiEnhanced, setAiEnhanced] = useState<any>(null);

    const generateReportWithAI = async () => {
        try {
            setLoading(true);
            setAiLoading(false);

            // Step 1: Get algorithmic results (existing pipeline)
            const userBalances: UserBalance[] = [
                { chain: 'ethereum', token: 'USDC', amount: 500 },
                { chain: 'polygon', token: 'USDT', amount: 700 },
            ];

            // ... fetch historical data, stablecoin data, etc. (existing code)
            // const optimization = analyzeAndOptimize(...);

            // Step 2: Enhance with AI (NEW)
            setAiLoading(true);
            
            // Option A: Enhance individual recommendations
            const enhancedRecommendations = await Promise.all(
                results.recommendations.map(async (rec: any) => {
                    try {
                        return await enhanceRecommendationWithAI(rec, {
                            userBalances,
                            userCountry: 'argentina',
                            totalSavings: results.totalPotentialSavings,
                        });
                    } catch (error) {
                        console.warn('AI enhancement failed for recommendation:', error);
                        return rec; // Fallback to original
                    }
                })
            );

            // Option B: Generate AI summary
            const aiSummary = await generateAISummary(results, {
                userCountry: 'argentina',
                monthlyExpenses: 800,
            });

            setAiEnhanced({
                recommendations: enhancedRecommendations,
                summary: aiSummary,
            });

        } catch (error) {
            console.error('Error:', error);
        } finally {
            setLoading(false);
            setAiLoading(false);
        }
    };

    return (
        <View>
            {/* Loading states */}
            {loading && <ActivityIndicator />}
            {aiLoading && (
                <View>
                    <ActivityIndicator />
                    <Text>Enhancing with AI...</Text>
                </View>
            )}

            {/* AI Summary */}
            {aiEnhanced?.summary && (
                <View style={{ padding: 16, backgroundColor: '#F0F9FF', borderRadius: 8 }}>
                    <Text style={{ fontWeight: 'bold', marginBottom: 8 }}>
                        🤖 AI Analysis Summary
                    </Text>
                    <Text>{aiEnhanced.summary.summary}</Text>
                    
                    {aiEnhanced.summary.keyInsights.length > 0 && (
                        <View style={{ marginTop: 12 }}>
                            <Text style={{ fontWeight: '600', marginBottom: 4 }}>
                                Key Insights:
                            </Text>
                            {aiEnhanced.summary.keyInsights.map((insight: string, idx: number) => (
                                <Text key={idx} style={{ marginLeft: 8 }}>
                                    • {insight}
                                </Text>
                            ))}
                        </View>
                    )}
                </View>
            )}

            {/* Enhanced Recommendations */}
            {aiEnhanced?.recommendations?.map((rec: any, idx: number) => (
                <View key={idx} style={{ margin: 16, padding: 16, backgroundColor: '#FFF', borderRadius: 8 }}>
                    {/* Original recommendation */}
                    <Text style={{ fontWeight: 'bold' }}>
                        {rec.type === 'switch_stablecoin' && 
                            `Switch ${rec.from} → ${rec.to} on ${rec.chain}`
                        }
                    </Text>

                    {/* AI Explanation */}
                    {rec.aiExplanation && (
                        <View style={{ marginTop: 12, padding: 12, backgroundColor: '#F9FAFB', borderRadius: 6 }}>
                            <Text style={{ fontSize: 12, color: '#6B7280', marginBottom: 4 }}>
                                🤖 AI Explanation:
                            </Text>
                            <Text style={{ fontSize: 14 }}>
                                {rec.aiExplanation}
                            </Text>
                        </View>
                    )}

                    {/* AI Insights */}
                    {rec.aiInsights && rec.aiInsights.length > 0 && (
                        <View style={{ marginTop: 8 }}>
                            {rec.aiInsights.map((insight: string, i: number) => (
                                <Text key={i} style={{ fontSize: 12, color: '#6B7280', marginTop: 4 }}>
                                    💡 {insight}
                                </Text>
                            ))}
                        </View>
                    )}
                </View>
            ))}
        </View>
    );
}

/**
 * Example: Interactive Q&A Feature
 */
export function PortfolioQABot({ results, userBalances }: any) {
    const [question, setQuestion] = useState('');
    const [answer, setAnswer] = useState('');
    const [loading, setLoading] = useState(false);

    const askQuestion = async () => {
        if (!question.trim()) return;

        setLoading(true);
        try {
            const { answerPortfolioQuestion } = await import('@/utils/aiEnhancer');
            const response = await answerPortfolioQuestion(question, results, {
                userBalances,
                userCountry: 'argentina',
            });
            setAnswer(response);
        } catch (error) {
            setAnswer('Sorry, I couldn\'t process that question. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={{ padding: 16 }}>
            <Text style={{ fontWeight: 'bold', marginBottom: 8 }}>
                💬 Ask about your portfolio
            </Text>
            <TextInput
                value={question}
                onChangeText={setQuestion}
                placeholder="e.g., Should I switch to USDT?"
                style={{ borderWidth: 1, padding: 8, borderRadius: 4, marginBottom: 8 }}
            />
            <Pressable
                onPress={askQuestion}
                style={{ backgroundColor: '#0891D1', padding: 12, borderRadius: 4 }}
            >
                <Text style={{ color: '#FFF', textAlign: 'center' }}>
                    {loading ? 'Thinking...' : 'Ask'}
                </Text>
            </Pressable>
            
            {answer && (
                <View style={{ marginTop: 16, padding: 12, backgroundColor: '#F0F9FF', borderRadius: 6 }}>
                    <Text>{answer}</Text>
                </View>
            )}
        </View>
    );
}

