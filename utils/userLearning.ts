/**
 * User Learning System
 * Tracks user actions and preferences to improve recommendations
 * Uses AsyncStorage for persistence
 */

// Note: For Expo, we can use expo-secure-store or a simple in-memory cache
// For hackathon, we'll use a simple approach that works across platforms

export interface UserAction {
    recommendationId: string;
    type: 'switch_stablecoin' | 'convert_with_timing' | 'bridge';
    action: 'accepted' | 'rejected' | 'ignored';
    timestamp: number;
    savings?: number; // Actual savings if action was taken
    from?: string; // e.g., 'USDC'
    to?: string; // e.g., 'USDT'
    chain?: string;
}

export interface UserPatterns {
    preferredStablecoin?: string;
    preferredChain?: string;
    averageSavings?: number;
    acceptanceRate?: number;
    riskTolerance?: 'low' | 'medium' | 'high';
    totalActions: number;
}

// In-memory storage (for hackathon - could use AsyncStorage for persistence)
let userActionsStorage: UserAction[] = [];

/**
 * Initialize storage (load from AsyncStorage if available)
 */
async function initializeStorage() {
    try {
        // Try to use AsyncStorage if available
        const AsyncStorage = require('@react-native-async-storage/async-storage').default;
        const stored = await AsyncStorage.getItem('userActions');
        if (stored) {
            userActionsStorage = JSON.parse(stored);
        }
    } catch (error) {
        // AsyncStorage not available or failed - use in-memory
        console.log('Using in-memory storage for user actions');
    }
}

/**
 * Save to storage
 */
async function saveStorage() {
    try {
        const AsyncStorage = require('@react-native-async-storage/async-storage').default;
        await AsyncStorage.setItem('userActions', JSON.stringify(userActionsStorage));
    } catch (error) {
        // Ignore - using in-memory only
    }
}

/**
 * Track a user action
 */
export async function trackUserAction(action: UserAction): Promise<void> {
    await initializeStorage();
    
    userActionsStorage.push(action);
    
    // Keep only last 100 actions
    if (userActionsStorage.length > 100) {
        userActionsStorage = userActionsStorage.slice(-100);
    }
    
    await saveStorage();
}

/**
 * Get all user actions
 */
export async function getUserActionHistory(): Promise<UserAction[]> {
    await initializeStorage();
    return [...userActionsStorage];
}

/**
 * Analyze user patterns from action history
 */
export async function analyzeUserPatterns(): Promise<UserPatterns> {
    await initializeStorage();
    
    const actions = userActionsStorage;
    
    if (actions.length === 0) {
        return {
            totalActions: 0,
            acceptanceRate: 0
        };
    }
    
    // Calculate acceptance rate
    const accepted = actions.filter(a => a.action === 'accepted');
    const acceptanceRate = accepted.length / actions.length;
    
    // Find preferred stablecoin (most accepted switches)
    const stablecoinSwitches = actions.filter(
        a => a.type === 'switch_stablecoin' && a.action === 'accepted'
    );
    
    const stablecoinCounts: { [key: string]: number } = {};
    stablecoinSwitches.forEach(action => {
        if (action.to) {
            stablecoinCounts[action.to] = (stablecoinCounts[action.to] || 0) + 1;
        }
    });
    
    const preferredStablecoin = Object.entries(stablecoinCounts)
        .sort(([, a], [, b]) => b - a)[0]?.[0];
    
    // Find preferred chain (most accepted actions on)
    const chainCounts: { [key: string]: number } = {};
    accepted.forEach(action => {
        if (action.chain) {
            chainCounts[action.chain] = (chainCounts[action.chain] || 0) + 1;
        }
    });
    
    const preferredChain = Object.entries(chainCounts)
        .sort(([, a], [, b]) => b - a)[0]?.[0];
    
    // Calculate average savings
    const savings = accepted
        .map(a => a.savings || 0)
        .filter(s => s > 0);
    const averageSavings = savings.length > 0
        ? savings.reduce((a, b) => a + b, 0) / savings.length
        : undefined;
    
    // Infer risk tolerance from acceptance patterns
    // Users who accept high-risk recommendations = high risk tolerance
    // Users who reject high-risk = low risk tolerance
    const highRiskActions = actions.filter(a => {
        // Bridge recommendations are higher risk
        return a.type === 'bridge' && a.action === 'accepted';
    });
    const riskTolerance: 'low' | 'medium' | 'high' = 
        highRiskActions.length > actions.length * 0.3 ? 'high' :
        highRiskActions.length > actions.length * 0.1 ? 'medium' : 'low';
    
    return {
        preferredStablecoin,
        preferredChain,
        averageSavings,
        acceptanceRate,
        riskTolerance,
        totalActions: actions.length
    };
}

/**
 * Get user preferences (for AI prompts)
 */
export async function getUserPreferencesForAI(): Promise<{
    preferredStablecoin?: string;
    preferredChain?: string;
    riskTolerance?: string;
    acceptanceRate?: number;
}> {
    const patterns = await analyzeUserPatterns();
    
    return {
        preferredStablecoin: patterns.preferredStablecoin,
        preferredChain: patterns.preferredChain,
        riskTolerance: patterns.riskTolerance,
        acceptanceRate: patterns.acceptanceRate
    };
}

/**
 * Clear user data (for testing/reset)
 */
export async function clearUserData(): Promise<void> {
    userActionsStorage = [];
    await saveStorage();
}

