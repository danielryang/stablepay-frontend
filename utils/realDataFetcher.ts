/**
 * Fetch REAL historical data including STABLECOIN comparisons
 * Tracks: USDC, USDT, DAI, and their liquidity/fees across chains
 */

export interface ChainHistoricalData {
    date: string;
    tokenPrice: number;
    estimatedGasCostUSD: number;
    volume: number;
    source: string;
}

export interface StablecoinPriceData {
    date: string;
    price: number;
    deviation: number;
}

export interface StablecoinVolumeData {
    date: string;
    volume: number;
    liquidityScore: number;
}

export interface StablecoinData {
    prices: StablecoinPriceData[];
    volumes: StablecoinVolumeData[];
}

export interface HistoricalDataResult {
    chains: {
        [chain: string]: ChainHistoricalData[] | null;
    };
    stablecoins: {
        [stablecoin: string]: StablecoinData | null;
    };
}

export interface StablecoinLiquidityData {
    price: number;
    volume24h: number;
    marketCap: number;
    chainScores: {
        [chain: string]: number;
    };
    conversionFees: {
        [chain: string]: number;
    };
}

export interface FiatExchangeRate {
    fiatCurrency: string;
    usdRate: number; // 1 USD = X ARS (or other fiat)
    timestamp: string;
}

export interface TimingAnalysis {
    bestDayOfWeek: {
        day: number;
        dayName: string;
        avgCost: number;
        sampleSize: number;
    };
    worstDayOfWeek: {
        day: number;
        dayName: string;
        avgCost: number;
        sampleSize: number;
    };
    weekendVsWeekday: {
        weekend: number;
        weekday: number;
        recommendation: string;
    };
    currentStatus: {
        isGoodTimeNow: boolean;
        currentCost: number;
        avgCost: number;
        percentile: number;
    };
    potentialSavings: {
        amount: number;
        percent: number;
    };
    timeOfDayRecommendations: {
        [chain: string]: {
            best: string;
            avoid: string;
        };
    };
    volatilityWarning: boolean;
}

/**
 * Get CoinGecko API key from environment or config
 * You can set this via EXPO_PUBLIC_COINGECKO_API_KEY environment variable
 * or create a config file
 */
function getCoinGeckoApiKey(): string | null {
    // In Expo, environment variables are available via process.env with EXPO_PUBLIC_ prefix
    // But we need to check both ways since it depends on the build
    let apiKey: string | null = null;

    // Method 1: Direct process.env access (works in web and some builds)
    if (typeof process !== "undefined" && process.env) {
        apiKey = process.env.EXPO_PUBLIC_COINGECKO_API_KEY || null;
    }

    // Method 2: Expo Constants (more reliable for native)
    if (!apiKey) {
        try {
            const Constants = require("expo-constants").default;
            apiKey =
                Constants.expoConfig?.extra?.coingeckoApiKey ||
                Constants.manifest?.extra?.coingeckoApiKey ||
                null;
        } catch {
            // Constants not available
        }
    }

    // Debug: Log if we found an API key (but don't log the actual key)
    if (apiKey) {
        console.log("✅ CoinGecko API key detected (length:", apiKey.length, ")");
    } else {
        console.warn(
            "⚠️ No CoinGecko API key found. Check your .env file and restart Expo server."
        );
    }

    return apiKey;
}

/**
 * Fetch REAL historical data including STABLECOIN comparisons
 * Now tracks: USDC, USDT, DAI, and their liquidity/fees across chains
 */
export async function fetchRealHistoricalData(days: number = 90): Promise<HistoricalDataResult> {
    const apiKey = getCoinGeckoApiKey();

    // Debug: Log API key status
    if (apiKey) {
        console.log(
            `🔑 Using Demo API key: ${apiKey.substring(0, 5)}...${apiKey.substring(apiKey.length - 3)}`
        );
    } else {
        console.warn("⚠️ No API key found - using free tier (may hit rate limits)");
    }
    const chains = [
        { id: "ethereum", symbol: "ETH", name: "ethereum" },
        { id: "matic-network", symbol: "MATIC", name: "polygon" },
        { id: "ethereum", symbol: "ETH", name: "arbitrum" },
        { id: "solana", symbol: "SOL", name: "solana" },
    ];

    const stablecoins = [
        { id: "usd-coin", name: "USDC" },
        { id: "tether", name: "USDT" },
        { id: "dai", name: "DAI" },
    ];

    const historicalData: { [chain: string]: ChainHistoricalData[] | null } = {};
    const stablecoinData: { [stablecoin: string]: StablecoinData | null } = {};

    // Fetch chain gas data
    for (const chain of chains) {
        try {
            console.log(`Fetching real data for ${chain.name}...`);

            // Build headers with API key if available
            const headers: HeadersInit = {
                Accept: "application/json",
            };

            // Add API key header if available
            // Demo API keys MUST use api.coingecko.com endpoint (CoinGecko requirement)
            // Pro API keys use pro-api.coingecko.com
            // Since Demo keys can also start with "CG-", we default to Demo API endpoint
            // If it's actually a Pro key, the API will tell us in the error response
            if (apiKey) {
                // Use demo API key header (works for Demo keys)
                headers["x-cg-demo-api-key"] = apiKey;
            } else {
                console.warn(`⚠️ No API key found for ${chain.name} request`);
            }

            // Demo API keys MUST use api.coingecko.com (CoinGecko requirement)
            const baseUrl = "https://api.coingecko.com";

            const url = `${baseUrl}/api/v3/coins/${chain.id}/market_chart?vs_currency=usd&days=${days}&interval=daily`;

            console.log(`🌐 Fetching from: ${baseUrl} (Demo API, Has Key: ${!!apiKey})`);

            const response = await fetch(url, {
                headers,
                mode: "cors",
            });

            if (!response.ok) {
                // Try to get error details
                let errorMessage = `HTTP ${response.status}`;
                let errorDetails = "";
                try {
                    const errorText = await response.text();
                    console.error(`❌ API Error Response:`, errorText);
                    try {
                        const errorData = JSON.parse(errorText);
                        if (errorData.error) {
                            errorMessage = errorData.error;
                        }
                        if (errorData.message) {
                            errorDetails = errorData.message;
                        }
                    } catch {
                        errorDetails = errorText.substring(0, 200); // First 200 chars
                    }
                } catch {
                    // If response isn't text, use status text
                    errorMessage = response.statusText || `HTTP ${response.status}`;
                }

                if (response.status === 429) {
                    throw new Error(
                        `Rate limited by CoinGecko API. Please wait a few minutes and try again.`
                    );
                }
                if (response.status === 400) {
                    // Check if error says to use Pro API
                    if (
                        errorDetails &&
                        errorDetails.includes("Pro API key") &&
                        errorDetails.includes("pro-api.coingecko.com")
                    ) {
                        // Retry with Pro API endpoint
                        console.log(`🔄 Retrying with Pro API endpoint for ${chain.name}...`);
                        const proUrl = `https://pro-api.coingecko.com/api/v3/coins/${chain.id}/market_chart?vs_currency=usd&days=${days}&interval=daily`;
                        const proHeaders: HeadersInit = {
                            Accept: "application/json",
                            "x-cg-pro-api-key": apiKey!,
                        };
                        const proResponse = await fetch(proUrl, {
                            headers: proHeaders,
                            mode: "cors",
                        });

                        if (!proResponse.ok) {
                            const proErrorText = await proResponse.text();
                            throw new Error(
                                `Pro API also failed for ${chain.name}: ${proErrorText.substring(0, 200)}`
                            );
                        }

                        // Use Pro API response
                        const proData = await proResponse.json();
                        historicalData[chain.name] = proData.prices.map(
                            (point: [number, number], idx: number) => {
                                const date = new Date(point[0]);
                                const tokenPrice = point[1];
                                let gasCost: number;
                                if (chain.name === "ethereum") {
                                    gasCost = (25 * 21000 * tokenPrice) / 1e9;
                                } else if (chain.name === "polygon") {
                                    gasCost = (30 * 21000 * tokenPrice) / 1e9;
                                } else if (chain.name === "arbitrum") {
                                    gasCost = (2.5 * 21000 * tokenPrice) / 1e9;
                                } else if (chain.name === "solana") {
                                    gasCost = 0.000005 * tokenPrice;
                                } else {
                                    gasCost = 0;
                                }
                                return {
                                    date: date.toISOString().split("T")[0],
                                    tokenPrice: tokenPrice,
                                    estimatedGasCostUSD: gasCost,
                                    volume: proData.total_volumes[idx]?.[1] || 0,
                                    source: "coingecko_api",
                                };
                            }
                        );
                        console.log(
                            `✅ Fetched ${historicalData[chain.name]?.length} days for ${chain.name} (via Pro API)`
                        );
                        await new Promise(resolve => setTimeout(resolve, 3000));
                        continue; // Skip to next chain
                    }

                    // Check if error says to use Demo API (regular endpoint)
                    if (
                        errorDetails &&
                        errorDetails.includes("Demo API key") &&
                        errorDetails.includes("api.coingecko.com")
                    ) {
                        // We're already using regular endpoint, so this is a different error
                        const fullError = errorDetails
                            ? `${errorMessage}. Details: ${errorDetails}`
                            : errorMessage;
                        throw new Error(`Bad request for ${chain.name}: ${fullError}`);
                    }

                    const fullError = errorDetails
                        ? `${errorMessage}. Details: ${errorDetails}`
                        : errorMessage;
                    throw new Error(`Bad request for ${chain.name}: ${fullError}`);
                }
                if (response.status === 401) {
                    throw new Error(
                        `Unauthorized: Invalid API key. Please check your EXPO_PUBLIC_COINGECKO_API_KEY in .env file.`
                    );
                }
                throw new Error(
                    `Failed to fetch ${chain.name} data: ${errorMessage}${errorDetails ? ". " + errorDetails : ""}`
                );
            }

            const data = await response.json();

            historicalData[chain.name] = data.prices.map((point: [number, number], idx: number) => {
                const date = new Date(point[0]);
                const tokenPrice = point[1];

                let gasCost: number;
                if (chain.name === "ethereum") {
                    gasCost = (25 * 21000 * tokenPrice) / 1e9;
                } else if (chain.name === "polygon") {
                    gasCost = (30 * 21000 * tokenPrice) / 1e9;
                } else if (chain.name === "arbitrum") {
                    gasCost = (2.5 * 21000 * tokenPrice) / 1e9;
                } else if (chain.name === "solana") {
                    gasCost = 0.000005 * tokenPrice;
                } else {
                    gasCost = 0;
                }

                return {
                    date: date.toISOString().split("T")[0],
                    tokenPrice: tokenPrice,
                    estimatedGasCostUSD: gasCost,
                    volume: data.total_volumes[idx]?.[1] || 0,
                    source: "coingecko_api",
                };
            });

            console.log(`✅ Fetched ${historicalData[chain.name]?.length} days for ${chain.name}`);

            // Wait 3 seconds between requests to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 3000));
        } catch (error) {
            console.error(`Failed to fetch ${chain.name}:`, error);
            // Only fail if it's a required chain (ethereum, polygon)
            if (chain.name === "ethereum" || chain.name === "polygon") {
                throw new Error(
                    `Failed to fetch required chain data for ${chain.name}. ${error instanceof Error ? error.message : "Unknown error"}`
                );
            }
            historicalData[chain.name] = null;
            // Still wait to avoid hitting rate limits
            await new Promise(resolve => setTimeout(resolve, 2500));
        }
    }

    // NOTE: Stablecoin historical price stability data is NOT used in the optimizer
    // We skip fetching it to reduce API calls and avoid rate limits
    // Only the liquidity data (from fetchStablecoinLiquidityData) is needed
    console.log("⏭️ Skipping stablecoin historical data (not used in optimizer)");

    // Set all to null since we're not fetching them
    for (const stable of stablecoins) {
        stablecoinData[stable.name] = null;
    }

    return {
        chains: historicalData,
        stablecoins: stablecoinData,
    };
}

/**
 * Fetch chain-specific liquidity data from DefiLlama API
 * This provides real TVL (Total Value Locked) data per chain
 */
async function fetchChainLiquidityFromDefiLlama(): Promise<{
    [chain: string]: { [stablecoin: string]: number };
} | null> {
    try {
        // Try multiple DefiLlama endpoints (they have different endpoints)
        // Based on docs: https://api-docs.defillama.com/
        // Free API base: https://api.llama.fi (no auth required)
        // Stablecoins endpoint: https://stablecoins.llama.fi/stablecoins
        const endpoints = [
            "https://stablecoins.llama.fi/stablecoins", // Main stablecoins endpoint (confirmed in docs)
            "https://api.llama.fi/stablecoins", // Alternative API endpoint
            "https://api.llama.fi/v2/stablecoins/current", // v2 endpoint
            "https://api.llama.fi/v1/stablecoins", // v1 endpoint
        ];

        let response: Response | null = null;
        let lastError: string = "";

        for (const endpoint of endpoints) {
            try {
                console.log(`🔍 Trying DefiLlama endpoint: ${endpoint}`);
                response = await fetch(endpoint, {
                    headers: {
                        Accept: "application/json",
                    },
                    mode: "cors",
                });

                if (response.ok) {
                    console.log(`✅ DefiLlama endpoint working: ${endpoint}`);
                    break;
                } else {
                    lastError = `HTTP ${response.status}`;
                    console.log(`⚠️ ${endpoint} returned ${response.status}`);
                }
            } catch (error) {
                lastError = error instanceof Error ? error.message : "Unknown error";
                console.log(`⚠️ ${endpoint} failed: ${lastError}`);
                response = null;
            }
        }

        if (!response || !response.ok) {
            console.warn(
                `⚠️ All DefiLlama endpoints failed (last error: ${lastError}), using fallback liquidity scores`
            );
            return null;
        }

        const data = await response.json();

        // Map chain names from DefiLlama to our chain names
        const chainMap: { [key: string]: string } = {
            Ethereum: "ethereum",
            Polygon: "polygon",
            Arbitrum: "arbitrum",
            Solana: "solana",
        };

        // Map stablecoin symbols
        const stablecoinMap: { [key: string]: string } = {
            USDC: "USDC",
            USDT: "USDT",
            DAI: "DAI",
        };

        const chainLiquidity: { [chain: string]: { [stablecoin: string]: number } } = {
            ethereum: { USDC: 0, USDT: 0, DAI: 0 },
            polygon: { USDC: 0, USDT: 0, DAI: 0 },
            arbitrum: { USDC: 0, USDT: 0, DAI: 0 },
            solana: { USDC: 0, USDT: 0, DAI: 0 },
        };

        // Parse DefiLlama response (handles multiple endpoint formats)
        // stablecoins.llama.fi returns: { peggedAssets: [...] }
        // api.llama.fi/v2 returns: { peggedAssets: [...] }
        // api.llama.fi/v1 might return: [...] (direct array)
        let assets: any[] = [];

        if (Array.isArray(data)) {
            // Direct array format (v1)
            assets = data;
        } else if (data.peggedAssets && Array.isArray(data.peggedAssets)) {
            // Object with peggedAssets array (v2, stablecoins.llama.fi)
            assets = data.peggedAssets;
        } else if (data.peggedAssets && typeof data.peggedAssets === "object") {
            // Nested object format
            assets = Object.values(data.peggedAssets);
        }

        if (assets && assets.length > 0) {
            for (const asset of assets) {
                const stablecoinName = stablecoinMap[asset.symbol];
                if (!stablecoinName) continue;

                // Handle different chain data formats:
                // - chainBalances: { "Ethereum": 123456, ... }
                // - chains: { "ethereum": { circulating: { peggedUSD: 123456 } }, ... }
                // - chains: { "Ethereum": 123456, ... }
                const chainData = asset.chainBalances || asset.chains || {};

                for (const [chainName, balance] of Object.entries(chainData)) {
                    // Normalize chain name (handle both "Ethereum" and "ethereum")
                    const normalizedChainName =
                        chainName.charAt(0).toUpperCase() + chainName.slice(1).toLowerCase();
                    const mappedChain = chainMap[normalizedChainName] || chainMap[chainName];

                    if (mappedChain) {
                        // Handle different balance formats
                        let balanceValue = 0;
                        if (typeof balance === "number") {
                            balanceValue = balance;
                        } else if (balance && typeof balance === "object") {
                            // Nested format: { circulating: { peggedUSD: 123456 } }
                            balanceValue =
                                (balance as any).circulating?.peggedUSD ||
                                (balance as any).peggedUSD ||
                                (balance as any).totalCirculating?.peggedUSD ||
                                0;
                        }

                        if (balanceValue > 0) {
                            chainLiquidity[mappedChain][stablecoinName] = balanceValue;
                        }
                    }
                }
            }
        }

        return chainLiquidity;
    } catch (error) {
        console.warn("Error fetching DefiLlama data:", error);
        return null;
    }
}

/**
 * Fetch platform data from CoinGecko to see which chains each stablecoin exists on
 */
async function fetchPlatformData(
    coinId: string,
    apiKey: string | null
): Promise<{ [chain: string]: string } | null> {
    try {
        const headers: HeadersInit = {
            Accept: "application/json",
        };

        // Demo API keys MUST use api.coingecko.com endpoint (CoinGecko requirement)
        if (apiKey) {
            // Use demo API key header (works for Demo keys)
            headers["x-cg-demo-api-key"] = apiKey;
        }

        // Demo API keys MUST use api.coingecko.com (CoinGecko requirement)
        const baseUrl = "https://api.coingecko.com";

        const url = `${baseUrl}/api/v3/coins/${coinId}?localization=false&tickers=false&market_data=false&community_data=false&developer_data=false&sparkline=false`;

        const response = await fetch(url, {
            headers,
            mode: "cors",
        }).catch(error => {
            // CORS errors and network errors are caught here
            if (error.message?.includes("CORS") || error.message?.includes("Failed to fetch")) {
                console.warn(
                    `⚠️ CORS error fetching platform data for ${coinId} (browser restriction). Continuing without platform data.`
                );
                return null;
            }
            throw error; // Re-throw other errors
        });

        // If fetch failed (CORS), response will be null
        if (!response || !response.ok) {
            return null;
        }

        const data = await response.json();

        // Map CoinGecko platform keys to our chain names
        const platformMap: { [key: string]: string } = {
            ethereum: "ethereum",
            "polygon-pos": "polygon",
            "arbitrum-one": "arbitrum",
            solana: "solana",
        };

        const platforms: { [chain: string]: string } = {};

        if (data.platforms) {
            for (const [platformKey, address] of Object.entries(data.platforms)) {
                const mappedChain = platformMap[platformKey];
                if (mappedChain && address) {
                    platforms[mappedChain] = address as string;
                }
            }
        }

        return platforms;
    } catch (error) {
        console.warn(`Error fetching platform data for ${coinId}:`, error);
        return null;
    }
}

/**
 * Calculate liquidity scores based on real TVL data
 */
function calculateLiquidityScores(
    chainLiquidity: { [chain: string]: { [stablecoin: string]: number } } | null,
    stablecoin: string
): { [chain: string]: number } {
    if (!chainLiquidity) {
        // Fallback to estimates if DefiLlama data unavailable
        const fallbackScores: { [stablecoin: string]: { [chain: string]: number } } = {
            USDC: { ethereum: 1.0, polygon: 0.8, arbitrum: 0.6, solana: 0.7 },
            USDT: { ethereum: 0.9, polygon: 0.7, arbitrum: 0.5, solana: 0.8 },
            DAI: { ethereum: 0.85, polygon: 0.5, arbitrum: 0.4, solana: 0.3 },
        };
        return (
            fallbackScores[stablecoin] || {
                ethereum: 0.5,
                polygon: 0.5,
                arbitrum: 0.5,
                solana: 0.5,
            }
        );
    }

    // Get all TVL values for this stablecoin across all chains
    const tvlValues: number[] = [];
    Object.values(chainLiquidity).forEach(chainData => {
        if (chainData[stablecoin] > 0) {
            tvlValues.push(chainData[stablecoin]);
        }
    });

    if (tvlValues.length === 0) {
        // No data available, use fallback
        const fallbackScores: { [stablecoin: string]: { [chain: string]: number } } = {
            USDC: { ethereum: 1.0, polygon: 0.8, arbitrum: 0.6, solana: 0.7 },
            USDT: { ethereum: 0.9, polygon: 0.7, arbitrum: 0.5, solana: 0.8 },
            DAI: { ethereum: 0.85, polygon: 0.5, arbitrum: 0.4, solana: 0.3 },
        };
        return (
            fallbackScores[stablecoin] || {
                ethereum: 0.5,
                polygon: 0.5,
                arbitrum: 0.5,
                solana: 0.5,
            }
        );
    }

    const maxTvl = Math.max(...tvlValues);
    const scores: { [chain: string]: number } = {};

    // Normalize TVL values to 0-1 scale
    Object.entries(chainLiquidity).forEach(([chain, chainData]) => {
        const tvl = chainData[stablecoin] || 0;
        scores[chain] = maxTvl > 0 ? Math.min(1.0, tvl / maxTvl) : 0;
    });

    return scores;
}

/**
 * Estimate conversion fees based on market cap and volume
 * Higher market cap + volume = lower fees (better liquidity)
 */
function estimateConversionFees(
    marketCap: number,
    volume24h: number,
    chainScores: { [chain: string]: number }
): { [chain: string]: number } {
    // Base fee calculation: larger market cap and volume = lower fees
    // Typical range: 1.5% - 3.0%
    const baseFee =
        marketCap > 50_000_000_000 && volume24h > 1_000_000_000
            ? 0.015 // Very liquid: 1.5%
            : marketCap > 10_000_000_000 && volume24h > 100_000_000
              ? 0.018 // Good liquidity: 1.8%
              : 0.022; // Standard: 2.2%

    const fees: { [chain: string]: number } = {};

    // Adjust fees based on chain liquidity scores
    Object.entries(chainScores).forEach(([chain, score]) => {
        // Lower score = higher fee (less liquidity = worse rates)
        fees[chain] = baseFee + (1 - score) * 0.01; // Add up to 1% based on liquidity
    });

    return fees;
}

/**
 * Fetch current stablecoin liquidity and fees by chain
 * Now uses REAL data from DefiLlama and CoinGecko
 */
export async function fetchStablecoinLiquidityData(): Promise<{
    USDC: StablecoinLiquidityData;
    USDT: StablecoinLiquidityData;
    DAI: StablecoinLiquidityData;
} | null> {
    try {
        const apiKey = getCoinGeckoApiKey();

        // Build headers with API key if available
        const headers: HeadersInit = {
            Accept: "application/json",
        };

        // Add API key header if available
        // Demo API keys MUST use api.coingecko.com endpoint (CoinGecko requirement)
        if (apiKey) {
            // Use demo API key header (works for Demo keys)
            headers["x-cg-demo-api-key"] = apiKey;
        }

        // Demo API keys MUST use api.coingecko.com (CoinGecko requirement)
        const baseUrl = "https://api.coingecko.com";

        // Step 1: Get price and volume data from CoinGecko
        const priceUrl = `${baseUrl}/api/v3/simple/price?ids=usd-coin,tether,dai&vs_currencies=usd&include_24h_vol=true&include_market_cap=true`;

        const priceResponse = await fetch(priceUrl, {
            headers,
            mode: "cors",
        });

        if (!priceResponse.ok) {
            if (priceResponse.status === 429) {
                throw new Error(
                    "Rate limited by CoinGecko API. Please wait a few minutes and try again."
                );
            }
            throw new Error(
                `Failed to fetch stablecoin liquidity data: HTTP ${priceResponse.status}`
            );
        }

        const priceData = await priceResponse.json();

        // Step 2: Fetch real chain liquidity data from DefiLlama
        console.log("📊 Fetching real chain liquidity data from DefiLlama...");
        const chainLiquidity = await fetchChainLiquidityFromDefiLlama();

        // Step 3: Fetch platform data to verify chain availability
        const coinIds = [
            { id: "usd-coin", name: "USDC" },
            { id: "tether", name: "USDT" },
            { id: "dai", name: "DAI" },
        ];

        const platformData: { [coin: string]: { [chain: string]: string } | null } = {};

        // Try to fetch platform data, but don't fail if it doesn't work (CORS issues in browser)
        for (const coin of coinIds) {
            try {
                platformData[coin.name] = await fetchPlatformData(coin.id, apiKey);
            } catch (error) {
                // Platform data is optional - we can continue without it
                console.warn(
                    `⚠️ Could not fetch platform data for ${coin.name}, continuing without it`
                );
                platformData[coin.name] = null;
            }
            // Wait between requests to avoid rate limits
            await new Promise(resolve => setTimeout(resolve, 2000));
        }

        // Step 4: Build response with real data
        const buildStablecoinData = (coinKey: string, name: string): StablecoinLiquidityData => {
            const price = priceData[coinKey]?.usd || 1.0;
            const volume24h = priceData[coinKey]?.usd_24h_vol || 0;
            const marketCap = priceData[coinKey]?.usd_market_cap || 0;

            // Calculate real liquidity scores from DefiLlama data
            const chainScores = calculateLiquidityScores(chainLiquidity, name);

            // Estimate conversion fees based on real market data
            const conversionFees = estimateConversionFees(marketCap, volume24h, chainScores);

            return {
                price,
                volume24h,
                marketCap,
                chainScores,
                conversionFees,
            };
        };

        return {
            USDC: buildStablecoinData("usd-coin", "USDC"),
            USDT: buildStablecoinData("tether", "USDT"),
            DAI: buildStablecoinData("dai", "DAI"),
        };
    } catch (error) {
        console.error("Failed to fetch stablecoin liquidity:", error);
        throw new Error("Failed to fetch stablecoin liquidity data from API");
    }
}

/**
 * Analyze optimal conversion timing based on historical patterns
 */
export function analyzeOptimalTiming(
    historicalChainData: ChainHistoricalData[],
    currentPrice: number
): TimingAnalysis {
    const costs = historicalChainData.map(d => d.estimatedGasCostUSD);

    // Calculate day-of-week patterns (0 = Sunday, 6 = Saturday)
    const dayPatterns: { [day: number]: number[] } = {};
    historicalChainData.forEach(day => {
        const date = new Date(day.date);
        const dayOfWeek = date.getDay();

        if (!dayPatterns[dayOfWeek]) {
            dayPatterns[dayOfWeek] = [];
        }
        dayPatterns[dayOfWeek].push(day.estimatedGasCostUSD);
    });

    // Calculate average cost per day of week
    const avgByDay: {
        [day: string]: { day: number; dayName: string; avgCost: number; sampleSize: number };
    } = {};
    const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

    Object.keys(dayPatterns).forEach(day => {
        const dayNum = parseInt(day);
        avgByDay[day] = {
            day: dayNum,
            dayName: dayNames[dayNum],
            avgCost: mean(dayPatterns[dayNum]),
            sampleSize: dayPatterns[dayNum].length,
        };
    });

    // Find best day
    const bestDay = Object.values(avgByDay).reduce((best, current) =>
        current.avgCost < best.avgCost ? current : best
    );

    const worstDay = Object.values(avgByDay).reduce((worst, current) =>
        current.avgCost > worst.avgCost ? current : worst
    );

    // Calculate hourly patterns (simplified - weekend vs weekday)
    const weekendAvg = mean([...(dayPatterns[0] || []), ...(dayPatterns[6] || [])]);
    const weekdayAvg = mean([
        ...(dayPatterns[1] || []),
        ...(dayPatterns[2] || []),
        ...(dayPatterns[3] || []),
        ...(dayPatterns[4] || []),
        ...(dayPatterns[5] || []),
    ]);

    // Time of day recommendations (based on known network patterns)
    const timeRecommendations: { [chain: string]: { best: string; avoid: string } } = {
        ethereum: {
            best: "2am-6am UTC (lowest activity)",
            avoid: "2pm-6pm UTC (peak DeFi activity)",
        },
        polygon: {
            best: "6am-10am UTC",
            avoid: "8pm-12am UTC",
        },
        arbitrum: {
            best: "4am-8am UTC",
            avoid: "3pm-7pm UTC",
        },
        solana: {
            best: "Any time (stable fees)",
            avoid: "N/A",
        },
    };

    // Determine if NOW is a good time
    const avgCost = mean(costs);
    const isGoodTimeNow = currentPrice < avgCost * 1.05; // Within 5% of average

    // Calculate potential savings by waiting
    const potentialSavings = currentPrice - bestDay.avgCost;
    const savingsPercent = (potentialSavings / currentPrice) * 100;

    // Calculate percentile
    const costsBelowCurrent = costs.filter(c => c < currentPrice).length;
    const percentile = costsBelowCurrent / costs.length;

    return {
        bestDayOfWeek: bestDay,
        worstDayOfWeek: worstDay,
        weekendVsWeekday: {
            weekend: weekendAvg,
            weekday: weekdayAvg,
            recommendation: weekendAvg < weekdayAvg ? "Convert on weekends" : "Convert on weekdays",
        },
        currentStatus: {
            isGoodTimeNow: isGoodTimeNow,
            currentCost: currentPrice,
            avgCost: avgCost,
            percentile: percentile,
        },
        potentialSavings: {
            amount: Math.max(0, potentialSavings),
            percent: Math.max(0, savingsPercent),
        },
        timeOfDayRecommendations: timeRecommendations,
        volatilityWarning: calculateStdDev(costs) / avgCost > 0.3, // High volatility warning
    };
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

/**
 * Fetch fiat currency exchange rate from CoinGecko
 * Returns the rate: 1 USD = X fiatCurrency
 */
export async function fetchFiatExchangeRate(fiatCurrency: string): Promise<FiatExchangeRate> {
    const apiKey = getCoinGeckoApiKey();
    const headers: HeadersInit = {
        Accept: "application/json",
    };

    if (apiKey) {
        headers["x-cg-demo-api-key"] = apiKey;
    }

    const baseUrl = "https://api.coingecko.com";

    try {
        // CoinGecko uses lowercase currency codes
        const fiatCode = fiatCurrency.toLowerCase();

        // Fetch exchange rate: 1 USD = X fiatCurrency
        const url = `${baseUrl}/api/v3/exchange_rates`;
        console.log(`🌍 Fetching fiat exchange rate for ${fiatCurrency}...`);

        const response = await fetch(url, {
            method: "GET",
            headers,
            mode: "cors",
        });

        if (!response.ok) {
            const errorText = await response.text();
            let errorDetails = `HTTP ${response.status}`;
            try {
                const errorData = JSON.parse(errorText);
                errorDetails = errorData.error || errorDetails;
            } catch {
                errorDetails = errorText.substring(0, 200);
            }
            throw new Error(`Failed to fetch exchange rate for ${fiatCurrency}: ${errorDetails}`);
        }

        const data = await response.json();

        // CoinGecko exchange_rates endpoint returns rates object
        // Format: { rates: { ars: { value: 1000, unit: 'ARS' }, ... } }
        // Note: The value might be inverted or in a different format
        if (data.rates && data.rates[fiatCode]) {
            let rate = data.rates[fiatCode].value;

            // Validate rate - ARS should be around 1000-2000 per USD (not millions)
            // If rate is too high, it might be inverted (1 ARS = X USD instead of 1 USD = X ARS)
            if (rate > 100000) {
                console.warn(
                    `⚠️ Exchange rate seems inverted (${rate}). Trying inverse calculation...`
                );
                // If rate is too high, try inverse: 1 / rate
                rate = 1 / rate;
            }

            // Final validation - ARS should be reasonable (between 100 and 10000 per USD)
            if (rate < 100 || rate > 10000) {
                console.warn(
                    `⚠️ Exchange rate ${rate} seems invalid for ${fiatCurrency}. Using fallback...`
                );
                // Don't return here, let it fall through to fallback
            } else {
                console.log(`✅ Fetched exchange rate: 1 USD = ${rate.toFixed(2)} ${fiatCurrency}`);

                return {
                    fiatCurrency: fiatCurrency.toUpperCase(),
                    usdRate: rate, // 1 USD = rate ARS
                    timestamp: new Date().toISOString(),
                };
            }
        }

        // Fallback: Try simple/price endpoint with USD coin
        // Note: CoinGecko doesn't have USD as a coin, so we'll use a different approach
        // Try using a stablecoin (like USDC) price in the fiat currency
        console.log(`⚠️ Exchange rates endpoint didn't have ${fiatCode}, trying fallback...`);
        const fallbackUrl = `${baseUrl}/api/v3/simple/price?ids=usd-coin&vs_currencies=${fiatCode}`;
        const fallbackResponse = await fetch(fallbackUrl, {
            method: "GET",
            headers,
            mode: "cors",
        });

        if (fallbackResponse.ok) {
            const fallbackData = await fallbackResponse.json();
            if (fallbackData["usd-coin"] && fallbackData["usd-coin"][fiatCode]) {
                // USDC price in ARS should be close to USD rate (since USDC ≈ 1 USD)
                const rate = fallbackData["usd-coin"][fiatCode];
                console.log(
                    `✅ Fetched exchange rate (fallback via USDC): 1 USD ≈ ${rate} ${fiatCurrency}`
                );

                return {
                    fiatCurrency: fiatCurrency.toUpperCase(),
                    usdRate: rate,
                    timestamp: new Date().toISOString(),
                };
            }
        }

        // Last resort: Use a hardcoded estimate for ARS (this should be replaced with real API)
        if (fiatCode === "ars") {
            // Current ARS rate is approximately 1000-1200 ARS per USD (as of 2024)
            // Using 1100 as a reasonable estimate
            const estimatedRate = 1100;
            console.warn(
                `⚠️ Using estimated ARS rate (${estimatedRate} ARS = 1 USD). Consider using a real exchange rate API.`
            );
            return {
                fiatCurrency: "ARS",
                usdRate: estimatedRate,
                timestamp: new Date().toISOString(),
            };
        }

        throw new Error(
            `Exchange rate not found for ${fiatCurrency}. Please check CoinGecko API documentation.`
        );
    } catch (error: any) {
        console.error(`Error fetching fiat exchange rate for ${fiatCurrency}:`, error);
        throw new Error(
            `Failed to fetch exchange rate for ${fiatCurrency}: ${error.message || "Unknown error"}`
        );
    }
}
