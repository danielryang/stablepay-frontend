/**
 * Simple Express Proxy Server for Anthropic Claude API
 *
 * This server runs alongside Expo to handle Claude API calls
 * and bypass CORS restrictions in browsers.
 *
 * Run with: node server/index.js
 * Or: npm run server
 */

// Load environment variables from .env file
const path = require("path");
const envPath = path.join(__dirname, "..", ".env");
require("dotenv").config({ path: envPath });

// Debug: Log .env file location (helpful for troubleshooting)
console.log(`📁 Looking for .env at: ${envPath}`);

const express = require("express");
const cors = require("cors");
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors()); // Allow requests from Expo (localhost:8081, etc.)
app.use(express.json());

// Health check endpoint
app.get("/health", (req, res) => {
    res.json({ status: "ok", service: "Claude API Proxy" });
});

// Path evaluation proxy endpoint
app.post("/api/evaluate_path", async (req, res) => {
    const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8000";

    try {
        let { from_currency, to_currency, amount } = req.body;

        // Validate required fields
        if (!from_currency || !to_currency || amount === undefined) {
            return res.status(400).json({
                error: "Missing required fields: from_currency, to_currency, and amount are required",
            });
        }

        // Replace USDC with USDE for backend compatibility
        if (from_currency === "USDC") {
            from_currency = "USDE";
        }
        if (to_currency === "USDC") {
            to_currency = "USDE";
        }

        console.log(`Proxying path evaluation: ${amount} ${from_currency} -> ${to_currency}`);

        const response = await fetch(`${BACKEND_URL}/evaluate_path`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                from_currency,
                to_currency,
                amount,
            }),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: { message: "Unknown error" } }));
            console.error("❌ Path evaluation API error:", errorData);
            return res.status(response.status).json(errorData);
        }

        const data = await response.json();
        console.log("✅ Path evaluation response received");
        res.json(data);
    } catch (error) {
        console.error("❌ Proxy error:", error);
        res.status(500).json({
            error: "Proxy server error",
            message: error.message,
        });
    }
});

// Currency conversion proxy endpoint
app.post("/api/convert_currency", async (req, res) => {
    const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8000";

    try {
        let { from_ccy, to_ccy, amount } = req.body;

        // Validate required fields
        if (!from_ccy || !to_ccy || amount === undefined) {
            return res.status(400).json({
                error: "Missing required fields: from_ccy, to_ccy, and amount are required",
            });
        }

        // Replace USDC with USDE for backend compatibility
        if (from_ccy === "USDC") {
            from_ccy = "USDE";
        }
        if (to_ccy === "USDC") {
            to_ccy = "USDE";
        }

        console.log(`Proxying currency conversion: ${amount} ${from_ccy} -> ${to_ccy}`);

        const response = await fetch(`${BACKEND_URL}/convert_currency`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                from_ccy,
                to_ccy,
                amount,
            }),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: { message: "Unknown error" } }));
            console.error("❌ Currency conversion API error:", errorData);
            return res.status(response.status).json(errorData);
        }

        const data = await response.json();
        console.log("✅ Currency conversion response received");
        res.json(data);
    } catch (error) {
        console.error("❌ Proxy error:", error);
        res.status(500).json({
            error: "Proxy server error",
            message: error.message,
        });
    }
});

// Claude API proxy endpoint
app.post("/api/claude", async (req, res) => {
    // Try multiple env var names for flexibility
    const apiKey =
        process.env.ANTHROPIC_API_KEY ||
        process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY ||
        process.env.CLAUDE_API_KEY;

    if (!apiKey) {
        console.error("❌ ANTHROPIC_API_KEY not found in environment variables");
        console.log("💡 Checked variables:");
        console.log(`   ANTHROPIC_API_KEY: ${process.env.ANTHROPIC_API_KEY ? "✅" : "❌"}`);
        console.log(
            `   EXPO_PUBLIC_ANTHROPIC_API_KEY: ${process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY ? "✅" : "❌"}`
        );
        console.log(`   CLAUDE_API_KEY: ${process.env.CLAUDE_API_KEY ? "✅" : "❌"}`);
        console.log(`\n💡 Make sure your .env file in the project root contains:`);
        console.log(`   ANTHROPIC_API_KEY=sk-ant-api03-...`);
        return res.status(500).json({
            error: "ANTHROPIC_API_KEY not found in environment variables",
            hint: "Set ANTHROPIC_API_KEY in .env file in project root",
        });
    }

    try {
        const { model, max_tokens, system, messages } = req.body;

        // Validate required fields
        if (!model || !messages) {
            return res.status(400).json({
                error: "Missing required fields: model and messages are required",
            });
        }

        console.log(`Proxying Claude API request: ${model}`);

        const response = await fetch("https://api.anthropic.com/v1/messages", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-api-key": apiKey,
                "anthropic-version": "2023-06-01",
            },
            body: JSON.stringify({
                model: model,
                max_tokens: max_tokens || 500,
                system: system,
                messages: messages,
            }),
        });

        if (!response.ok) {
            const errorData = await response
                .json()
                .catch(() => ({ error: { message: "Unknown error" } }));
            console.error("❌ Claude API error:", errorData);
            return res.status(response.status).json(errorData);
        }

        const data = await response.json();
        console.log("✅ Claude API response received");
        res.json(data);
    } catch (error) {
        console.error("❌ Proxy error:", error);
        res.status(500).json({
            error: "Proxy server error",
            message: error.message,
        });
    }
});

// Start server
app.listen(PORT, () => {
    const apiKey =
        process.env.ANTHROPIC_API_KEY ||
        process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY ||
        process.env.CLAUDE_API_KEY;

    const backendUrl = process.env.BACKEND_URL || "http://localhost:8000";
    
    console.log(`🚀 Proxy Server running on http://localhost:${PORT}`);
    console.log(`📡 Claude API Endpoint: http://localhost:${PORT}/api/claude`);
    console.log(`📡 Currency Conversion Endpoint: http://localhost:${PORT}/api/convert_currency`);
    console.log(`📡 Path Evaluation Endpoint: http://localhost:${PORT}/api/evaluate_path`);
    console.log(`🔗 Backend URL: ${backendUrl}`);
    console.log(`🔑 API Key: ${apiKey ? "✅ Found" : "❌ Not found (check .env in project root)"}`);

    if (!apiKey) {
        console.log("\n💡 Make sure your .env file in the project root contains:");
        console.log("   ANTHROPIC_API_KEY=sk-ant-api03-...");
    }
});
