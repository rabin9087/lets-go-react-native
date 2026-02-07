import { useAppSelector } from '@/app/store/hooks';
import { useColorScheme } from "@/components/useColorScheme";
import Colors from "@/constants/Colors";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from 'react';
import {
    Image,
    Platform,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    ScrollView
} from 'react-native';
import DriverProfileManager from './DriverProfileManager';

const SAFE_TOP_PADDING = Platform.OS === "ios" ? 50 : (StatusBar.currentHeight ?? 0) + 10;

const ProfileInformation: React.FC = () => {
    const router = useRouter();
    const theme = useColorScheme() ?? "light";
    const colors = Colors[theme];
    const isDark = theme === "dark";

    // Getting user from Redux store
    const { user } = useAppSelector(s => s.userInfo);
    const { driver } = useAppSelector(s => s.driverInfo);

    const themeColors = {
        primary: colors.tint,
        surface: isDark ? "#1C1C1E" : "#FFFFFF",
        background: isDark ? "#000000" : "#F2F2F7",
        text: colors.text,
        textMuted: isDark ? "#8E8E93" : "#6e6e73",
        border: isDark ? "#38383A" : "#C6C6C8",
        success: "#34C759",
        danger: "#FF3B30",
    };

    const styles = createStyles(themeColors);

    return (
        <View style={[styles.container, { backgroundColor: themeColors.background }]}>
            {/* Native-style Back Navigation */}
            <View style={styles.navBar}>
                <TouchableOpacity
                    onPress={() => router.back()}
                    style={styles.backButton}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                    <Ionicons
                        name={Platform.OS === 'ios' ? "chevron-back" : "arrow-back"}
                        size={28}
                        color={themeColors.primary}
                    />
                </TouchableOpacity>
                <Text style={styles.navTitle}>Profile</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Header Profile Section */}
                <View style={styles.header}>
                    <View style={styles.avatarWrapper}>
                        <Image
                            source={user?.profileImage ? { uri: user.profileImage } : require("@/assets/images/icon.png")}
                            style={styles.avatar}
                        />
                        <View style={[styles.statusDot, { backgroundColor: user?.status === 'active' ? themeColors.success : themeColors.danger }]} />
                    </View>

                    <Text style={styles.userName}>{user?.name || "User Name"}</Text>
                    <View style={[styles.roleBadge, { backgroundColor: themeColors.primary + '20' }]}>
                        <Text style={[styles.roleText, { color: themeColors.primary }]}>
                            {(user?.role ?? "rider").toUpperCase()}
                        </Text>
                    </View>
                </View>

                {/* Account Info Group */}
                <View style={styles.section}>
                    <Text style={styles.sectionLabel}>Account Information</Text>

                    <View style={styles.card}>
                        <InfoRow
                            label="Phone Number"
                            value={user?.phone}
                            isVerified={user?.phoneVerified}
                            colors={themeColors}
                            styles={styles}
                        />

                        <InfoRow
                            label="Verification"
                            value={user?.verifyVia || "None"}
                            colors={themeColors}
                            styles={styles}
                        />

                        <InfoRow
                            label="Account Status"
                            value={user?.status}
                            valueColor={user?.status === 'active' ? themeColors.success : themeColors.danger}
                            colors={themeColors}
                            styles={styles}
                        />

                        <InfoRow
                            label="Terms Accepted"
                            value={user?.termsAccepted ? "Completed" : "Action Required"}
                            showCheck={user?.termsAccepted}
                            colors={themeColors}
                            styles={styles}
                            isLast
                        />
                    </View>
                </View>

                <View style={{ height: 40 }} />

                <DriverProfileManager/>
            </ScrollView>
        </View>
    );
};

/* ---------------- REUSABLE ROW ---------------- */

const InfoRow = ({ label, value, isVerified, showCheck, colors, valueColor, isLast, styles }: any) => (
    <View style={[styles.row, isLast && { borderBottomWidth: 0 }]}>
        <Text style={[styles.label, { color: colors.textMuted }]}>{label}</Text>
        <View style={styles.valueContainer}>
            <Text style={[styles.value, { color: valueColor || colors.text }]}>
                {value}
            </Text>
            {(isVerified || showCheck) && (
                <Text style={[styles.check, { color: colors.success }]}> ✓</Text>
            )}
        </View>
    </View>
);

/* ---------------- STYLES ---------------- */

const createStyles = (colors: any) => StyleSheet.create({
    container: {
        flex: 1,
    },
    navBar: {
        paddingTop: SAFE_TOP_PADDING,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 8,
        paddingBottom: 10,
    },
    backButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    navTitle: {
        fontSize: 17,
        fontWeight: '600',
        color: colors.text,
    },
    header: {
        alignItems: 'center',
        marginVertical: 20,
    },
    avatarWrapper: {
        position: 'relative',
        marginBottom: 12,
    },
    avatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: colors.border,
    },
    statusDot: {
        position: 'absolute',
        bottom: 5,
        right: 5,
        width: 18,
        height: 18,
        borderRadius: 9,
        borderWidth: 3,
        borderColor: colors.surface,
    },
    userName: {
        fontSize: 24,
        fontWeight: '700',
        color: colors.text,
    },
    roleBadge: {
        marginTop: 8,
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 8,
    },
    roleText: {
        fontSize: 13,
        fontWeight: 'bold',
        letterSpacing: 1,
    },
    section: {
        marginTop: 10,
    },
    sectionLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: colors.textMuted,
        textTransform: 'uppercase',
        marginBottom: 10,
        marginLeft: 32, // iOS style alignment
    },
    card: {
        backgroundColor: colors.surface,
        borderRadius: 14,
        marginHorizontal: 16,
        paddingHorizontal: 16,
        overflow: 'hidden',
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 15,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: colors.border,
    },
    label: {
        fontSize: 16,
    },
    valueContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    value: {
        fontSize: 16,
        fontWeight: '500',
        textTransform: 'capitalize',
    },
    check: {
        fontSize: 16,
        fontWeight: 'bold',
        marginLeft: 4
    }
});

export default ProfileInformation;