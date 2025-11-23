import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Switch, Text, View, Alert } from "react-native";
import { useWallet } from "@/contexts/WalletContext";

export default function SettingsScreen() {
    const router = useRouter();
    const { logout, publicKeyString } = useWallet();
    const [notificationsEnabled, setNotificationsEnabled] = useState(false);

    const handleLogout = () => {
        Alert.alert(
            "Sign Out",
            "Are you sure you want to sign out? You'll need to enter your password to access your wallet again.",
            [
                {
                    text: "Cancel",
                    style: "cancel",
                },
                {
                    text: "Sign Out",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            await logout();
                            router.replace("/login");
                        } catch (error: any) {
                            Alert.alert("Error", error.message || "Failed to sign out");
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
                                    <Text style={styles.settingSubtitle}>
                                        Push notifications
                                    </Text>
                                </View>
                                <Switch
                                    value={notificationsEnabled}
                                    onValueChange={setNotificationsEnabled}
                                    trackColor={{ false: '#E1E4E8', true: '#0891D1' }}
                                    thumbColor={notificationsEnabled ? '#FFFFFF' : '#FFFFFF'}
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
                                    <Text style={styles.settingTitle}>
                                        Language & Region
                                    </Text>
                                    <Text style={styles.settingSubtitle}>English (US)</Text>
                                </View>
                            </Pressable>
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
                            <Pressable
                                onPress={handleLogout}
                                style={styles.settingItem}
                            >
                                <Text style={styles.destructiveIcon}>🚪</Text>
                                <View style={styles.settingContent}>
                                    <Text style={styles.destructiveText}>Sign Out</Text>
                                    <Text style={styles.settingSubtitle}>
                                        Clear wallet from this device
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
        backgroundColor: '#FAFAFA',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#E1E4E8',
        backgroundColor: '#FFFFFF',
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'flex-end',
    },
    backButton: {
        marginRight: 8,
    },
    backText: {
        fontSize: 24,
        color: '#29343D',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#29343D',
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
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E1E4E8',
        overflow: 'hidden',
    },
    settingItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        padding: 16,
    },
    settingIcon: {
        fontSize: 18,
        color: '#737A82',
    },
    iconContainer: {
        backgroundColor: '#E0F2FE',
        borderRadius: 999,
        padding: 8,
        width: 36,
        height: 36,
        alignItems: 'center',
        justifyContent: 'center',
    },
    iconText: {
        fontSize: 14,
        color: '#0891D1',
    },
    settingContent: {
        flex: 1,
    },
    settingTitle: {
        fontSize: 16,
        fontWeight: '500',
        color: '#29343D',
    },
    settingSubtitle: {
        fontSize: 14,
        color: '#737A82',
        marginTop: 2,
    },
    divider: {
        height: 1,
        backgroundColor: '#E1E4E8',
        marginLeft: 16,
    },
    destructiveIcon: {
        fontSize: 18,
        color: '#EF4444',
    },
    destructiveText: {
        fontSize: 16,
        fontWeight: '500',
        color: '#EF4444',
    },
    versionContainer: {
        alignItems: 'center',
        paddingTop: 16,
    },
    versionText: {
        fontSize: 14,
        color: '#737A82',
    },
});
