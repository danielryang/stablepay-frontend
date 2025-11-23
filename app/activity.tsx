import { Text, View, Pressable, ScrollView } from "react-native";
import { useRouter } from "expo-router";

const transactions = [
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
        initialConverted: "45,602 ARS",
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
        initialConverted: "114,002 ARS",
        finalTotal: "114,002 ARS",
    },
];

export default function ActivityScreen() {
    const router = useRouter();

    return (
        <View className="flex-1 bg-background">
            <View className="flex-row items-center p-4 border-b border-border">
                <Pressable onPress={() => router.back()} className="mr-2">
                    <Text className="text-foreground text-xl">←</Text>
                </Pressable>
                <Text className="text-xl font-bold text-foreground">Transaction History</Text>
            </View>

            <ScrollView className="flex-1 p-4">
                <View className="gap-4">
                    <Text className="text-lg font-semibold text-foreground">Account 1</Text>
                    <Text className="text-sm text-muted-foreground">Transactions</Text>

                    <View className="gap-3">
                        {transactions.map((tx) => (
                            <View
                                key={tx.id}
                                className="p-4 bg-card rounded-lg border border-border"
                            >
                                <View className="flex-row items-start justify-between mb-3">
                                    <View className="flex-row items-start gap-3">
                                        <View className="bg-primary/10 rounded-full p-2 mt-1">
                                            <Text className="text-primary font-bold text-sm">↗</Text>
                                        </View>
                                        <View className="gap-1">
                                            <Text className="text-sm font-medium text-foreground">
                                                {tx.date}
                                            </Text>
                                            <Text className="text-xs text-success">{tx.status}</Text>
                                        </View>
                                    </View>
                                    <View className="items-end">
                                        <Text className="text-sm font-semibold text-foreground">
                                            -{tx.fromAmount} {tx.fromToken}
                                        </Text>
                                        <Text className="text-sm text-muted-foreground">
                                            +{tx.toAmount} {tx.toToken}
                                        </Text>
                                    </View>
                                </View>

                                <View className="gap-2 border-t border-border pt-3">
                                    <View className="flex-row items-center gap-2">
                                        <Text className="text-xs text-muted-foreground font-mono flex-shrink">
                                            {tx.fromAddress}
                                        </Text>
                                        <Text className="text-xs text-muted-foreground">→</Text>
                                        <Text className="text-xs text-muted-foreground font-mono flex-shrink">
                                            {tx.toAddress}
                                        </Text>
                                    </View>
                                </View>

                                <View className="mt-3 gap-2 border-t border-border pt-3">
                                    <View className="flex-row justify-between">
                                        <Text className="text-xs text-muted-foreground">
                                            Transaction Fee:
                                        </Text>
                                        <Text className="text-xs font-medium text-foreground">
                                            {tx.transactionFee}
                                        </Text>
                                    </View>
                                    <View className="flex-row justify-between">
                                        <Text className="text-xs text-muted-foreground">Speed:</Text>
                                        <Text className="text-xs font-medium text-foreground">
                                            {tx.speed}
                                        </Text>
                                    </View>
                                    <View className="flex-row justify-between">
                                        <Text className="text-xs text-muted-foreground">
                                            Total Fees Saved:
                                        </Text>
                                        <Text className="text-xs font-medium text-success">
                                            {tx.feesSaved}
                                        </Text>
                                    </View>
                                    <View className="flex-row justify-between">
                                        <Text className="text-xs text-muted-foreground">
                                            Initial Converted:
                                        </Text>
                                        <Text className="text-xs font-medium text-foreground">
                                            {tx.initialConverted}
                                        </Text>
                                    </View>
                                    <View className="flex-row justify-between">
                                        <Text className="text-xs font-semibold text-foreground">
                                            Final Total:
                                        </Text>
                                        <Text className="text-xs font-semibold text-foreground">
                                            {tx.finalTotal}
                                        </Text>
                                    </View>
                                </View>
                            </View>
                        ))}
                    </View>
                </View>
            </ScrollView>
        </View>
    );
}
