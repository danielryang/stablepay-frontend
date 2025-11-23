/**
 * API utilities for evaluating conversion paths
 */

import { Platform } from "react-native";

/**
 * Get the proxy server URL based on the platform
 * On mobile devices, we need to use the LAN IP instead of localhost
 */
function getProxyBaseUrl(): string {
    // Check for explicit environment variable first
    if (typeof process !== "undefined" && process.env?.EXPO_PUBLIC_PROXY_URL) {
        return process.env.EXPO_PUBLIC_PROXY_URL;
    }

    // On web, use localhost
    if (Platform.OS === "web") {
        return "http://localhost:3000";
    }

    // On native (iOS/Android), try to get the dev server URL from Expo Constants
    try {
        const Constants = require("expo-constants").default;
        if (Constants?.expoConfig?.hostUri) {
            // Extract IP from hostUri (format: "192.168.1.100:8081")
            const hostUri = Constants.expoConfig.hostUri;
            const ip = hostUri.split(":")[0];
            return `http://${ip}:3000`;
        }
        // Fallback: try to get from manifest
        if (Constants?.manifest?.hostUri) {
            const hostUri = Constants.manifest.hostUri;
            const ip = hostUri.split(":")[0];
            return `http://${ip}:3000`;
        }
    } catch (error) {
        console.warn("Could not get host IP from Expo Constants:", error);
    }

    // Android emulator special case: use 10.0.2.2 to access host machine
    if (Platform.OS === "android" && __DEV__) {
        // Try Android emulator host IP first
        return "http://10.0.2.2:3000";
    }

    // Final fallback: use localhost (might not work on physical devices)
    return "http://localhost:3000";
}

const PROXY_BASE_URL = getProxyBaseUrl();

// Log the proxy URL in development for debugging
if (__DEV__) {
    console.log(`🌐 Path API Proxy URL: ${PROXY_BASE_URL}`);
}

/**
 * Response type for path evaluation API calls
 */
export interface PathHop {
    from_ccy: string;
    to_ccy: string;
    fee_percent: number;
    fee_local: number;
    fee_ars: number;
    amount_before: number;
    amount_after_fee: number;
    amount_next: number;
    exchange: string;
}

export interface PathEvaluationResponse {
    path: string[];
    final_amount: number;
    final_amount_ars: number;
    total_fee_local: number;
    total_fee_ars: number;
    hops: PathHop[];
}

/**
 * Evaluate conversion path using the backend API
 * @param fromCurrency - The source currency code (e.g., "USDC", "ARS", "SOL")
 * @param toCurrency - The destination currency code (e.g., "USDC", "ARS", "SOL")
 * @param amount - The amount to convert
 * @returns Promise resolving to the path evaluation result
 */
export async function evaluatePath(
    fromCurrency: string,
    toCurrency: string,
    amount: number
): Promise<PathEvaluationResponse> {
    const url = `${PROXY_BASE_URL}/api/evaluate_path`;
    
    try {
        if (__DEV__) {
            console.log(`🔄 Evaluating path: ${amount} ${fromCurrency} -> ${toCurrency} via ${url}`);
        }

        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                from_currency: fromCurrency,
                to_currency: toCurrency,
                amount: amount,
            }),
        });

        if (!response.ok) {
            const errorText = await response.text().catch(() => "Unknown error");
            throw new Error(
                `Failed to evaluate path: HTTP ${response.status}. URL: ${url}. Error: ${errorText}`
            );
        }

        const data = await response.json();
        
        // Validate response structure
        if (!data.path || !Array.isArray(data.path)) {
            throw new Error("Invalid response format: path must be an array");
        }
        if (!data.hops || !Array.isArray(data.hops)) {
            throw new Error("Invalid response format: hops must be an array");
        }
        if (typeof data.total_fee_ars !== "number") {
            throw new Error("Invalid response format: total_fee_ars must be a number");
        }

        if (__DEV__) {
            console.log(`✅ Path evaluated: ${data.path.join(" -> ")}`);
            console.log(`💰 Total fee (ARS): ${data.total_fee_ars}`);
        }

        return {
            path: data.path,
            final_amount: data.final_amount,
            final_amount_ars: data.final_amount_ars,
            total_fee_local: data.total_fee_local,
            total_fee_ars: data.total_fee_ars,
            hops: data.hops,
        };
    } catch (error: any) {
        console.error(`❌ Error evaluating path via ${url}:`, error);
        // Provide more helpful error message
        if (error.message?.includes("Network request failed") || error.message?.includes("Failed to fetch")) {
            throw new Error(
                `Network error: Could not reach proxy server at ${url}. ` +
                `Make sure the proxy server is running and accessible from your device. ` +
                `On physical devices, ensure you're using the correct LAN IP address.`
            );
        }
        throw error;
    }
}

