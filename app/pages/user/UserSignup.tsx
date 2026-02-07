import { createUser } from "@/app/axios/user";
import Colors from "@/constants/Colors";
import { Ionicons } from "@expo/vector-icons";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import React, { useEffect, useState, useMemo } from "react";
import {
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    useColorScheme,
    Modal,
    FlatList,
    StyleSheet,
    ActivityIndicator,
    StatusBar,
    LayoutAnimation, // Added for animation
    UIManager
} from "react-native";
import { IUser } from "./user.types";
import Toast from "react-native-toast-message";
import { getDeviceInfo } from "@/app/utils/device/getDeviceInfo";
import countries from '../../utils/countries.json';
import { formatPhoneNumber } from "./UserSignin";

// Enable LayoutAnimation for Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

/* -------------------- TYPES -------------------- */
type Role = "rider" | "driver";
type Gender = "male" | "female" | "other";

type UserInput = {
    name: string;
    email: string;
    phone: string;
    gender: Gender | "";
    password: string;
    confirmPassword: string;
};

interface Country {
    name: string;
    code: string;
    emoji: string;
    dial_code: string;
}

const CreateUserForm = () => {
    const theme = useColorScheme() ?? "light";
    const isDark = theme === "dark";
    const themeColors = Colors[theme];
    const router = useRouter();

    const [selectedRole, setSelectedRole] = useState<Role>("rider");
    const [passwordVisible, setPasswordVisible] = useState(false);
    const [isCountryModalVisible, setIsCountryModalVisible] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [focusedField, setFocusedField] = useState<string | null>(null);

    const [selectedCountry, setSelectedCountry] = useState<Country>(countries[0]);
    const [userInput, setUserInput] = useState<UserInput>({
        name: "", email: "", phone: "", gender: "", password: "", confirmPassword: ""
    });

    const passwordsMatch = useMemo(() => {
        return userInput.password.length >= 6 && userInput.password === userInput.confirmPassword;
    }, [userInput.password, userInput.confirmPassword]);

    const createUserMutation = useMutation({
        mutationFn: async (data: Partial<IUser>) => createUser(data),
    });

    // Helper for animated selection
    const handleRoleChange = (role: Role) => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setSelectedRole(role);
    };

    const handleGenderChange = (g: Gender) => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        handleChange("gender", g);
    };

    const handleChange = (key: keyof UserInput, value: string) => {
        setUserInput(prev => ({ ...prev, [key]: value }));
    };

    const filteredCountries = useMemo(() => {
        return countries.filter((c) =>
            c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            c.dial_code.includes(searchQuery)
        );
    }, [searchQuery]);

    useEffect(() => {
        const getUserCountry = async () => {
            try {
                const res = await fetch("https://get.geojs.io/v1/ip/geo.json");
                const data = await res.json();
                const found = countries.find((item) => item.name === data.country);
                if (found) setSelectedCountry(found);
            } catch (error) { console.error(error); }
        };
        getUserCountry();
    }, []);

    const handleSubmit = async () => {
        const { name, email, phone, gender, password } = userInput;
        if (!name || !email || !phone || !gender || !password) {
            return Toast.show({ type: 'error', text1: 'Required Fields', text2: 'Please fill in all details.' });
        }
        if (!passwordsMatch) {
            return Toast.show({ type: 'error', text1: 'Security Check', text2: 'Passwords must match and be at least 6 characters.' });
        }

        const device = await getDeviceInfo();
        const payload: Partial<IUser> = {
            name, email,
            phone: formatPhoneNumber(phone, selectedCountry.dial_code),
            password, gender, role: selectedRole, device,
        };

        try {
            const response = await createUserMutation.mutateAsync(payload);
            if (response?.status === "success") {
                router.replace(`/pages/user/VerifyOTP?otpTypes=Account_Verify&routeTo=/pages/user/UserSignin`);
                Toast.show({ type: "success", text1: "Welcome!", text2: "Account created successfully." });
            }
        } catch (error: any) {
            Toast.show({ type: 'error', text1: 'Registration Failed', text2: error?.response?.data?.message || 'Something went wrong.' });
        }
    };

    return (
        <View style={{ flex: 1, backgroundColor: themeColors.background }}>
            <StatusBar translucent backgroundColor="transparent" barStyle={isDark ? 'light-content' : 'dark-content'} />

            <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
                <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

                    <View style={styles.headerArea}>
                        <TouchableOpacity onPress={() => router.back()} style={[styles.backBtn]}>
                            <Ionicons name={Platform.OS === 'ios' ? "chevron-back" : "arrow-back"} size={22} color={themeColors.text} />
                        </TouchableOpacity>
                        <Text style={[styles.welcomeText, { color: themeColors.text }]}>Join the Community</Text>
                        <Text style={styles.subText}>Create your account to start your journey</Text>
                    </View>

                    {/* Role Selector with Animation */}
                    <View style={[styles.tabContainer, { backgroundColor: isDark ? "#1C1C1E" : "#F2F2F7" }]}>
                        {(["rider", "driver"] as Role[]).map(role => (
                            <TouchableOpacity
                                key={role}
                                onPress={() => handleRoleChange(role)}
                                activeOpacity={0.8}
                                style={[
                                    styles.tabItem,
                                    selectedRole === role && {
                                        backgroundColor: isDark ? "#3A3A3C" : "#FFFFFF",
                                        ...styles.activeTabShadow
                                    }
                                ]}
                            >
                                <Text style={[
                                    styles.tabText,
                                    { color: selectedRole === role ? themeColors.text : "#8E8E93" }
                                ]}>
                                    {role.charAt(0).toUpperCase() + role.slice(1)}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    <CustomInput
                        icon="person-outline" placeholder="Full Name"
                        value={userInput.name} onChangeText={(v: string) => handleChange("name", v)}
                        themeColors={themeColors} isDark={isDark} onFocus={() => setFocusedField('name')} onBlur={() => setFocusedField(null)}
                        isFocused={focusedField === 'name'}
                    />

                    <CustomInput
                        icon="mail-outline" placeholder="Email Address"
                        value={userInput.email} onChangeText={(v: string) => handleChange("email", v)}
                        keyboardType="email-address" themeColors={themeColors} isDark={isDark}
                        onFocus={() => setFocusedField('email')} onBlur={() => setFocusedField(null)}
                        isFocused={focusedField === 'email'}
                    />

                    <View style={styles.phoneRow}>
                        <TouchableOpacity onPress={() => setIsCountryModalVisible(true)} style={[styles.countryBtn, { backgroundColor: isDark ? "#1C1C1E" : "#F2F2F7" }]}>
                            <Text style={styles.countryEmoji}>{selectedCountry.emoji}</Text>
                            <Text style={[styles.dialCode, { color: themeColors.text }]}>{selectedCountry.dial_code}</Text>
                        </TouchableOpacity>

                        <View style={[styles.phoneInput, { backgroundColor: isDark ? "#1C1C1E" : "#F2F2F7", borderColor: focusedField === 'phone' ? themeColors.backgroundPrimary : "transparent" }]}>
                            <TextInput
                                placeholder="Phone Number" value={userInput.phone} onChangeText={(v: string) => handleChange("phone", v)}
                                keyboardType="phone-pad" placeholderTextColor="#8E8E93" onFocus={() => setFocusedField('phone')}
                                onBlur={() => setFocusedField(null)} style={[styles.inputField, { color: themeColors.text }]}
                            />
                        </View>
                    </View>

                    {/* Gender Selector with Animation */}
                    <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Gender</Text>
                    <View style={[styles.tabContainer, { backgroundColor: isDark ? "#1C1C1E" : "#F2F2F7", marginBottom: 20 }]}>
                        {(["male", "female", "other"] as Gender[]).map((g) => (
                            <TouchableOpacity
                                key={g}
                                onPress={() => handleGenderChange(g)}
                                activeOpacity={0.8}
                                style={[
                                    styles.tabItem,
                                    userInput.gender === g && {
                                        backgroundColor: isDark ? "#3A3A3C" : "#FFFFFF",
                                        ...styles.activeTabShadow
                                    }
                                ]}
                            >
                                <Text style={[
                                    styles.tabText,
                                    { color: userInput.gender === g ? themeColors.text : "#8E8E93" }
                                ]}>
                                    {g.charAt(0).toUpperCase() + g.slice(1)}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    <CustomInput
                        icon="lock-closed-outline" placeholder="Password"
                        value={userInput.password} onChangeText={(v: string) => handleChange("password", v)}
                        secureTextEntry={!passwordVisible}
                        rightIcon={passwordVisible ? "eye-off-outline" : "eye-outline"}
                        onRightIconPress={() => setPasswordVisible(!passwordVisible)}
                        themeColors={themeColors} isDark={isDark}
                        onFocus={() => setFocusedField('p1')} onBlur={() => setFocusedField(null)}
                        isFocused={focusedField === 'p1'}
                    />

                    <CustomInput
                        icon="shield-checkmark-outline" placeholder="Confirm Password"
                        value={userInput.confirmPassword} onChangeText={(v: string) => handleChange("confirmPassword", v)}
                        secureTextEntry={!passwordVisible}
                        rightIcon={passwordsMatch ? "checkmark-circle" : (passwordVisible ? "eye-off-outline" : "eye-outline")}
                        rightIconColor={passwordsMatch ? "#34C759" : "#8E8E93"}
                        onRightIconPress={() => setPasswordVisible(!passwordVisible)}
                        themeColors={themeColors} isDark={isDark}
                        onFocus={() => setFocusedField('p2')} onBlur={() => setFocusedField(null)}
                        isFocused={focusedField === 'p2'}
                        customBorderColor={passwordsMatch ? "#34C759" : null}
                    />

                    <TouchableOpacity
                        onPress={handleSubmit} style={[styles.submitBtn, { backgroundColor: themeColors.text }]}
                        disabled={createUserMutation.isPending}
                    >
                        {createUserMutation.isPending ? <ActivityIndicator color={themeColors.background} /> : <Text style={[styles.submitBtnText, { color: themeColors.background }]}>Create Account</Text>}
                    </TouchableOpacity>
                </ScrollView>
            </KeyboardAvoidingView>

            <Modal visible={isCountryModalVisible} animationType="slide" presentationStyle="pageSheet">
                <View style={[styles.modalBox, { backgroundColor: themeColors.background }]}>
                    <View style={styles.modalHeader}>
                        <Text style={[styles.modalTitle, { color: themeColors.text }]}>Select Country</Text>
                        <TouchableOpacity onPress={() => setIsCountryModalVisible(false)}><Ionicons name="close" size={24} color={themeColors.text} /></TouchableOpacity>
                    </View>
                    <TextInput placeholder="Search..." style={[styles.modalInput, { backgroundColor: isDark ? "#1C1C1E" : "#F2F2F7", color: themeColors.text }]} onChangeText={setSearchQuery} placeholderTextColor="#8E8E93" />
                    <FlatList
                        data={filteredCountries} keyExtractor={(item) => item.code}
                        renderItem={({ item }) => (
                            <TouchableOpacity style={styles.countryRow} onPress={() => { setSelectedCountry(item); setIsCountryModalVisible(false); }}>
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

const CustomInput = ({ icon, rightIcon, rightIconColor, onRightIconPress, themeColors, isDark, isFocused, customBorderColor, ...props }: any) => (
    <View style={[
        styles.inputContainer,
        {
            backgroundColor: isDark ? "#1C1C1E" : "#F2F2F7",
            borderColor: customBorderColor || (isFocused ? themeColors.backgroundPrimary : "transparent"),
            borderWidth: 1.5
        }
    ]}>
        <Ionicons name={icon} size={20} color="#8E8E93" />
        <TextInput style={[styles.inputField, { color: themeColors.text }]} placeholderTextColor="#8E8E93" {...props} />
        {rightIcon && (
            <TouchableOpacity onPress={onRightIconPress}>
                <Ionicons name={rightIcon} size={22} color={rightIconColor || "#8E8E93"} />
            </TouchableOpacity>
        )}
    </View>
);

const styles = StyleSheet.create({
    scrollContainer: { paddingHorizontal: 24, paddingBottom: 60 },
    headerArea: { paddingTop: Platform.OS === 'ios' ? 60 : (StatusBar.currentHeight || 24) + 20, marginBottom: 30 },
    backBtn: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
    welcomeText: { fontSize: 32, fontWeight: "800", letterSpacing: -1 },
    subText: { fontSize: 16, color: "#8E8E93", marginTop: 4 },
    tabContainer: { flexDirection: 'row', borderRadius: 18, padding: 4, marginBottom: 20 },
    tabItem: { flex: 1, paddingVertical: 12, borderRadius: 14, alignItems: 'center' },
    tabText: { fontWeight: '700', fontSize: 14 },
    activeTabShadow: {
        ...Platform.select({
            ios: {
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.08,
                shadowRadius: 3,
            },
            android: {
                elevation: 3,
            },
        }),
    },
    inputContainer: { flexDirection: 'row', alignItems: 'center', height: 60, borderRadius: 18, paddingHorizontal: 16, marginBottom: 16 },
    inputField: { flex: 1, marginLeft: 12, fontSize: 16, fontWeight: '500' },
    phoneRow: { flexDirection: 'row', marginBottom: 16 },
    countryBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15, height: 60, borderRadius: 18, marginRight: 10 },
    countryEmoji: { fontSize: 20, marginRight: 6 },
    dialCode: { fontSize: 16, fontWeight: '700' },
    phoneInput: { flex: 1, flexDirection: 'row', alignItems: 'center', height: 60, borderRadius: 18, paddingHorizontal: 16, borderWidth: 1.5 },
    sectionTitle: { fontSize: 15, fontWeight: '700', marginBottom: 12, marginLeft: 4 },
    submitBtn: { height: 60, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginTop: 15 },
    submitBtnText: { fontSize: 18, fontWeight: '700' },
    modalBox: { flex: 1, padding: 24 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    modalTitle: { fontSize: 22, fontWeight: '800' },
    modalInput: { height: 55, borderRadius: 14, paddingHorizontal: 15, marginBottom: 20 },
    countryRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 18, borderBottomWidth: 1, borderBottomColor: '#F2F2F7' },
    countryLabel: { flex: 1, fontSize: 16, marginLeft: 15, fontWeight: '500' },
});

export default CreateUserForm;