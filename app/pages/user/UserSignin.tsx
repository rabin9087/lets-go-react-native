import { autoLoginUser, loginUser } from "@/app/axios/user";
import { useAppDispatch, useAppSelector } from "@/app/store/hooks";
import { setUser } from "@/app/store/slices/user.slice";
import Colors from "@/constants/Colors";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    useColorScheme,
} from "react-native";
import { IUser } from "./user.types";
import { IResponse } from "@/app/axios/types";

export interface ILoginPayload {
    email_phone: string;
    password: string;
}

const useLogin = () =>
    useMutation<IResponse, Error, ILoginPayload>({
        mutationFn: async (data: ILoginPayload) => {
            const res = await loginUser(data);

            if (!res) {
                throw new Error("Login failed: no response from server");
            }

            return res; // now TypeScript knows res is IUserLogin
        },
    });


const LoginForm = () => {
    const [input, setInput] = React.useState({
        email_phone: "",
        password: "",
    });
    const [errorMsg, setErrorMsg] = React.useState("");
    // const dispatch = useAppDispatch()
    const router = useRouter();
    const theme = useColorScheme() ?? "light";
    const themeColors = Colors[theme];
    const dispatch = useAppDispatch();
    const { user } = useAppSelector(s => s.userInfo)
    const loginMutation = useLogin();
    const handleChange = (key: keyof typeof input, value: string) => {
        setInput((prev) => ({ ...prev, [key]: value }));
    };

    const [passwordVisible, setPasswordVisible ] = useState<boolean>(false)

    const handleSubmit = () => {
        setErrorMsg("");

        const { email_phone, password } = input;

        if (!email_phone || !password) {
            setErrorMsg("All fields are required.");
            return;
        }

        loginMutation.mutate(input, {
            onSuccess: async (data: IResponse) => {

                // 1. Save user in Redux
                dispatch(setUser(data.user as IUser));
                // 2. Save tokens in storage
                if (data?.tokens?.accessJWT && data?.tokens?.refreshJWT) {
                    await AsyncStorage.setItem("accessJWT", data.tokens.accessJWT as string);
                    await AsyncStorage.setItem("refreshJWT", data.tokens.refreshJWT as string);
                }

                if (data.user as IUser) {
                    // 3. Navigate to Map page (or any protected page)
                    data.user?._id && router.replace("/pages/home/Map");
                }
            },
            onError: (err: any) => {
                setErrorMsg(err?.response?.data?.message || "Login failed");
            },
        });
    };

    useEffect(() => {
        const checkAutoLogin = async () => {
            try {
                if (user?._id) {
                    return router.replace("/pages/home/Map");
                }
                const refreshJWT = await AsyncStorage.getItem("refreshJWT");

                if (refreshJWT) {
                    const user = await autoLoginUser(); // should call your API to verify refresh token
                    if (user?.status === "success") {
                        dispatch(setUser(user.data?.user as IUser));
                        if (user.accessJWT) {
                            await AsyncStorage.setItem("accessJWT", user.accessJWT as string);
                        }
                        router.replace("/pages/home/Map");
                    }
                }
            } catch (error) {
                console.error("Auto login failed:", error);
            }
        };

        checkAutoLogin();
    }, [dispatch, router]);

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
                            { f.isPassword &&
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

                    <TouchableOpacity
                        onPress={handleSubmit}
                        disabled={loginMutation.isPending}
                        style={{
                            backgroundColor: loginMutation.isPending
                                ? theme === "dark"
                                    ? "#444"
                                    : "#ccc"
                                : themeColors.tint,
                            paddingVertical: 14,
                            borderRadius: 14,
                            marginTop: 10,
                        }}
                    >
                        <Text
                            style={{
                                textAlign: "center",
                                color: theme === "dark"
                                    ? "#444"
                                    : "#ccc",
                                fontWeight: "600",
                                fontSize: 18,
                            }}
                        >
                            {loginMutation.isPending ? "Logging in..." : "Login"}
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={() => {
                            router.push("pages/user/UserSignup");
                        }}
                    >
                        <Text style={{ color: "green", textAlign: "center", marginTop: 12 }}>Sign up</Text>
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
