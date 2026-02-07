import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import React, { useEffect } from "react";
import {
    ActivityIndicator,
    Platform,
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

import { getDriverStripeAccount } from "@/app/axios/payment";
import { useAppDispatch, useAppSelector } from "@/app/store/hooks";
import { setDriverDocuments } from "@/app/store/slices/driver.slice";
import { useColorScheme } from "@/components/useColorScheme";
import Colors from "@/constants/Colors";

export default function DriverBankAccount() {
    const theme = useColorScheme() ?? "light";
    const colors = Colors[theme];
    const isDark = theme === "dark";
    const router = useRouter();
    const dispatch = useAppDispatch();
    const { driver } = useAppSelector((s) => s.driverInfo);

    const backIcon = Platform.OS === "ios" ? "chevron-back" : "arrow-back";

    const { data, isLoading, refetch, isFetched, isFetching } = useQuery({
        queryKey: ["driverDocuments"],
        queryFn: async () => {
            const res = await getDriverStripeAccount();
            return res?.data?.driverDocuments ?? null;
        },
    });

    useEffect(() => {
        if (data) dispatch(setDriverDocuments(data));
    }, [data, dispatch]);

    const stripeDocs = data?.stripeDocuments || driver?.driverDocuments?.stripeDocuments;
    const hasStripeAccount = !!stripeDocs?.stripeAccountId;

    if (isLoading && !isFetched) {
        return (
            <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
                <ActivityIndicator size="large" color={colors.tint} />
            </View>
        );
    }

    const renderHeader = () => (
        <View style={styles.header}>
            <TouchableOpacity
                onPress={() => router.back()}
                style={styles.backBtn}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
                <Ionicons name={backIcon} size={28} color={colors.text} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: colors.text }]}>
                {hasStripeAccount ? "Payout Details" : ""}
            </Text>
            <View style={styles.headerRight}>
                {hasStripeAccount && (
                    <TouchableOpacity
                        onPress={() => refetch()}
                        disabled={isFetching}
                        style={[styles.refreshBtn, { backgroundColor: isDark ? "#2c2c2e" : "#f2f2f7" }]}
                    >
                        {isFetching ? (
                            <ActivityIndicator size="small" color={colors.tint} />
                        ) : (
                            <Ionicons name="refresh" size={18} color={colors.tint} />
                        )}
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );

    if (!hasStripeAccount && isFetched) {
        return (
            <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
                {renderHeader()}
                <View style={styles.errorContent}>
                    <View style={[styles.iconCircle, { backgroundColor: colors.tint + "15" }]}>
                        <Ionicons name="card-outline" size={60} color={colors.tint} />
                    </View>
                    <Text style={[styles.title, { color: colors.text }]}>Payments</Text>
                    <Text style={[styles.subtitle, { color: colors.text }]}>
                        Connect your bank account to receive earnings. Secure payouts are processed via Stripe.
                    </Text>
                    <TouchableOpacity
                        activeOpacity={0.8}
                        style={[styles.primaryBtn, { backgroundColor: colors.text }]}
                        onPress={() => router.push("pages/payment/DriverPayoutScreen")}
                    >
                        <Text style={[styles.primaryBtnText, { color: colors.background }]}>Setup Payout Account</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    const status = stripeDocs?.paymentEnabledStatus;
    const bank = stripeDocs?.bankDetails;
    const isFullyVerified = !!(status?.payoutsEnabled && status?.chargesEnabled);

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
            <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
            {renderHeader()}

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                <Text style={[styles.pageHeading, { color: colors.text }]}>Payout Account</Text>

                {/* VERIFICATION CARD */}
                <View style={[styles.card, { backgroundColor: isDark ? "#1c1c1e" : "#fff", borderColor: isDark ? "#2c2c2e" : "#f2f2f7" }]}>
                    <View style={styles.cardHeader}>
                        <Text style={styles.sectionLabel}>Verification Status</Text>
                        <View style={[styles.badge, { backgroundColor: isFullyVerified ? "#34c75920" : "#ff950020" }]}>
                            <View style={[styles.dot, { backgroundColor: isFullyVerified ? "#34c759" : "#ff9500" }]} />
                            <Text style={[styles.badgeText, { color: isFullyVerified ? "#34c759" : "#ff9500" }]}>
                                {isFullyVerified ? "Verified" : "Pending"}
                            </Text>
                        </View>
                    </View>

                    <StatusRow label="Payouts Enabled" value={status?.payoutsEnabled} colors={colors} />
                    <StatusRow label="Charges Enabled" value={status?.chargesEnabled} colors={colors} />
                    <StatusRow label="Requirements Met" value={status?.detailsSubmitted} colors={colors} isLast />
                </View>

                {/* BANK DETAILS CARD */}
                <Text style={styles.sectionLabel}>Linked Bank</Text>
                <View style={[styles.bankCard, { backgroundColor: isDark ? "#1c1c1e" : "#fff", borderColor: isDark ? "#2c2c2e" : "#f2f2f7" }]}>
                    <View style={[styles.bankIconBg, { backgroundColor: colors.tint + "10" }]}>
                        <Ionicons name="business-outline" size={24} color={colors.tint} />
                    </View>
                    <View style={styles.bankInfo}>
                        <Text style={[styles.bankName, { color: colors.text }]}>
                            {bank?.bankName || "External Account"}
                        </Text>
                        <Text style={styles.bankSubtext}>
                            {bank?.currency?.toUpperCase() ?? "AUD"} •••• {bank?.bankLast4 || "XXXX"}
                        </Text>
                    </View>
                    <Ionicons name="checkmark" size={20} color="#34c759" />
                </View>

                <View style={styles.stripeBranding}>
                    <Ionicons name="lock-closed" size={12} color="#8e8e93" />
                    <Text style={styles.brandingText}>Payouts processed by Stripe</Text>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const StatusRow = ({ label, value, colors, isLast }: any) => (
    <View style={[styles.statusRow, isLast && { borderBottomWidth: 0 }]}>
        <Text style={[styles.statusLabel, { color: colors.text }]}>{label}</Text>
        <Ionicons
            name={value ? "checkmark-circle" : "alert-circle"}
            size={20}
            color={value ? "#34c759" : "#ff9500"}
        />
    </View>
);

const styles = StyleSheet.create({
    loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        height: 56,
        paddingHorizontal: 8,
    },
    headerTitle: { fontSize: 17, fontWeight: "600" },
    headerRight: { width: 44, alignItems: "center" },
    backBtn: { width: 44, height: 44, justifyContent: "center", alignItems: "center" },
    refreshBtn: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center" },
    scrollContent: { paddingHorizontal: 20, paddingTop: 12 },
    pageHeading: { fontSize: 34, fontWeight: "800", marginBottom: 24, letterSpacing: -1 },
    errorContent: { flex: 0.8, justifyContent: "center", alignItems: "center", paddingHorizontal: 30 },
    iconCircle: { width: 100, height: 100, borderRadius: 50, justifyContent: "center", alignItems: "center", marginBottom: 20 },
    title: { fontSize: 24, fontWeight: "700", marginBottom: 12 },
    subtitle: { fontSize: 15, textAlign: "center", opacity: 0.6, marginBottom: 32, lineHeight: 22 },
    sectionLabel: { fontSize: 13, fontWeight: "600", color: "#8e8e93", textTransform: "uppercase", marginBottom: 10, marginLeft: 4, letterSpacing: 0.5 },
    card: { borderRadius: 14, padding: 16, borderWidth: 1, marginBottom: 28 },
    cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
    badge: { flexDirection: "row", alignItems: "center", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
    dot: { width: 6, height: 6, borderRadius: 3, marginRight: 6 },
    badgeText: { fontSize: 12, fontWeight: "700" },
    statusRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "#c6c6c840" },
    statusLabel: { fontSize: 16, fontWeight: "400" },
    bankCard: { flexDirection: "row", alignItems: "center", padding: 16, borderRadius: 14, borderWidth: 1 },
    bankIconBg: { width: 44, height: 44, borderRadius: 10, alignItems: "center", justifyContent: "center", marginRight: 16 },
    bankInfo: { flex: 1 },
    bankName: { fontSize: 17, fontWeight: "600", marginBottom: 2 },
    bankSubtext: { fontSize: 14, color: "#8e8e93" },
    stripeBranding: { flexDirection: "row", alignItems: "center", justifyContent: "center", marginTop: 24, gap: 4 },
    brandingText: { fontSize: 12, color: "#8e8e93", fontWeight: "500" },
    primaryBtn: { width: "100%", height: 54, borderRadius: 14, justifyContent: "center", alignItems: "center" },
    primaryBtnText: { fontWeight: "700", fontSize: 16 },
});