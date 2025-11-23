import { useRouter } from "expo-router";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

export default function ReceiveScreen() {
    const router = useRouter();
    const walletAddress = "0x1234...5678";

    const handleCopy = () => {
        Alert.alert("Success", "Address copied to clipboard");
    };

    const handleShare = () => {
        Alert.alert("Share", "Share functionality would be implemented here");
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Pressable onPress={() => router.back()} style={styles.backButton}>
                    <Text style={styles.backText}>←</Text>
                </Pressable>
                <Text style={styles.headerTitle}>Receive</Text>
            </View>

            <ScrollView style={styles.scrollView}>
                <View style={styles.content}>
                    <View style={styles.card}>
                        <View style={styles.titleSection}>
                            <Text style={styles.title}>Receive Crypto</Text>
                            <Text style={styles.subtitle}>
                                Scan QR code or copy address below
                            </Text>
                        </View>

                        <View style={styles.qrContainer}>
                            <View style={styles.qrOuter}>
                                <View style={styles.qrInner}>
                                    <Text style={styles.qrPlaceholder}>
                                        QR Code for Bitcoin Wallet
                                    </Text>
                                </View>
                            </View>
                        </View>

                        <View style={styles.addressSection}>
                            <View style={styles.addressCard}>
                                <Text style={styles.addressLabel}>
                                    Your Wallet Address
                                </Text>
                                <Text style={styles.addressText}>{walletAddress}</Text>
                            </View>

                            <View style={styles.buttonRow}>
                                <Pressable
                                    onPress={handleCopy}
                                    style={styles.actionButton}
                                >
                                    <Text style={styles.actionIcon}>📋</Text>
                                    <Text style={styles.actionText}>Copy</Text>
                                </Pressable>
                                <Pressable
                                    onPress={handleShare}
                                    style={styles.actionButton}
                                >
                                    <Text style={styles.actionIcon}>↗</Text>
                                    <Text style={styles.actionText}>Share</Text>
                                </Pressable>
                            </View>
                        </View>
                    </View>

                    <View style={styles.notesCard}>
                        <Text style={styles.notesTitle}>Important Notes</Text>
                        <View style={styles.notesList}>
                            <Text style={styles.noteItem}>
                                • Only send crypto to this address
                            </Text>
                            <Text style={styles.noteItem}>
                                • Sending other assets may result in permanent loss
                            </Text>
                            <Text style={styles.noteItem}>
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
        backgroundColor: '#FAFAFA',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#E1E4E8',
        backgroundColor: '#FFFFFF',
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
    },
    card: {
        padding: 24,
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E1E4E8',
        gap: 24,
    },
    titleSection: {
        alignItems: 'center',
        gap: 8,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#29343D',
    },
    subtitle: {
        fontSize: 14,
        color: '#737A82',
        textAlign: 'center',
    },
    qrContainer: {
        alignItems: 'center',
    },
    qrOuter: {
        width: 256,
        height: 256,
        backgroundColor: '#EFF1F3',
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: '#E1E4E8',
    },
    qrInner: {
        width: 192,
        height: 192,
        backgroundColor: '#FFFFFF',
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    qrPlaceholder: {
        fontSize: 12,
        color: '#737A82',
        textAlign: 'center',
        paddingHorizontal: 16,
    },
    addressSection: {
        gap: 12,
    },
    addressCard: {
        padding: 16,
        backgroundColor: '#EFF1F3',
        borderRadius: 8,
    },
    addressLabel: {
        fontSize: 14,
        color: '#737A82',
        marginBottom: 8,
    },
    addressText: {
        fontSize: 14,
        color: '#29343D',
    },
    buttonRow: {
        flexDirection: 'row',
        gap: 12,
    },
    actionButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        padding: 12,
        borderWidth: 1,
        borderColor: '#E1E4E8',
        borderRadius: 8,
        backgroundColor: '#FFFFFF',
    },
    actionIcon: {
        fontSize: 14,
        color: '#29343D',
    },
    actionText: {
        fontSize: 14,
        color: '#29343D',
    },
    notesCard: {
        padding: 16,
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E1E4E8',
        gap: 8,
        marginTop: 24,
    },
    notesTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#29343D',
    },
    notesList: {
        gap: 4,
    },
    noteItem: {
        fontSize: 14,
        color: '#737A82',
    },
});
