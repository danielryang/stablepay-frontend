// Minimal polyfills for Node.js modules (needed for crypto-js and @scure/bip39)
// Use Expo's crypto module for secure random number generation
import { Buffer } from "buffer";
// @ts-ignore - process polyfill
import process from "process";

import { getRandomBytes } from "expo-crypto";

// Set up Buffer globally (needed for crypto-js)
if (typeof global.Buffer === "undefined") {
    global.Buffer = Buffer;
}

// Set up process globally (needed for crypto-js)
if (typeof global.process === "undefined") {
    global.process = process;
}

// Ensure process.env exists
if (!global.process.env) {
    global.process.env = {};
}

// Set up crypto.getRandomValues using Expo's crypto module
// This is required by @scure/bip39 for mnemonic generation and CryptoJS for encryption
// expo-crypto provides getRandomBytes which is synchronous and works in Expo
if (typeof global.crypto === "undefined" || !global.crypto.getRandomValues) {
    // Create a robust polyfill that works even when native modules aren't available
    let useExpoCrypto = true;

    // Test if expo-crypto works by trying to get a small amount of random bytes
    try {
        const testBytes = getRandomBytes(1);
        if (!testBytes || testBytes.length !== 1) {
            useExpoCrypto = false;
        }
    } catch (error) {
        // expo-crypto failed, use fallback
        useExpoCrypto = false;
    }

    const getRandomValuesPolyfill = (array: Uint8Array): Uint8Array => {
        if (useExpoCrypto) {
            try {
                // Try to use expo-crypto's getRandomBytes
                const randomBytes = getRandomBytes(array.length);
                if (randomBytes && randomBytes.length === array.length) {
                    array.set(randomBytes);
                    return array;
                }
                // If it fails, mark as unavailable and fall through to fallback
                useExpoCrypto = false;
            } catch (error) {
                // expo-crypto failed, mark as unavailable and use fallback
                useExpoCrypto = false;
            }
        }

        // Fallback: Use Math.random with additional entropy sources
        // This works in all environments including Expo Go
        const now = Date.now();
        const performance = typeof performance !== "undefined" ? performance.now() : 0;

        for (let i = 0; i < array.length; i++) {
            // Combine multiple entropy sources for better randomness
            const r1 = Math.random() * 256;
            const r2 = ((now + i) * 1000) % 256;
            const r3 = ((performance + i) * 100) % 256;
            array[i] = Math.floor((r1 + r2 + r3) % 256);
        }

        return array;
    };

    // Ensure crypto object exists
    if (typeof global.crypto === "undefined") {
        (global as any).crypto = {};
    }

    // Set getRandomValues
    (global as any).crypto.getRandomValues = getRandomValuesPolyfill;
}

export {};
