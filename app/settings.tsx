import React, { useState } from "react";
import {
    Alert,
    Image,
    Pressable,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    View,
} from "react-native";

import { useRouter } from "expo-router";

import FontAwesome from "@expo/vector-icons/FontAwesome";

import { useColorScheme } from "@/components/useColorScheme";
import Colors from "@/constants/Colors";
import { useOptimizerSettings } from "@/contexts/OptimizerSettingsContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useWallet } from "@/contexts/WalletContext";

export default function SettingsScreen() {
    const router = useRouter();
    const { logout } = useWallet();
    const { settings, updateSettings } = useOptimizerSettings();
    const { theme, setTheme } = useTheme();
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme];
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

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <View
                style={[
                    styles.header,
                    { backgroundColor: colors.background },
                ]}
            >
                <View style={styles.headerLeft}>
                    <Pressable onPress={() => router.back()} style={styles.backButton}>
                        <Text style={[styles.backText, { color: colors.text }]}>←</Text>
                    </Pressable>
                    <Image
                        source={require("@/assets/images/logo.png")}
                        style={styles.headerLogo}
                        resizeMode="contain"
                    />
                    <Text style={[styles.headerTitle, { color: colors.text }]}>Settings</Text>
                </View>
            </View>

            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                <View style={styles.content}>
                    <View style={styles.section}>
                        <View
                            style={[
                                styles.card,
                                {
                                    backgroundColor: colors.cardBackground,
                                },
                            ]}
                        >
                            <View style={styles.settingItem}>
                                <FontAwesome name="bell" size={22} color={colors.textSecondary} />
                                <View style={styles.settingContent}>
                                    <Text style={[styles.settingTitle, { color: colors.text }]}>
                                        Notifications
                                    </Text>
                                    <Text
                                        style={[
                                            styles.settingSubtitle,
                                            { color: colors.textSecondary },
                                        ]}
                                    >
                                        Push notifications
                                    </Text>
                                </View>
                                <Switch
                                    value={notificationsEnabled}
                                    onValueChange={setNotificationsEnabled}
                                    trackColor={{ false: colors.border, true: colors.primary }}
                                    thumbColor={colors.textInverse}
                                />
                            </View>

                            <View style={styles.divider} />

                            <Pressable style={styles.settingItem}>
                                <FontAwesome name="shield" size={22} color={colors.textSecondary} />
                                <View style={styles.settingContent}>
                                    <Text style={[styles.settingTitle, { color: colors.text }]}>
                                        Security
                                    </Text>
                                    <Text
                                        style={[
                                            styles.settingSubtitle,
                                            { color: colors.textSecondary },
                                        ]}
                                    >
                                        Password and biometric settings
                                    </Text>
                                </View>
                            </Pressable>

                            <View style={styles.divider} />

                            <Pressable style={styles.settingItem}>
                                <FontAwesome name="globe" size={22} color={colors.textSecondary} />
                                <View style={styles.settingContent}>
                                    <Text style={[styles.settingTitle, { color: colors.text }]}>
                                        Language & Region
                                    </Text>
                                    <Text
                                        style={[
                                            styles.settingSubtitle,
                                            { color: colors.textSecondary },
                                        ]}
                                    >
                                        Argentina
                                    </Text>
                                </View>
                            </Pressable>

                            <View style={styles.divider} />

                            <Pressable 
                                style={styles.settingItem}
                                onPress={() => {
                                    // TODO: Implement PayPal linking functionality
                                    console.log("Link PayPal pressed");
                                }}
                            >
                                <FontAwesome name="paypal" size={22} color={colors.textSecondary} />
                                <View style={styles.settingContent}>
                                    <Text style={[styles.settingTitle, { color: colors.text }]}>
                                        Link your PayPal
                                    </Text>
                                    <Text
                                        style={[
                                            styles.settingSubtitle,
                                            { color: colors.textSecondary },
                                        ]}
                                    >
                                        Connect your PayPal account
                                    </Text>
                                </View>
                            </Pressable>
                        </View>
                    </View>

                    {/* Optimizer Settings Section */}
                    <View style={styles.section}>
                        <View
                            style={[
                                styles.card,
                                {
                                    backgroundColor: colors.cardBackground,
                                },
                            ]}
                        >
                            <View style={styles.sectionHeader}>
                                <View style={styles.sectionHeaderRow}>
                                    <FontAwesome
                                        name="bar-chart"
                                        size={20}
                                        color={colors.text}
                                        style={{ marginRight: 8 }}
                                    />
                                    <Text
                                        style={[styles.sectionHeaderText, { color: colors.text }]}
                                    >
                                        Smart Allocation Optimizer
                                    </Text>
                                </View>
                            </View>

                            <View style={styles.divider} />

                            <View style={styles.settingItem}>
                                <FontAwesome name="usd" size={22} color={colors.textSecondary} />
                                <View style={styles.settingContent}>
                                    <Text style={[styles.settingTitle, { color: colors.text }]}>
                                        Minimum Monthly Expenses
                                    </Text>
                                    <Text
                                        style={[
                                            styles.settingSubtitle,
                                            { color: colors.textSecondary },
                                        ]}
                                    >
                                        Minimum spending threshold
                                    </Text>
                                </View>
                                <View
                                    style={[
                                        styles.inputContainer,
                                        { backgroundColor: colors.inputBackground },
                                    ]}
                                >
                                    <Text style={[styles.inputPrefix, { color: colors.text }]}>
                                        $
                                    </Text>
                                    <TextInput
                                        style={[styles.numberInput, { color: colors.text }]}
                                        value={minMonthlyExpenses}
                                        onChangeText={setMinMonthlyExpenses}
                                        keyboardType="numeric"
                                        placeholderTextColor={colors.inputPlaceholder}
                                        onBlur={() => {
                                            const value = parseInt(minMonthlyExpenses) || 800;
                                            updateSettings({ minimumMonthlyExpenses: value });
                                        }}
                                    />
                                </View>
                            </View>

                            <View style={styles.divider} />

                            <View style={styles.settingItem}>
                                <FontAwesome
                                    name="line-chart"
                                    size={22}
                                    color={colors.textSecondary}
                                />
                                <View style={styles.settingContent}>
                                    <Text style={[styles.settingTitle, { color: colors.text }]}>
                                        Spending Percentage
                                    </Text>
                                    <Text
                                        style={[
                                            styles.settingSubtitle,
                                            { color: colors.textSecondary },
                                        ]}
                                    >
                                        % of balance spent monthly
                                    </Text>
                                </View>
                                <View
                                    style={[
                                        styles.inputContainer,
                                        { backgroundColor: colors.inputBackground },
                                    ]}
                                >
                                    <TextInput
                                        style={[styles.numberInput, { color: colors.text }]}
                                        value={spendingPercent}
                                        onChangeText={setSpendingPercent}
                                        keyboardType="numeric"
                                        placeholderTextColor={colors.inputPlaceholder}
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
                                    <Text style={[styles.inputSuffix, { color: colors.text }]}>
                                        %
                                    </Text>
                                </View>
                            </View>
                        </View>
                    </View>

                    <View style={styles.section}>
                        <View
                            style={[
                                styles.card,
                                {
                                    backgroundColor: colors.cardBackground,
                                },
                            ]}
                        >
                            <View style={styles.settingItem}>
                                <View
                                    style={[
                                        styles.iconContainer,
                                        { backgroundColor: colors.primaryLight },
                                    ]}
                                >
                                    <FontAwesome
                                        name={theme === "dark" ? "moon-o" : "sun-o"}
                                        size={18}
                                        color={colors.primary}
                                    />
                                </View>
                                <View style={styles.settingContent}>
                                    <Text style={[styles.settingTitle, { color: colors.text }]}>
                                        Theme
                                    </Text>
                                    <Text
                                        style={[
                                            styles.settingSubtitle,
                                            { color: colors.textSecondary },
                                        ]}
                                    >
                                        {theme === "dark" ? "Dark mode" : "Light mode"}
                                    </Text>
                                </View>
                                <Switch
                                    value={theme === "dark"}
                                    onValueChange={value => setTheme(value ? "dark" : "light")}
                                    trackColor={{ false: colors.border, true: colors.primary }}
                                    thumbColor={
                                        theme === "dark" ? colors.textInverse : colors.textInverse
                                    }
                                />
                            </View>
                        </View>
                    </View>

                    <View style={styles.section}>
                        <View
                            style={[
                                styles.card,
                                {
                                    backgroundColor: colors.cardBackground,
                                },
                            ]}
                        >
                            <Pressable onPress={handleLogout} style={styles.settingItem}>
                                <FontAwesome name="lock" size={22} color={colors.error} />
                                <View style={styles.settingContent}>
                                    <Text style={[styles.destructiveText, { color: colors.error }]}>
                                        Lock Wallet
                                    </Text>
                                    <Text
                                        style={[
                                            styles.settingSubtitle,
                                            { color: colors.textSecondary },
                                        ]}
                                    >
                                        Lock your wallet and require password to unlock
                                    </Text>
                                </View>
                            </Pressable>
                        </View>
                    </View>

                    <View style={styles.versionContainer}>
                        <Text style={[styles.versionText, { color: colors.textSecondary }]}>
                            Version 1.0.0
                        </Text>
                    </View>
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: "row",
        alignItems: "flex-end",
        justifyContent: "space-between",
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 16,
    },
    headerLeft: {
        flexDirection: "row",
        alignItems: "center",
        gap: 14,
    },
    headerLogo: {
        width: 28,
        height: 28,
    },
    backButton: {
        marginRight: 0,
    },
    backText: {
        fontSize: 26,
    },
    headerTitle: {
        fontSize: 26,
        fontWeight: "bold",
        letterSpacing: -0.3,
    },
    scrollView: {
        flex: 1,
    },
    content: {
        padding: 20,
        gap: 20,
    },
    section: {
        gap: 0,
    },
    card: {
        borderRadius: 18,
        overflow: "hidden",
    },
    settingItem: {
        flexDirection: "row",
        alignItems: "center",
        gap: 14,
        padding: 18,
    },
    settingIcon: {
        fontSize: 18,
    },
    iconContainer: {
        borderRadius: 999,
        padding: 8,
        width: 36,
        height: 36,
        alignItems: "center",
        justifyContent: "center",
    },
    iconText: {
        fontSize: 14,
    },
    sectionHeaderRow: {
        flexDirection: "row",
        alignItems: "center",
    },
    settingContent: {
        flex: 1,
    },
    settingTitle: {
        fontSize: 16,
        fontWeight: "500",
    },
    settingSubtitle: {
        fontSize: 14,
        marginTop: 2,
    },
    divider: {
        height: 1,
        marginLeft: 18,
        backgroundColor: "transparent",
    },
    destructiveIcon: {
        fontSize: 18,
    },
    destructiveText: {
        fontSize: 16,
        fontWeight: "500",
    },
    versionContainer: {
        alignItems: "center",
        paddingTop: 16,
    },
    versionText: {
        fontSize: 14,
    },
    sectionHeader: {
        padding: 16,
        paddingBottom: 8,
    },
    sectionHeaderText: {
        fontSize: 16,
        fontWeight: "600",
    },
    inputContainer: {
        flexDirection: "row",
        alignItems: "center",
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 10,
        minWidth: 80,
    },
    inputPrefix: {
        fontSize: 14,
        fontWeight: "500",
        marginRight: 4,
    },
    inputSuffix: {
        fontSize: 14,
        fontWeight: "500",
        marginLeft: 4,
    },
    numberInput: {
        fontSize: 14,
        fontWeight: "500",
        minWidth: 50,
        textAlign: "right",
    },
});
