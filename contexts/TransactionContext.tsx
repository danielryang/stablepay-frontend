import React, { createContext, ReactNode, useContext, useState, useEffect, useCallback } from "react";
import { useWallet } from "./WalletContext";
import { getRecentTransactions } from "@/utils/wallet";

export interface Transaction {
    id: string;
    date: string;
    fromAddress: string;
    toAddress: string;
    fromAmount: string;
    fromToken: string;
    toAmount: string;
    toToken: string;
    type: "sent" | "received" | "converted" | "bought";
    status: string;
    transactionFee: string;
    speed: string;
    feesSaved: string;
    finalTotal: string;
    signature?: string;
}

interface TransactionContextType {
    transactions: Transaction[];
    isLoading: boolean;
    refreshTransactions: () => Promise<void>;
    addTransaction: (transaction: Omit<Transaction, "id">) => void;
}

const TransactionContext = createContext<TransactionContextType | undefined>(undefined);

// Internal component that uses WalletContext
function TransactionProviderInner({ children }: { children: ReactNode }) {
    const { publicKey } = useWallet();
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const refreshTransactions = useCallback(async () => {
        if (!publicKey) {
            setTransactions([]);
            return;
        }

        try {
            setIsLoading(true);
            const recentTxs = await getRecentTransactions(publicKey, 20);
            
            const formattedTransactions: Transaction[] = recentTxs.map((tx, index) => ({
                id: tx.signature || `tx-${index}`,
                date: tx.date,
                fromAddress: tx.fromAddress.length > 16 
                    ? tx.fromAddress.slice(0, 8) + '...' + tx.fromAddress.slice(-8)
                    : tx.fromAddress,
                toAddress: tx.toAddress.length > 16 
                    ? tx.toAddress.slice(0, 8) + '...' + tx.toAddress.slice(-8)
                    : tx.toAddress,
                fromAmount: tx.amount,
                fromToken: "USDC",
                toAmount: tx.amount,
                toToken: "USDC",
                type: tx.type === 'sent' ? 'sent' : tx.type === 'received' ? 'received' : 'sent',
                status: tx.status,
                transactionFee: `${tx.fee} SOL`,
                speed: "~1s",
                feesSaved: "0",
                finalTotal: tx.amount + " USDC",
                signature: tx.signature,
            }));
            
            setTransactions(formattedTransactions);
        } catch (error) {
            console.error('Failed to fetch transactions:', error);
            setTransactions([]);
        } finally {
            setIsLoading(false);
        }
    }, [publicKey]);

    // Refresh transactions when wallet is loaded
    useEffect(() => {
        if (publicKey) {
            refreshTransactions();
        } else {
            setTransactions([]);
        }
    }, [publicKey, refreshTransactions]);

    const addTransaction = (transaction: Omit<Transaction, "id">) => {
        const newTransaction = {
            ...transaction,
            id: `manual-${Date.now()}`,
        };
        setTransactions(prev => [newTransaction, ...prev]);
    };

    return (
        <TransactionContext.Provider value={{ transactions, isLoading, refreshTransactions, addTransaction }}>
            {children}
        </TransactionContext.Provider>
    );
}

// Export wrapper that requires WalletProvider
export function TransactionProvider({ children }: { children: ReactNode }) {
    return <TransactionProviderInner>{children}</TransactionProviderInner>;
}

export function useTransactions() {
    const context = useContext(TransactionContext);
    if (context === undefined) {
        throw new Error("useTransactions must be used within a TransactionProvider");
    }
    return context;
}
