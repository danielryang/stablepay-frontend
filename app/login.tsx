import { Text, View, Pressable, TextInput } from "react-native";
import { useRouter } from "expo-router";
import { useState } from "react";

export default function LoginScreen() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const handleLogin = () => {
        router.push("/(tabs)");
    };

    return (
        <View className="flex-1 bg-background items-center justify-center p-4">
            <View className="w-full max-w-md gap-8">
                <View className="items-center gap-2">
                    <View className="bg-primary rounded-full p-4">
                        <Text className="text-primary-foreground text-3xl">💼</Text>
                    </View>
                    <Text className="text-3xl font-bold text-foreground">CryptoWallet</Text>
                    <Text className="text-muted-foreground">Sign in to your account</Text>
                </View>

                <View className="p-6 bg-card rounded-lg border border-border gap-4">
                    <View className="gap-2">
                        <Text className="text-sm font-medium text-foreground">Email</Text>
                        <TextInput
                            value={email}
                            onChangeText={setEmail}
                            placeholder="you@example.com"
                            keyboardType="email-address"
                            autoCapitalize="none"
                            className="bg-input border border-border rounded-md p-3 text-foreground"
                            placeholderTextColor="#737A82"
                        />
                    </View>
                    <View className="gap-2">
                        <Text className="text-sm font-medium text-foreground">Password</Text>
                        <TextInput
                            value={password}
                            onChangeText={setPassword}
                            placeholder="••••••••"
                            secureTextEntry
                            className="bg-input border border-border rounded-md p-3 text-foreground"
                            placeholderTextColor="#737A82"
                        />
                    </View>
                    <Pressable
                        onPress={handleLogin}
                        className="w-full bg-primary rounded-md p-3 items-center"
                    >
                        <Text className="text-primary-foreground font-medium">Sign In</Text>
                    </Pressable>
                </View>

                <View className="items-center">
                    <Text className="text-sm text-muted-foreground">
                        Don't have an account?{" "}
                        <Text className="text-primary">Sign up</Text>
                    </Text>
                </View>
            </View>
        </View>
    );
}
