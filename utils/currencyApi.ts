/**
 * API utilities for currency conversion
 */

// Proxy server URL - uses the proxy server to avoid CORS issues
// The proxy server forwards requests to the backend at localhost:8000
const PROXY_BASE_URL =
    (typeof process !== "undefined" && process.env?.EXPO_PUBLIC_PROXY_URL) ||
    "http://localhost:3000";

/**
 * Response type for currency conversion API calls
 */
export interface CurrencyConversionResponse {
    converted_amount: number;
    from_ccy: string;
    to_ccy: string;
    amount: number;
}

/**
 * Convert currency using the backend API
 * @param fromCcy - The source currency code (e.g., "USDC", "ARS")
 * @param toCcy - The destination currency code (e.g., "USDC", "ARS")
 * @param amount - The amount to convert
 * @returns Promise resolving to the conversion result
 */
export async function convertCurrency(
    fromCcy: string,
    toCcy: string,
    amount: number
): Promise<CurrencyConversionResponse> {
    try {
        const response = await fetch(`${PROXY_BASE_URL}/api/convert_currency`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                from_ccy: fromCcy,
                to_ccy: toCcy,
                amount: amount,
            }),
        });

        if (!response.ok) {
            throw new Error(`Failed to convert currency: HTTP ${response.status}`);
        }

        const data = await response.json();
        
        // Validate response structure
        if (typeof data.converted_amount !== "number") {
            throw new Error("Invalid response format: converted_amount must be a number");
        }

        return {
            converted_amount: data.converted_amount,
            from_ccy: data.from_ccy || fromCcy,
            to_ccy: data.to_ccy || toCcy,
            amount: data.amount || amount,
        };
    } catch (error) {
        console.error("Error converting currency:", error);
        throw error;
    }
}

