import { createUser } from "@/app/axios/user";
import Colors from "@/constants/Colors";
import { Ionicons } from "@expo/vector-icons";
import { useMutation } from "@tanstack/react-query";
import React, { useState } from "react";
import {
    Text,
    TextInput,
    TouchableOpacity,
    View,
    useColorScheme,
    KeyboardAvoidingView,
    ScrollView,
    Platform,
} from "react-native";
import { IUser } from "./user.types";
import { useRouter } from "expo-router";

const useCreateUser = () =>
    
    useMutation({
        mutationFn: async (data: Partial<IUser>) => {
            const res = await createUser(data);
            return res;
        },
    });

const CreateUserForm = () => {
    const [userInput, setUserInput] = React.useState({
        name: "",
        email: "",
        phone: "",
        password: "",
        confirmPassword: "",
    });

    const router = useRouter();
    const [passwordVisible, setPasswordVisible] = useState<boolean>(true)


    const [errorMsg, setErrorMsg] = React.useState("");

    const createUserMutation = useCreateUser();
    const theme = useColorScheme() ?? "light";
    const themeColors = Colors[theme];

    const handleChange = (key: keyof typeof userInput, value: string) => {
        setUserInput((prev) => ({
            ...prev,
            [key]: value,
        }));
    };

    const handleSubmit = async() => {
        setErrorMsg("");

        const { name, email, phone, password, confirmPassword } = userInput;

        if (!name || !email || !phone || !password || !confirmPassword) {
            setErrorMsg("All fields are required.");
            return;
        }

        if (password !== confirmPassword) {
            setErrorMsg("Passwords do not match.");
            return;
        }

        const payload: Partial<IUser> = {
            name,
            phone,
            email,
            password,
            role: "rider",
            status: "active",
        };

        const res = await createUserMutation.mutate(payload);
        // if (res?.status === "success") {
        //     router.replace("/pages/user/Usersignin");
        // }
    };

    const fields = [
        {
            key: "name",
            icon: "person-outline",
            placeholder: "Full Name",
        },
        {
            key: "email",
            icon: "mail-outline",
            placeholder: "Email Address",
            keyboardType: "email-address",
        },
        {
            key: "phone",
            icon: "call-outline",
            placeholder: "Phone Number",
            keyboardType: "phone-pad",
        },
        {
            key: "role",
            icon: "person",
            placeholder: "Role"
        },
        {
            key: "password",
            icon: "lock-closed-outline",
            placeholder: "Password",
            secureTextEntry: true,
            isPassword: true
        },
        {
            key: "confirmPassword",
            icon: "lock-closed-outline",
            placeholder: "Confirm Password",
            secureTextEntry: true,
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
                    backgroundColor: themeColors.background,
                    justifyContent: "center",
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
                        Create New User
                    </Text>

                    {/* INPUTS */}
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
                                value={userInput[f.key as keyof typeof userInput]} // ✅ cast key to keyof
                                onChangeText={(v) =>
                                    handleChange(f.key as keyof typeof userInput, v)
                                }
                                placeholderTextColor={theme === "dark" ? "#888" : "#999"}
                                keyboardType={f.keyboardType as
                                    | "default"
                                    | "email-address"
                                    | "numeric"
                                    | "phone-pad"
                                    | "number-pad"
                                    | "decimal-pad"
                                    | "url"
                                    | "ascii-capable"
                                    | "numbers-and-punctuation"
                                    | "name-phone-pad"
                                    | "visible-password"
                                    | "twitter"
                                    | "web-search"
                                    | undefined} // ✅ cast to correct type
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
                        <Text
                            style={{
                                color: "red",
                                textAlign: "center",
                                marginBottom: 12,
                            }}
                        >
                            {errorMsg}
                        </Text>
                    ) : null}

                    <TouchableOpacity
                        onPress={handleSubmit}
                        disabled={createUserMutation.isPending}
                        style={{
                            backgroundColor: createUserMutation.isPending
                                ? theme === "dark"
                                    ? "#444" // disabled dark mode
                                    : "#ccc" // disabled light mode
                                : themeColors.tint, // THEME-BASED PRIMARY COLOR
                            paddingVertical: 14,
                            borderRadius: 14,
                            marginTop: 10,
                        }}
                    >
                        <Text
                            style={{
                                textAlign: "center",
                                color: theme === "dark" ? "#888" : "#999",
                                fontWeight: "600",
                                fontSize: 18,
                            }}
                        >
                            {createUserMutation.isPending ? "Creating..." : "Create User"}
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={() => {
                            router.push("pages/user/UserSignin");
                        }}
                    >
                        <Text style={{ color: "green", textAlign: "center", marginTop: 12 }}>Sign in</Text>
                    </TouchableOpacity>

                    {createUserMutation.isSuccess && (
                        <Text
                            style={{
                                color: "green",
                                textAlign: "center",
                                marginTop: 12,
                            }}
                        >
                            User created successfully!
                        </Text>
                    )}

                    {createUserMutation.isError && (
                        <Text
                            style={{
                                color: "red",
                                textAlign: "center",
                                marginTop: 12,
                            }}
                        >
                            Failed to create user
                        </Text>
                    )}
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

export default CreateUserForm;
