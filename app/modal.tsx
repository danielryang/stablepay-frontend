import { Platform, StyleSheet, Text, View } from "react-native";

import { StatusBar } from "expo-status-bar";

export default function ModalScreen() {
    return (
        <View style={styles.container}>
            <Text style={styles.text}>Modal</Text>
            {/* Use a light status bar on iOS to account for the black space above the modal */}
            <StatusBar style={Platform.OS === "ios" ? "light" : "auto"} />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
    },
    text: {
        fontSize: 20,
        fontWeight: "bold",
    },
});
