import React, { createContext, useContext, useState, ReactNode } from "react";

export interface Transaction {
    id: number;
    date: string;
    fromAddress: string;
    toAddress: string;
    fromAmount: string;
    fromToken: string;
    toAmount: string;
    toToken: string;
    type: "sent" | "received";
    status: string;
    transactionFee: string;
    speed: string;
    feesSaved: string;
    finalTotal: string;
}

interface TransactionContextType {
    transactions: Transaction[];
    addTransaction: (transaction: Omit<Transaction, "id">) => void;
}

const TransactionContext = createContext<TransactionContextType | undefined>(undefined);

export function TransactionProvider({ children }: { children: ReactNode }) {
    const [transactions, setTransactions] = useState<Transaction[]>([
        {
            id: 1,
            date: "Oct 22 at 3:45pm",
            fromAddress: "0x7a8f2...9b234",
            toAddress: "0x1a3f1...3x923",
            fromAmount: "40.00",
            fromToken: "USDC",
            toAmount: "45,600",
            toToken: "ARS",
            type: "sent",
            status: "Confirmed",
            transactionFee: "2 ARS",
            speed: "2s",
            feesSaved: "3.50 ARS",
            finalTotal: "45,602 ARS",
        },
        {
            id: 2,
            date: "Oct 21 at 2:30pm",
            fromAddress: "0x9c2e4...5d678",
            toAddress: "0x4b6f8...1a456",
            fromAmount: "100.00",
            fromToken: "USDC",
            toAmount: "114,000",
            toToken: "ARS",
            type: "sent",
            status: "Confirmed",
            transactionFee: "2 ARS",
            speed: "2s",
            feesSaved: "4.20 ARS",
            finalTotal: "114,002 ARS",
        },
    ]);

    const addTransaction = (transaction: Omit<Transaction, "id">) => {
        const newTransaction = {
            ...transaction,
            id: transactions.length > 0 ? Math.max(...transactions.map(t => t.id)) + 1 : 1,
        };
        setTransactions(prev => [newTransaction, ...prev]);
    };

    return (
        <TransactionContext.Provider value={{ transactions, addTransaction }}>
            {children}
        </TransactionContext.Provider>
    );
}

export function useTransactions() {
    const context = useContext(TransactionContext);
    if (context === undefined) {
        throw new Error("useTransactions must be used within a TransactionProvider");
    }
    return context;
}
