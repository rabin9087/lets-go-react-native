import React from "react";
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Platform,
    useColorScheme,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import Colors from "@/constants/Colors";
import { useAppSelector } from "@/app/store/hooks";

const FinancialOnboarding = () => {
    const theme = useColorScheme() ?? "light";
    const isDark = theme === "dark";
    const themeColors = Colors[theme];
    const router = useRouter();
    const { user } = useAppSelector((s) => s.userInfo);

    const SettingRow = ({ icon, label, onPress, color, rightElement, isLast }: any) => (
        <>
            <TouchableOpacity
                style={styles.row}
                onPress={onPress}
                activeOpacity={Platform.OS === 'ios' ? 0.7 : 0.4}
            >
                <View style={[styles.iconBg, { backgroundColor: `${color}15` }]}>
                    <Ionicons name={icon} size={20} color={color} />
                </View>
                <Text style={[styles.rowLabel, { color: themeColors.text }]}>{label}</Text>
                {rightElement || <Ionicons name="chevron-forward" size={18} color="#999" />}
            </TouchableOpacity>
            {!isLast && <View style={[styles.divider, { backgroundColor: isDark ? "#333" : "#f0f0f0" }]} />}
        </>
    );

    return (
        <View style={[styles.mainWrapper, { backgroundColor: themeColors.background }]}>
            {/* Header section with manual spacing to avoid system icons */}
            <View style={styles.navHeader}>
                <TouchableOpacity
                    onPress={() => router.back()}
                    style={[styles.backButton]}
                >
                    <Ionicons name="chevron-back" size={24} color={themeColors.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: themeColors.text }]}>Financials</Text>
                <View style={{ width: 44 }} />
            </View>

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.headerDescription}>
                    <Text style={[styles.mainTitle, { color: themeColors.text }]}>Payment & Payouts</Text>
                    <Text style={styles.subTitle}>Configure how you pay for rides and receive your earnings.</Text>
                </View>

                {/* Payment Methods Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionLabel}>Payment Methods</Text>
                    <View style={[styles.card, { backgroundColor: isDark ? "#1c1c1e" : "#fff" }]}>
                        <SettingRow
                            icon="card"
                            label="Payment Methods"
                            color="#8b5cf6"
                            onPress={() => router.push("pages/payment/PaymentMethod")}
                        />
                        {user?.role === "driver" && (
                            <SettingRow
                                icon="document-text"
                                label="Documents"
                                color="#007AFF"
                                isLast={true}
                                onPress={() => router.push("pages/payment/DriverPaymentManager")}
                            />
                        )}
                    </View>
                </View>

                <View style={styles.infoBox}>
                    <Ionicons name="information-circle-outline" size={20} color="#8e8e93" />
                    <Text style={styles.infoText}>
                        Your financial data is encrypted and never stored directly on your device.
                    </Text>
                </View>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    mainWrapper: {
        flex: 1,
    },
    navHeader: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 16,
        // Manual offset to keep content lower than the system status bar
        marginTop: Platform.OS === 'ios' ? 60 : 40,
        height: 56,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: "center",
        justifyContent: "center",
    },
    headerTitle: {
        fontSize: Platform.OS === 'ios' ? 17 : 19,
        fontWeight: "700",
    },
    scrollContent: {
        paddingHorizontal: 16,
        paddingTop: 20,
        paddingBottom: 40
    },
    headerDescription: {
        marginBottom: 30,
    },
    mainTitle: {
        fontSize: 28,
        fontWeight: "800",
        marginBottom: 8,
    },
    subTitle: {
        fontSize: 15,
        color: "#8e8e93",
        lineHeight: 20,
    },
    section: {
        marginBottom: 24,
    },
    sectionLabel: {
        fontSize: 13,
        fontWeight: "600",
        color: "#8e8e93",
        textTransform: "uppercase",
        marginLeft: 8,
        marginBottom: 10,
        letterSpacing: 0.5,
    },
    card: {
        borderRadius: 16,
        overflow: "hidden",
        ...Platform.select({
            ios: {
                shadowColor: "#000",
                shadowOpacity: 0.05,
                shadowRadius: 10,
                shadowOffset: { width: 0, height: 4 },
            },
            android: {
                elevation: 3,
            },
        }),
    },
    row: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingVertical: 16,
    },
    iconBg: {
        width: 36,
        height: 36,
        borderRadius: 10,
        alignItems: "center",
        justifyContent: "center",
        marginRight: 12,
    },
    rowLabel: {
        flex: 1,
        fontSize: 16,
        fontWeight: "500",
    },
    divider: {
        height: StyleSheet.hairlineWidth,
        marginLeft: 64,
    },
    infoBox: {
        flexDirection: 'row',
        backgroundColor: '#8e8e9310',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 10
    },
    infoText: {
        flex: 1,
        fontSize: 13,
        color: '#8e8e93',
        marginLeft: 10,
        lineHeight: 18
    }
});

export default FinancialOnboarding;