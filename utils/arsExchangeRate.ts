import AsyncStorage from "@react-native-async-storage/async-storage";

const ARS_RATE_STORAGE_KEY = "@stable_living:ars_exchange_rate";
const ARS_RATE_TIMESTAMP_KEY = "@stable_living:ars_exchange_rate_timestamp";
const ARS_BALANCE_STORAGE_KEY = "@stable_living:ars_balance";

// Cache duration: 1 hour (3600000 ms)
const CACHE_DURATION_MS = 60 * 60 * 1000;

/**
 * Get ARS exchange rate from storage
 * Returns the rate: 1 USD = X ARS
 */
export async function getStoredARSExchangeRate(): Promise<number | null> {
    try {
        const rateStr = await AsyncStorage.getItem(ARS_RATE_STORAGE_KEY);
        const timestampStr = await AsyncStorage.getItem(ARS_RATE_TIMESTAMP_KEY);

        if (!rateStr || !timestampStr) {
            return null;
        }

        const rate = parseFloat(rateStr);
        const timestamp = parseInt(timestampStr, 10);

        // Check if cache is still valid
        const now = Date.now();
        if (now - timestamp > CACHE_DURATION_MS) {
            // Cache expired
            return null;
        }

        return rate;
    } catch (error) {
        console.error("Error reading ARS exchange rate from storage:", error);
        return null;
    }
}

/**
 * Store ARS exchange rate in storage
 * @param rate - The exchange rate: 1 USD = rate ARS
 */
export async function storeARSExchangeRate(rate: number): Promise<void> {
    try {
        await AsyncStorage.setItem(ARS_RATE_STORAGE_KEY, rate.toString());
        await AsyncStorage.setItem(ARS_RATE_TIMESTAMP_KEY, Date.now().toString());
    } catch (error) {
        console.error("Error storing ARS exchange rate:", error);
    }
}

/**
 * Convert USD amount to ARS
 */
export async function convertUSDToARS(usdAmount: number): Promise<number> {
    const rate = await getStoredARSExchangeRate();
    if (rate === null) {
        // Fallback to default rate if not available
        return usdAmount * 1100;
    }
    return usdAmount * rate;
}

/**
 * Convert ARS amount to USD
 */
export async function convertARSToUSD(arsAmount: number): Promise<number> {
    const rate = await getStoredARSExchangeRate();
    if (rate === null) {
        // Fallback to default rate if not available
        return arsAmount / 1100;
    }
    return arsAmount / rate;
}

/**
 * Get ARS balance from storage
 */
export async function getStoredARSBalance(): Promise<number> {
    try {
        const balanceStr = await AsyncStorage.getItem(ARS_BALANCE_STORAGE_KEY);
        if (balanceStr === null) {
            // Default balance if not set
            const defaultBalance = 50000;
            await storeARSBalance(defaultBalance);
            return defaultBalance;
        }
        return parseFloat(balanceStr);
    } catch (error) {
        console.error("Error reading ARS balance from storage:", error);
        return 50000; // Fallback default
    }
}

/**
 * Store ARS balance in storage
 */
export async function storeARSBalance(balance: number): Promise<void> {
    try {
        await AsyncStorage.setItem(ARS_BALANCE_STORAGE_KEY, balance.toString());
    } catch (error) {
        console.error("Error storing ARS balance:", error);
    }
}

