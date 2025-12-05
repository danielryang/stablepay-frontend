# Stable Pay Frontend

A cross-platform mobile/web app for managing stablecoin portfolios with AI-powered optimization. Built with React Native (Expo) for MadHacks 2025.

## Features

### Core Functionality
- **Multi-chain Wallet**: Solana-based stablecoin management (USDC, USDT) with encrypted storage
- **Smart Transfers**: Send to crypto addresses or PayPal with automatic path optimization
- **Currency Conversion**: Real-time rates with multi-hop path finding for minimal fees
- **Transaction History**: Complete activity log with on-chain sync
- **Portfolio Optimizer**: AI-powered recommendations for optimal allocations across chains

### Smart Allocation Optimizer

Analyzes your portfolio using:
- 90-day historical gas cost data from CoinGecko
- Real-time liquidity and TVL from DefiLlama
- Volatility patterns and day-of-week analysis
- Transaction frequency patterns

Provides recommendations for:
- **Stablecoin Selection**: Best stablecoin per chain based on liquidity and regional fit
- **Bridge Recommendations**: When to move assets between chains (with break-even analysis)
- **Timing Optimization**: Best days/times to execute conversions
- **Fiat Distribution**: Optimal allocation when converting fiat to stablecoins

Key calculations:
- Average monthly gas costs: `mean(historicalGasCosts) × monthlyFrequency`
- Volatility: `stdDev(gasCosts) / avgGasCost`
- Bridge savings: `(currentMonthlyCost - targetMonthlyCost) × 6 - bridgeCost`
- Stablecoin scoring: Liquidity (40%) + Fees (30%) + Regional fit (20%) + Stability (10%)

## Quick Start

```bash
# Install dependencies
pnpm install
cd server && npm install && cd ..

# Set up environment (.env file)
ANTHROPIC_API_KEY=sk-ant-api03-...
EXPO_PUBLIC_COINGECKO_API_KEY=your-key
BACKEND_URL=http://localhost:8000

# Start proxy server and app
npm run dev

# Or separately:
npm run server  # Proxy on port 3000
npm start       # Expo dev server
```

## Architecture

```
Frontend (React Native + Expo)
    ↓ Proxy requests
Express Proxy (Port 3000)
    ↓ Forward to backend
Backend API (Port 8000)
    ↓ Fetch data
External APIs (CoinGecko, Solana RPC)
```

**State Management**: Context API (Wallet, Transactions, Settings, Theme)  
**Storage**: expo-secure-store (encrypted wallets), AsyncStorage (preferences)

## Project Structure

```
app/                    # Screens (Expo Router)
  (tabs)/              # Tab navigation
  send.tsx, receive.tsx, convert.tsx, etc.
contexts/              # State management
utils/                 # Core logic and APIs
server/                # Express proxy
```

## Key APIs

### Path Evaluation
```http
POST /api/evaluate_path
{ "from_currency": "USDC", "to_currency": "ARS", "amount": 100 }

Response: { "path": ["USDC", "SOL", "ARS"], "final_amount": 110000, 
           "total_fee_ars": 2.50, "hops": [...] }
```

### Claude AI Proxy
```http
POST /api/claude
{ "model": "claude-3-haiku-20240307", "messages": [...] }
```

## Deployment

**Web**: `npx expo export:web` → deploy `web-build/`  
**Mobile**: `eas build --platform ios/android` → `eas submit`

## Environment Variables

Required:
- `ANTHROPIC_API_KEY` - AI features
- `BACKEND_URL` - Backend API endpoint

Optional:
- `EXPO_PUBLIC_COINGECKO_API_KEY` - Higher API rate limits
- `EXPO_PUBLIC_PROXY_URL` - Custom proxy URL

## Troubleshooting

- **Proxy issues**: Check port 3000 is free, verify firewall
- **Wallet not loading**: Clear app data, check password
- **AI features failing**: Verify ANTHROPIC_API_KEY
- **Slow path evaluation**: Check network and backend API

## Contributing

1. Fork → 2. Create feature branch → 3. Commit → 4. Push → 5. PR

---

Built for MadHacks 2025 | Stack: React Native, Expo, Solana, Claude AI
