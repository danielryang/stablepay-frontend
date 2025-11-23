# Stable Living Frontend

A comprehensive mobile and web application for managing stablecoin portfolios, optimizing allocations, and facilitating cross-chain transactions with AI-powered insights. Built with React Native (Expo) for cross-platform compatibility. This project was submitted for MadHacks 2025.

## Table of Contents

- [Overview](#overview)
- [Features](#features)
  - [Wallet Management](#wallet-management)
  - [Sending Money](#sending-money)
  - [Receiving Money](#receiving-money)
  - [Currency Conversion](#currency-conversion)
  - [Buying Crypto](#buying-crypto)
  - [Transaction History](#transaction-history)
  - [Smart Allocation Optimizer](#smart-allocation-optimizer)
  - [Settings & Preferences](#settings--preferences)
- [Architecture](#architecture)
- [Getting Started](#getting-started)
- [API Documentation](#api-documentation)
- [Development Guide](#development-guide)
- [Deployment](#deployment)

---

## Overview

Stable Living Frontend is a financial management application designed to help users optimize their stablecoin holdings across multiple blockchain networks. The app provides:

- **Multi-chain wallet support** for Solana-based stablecoins (USDC, USDT, etc.)
- **Intelligent path finding** for optimal currency conversions with minimal fees
- **AI-powered recommendations** for portfolio optimization
- **Real-time market data** integration via CoinGecko API
- **Cross-platform compatibility** (iOS, Android, Web)

The application uses a proxy server architecture to handle API calls securely, bypassing CORS restrictions and keeping sensitive API keys server-side.

---

## Features

### Wallet Management

The wallet system provides secure, encrypted storage of Solana keypairs with mnemonic phrase recovery.

#### Key Features

- **Secure Key Generation**: Uses BIP39 mnemonic phrases for wallet creation
- **Encrypted Storage**: Wallets are encrypted using AES-256 before storage
- **Password Protection**: All wallet operations require password authentication
- **Multiple Account Support**: Ability to switch between accounts
- **Balance Tracking**: Real-time USDC balance updates on Solana network

#### Wallet Operations

1. **Create Wallet**
   - Generates a new 12-word mnemonic phrase
   - Encrypts and stores the keypair securely
   - Requires password setup for encryption

2. **Restore Wallet**
   - Import existing wallet using mnemonic phrase
   - Validates mnemonic phrase format
   - Re-encrypts and stores the wallet

3. **Login**
   - Unlocks wallet with password
   - Loads keypair into memory
   - Fetches current balance

4. **Logout**
   - Clears wallet from memory
   - Locks the application
   - Requires re-authentication

#### Technical Implementation

- **Encryption**: AES-256 encryption using `crypto-js`
- **Storage**: `expo-secure-store` for secure credential storage
- **Blockchain**: Solana Web3.js for network interactions
- **Key Derivation**: BIP39 mnemonic to seed to keypair derivation

**Files:**

- `contexts/WalletContext.tsx` - Wallet state management
- `utils/wallet.ts` - Core wallet operations
- `app/create-wallet.tsx` - Wallet creation UI
- `app/restore-wallet.tsx` - Wallet restoration UI
- `app/login.tsx` - Authentication UI

---

### Sending Money

The send feature allows users to transfer stablecoins to other wallets or PayPal accounts with intelligent path optimization.

#### Key Features

- **Dual Destination Options**: Send to crypto wallet addresses or PayPal accounts
- **PayPal Integration**: OAuth-based PayPal account connection (Not finished yet)
- **Path Optimization**: Automatically finds the most cost-effective conversion path
- **Real-time Fee Calculation**: Shows transaction fees before sending
- **Multi-hop Conversions**: Supports complex conversion paths (e.g., USDC → SOL → ARS)

#### How It Works

1. **Destination Selection**
   - Toggle between "Send to Address" (crypto) and "Send to PayPal" (fiat)
   - For crypto: Enter recipient wallet address
   - For PayPal: Connect PayPal account via OAuth (Not finished yet)

2. **Amount Input**
   - Enter amount in source currency
   - Real-time conversion to destination currency
   - Shows conversion path and fees

3. **Path Evaluation**
   - Calls `/api/evaluate_path` endpoint
   - Backend calculates optimal conversion path
   - Returns:
     - Conversion path (array of currencies)
     - Final amount in destination currency
     - Total fees in ARS
     - Detailed hop information

4. **Transaction Execution**
   - Displays all transaction details
   - Shows conversion path visualization
   - Calculates final total (amount + fees)
   - Creates transaction record

#### Path Evaluation API

The path evaluation uses a sophisticated algorithm that:

- Analyzes multiple conversion routes
- Calculates fees for each hop
- Considers exchange rates
- Selects the most cost-effective path

**Request:**

```json
{
  "from_currency": "USDC",
  "to_currency": "ARS",
  "amount": 100
}
```

**Response:**

```json
{
  "path": ["USDC", "SOL", "ARS"],
  "final_amount": 110000,
  "final_amount_ars": 110000,
  "total_fee_ars": 2.50,
  "hops": [
    {
      "from_ccy": "USDC",
      "to_ccy": "SOL",
      "fee_percent": 0.5,
      "fee_ars": 0.55,
      "amount_before": 100,
      "amount_after_fee": 99.5,
      "amount_next": 0.0905,
      "exchange": "Jupiter"
    },
    {
      "from_ccy": "SOL",
      "to_ccy": "ARS",
      "fee_percent": 0.3,
      "fee_ars": 1.95,
      "amount_before": 0.0905,
      "amount_after_fee": 0.0902,
      "amount_next": 110000,
      "exchange": "Orca"
    }
  ]
}
```

#### Performance Optimizations

- **Debouncing**: 300ms delay before API call to reduce requests
- **Request Cancellation**: Aborts in-flight requests when inputs change
- **Loading States**: Shows loading indicators during path evaluation
- **Error Handling**: Graceful error messages for failed requests

**Files:**

- `app/send.tsx` - Send screen implementation
- `utils/pathApi.ts` - Path evaluation API client
- `server/index.js` - Proxy server endpoint (`/api/evaluate_path`)

---

### Receiving Money

The receive feature provides a simple way to share wallet addresses and receive payments.

#### Key Features

- **QR Code Generation**: Visual QR code for easy address sharing
- **Address Display**: Full wallet address with copy functionality
- **Share Functionality**: Native share integration for easy distribution

#### How It Works

1. **QR Code Display**
   - Generates QR code containing wallet address
   - Scannable by other wallet apps
   - Updates automatically when wallet changes

2. **Address Management**
   - Displays full Solana public key
   - One-tap copy to clipboard
   - Visual confirmation on copy

3. **Share Options**
   - Native share sheet integration
   - Share via messaging apps, email, etc.
   - Includes wallet address in shareable format

**Files:**

- `app/receive.tsx` - Receive screen implementation
- Uses `react-native-qrcode-svg` for QR code generation

---

### Currency Conversion

The convert feature allows users to convert between different currencies with real-time rate updates and path optimization.

#### Key Features

- **Multi-currency Support**: Convert between USDC, USDT, ARS, SOL, and more
- **Real-time Rates**: Live exchange rates from backend API
- **Path Visualization**: Shows conversion path with intermediate steps
- **Fee Transparency**: Displays all fees before conversion

#### How It Works

1. **Currency Selection**
   - Select source currency (from)
   - Select destination currency (to)
   - Enter amount to convert

2. **Path Evaluation**
   - Automatically evaluates optimal conversion path
   - Shows intermediate currencies if needed
   - Calculates total fees

3. **Conversion Execution**
   - Executes conversion through optimal path
   - Updates balances accordingly
   - Records transaction

#### Conversion Path Example

Converting 100 USDC to ARS might use:

- **Direct Path**: USDC → ARS (if available)
- **Multi-hop Path**: USDC → SOL → ARS (if more cost-effective)

The system automatically selects the path with lowest total fees.

**Files:**

- `app/convert.tsx` - Convert screen implementation
- Uses same path evaluation API as send feature

---

### Buying Crypto

The buy feature allows users to purchase stablecoins using credit/debit cards.

#### Key Features

- **Card Payment Integration**: Support for credit/debit card payments
- **Multiple Currency Options**: Buy USDC, USDT, or other stablecoins
- **Transaction Recording**: Automatically records purchase transactions
- **Fee Calculation**: Shows fees before purchase

#### How It Works

1. **Payment Method**
   - Enter card details (number, holder, expiry, CVV)
   - Select currency to purchase
   - Enter purchase amount

2. **Transaction Processing**
   - Processes payment (simulated in current implementation)
   - Adds purchased tokens to wallet
   - Records transaction in history

3. **Confirmation**
   - Shows transaction details
   - Updates wallet balance
   - Navigates to home screen

**Files:**

- `app/buy.tsx` - Buy screen implementation

---

### Transaction History

The transaction history feature provides a comprehensive view of all wallet activity.

#### Key Features

- **Complete Transaction Log**: All sent, received, converted, and bought transactions
- **Detailed Information**: Shows addresses, amounts, fees, paths, and status
- **Filtering & Search**: Filter by transaction type or search by address
- **Real-time Updates**: Automatically refreshes when new transactions occur

#### Transaction Types

1. **Sent Transactions**
   - Shows recipient address
   - Amount sent and received
   - Transaction fees
   - Conversion path (if applicable)
   - Status (Confirmed, Pending, Failed)

2. **Received Transactions**
   - Shows sender address
   - Amount received
   - Transaction signature (for verification)
   - Status

3. **Converted Transactions**
   - Shows conversion path
   - Source and destination amounts
   - Fees for each hop
   - Exchange used for each hop

4. **Bought Transactions**
   - Shows payment method
   - Amount purchased
   - Currency purchased
   - Transaction fees

#### Transaction Details

Each transaction includes:

- **Date & Time**: When transaction occurred
- **From/To Addresses**: Wallet addresses involved
- **Amounts**: Source and destination amounts with currencies
- **Transaction Fee**: Total fees paid (in ARS)
- **Status**: Current transaction status
- **Path**: Conversion path (for conversions)
- **Hops**: Detailed hop information (for multi-hop conversions)
- **Signature**: Solana transaction signature (for on-chain transactions)

#### Data Sources

- **On-chain Transactions**: Fetched from Solana blockchain using wallet public key
- **Local Transactions**: Stored in TransactionContext for off-chain operations
- **Real-time Sync**: Automatically syncs with blockchain on refresh

**Files:**

- `app/(tabs)/two.tsx` - Activity/Transaction history screen
- `contexts/TransactionContext.tsx` - Transaction state management
- `utils/wallet.ts` - Blockchain transaction fetching

---

### Smart Allocation Optimizer

The Smart Allocation Optimizer (Allowance Optimizer) is an AI-powered feature that analyzes your portfolio and provides intelligent recommendations for optimizing stablecoin allocations across multiple chains.

#### Key Features

- **Multi-chain Analysis**: Analyzes holdings across Ethereum, Polygon, Solana, and other chains
- **Real-time Market Data**: Integrates CoinGecko API for current prices, volumes, and liquidity
- **Historical Analysis**: Analyzes 90-day historical data for volatility and gas cost patterns
- **AI-Powered Insights**: Uses Claude AI to generate explanations and recommendations
- **Timing Recommendations**: Suggests optimal times to execute conversions
- **Stablecoin Selection**: Recommends best stablecoin for each chain based on liquidity and regional fit

#### Technical Implementation

##### 1. Data Collection

**Historical Gas Cost Data (90 days):**

- Fetches daily price data from CoinGecko API for each chain's native token (ETH, MATIC, SOL)
- Calculates estimated gas cost per transaction using chain-specific formulas:
  - **Ethereum**: `gasCost = (25 gwei × 21,000 gas × ETH_price) / 1e9`
  - **Polygon**: `gasCost = (30 gwei × 21,000 gas × MATIC_price) / 1e9`
  - **Arbitrum**: `gasCost = (2.5 gwei × 21,000 gas × ETH_price) / 1e9`
  - **Solana**: `gasCost = 0.000005 × SOL_price`
- Stores 90 data points per chain with: `{ date, tokenPrice, estimatedGasCostUSD, volume, source }`

**Stablecoin Liquidity Data:**

- Fetches real-time data from CoinGecko for USDC, USDT, DAI:
  - Current price (should be ~$1.00)
  - 24-hour trading volume
  - Market capitalization
- Fetches chain-specific TVL (Total Value Locked) from DefiLlama API
- Calculates liquidity scores per chain using normalized TVL values

**Transaction Frequency:**

- Analyzes user's transaction history to calculate monthly frequency
- Formula: `avgPerMonth = totalTransactions / numberOfMonths`
- Default fallback: 15 transactions/month if no history available

##### 2. Average Gas Cost Calculation

**Exact Formula:**

```typescript
// For each chain, extract all gas costs from historical data
const costs = chainHistory.map(d => d.estimatedGasCostUSD);

// Calculate arithmetic mean
const avgGasCost = mean(costs);
// where mean(arr) = sum(arr) / arr.length

// Example: If historical costs are [2.50, 3.20, 1.80, 2.90, ...]
// avgGasCost = (2.50 + 3.20 + 1.80 + 2.90 + ...) / numberOfDays
```

**Current Gas Cost:**

- Uses real-time price from `currentPrices[chain].estimatedTransferCostUSD`
- Falls back to historical average if current price unavailable

**Predicted Monthly Cost:**

```typescript
const avgMonthlyCost = avgGasCost × monthlyTransactionFrequency
// Example: $2.50 avg × 15 transactions/month = $37.50/month
```

##### 3. Volatility Pattern Identification

**Standard Deviation Calculation:**

```typescript
// Step 1: Calculate mean
const avg = mean(costs);

// Step 2: Calculate squared differences from mean
const squareDiffs = costs.map(val => Math.pow(val - avg, 2));
// Example: [0.25, 0.49, 0.04, 0.16, ...]

// Step 3: Calculate variance (mean of squared differences)
const variance = mean(squareDiffs);

// Step 4: Standard deviation = square root of variance
const stdDev = Math.sqrt(variance);
```

**Volatility Coefficient:**

```typescript
const volatility = stdDev / avgGasCost;
// Example: stdDev = $0.75, avgGasCost = $2.50
// volatility = 0.75 / 2.50 = 0.30 (30% volatility)
```

**Volatility Warning:**

- Flags high volatility when: `volatility > 0.30` (30% coefficient of variation)
- Indicates timing matters more for high-volatility chains

**Day-of-Week Pattern Analysis:**

```typescript
// Group gas costs by day of week (0=Sunday, 6=Saturday)
const dayPatterns = {};
historicalData.forEach(day => {
    const dayOfWeek = new Date(day.date).getDay();
    dayPatterns[dayOfWeek].push(day.estimatedGasCostUSD);
});

// Calculate average cost per day
const avgByDay = {};
Object.keys(dayPatterns).forEach(day => {
    avgByDay[day] = mean(dayPatterns[day]);
});

// Find best and worst days
const bestDay = Object.values(avgByDay).reduce((best, current) =>
    current.avgCost < best.avgCost ? current : best
);
```

**Weekend vs Weekday Analysis:**

```typescript
const weekendAvg = mean([...dayPatterns[0], ...dayPatterns[6]]); // Sun + Sat
const weekdayAvg = mean([...dayPatterns[1], ..., dayPatterns[5]]); // Mon-Fri

// Recommendation based on which is lower
const recommendation = weekendAvg < weekdayAvg 
    ? "Convert on weekends" 
    : "Convert on weekdays";
```

##### 4. Optimization Algorithm - Savings Calculation

**Stablecoin Switch Savings:**

```typescript
// Calculate fee difference
const feeDifference = currentFee - recommendedFee;
// Example: 2.5% - 1.8% = 0.7% difference

// Estimate monthly conversion volume
const monthlyVolume = currentBalance × 0.5; // Assume 50% converted monthly
// Example: $1000 balance × 0.5 = $500/month

// Monthly savings from lower fees
const monthlySavings = monthlyVolume × feeDifference;
// Example: $500 × 0.007 = $3.50/month

// Break-even analysis
const switchCost = 10; // Estimated cost to switch stablecoins
const breakEvenMonths = monthlySavings > 0 
    ? switchCost / monthlySavings 
    : Infinity;
// Example: $10 / $3.50 = 2.86 months

// Six-month savings
const sixMonthSavings = (monthlySavings × 6) - switchCost;
// Example: ($3.50 × 6) - $10 = $11.00

// Decision: Switch if break-even < 6 months AND score difference > 10
const shouldSwitch = breakEvenMonths < 6 && scoreDifference > 10;
```

**Bridge Recommendation Savings:**

```typescript
// Calculate monthly cost difference between chains
const monthlySavings = currentChain.predictedMonthlyCost 
                     - mostEfficientChain.predictedMonthlyCost;
// Example: $50/month - $30/month = $20/month savings

// Bridge cost (fixed per chain pair)
const bridgeCosts = {
    ethereum: { polygon: 8, arbitrum: 6, solana: 12 },
    polygon: { ethereum: 5, arbitrum: 3, solana: 10 },
    // ...
};
const bridgeCost = bridgeCosts[fromChain][toChain];

// Break-even calculation
const breakEvenMonths = monthlySavings > 0 
    ? bridgeCost / monthlySavings 
    : Infinity;
// Example: $8 / $20 = 0.4 months (2.4 weeks)

// Six-month net savings
const sixMonthSavings = (monthlySavings × 6) - bridgeCost;
// Example: ($20 × 6) - $8 = $112

// Recommendation threshold: break-even < 4 months AND savings > $2/month
if (breakEvenMonths < 4 && monthlySavings > 2) {
    // Recommend bridging
}
```

**Timing-Based Savings:**

```typescript
// Calculate potential savings by waiting for best day
const potentialSavings = currentGasCost - bestDay.avgCost;
// Example: $3.20 now - $2.10 best day = $1.10 savings

// Savings percentage
const savingsPercent = (potentialSavings / currentGasCost) × 100;
// Example: ($1.10 / $3.20) × 100 = 34.4%

// Percentile calculation (how expensive is current cost?)
const costsBelowCurrent = costs.filter(c => c < currentGasCost).length;
const percentile = costsBelowCurrent / costs.length;
// Example: 60 out of 90 costs are lower = 66.7th percentile (expensive)

// Good time threshold: within 5% of average
const isGoodTimeNow = currentGasCost < (avgGasCost × 1.05);
```

**Fiat-to-Stablecoin Distribution Savings:**

```typescript
// Convert fiat to USD
const fiatAmountUSD = fiatAmount / exchangeRate;
// Example: 50,000 ARS / 1100 = $45.45 USD

// Calculate optimal distribution percentages
const dailyExpensesPercent = Math.min(40, Math.max(30, 
    (monthlyExpenses / fiatAmountUSD) × 100
));
// Example: ($800 / $45.45) × 100 = 1760% → capped at 40%

const savingsPercent = Math.min(50, Math.max(40, 
    100 - dailyExpensesPercent - 15
));
// Example: 100 - 40 - 15 = 45%

// Calculate conversion fees for each allocation
const totalConversionFee = distribution.reduce((sum, dist) => {
    const fee = liquidityData[dist.stablecoin].conversionFees[dist.chain];
    return sum + (dist.amountUSD × fee);
}, 0);
// Example: ($18.18 × 0.018) + ($20.45 × 0.015) = $0.33 + $0.31 = $0.64

// Estimate 6-month savings
const avgConversionFee = 0.025; // 2.5% industry average
const avgGasCost = mean(analysis.map(a => a.avgGasCost));
const optimizedGasCost = mean(distribution.map(d => {
    return analysis.find(a => a.chain === d.chain)?.avgGasCost || avgGasCost;
}));

const monthlyGasSavings = (avgGasCost - optimizedGasCost) × monthlyTransactionFrequency;
const monthlyConversionSavings = (avgConversionFee - totalConversionFeePercent/100) × monthlyExpenses;
const estimatedSavings6Months = (monthlyGasSavings + monthlyConversionSavings) × 6;
```

##### 5. Stablecoin Selection Algorithm

**Scoring Formula (100-point scale):**

```typescript
let totalScore = 0;

// Factor 1: Chain Liquidity (40% weight, 0-40 points)
const liquidityScore = chainScores[targetChain]; // 0.0 to 1.0
totalScore += liquidityScore × 40;
// Example: 0.85 liquidity × 40 = 34 points

// Factor 2: Conversion Fees (30% weight, 0-30 points)
const conversionFee = conversionFees[targetChain]; // e.g., 0.018 (1.8%)
const feeScore = (0.03 - conversionFee) / 0.015; // Normalize 1.5%-3% range
totalScore += Math.max(0, feeScore) × 30;
// Example: (0.03 - 0.018) / 0.015 = 0.8 → 0.8 × 30 = 24 points

// Factor 3: Regional Preference (20% weight, 0-20 points)
const regionalBonus = regionalPreferences[country][stablecoin]; // e.g., 1.2 for USDT in Argentina
totalScore += (regionalBonus - 0.7) × 20; // Normalize
// Example: (1.2 - 0.7) × 20 = 10 points

// Factor 4: Price Stability (10% weight, 0-10 points)
const stabilityScores = { USDC: 1.0, USDT: 0.95, DAI: 0.9 };
totalScore += stabilityScores[stablecoin] × 10;
// Example: 1.0 × 10 = 10 points

// Total: 34 + 24 + 10 + 10 = 78 points
```

**Regional Preferences:**

```typescript
const regionalPreferences = {
    argentina: { USDT: 1.2, USDC: 1.0, DAI: 0.8 }, // USDT popular in LatAm
    venezuela: { USDT: 1.3, USDC: 0.9, DAI: 0.7 },
    turkey: { USDT: 1.1, USDC: 1.0, DAI: 0.9 },
    default: { USDC: 1.0, USDT: 1.0, DAI: 1.0 },
};
```

**Liquidity Score Calculation:**

```typescript
// Get TVL (Total Value Locked) for stablecoin across all chains
const tvlValues = Object.values(chainLiquidity).map(chain => 
    chain[stablecoin] || 0
);
// Example: [5000000000, 2000000000, 1000000000, 800000000]

// Find maximum TVL
const maxTvl = Math.max(...tvlValues);
// Example: 5000000000

// Normalize each chain's TVL to 0-1 scale
const scores = {};
Object.entries(chainLiquidity).forEach(([chain, chainData]) => {
    const tvl = chainData[stablecoin] || 0;
    scores[chain] = maxTvl > 0 ? Math.min(1.0, tvl / maxTvl) : 0;
});
// Example: Ethereum: 5B / 5B = 1.0, Polygon: 2B / 5B = 0.4
```

**Conversion Fee Estimation:**

```typescript
// Base fee based on market cap and volume
const baseFee = marketCap > 50B && volume24h > 1B
    ? 0.015  // Very liquid: 1.5%
    : marketCap > 10B && volume24h > 100M
      ? 0.018  // Good liquidity: 1.8%
      : 0.022; // Standard: 2.2%

// Adjust based on chain liquidity score
const fees = {};
Object.entries(chainScores).forEach(([chain, score]) => {
    // Lower score = higher fee (less liquidity = worse rates)
    fees[chain] = baseFee + (1 - score) × 0.01; // Add up to 1% based on liquidity
});
// Example: baseFee = 0.018, score = 0.4 → fee = 0.018 + (1-0.4)×0.01 = 0.024 (2.4%)
```

##### 6. Efficiency Calculation

**Chain Efficiency Score:**

```typescript
// Total monthly cost = gas costs + conversion costs
const totalMonthlyCost = avgMonthlyGasCost + monthlyConversionCost;

// Efficiency = inverse of cost (higher efficiency = lower cost)
const efficiency = 1 / totalMonthlyCost;
// Example: 1 / $50 = 0.02 efficiency

// Most efficient chain has highest efficiency score
const mostEfficientChain = analysis.reduce((best, current) =>
    current.efficiency > best.efficiency ? current : best
);
```

**Cost Percentage:**

```typescript
// What percentage of balance goes to fees?
const costPercentage = (totalMonthlyCost / balance) × 100;
// Example: ($50 / $1000) × 100 = 5% of balance goes to fees
```

##### 7. AI Enhancement

The AI layer (Claude) enhances recommendations by:

- Generating human-readable explanations for each recommendation
- Providing context-aware insights based on user's country and spending patterns
- Answering user questions about portfolio optimization
- Creating executive summaries of optimization opportunities

**Files:**

#### Optimizer Settings

Users can configure:

- **Minimum Monthly Expenses**: Base amount for calculations
- **Spending Percentage**: Percentage of portfolio for spending (default: 15%)
- **Country**: Regional preferences for stablecoin selection

#### Recommendation Types

1. **Switch Stablecoin**
   - Recommends switching from one stablecoin to another on the same chain
   - Shows potential monthly and 6-month savings
   - Explains liquidity and regional fit improvements

2. **Convert with Timing**
   - Suggests optimal time to execute conversions
   - Shows current gas cost percentile
   - Estimates potential savings from waiting

3. **Bridge Recommendations**
   - Suggests bridging assets between chains
   - Calculates break-even point
   - Shows cost-benefit analysis

4. **Fiat to Stablecoin**
   - Recommends converting fiat to stablecoins
   - Suggests optimal stablecoin and chain
   - Shows conversion fees

#### AI Features

- **Portfolio Summary**: AI-generated overview of current portfolio state
- **Enhanced Recommendations**: AI explanations for each recommendation
- **Q&A System**: Ask questions about your portfolio and get AI answers
- **Market Sentiment**: AI analysis of current market conditions

#### Data Sources

- **CoinGecko API**: Prices, volumes, liquidity, historical data
- **Backend API**: Chain-specific gas costs and exchange rates
- **User Transactions**: Historical transaction patterns
- **Market Sentiment**: Real-time market analysis

#### Example Recommendation

```json
{
  "type": "switch_stablecoin",
  "priority": "high",
  "chain": "polygon",
  "from": "USDT",
  "to": "USDC",
  "reason": "USDC has better liquidity and lower conversion fees on Polygon",
  "monthlySavings": "$12.50",
  "sixMonthSavings": "$75.00",
  "details": {
    "currentFee": "$2.50 per transaction",
    "newFee": "$1.80 per transaction",
    "liquidityImprovement": true,
    "regionalFit": ["Argentina", "Brazil"]
  }
}
```

**Files:**

- `app/(tabs)/three.tsx` - Optimizer screen (2400+ lines)
- `utils/enhancedOptimizer.ts` - Core optimization algorithm
- `utils/aiEnhancer.ts` - AI integration layer
- `utils/realDataFetcher.ts` - Market data fetching
- `utils/stablecoinSelector.ts` - Stablecoin selection logic
- `utils/marketSentiment.ts` - Market sentiment analysis
- `contexts/OptimizerSettingsContext.tsx` - Settings management

---

### Settings & Preferences

The settings screen allows users to configure app preferences and optimizer settings.

#### Key Features

- **Optimizer Settings**: Configure minimum expenses, spending percentage, and country
- **Theme Toggle**: Switch between light and dark mode
- **Notifications**: Enable/disable notifications (UI ready)
- **Wallet Management**: Lock wallet, view wallet info
- **About Section**: App version and information

#### Optimizer Settings

1. **Minimum Monthly Expenses**
   - Base amount for optimization calculations
   - Used to determine optimal allocation percentages
   - Default: $800 USD

2. **Spending Percentage**
   - Percentage of portfolio allocated for spending
   - Rest is kept as reserves
   - Default: 15%

3. **Country Selection**
   - Regional preferences for stablecoin selection
   - Affects which stablecoins are recommended
   - Default: Argentina

#### Theme Management

- **Light Mode**: Bright theme for daytime use
- **Dark Mode**: Dark theme for low-light environments
- **System Default**: Follows device theme settings
- **Persistent**: Theme preference saved across sessions

#### Wallet Security

- **Lock Wallet**: Securely locks wallet, requires password to unlock
- **View Public Key**: Display wallet address
- **Clear Data**: Reset app data (with confirmation)

**Files:**

- `app/settings.tsx` - Settings screen implementation
- `contexts/ThemeContext.tsx` - Theme management
- `contexts/OptimizerSettingsContext.tsx` - Optimizer settings

---

## Architecture

### Frontend Architecture

The application is built using:

- **React Native**: Cross-platform mobile framework
- **Expo**: Development platform and tooling
- **Expo Router**: File-based routing system
- **TypeScript**: Type-safe JavaScript
- **Context API**: State management (Wallet, Transactions, Settings, Theme)

### Backend Architecture

#### Proxy Server

A lightweight Express.js proxy server handles:

1. **CORS Bypass**: Allows frontend to make API calls without CORS issues
2. **API Key Management**: Keeps sensitive API keys server-side
3. **Request Forwarding**: Proxies requests to backend API
4. **Error Handling**: Provides consistent error responses

**Proxy Endpoints:**

- `GET /health` - Health check
- `POST /api/claude` - Claude AI API proxy
- `POST /api/evaluate_path` - Path evaluation proxy
- `POST /api/convert_currency` - Currency conversion proxy

#### Backend API

The backend API (running on port 8000) provides:

- Path evaluation algorithms
- Currency conversion logic
- Exchange rate data
- Gas cost calculations

### Data Flow

```
Frontend (React Native)
    ↓
Proxy Server (Express, Port 3000)
    ↓
Backend API (Port 8000)
    ↓
External APIs (CoinGecko, Blockchain Networks)
```

### State Management

- **WalletContext**: Manages wallet state, authentication, and blockchain interactions
- **TransactionContext**: Manages transaction history and operations
- **OptimizerSettingsContext**: Stores optimizer preferences
- **ThemeContext**: Manages theme state

### Storage

- **Secure Storage**: `expo-secure-store` for encrypted wallet data
- **Async Storage**: `@react-native-async-storage/async-storage` for app preferences
- **Local State**: React state for UI state management

---

## Getting Started

### Prerequisites

- Node.js 18+ and npm/pnpm
- Expo CLI (`npm install -g expo-cli`)
- iOS Simulator (for iOS development) or Android Studio (for Android)
- Backend API running on port 8000 (or configure `BACKEND_URL`)

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd stable-living-frontend
   ```

2. **Install dependencies**

   ```bash
   pnpm install
   cd server
   npm install
   cd ..
   ```

3. **Set up environment variables**

   Create a `.env` file in the project root:

   ```env
   # Anthropic Claude API (for AI features)
   ANTHROPIC_API_KEY=sk-ant-api03-...
   
   # CoinGecko API (optional, for higher rate limits)
   EXPO_PUBLIC_COINGECKO_API_KEY=your-key-here
   
   # Proxy server URL (optional, auto-detected)
   EXPO_PUBLIC_PROXY_URL=http://localhost:3000
   
   # Backend API URL (for proxy server)
   BACKEND_URL=http://localhost:8000
   
   # PayPal OAuth (for PayPal integration)
   EXPO_PUBLIC_PAYPAL_CLIENT_ID=your-client-id
   EXPO_PUBLIC_PAYPAL_CLIENT_SECRET=your-client-secret
   ```

4. **Start the proxy server**

   ```bash
   npm run server
   ```

   Or run both proxy and Expo together:

   ```bash
   npm run dev
   ```

5. **Start the Expo development server**

   ```bash
   npm start
   ```

   Then:
   - Press `i` for iOS simulator
   - Press `a` for Android emulator
   - Press `w` for web browser
   - Scan QR code with Expo Go app (for physical devices)

### Development Setup

#### Running on Physical Devices

1. **iOS (Physical Device)**
   - Connect iPhone via USB
   - Trust computer on iPhone
   - Run `npm start` and press `i`

2. **Android (Physical Device)**
   - Enable USB debugging
   - Connect via USB
   - Run `npm start` and press `a`

3. **Network Configuration**
   - For physical devices, use LAN IP instead of localhost
   - Proxy server auto-detects IP from Expo Constants
   - Or set `EXPO_PUBLIC_PROXY_URL` to your machine's LAN IP

#### Android Emulator

- Proxy server automatically uses `10.0.2.2:3000` for Android emulator
- This maps to `localhost:3000` on the host machine

---

## API Documentation

### Proxy Server API

#### Health Check

```http
GET /health
```

**Response:**

```json
{
  "status": "ok",
  "service": "Claude API Proxy"
}
```

#### Path Evaluation

```http
POST /api/evaluate_path
Content-Type: application/json

{
  "from_currency": "USDC",
  "to_currency": "ARS",
  "amount": 100
}
```

**Response:**

```json
{
  "path": ["USDC", "SOL", "ARS"],
  "final_amount": 110000,
  "final_amount_ars": 110000,
  "total_fee_local": 2.50,
  "total_fee_ars": 2.50,
  "hops": [
    {
      "from_ccy": "USDC",
      "to_ccy": "SOL",
      "fee_percent": 0.5,
      "fee_local": 0.50,
      "fee_ars": 0.55,
      "amount_before": 100,
      "amount_after_fee": 99.5,
      "amount_next": 0.0905,
      "exchange": "Jupiter"
    }
  ]
}
```

**Note:** The proxy automatically converts `USDC` to `USDE` for backend compatibility.

#### Currency Conversion

```http
POST /api/convert_currency
Content-Type: application/json

{
  "from_ccy": "USDC",
  "to_ccy": "ARS",
  "amount": 100
}
```

**Response:**

```json
{
  "converted_amount": 110000,
  "exchange_rate": 1100,
  "fee": 2.50
}
```

**Note:** The proxy automatically converts `USDC` to `USDE` for backend compatibility.

#### Claude AI API Proxy

```http
POST /api/claude
Content-Type: application/json

{
  "model": "claude-3-haiku-20240307",
  "max_tokens": 500,
  "system": "You are a helpful assistant.",
  "messages": [
    {
      "role": "user",
      "content": "Explain this recommendation..."
    }
  ]
}
```

**Response:**

```json
{
  "content": [
    {
      "type": "text",
      "text": "AI-generated response..."
    }
  ]
}
```

### External APIs

#### CoinGecko API

Used for:

- Real-time cryptocurrency prices
- Historical price data
- Trading volume and liquidity data
- Market sentiment

**Setup:** See `COINGECKO_API_SETUP.md` for detailed setup instructions.

#### Solana RPC

Used for:

- Wallet balance queries
- Transaction submission
- Transaction history
- Network status

**Default RPC:** Uses public Solana RPC endpoints (can be configured).

---

## Development Guide

### Project Structure

```
stable-living-frontend/
├── app/                    # Expo Router pages
│   ├── (tabs)/            # Tab navigation screens
│   │   ├── index.tsx     # Home/Dashboard
│   │   ├── two.tsx       # Activity/Transactions
│   │   └── three.tsx     # Optimizer
│   ├── send.tsx          # Send money screen
│   ├── receive.tsx        # Receive money screen
│   ├── convert.tsx        # Currency conversion
│   ├── buy.tsx           # Buy crypto screen
│   ├── settings.tsx      # Settings screen
│   └── ...
├── components/            # Reusable components
│   └── WalletHeader.tsx
├── contexts/             # React Context providers
│   ├── WalletContext.tsx
│   ├── TransactionContext.tsx
│   ├── OptimizerSettingsContext.tsx
│   └── ThemeContext.tsx
├── utils/                # Utility functions
│   ├── wallet.ts         # Wallet operations
│   ├── pathApi.ts        # Path evaluation API
│   ├── enhancedOptimizer.ts
│   ├── aiEnhancer.ts     # AI integration
│   └── ...
├── server/               # Proxy server
│   ├── index.js         # Express server
│   └── package.json
├── constants/            # App constants
│   └── Colors.ts        # Theme colors
└── package.json
```

### Adding New Features

1. **Create Screen**: Add new file in `app/` directory
2. **Add Route**: Expo Router automatically creates routes from file structure
3. **Create Context** (if needed): Add to `contexts/` directory
4. **Add Utilities**: Add helper functions to `utils/` directory
5. **Update Types**: Add TypeScript types as needed

### Code Style

- **TypeScript**: Strict mode enabled
- **Formatting**: Prettier configured
- **Linting**: ESLint (if configured)

Run formatting:

```bash
npm run format
```

### Testing

Currently, the project doesn't include automated tests. Consider adding:

- Unit tests for utility functions
- Integration tests for API calls
- E2E tests for critical user flows

---

## Deployment

### Web Deployment

1. **Build for web**

   ```bash
   npx expo export:web
   ```

2. **Deploy static files**
   - Upload `web-build/` directory to hosting service
   - Configure environment variables on hosting platform

### Mobile App Deployment

#### iOS (App Store)

1. **Configure app.json**
   - Set bundle identifier
   - Configure app icons and splash screens

2. **Build**

   ```bash
   eas build --platform ios
   ```

3. **Submit to App Store**

   ```bash
   eas submit --platform ios
   ```

#### Android (Google Play)

1. **Configure app.json**
   - Set package name
   - Configure app icons and splash screens

2. **Build**

   ```bash
   eas build --platform android
   ```

3. **Submit to Google Play**

   ```bash
   eas submit --platform android
   ```

### Environment Variables

For production, set environment variables on your hosting platform:

- `ANTHROPIC_API_KEY` - Required for AI features
- `EXPO_PUBLIC_COINGECKO_API_KEY` - Optional, improves rate limits
- `BACKEND_URL` - Backend API URL
- `EXPO_PUBLIC_PROXY_URL` - Proxy server URL (if different from default)

---

## Troubleshooting

### Common Issues

1. **Proxy Server Not Connecting**
   - Ensure proxy server is running on port 3000
   - Check firewall settings
   - Verify `EXPO_PUBLIC_PROXY_URL` is correct

2. **Backend API Errors**
   - Verify backend is running on port 8000
   - Check `BACKEND_URL` environment variable
   - Review backend logs for errors

3. **Wallet Not Loading**
   - Check secure storage permissions
   - Verify password is correct
   - Clear app data and restore wallet

4. **AI Features Not Working**
   - Verify `ANTHROPIC_API_KEY` is set
   - Check API key is valid
   - Review proxy server logs

5. **Slow Path Evaluation**
   - Check network connection
   - Verify backend API is responsive
   - Review timing logs in console

### Performance Optimization

- **Debouncing**: Path evaluation debounced to 300ms
- **Request Cancellation**: In-flight requests cancelled on input change
- **Caching**: Consider adding response caching for repeated queries
- **Lazy Loading**: Large components loaded on demand

---

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## Support

For issues and questions:

- Open an issue on GitHub
- Check existing documentation in `docs/` directory
- Review setup guides: `QUICK_START.md`, `SETUP_COMPLETE.md`

---

## Acknowledgments

- Solana Foundation for blockchain infrastructure
- Anthropic for Claude AI API
- CoinGecko for market data
- Expo team for excellent development tools
- MadHacks 2025
