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

    console.log(`🚀 Claude API Proxy Server running on http://localhost:${PORT}`);
    console.log(`📡 Endpoint: http://localhost:${PORT}/api/claude`);
    console.log(`🔑 API Key: ${apiKey ? "✅ Found" : "❌ Not found (check .env in project root)"}`);

    if (!apiKey) {
        console.log("\n💡 Make sure your .env file in the project root contains:");
        console.log("   ANTHROPIC_API_KEY=sk-ant-api03-...");
    }
});
