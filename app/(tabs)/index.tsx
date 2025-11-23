import { Text, View, Pressable, ScrollView } from "react-native";
import { useRouter } from "expo-router";

export default function HomeScreen() {
    const router = useRouter();

    return (
        <View className="flex-1 bg-background">
            <View className="flex-row items-center justify-between p-4 border-b border-border">
                <Text className="text-xl font-bold text-foreground">Account 1</Text>
                <Pressable onPress={() => router.push("/settings")}>
                    <Text className="text-foreground text-xl">⚙️</Text>
                </Pressable>
            </View>

            <ScrollView className="flex-1 pb-24">
                <View className="p-4 gap-6">
                    <View className="p-6 bg-card rounded-lg border border-border">
                        <View className="gap-2">
                            <Text className="text-sm text-muted-foreground">Total Balance</Text>
                            <Text className="text-5xl font-bold text-foreground">$0.00</Text>
                        </View>
                    </View>

                    <View className="flex-row gap-3">
                        <Pressable className="flex-1 items-center gap-2 p-4 rounded-xl bg-secondary">
                            <View className="bg-primary rounded-full p-3">
                                <Text className="text-primary-foreground font-bold text-base">$</Text>
                            </View>
                            <Text className="text-xs font-medium text-foreground">Buy</Text>
                        </Pressable>

                        <Pressable className="flex-1 items-center gap-2 p-4 rounded-xl bg-secondary">
                            <View className="bg-primary rounded-full p-3">
                                <Text className="text-primary-foreground font-bold text-base">⟳</Text>
                            </View>
                            <Text className="text-xs font-medium text-foreground">Convert</Text>
                        </Pressable>

                        <Pressable
                            className="flex-1 items-center gap-2 p-4 rounded-xl bg-secondary"
                            onPress={() => router.push("/send")}
                        >
                            <View className="bg-primary rounded-full p-3">
                                <Text className="text-primary-foreground font-bold text-base">↗</Text>
                            </View>
                            <Text className="text-xs font-medium text-foreground">Send</Text>
                        </Pressable>

                        <Pressable
                            className="flex-1 items-center gap-2 p-4 rounded-xl bg-secondary"
                            onPress={() => router.push("/receive")}
                        >
                            <View className="bg-primary rounded-full p-3">
                                <Text className="text-primary-foreground font-bold text-base">↙</Text>
                            </View>
                            <Text className="text-xs font-medium text-foreground">Receive</Text>
                        </Pressable>
                    </View>

                    <View className="gap-4">
                        <Text className="text-lg font-semibold text-foreground">Tokens</Text>

                        <View className="p-4 bg-card rounded-lg border border-border">
                            <View className="flex-row items-center justify-between">
                                <View className="flex-row items-center gap-3">
                                    <View className="w-10 h-10 rounded-full bg-primary/10 items-center justify-center">
                                        <Text className="text-sm font-bold text-primary">$</Text>
                                    </View>
                                    <View>
                                        <Text className="font-semibold text-foreground">USDC</Text>
                                        <Text className="text-sm text-muted-foreground">USD Coin</Text>
                                    </View>
                                </View>
                                <View className="items-end">
                                    <Text className="font-semibold text-foreground">$500</Text>
                                    <Text className="text-sm text-muted-foreground">500 USDC</Text>
                                </View>
                            </View>
                        </View>

                        <View className="p-4 bg-card rounded-lg border border-border">
                            <View className="flex-row items-center justify-between">
                                <View className="flex-row items-center gap-3">
                                    <View className="w-10 h-10 rounded-full bg-success/10 items-center justify-center">
                                        <Text className="text-sm font-bold text-success">T</Text>
                                    </View>
                                    <View>
                                        <Text className="font-semibold text-foreground">USDT</Text>
                                        <Text className="text-sm text-muted-foreground">Tether</Text>
                                    </View>
                                </View>
                                <View className="items-end">
                                    <Text className="font-semibold text-foreground">$700</Text>
                                    <Text className="text-sm text-muted-foreground">700 USDT</Text>
                                </View>
                            </View>
                        </View>

                        <View className="pt-2">
                            <Text className="text-sm text-muted-foreground">Fiat</Text>
                        </View>
                    </View>
                </View>
            </ScrollView>
        </View>
    );
}
