import { resetPassword } from "@/app/axios/user";
import { useAppSelector } from "@/app/store/hooks";
import Colors from "@/constants/Colors";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    useColorScheme,
    Platform,
    StatusBar,
    KeyboardAvoidingView,
    ActivityIndicator
} from "react-native";
import Toast from "react-native-toast-message";

const ResetPassword = () => {
    const [pass, setPass] = useState({ p1: "", p2: "" });
    const [showP1, setShowP1] = useState(false);
    const [showP2, setShowP2] = useState(false);
    const [loading, setLoading] = useState(false);
    const [focusedField, setFocusedField] = useState<string | null>(null);

    const { tempIdentifier } = useAppSelector((s) => s.userInfo);
    const router = useRouter();

    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme ?? "light"];

    const handleReset = async () => {
        if (!pass.p1 || !pass.p2) {
            return Toast.show({ type: "error", text1: "Fields Required", text2: "Please fill in both password fields." });
        }
        if (pass.p1 !== pass.p2) {
            return Toast.show({ type: "error", text1: "Mismatch", text2: "Passwords do not match." });
        }
        if (pass.p1.length < 6) {
            return Toast.show({ type: "error", text1: "Too Short", text2: "Password must be at least 6 characters." });
        }

        setLoading(true);
        try {
            const res = await resetPassword(pass.p1, tempIdentifier!);
            if (res.status === "success") {
                Toast.show({
                    type: "success",
                    text1: "Success!",
                    text2: "Login with your new password."
                });
                router.replace("/pages/user/UserSignin");
            }
        } catch (err: any) {
            Toast.show({
                type: "error",
                text1: "Update Failed",
                text2: err?.response?.data?.message || "Something went wrong."
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={{ flex: 1, backgroundColor: theme.background }}>
            <StatusBar barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'} />

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                {/* Header Navigation */}
                <View style={styles.header}>
                    <TouchableOpacity
                        onPress={() => router.back()}
                        style={[styles.backBtn]}
                    >
                        <Ionicons
                            name={Platform.OS === 'ios' ? "chevron-back" : "arrow-back"}
                            size={24}
                            color={theme.text}
                        />
                    </TouchableOpacity>
                </View>

                <View style={styles.content}>
                    <Text style={[styles.title, { color: theme.text }]}>New Password</Text>
                    <Text style={[styles.subTitle, { color: theme.tabIconDefault }]}>
                        Secure your account by creating a unique password.
                    </Text>

                    {/* New Password Input */}
                    <View style={[
                        styles.inputWrapper,
                        {
                            backgroundColor: theme.card,
                            borderColor: focusedField === 'p1' ? theme.backgroundPrimary : theme.border
                        }
                    ]}>
                        <Ionicons name="lock-closed-outline" size={20} color={theme.tabIconDefault} style={styles.inputIcon} />
                        <TextInput
                            secureTextEntry={!showP1}
                            placeholder="New Password"
                            placeholderTextColor={theme.tabIconDefault}
                            style={[styles.input, { color: theme.text }]}
                            onFocus={() => setFocusedField('p1')}
                            onBlur={() => setFocusedField(null)}
                            onChangeText={(v) => setPass({ ...pass, p1: v })}
                            textContentType="newPassword"
                        />
                        <TouchableOpacity onPress={() => setShowP1(!showP1)} style={styles.eyeBtn}>
                            <Ionicons name={showP1 ? "eye-off-outline" : "eye-outline"} size={22} color={theme.tabIconDefault} />
                        </TouchableOpacity>
                    </View>

                    {/* Confirm Password Input */}
                    <View style={[
                        styles.inputWrapper,
                        {
                            backgroundColor: theme.card,
                            borderColor: focusedField === 'p2' ? theme.backgroundPrimary : theme.border
                        }
                    ]}>
                        <Ionicons name="shield-checkmark-outline" size={20} color={theme.tabIconDefault} style={styles.inputIcon} />
                        <TextInput
                            secureTextEntry={!showP2}
                            placeholder="Confirm Password"
                            placeholderTextColor={theme.tabIconDefault}
                            style={[styles.input, { color: theme.text }]}
                            onFocus={() => setFocusedField('p2')}
                            onBlur={() => setFocusedField(null)}
                            onChangeText={(v) => setPass({ ...pass, p2: v })}
                            textContentType="newPassword"
                        />
                        <TouchableOpacity onPress={() => setShowP2(!showP2)} style={styles.eyeBtn}>
                            <Ionicons name={showP2 ? "eye-off-outline" : "eye-outline"} size={22} color={theme.tabIconDefault} />
                        </TouchableOpacity>
                    </View>

                    <TouchableOpacity
                        style={[
                            styles.primaryBtn,
                            { backgroundColor: theme.text, opacity: (pass.p1 && pass.p2) ? 1 : 0.6 },
                        ]}
                        onPress={handleReset}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color={theme.background} />
                        ) : (
                            <Text style={[styles.btnText, { color: theme.background }]}>Update Password</Text>
                        )}
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </View>
    );
};

const styles = StyleSheet.create({
    header: {
        paddingHorizontal: 20,
        paddingTop: Platform.OS === 'ios' ? 60 : (StatusBar.currentHeight || 20) + 10,
        paddingBottom: 20,
    },
    backBtn: {
        width: 44,
        height: 44,
        borderRadius: 14,
        alignItems: "center",
        justifyContent: "center",
        ...Platform.select({
            ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
            android: { elevation: 3 }
        })
    },
    content: {
        flex: 1,
        paddingHorizontal: 24,
    },
    title: {
        fontSize: 34,
        fontWeight: "800",
        letterSpacing: -1,
        marginBottom: 8,
    },
    subTitle: {
        fontSize: 16,
        lineHeight: 24,
        marginBottom: 32,
    },
    inputWrapper: {
        flexDirection: "row",
        alignItems: "center",
        borderWidth: 1.5,
        borderRadius: 16,
        marginBottom: 16,
        paddingHorizontal: 16,
        height: 60,
    },
    inputIcon: {
        marginRight: 12,
    },
    input: {
        flex: 1,
        fontSize: 16,
        fontWeight: '500',
    },
    eyeBtn: {
        paddingLeft: 10,
    },
    primaryBtn: {
        height: 58,
        borderRadius: 18,
        alignItems: "center",
        justifyContent: "center",
        marginTop: 20,
        ...Platform.select({
            ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8 },
            android: { elevation: 2 }
        })
    },
    btnText: {
        fontSize: 18,
        fontWeight: "700",
    },
});

export default ResetPassword;