import {
    ActivityIndicator,
    Alert,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";
import QRCode from "react-native-qrcode-svg";

import * as Clipboard from "expo-clipboard";
import { useRouter } from "expo-router";

import { useColorScheme } from "@/components/useColorScheme";
import Colors from "@/constants/Colors";
import { useWallet } from "@/contexts/WalletContext";

export default function ReceiveScreen() {
    const router = useRouter();
    const { publicKeyString } = useWallet();
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme];

    const handleCopy = async () => {
        if (publicKeyString) {
            try {
                await Clipboard.setStringAsync(publicKeyString);
                Alert.alert("Success", "Address copied to clipboard");
            } catch (error) {
                Alert.alert("Error", "Failed to copy address");
            }
        }
    };

    const handleShare = () => {
        Alert.alert("Share", "Share functionality would be implemented here");
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.backgroundSecondary }]}>
            <View
                style={[
                    styles.header,
                    { backgroundColor: colors.background, borderBottomColor: colors.border },
                ]}
            >
                <Pressable onPress={() => router.back()} style={styles.backButton}>
                    <Text style={[styles.backText, { color: colors.text }]}>←</Text>
                </Pressable>
                <Text style={[styles.headerTitle, { color: colors.text }]}>Receive</Text>
            </View>

            <ScrollView style={styles.scrollView}>
                <View style={styles.content}>
                    <View
                        style={[
                            styles.card,
                            { backgroundColor: colors.cardBackground, borderColor: colors.border },
                        ]}
                    >
                        <View style={styles.titleSection}>
                            <Text style={[styles.title, { color: colors.text }]}>
                                Receive Crypto
                            </Text>
                            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                                Scan QR code or copy address below
                            </Text>
                        </View>

                        <View style={styles.qrContainer}>
                            <View
                                style={[
                                    styles.qrOuter,
                                    {
                                        backgroundColor: colors.backgroundTertiary,
                                        borderColor: colors.border,
                                    },
                                ]}
                            >
                                <View
                                    style={[styles.qrInner, { backgroundColor: colors.background }]}
                                >
                                    {publicKeyString ? (
                                        <QRCode
                                            value={publicKeyString}
                                            size={192}
                                            color={colors.text}
                                            backgroundColor={colors.background}
                                            logo={undefined}
                                            logoSize={0}
                                            logoMargin={0}
                                            logoBackgroundColor="transparent"
                                            quietZone={8}
                                        />
                                    ) : (
                                        <View style={styles.qrLoadingContainer}>
                                            <ActivityIndicator
                                                size="large"
                                                color={colors.primary}
                                            />
                                            <Text
                                                style={[
                                                    styles.qrPlaceholder,
                                                    { color: colors.textSecondary },
                                                ]}
                                            >
                                                Loading wallet address...
                                            </Text>
                                        </View>
                                    )}
                                </View>
                            </View>
                        </View>

                        <View style={styles.addressSection}>
                            <View
                                style={[
                                    styles.addressCard,
                                    { backgroundColor: colors.backgroundTertiary },
                                ]}
                            >
                                <Text
                                    style={[styles.addressLabel, { color: colors.textSecondary }]}
                                >
                                    Your Solana Wallet Address
                                </Text>
                                <Text
                                    style={[styles.addressText, { color: colors.text }]}
                                    selectable
                                >
                                    {publicKeyString || "Not available"}
                                </Text>
                            </View>

                            <View style={styles.buttonRow}>
                                <Pressable
                                    onPress={handleCopy}
                                    style={[
                                        styles.actionButton,
                                        {
                                            backgroundColor: colors.cardBackground,
                                            borderColor: colors.border,
                                        },
                                    ]}
                                >
                                    <Text style={styles.actionIcon}>📋</Text>
                                    <Text style={[styles.actionText, { color: colors.text }]}>
                                        Copy
                                    </Text>
                                </Pressable>
                                <Pressable
                                    onPress={handleShare}
                                    style={[
                                        styles.actionButton,
                                        {
                                            backgroundColor: colors.cardBackground,
                                            borderColor: colors.border,
                                        },
                                    ]}
                                >
                                    <Text style={styles.actionIcon}>↗</Text>
                                    <Text style={[styles.actionText, { color: colors.text }]}>
                                        Share
                                    </Text>
                                </Pressable>
                            </View>
                        </View>
                    </View>

                    <View
                        style={[
                            styles.notesCard,
                            { backgroundColor: colors.cardBackground, borderColor: colors.border },
                        ]}
                    >
                        <Text style={[styles.notesTitle, { color: colors.text }]}>
                            Important Notes
                        </Text>
                        <View style={styles.notesList}>
                            <Text style={[styles.noteItem, { color: colors.textSecondary }]}>
                                • Only send crypto to this address
                            </Text>
                            <Text style={[styles.noteItem, { color: colors.textSecondary }]}>
                                • Sending other assets may result in permanent loss
                            </Text>
                            <Text style={[styles.noteItem, { color: colors.textSecondary }]}>
                                • Ensure the network matches before sending
                            </Text>
                        </View>
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
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 12,
        borderBottomWidth: 1,
    },
    backButton: {
        marginRight: 8,
    },
    backText: {
        fontSize: 24,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: "bold",
    },
    scrollView: {
        flex: 1,
    },
    content: {
        padding: 16,
    },
    card: {
        padding: 24,
        borderRadius: 12,
        borderWidth: 1,
        gap: 24,
    },
    titleSection: {
        alignItems: "center",
        gap: 8,
    },
    title: {
        fontSize: 24,
        fontWeight: "bold",
    },
    subtitle: {
        fontSize: 14,
        textAlign: "center",
    },
    qrContainer: {
        alignItems: "center",
    },
    qrOuter: {
        width: 256,
        height: 256,
        borderRadius: 16,
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 2,
    },
    qrInner: {
        width: 192,
        height: 192,
        borderRadius: 8,
        alignItems: "center",
        justifyContent: "center",
    },
    qrPlaceholder: {
        fontSize: 12,
        textAlign: "center",
        paddingHorizontal: 16,
        marginTop: 12,
    },
    qrLoadingContainer: {
        alignItems: "center",
        justifyContent: "center",
    },
    addressSection: {
        gap: 12,
    },
    addressCard: {
        padding: 16,
        borderRadius: 8,
    },
    addressLabel: {
        fontSize: 14,
        marginBottom: 8,
    },
    addressText: {
        fontSize: 14,
    },
    buttonRow: {
        flexDirection: "row",
        gap: 12,
    },
    actionButton: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        padding: 12,
        borderWidth: 1,
        borderRadius: 8,
    },
    actionIcon: {
        fontSize: 14,
    },
    actionText: {
        fontSize: 14,
    },
    notesCard: {
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        gap: 8,
        marginTop: 24,
    },
    notesTitle: {
        fontSize: 16,
        fontWeight: "600",
    },
    notesList: {
        gap: 4,
    },
    noteItem: {
        fontSize: 14,
    },
});
