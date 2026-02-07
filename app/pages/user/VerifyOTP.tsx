import { verifyOTP } from "@/app/axios/otp";
import { requestPasswordReset } from "@/app/axios/user";
import { useAppDispatch, useAppSelector } from "@/app/store/hooks";
import { setTempIdentifier } from "@/app/store/slices/user.slice";
import Colors from "@/constants/Colors";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useSearchParams } from "expo-router/build/hooks";
import React, { useState, useRef } from "react";
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    useColorScheme,
    View,
    Pressable,
    StatusBar
} from "react-native";
import Toast from "react-native-toast-message";

export type OTPIdentifierType = "Login" | "Signup" | "Forgot_password" | "Account_Verify";

const VerifyOTP = () => {
    const params = useSearchParams();
    const otpTypes = params.get("otpTypes") as OTPIdentifierType | null;
    const routeTo = params.get("routeTo") as string | null;

    const [otp, setOtp] = useState("");
    const [loading, setLoading] = useState(false);
    const inputRef = useRef<TextInput>(null);
    const dispatch = useAppDispatch();

    const { tempIdentifier } = useAppSelector((s) => s.userInfo);
    const router = useRouter();
    const scheme = useColorScheme() ?? "light";
    const colors = Colors[scheme];

    const handelOnResendCode = async () => {
        setLoading(true);
        try {
            const res = await requestPasswordReset(tempIdentifier as string);
            if (res.status === "success") {
                dispatch(setTempIdentifier(tempIdentifier));
                Toast.show({ type: "success", text1: "Code Resent", text2: "Check your inbox for a new code." });
            }
        } catch (err: any) {
            Toast.show({
                type: "error",
                text1: "Error",
                text2: err?.message || "Something went wrong!"
            });
        } finally {
            setLoading(false);
        }
    }

    const handleVerify = async () => {
        if (!otp || otp.length < 6) {
            Toast.show({ type: "error", text1: "Invalid Code", text2: "Please enter the 6-digit code." });
            return;
        }

        setLoading(true);
        try {
            const res = await verifyOTP(tempIdentifier!, otp, otpTypes as OTPIdentifierType);
            if (res.status === "success") {
                router.push(routeTo as string);
                dispatch(setTempIdentifier("")); // Clear temp data on success
            }
        } catch (err: any) {
            Toast.show({
                type: "error",
                text1: "Verification Failed",
                text2: err?.response?.data?.message || "Invalid code entered.",
            });
        } finally {
            setLoading(false);
        }
    };

    const renderOTPBoxes = () => {
        const boxes = [];
        for (let i = 0; i < 6; i++) {
            const char = otp[i] || "";
            const isFocused = otp.length === i;
            boxes.push(
                <View
                    key={i}
                    style={[
                        styles.otpBox,
                        {
                            backgroundColor: colors.card,
                            borderColor: isFocused ? colors.backgroundPrimary : colors.border
                        }
                    ]}
                >
                    <Text style={[styles.otpText, { color: colors.text }]}>{char}</Text>
                </View>
            );
        }
        return boxes;
    };

    return (
        <View style={{ flex: 1, backgroundColor: colors.background }}>
            <StatusBar barStyle={scheme === 'dark' ? 'light-content' : 'dark-content'} />
            <KeyboardAvoidingView
                style={styles.container}
                behavior={Platform.OS === "ios" ? "padding" : "height"}
            >
                {/* Header Navigation - Styled for absolute positioning/placement */}
                <View style={styles.header}>
                    <TouchableOpacity
                        onPress={() => router.back()}
                        style={[styles.backBtn]}
                        hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
                    >
                        <Ionicons
                            name={Platform.OS === 'ios' ? "chevron-back" : "arrow-back"}
                            size={24}
                            color={colors.text}
                        />
                    </TouchableOpacity>
                </View>

                <View style={styles.content}>
                    <Text style={[styles.title, { color: colors.text }]}>Verification</Text>
                    <Text style={[styles.subTitle, { color: colors.tabIconDefault }]}>
                        We've sent a 6-digit code to{"\n"}
                        <Text style={{ color: colors.text, fontWeight: '600' }}>{tempIdentifier}</Text>
                    </Text>

                    <TextInput
                        ref={inputRef}
                        style={styles.hiddenInput}
                        keyboardType="number-pad"
                        maxLength={6}
                        onChangeText={setOtp}
                        value={otp}
                        autoFocus={true}
                        textContentType="oneTimeCode"
                    />

                    <Pressable style={styles.otpContainer} onPress={() => inputRef.current?.focus()}>
                        {renderOTPBoxes()}
                    </Pressable>

                    <TouchableOpacity
                        style={[
                            styles.primaryBtn,
                            { backgroundColor: colors.text, opacity: otp.length === 6 ? 1 : 0.6 }
                        ]}
                        onPress={handleVerify}
                        disabled={loading || otp.length < 6}
                    >
                        {loading ? (
                            <ActivityIndicator color={colors.background} />
                        ) : (
                            <Text style={[styles.primaryBtnText, { color: colors.background }]}>
                                Verify Code
                            </Text>
                        )}
                    </TouchableOpacity>

                    <View style={styles.footer}>
                        <Text style={{ color: colors.tabIconDefault }}>Didn't receive the code? </Text>
                        <TouchableOpacity
                            onPress={handelOnResendCode}
                            disabled={loading}
                        >
                            <Text style={[styles.resendText, { color: colors.backgroundPrimary }]}>
                                {loading ? "..." : "Resend"}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </View>
    );
};

export default VerifyOTP;

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        paddingHorizontal: 20,
        // Added specific padding based on Platform to handle the lack of SafeAreaView
        paddingTop: Platform.OS === 'ios' ? 60 : StatusBar.currentHeight ? StatusBar.currentHeight + 10 : 20,
        marginBottom: 20,
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
        marginBottom: 40,
    },
    hiddenInput: {
        position: 'absolute',
        width: 1,
        height: 1,
        opacity: 0,
    },
    otpContainer: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 40,
    },
    otpBox: {
        width: 46,
        height: 58,
        borderWidth: 1.5,
        borderRadius: 14,
        justifyContent: "center",
        alignItems: "center",
    },
    otpText: {
        fontSize: 24,
        fontWeight: "700",
    },
    primaryBtn: {
        height: 58,
        borderRadius: 18,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 24,
    },
    primaryBtnText: {
        fontSize: 18,
        fontWeight: "700",
    },
    footer: {
        flexDirection: 'row',
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 40
    },
    resendText: {
        fontWeight: "700",
        fontSize: 16,
    },
});