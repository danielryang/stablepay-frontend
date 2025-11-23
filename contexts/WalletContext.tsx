import { Keypair, PublicKey } from "@solana/web3.js";

import React, {
    ReactNode,
    createContext,
    useCallback,
    useContext,
    useEffect,
    useState,
} from "react";

import {
    clearWallet,
    connection,
    deriveKeypairFromMnemonic,
    generateMnemonic,
    getBalance,
    getPublicKey,
    getUSDCBalance,
    loadEncryptedWallet,
    sendTransaction,
    signMessage,
    signTransaction,
    storeEncryptedWallet,
    validateMnemonic,
    walletExists,
} from "@/utils/wallet";

export interface WalletContextType {
    // Wallet state
    keypair: Keypair | null;
    publicKey: PublicKey | null;
    publicKeyString: string | null;
    balance: number | null;
    isInitialized: boolean;
    isLoading: boolean;
    hasWallet: boolean;

    // Wallet operations
    generateMnemonic: () => string;
    createWallet: (mnemonic: string, password: string) => Promise<void>;
    restoreWallet: (mnemonic: string, password: string) => Promise<void>;
    login: (password: string) => Promise<void>;
    logout: () => Promise<void>;
    switchAccount: () => Promise<void>;
    refreshBalance: () => Promise<void>;

    // Wallet API
    getPublicKey: () => PublicKey | null;
    signMessage: (message: Uint8Array) => Uint8Array | null;
    signTransaction: (transaction: any) => any | null;
    getBalance: () => Promise<number | null>;
    sendTransaction: (to: PublicKey, amount: number) => Promise<string | null>;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function WalletProvider({ children }: { children: ReactNode }) {
    const [keypair, setKeypair] = useState<Keypair | null>(null);
    const [publicKey, setPublicKey] = useState<PublicKey | null>(null);
    const [publicKeyString, setPublicKeyString] = useState<string | null>(null);
    const [balance, setBalance] = useState<number | null>(null);
    const [isInitialized, setIsInitialized] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [hasWallet, setHasWallet] = useState(false);

    // Check if wallet exists on mount
    useEffect(() => {
        checkWalletExists();
    }, []);

    const refreshBalance = useCallback(async (): Promise<void> => {
        if (!publicKey) {
            setBalance(null);
            return;
        }

        try {
            // Fetch USDC balance instead of SOL
            const bal = await getUSDCBalance(publicKey);
            setBalance(bal);
        } catch (error) {
            console.error("Failed to refresh USDC balance:", error);
            // Set to 0 if there's an error (likely no token account exists)
            setBalance(0);
        }
    }, [publicKey]);

    // Refresh balance when wallet is loaded (defer to avoid blocking)
    useEffect(() => {
        if (keypair && publicKey) {
            // Defer balance refresh to avoid blocking navigation
            // Set initial balance to 0 immediately for instant UI feedback
            setBalance(0);

            // Refresh balance in background after a short delay
            setTimeout(() => {
                refreshBalance();
            }, 100);

            // Set up periodic balance refresh (every 10 seconds)
            const interval = setInterval(() => {
                refreshBalance();
            }, 10000);
            return () => clearInterval(interval);
        }
    }, [keypair, publicKey, refreshBalance]);

    const checkWalletExists = async () => {
        try {
            const exists = await walletExists();
            setHasWallet(exists);
            setIsInitialized(true);
            setIsLoading(false);
        } catch (error) {
            console.error("Error checking wallet:", error);
            setHasWallet(false);
            setIsInitialized(true);
            setIsLoading(false);
        }
    };

    const generateMnemonicAPI = useCallback((): string => {
        return generateMnemonic();
    }, []);

    const createWallet = useCallback(async (mnemonic: string, password: string): Promise<void> => {
        try {
            // Validate mnemonic
            if (!validateMnemonic(mnemonic)) {
                throw new Error("Invalid mnemonic phrase");
            }

            // Derive keypair from mnemonic
            const newKeypair = await deriveKeypairFromMnemonic(mnemonic);

            // Store encrypted wallet (encrypts both private key and mnemonic)
            await storeEncryptedWallet(newKeypair, mnemonic, password);
            setHasWallet(true);

            // Set wallet state
            setKeypair(newKeypair);
            const pubKey = getPublicKey(newKeypair);
            setPublicKey(pubKey);
            setPublicKeyString(pubKey.toBase58());
        } catch (error) {
            throw new Error(`Failed to create wallet: ${error}`);
        }
    }, []);

    const restoreWallet = useCallback(async (mnemonic: string, password: string): Promise<void> => {
        try {
            // Validate mnemonic
            if (!validateMnemonic(mnemonic)) {
                throw new Error("Invalid mnemonic phrase");
            }

            // Derive keypair from mnemonic
            const restoredKeypair = await deriveKeypairFromMnemonic(mnemonic);

            // Store encrypted wallet (encrypts both private key and mnemonic)
            await storeEncryptedWallet(restoredKeypair, mnemonic, password);
            setHasWallet(true);

            // Set wallet state
            setKeypair(restoredKeypair);
            const pubKey = getPublicKey(restoredKeypair);
            setPublicKey(pubKey);
            setPublicKeyString(pubKey.toBase58());
        } catch (error) {
            throw new Error(`Failed to restore wallet: ${error}`);
        }
    }, []);

    const login = useCallback(async (password: string): Promise<void> => {
        try {
            setIsLoading(true);

            // Load encrypted wallet (returns Keypair directly)
            const loadedKeypair = await loadEncryptedWallet(password);

            // Set wallet state
            setKeypair(loadedKeypair);
            const pubKey = getPublicKey(loadedKeypair);
            setPublicKey(pubKey);
            setPublicKeyString(pubKey.toBase58());

            setIsLoading(false);
        } catch (error) {
            setIsLoading(false);
            throw error;
        }
    }, []);

    const logout = useCallback(async (): Promise<void> => {
        try {
            // Clear wallet state from memory (but keep encrypted wallet in storage)
            // This allows user to unlock again with password
            setKeypair(null);
            setPublicKey(null);
            setPublicKeyString(null);
            setBalance(null);
            // Note: We keep hasWallet=true because encrypted wallet still exists
            // User can unlock again with password
        } catch (error) {
            throw new Error(`Failed to logout: ${error}`);
        }
    }, []);

    const switchAccount = useCallback(async (): Promise<void> => {
        try {
            // Completely clear wallet from storage and memory
            // This allows user to create/restore a new wallet
            await clearWallet();
            setHasWallet(false);
            setKeypair(null);
            setPublicKey(null);
            setPublicKeyString(null);
            setBalance(null);
        } catch (error) {
            throw new Error(`Failed to switch account: ${error}`);
        }
    }, []);

    // Wallet API methods
    const getPublicKeyAPI = useCallback((): PublicKey | null => {
        return publicKey;
    }, [publicKey]);

    const signMessageAPI = useCallback(
        (message: Uint8Array): Uint8Array | null => {
            if (!keypair) return null;
            return signMessage(message, keypair);
        },
        [keypair]
    );

    const signTransactionAPI = useCallback(
        (transaction: any): any | null => {
            if (!keypair) return null;
            return signTransaction(transaction, keypair);
        },
        [keypair]
    );

    const getBalanceAPI = useCallback(async (): Promise<number | null> => {
        if (!publicKey) return null;
        try {
            return await getBalance(publicKey);
        } catch (error) {
            console.error("Failed to get balance:", error);
            return null;
        }
    }, [publicKey]);

    const sendTransactionAPI = useCallback(
        async (to: PublicKey, amount: number): Promise<string | null> => {
            if (!keypair) return null;
            try {
                return await sendTransaction(keypair, to, amount);
            } catch (error) {
                console.error("Failed to send transaction:", error);
                throw error;
            }
        },
        [keypair]
    );

    const value: WalletContextType = {
        keypair,
        publicKey,
        publicKeyString,
        balance,
        isInitialized,
        isLoading,
        hasWallet,
        generateMnemonic: generateMnemonicAPI,
        createWallet,
        restoreWallet,
        login,
        logout,
        switchAccount,
        refreshBalance,
        getPublicKey: getPublicKeyAPI,
        signMessage: signMessageAPI,
        signTransaction: signTransactionAPI,
        getBalance: getBalanceAPI,
        sendTransaction: sendTransactionAPI,
    };

    return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}

export function useWallet() {
    const context = useContext(WalletContext);
    if (context === undefined) {
        throw new Error("useWallet must be used within a WalletProvider");
    }
    return context;
}
