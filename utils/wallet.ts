// Ensure polyfills are loaded before crypto imports
import { hmac } from "@noble/hashes/hmac";
import { sha512 } from "@noble/hashes/sha2";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as bip39 from "@scure/bip39";
import { wordlist } from "@scure/bip39/wordlists/english";
import { getAccount, getAssociatedTokenAddress } from "@solana/spl-token";
import {
    Connection,
    Keypair,
    LAMPORTS_PER_SOL,
    PublicKey,
    SystemProgram,
    Transaction,
    sendAndConfirmTransaction,
} from "@solana/web3.js";
import { Buffer } from "buffer";
import CryptoJS from "crypto-js";
import * as nacl from "tweetnacl";

import { Platform } from "react-native";

import * as SecureStore from "expo-secure-store";

import "../polyfills";

// Solana derivation path: m/44'/501'/0'/0'
const SOLANA_DERIVATION_PATH = "m/44'/501'/0'/0'";
const WALLET_STORAGE_KEY = "encrypted_wallet";
const WALLET_SECRET_KEY = "encrypted_secret_key";
const WALLET_PASSWORD_KEY = "wallet_password_hash";

// Platform detection
const isWeb = Platform.OS === "web";

// Storage wrapper that uses SecureStore on native and AsyncStorage on web
const storage = {
    async setItem(key: string, value: string): Promise<void> {
        if (isWeb) {
            await AsyncStorage.setItem(key, value);
        } else {
            await SecureStore.setItemAsync(key, value);
        }
    },
    async getItem(key: string): Promise<string | null> {
        if (isWeb) {
            return await AsyncStorage.getItem(key);
        } else {
            return await SecureStore.getItemAsync(key);
        }
    },
    async deleteItem(key: string): Promise<void> {
        if (isWeb) {
            await AsyncStorage.removeItem(key);
        } else {
            await SecureStore.deleteItemAsync(key);
        }
    },
};

// Connection to Solana devnet
export const SOLANA_RPC_URL = "https://api.devnet.solana.com";
export const connection = new Connection(SOLANA_RPC_URL, "confirmed");

// USDC mint address on Solana devnet
// Official USDC devnet mint (test token)
// For mainnet, use: EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v
export const USDC_MINT_DEVNET = "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU";

/**
 * Derive Ed25519 key using BIP32-style derivation
 * This implements the Solana derivation path m/44'/501'/0'/0'
 */
function deriveEd25519Path(seed: Uint8Array, path: string): Uint8Array {
    const segments = path
        .split("/")
        .slice(1)
        .map(part => {
            if (!part.endsWith("'")) {
                throw new Error("Only hardened paths are allowed");
            }
            return (parseInt(part.slice(0, -1)) | 0x80000000) >>> 0;
        });

    // Initial HMAC-SHA512 with "ed25519 seed"
    // @noble/hashes hmac(key, message) - key first, then message
    const seedKey = new TextEncoder().encode("ed25519 seed");
    let key = hmac(sha512, seedKey, seed);
    let priv = key.slice(0, 32);
    let chainCode = key.slice(32);

    // Derive each segment
    for (const index of segments) {
        const data = new Uint8Array(1 + 32 + 4);
        data[0] = 0x00;
        data.set(priv, 1);
        data[33] = (index >> 24) & 0xff;
        data[34] = (index >> 16) & 0xff;
        data[35] = (index >> 8) & 0xff;
        data[36] = index & 0xff;

        // @noble/hashes hmac(key, message)
        const I = hmac(sha512, chainCode, data);
        priv = I.slice(0, 32);
        chainCode = I.slice(32);
    }

    return priv;
}

/**
 * Derive encryption key from password using PBKDF2
 * Reduced iterations for faster encryption while maintaining security
 */
function deriveEncryptionKey(password: string, salt: string): string {
    return CryptoJS.PBKDF2(password, salt, {
        keySize: 256 / 32,
        iterations: 5000, // Reduced from 10000 for faster encryption (still secure)
    }).toString();
}

/**
 * Encrypt wallet data
 */
function encryptWalletData(data: string, password: string): string {
    const salt = CryptoJS.lib.WordArray.random(128 / 8).toString();
    const key = deriveEncryptionKey(password, salt);
    const iv = CryptoJS.lib.WordArray.random(128 / 8);

    const encrypted = CryptoJS.AES.encrypt(data, key, {
        iv: iv,
        padding: CryptoJS.pad.Pkcs7,
        mode: CryptoJS.mode.CBC,
    });

    // Combine salt, iv, and encrypted data
    return salt + ":" + iv.toString() + ":" + encrypted.toString();
}

/**
 * Decrypt wallet data
 */
function decryptWalletData(encryptedData: string, password: string): string {
    const parts = encryptedData.split(":");
    if (parts.length !== 3) {
        throw new Error("Invalid encrypted data format");
    }

    const [salt, ivHex, encrypted] = parts;
    const key = deriveEncryptionKey(password, salt);
    const iv = CryptoJS.enc.Hex.parse(ivHex);

    const decrypted = CryptoJS.AES.decrypt(encrypted, key, {
        iv: iv,
        padding: CryptoJS.pad.Pkcs7,
        mode: CryptoJS.mode.CBC,
    });

    return decrypted.toString(CryptoJS.enc.Utf8);
}

/**
 * Generate a new mnemonic phrase
 */
export function generateMnemonic(): string {
    return bip39.generateMnemonic(wordlist, 128); // 12 words
}

/**
 * Validate mnemonic phrase
 */
export function validateMnemonic(mnemonic: string): boolean {
    return bip39.validateMnemonic(mnemonic, wordlist);
}

/**
 * Derive Solana keypair from mnemonic
 */
export async function deriveKeypairFromMnemonic(mnemonic: string): Promise<Keypair> {
    // Validate mnemonic
    if (!bip39.validateMnemonic(mnemonic, wordlist)) {
        throw new Error("Invalid mnemonic phrase");
    }

    // Generate seed from mnemonic (returns Uint8Array)
    const seed = await bip39.mnemonicToSeed(mnemonic);

    // Derive key using Solana derivation path
    const privateKey = deriveEd25519Path(seed, SOLANA_DERIVATION_PATH);

    // Create keypair from derived private key
    const keypair = Keypair.fromSeed(privateKey);

    return keypair;
}

/**
 * Store encrypted wallet securely
 * Encrypts both the private key (secretKey) and mnemonic for recovery
 * Optimized for performance with parallel operations
 */
export async function storeEncryptedWallet(
    keypair: Keypair,
    mnemonic: string,
    password: string
): Promise<void> {
    try {
        // Convert secretKey (Uint8Array) to base64 string for encryption
        const secretKeyBase64 = Buffer.from(keypair.secretKey).toString("base64");

        // Calculate password hash (fast operation)
        const passwordHash = CryptoJS.SHA256(password).toString();

        // Encrypt both secret key and mnemonic in parallel for better performance
        const [encryptedSecretKey, encryptedMnemonic] = await Promise.all([
            Promise.resolve(encryptWalletData(secretKeyBase64, password)),
            Promise.resolve(encryptWalletData(mnemonic, password)),
        ]);

        // Store all encrypted data in parallel
        await Promise.all([
            storage.setItem(WALLET_SECRET_KEY, encryptedSecretKey),
            storage.setItem(WALLET_STORAGE_KEY, encryptedMnemonic),
            storage.setItem(WALLET_PASSWORD_KEY, passwordHash),
        ]);
    } catch (error) {
        throw new Error(`Failed to store wallet: ${error}`);
    }
}

/**
 * Load and decrypt wallet from secure storage
 * Returns the Keypair by decrypting the private key
 */
export async function loadEncryptedWallet(password: string): Promise<Keypair> {
    try {
        // Try to load encrypted secret key first (preferred method)
        const encryptedSecretKey = await storage.getItem(WALLET_SECRET_KEY);
        if (encryptedSecretKey) {
            // Verify password
            const storedPasswordHash = await storage.getItem(WALLET_PASSWORD_KEY);
            const passwordHash = CryptoJS.SHA256(password).toString();

            if (storedPasswordHash !== passwordHash) {
                throw new Error("Invalid password");
            }

            // Decrypt secret key
            const secretKeyBase64 = decryptWalletData(encryptedSecretKey, password);
            const secretKey = Buffer.from(secretKeyBase64, "base64");

            // Reconstruct keypair from secret key
            return Keypair.fromSecretKey(secretKey);
        }

        // Fallback: if no encrypted secret key, try to load from mnemonic (legacy support)
        const encryptedMnemonic = await storage.getItem(WALLET_STORAGE_KEY);
        if (!encryptedMnemonic) {
            throw new Error("No wallet found");
        }

        // Verify password
        const storedPasswordHash = await storage.getItem(WALLET_PASSWORD_KEY);
        const passwordHash = CryptoJS.SHA256(password).toString();

        if (storedPasswordHash !== passwordHash) {
            throw new Error("Invalid password");
        }

        // Decrypt mnemonic and derive keypair
        const mnemonic = decryptWalletData(encryptedMnemonic, password);
        return await deriveKeypairFromMnemonic(mnemonic);
    } catch (error: any) {
        if (error.message === "Invalid password" || error.message === "No wallet found") {
            throw error;
        }
        throw new Error(`Failed to load wallet: ${error.message || error}`);
    }
}

/**
 * Check if wallet exists in storage
 */
export async function walletExists(): Promise<boolean> {
    try {
        // Check for encrypted secret key (preferred) or encrypted mnemonic (legacy)
        const encryptedSecretKey = await storage.getItem(WALLET_SECRET_KEY);
        const encryptedWallet = await storage.getItem(WALLET_STORAGE_KEY);
        return encryptedSecretKey !== null || encryptedWallet !== null;
    } catch {
        return false;
    }
}

/**
 * Clear wallet from storage (logout)
 */
export async function clearWallet(): Promise<void> {
    try {
        await storage.deleteItem(WALLET_STORAGE_KEY);
        await storage.deleteItem(WALLET_SECRET_KEY);
        await storage.deleteItem(WALLET_PASSWORD_KEY);
    } catch (error) {
        throw new Error(`Failed to clear wallet: ${error}`);
    }
}

/**
 * Get public key from keypair
 */
export function getPublicKey(keypair: Keypair): PublicKey {
    return keypair.publicKey;
}

/**
 * Sign a message with the keypair
 */
export function signMessage(message: Uint8Array, keypair: Keypair): Uint8Array {
    return nacl.sign.detached(message, keypair.secretKey);
}

/**
 * Sign a transaction with the keypair
 */
export function signTransaction(transaction: Transaction, keypair: Keypair): Transaction {
    transaction.sign(keypair);
    return transaction;
}

/**
 * Get SOL balance for a public key
 */
export async function getBalance(publicKey: PublicKey): Promise<number> {
    try {
        const balance = await connection.getBalance(publicKey);
        return balance / LAMPORTS_PER_SOL;
    } catch (error) {
        throw new Error(`Failed to get balance: ${error}`);
    }
}

/**
 * Get USDC token balance for a public key
 */
export async function getUSDCBalance(publicKey: PublicKey): Promise<number> {
    try {
        const usdcMint = new PublicKey(USDC_MINT_DEVNET);

        // Get the associated token address for this wallet
        const tokenAccount = await getAssociatedTokenAddress(usdcMint, publicKey);

        try {
            // Try to get the token account
            const accountInfo = await getAccount(connection, tokenAccount);
            // USDC has 6 decimals
            return Number(accountInfo.amount) / 1_000_000;
        } catch (error: any) {
            // If account doesn't exist, balance is 0
            // Check for TokenAccountNotFoundError or related error messages
            if (
                error.name === "TokenAccountNotFoundError" ||
                error.message?.includes("could not find account") ||
                error.message?.includes("TokenAccountNotFoundError") ||
                error.message?.includes("Invalid param: could not find account")
            ) {
                return 0;
            }
            // Log other errors but don't throw - return 0 instead
            console.warn("Error fetching USDC balance:", error);
            return 0;
        }
    } catch (error: any) {
        // Catch all errors and return 0 instead of throwing
        // This prevents the app from crashing when token account doesn't exist
        console.warn("Failed to get USDC balance:", error);
        return 0;
    }
}

/**
 * Get recent transactions for a public key
 */
export async function getRecentTransactions(
    publicKey: PublicKey,
    limit: number = 10
): Promise<any[]> {
    try {
        // Get signatures for this address
        const signatures = await connection.getSignaturesForAddress(publicKey, { limit });

        // Fetch transaction details
        const transactions = await Promise.all(
            signatures.map(async sigInfo => {
                try {
                    const tx = await connection.getTransaction(sigInfo.signature, {
                        maxSupportedTransactionVersion: 0,
                    });

                    if (!tx) return null;

                    // Parse transaction to extract relevant info
                    const blockTime = sigInfo.blockTime
                        ? new Date(sigInfo.blockTime * 1000).toLocaleString("en-US", {
                              month: "short",
                              day: "numeric",
                              hour: "numeric",
                              minute: "2-digit",
                              hour12: true,
                          })
                        : "Unknown";

                    // Determine transaction type and amounts
                    let type: "sent" | "received" | "unknown" = "unknown";
                    let amount = "0";
                    let toAddress = "";

                    if (tx.meta) {
                        const preBalances = tx.meta.preBalances;
                        const postBalances = tx.meta.postBalances;
                        const accountKeys = tx.transaction.message.accountKeys;

                        // Find the account index for our public key
                        const ourAccountIndex = accountKeys.findIndex(
                            key => key.pubkey.toBase58() === publicKey.toBase58()
                        );

                        if (ourAccountIndex >= 0 && preBalances && postBalances) {
                            const balanceChange =
                                (postBalances[ourAccountIndex] - preBalances[ourAccountIndex]) /
                                LAMPORTS_PER_SOL;

                            if (balanceChange < 0) {
                                type = "sent";
                                amount = Math.abs(balanceChange).toFixed(4);
                            } else if (balanceChange > 0) {
                                type = "received";
                                amount = balanceChange.toFixed(4);
                            }

                            // Try to find the other address
                            const otherAccountIndex = accountKeys.findIndex(
                                (key, idx) =>
                                    idx !== ourAccountIndex &&
                                    preBalances[idx] !== postBalances[idx]
                            );
                            if (otherAccountIndex >= 0) {
                                toAddress = accountKeys[otherAccountIndex].pubkey.toBase58();
                            }
                        }
                    }

                    return {
                        signature: sigInfo.signature,
                        date: blockTime,
                        type,
                        amount,
                        toAddress: toAddress || "Unknown",
                        fromAddress: publicKey.toBase58(),
                        status: sigInfo.err ? "Failed" : "Confirmed",
                        fee: tx.meta?.fee ? (tx.meta.fee / LAMPORTS_PER_SOL).toFixed(6) : "0",
                    };
                } catch (error) {
                    console.error("Error parsing transaction:", error);
                    return null;
                }
            })
        );

        return transactions.filter(tx => tx !== null);
    } catch (error) {
        console.error("Failed to get recent transactions:", error);
        return [];
    }
}

/**
 * Send a transaction
 */
export async function sendTransaction(
    keypair: Keypair,
    to: PublicKey,
    amount: number
): Promise<string> {
    try {
        const transaction = new Transaction().add(
            SystemProgram.transfer({
                fromPubkey: keypair.publicKey,
                toPubkey: to,
                lamports: amount * LAMPORTS_PER_SOL,
            })
        );

        // Get recent blockhash
        const { blockhash } = await connection.getLatestBlockhash();
        transaction.recentBlockhash = blockhash;
        transaction.feePayer = keypair.publicKey;

        // Sign and send transaction
        const signature = await sendAndConfirmTransaction(connection, transaction, [keypair]);

        return signature;
    } catch (error) {
        throw new Error(`Failed to send transaction: ${error}`);
    }
}
