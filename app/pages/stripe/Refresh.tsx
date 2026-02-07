import { View, Text, StyleSheet, Button } from "react-native";
import * as Linking from "expo-linking";

const API_URL = "http://192.168.1.108:4000"; // your backend

export default function StripeRefresh() {
    const retryOnboarding = async () => {
        try {
            const res = await fetch(
                `${API_URL}/api/v1/payment/onboarding-link`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                }
            );

            const data = await res.json();

            if (!data.url) {
                alert("Unable to create onboarding link");
                return;
            }

            // Open Stripe onboarding again
            Linking.openURL(data.url);
        } catch (err) {
            alert("Failed to restart onboarding");
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>❌ Onboarding Incomplete</Text>

            <Text style={styles.subtitle}>
                You must complete Stripe onboarding to receive payments.
            </Text>

            <Button title="Retry Stripe Onboarding" onPress={retryOnboarding} />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: "center",
        padding: 20,
    },
    title: {
        fontSize: 22,
        fontWeight: "700",
        marginBottom: 10,
    },
    subtitle: {
        fontSize: 16,
        marginBottom: 20,
    },
});
