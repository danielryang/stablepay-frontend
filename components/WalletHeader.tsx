import { Image, Pressable, StyleSheet, Text, View } from "react-native";

import { useRouter } from "expo-router";

import FontAwesome from "@expo/vector-icons/FontAwesome";

import { useColorScheme } from "@/components/useColorScheme";
import Colors from "@/constants/Colors";
import { useWallet } from "@/contexts/WalletContext";

export function WalletHeader() {
    const router = useRouter();
    const { publicKeyString } = useWallet();
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme];

    const formatAddress = (address: string | null) => {
        if (!address) return "Not available";
        return `${address.slice(0, 4)}...${address.slice(-4)}`;
    };

    return (
        <View
            style={[
                styles.header,
                { backgroundColor: colors.background },
            ]}
        >
            <View style={styles.headerLeft}>
                <Image
                    source={require("@/assets/images/logo.png")}
                    style={styles.headerLogo}
                    resizeMode="contain"
                />
                <View style={styles.headerTextContainer}>
                    <Text style={[styles.headerTitle, { color: colors.text }]}>
                        Solana Wallet
                    </Text>
                    <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
                        {publicKeyString ? formatAddress(publicKeyString) : " "}
                    </Text>
                </View>
            </View>
            <Pressable 
                onPress={() => router.push("/settings")} 
                style={styles.settingsButton}
            >
                <FontAwesome
                    name="cog"
                    size={24}
                    color={colors.text}
                />
            </Pressable>
        </View>
    );
}

const styles = StyleSheet.create({
    header: {
        flexDirection: "row",
        alignItems: "flex-end",
        justifyContent: "space-between",
        paddingHorizontal: 20,
        paddingTop: 36,
        paddingBottom: 16,
        height: 92,
        width: "100%",
    },
    headerLeft: {
        flexDirection: "row",
        alignItems: "center",
        gap: 14,
        flex: 1,
    },
    headerLogo: {
        width: 36,
        height: 36,
    },
    headerTextContainer: {
        height: 40,
        justifyContent: "flex-end",
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: "bold",
        letterSpacing: -0.3,
        lineHeight: 26,
    },
    headerSubtitle: {
        fontSize: 13,
        marginTop: 3,
        fontFamily: "monospace",
        height: 16,
        lineHeight: 16,
    },
    settingsButton: {
        paddingLeft: 8,
        paddingRight: 0,
        paddingVertical: 4,
        marginRight: 0,
    },
});

