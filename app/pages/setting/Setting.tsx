import { useColorScheme } from "@/components/useColorScheme";
import Colors from "@/constants/Colors";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import {
    Alert,
    Platform,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from "react-native";

const SAFE_TOP_PADDING = Platform.OS === "ios" ? 60 : (StatusBar.currentHeight ?? 0) + 10;

const Setting = () => {
    const router = useRouter();
    const theme = useColorScheme() ?? "light";
    const colors = Colors[theme];
    const isDark = theme === "dark";

    /* ---------------- REUSABLE ROW COMPONENT ---------------- */
    // Defined inside or passed styles to ensure it has access to the stylesheet
    const SettingRow = ({ icon, label, onPress, isDark, isLast, isDestructive }: any) => (
        <TouchableOpacity
            style={[styles.row, !isLast && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: isDark ? "#38383A" : "#C6C6C8" }]}
            onPress={onPress}
            activeOpacity={0.7}
        >
            <View style={styles.rowLeft}>
                <View style={[styles.iconContainer, { backgroundColor: isDestructive ? "#FF3B3015" : (isDark ? "#3A3A3C" : "#F2F2F7") }]}>
                    <Ionicons
                        name={icon}
                        size={20}
                        color={isDestructive ? "#FF3B30" : (isDark ? "#FFF" : "#007AFF")}
                    />
                </View>
                <Text style={[styles.rowText, { color: isDestructive ? "#FF3B30" : (isDark ? "#FFF" : "#000") }]}>
                    {label}
                </Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#C4C4C6" />
        </TouchableOpacity>
    );

    return (
        <View style={[styles.container, { backgroundColor: isDark ? "#000" : "#F2F2F7" }]}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} hitSlop={10}>
                    <Ionicons
                        name={Platform.OS === 'ios' ? "chevron-back" : "arrow-back"}
                        size={28}
                        color={colors.tint}
                    />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.text }]}>Settings</Text>
                <View style={{ width: 28 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                <Text style={[styles.sectionLabel, { color: isDark ? "#aaa" : "#6e6e73" }]}>GENERAL</Text>
                <View style={[styles.group, { backgroundColor: isDark ? "#1C1C1E" : "#FFF" }]}>
                    <SettingRow
                        icon="moon-outline"
                        label="Appearance"
                        onPress={() => { router.push("/pages/setting/pushNotification/PushNotification") }}
                        isDark={isDark}
                    />
                    <SettingRow
                        icon="notifications-outline"
                        label="Push Notifications"
                        onPress={() => { router.push("/pages/setting/pushNotification/PushNotification") }}
                        isDark={isDark}
                        isLast
                    />
                </View>

                {/* ... other sections remain the same ... */}

                <Text style={[styles.sectionLabel, { color: isDark ? "#aaa" : "#6e6e73" }]}>SUPPORT</Text>
                <View style={[styles.group, { backgroundColor: isDark ? "#1C1C1E" : "#FFF" }]}>
                    <SettingRow icon="help-buoy-outline" label="Help Center" onPress={() => { }} isDark={isDark} />
                    <SettingRow icon="document-text-outline" label="Terms of Service" onPress={() => { router.push("/pages/setting/termsAndConditions/TermsAndConditions") }} isDark={isDark} isLast />
                </View>

                <Text style={styles.versionText}>Version 1.0.4 (2026)</Text>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        paddingTop: SAFE_TOP_PADDING,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 16,
        paddingBottom: 15,
    },
    headerTitle: { fontSize: 18, fontWeight: "700" },
    scrollContent: { paddingBottom: 40 },
    sectionLabel: {
        fontSize: 12,
        marginLeft: 32,
        marginBottom: 8,
        marginTop: 15,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        fontWeight: "600"
    },
    group: {
        borderRadius: 14,
        marginHorizontal: 16,
        overflow: 'hidden',
    },
    row: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingVertical: 12,
        paddingHorizontal: 16,
    },
    rowLeft: { flexDirection: "row", alignItems: "center", gap: 14 },
    iconContainer: {
        width: 32,
        height: 32,
        borderRadius: 8,
        justifyContent: "center",
        alignItems: "center",
    },
    rowText: { fontSize: 16, fontWeight: "500" },
    versionText: {
        textAlign: "center",
        color: "#8E8E93",
        fontSize: 12,
        marginTop: 30,
    }
});

export default Setting;