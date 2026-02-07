import { requestPasswordReset } from "@/app/axios/user";
import { useAppDispatch } from "@/app/store/hooks";
import { setTempIdentifier } from "@/app/store/slices/user.slice";
import Colors from "@/constants/Colors";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState, useMemo } from "react";
import countries from '../../utils/countries.json';

import {
    ActivityIndicator,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    useColorScheme,
    Platform,
    StatusBar,
    KeyboardAvoidingView,
    Modal,
    FlatList
} from "react-native";
import { formatPhoneNumber } from "./UserSignin";

interface Country {
    name: string;
    code: string;
    emoji: string;
    dial_code: string;
}

const ForgotPassword = () => {
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [isCountryModalVisible, setIsCountryModalVisible] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");

    const router = useRouter();
    const dispatch = useAppDispatch();
    const theme = useColorScheme() ?? "light";
    const colors = Colors[theme];

    const [selectedCountry, setSelectedCountry] = useState<Country>(countries[0]);

    // SHOW COUNTRY ONLY IF: Input starts with a digit
    const showCountry = useMemo(() => {
        const cleanInput = input.trim();
        return cleanInput.length > 0 && /^\d/.test(cleanInput);
    }, [input]);

    const filteredCountries = useMemo(() => {
        return countries.filter((c) =>
            c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            c.dial_code.includes(searchQuery)
        );
    }, [searchQuery]);

    const handleSendOTP = async () => {
        if (!input) return;

        // Logic check for final submission
        const userId = showCountry
            ? formatPhoneNumber(input, selectedCountry.dial_code)
            : input.trim().toLowerCase();

        setLoading(true);
        try {
            const res = await requestPasswordReset(userId);
            if (res.status === "success") {
                dispatch(setTempIdentifier(userId));
                router.push(`/pages/user/VerifyOTP?otpTypes=Forgot_password&routeTo=/pages/user/ResetPassword`);
            }
        } catch (err: any) {
            alert(err?.response?.data?.message || err?.message || "Something went wrong!");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const getUserCountry = async () => {
            try {
                const res = await fetch("https://get.geojs.io/v1/ip/geo.json");
                const data = await res.json();
                const found = countries.find((item) => item.name === data.country);
                if (found) setSelectedCountry(found);
            } catch (error) {
                console.error("Geo lookup failed.");
            }
        };
        getUserCountry();
    }, []);

    return (
        <View style={{ flex: 1, backgroundColor: colors.background }}>
            <StatusBar barStyle={theme === 'dark' ? 'light-content' : 'dark-content'} />

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={[styles.backBtn]}>
                        <Ionicons name={Platform.OS === 'ios' ? "chevron-back" : "arrow-back"} size={24} color={colors.text} />
                    </TouchableOpacity>
                </View>

                <View style={styles.content}>
                    <Text style={[styles.title, { color: colors.text }]}>Reset Password</Text>
                    <Text style={[styles.subTitle, { color: colors.tabIconDefault }]}>
                        Enter your email or phone number to receive a verification code.
                    </Text>

                    <View style={[styles.inputContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
                        {/* CONDITIONAL COUNTRY BADGE */}
                        {showCountry && (
                            <TouchableOpacity
                                style={styles.countryBadge}
                                onPress={() => setIsCountryModalVisible(true)}
                            >
                                <Text style={styles.countryEmoji}>{selectedCountry.emoji}</Text>
                                <Text style={[styles.dialCode, { color: colors.text }]}>{selectedCountry.dial_code}</Text>
                                <Ionicons name="chevron-down" size={12} color={colors.tabIconDefault} style={{ marginLeft: 2 }} />
                            </TouchableOpacity>
                        )}

                        <TextInput
                            style={[styles.input, { color: colors.text }]}
                            placeholder="Email or phone number"
                            placeholderTextColor={colors.tabIconDefault}
                            value={input}
                            onChangeText={setInput}
                            // Don't force phone-pad so users can type emails easily
                            keyboardType="default"
                            autoCapitalize="none"
                            autoCorrect={false}
                        />
                    </View>

                    <TouchableOpacity
                        style={[styles.primaryBtn, { backgroundColor: colors.text, opacity: input.length > 3 ? 1 : 0.6 }]}
                        onPress={handleSendOTP}
                        disabled={loading || input.length < 3}
                    >
                        {loading ? <ActivityIndicator color={colors.background} /> : <Text style={[styles.btnText, { color: colors.background }]}>Send Code</Text>}
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>

            {/* Country Picker Modal */}
            <Modal visible={isCountryModalVisible} animationType="slide" presentationStyle="pageSheet">
                <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
                    <View style={styles.modalHeader}>
                        <Text style={[styles.modalTitle, { color: colors.text }]}>Select Country</Text>
                        <TouchableOpacity onPress={() => setIsCountryModalVisible(false)}>
                            <Ionicons name="close" size={24} color={colors.text} />
                        </TouchableOpacity>
                    </View>

                    <View style={[styles.searchBar, { backgroundColor: colors.card }]}>
                        <Ionicons name="search" size={18} color={colors.tabIconDefault} />
                        <TextInput
                            placeholder="Search country..."
                            style={{ flex: 1, marginLeft: 10, color: colors.text }}
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                            placeholderTextColor={colors.tabIconDefault}
                        />
                    </View>

                    <FlatList
                        data={filteredCountries}
                        keyExtractor={(item) => item.code}
                        renderItem={({ item }) => (
                            <TouchableOpacity
                                style={styles.countryItem}
                                onPress={() => {
                                    setSelectedCountry(item);
                                    setIsCountryModalVisible(false);
                                    setSearchQuery("");
                                }}
                            >
                                <Text style={styles.countryEmoji}>{item.emoji}</Text>
                                <Text style={[styles.countryName, { color: colors.text }]}>{item.name}</Text>
                                <Text style={{ color: colors.tabIconDefault }}>{item.dial_code}</Text>
                            </TouchableOpacity>
                        )}
                    />
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    header: {
        paddingHorizontal: 20,
        paddingTop: Platform.OS === 'ios' ? 60 : (StatusBar.currentHeight || 20) + 10,
        paddingBottom: 20,
    },
    backBtn: { width: 44, height: 44, borderRadius: 14, alignItems: "center", justifyContent: "center", ...Platform.select({ ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 }, android: { elevation: 3 } }) },
    content: { flex: 1, paddingHorizontal: 24 },
    title: { fontSize: 34, fontWeight: "800", letterSpacing: -1, marginBottom: 8 },
    subTitle: { fontSize: 16, lineHeight: 24, marginBottom: 32 },
    inputContainer: { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderRadius: 16, paddingHorizontal: 16, height: 60, marginBottom: 24 },
    countryBadge: { flexDirection: 'row', alignItems: 'center', marginRight: 12, paddingRight: 12, borderRightWidth: 1, borderRightColor: '#E5E5EA', height: '60%' },
    countryEmoji: { fontSize: 18, marginRight: 4 },
    dialCode: { fontSize: 16, fontWeight: '700' },
    input: { flex: 1, fontSize: 16, fontWeight: '500' },
    primaryBtn: { height: 58, borderRadius: 18, alignItems: "center", justifyContent: "center" },
    btnText: { fontSize: 17, fontWeight: "700" },
    modalContent: { flex: 1, paddingHorizontal: 20, paddingTop: 20 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    modalTitle: { fontSize: 22, fontWeight: '800' },
    searchBar: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 14, marginBottom: 15 },
    countryItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#E5E5EA' },
    countryName: { flex: 1, marginLeft: 15, fontSize: 16, fontWeight: '500' }
});

export default ForgotPassword;