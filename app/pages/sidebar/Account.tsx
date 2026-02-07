import { IUpdateOnlineStatus, updateOnlineStatus } from "@/app/axios/onlineDriver";
import { clearAllTokens } from "@/app/axios/secureTokens";
import { logoutUser, updateNavigationMap as updateNavApi } from "@/app/axios/user";
import { useAppDispatch, useAppSelector } from "@/app/store/hooks";
import { setDriverOnlineStatus } from "@/app/store/slices/onlineDrivers.slice";
import { reseITrip } from "@/app/store/slices/trip.slice";
import { IVehicle } from "@/app/store/slices/types.slice";
import { setNavigationApp, setUser } from "@/app/store/slices/user.slice";
import { useColorScheme } from "@/components/useColorScheme";
import Colors from "@/constants/Colors";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect } from "react";
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
import Toast from "react-native-toast-message";
import { IUser } from "../user/user.types";

/**
 * Enhanced Safe Spacing
 * Android: Uses Statusbar height + a small buffer for better visual breathing room.
 * iOS: Uses a standard safe top margin since SafeAreaView was removed.
 */
const SAFE_TOP_PADDING = Platform.select({
    android: (StatusBar.currentHeight || 0) + 8,
    ios: 44, // Standard iOS status bar height equivalent
    default: 0
});

const Account = () => {
    const theme = useColorScheme() ?? "light";
    const isDark = theme === "dark";
    const router = useRouter();
    const dispatch = useAppDispatch();

    const { user } = useAppSelector((s) => s.userInfo);
    const { onlineDriver } = useAppSelector((s) => s.onlineDriversInfo);
    const { driver } = useAppSelector((s) => s.driverInfo);
    const { pickupLocation, dropoffLocation, seatsAvailable } = useAppSelector((s) => s.tripInfo);
    const activeVehicle = user?.role === "driver"
        ? driver?.vehicles?.find((v) => v.inUse === true)
        : null;

    // 2. Destructure with a fallback empty object to prevent "cannot destructure null" errors
    const { photos, ...vehicle } = activeVehicle || {};
    const themeColors = Colors[theme];

    useEffect(() => {
        const syncNav = async () => {
            if (!user?.navigationMap) {
                const platformDefault = Platform.OS === "ios" ? "ios" : "android";
                try {
                    // await updateNavApi(platformDefault);
                    dispatch(setNavigationApp(platformDefault));
                } catch (e) {
                    console.error("Sync Nav Error:", e);
                }
            }
        };
        syncNav();
    }, [user?.navigationMap]);

    const handleUpdateNav = async (pref: "android" | "ios") => {
        try {
            await updateNavApi(pref);
            dispatch(setNavigationApp(pref));
            Toast.show({ type: "success", text1: "Preference Updated" });
        } catch (e) {
            Toast.show({ type: "error", text1: "Failed to update preference" });
        }
    };

    const handleOnLogout = async () => {
        if (user?.role === "driver" && onlineDriver?.isOnline) {
            Alert.alert(
                "Still Online",
                "Please go offline before logging out.",
                [
                    { text: "Cancel", style: "cancel" },
                    {
                        text: "Go Offline & Logout",
                        style: "destructive",
                        onPress: async () => {
                            const success = await handleOnGoOnline(false);
                            if (success) await executeLogout();
                        },
                    },
                ]
            );
            return;
        }
        await executeLogout();
    };

    const handleOnGoOnline = async (onlineStatus: boolean) => {
        try {
            const payload: IUpdateOnlineStatus = {
                currentLocation: pickupLocation,
                destination: dropoffLocation!,
                onlineStatus,
                vehicle: vehicle as Partial<IVehicle>,
                seatAvailable: seatsAvailable as number
            };
            const response = await updateOnlineStatus(payload);
            if (response?.status === "success") {
                dispatch(setDriverOnlineStatus(onlineStatus));
                return true;
            }
        } catch (err) {
            console.error(err);
        }
        return false;
    };

    const executeLogout = async () => {

        await logoutUser();
        await clearAllTokens();

        dispatch(reseITrip());
        dispatch(setUser({} as IUser));
        router.replace("/pages/user/UserSignin");
    };

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
            {/* Native-style Navigation Header with increased spacing */}
            <View style={styles.navHeader}>
                <TouchableOpacity
                    onPress={() => router.back()}
                    style={styles.backButton}
                    hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
                >
                    <Ionicons
                        name={Platform.OS === 'ios' ? "chevron-back" : "arrow-back"}
                        size={28}
                        color={themeColors.text}
                    />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: themeColors.text }]}>Account</Text>
                <View style={{ width: 44 }} />
            </View>

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.profileSection}>
                    <View style={styles.avatarContainer}>
                        <Ionicons name="person" size={44} color="#fff" />
                    </View>
                    <Text style={[styles.userName, { color: themeColors.text }]}>{user?.name}</Text>
                    <View style={styles.badge}>
                        <Text style={styles.badgeText}>{user?.role?.toUpperCase()}</Text>
                    </View>
                    <Text style={styles.userSubText}>{user?.email}</Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionLabel}>Profile Information</Text>
                    <View style={[styles.card, { backgroundColor: isDark ? "#1c1c1e" : "#fff" }]}>
                        <SettingRow icon="person" label="Profile" color="#f59e0b" onPress={() => router.push("/pages/setting/profile/Profile")} />
                        {user?.role === "driver" ? (<SettingRow icon="car" label="Vehicle Management" color="#8b5cf6" onPress={() => router.push("pages/management/vehicles/AddVehicles")} />) : null}

                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionLabel}>Payments & Verification</Text>
                    <View style={[styles.card, { backgroundColor: isDark ? "#1c1c1e" : "#fff" }]}>
                        <SettingRow
                            icon="business"
                            label="Payout Settings (Stripe)"
                            color="#10b981"
                            onPress={() => router.push("pages/setting/FinancialOnboarding")}
                            isLast={true}
                        />
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionLabel}>Navigation Preference</Text>
                    <View style={[styles.card, { backgroundColor: isDark ? "#1c1c1e" : "#fff" }]}>
                        <SettingRow
                            icon="logo-google"
                            label="Google Maps"
                            color="#4285F4"
                            onPress={() => handleUpdateNav("android")}
                            rightElement={user?.navigationMap === "android" && <Ionicons name="checkmark" size={22} color="#10b981" />}
                            isLast={Platform.OS !== 'ios'}
                        />
                        {Platform.OS === "ios" && (
                            <SettingRow
                                icon="map"
                                label="Apple Maps"
                                color="#007AFF"
                                onPress={() => handleUpdateNav("ios")}
                                rightElement={user?.navigationMap === "ios" && <Ionicons name="checkmark" size={22} color="#10b981" />}
                                isLast={true}
                            />
                        )}
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionLabel}>Trips and History</Text>
                    <View style={[styles.card, { backgroundColor: isDark ? "#1c1c1e" : "#fff" }]}>
                        <SettingRow icon="time" label="Trip History" color="#f59e0b" onPress={() => router.push("pages/trips/Trips")} />
                        <SettingRow
                            icon="log-out"
                            label="Logout"
                            color="#ef4444"
                            onPress={handleOnLogout}
                            isLast={true}
                            rightElement={<View />}
                        />
                    </View>
                </View>

                <View style={{ height: 40 }} />
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    mainWrapper: {
        flex: 1,
        // Push everything down based on platform needs
        paddingTop: SAFE_TOP_PADDING,
    },
    scrollContent: { paddingHorizontal: 16, paddingTop: 10 },
    navHeader: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 12,
        height: 56, // Standard header height
    },
    backButton: {
        width: 44,
        height: 44,
        alignItems: "center",
        justifyContent: "center",
    },
    headerTitle: {
        fontSize: Platform.OS === 'ios' ? 17 : 20,
        fontWeight: "700",
    },
    profileSection: {
        alignItems: "center",
        marginVertical: 24,
    },
    avatarContainer: {
        width: 90,
        height: 90,
        borderRadius: 45,
        backgroundColor: "#3b82f6",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 16,
        ...Platform.select({
            ios: { shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 8, shadowOffset: { width: 0, height: 4 } },
            android: { elevation: 4 },
        }),
    },
    userName: {
        fontSize: 22,
        fontWeight: "700",
        marginBottom: 4,
    },
    badge: {
        backgroundColor: "#3b82f615",
        paddingHorizontal: 10,
        paddingVertical: 3,
        borderRadius: 6,
        marginBottom: 8,
    },
    badgeText: {
        color: "#3b82f6",
        fontSize: 11,
        fontWeight: "700",
        letterSpacing: 0.5,
    },
    userSubText: {
        fontSize: 14,
        color: "#8e8e93",
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
        marginBottom: 8,
        letterSpacing: 0.3,
    },
    card: {
        borderRadius: 12,
        overflow: "hidden",
        ...Platform.select({
            ios: {
                borderWidth: StyleSheet.hairlineWidth,
                borderColor: "#c6c6c8",
            },
            android: {
                elevation: 2,
            },
        }),
    },
    row: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingVertical: 14, // Increased for better tap area
    },
    iconBg: {
        width: 32,
        height: 32,
        borderRadius: 8,
        alignItems: "center",
        justifyContent: "center",
        marginRight: 12,
    },
    rowLabel: {
        flex: 1,
        fontSize: 16,
        fontWeight: "400",
    },
    divider: {
        height: StyleSheet.hairlineWidth,
        marginLeft: 60,
    },
});

export default Account;