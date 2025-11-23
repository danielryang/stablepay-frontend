/**
 * Utility functions for calculating transaction metrics
 */

import { Transaction } from "@/contexts/TransactionContext";

/**
 * Calculate monthly transaction frequency from transaction history
 * Returns average number of transactions per month
 */
export function calculateMonthlyTransactionFrequency(transactions: Transaction[]): number {
    if (transactions.length === 0) {
        return 15; // Default fallback
    }

    // Parse dates and group by month
    const now = new Date();
    const transactionsByMonth: { [key: string]: number } = {};
    
    transactions.forEach(tx => {
        // Parse date string like "Oct 22 at 3:45pm"
        // This is a simplified parser - adjust based on actual date format
        const dateStr = tx.date;
        const monthMatch = dateStr.match(/(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)/);
        
        if (monthMatch) {
            const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            const monthIndex = monthNames.indexOf(monthMatch[1]);
            const currentYear = now.getFullYear();
            const monthKey = `${currentYear}-${monthIndex}`;
            
            transactionsByMonth[monthKey] = (transactionsByMonth[monthKey] || 0) + 1;
        }
    });

    // Calculate average transactions per month
    const months = Object.keys(transactionsByMonth);
    if (months.length === 0) {
        return 15; // Default fallback
    }

    const totalTransactions = Object.values(transactionsByMonth).reduce((sum, count) => sum + count, 0);
    const avgPerMonth = totalTransactions / months.length;
    
    // Round to nearest integer, minimum 1
    return Math.max(1, Math.round(avgPerMonth));
}

/**
 * Get transactions from the last N days
 */
export function getRecentTransactions(transactions: Transaction[], days: number = 30): Transaction[] {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    return transactions.filter(tx => {
        // Simplified - assumes transactions are recent if they exist
        // In production, parse actual dates
        return true; // For now, return all transactions
    });
}

