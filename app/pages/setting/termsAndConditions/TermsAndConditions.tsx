import React, { useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Platform,
    useColorScheme,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import Colors from "@/constants/Colors";

const TermsOfService = () => {
    const theme = useColorScheme() ?? "light";
    const isDark = theme === "dark";
    const colors = Colors[theme];
    const router = useRouter();

    const [hasReadToBottom, setHasReadToBottom] = useState(false);
    const [agreed, setAgreed] = useState(false);

    // Detect if user reached the end of the terms
    const isCloseToBottom = ({ layoutMeasurement, contentOffset, contentSize }: any) => {
        const paddingToBottom = 20;
        return layoutMeasurement.height + contentOffset.y >= contentSize.height - paddingToBottom;
    };

    const Section = ({ title, content }: { title: string; content: string }) => (
        <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>{title}</Text>
            <Text style={[styles.sectionText, { color: isDark ? "#A0A0A0" : "#4A4A4A" }]}>{content}</Text>
        </View>
    );

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            {/* Header */}
            <View style={styles.navBar}>
                <TouchableOpacity
                    onPress={() => router.back()}
                    style={[styles.backButton, { backgroundColor: isDark ? "#2C2C2E" : "#F2F2F7" }]}
                >
                    <Ionicons name="close" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.navTitle, { color: colors.text }]}>Terms of Service</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                onScroll={({ nativeEvent }) => {
                    if (isCloseToBottom(nativeEvent)) setHasReadToBottom(true);
                }}
                scrollEventThrottle={400}
            >
                <View style={styles.headerArea}>
                    <Text style={[styles.mainTitle, { color: colors.text }]}>Legal Agreement</Text>
                    <Text style={styles.lastUpdated}>Last Updated: January 16, 2026</Text>
                </View>

                <Section
                    title="1. Acceptance of Terms"
                    content="By creating an account, you agree to be legally bound by these Terms. If you do not agree, you may not use the Service."
                />
                <Section
                    title="2. User Eligibility"
                    content="You must be at least 18 years old. You are responsible for maintaining the security of your account credentials."
                />
                <Section
                    title="3. Driver Responsibilities"
                    content="Drivers must maintain valid insurance, licensing, and accurate vehicle registration (Rego). You are an independent contractor, not an employee."
                />
                <Section
                    title="4. Payments & Payouts"
                    content="Fees are calculated based on our algorithm. Payouts are subject to platform commissions and local tax regulations."
                />
                <Section
                    title="5. Limitation of Liability"
                    content="The platform is provided 'as is'. We are not liable for indirect damages or personal injury resulting from third-party interactions."
                />

                <View style={{ height: 40 }} />
            </ScrollView>

            {/* Footer Interaction */}
            <View style={[styles.footer, { backgroundColor: colors.background, borderTopColor: isDark ? "#333" : "#EEE" }]}>
                <TouchableOpacity
                    style={styles.checkboxContainer}
                    onPress={() => setAgreed(!agreed)}
                    activeOpacity={0.8}
                >
                    <Ionicons
                        name={agreed ? "checkbox" : "square-outline"}
                        size={24}
                        color={agreed ? colors.backgroundPrimary : "#8E8E93"}
                    />
                    <Text style={[styles.checkboxLabel, { color: colors.text }]}>
                        I agree to the terms and conditions
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    disabled={!agreed}
                    style={[
                        styles.continueBtn,
                        { backgroundColor: agreed ? colors.backgroundPrimary : "#CCC" }
                    ]}
                    onPress={() => router.back()}
                >
                    <Text style={styles.continueText}>Continue</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    navBar: {
        marginTop: Platform.OS === 'ios' ? 60 : 45,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingBottom: 10,
    },
    backButton: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
    navTitle: { fontSize: 17, fontWeight: '700' },
    scrollView: { flex: 1 },
    scrollContent: { paddingHorizontal: 24, paddingTop: 20 },
    headerArea: { marginBottom: 30 },
    mainTitle: { fontSize: 32, fontWeight: '800' },
    lastUpdated: { fontSize: 14, color: '#8E8E93', marginTop: 5 },
    section: { marginBottom: 25 },
    sectionTitle: { fontSize: 18, fontWeight: '700', marginBottom: 8 },
    sectionText: { fontSize: 15, lineHeight: 22 },
    footer: {
        padding: 24,
        paddingBottom: Platform.OS === 'ios' ? 40 : 24,
        borderTopWidth: 1,
    },
    checkboxContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    checkboxLabel: {
        marginLeft: 10,
        fontSize: 14,
        fontWeight: '500',
    },
    continueBtn: {
        height: 56,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
    },
    continueText: { color: '#FFF', fontSize: 18, fontWeight: '700' },
});

export default TermsOfService;