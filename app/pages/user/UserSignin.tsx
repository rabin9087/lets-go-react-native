import { clearAllTokens, storeTokens } from "@/app/axios/secureTokens";
import { serverReturnDataType } from "@/app/axios/types";
import { loginUser, pushNotificationToken } from "@/app/axios/user";
import { useAppDispatch } from "@/app/store/hooks";
import { setTempIdentifier, setUser } from "@/app/store/slices/user.slice";
import { getDeviceInfo } from "@/app/utils/device/getDeviceInfo";
import registerForPushNotificationsAsync from "@/app/utils/notifications/registerForPushNotifications";
import Colors from "@/constants/Colors";
import { Ionicons } from "@expo/vector-icons";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import React, { useEffect, useState, useMemo } from "react";
import * as SecureStore from "expo-secure-store";
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    useColorScheme,
    StatusBar,
    Switch,
    Modal,
    FlatList,
    LayoutAnimation
} from "react-native";
import countries from '../../utils/countries.json';
import { setIncomingRide, setNumberOfPassengers } from "@/app/store/slices/trip.slice";
import { setDriver } from "@/app/store/slices/driver.slice";
import { setActiveTrips } from "@/app/store/activeTrips.slice";
import { setOnlineDriver, setSeatsAvailable } from "@/app/store/slices/onlineDrivers.slice";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { connectSocket, disConnectSocket } from "@/app/utils/sockets/socket";

export function formatPhoneNumber(rawPhone: string, dialCode: string): string {
    let digits = rawPhone.replace(/\D/g, "");
    if (digits.startsWith("0")) digits = digits.slice(1);
    return `${dialCode}${digits}`;
}

const LoginForm = () => {
    const [input, setInput] = useState({ email_phone: "", password: "" });
    const [passwordVisible, setPasswordVisible] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");

    const [isCountryModalVisible, setIsCountryModalVisible] = useState(false);
    const [selectedCountry, setSelectedCountry] = useState(countries[0]);
    const [searchQuery, setSearchQuery] = useState("");

    const router = useRouter();
    const theme = useColorScheme() ?? "light";
    const themeColors = Colors[theme];
    const isDark = theme === "dark";
    const dispatch = useAppDispatch();

    // Determine if input is phone or email
    const isPhoneNumber = useMemo(() => /^\d/.test(input.email_phone), [input.email_phone]);

    const filteredCountries = useMemo(() => {
        return countries.filter((c) =>
            c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            c.dial_code.includes(searchQuery)
        );
    }, [searchQuery]);

    useEffect(() => {
        const init = async () => {
            try {
                const res = await fetch("https://get.geojs.io/v1/ip/geo.json");
                const geo = await res.json();
                const found = countries.find(c => c.name === geo.country);
                if (found) setSelectedCountry(found);
            } catch (e) { /* fallback to default */ }
        };
        init();
    }, []);

    const loginMutation = useMutation({
        mutationFn: async (payload: any) => {
            const device = await getDeviceInfo();
            const { rawId, ...serverPayload } = payload;
            const pushToken = await registerForPushNotificationsAsync();
            if (pushToken) {
                await storeTokens({ tokenName: "last_push_token", token: pushToken });
            }
            return await loginUser({ ...serverPayload, device, pushToken });
        },
        onSuccess: async (result: any, variables: any) => {
            const { status, message, data } = result as serverReturnDataType;

            if (status === "error" && message?.includes("Please enter the OTP")) {
                dispatch(setTempIdentifier(variables.email_phone));
                router.push(`/pages/user/VerifyOTP?otpTypes=Account_Verify&routeTo=/pages/user/UserSignin`);
                return;
            }

            if (status === "success" && data?.user?._id) {
                connectSocket(data?.user?._id as string, data?.user.role as string)
                try {
                    if (rememberMe) {
                        await SecureStore.setItemAsync("remembered_user", variables.rawId);
                        await SecureStore.setItemAsync("secure_password", variables.password);
                    }

                    if (data?.tokens) {
                        await storeTokens({ tokenName: "accessJWT", token: data.tokens.accessJWT });
                        await storeTokens({ tokenName: "refreshJWT", token: data.tokens.refreshJWT });
                        await storeTokens({ tokenName: "sessionId", token: data.tokens.sessionId });
                    }

                    const { user, driver, activeTrips, onlineDriver } = data;
                    dispatch(setUser(user));
                    if (driver) dispatch(setDriver(driver));

                    if (activeTrips?.[0]) {
                        dispatch(setIncomingRide(activeTrips[0]));
                        dispatch(setNumberOfPassengers(activeTrips[0].people || 1));
                        if (user.role === "rider") dispatch(setActiveTrips(activeTrips));
                    }

                    if (onlineDriver) {
                        dispatch(setOnlineDriver(onlineDriver));
                        dispatch(setSeatsAvailable(onlineDriver.seatAvailable || 4));
                    }
                    router.replace("/pages/home/Map");
                } catch (err) {
                    setErrorMsg("Failed to initialize session.");
                }
            } else {
                setErrorMsg(message || "Invalid credentials.");
                disConnectSocket()
                await clearAllTokens();
            }
        },
        onError: () => setErrorMsg("Server connection failed.")
    });

    const handleSubmit = () => {
        setErrorMsg("");
        const { email_phone, password } = input;
        if (!email_phone || !password) return setErrorMsg("All fields are required");

        const userId = isPhoneNumber
            ? formatPhoneNumber(email_phone, selectedCountry.dial_code)
            : email_phone.trim().toLowerCase();

        loginMutation.mutate({
            email_phone: userId,
            password,
            rawId: email_phone
        });
    };

    const handleInputChange = (v: string) => {
        // Smoothly animate the transition between icon and country code
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setInput(p => ({ ...p, email_phone: v }));
    };

    return (
        <View style={{ flex: 1, backgroundColor: themeColors.background }}>
            <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : undefined}
                style={{ flex: 1 }}
            >
                <ScrollView
                    contentContainerStyle={styles.scrollContainer}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    <View style={styles.headerArea}>
                        <Text style={[styles.welcomeText, { color: themeColors.text }]}>Welcome Back</Text>
                        <Text style={styles.subText}>Sign in to continue</Text>
                    </View>

                    <View style={[styles.card, { backgroundColor: isDark ? "#1C1C1E" : "#FFFFFF" }]}>
                        {/* EMAIL / PHONE INPUT - FIXED WIDTH ADDON PREVENTS SHAKING */}
                        <View style={[styles.inputContainer, { backgroundColor: isDark ? "#2C2C2E" : "#F2F2F7" }]}>
                            <View style={styles.leftAddon}>
                                {isPhoneNumber ? (
                                    <TouchableOpacity
                                        style={styles.countryTag}
                                        onPress={() => setIsCountryModalVisible(true)}
                                    >
                                        <Text style={styles.emoji}>{selectedCountry.emoji}</Text>
                                        <Text style={[styles.code, { color: themeColors.text }]}>{selectedCountry.dial_code}</Text>
                                        <Ionicons name="chevron-down" size={10} color="#8E8E93" />
                                    </TouchableOpacity>
                                ) : (
                                    <Ionicons name="person-outline" size={20} color={isDark ? "#8E8E93" : "#3A3A3C"} />
                                )}
                            </View>
                            <TextInput
                                placeholder="Email or Phone"
                                value={input.email_phone}
                                onChangeText={handleInputChange}
                                style={[styles.input, { color: themeColors.text }]}
                                placeholderTextColor="#8E8E93"
                                autoCapitalize="none"
                                keyboardType={"email-address"}
                            />
                        </View>

                        {/* PASSWORD INPUT */}
                        <View style={[styles.inputContainer, { backgroundColor: isDark ? "#2C2C2E" : "#F2F2F7" }]}>
                            <View style={styles.leftAddon}>
                                <Ionicons name="lock-closed-outline" size={20} color={isDark ? "#8E8E93" : "#3A3A3C"} />
                            </View>
                            <TextInput
                                placeholder="Password"
                                value={input.password}
                                onChangeText={(v) => setInput(p => ({ ...p, password: v }))}
                                secureTextEntry={!passwordVisible}
                                style={[styles.input, { color: themeColors.text }]}
                                placeholderTextColor="#8E8E93"
                            />
                            <TouchableOpacity onPress={() => setPasswordVisible(!passwordVisible)} style={styles.eyeBtn}>
                                <Ionicons name={passwordVisible ? "eye-off-outline" : "eye-outline"} size={22} color={themeColors.tint} />
                            </TouchableOpacity>
                        </View>

                        {errorMsg ? <Text style={styles.errorText}>{errorMsg}</Text> : null}

                        <View style={styles.utilRow}>
                            <View style={styles.rememberMeBox}>
                                <Switch
                                    value={rememberMe}
                                    onValueChange={setRememberMe}
                                    trackColor={{ true: themeColors.backgroundPrimary }}
                                    style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }}
                                />
                                <Text style={[styles.rememberMeText, { color: isDark ? "#8E8E93" : "#3A3A3C" }]}>Remember Me</Text>
                            </View>
                            <TouchableOpacity onPress={() => router.push("pages/user/ForgotPassword")}>
                                <Text style={[styles.forgotPassText, { color: themeColors.tint }]}>Forgot Password?</Text>
                            </TouchableOpacity>
                        </View>

                        <TouchableOpacity
                            onPress={handleSubmit}
                            style={[styles.loginButton, { backgroundColor: themeColors.backgroundPrimary }]}
                            disabled={loginMutation.isPending}
                        >
                            {loginMutation.isPending ? (
                                <ActivityIndicator color="#FFF" />
                            ) : (
                                <Text style={styles.loginButtonText}>Login</Text>
                            )}
                        </TouchableOpacity>

                        <View style={styles.signupContainer}>
                            <Text style={[styles.noAccountText, { color: isDark ? "#8E8E93" : "#3A3A3C" }]}>Don't have an account?</Text>
                            <TouchableOpacity onPress={() => router.push("pages/user/UserSignup")}>
                                <Text style={[styles.signupText, { color: themeColors.tint }]}> Sign Up</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>

            <Modal visible={isCountryModalVisible} animationType="slide">
                <View style={[styles.modalBox, { backgroundColor: themeColors.background }]}>
                    <View style={styles.modalHeader}>
                        <Text style={[styles.modalTitle, { color: themeColors.text }]}>Select Country</Text>
                        <TouchableOpacity onPress={() => setIsCountryModalVisible(false)}>
                            <Ionicons name="close-circle" size={32} color={themeColors.text} />
                        </TouchableOpacity>
                    </View>
                    <TextInput
                        placeholder="Search country..."
                        style={[styles.searchBar, { backgroundColor: isDark ? "#1C1C1E" : "#F2F2F7", color: themeColors.text }]}
                        onChangeText={setSearchQuery}
                        placeholderTextColor="#8E8E93"
                    />
                    <FlatList
                        data={filteredCountries}
                        keyExtractor={(item) => item.code}
                        renderItem={({ item }) => (
                            <TouchableOpacity
                                style={styles.countryRow}
                                onPress={() => { setSelectedCountry(item); setIsCountryModalVisible(false); }}
                            >
                                <Text style={styles.countryEmoji}>{item.emoji}</Text>
                                <Text style={[styles.countryLabel, { color: themeColors.text }]}>{item.name}</Text>
                                <Text style={{ color: "#8E8E93" }}>{item.dial_code}</Text>
                            </TouchableOpacity>
                        )}
                    />
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    scrollContainer: { flexGrow: 1, paddingHorizontal: 24, justifyContent: 'center', paddingBottom: 40 },
    headerArea: { marginBottom: 32 },
    welcomeText: { fontSize: 32, fontWeight: "800", letterSpacing: -0.5 },
    subText: { fontSize: 16, color: "#8E8E93", marginTop: 4 },
    card: {
        padding: 24, borderRadius: 24,
        ...Platform.select({
            ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.1, shadowRadius: 12 },
            android: { elevation: 4 },
        }),
    },
    inputContainer: {
        flexDirection: "row",
        alignItems: "center",
        borderRadius: 16,
        paddingLeft: 4, // Padding moved to leftAddon internal
        paddingRight: 16,
        height: 62,
        marginBottom: 16
    },
    leftAddon: {
        width: 80, // Fixed width prevents the text input from jumping
        alignItems: 'center',
        justifyContent: 'center',
    },
    input: { flex: 1, fontSize: 16, fontWeight: "500" },
    countryTag: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderRightWidth: 1,
        borderRightColor: 'rgba(142, 142, 147, 0.2)',
        paddingRight: 8
    },
    emoji: { fontSize: 18, marginRight: 4 },
    code: { fontWeight: '700', fontSize: 14, marginRight: 2 },
    eyeBtn: { padding: 4 },
    utilRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
    rememberMeBox: { flexDirection: 'row', alignItems: 'center' },
    rememberMeText: { marginLeft: 4, fontSize: 14, fontWeight: '500' },
    forgotPassText: { fontWeight: "600", fontSize: 14 },
    loginButton: { height: 58, borderRadius: 18, justifyContent: "center", alignItems: "center", marginBottom: 20 },
    loginButtonText: { color: "#FFF", fontSize: 18, fontWeight: "700" },
    errorText: { color: "#FF3B30", textAlign: "center", marginBottom: 16, fontWeight: "500" },
    signupContainer: { flexDirection: "row", justifyContent: "center", alignItems: "center" },
    noAccountText: { fontSize: 15 },
    signupText: { fontSize: 15, fontWeight: "700" },
    modalBox: { flex: 1, padding: 25, paddingTop: 60 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    modalTitle: { fontSize: 22, fontWeight: '800' },
    searchBar: { height: 50, borderRadius: 15, paddingHorizontal: 15, marginBottom: 15 },
    countryRow: { flexDirection: 'row', paddingVertical: 18, borderBottomWidth: 1, borderBottomColor: '#EEE', alignItems: 'center' },
    countryEmoji: { fontSize: 24, marginRight: 15 },
    countryLabel: { flex: 1, fontSize: 16, fontWeight: '600' }
});

export default LoginForm;