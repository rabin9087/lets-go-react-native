import { IResponse } from "@/app/axios/types";
import { autoLoginUser, loginUser, pushNotificationToken } from "@/app/axios/user";
import { useAppDispatch, useAppSelector } from "@/app/store/hooks";
import { setDriversCurrentLocations, setDriversDestinationLocations } from "@/app/store/slices/onlineDrivers.slice";
import { IIncomingRide, ILocation, setDropoffLocation, setIncomingRide, setPickedup, setPickupLocation } from "@/app/store/slices/trip.slice";
import { setUser } from "@/app/store/slices/user.slice";
import { tripJoinSocket } from "@/app/utils/sockets/rider.socket";
import { socket } from "@/app/utils/sockets/socket";
import Colors from "@/constants/Colors";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useMutation } from "@tanstack/react-query";
import * as SecureStore from "expo-secure-store";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, TouchableOpacity, View, useColorScheme} from "react-native";
import { IUser } from "./user.types";
import registerForPushNotificationsAsync from "@/app/utils/notifications/registerForPushNotifications";

export interface ILoginPayload {
    email_phone: string;
    password: string;
}

const useLogin = () =>
    useMutation<IResponse, Error, ILoginPayload>({
        mutationFn: async (data) => {
            const res = await loginUser(data);
            if (!res) throw new Error("Login failed");
            return res;
        },
    });

const LoginForm = () => {
    const [input, setInput] = React.useState({ email_phone: "", password: "" });
    const [errorMsg, setErrorMsg] = React.useState("");
    const router = useRouter();
    const theme = useColorScheme() ?? "light";
    const themeColors = Colors[theme];
    const dispatch = useAppDispatch();
    const { user } = useAppSelector(s => s.userInfo)
    const loginMutation = useLogin();
    const handleChange = (key: keyof typeof input, value: string) => {
        setInput((prev) => ({ ...prev, [key]: value }));
    };

    const [passwordVisible, setPasswordVisible] = useState<boolean>(false)

    const handleSubmit = () => {
        setErrorMsg("");
        const { email_phone, password } = input;

        if (!email_phone || !password) {
            setErrorMsg("All fields are required");
            return;
        }

        loginMutation.mutate(input, {
            onSuccess: async (data) => {
                dispatch(setUser(data.user as IUser));

                if (data.tokens?.accessJWT && data.tokens?.refreshJWT) {
                    await SecureStore.setItemAsync("accessJWT", data.tokens.accessJWT);
                    await SecureStore.setItemAsync("refreshJWT", data.tokens.refreshJWT);
                }

                router.replace("/pages/home/Map");
                const token = await registerForPushNotificationsAsync(); // token: string | undefined

                if (token) {
                    await pushNotificationToken({ token }); // ✅ pass as object
                } else {
                    console.log("No push token obtained");
                }
            },
            onError: (err: any) => {
                setErrorMsg(err?.response?.data?.message || "Login failed");
            },
        });
    };

    const handleAutoLogin = async () => {
        try {
            const refreshJWT = await AsyncStorage.getItem("refreshJWT");
            if (!refreshJWT) return;

            const res = await autoLoginUser();
            console.log("AUTO LOGIN RES:", res);

            if (res?.status === "success" && res?.data?.user?._id) {

                dispatch(setUser(res?.data?.user as IUser));
                if (res.data.user.currentTrip) {
                    tripJoinSocket(res.data.user.currentTrip?._id as string, user?.role as string)
                    socket.emit("trip:join", { tripId: res.data.user.currentTrip?._id }, res.data.user?.role); dispatch(setIncomingRide(res?.data?.user?.currentTrip as IIncomingRide))
                    if (res?.data?.user?.role === "rider") {
                        dispatch(setPickupLocation(res?.data?.user?.currentTrip?.pickupLocation as ILocation))
                        dispatch(setDropoffLocation(res?.data?.user?.currentTrip?.dropoffLocation as ILocation))
                    }
                    if (res?.data?.user?.role === "driver") {
                        dispatch(setDriversCurrentLocations(res?.data?.driver?.currentLocation as ILocation))
                        dispatch(setDriversDestinationLocations(res?.data?.driver?.destination as ILocation))
                    }
                    if (res.data.user.currentTrip.status === "ontrip") {
                        dispatch(setPickedup(false))
                    }
                    if (res.data.user.currentTrip.status === "pickedup") {
                        dispatch(setPickedup(true))
                    }
                }
                if (res?.data.tokens?.accessJWT) {
                    await AsyncStorage.setItem("accessJWT", res.data.tokens.accessJWT);
                }

                router.replace("/pages/home/Map");
            }
        } catch (err) {
            console.log("Auto-login failed");
            await SecureStore.deleteItemAsync("accessJWT");
            await SecureStore.deleteItemAsync("refreshJWT");
        }
    };

    useEffect(() => {
        if (!user?._id) {
            handleAutoLogin();
        } else {
            router.replace("/pages/home/Map");

        }
    }, []);

    const fields = [
        {
            key: "email_phone",
            icon: "mail-outline",
            placeholder: "Email or Phone",
            keyboardType: "email-address",
        },
        {
            key: "password",
            icon: "lock-closed-outline",
            placeholder: "Password",
            secureTextEntry: passwordVisible,
            isPassword: true
        },
    ];

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={{ flex: 1 }}
        >
            <ScrollView
                contentContainerStyle={{
                    flexGrow: 1,
                    padding: 24,
                    justifyContent: "center",
                    backgroundColor: themeColors.background,
                }}
                keyboardShouldPersistTaps="handled"
            >
                <View
                    style={{
                        backgroundColor: theme === "dark" ? "#111" : "#fff",
                        padding: 24,
                        borderRadius: 20,
                        shadowColor: "#000",
                        shadowOpacity: 0.15,
                        shadowOffset: { width: 0, height: 4 },
                        shadowRadius: 10,
                        elevation: 6,
                    }}
                >
                    <Text
                        style={{
                            fontSize: 26,
                            fontWeight: "700",
                            color: themeColors.text,
                            marginBottom: 22,
                            textAlign: "center",
                        }}
                    >
                        Login
                    </Text>

                    {fields.map((f, index) => (
                        <View
                            key={index}
                            style={{
                                flexDirection: "row",
                                alignItems: "center",
                                borderWidth: 1,
                                borderColor: theme === "dark" ? "#333" : "#ddd",
                                backgroundColor:
                                    theme === "dark" ? "#1a1a1a" : "#f9f9f9",
                                borderRadius: 14,
                                paddingHorizontal: 12,
                                paddingVertical: 10,
                                marginBottom: 12,
                            }}
                        >
                            <Ionicons
                                name={f.icon as any}
                                size={20}
                                color={themeColors.tint}
                            />
                            <TextInput
                                placeholder={f.placeholder}
                                value={input[f.key as keyof typeof input]}
                                onChangeText={(v) =>
                                    handleChange(f.key as keyof typeof input, v)
                                }
                                placeholderTextColor={theme === "dark" ? "#888" : "#999"}
                                keyboardType={f.keyboardType as any}
                                secureTextEntry={f.isPassword ? !passwordVisible : false}
                                style={{
                                    marginLeft: 10,
                                    flex: 1,
                                    color: themeColors.text,
                                    fontSize: 16,
                                }}
                            />
                            {/* Eye Icon (only for password) */}
                            {f.isPassword &&
                                <TouchableOpacity
                                    onPress={() => setPasswordVisible(prev => !prev)}
                                    style={{ paddingLeft: 10 }}
                                >
                                    <Ionicons
                                        name={passwordVisible ? "eye-outline" : "eye-off-outline"}
                                        size={22}
                                        color={themeColors.tint}
                                    />
                                </TouchableOpacity>}

                        </View>
                    ))}

                    {errorMsg ? (
                        <Text style={{ color: "red", textAlign: "center", marginBottom: 12 }}>
                            {errorMsg}
                        </Text>
                    ) : null}

                    {/* SUBMIT */}
                    <TouchableOpacity
                        onPress={handleSubmit}
                        disabled={loginMutation.isPending}
                        style={{
                            backgroundColor: Colors[theme].backgroundPrimary,
                            // selectedRole === "driver" ? "#1976D2" : "#4CAF50",
                            paddingVertical: 14,
                            borderRadius: 14,
                            marginTop: 16,
                        }}
                    >
                        {loginMutation.isPending ? <ActivityIndicator color={theme ? "#000" : "#fff"} /> : <Text
                            style={{
                                textAlign: "center",
                                fontSize: 18,
                                fontWeight: "600",
                                color: "#fff",
                            }}
                        >
                            Create Account
                        </Text>}
                    </TouchableOpacity>

                    <TouchableOpacity onPress={() => router.push("pages/user/UserSignup")}>
                        <Text
                            style={{
                                textAlign: "center",
                                marginTop: 14,
                                color: themeColors.tint,
                                textDecorationLine: "underline",
                            }}
                        >
                            Don't have an account? Signup
                        </Text>
                    </TouchableOpacity>

                    {loginMutation.isSuccess && (
                        <Text
                            style={{ color: "green", textAlign: "center", marginTop: 12 }}
                        >
                            Logged in successfully!
                        </Text>
                    )}

                    {loginMutation.isError && !errorMsg && (
                        <Text
                            style={{ color: "red", textAlign: "center", marginTop: 12 }}
                        >
                            Failed to login
                        </Text>
                    )}
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

export default LoginForm;
