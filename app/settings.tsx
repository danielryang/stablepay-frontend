import React, { useState } from "react";
import {
    Alert,
    Pressable,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    View,
} from "react-native";

import { useRouter } from "expo-router";

import { useOptimizerSettings } from "@/contexts/OptimizerSettingsContext";
import { useWallet } from "@/contexts/WalletContext";

export default function SettingsScreen() {
    const router = useRouter();
    const { logout, publicKeyString } = useWallet();
    const { settings, updateSettings } = useOptimizerSettings();
    const [notificationsEnabled, setNotificationsEnabled] = useState(false);

    // Local state for optimizer settings (for editing)
    const [minMonthlyExpenses, setMinMonthlyExpenses] = useState(
        settings.minimumMonthlyExpenses.toString()
    );
    const [spendingPercent, setSpendingPercent] = useState(
        (settings.spendingPercentage * 100).toString()
    );

    // Sync local state when settings change
    React.useEffect(() => {
        setMinMonthlyExpenses(settings.minimumMonthlyExpenses.toString());
        setSpendingPercent((settings.spendingPercentage * 100).toString());
    }, [settings]);

    const handleLogout = () => {
        Alert.alert(
            "Lock Wallet",
            "Your wallet will be locked. You'll need to enter your password to unlock it again.",
            [
                {
                    text: "Cancel",
                    style: "cancel",
                },
                {
                    text: "Lock",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            await logout();
                            router.replace("/login");
                        } catch (error: any) {
                            Alert.alert("Error", error.message || "Failed to lock wallet");
                        }
                    },
                },
            ]
        );
    };

    const formatAddress = (address: string | null) => {
        if (!address) return "Not available";
        return `${address.slice(0, 8)}...${address.slice(-8)}`;
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <Pressable onPress={() => router.back()} style={styles.backButton}>
                        <Text style={styles.backText}>←</Text>
                    </Pressable>
                    <Text style={styles.headerTitle}>Settings</Text>
                </View>
            </View>

            <ScrollView style={styles.scrollView}>
                <View style={styles.content}>
                    <View style={styles.section}>
                        <View style={styles.card}>
                            <View style={styles.settingItem}>
                                <Text style={styles.settingIcon}>👤</Text>
                                <View style={styles.settingContent}>
                                    <Text style={styles.settingTitle}>Wallet Address</Text>
                                    <Text style={styles.settingSubtitle}>
                                        {formatAddress(publicKeyString)}
                                    </Text>
                                </View>
                            </View>

                            <View style={styles.divider} />

                            <View style={styles.settingItem}>
                                <Text style={styles.settingIcon}>🔔</Text>
                                <View style={styles.settingContent}>
                                    <Text style={styles.settingTitle}>Notifications</Text>
                                    <Text style={styles.settingSubtitle}>Push notifications</Text>
                                </View>
                                <Switch
                                    value={notificationsEnabled}
                                    onValueChange={setNotificationsEnabled}
                                    trackColor={{ false: "#E1E4E8", true: "#0891D1" }}
                                    thumbColor={notificationsEnabled ? "#FFFFFF" : "#FFFFFF"}
                                />
                            </View>

                            <View style={styles.divider} />

                            <Pressable style={styles.settingItem}>
                                <Text style={styles.settingIcon}>🛡</Text>
                                <View style={styles.settingContent}>
                                    <Text style={styles.settingTitle}>Security</Text>
                                    <Text style={styles.settingSubtitle}>
                                        Password and biometric settings
                                    </Text>
                                </View>
                            </Pressable>

                            <View style={styles.divider} />

                            <Pressable style={styles.settingItem}>
                                <Text style={styles.settingIcon}>🌍</Text>
                                <View style={styles.settingContent}>
                                    <Text style={styles.settingTitle}>Language & Region</Text>
                                    <Text style={styles.settingSubtitle}>English (US)</Text>
                                </View>
                            </Pressable>
                        </View>
                    </View>

                    {/* Optimizer Settings Section */}
                    <View style={styles.section}>
                        <View style={styles.card}>
                            <View style={styles.sectionHeader}>
                                <Text style={styles.sectionHeaderText}>
                                    📊 Smart Allocation Optimizer
                                </Text>
                            </View>

                            <View style={styles.divider} />

                            <View style={styles.settingItem}>
                                <Text style={styles.settingIcon}>💰</Text>
                                <View style={styles.settingContent}>
                                    <Text style={styles.settingTitle}>
                                        Minimum Monthly Expenses
                                    </Text>
                                    <Text style={styles.settingSubtitle}>
                                        Minimum spending threshold (default: $800)
                                    </Text>
                                </View>
                                <View style={styles.inputContainer}>
                                    <Text style={styles.inputPrefix}>$</Text>
                                    <TextInput
                                        style={styles.numberInput}
                                        value={minMonthlyExpenses}
                                        onChangeText={setMinMonthlyExpenses}
                                        keyboardType="numeric"
                                        onBlur={() => {
                                            const value = parseInt(minMonthlyExpenses) || 800;
                                            updateSettings({ minimumMonthlyExpenses: value });
                                        }}
                                    />
                                </View>
                            </View>

                            <View style={styles.divider} />

                            <View style={styles.settingItem}>
                                <Text style={styles.settingIcon}>📈</Text>
                                <View style={styles.settingContent}>
                                    <Text style={styles.settingTitle}>Spending Percentage</Text>
                                    <Text style={styles.settingSubtitle}>
                                        % of balance spent monthly (default: 15%)
                                    </Text>
                                </View>
                                <View style={styles.inputContainer}>
                                    <TextInput
                                        style={styles.numberInput}
                                        value={spendingPercent}
                                        onChangeText={setSpendingPercent}
                                        keyboardType="numeric"
                                        onBlur={() => {
                                            const value = parseFloat(spendingPercent) || 15;
                                            const decimalValue = Math.max(
                                                0.01,
                                                Math.min(1, value / 100)
                                            );
                                            updateSettings({ spendingPercentage: decimalValue });
                                            setSpendingPercent(value.toString());
                                        }}
                                    />
                                    <Text style={styles.inputSuffix}>%</Text>
                                </View>
                            </View>
                        </View>
                    </View>

                    <View style={styles.section}>
                        <View style={styles.card}>
                            <View style={styles.settingItem}>
                                <View style={styles.iconContainer}>
                                    <Text style={styles.iconText}>🌓</Text>
                                </View>
                                <View style={styles.settingContent}>
                                    <Text style={styles.settingTitle}>Theme</Text>
                                    <Text style={styles.settingSubtitle}>
                                        Toggle dark/light mode
                                    </Text>
                                </View>
                            </View>
                        </View>
                    </View>

                    <View style={styles.section}>
                        <View style={styles.card}>
                            <Pressable onPress={handleLogout} style={styles.settingItem}>
                                <Text style={styles.destructiveIcon}>🚪</Text>
                                <View style={styles.settingContent}>
                                    <Text style={styles.destructiveText}>Lock Wallet</Text>
                                    <Text style={styles.settingSubtitle}>
                                        Lock your wallet and require password to unlock
                                    </Text>
                                </View>
                            </Pressable>
                        </View>
                    </View>

                    <View style={styles.versionContainer}>
                        <Text style={styles.versionText}>Version 1.0.0</Text>
                    </View>
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#FAFAFA",
    },
    header: {
        flexDirection: "row",
        alignItems: "flex-end",
        justifyContent: "space-between",
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: "#E1E4E8",
        backgroundColor: "#FFFFFF",
    },
    headerLeft: {
        flexDirection: "row",
        alignItems: "flex-end",
    },
    backButton: {
        marginRight: 8,
    },
    backText: {
        fontSize: 24,
        color: "#29343D",
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: "bold",
        color: "#29343D",
    },
    scrollView: {
        flex: 1,
    },
    content: {
        padding: 16,
        gap: 16,
    },
    section: {
        gap: 0,
    },
    card: {
        backgroundColor: "#FFFFFF",
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#E1E4E8",
        overflow: "hidden",
    },
    settingItem: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        padding: 16,
    },
    settingIcon: {
        fontSize: 18,
        color: "#737A82",
    },
    iconContainer: {
        backgroundColor: "#E0F2FE",
        borderRadius: 999,
        padding: 8,
        width: 36,
        height: 36,
        alignItems: "center",
        justifyContent: "center",
    },
    iconText: {
        fontSize: 14,
        color: "#0891D1",
    },
    settingContent: {
        flex: 1,
    },
    settingTitle: {
        fontSize: 16,
        fontWeight: "500",
        color: "#29343D",
    },
    settingSubtitle: {
        fontSize: 14,
        color: "#737A82",
        marginTop: 2,
    },
    divider: {
        height: 1,
        backgroundColor: "#E1E4E8",
        marginLeft: 16,
    },
    destructiveIcon: {
        fontSize: 18,
        color: "#EF4444",
    },
    destructiveText: {
        fontSize: 16,
        fontWeight: "500",
        color: "#EF4444",
    },
    versionContainer: {
        alignItems: "center",
        paddingTop: 16,
    },
    versionText: {
        fontSize: 14,
        color: "#737A82",
    },
    sectionHeader: {
        padding: 16,
        paddingBottom: 12,
    },
    sectionHeaderText: {
        fontSize: 16,
        fontWeight: "600",
        color: "#29343D",
    },
    inputContainer: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#F3F4F6",
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 8,
        minWidth: 80,
    },
    inputPrefix: {
        fontSize: 14,
        fontWeight: "500",
        color: "#29343D",
        marginRight: 4,
    },
    inputSuffix: {
        fontSize: 14,
        fontWeight: "500",
        color: "#29343D",
        marginLeft: 4,
    },
    numberInput: {
        fontSize: 14,
        fontWeight: "500",
        color: "#29343D",
        minWidth: 50,
        textAlign: "right",
    },
});
