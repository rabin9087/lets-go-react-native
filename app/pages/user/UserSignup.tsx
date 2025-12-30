import { createUser } from "@/app/axios/user";
import Colors from "@/constants/Colors";
import { Ionicons } from "@expo/vector-icons";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import React, { useState } from "react";
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
import Toast from "react-native-toast-message";

/* -------------------- TYPES -------------------- */
type Role = "rider" | "driver";

type UserInput = {
    name: string;
    email: string;
    phone: string;
    password: string;
    confirmPassword: string;

    vehicleRego: string;
    licenceNumber: string;
    vehicleType: string;
};

type InputProps = {
    icon: keyof typeof Ionicons.glyphMap;
    placeholder: string;
    fieldKey: keyof UserInput;
    value: string;
    onChange: (key: keyof UserInput, value: string) => void;
    keyboardType?: any;
    secure?: boolean;
    passwordVisible?: boolean;
    togglePassword?: () => void;
    theme: "light" | "dark";
    themeColors: any;
};

type CommonFieldConfig = {
    fieldKey: keyof UserInput;
    icon: keyof typeof Ionicons.glyphMap;
    placeholder: string;
    keyboardType?: any;
};

/* -------------------- API HOOK -------------------- */
const useCreateUser = () =>
    useMutation({
        mutationFn: async (data: Partial<IUser>) => createUser(data),
    });

/* -------------------- COMPONENT -------------------- */
const CreateUserForm = () => {
    const theme = useColorScheme() ?? "light";
    const themeColors = Colors[theme];
    const router = useRouter();

    const [selectedRole, setSelectedRole] = useState<Role>("rider");
    const [passwordVisible, setPasswordVisible] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");

    const [userInput, setUserInput] = useState<UserInput>({
        name: "",
        email: "",
        phone: "",
        password: "",
        confirmPassword: "",
        vehicleRego: "",
        licenceNumber: "",
        vehicleType: "",
    });

    const COMMON_FIELDS: CommonFieldConfig[] = [
        {
            fieldKey: "name",
            icon: "person-outline",
            placeholder: "Full Name",
        },
        {
            fieldKey: "email",
            icon: "mail-outline",
            placeholder: "Email Address",
            keyboardType: "email-address",
        },
        {
            fieldKey: "phone",
            icon: "call-outline",
            placeholder: "Phone Number",
            keyboardType: "phone-pad",
        },
    ];


    const createUserMutation = useCreateUser();

    const handleChange = (key: keyof UserInput, value: string) => {
        setUserInput(prev => ({ ...prev, [key]: value }));
    };

    /* -------------------- SUBMIT -------------------- */
    const handleSubmit = async () => {
        setErrorMsg("");

        const {
            name,
            email,
            phone,
            password,
            confirmPassword,
            vehicleRego,
            licenceNumber,
            vehicleType,
        } = userInput;

        if (!name || !email || !phone || !password || !confirmPassword) {
            setErrorMsg("All fields are required.");
            return;
        }

        if (password !== confirmPassword) {
            setErrorMsg("Passwords do not match.");
            return;
        }

        if (
            selectedRole === "driver" &&
            (!vehicleRego || !licenceNumber || !vehicleType)
        ) {
            setErrorMsg("All driver details are required.");
            return;
        }

        const payload: Partial<IUser> = {
            name,
            email,
            phone,
            password,
            role: selectedRole,
            status: "active",
            ...(selectedRole === "driver" && {
                vehicleRego,
                licenceNumber,
                vehicleType,
            }),
        };
        try {
            const response = await createUserMutation.mutateAsync(payload);

            if (response?.status === "success") {
                // Navigate to SignIn page on success
                router.replace("pages/user/UserSignin");
                Toast.show({
                    type: "success",
                    text1: "Account Created Successfully\n",
                    text2: "Please Login now "
                })
            } else {
                // Show error message if API returns failure
                setErrorMsg(response?.message || "Failed to create account.");
            }
        } catch (error: any) {
            // Catch network or unexpected errors
            setErrorMsg(error?.response?.data?.message || error?.message || "An error occurred.");
        }
    };

    /* -------------------- UI -------------------- */
    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={{ flex: 1 }}
        >
            <ScrollView
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={{
                    flexGrow: 1,
                    padding: 24,
                    justifyContent: "center",
                    backgroundColor: themeColors.background,
                }}
            >
                {/* FORM CARD */}
                <View
                    style={{
                        backgroundColor: themeColors.card,
                        padding: 24,
                        borderRadius: 20,
                        elevation: 6,
                    }}
                >
                    {/* TITLE (FIXED) */}
                    <Text
                        style={{
                            fontSize: 26,
                            fontWeight: "700",
                            textAlign: "center",
                            marginBottom: 16,
                            color: themeColors.text,
                        }}
                    >
                        Create Account
                    </Text>

                    {/* ROLE TOGGLE (FIXED POSITION) */}
                    <View
                        style={{
                            flexDirection: "row",
                            borderRadius: 14,
                            overflow: "hidden",
                            marginBottom: 20,
                        }}
                    >
                        {(["rider", "driver"] as Role[]).map(role => {
                            const isActive = selectedRole === role;

                            const bgColor =
                                role === "rider"
                                    ? isActive
                                        ? Colors[theme].backgroundPrimary
                                        : "#E3F2FD"
                                    : isActive
                                        ? Colors[theme].backgroundPrimary
                                        : "#E3F2FD";

                            return (
                                <TouchableOpacity
                                    key={role}
                                    onPress={() => setSelectedRole(role)}
                                    style={{
                                        flex: 1,
                                        paddingVertical: 14,
                                        backgroundColor: bgColor,
                                    }}
                                >
                                    <Text
                                        style={{
                                            textAlign: "center",
                                            fontWeight: "700",
                                            color: isActive ? "#fff" : "#000",
                                        }}
                                    >
                                        Sign up as {role}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>

                    {/* INPUT AREA (STABLE HEIGHT – NO JUMP) */}
                    <View style={{ minHeight: 420 }}>
                        {/* COMMON INPUTS */}
                        {COMMON_FIELDS.map(f => (
                            <Input
                                key={f.fieldKey}
                                icon={f.icon}
                                placeholder={f.placeholder}
                                keyboardType={f.keyboardType}
                                fieldKey={f.fieldKey}
                                value={userInput[f.fieldKey]}
                                onChange={handleChange}
                                theme={theme}
                                themeColors={themeColors}
                            />
                        ))}


                        {/* DRIVER INPUTS (VISUALLY TOGGLED ONLY) */}
                        <View
                            style={{
                                opacity: selectedRole === "driver" ? 1 : 0,
                                height: selectedRole === "driver" ? "auto" : 0,
                                overflow: "hidden",
                            }}
                            pointerEvents={selectedRole === "driver" ? "auto" : "none"}
                        >
                            <Input
                                icon="car-outline"
                                placeholder="Vehicle Registration"
                                fieldKey="vehicleRego"
                                value={userInput.vehicleRego}
                                onChange={handleChange}
                                theme={theme}
                                themeColors={themeColors}
                            />
                            <Input
                                icon="id-card-outline"
                                placeholder="Licence Number"
                                fieldKey="licenceNumber"
                                value={userInput.licenceNumber}
                                onChange={handleChange}
                                theme={theme}
                                themeColors={themeColors}
                            />
                            <Input
                                icon="bus-outline"
                                placeholder="Vehicle Type"
                                fieldKey="vehicleType"
                                value={userInput.vehicleType}
                                onChange={handleChange}
                                theme={theme}
                                themeColors={themeColors}
                            />
                        </View>

                        {/* PASSWORDS */}
                        <Input
                            icon="lock-closed-outline"
                            placeholder="Password"
                            fieldKey="password"
                            value={userInput.password}
                            secure
                            passwordVisible={passwordVisible}
                            togglePassword={() => setPasswordVisible(p => !p)}
                            onChange={handleChange}
                            theme={theme}
                            themeColors={themeColors}
                        />

                        <Input
                            icon="lock-closed-outline"
                            placeholder="Confirm Password"
                            fieldKey="confirmPassword"
                            value={userInput.confirmPassword}
                            secure
                            passwordVisible={passwordVisible}
                            togglePassword={() => setPasswordVisible(p => !p)}
                            onChange={handleChange}
                            theme={theme}
                            themeColors={themeColors}
                        />
                    </View>

                    {/* ERROR */}
                    {errorMsg && (
                        <Text style={{ color: "red", textAlign: "center", marginTop: 8 }}>
                            {errorMsg}
                        </Text>
                    )}

                    {/* SUBMIT */}
                    <TouchableOpacity
                        onPress={handleSubmit}
                        style={{
                            backgroundColor: Colors[theme].backgroundPrimary,
                                // selectedRole === "driver" ? "#1976D2" : "#4CAF50",
                            paddingVertical: 14,
                            borderRadius: 14,
                            marginTop: 16,
                        }}
                    >
                        <Text
                            style={{
                                textAlign: "center",
                                fontSize: 18,
                                fontWeight: "600",
                                color: "#fff",
                            }}
                        >
                            Create Account
                        </Text>
                    </TouchableOpacity>

                    {/* SIGN IN */}
                    <TouchableOpacity onPress={() => router.push("pages/user/UserSignin")}>
                        <Text
                            style={{
                                textAlign: "center",
                                marginTop: 14,
                                color: themeColors.tint,
                                textDecorationLine: "underline",
                            }}
                        >
                            Already have an account? Sign in
                        </Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );

};

/* -------------------- INPUT -------------------- */
const Input = ({
    icon,
    placeholder,
    value,
    fieldKey,
    onChange,
    keyboardType,
    secure,
    passwordVisible,
    togglePassword,
    theme,
    themeColors,
}: InputProps) => (
    <View
        style={{
            flexDirection: "row",
            alignItems: "center",
            borderWidth: 1,
            borderColor: themeColors.border,
            backgroundColor: theme === "dark" ? "#1a1a1a" : "#f9f9f9",
            borderRadius: 14,
            paddingHorizontal: 12,
            paddingVertical: 10,
            marginBottom: 12,
        }}
    >
        <Ionicons name={icon} size={20} color={themeColors.tint} />
        <TextInput
            placeholder={placeholder}
            value={value}
            keyboardType={keyboardType}
            onChangeText={v => onChange(fieldKey, v)}
            secureTextEntry={secure && !passwordVisible}
            style={{
                marginLeft: 10,
                flex: 1,
                color: themeColors.text,
            }}
        />
        {secure && (
            <TouchableOpacity onPress={togglePassword}>
                <Ionicons
                    name={passwordVisible ? "eye-outline" : "eye-off-outline"}
                    size={22}
                    color={themeColors.tint}
                />
            </TouchableOpacity>
        )}
    </View>
);

export default CreateUserForm;
