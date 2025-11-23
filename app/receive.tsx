import { Text, View, Pressable, ScrollView, Alert } from "react-native";
import { useRouter } from "expo-router";

export default function ReceiveScreen() {
    const router = useRouter();
    const walletAddress = "0x1234...5678";

    const handleCopy = () => {
        Alert.alert("Success", "Address copied to clipboard");
    };

    return (
        <View className="flex-1 bg-background">
            <View className="flex-row items-center p-4 border-b border-border">
                <Pressable onPress={() => router.back()} className="mr-2">
                    <Text className="text-foreground text-xl">←</Text>
                </Pressable>
                <Text className="text-xl font-bold text-foreground">Receive</Text>
            </View>

            <ScrollView className="flex-1 p-4">
                <View className="p-6 bg-card rounded-lg border border-border gap-6">
                    <View className="items-center gap-2">
                        <Text className="text-2xl font-bold text-foreground">Receive Crypto</Text>
                        <Text className="text-sm text-muted-foreground text-center">
                            Scan QR code or copy address below
                        </Text>
                    </View>

                    <View className="items-center">
                        <View className="w-64 h-64 bg-secondary rounded-2xl items-center justify-center border-2 border-border">
                            <View className="w-48 h-48 bg-white rounded-lg items-center justify-center">
                                <Text className="text-xs text-gray-500 text-center px-4">
                                    QR Code for Bitcoin Wallet
                                </Text>
                            </View>
                        </View>
                    </View>

                    <View className="gap-3">
                        <View className="p-4 bg-secondary rounded-lg">
                            <Text className="text-sm text-muted-foreground mb-2">
                                Your Wallet Address
                            </Text>
                            <Text className="text-sm text-foreground">{walletAddress}</Text>
                        </View>

                        <View className="flex-row gap-3">
                            <Pressable
                                onPress={handleCopy}
                                className="flex-1 flex-row items-center justify-center gap-2 p-3 border border-border rounded-md"
                            >
                                <Text className="text-foreground text-sm">📋</Text>
                                <Text className="text-foreground">Copy</Text>
                            </Pressable>
                            <Pressable className="flex-1 flex-row items-center justify-center gap-2 p-3 border border-border rounded-md">
                                <Text className="text-foreground text-sm">↗</Text>
                                <Text className="text-foreground">Share</Text>
                            </Pressable>
                        </View>
                    </View>
                </View>

                <View className="p-4 bg-card rounded-lg border border-border gap-2 mt-6">
                    <Text className="font-semibold text-foreground">Important Notes</Text>
                    <View className="gap-1">
                        <Text className="text-sm text-muted-foreground">
                            • Only send crypto to this address
                        </Text>
                        <Text className="text-sm text-muted-foreground">
                            • Sending other assets may result in permanent loss
                        </Text>
                        <Text className="text-sm text-muted-foreground">
                            • Ensure the network matches before sending
                        </Text>
                    </View>
                </View>
            </ScrollView>
        </View>
    );
}
