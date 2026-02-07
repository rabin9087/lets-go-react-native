import { useAppDispatch, useAppSelector } from "@/app/store/hooks";
import { setDriverDocuments } from "@/app/store/slices/driver.slice";
import { useColorScheme } from "@/components/useColorScheme";
import Colors from "@/constants/Colors";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
    ActivityIndicator,
    Alert,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { verifyDriverStripeAccount } from "../../axios/payment";

export default function StripeSuccess() {
    const router = useRouter();
    const dispatch = useAppDispatch();
    const theme = useColorScheme() ?? "light";
    const colors = Colors[theme];
    const isDark = theme === "dark";

    const [loading, setLoading] = useState(false);

    // Pull driver state to check verification status
    const { driver } = useAppSelector((s) => s.driverInfo);
    const paymentStatus = driver?.driverDocuments?.stripeDocuments?.paymentEnabledStatus;

    // Determine if verified based on Redux state
    const isVerified = !!(
        paymentStatus?.detailsSubmitted &&
        paymentStatus?.chargesEnabled &&
        paymentStatus?.payoutsEnabled
    );

    const verifyStripeAccount = async () => {
        try {
            setLoading(true);
            const res = await verifyDriverStripeAccount();

            // Sync fresh data to Redux
            if (res.data?.driverDocuments) {
                dispatch(setDriverDocuments(res.data.driverDocuments));
            }

            const status = res.data?.driverDocuments?.stripeDocuments?.paymentEnabledStatus;

            if (status?.detailsSubmitted && status?.chargesEnabled && status?.payoutsEnabled) {
                Alert.alert("Success", "Account verified successfully!");
            } else {
                Alert.alert(
                    "Onboarding Incomplete",
                    "Stripe needs more information. Please ensure you finished all steps in the Stripe portal."
                );
            }
        } catch (err) {
            Alert.alert("Error", "Failed to sync status. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    onPress={() => router.back()}
                    style={[styles.backButton, { backgroundColor: isDark ? colors.card : '#f5f5f5' }]}
                >
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
            </View>

            <View style={styles.content}>
                {/* Dynamic Icon Section */}
                <View style={[
                    styles.iconContainer,
                    { backgroundColor: isVerified ? "#22c55e15" : colors.tint + "15" }
                ]}>
                    <Ionicons
                        name={isVerified ? "checkmark-circle" : "sparkles-outline"}
                        size={80}
                        color={isVerified ? "#22c55e" : colors.tint}
                    />
                </View>

                <Text style={[styles.title, { color: colors.text }]}>
                    {isVerified ? "Account Verified!" : "Onboarding Complete"}
                </Text>

                <Text style={[styles.subtitle, { color: colors.text, opacity: 0.7 }]}>
                    {isVerified
                        ? "Your Stripe account is fully set up. You can now start accepting rides and receiving payouts."
                        : "Your details have been submitted to Stripe. Click below to sync your verification status with our system."
                    }
                </Text>

                {/* Information Card */}
                {!isVerified && (
                    <View style={[
                        styles.statusCard,
                        { backgroundColor: isDark ? colors.card : "#f8fafc", borderColor: colors.border }
                    ]}>
                        <Ionicons name="information-circle-outline" size={20} color={colors.tint} />
                        <Text style={[styles.statusText, { color: colors.text }]}>
                            Sync required to enable payouts.
                        </Text>
                    </View>
                )}
                {/* Footer Actions */}
                <View style={styles.footer}>
                    {!isVerified ? (
                        <TouchableOpacity
                            style={[styles.primaryButton, { backgroundColor: colors.tint }]}
                            onPress={verifyStripeAccount}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <>
                                    <Text style={{ color: colors.background }}>Verify Account Status</Text>
                                    <Ionicons name="sync" size={18} color="#fff" />
                                </>
                            )}
                        </TouchableOpacity>
                    ) : (
                        <TouchableOpacity
                            style={[styles.successButton, { backgroundColor: "#22c55e" }]}
                            onPress={() => router.back()}
                        >
                            <Text style={styles.primaryButtonText}>Go to Dashboard</Text>
                            <Ionicons name="arrow-forward" size={18} color="#fff" />
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        paddingHorizontal: 20,
        paddingTop: 10,
        height: 60,
        justifyContent: "center",
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 12,
        justifyContent: "center",
        alignItems: "center",
    },
    content: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 30,
    },
    iconContainer: {
        width: 140,
        height: 140,
        borderRadius: 70,
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 30,
    },
    title: {
        fontSize: 28,
        fontWeight: "900",
        textAlign: "center",
        marginBottom: 12,
        letterSpacing: -0.5,
    },
    subtitle: {
        fontSize: 16,
        textAlign: "center",
        lineHeight: 24,
        marginBottom: 35,
    },
    statusCard: {
        flexDirection: "row",
        alignItems: "center",
        padding: 16,
        borderRadius: 20,
        borderWidth: 1,
        gap: 12,
        marginBottom: 40,
        width: '100%',
    },
    statusText: {
        fontSize: 14,
        fontWeight: "600",
    },
    footer: {
        width: "100%",
    },
    primaryButton: {
        flexDirection: "row",
        height: 58,
        borderRadius: 18,
        justifyContent: "center",
        alignItems: "center",
        gap: 10,
        elevation: 2,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    successButton: {
        flexDirection: "row",
        height: 58,
        borderRadius: 18,
        justifyContent: "center",
        alignItems: "center",
        gap: 10,
    },
    primaryButtonText: {
        color: "#fff",
        fontSize: 17,
        fontWeight: "800",
    },
});