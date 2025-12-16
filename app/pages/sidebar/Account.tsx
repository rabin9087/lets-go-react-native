import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import {
    Alert,
    Platform,
    StyleSheet,
    TouchableOpacity,
    ViewStyle,
} from "react-native";

import { Text, View } from "@/components/Themed";
import { useColorScheme } from "@/components/useColorScheme";
import Colors from "@/constants/Colors";
import { useAppDispatch, useAppSelector } from "@/app/store/hooks";
import { setDriverOnlineStatus, setNavigationApp, setUser } from "@/app/store/slices/user.slice";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { logoutUser } from "@/app/axios/user";
import { IUser } from "../user/user.types";
import { IUpdateOnlineStatus, updateOnlineStatus } from "@/app/axios/driver";
import Toast from "react-native-toast-message";

const Account = () => {
    const theme = useColorScheme() ?? "light";
    const router = useRouter();
    const dispatch = useAppDispatch();

    const { user, navigationApp } = useAppSelector(
        (s) => s.userInfo
    );
    const { pickupLocation, dropupLocation, seatAvailable } = useAppSelector(
        (s) => s.tripInfo
    );

    const handleOnGoOnline = async(onlineStatus: boolean) => {
        console.log("Setting online status:", onlineStatus);
        const payload: IUpdateOnlineStatus = {
            currentLocation: pickupLocation,
            destination: dropupLocation!,
            email_phone: user.phone!,
            onlineStatus,
            rego: user?.driverProfile?.vehicle?.rego,
            seatAvailable
        };
        // You can call your API here to go offline
        const response =  await updateOnlineStatus(payload);
        if (response?.status === "success") {
            dispatch(setDriverOnlineStatus(onlineStatus));
            Toast.show({
                type: "success",
                text1: `You are now ${onlineStatus ? "Online" : "Offline"}`,
            });
        }
    };



    const handleOnLogout = async () => {

        try {
            // If driver is online, ask them to go offline first
            if (user?.driverProfile?.isOnline) {
                Alert.alert(
                    "Go Offline",
                    "You are currently online. Do you want to go offline before logging out?",
                    [
                        {
                            text: "Cancel",
                            style: "cancel",
                        },
                        {
                            text: "Go Offline",
                            onPress: () => {
                                handleOnGoOnline(false);
                            },
                        },
                    ]
                );
                return; // stop logout until they go offline
            }

            // Clear user state
            dispatch(setUser({} as IUser));

            // Logout from backend if refresh token exists
            const refreshJWT = await AsyncStorage.getItem("refreshJWT");
            if (refreshJWT) {
                await logoutUser();
            }

            // Remove tokens from AsyncStorage
            await AsyncStorage.removeItem("accessJWT");
            await AsyncStorage.removeItem("refreshJWT");

            // Navigate to login page
            router.replace("/pages/user/UserSignin");
        } catch (error) {
            console.error("Logout failed:", error);
        }
    };

    return (
        <View style={styles.container}>
            {/* ---------------- HEADER ---------------- */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Ionicons
                        name="arrow-back"
                        size={26}
                        color={Colors[theme].text}
                    />
                </TouchableOpacity>
                <Text style={styles.title}>Account</Text>
            </View>

            {/* ---------------- USER CARD ---------------- */}
            <View
                style={[
                    styles.card,
                    styles.shadow,
                    { backgroundColor: Colors[theme].card },
                ]}
            >
                <View style={styles.avatar}>
                    <Ionicons name="person" size={36} color="#fff" />
                </View>

                <Text style={styles.name}>{user?.name ?? "User"}</Text>
                <Text style={styles.sub}>{user?.phone}</Text>
                <Text style={styles.sub}>{user?.email}</Text>

                {pickupLocation?.address && (
                    <View style={styles.addressRow}>
                        <Ionicons
                            name="location-outline"
                            size={16}
                            color={Colors[theme].text}
                        />
                        <Text style={styles.address}>
                            {pickupLocation.address}
                        </Text>
                    </View>
                )}
            </View>

            {/* ---------------- NAVIGATION SETTINGS ---------------- */}
            <Text style={styles.sectionTitle}>
                Navigation Preference
            </Text>

            <View
                style={[
                    styles.card,
                    styles.shadow,
                    { backgroundColor: Colors[theme].card },
                ]}
            >
                {/* Google Maps */}
                <TouchableOpacity
                    style={styles.optionRow}
                    onPress={() => dispatch(setNavigationApp("google"))}
                >
                    <Ionicons
                        name="logo-google"
                        size={22}
                        color={Colors[theme].tint}
                    />
                    <Text style={styles.optionText}>Google Maps</Text>
                    {navigationApp === "google" && (
                        <Ionicons
                            name="checkmark-circle"
                            size={22}
                            color={Colors[theme].tint}
                        />
                    )}
                </TouchableOpacity>

                {/* Apple Maps (iOS only visually, but still selectable) */}
                <TouchableOpacity
                    style={styles.optionRow}
                    onPress={() => dispatch(setNavigationApp("apple"))}
                >
                    <Ionicons
                        name="map"
                        size={22}
                        color={Colors[theme].tint}
                    />
                    <Text style={styles.optionText}>Apple Maps</Text>
                    {navigationApp === "apple" && (
                        <Ionicons
                            name="checkmark-circle"
                            size={22}
                            color={Colors[theme].tint}
                        />
                    )}
                </TouchableOpacity>
            </View>

            {/* ---------------- MORE SETTINGS ---------------- */}
            <Text style={styles.sectionTitle}>More</Text>

            <View
                style={[
                    styles.card,
                    styles.shadow,
                    { backgroundColor: Colors[theme].card },
                ]}
            >
                <TouchableOpacity style={styles.optionRow}>
                    <Ionicons name="time-outline" size={22} />
                    <Text style={styles.optionText}>Trip History</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.optionRow}>
                    <Ionicons name="card-outline" size={22} />
                    <Text style={styles.optionText}>Payment Methods</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.optionRow}
                    onPress={handleOnLogout}>
                    <Ionicons name="log-out-outline" size={22} color="#ef4444" />
                    <Text style={[styles.optionText, { color: "#ef4444" }]}>
                        Logout
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

export default Account;

/* ---------------- STYLES ---------------- */

const styles = StyleSheet.create({
    container: { flex: 1, paddingHorizontal: 16 },
    header: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        marginVertical: 14,
    },
    title: { fontSize: 24, fontWeight: "800" },

    sectionTitle: {
        fontSize: 14,
        opacity: 0.7,
        marginVertical: 8,
        marginLeft: 4,
    },

    card: {
        borderRadius: 18,
        padding: 16,
        marginBottom: 16,
    },

    shadow: Platform.select({
        ios: {
            shadowColor: "#000",
            shadowOpacity: 0.08,
            shadowRadius: 12,
            shadowOffset: { width: 0, height: 6 },
        },
        android: { elevation: 4 },
    }) as ViewStyle,

    avatar: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: "#3b82f6",
        alignItems: "center",
        justifyContent: "center",
        alignSelf: "center",
        marginBottom: 8,
    },

    name: {
        fontSize: 18,
        fontWeight: "700",
        textAlign: "center",
    },
    sub: {
        fontSize: 14,
        opacity: 0.7,
        textAlign: "center",
        marginTop: 2,
    },

    addressRow: {
        flexDirection: "row",
        gap: 6,
        marginTop: 10,
        alignItems: "center",
        justifyContent: "center",
    },
    address: {
        fontSize: 13,
        opacity: 0.8,
        textAlign: "center",
        flexShrink: 1,
    },

    optionRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        paddingVertical: 14,
    },
    optionText: {
        flex: 1,
        fontSize: 16,
        fontWeight: "600",
    },
});
