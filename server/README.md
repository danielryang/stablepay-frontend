# Claude API Proxy Server

Simple Express proxy server to handle Anthropic Claude API calls and bypass CORS restrictions in browsers.

## Setup

1. **Install dependencies:**
   ```bash
   cd server
   npm install
   ```

   Or from project root:
   ```bash
   npm install express cors --save-dev
   ```

2. **Set up environment variable:**
   
   Create a `.env` file in the `server/` directory (or use the root `.env`):
   ```env
   ANTHROPIC_API_KEY=sk-ant-api03-...
   ```
   
   Or set it when running:
   ```bash
   ANTHROPIC_API_KEY=your-key-here node server/index.js
   ```

## Running

**Option 1: Run proxy server only**
```bash
npm run server
```

**Option 2: Run both proxy and Expo together**
```bash
npm run dev
```
(Requires `concurrently` package: `npm install -g concurrently`)

**Option 3: Run manually**
```bash
cd server
node index.js
```

The server will start on `http://localhost:3000`

## Endpoints

### Health Check
- `GET /health` - Health check endpoint

### Claude API Proxy
- `POST /api/claude` - Proxy Claude API calls to Anthropic
  - **Request Body:**
    ```json
    {
      "model": "claude-3-sonnet-20240229",
      "max_tokens": 500,
      "system": "Optional system message",
      "messages": [...]
    }
    ```

### Backend Proxy Endpoints
- `POST /api/evaluate_path` - Proxy path evaluation requests to backend
  - **Request Body:**
    ```json
    {
      "from_currency": "USD",
      "to_currency": "EUR",
      "amount": 100
    }
    ```
  - **Backend URL:** Configured via `BACKEND_URL` env var (default: `http://localhost:8000`)

- `POST /api/convert_currency` - Proxy currency conversion requests to backend
  - **Request Body:**
    ```json
    {
      "from_ccy": "USD",
      "to_ccy": "EUR",
      "amount": 100
    }
    ```
  - **Backend URL:** Configured via `BACKEND_URL` env var (default: `http://localhost:8000`)

## Frontend Integration

The frontend automatically uses `http://localhost:3000/api/claude` as the proxy URL.

To use a different URL, set `EXPO_PUBLIC_PROXY_URL` in your `.env` file.

## Security Note

✅ **API key is stored server-side** - never exposed to the browser
✅ **CORS enabled** - allows requests from Expo (localhost:8081, etc.)
✅ **Simple and lightweight** - minimal dependencies

