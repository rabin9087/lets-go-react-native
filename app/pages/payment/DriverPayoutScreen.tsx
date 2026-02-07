import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useRef } from "react";
import {
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TextInputProps,
    TouchableOpacity,
    View,
    SafeAreaView,
} from "react-native";
import { useDispatch, useSelector } from "react-redux";

// State & Actions
import { createDriverPaymentAccount } from "@/app/axios/payment";
import { RootState } from "@/app/store";
import { setErrors, setLoading, updateField } from "@/app/store/slices/driverOnboardingSlice";
import { useColorScheme } from "@/components/useColorScheme";
import Colors from "@/constants/Colors";

interface CustomInputProps extends Omit<TextInputProps, 'onChange'> {
    placeholder: string;
    onChange: (text: string) => void;
    colors: any;
    error?: string;
}

export default function DriverOnboardingScreen() {
    const dispatch = useDispatch();
    const router = useRouter();
    const theme = useColorScheme() ?? "light";
    const colors = Colors[theme];

    const state = useSelector((s: RootState) => s.driverOnboardingInfo);
    const { errors, loading } = state;

    const monthRef = useRef<TextInput>(null);
    const yearRef = useRef<TextInput>(null);

    const validateStep1 = () => {
        let errs: Record<string, string> = {};
        if (!state.dob.day || !state.dob.month || !state.dob.year) errs.dob = "Invalid Date";
        if (!state.address.line1) errs["address.line1"] = "Required";
        if (!state.address.city) errs["address.city"] = "Required";
        if (!state.address.state) errs["address.state"] = "Required";
        if (!state.address.postalCode) errs["address.postalCode"] = "Required";
        if (!state.bank.bankName) errs["bank.bankName"] = "Required";
        if (!state.bank.accountHolderName) errs["bank.accountHolderName"] = "Required";
        if (!state.bank.bsb) errs["bank.bsb"] = "Required";
        if (!state.bank.accountNumber) errs["bank.accountNumber"] = "Required";

        dispatch(setErrors(errs));
        return Object.keys(errs).length === 0;
    };

    const handleStep1Submit = async () => {
        if (!validateStep1()) return;
        dispatch(setLoading(true));
        try {
            const res = await createDriverPaymentAccount(state);
            if (res.status === "success" && res.data?.driverDocuments?.stripeDocuments?.stripeAccountId) {
                router.push("pages/payment/DriverUploadDocument")
            }
        } catch (err) {
            console.error("Failed", err);
        } finally {
            dispatch(setLoading(false));
        }
    };

    const Label = ({ title, icon }: { title: string; icon: string }) => (
        <View style={styles.labelRow}>
            <Ionicons name={icon as any} size={16} color={colors.tint} />
            <Text style={[styles.labelText, { color: colors.text }]}>{title}</Text>
        </View>
    );

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={{ flex: 1 }}
            >
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                        <Ionicons name={Platform.OS === 'ios' ? "chevron-back" : "arrow-back"} size={28} color={colors.text} />
                    </TouchableOpacity>
                    <Text style={[styles.headerTitle, { color: colors.text }]}>Verification</Text>
                    <View style={{ width: 28 }} />
                </View>

                <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                >
                    <View style={[styles.stripeNotice, { backgroundColor: colors.tint + "10" }]}>
                        <Ionicons name="lock-closed" size={18} color={colors.tint} />
                        <Text style={[styles.stripeNoticeText, { color: colors.text }]}>
                            Details are securely encrypted and processed by Stripe.
                        </Text>
                    </View>

                    {/* --- DOB SECTION --- */}
                    <View style={styles.section}>
                        <View style={styles.rowBetween}>
                            <Label title="Date of Birth" icon="calendar-outline" />
                            {errors.dob && <Text style={styles.sideErrorText}>{errors.dob}</Text>}
                        </View>
                        <View style={styles.dateRow}>
                            <TextInput
                                placeholder="DD"
                                maxLength={2}
                                keyboardType="numeric"
                                placeholderTextColor={colors.text + "40"}
                                onChangeText={(v) => {
                                    dispatch(updateField({ key: "dob.day", value: v }));
                                    if (v.length === 2) monthRef.current?.focus();
                                }}
                                style={[styles.dateInput, { backgroundColor: colors.card, color: colors.text, borderColor: errors.dob ? "#ff4444" : colors.border }]}
                            />
                            <TextInput
                                ref={monthRef}
                                placeholder="MM"
                                maxLength={2}
                                keyboardType="numeric"
                                placeholderTextColor={colors.text + "40"}
                                onChangeText={(v) => {
                                    dispatch(updateField({ key: "dob.month", value: v }));
                                    if (v.length === 2) yearRef.current?.focus();
                                }}
                                style={[styles.dateInput, { backgroundColor: colors.card, color: colors.text, borderColor: errors.dob ? "#ff4444" : colors.border }]}
                            />
                            <TextInput
                                ref={yearRef}
                                placeholder="YYYY"
                                maxLength={4}
                                keyboardType="numeric"
                                placeholderTextColor={colors.text + "40"}
                                onChangeText={(v) => dispatch(updateField({ key: "dob.year", value: v }))}
                                style={[styles.yearInput, { backgroundColor: colors.card, color: colors.text, borderColor: errors.dob ? "#ff4444" : colors.border }]}
                            />
                        </View>
                    </View>

                    {/* --- ADDRESS SECTION --- */}
                    <View style={styles.section}>
                        <Label title="Residential Address" icon="location-outline" />
                        <CustomInput
                            placeholder="Street Address"
                            error={errors["address.line1"]}
                            onChange={(v) => dispatch(updateField({ key: "address.line1", value: v }))}
                            colors={colors}
                        />
                        <CustomInput
                            placeholder="City / Suburb"
                            error={errors["address.city"]}
                            onChange={(v) => dispatch(updateField({ key: "address.city", value: v }))}
                            colors={colors}
                        />
                        <View style={styles.dateRow}>
                            <View style={{ flex: 1 }}>
                                <CustomInput
                                    placeholder="State"
                                    error={errors["address.state"]}
                                    autoCapitalize="characters"
                                    onChange={(v) => dispatch(updateField({ key: "address.state", value: v }))}
                                    colors={colors}
                                />
                            </View>
                            <View style={{ flex: 1 }}>
                                <CustomInput
                                    placeholder="Postcode"
                                    error={errors["address.postalCode"]}
                                    keyboardType="numeric"
                                    maxLength={4}
                                    onChange={(v) => dispatch(updateField({ key: "address.postalCode", value: v }))}
                                    colors={colors}
                                />
                            </View>
                        </View>
                    </View>

                    {/* --- BANK SECTION --- */}
                    <View style={styles.section}>
                        <Label title="Bank Payout Account" icon="card-outline" />
                        <CustomInput
                            placeholder="Bank Name"
                            error={errors["bank.bankName"]}
                            onChange={(v) => dispatch(updateField({ key: "bank.bankName", value: v }))}
                            colors={colors}
                        />
                        <CustomInput
                            placeholder="Account Holder Name"
                            error={errors["bank.accountHolderName"]}
                            onChange={(v) => dispatch(updateField({ key: "bank.accountHolderName", value: v }))}
                            colors={colors}
                        />
                        <View style={styles.dateRow}>
                            <View style={{ flex: 1 }}>
                                <CustomInput
                                    placeholder="BSB"
                                    error={errors["bank.bsb"]}
                                    keyboardType="numeric"
                                    maxLength={6}
                                    onChange={(v) => dispatch(updateField({ key: "bank.bsb", value: v }))}
                                    colors={colors}
                                />
                            </View>
                            <View style={{ flex: 2 }}>
                                <CustomInput
                                    placeholder="Account Number"
                                    error={errors["bank.accountNumber"]}
                                    keyboardType="numeric"
                                    onChange={(v) => dispatch(updateField({ key: "bank.accountNumber", value: v }))}
                                    colors={colors}
                                />
                            </View>
                        </View>
                    </View>

                    <TouchableOpacity
                        onPress={handleStep1Submit}
                        disabled={loading}
                        activeOpacity={0.8}
                        style={[styles.submitBtn, { backgroundColor: colors.text, opacity: loading ? 0.6 : 1 }]}
                    >
                        <Text style={[styles.submitBtnText, { color: colors.background }]}>
                            {loading ? "Processing..." : "Next: Identity Verification"}
                        </Text>
                    </TouchableOpacity>

                    <View style={{ height: 60 }} />
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const CustomInput: React.FC<CustomInputProps> = ({ placeholder, onChange, error, colors, ...rest }) => (
    <View style={{ marginBottom: 12 }}>
        <TextInput
            placeholder={placeholder}
            onChangeText={onChange}
            placeholderTextColor={colors.text + "40"}
            selectionColor={colors.tint}
            style={[
                styles.input,
                {
                    backgroundColor: colors.card,
                    color: colors.text,
                    borderColor: error ? "#ff4444" : colors.border
                }
            ]}
            {...rest}
        />
        {error && <Text style={styles.inputErrorText}>{error}</Text>}
    </View>
);

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    scrollContent: { paddingHorizontal: 20 },
    headerTitle: { fontSize: 18, fontWeight: "700" },
    backBtn: { padding: 4 },
    section: { marginBottom: 10 },
    stripeNotice: {
        flexDirection: 'row',
        padding: 14,
        borderRadius: 12,
        marginBottom: 25,
        alignItems: 'center',
        gap: 12
    },
    stripeNoticeText: { fontSize: 13, flex: 1, fontWeight: "500" },
    labelRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 10, marginTop: 10 },
    labelText: { fontSize: 14, fontWeight: "600", opacity: 0.8 },
    rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    input: {
        padding: Platform.OS === 'ios' ? 16 : 12,
        borderRadius: 12,
        borderWidth: 1,
        fontSize: 16
    },
    inputErrorText: { color: "#ff4444", fontSize: 12, marginTop: 4, marginLeft: 4, fontWeight: '500' },
    sideErrorText: { color: "#ff4444", fontSize: 12, fontWeight: "600" },
    dateRow: { flexDirection: "row", gap: 10, marginBottom: 8 },
    dateInput: {
        flex: 1,
        padding: Platform.OS === 'ios' ? 16 : 12,
        borderRadius: 12,
        borderWidth: 1,
        textAlign: "center"
    },
    yearInput: {
        flex: 1.5,
        padding: Platform.OS === 'ios' ? 16 : 12,
        borderRadius: 12,
        borderWidth: 1,
        textAlign: "center"
    },
    submitBtn: {
        padding: 18,
        borderRadius: 16,
        marginTop: 20,
        alignItems: 'center',
        ...Platform.select({
            ios: { shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 10, shadowOffset: { width: 0, height: 4 } },
            android: { elevation: 3 }
        })
    },
    submitBtnText: { fontSize: 17, fontWeight: "700" },
});