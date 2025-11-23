import { Text, View, Pressable, ScrollView, TextInput } from "react-native";
import { useRouter } from "expo-router";
import { useState } from "react";

export default function SendScreen() {
    const router = useRouter();
    const [amount, setAmount] = useState("40");
    const [fromAccount, setFromAccount] = useState("Account X");
    const [toAccount, setToAccount] = useState("Account Y");
    const [fromCurrency, setFromCurrency] = useState("USDC");
    const [toCurrency, setToCurrency] = useState("ARS");
    const [fromAddress, setFromAddress] = useState("0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1");
    const [toAddress, setToAddress] = useState("0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063");
    const exchangeRate = 1050;
    const arsTotal = (parseFloat(amount) || 0) * exchangeRate;

    return (
        <View className="flex-1 bg-background">
            <View className="flex-row items-center p-4 border-b border-border">
                <Pressable onPress={() => router.back()} className="mr-2">
                    <Text className="text-foreground text-xl">←</Text>
                </Pressable>
                <Text className="text-xl font-bold text-foreground">Sending Page</Text>
            </View>

            <ScrollView className="flex-1">
                <View className="p-4 gap-6">
                    <View className="p-6 bg-card rounded-lg border border-border gap-6">
                        <View className="gap-4">
                            <View className="gap-2">
                                <Text className="text-xs text-muted-foreground">From Wallet Address</Text>
                                <TextInput
                                    value={fromAddress}
                                    onChangeText={setFromAddress}
                                    className="text-xs text-foreground bg-input border border-border rounded-md p-2"
                                />
                            </View>
                            <View className="gap-2">
                                <Text className="text-xs text-muted-foreground">To Wallet Address</Text>
                                <TextInput
                                    value={toAddress}
                                    onChangeText={setToAddress}
                                    className="text-xs text-foreground bg-input border border-border rounded-md p-2"
                                />
                            </View>
                        </View>

                        <View className="border-t border-border pt-6">
                            <View className="flex-row items-center justify-between">
                                <View className="flex-1 gap-2">
                                    <Text className="text-sm text-muted-foreground">From</Text>
                                    <TextInput
                                        value={fromAccount}
                                        onChangeText={setFromAccount}
                                        className="font-semibold text-foreground bg-input border border-border rounded-md p-2"
                                    />
                                    <TextInput
                                        value={fromCurrency}
                                        onChangeText={setFromCurrency}
                                        className="text-sm text-foreground bg-input border border-border rounded-md p-2"
                                    />
                                </View>

                                <Text className="text-muted-foreground mx-4 text-xl">→</Text>

                                <View className="flex-1 gap-2 items-end">
                                    <Text className="text-sm text-muted-foreground">To</Text>
                                    <TextInput
                                        value={toAccount}
                                        onChangeText={setToAccount}
                                        className="font-semibold text-foreground bg-input border border-border rounded-md p-2 w-full text-right"
                                    />
                                    <TextInput
                                        value={toCurrency}
                                        onChangeText={setToCurrency}
                                        className="text-sm text-foreground bg-input border border-border rounded-md p-2 w-full text-right"
                                    />
                                </View>
                            </View>
                        </View>

                        <View className="border-t border-border pt-6">
                            <View className="items-center gap-3">
                                <Text className="text-sm text-muted-foreground">Amount</Text>
                                <View className="flex-row items-center gap-3">
                                    <View className="flex-row items-baseline gap-2">
                                        <Text className="text-xl text-foreground">$</Text>
                                        <TextInput
                                            value={amount}
                                            onChangeText={setAmount}
                                            keyboardType="numeric"
                                            className="text-3xl font-bold text-foreground w-24 text-center"
                                        />
                                        <Text className="text-xl text-muted-foreground">{fromCurrency}</Text>
                                    </View>
                                    <Text className="text-xl text-muted-foreground">=</Text>
                                    <View className="flex-row items-baseline gap-2">
                                        <Text className="text-3xl font-bold text-foreground">${arsTotal.toFixed(2)}</Text>
                                        <Text className="text-xl text-muted-foreground">{toCurrency}</Text>
                                    </View>
                                </View>
                            </View>
                        </View>

                        <View className="border-t border-border pt-6 gap-3">
                            <View className="flex-row justify-between">
                                <Text className="text-sm text-muted-foreground">Total Fees Saved:</Text>
                                <Text className="text-sm font-medium text-success">8.50 ARS</Text>
                            </View>
                            <View className="flex-row justify-between">
                                <Text className="text-sm text-muted-foreground">Transaction Fee:</Text>
                                <Text className="text-sm font-medium text-foreground">2 ARS</Text>
                            </View>
                            <View className="flex-row justify-between">
                                <Text className="text-sm text-muted-foreground">Speed:</Text>
                                <Text className="text-sm font-medium text-foreground">2s</Text>
                            </View>
                        </View>
                    </View>

                    <View className="flex-row gap-3 pt-4">
                        <Pressable
                            onPress={() => router.back()}
                            className="flex-1 h-12 border border-border rounded-lg items-center justify-center"
                        >
                            <Text className="text-foreground">Cancel</Text>
                        </Pressable>
                        <Pressable className="flex-1 h-12 bg-primary rounded-lg items-center justify-center">
                            <Text className="text-primary-foreground font-medium">Send</Text>
                        </Pressable>
                    </View>
                </View>
            </ScrollView>
        </View>
    );
}
