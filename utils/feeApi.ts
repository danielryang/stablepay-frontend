/**
 * API utilities for fetching transaction fees from backend
 */

// Backend API base URL - can be configured via environment variable
// Defaults to localhost:3000 (same as the proxy server)
const BACKEND_BASE_URL =
    (typeof process !== "undefined" && process.env?.EXPO_PUBLIC_BACKEND_URL) ||
    "http://localhost:3000";

/**
 * Response type for fee API calls
 */
export interface FeeResponse {
    fee: number;
    currency?: string;
}

/**
 * Fetch direct fee from backend
 * @param amount - The amount of money to send
 * @param currency - Optional currency code (defaults to "USD")
 * @returns Promise resolving to the direct fee
 */
export async function fetchDirectFee(
    amount: number,
    currency: string = "USD"
): Promise<FeeResponse> {
    try {
        const response = await fetch(`${BACKEND_BASE_URL}/api/fees/direct`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                amount,
                currency,
            }),
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch direct fee: HTTP ${response.status}`);
        }

        const data = await response.json();

        // Validate response structure
        if (typeof data.fee !== "number") {
            throw new Error("Invalid response format: fee must be a number");
        }

        return {
            fee: data.fee,
            currency: data.currency || currency,
        };
    } catch (error) {
        console.error("Error fetching direct fee:", error);
        throw error;
    }
}

/**
 * Fetch minimized fee from backend
 * @param amount - The amount of money to send
 * @param currency - Optional currency code (defaults to "USD")
 * @returns Promise resolving to the minimized fee
 */
export async function fetchMinimizedFee(
    amount: number,
    currency: string = "USD"
): Promise<FeeResponse> {
    try {
        const response = await fetch(`${BACKEND_BASE_URL}/api/fees/minimized`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                amount,
                currency,
            }),
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch minimized fee: HTTP ${response.status}`);
        }

        const data = await response.json();

        // Validate response structure
        if (typeof data.fee !== "number") {
            throw new Error("Invalid response format: fee must be a number");
        }

        return {
            fee: data.fee,
            currency: data.currency || currency,
        };
    } catch (error) {
        console.error("Error fetching minimized fee:", error);
        throw error;
    }
}

/**
 * Calculate total fees saved by using minimized fee instead of direct fee
 * @param directFee - The direct fee amount
 * @param minimizedFee - The minimized fee amount
 * @returns The amount of fees saved
 */
export function calculateFeesSaved(directFee: number, minimizedFee: number): number {
    return Math.max(0, directFee - minimizedFee);
}

/**
 * Fetch both fees and calculate savings
 * @param amount - The amount of money to send
 * @param currency - Optional currency code (defaults to "USD")
 * @returns Promise resolving to fee information including savings
 */
export async function fetchFeeInfo(
    amount: number,
    currency: string = "USD"
): Promise<{
    directFee: number;
    minimizedFee: number;
    feesSaved: number;
    currency: string;
}> {
    try {
        // Fetch both fees in parallel for better performance
        const [directFeeResponse, minimizedFeeResponse] = await Promise.all([
            fetchDirectFee(amount, currency),
            fetchMinimizedFee(amount, currency),
        ]);

        const directFee = directFeeResponse.fee;
        const minimizedFee = minimizedFeeResponse.fee;
        const feesSaved = calculateFeesSaved(directFee, minimizedFee);

        return {
            directFee,
            minimizedFee,
            feesSaved,
            currency: directFeeResponse.currency || currency,
        };
    } catch (error) {
        console.error("Error fetching fee info:", error);
        throw error;
    }
}
