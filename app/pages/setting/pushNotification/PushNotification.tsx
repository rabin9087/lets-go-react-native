import { useAppSelector } from '@/app/store/hooks';
import { useColorScheme } from "react-native";
import Colors from "@/constants/Colors";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from 'react';
import {
    Platform,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    ScrollView,
    Switch
} from 'react-native';

const NotificationSettings: React.FC = () => {
    const router = useRouter();
    const theme = useColorScheme() ?? "light";
    const colors = Colors[theme];
    const isDark = theme === "dark";

    // Accessing user from your store
    const { user } = useAppSelector(s => s.userInfo);

    // Local state for UI responsiveness
    const [prefs, setPrefs] = useState({
        push: user?.notificationPrefs?.push ?? false,
        sms: user?.notificationPrefs?.sms ?? false,
        email: user?.notificationPrefs?.email ?? false,
    });

    const toggleSwitch = (key: keyof typeof prefs) => {
        setPrefs(prev => ({ ...prev, [key]: !prev[key] }));
        // API update logic here
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            {/* Header / Navigation - Manual Top Padding to stay below Status Bar */}
            <View style={styles.navBar}>
                <TouchableOpacity
                    onPress={() => router.back()}
                    style={[styles.backButton, { backgroundColor: isDark ? "#2c2c2e" : "#f2f2f7" }]}
                >
                    <Ionicons
                        name={Platform.OS === 'ios' ? "chevron-back" : "arrow-back"}
                        size={24}
                        color={colors.text}
                    />
                </TouchableOpacity>
                <Text style={[styles.navTitle, { color: colors.text }]}>Notifications</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                {/* Status Section */}
                <View style={styles.statusSection}>
                    <View style={[styles.iconCircle, { backgroundColor: colors.backgroundPrimary + '15' }]}>
                        <Ionicons name="notifications" size={32} color={colors.backgroundPrimary} />
                    </View>
                    <Text style={[styles.statusTitle, { color: colors.text }]}>Device Connectivity</Text>
                    <Text style={[styles.statusSub, { color: isDark ? "#8e8e93" : "#666" }]}>
                        Push Tokens: {user?.pushTokens ? "Active" : "Inactive"}
                    </Text>
                </View>

                {/* Preference Section */}
                <Text style={styles.sectionLabel}>Preference Settings</Text>
                <View style={[styles.card, { backgroundColor: isDark ? "#1c1c1e" : "#fff" }]}>
                    <ToggleRow
                        label="Push Notifications"
                        description="Receive alerts about trip status"
                        value={prefs.push}
                        onToggle={() => toggleSwitch('push')}
                        colors={colors}
                        isDark={isDark}
                    />
                    <ToggleRow
                        label="SMS Notifications"
                        description="Critical updates via text message"
                        value={prefs.sms}
                        onToggle={() => toggleSwitch('sms')}
                        colors={colors}
                        isDark={isDark}
                    />
                    <ToggleRow
                        label="Email Reports"
                        description="Weekly summaries and receipts"
                        value={prefs.email}
                        onToggle={() => toggleSwitch('email')}
                        colors={colors}
                        isDark={isDark}
                        isLast
                    />
                </View>

                <View style={styles.infoBox}>
                    <Ionicons name="information-circle-outline" size={16} color="#8e8e93" />
                    <Text style={styles.infoText}>
                        You can manage specific system alerts in your device's system settings.
                    </Text>
                </View>
            </ScrollView>
        </View>
    );
};

/* ---------------- REUSABLE TOGGLE ROW ---------------- */

const ToggleRow = ({ label, description, value, onToggle, colors, isDark, isLast }: any) => (
    <View style={[styles.row, isLast && { borderBottomWidth: 0 }]}>
        <View style={styles.textContainer}>
            <Text style={[styles.rowLabel, { color: colors.text }]}>{label}</Text>
            <Text style={[styles.description, { color: "#8e8e93" }]}>{description}</Text>
        </View>
        <Switch
            trackColor={{ false: isDark ? "#3a3a3c" : "#e5e5ea", true: colors.backgroundPrimary }}
            thumbColor={Platform.OS === 'android' ? (value ? colors.backgroundPrimary : "#f4f3f4") : undefined}
            ios_backgroundColor={isDark ? "#3a3a3c" : "#e5e5ea"}
            onValueChange={onToggle}
            value={value}
        />
    </View>
);

/* ---------------- STYLES ---------------- */

const styles = StyleSheet.create({
    container: { flex: 1 },
    navBar: {
        marginTop: Platform.OS === 'ios' ? 60 : 45, // Keep lower than system icons
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingBottom: 10,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center'
    },
    navTitle: {
        fontSize: Platform.OS === 'ios' ? 17 : 19,
        fontWeight: '700'
    },
    scrollContent: {
        paddingBottom: 40
    },
    statusSection: {
        alignItems: 'center',
        marginTop: 20,
        marginBottom: 30,
    },
    iconCircle: {
        width: 72,
        height: 72,
        borderRadius: 36,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    statusTitle: {
        fontSize: 22,
        fontWeight: '800',
        letterSpacing: -0.5
    },
    statusSub: {
        fontSize: 14,
        marginTop: 4
    },
    sectionLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: '#8e8e93',
        textTransform: 'uppercase',
        marginBottom: 10,
        marginLeft: 24,
        letterSpacing: 0.5
    },
    card: {
        borderRadius: 16,
        marginHorizontal: 16,
        paddingHorizontal: 16,
        overflow: 'hidden',
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
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 16,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: "#33333330",
    },
    textContainer: { flex: 1, paddingRight: 10 },
    rowLabel: {
        fontSize: 16,
        fontWeight: '600'
    },
    description: {
        fontSize: 13,
        marginTop: 3,
        lineHeight: 18
    },
    infoBox: {
        flexDirection: 'row',
        marginHorizontal: 24,
        marginTop: 20,
        backgroundColor: '#8e8e9310',
        padding: 12,
        borderRadius: 10,
        alignItems: 'center'
    },
    infoText: {
        fontSize: 12,
        color: '#8e8e93',
        flex: 1,
        marginLeft: 8,
        lineHeight: 16
    },
});

export default NotificationSettings;