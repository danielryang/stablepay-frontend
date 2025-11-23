import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

export default function LoginScreen() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const handleLogin = () => {
        router.push("/(tabs)");
    };

    return (
        <View style={styles.container}>
            <View style={styles.content}>
                <View style={styles.logoContainer}>
                    <View style={styles.logo}>
                        <Text style={styles.logoIcon}>💲</Text>
                    </View>
                    <Text style={styles.title}>StablePay</Text>
                    <Text style={styles.subtitle}>Sign in to your account</Text>
                </View>

                <View style={styles.card}>
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Email</Text>
                        <TextInput
                            value={email}
                            onChangeText={setEmail}
                            placeholder="you@example.com"
                            keyboardType="email-address"
                            autoCapitalize="none"
                            style={styles.input}
                            placeholderTextColor="#737A82"
                        />
                    </View>
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Password</Text>
                        <TextInput
                            value={password}
                            onChangeText={setPassword}
                            placeholder="••••••••"
                            secureTextEntry
                            style={styles.input}
                            placeholderTextColor="#737A82"
                        />
                    </View>
                    <Pressable
                        onPress={handleLogin}
                        style={styles.loginButton}
                    >
                        <Text style={styles.loginButtonText}>Sign In</Text>
                    </Pressable>
                </View>

                <View style={styles.footer}>
                    <Text style={styles.footerText}>
                        Don't have an account?{" "}
                        <Text style={styles.signUpLink}>Sign up</Text>
                    </Text>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FAFAFA',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
    },
    content: {
        width: '100%',
        maxWidth: 400,
        gap: 32,
    },
    logoContainer: {
        alignItems: 'center',
        gap: 8,
    },
    logo: {
        backgroundColor: '#0891D1',
        borderRadius: 999,
        padding: 16,
        width: 80,
        height: 80,
        alignItems: 'center',
        justifyContent: 'center',
    },
    logoIcon: {
        fontSize: 48,
    },
    title: {
        fontSize: 30,
        fontWeight: 'bold',
        color: '#29343D',
    },
    subtitle: {
        fontSize: 14,
        color: '#737A82',
    },
    card: {
        padding: 24,
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E1E4E8',
        gap: 16,
    },
    inputGroup: {
        gap: 8,
    },
    label: {
        fontSize: 14,
        fontWeight: '500',
        color: '#29343D',
    },
    input: {
        backgroundColor: '#E1E4E8',
        borderWidth: 1,
        borderColor: '#E1E4E8',
        borderRadius: 8,
        padding: 12,
        fontSize: 14,
        color: '#29343D',
    },
    loginButton: {
        backgroundColor: '#0891D1',
        borderRadius: 8,
        padding: 12,
        alignItems: 'center',
    },
    loginButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '500',
    },
    footer: {
        alignItems: 'center',
    },
    footerText: {
        fontSize: 14,
        color: '#737A82',
    },
    signUpLink: {
        color: '#0891D1',
    },
});
