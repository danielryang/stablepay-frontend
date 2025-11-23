import { Text, View, Pressable, ScrollView, Switch } from "react-native";
import { useRouter } from "expo-router";
import { useState } from "react";

export default function SettingsScreen() {
    const router = useRouter();
    const [notificationsEnabled, setNotificationsEnabled] = useState(false);

    return (
        <View className="flex-1 bg-background">
            <View className="flex-row items-center justify-between p-4 border-b border-border">
                <View className="flex-row items-center">
                    <Pressable onPress={() => router.back()} className="mr-2">
                        <Text className="text-foreground text-xl">←</Text>
                    </Pressable>
                    <Text className="text-xl font-bold text-foreground">Settings</Text>
                </View>
            </View>

            <ScrollView className="flex-1 p-4">
                <View className="gap-6">
                    <View className="bg-card rounded-lg border border-border overflow-hidden">
                        <Pressable className="flex-row items-center gap-3 p-4 border-b border-border">
                            <Text className="text-muted-foreground text-lg">👤</Text>
                            <View className="flex-1">
                                <Text className="font-medium text-foreground">Account</Text>
                                <Text className="text-sm text-muted-foreground">
                                    Manage your account settings
                                </Text>
                            </View>
                        </Pressable>

                        <View className="flex-row items-center gap-3 p-4 border-b border-border">
                            <Text className="text-muted-foreground text-lg">🔔</Text>
                            <View className="flex-1">
                                <Text className="font-medium text-foreground">Notifications</Text>
                                <Text className="text-sm text-muted-foreground">
                                    Push notifications
                                </Text>
                            </View>
                            <Switch
                                value={notificationsEnabled}
                                onValueChange={setNotificationsEnabled}
                            />
                        </View>

                        <Pressable className="flex-row items-center gap-3 p-4 border-b border-border">
                            <Text className="text-muted-foreground text-lg">🛡</Text>
                            <View className="flex-1">
                                <Text className="font-medium text-foreground">Security</Text>
                                <Text className="text-sm text-muted-foreground">
                                    Password and biometric settings
                                </Text>
                            </View>
                        </Pressable>

                        <Pressable className="flex-row items-center gap-3 p-4">
                            <Text className="text-muted-foreground text-lg">🌍</Text>
                            <View className="flex-1">
                                <Text className="font-medium text-foreground">
                                    Language & Region
                                </Text>
                                <Text className="text-sm text-muted-foreground">English (US)</Text>
                            </View>
                        </Pressable>
                    </View>

                    <View className="bg-card rounded-lg border border-border">
                        <View className="flex-row items-center justify-between p-4">
                            <View className="flex-row items-center gap-3">
                                <View className="bg-primary/10 rounded-full p-2">
                                    <Text className="text-sm text-primary">🌓</Text>
                                </View>
                                <View>
                                    <Text className="font-medium text-foreground">Theme</Text>
                                    <Text className="text-sm text-muted-foreground">
                                        Toggle dark/light mode
                                    </Text>
                                </View>
                            </View>
                        </View>
                    </View>

                    <View className="bg-card rounded-lg border border-border">
                        <Pressable
                            onPress={() => router.push("/login")}
                            className="flex-row items-center gap-3 p-4"
                        >
                            <Text className="text-destructive text-lg">🚪</Text>
                            <View className="flex-1">
                                <Text className="font-medium text-destructive">Sign Out</Text>
                            </View>
                        </Pressable>
                    </View>

                    <View className="items-center pt-4">
                        <Text className="text-sm text-muted-foreground">Version 1.0.0</Text>
                    </View>
                </View>
            </ScrollView>
        </View>
    );
}
