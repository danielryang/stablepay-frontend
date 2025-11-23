const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

// Add resolver configuration for minimal polyfills (only for crypto-js)
config.resolver = {
    ...config.resolver,
    extraNodeModules: {
        ...config.resolver?.extraNodeModules,
        buffer: require.resolve('buffer'),
        process: require.resolve('process/browser'),
        // Explicitly resolve subpath exports for @noble/hashes
        '@noble/hashes/hmac': require.resolve('@noble/hashes/hmac.js'),
        '@noble/hashes/sha2': require.resolve('@noble/hashes/sha2.js'),
        // Explicitly resolve subpath exports for @scure/bip39
        '@scure/bip39/wordlists/english': require.resolve('@scure/bip39/wordlists/english.js'),
    },
};

module.exports = withNativeWind(config, {
    input: "./global.css",
    inlineRem: 16
});
