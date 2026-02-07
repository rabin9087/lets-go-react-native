import { Ionicons, FontAwesome, FontAwesome5 } from "@expo/vector-icons";
import { CardField, useStripe } from "@stripe/stripe-react-native";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    StatusBar, // Added to calculate height on Android
} from "react-native";

import {
    getSavedCards,
    savePaymentCard,
    savePaymentMethod,
    setDefaultPaymentMethod,
} from "@/app/axios/payment";
import { useAppSelector } from "@/app/store/hooks";
import { useColorScheme } from "@/components/useColorScheme";
import Colors from "@/constants/Colors";

interface PaymentMethodScreenProps {
    tripId: string;
}

export default function RiderPaymentMethodScreen({ tripId }: PaymentMethodScreenProps) {
    const { confirmSetupIntent } = useStripe();
    const theme = useColorScheme() ?? "light";
    const colors = Colors[theme];
    const isDark = theme === "dark";
    const router = useRouter();

    const [showAddNew, setShowAddNew] = useState(false);
    const [clientSecret, setClientSecret] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [selectedId, setSelectedId] = useState<string | null>(null);

    const { driver } = useAppSelector(s => s.driverInfo);

    const isCardExpired = (month: number, year: number) => {
        const today = new Date();
        const currentMonth = today.getMonth() + 1;
        const currentYear = today.getFullYear();
        return year < currentYear || (year === currentYear && month < currentMonth);
    };

    const { data, refetch } = useQuery({
        queryKey: ["paymentMethods"],
        queryFn: getSavedCards,
        enabled: !!driver?.driverDocuments?.stripeDocuments?.stripeAccountId,
    });

    const paymentMethods = useMemo(() => data?.data?.paymentMethods ?? [], [data]);

    useEffect(() => {
        if (paymentMethods.length > 0 && !selectedId) {
            const defaultCard = paymentMethods.find((m: any) => m.isDefault);
            setSelectedId(defaultCard ? defaultCard.id : paymentMethods[0].id);
        }
    }, [paymentMethods]);

    const getCardIcon = (brand: string) => {
        const name = brand.toLowerCase();
        switch (name) {
            case 'visa': return { name: 'cc-visa', library: FontAwesome, color: '#1A1F71' };
            case 'mastercard': return { name: 'cc-mastercard', library: FontAwesome, color: '#EB001B' };
            case 'amex': return { name: 'cc-amex', library: FontAwesome, color: '#007BC1' };
            default: return { name: 'credit-card', library: FontAwesome5, color: isDark ? '#FFF' : '#666' };
        }
    };

    const handleSaveCard = async () => {
        if (!clientSecret) {
            try {
                setLoading(true);
                const res = await savePaymentCard();
                setClientSecret(res?.data?.clientSecret as string);
                setLoading(false);
                return;
            } catch {
                Alert.alert("Error", "Failed to initialize setup");
                setLoading(false);
                return;
            }
        }

        try {
            setLoading(true);
            const { setupIntent, error } = await confirmSetupIntent(clientSecret, {
                paymentMethodType: "Card",
            });

            if (error) {
                Alert.alert("Card Error", error.message);
                return;
            }

            const paymentMethodId = setupIntent?.paymentMethod?.id;

            if (paymentMethodId) {
                await savePaymentMethod({ paymentMethodId });
                Alert.alert("Success", "Card added successfully");
                refetch();
                setShowAddNew(false);
                setClientSecret(null);
            }
        } catch (e: any) {
            Alert.alert("Error", e.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSelectMethod = async (methodId: string) => {
        setSelectedId(methodId);
        if (methodId !== 'wallet') {
            try {
                await setDefaultPaymentMethod(methodId);
            } catch (error) {
                console.error("Silent default update failed");
            }
        }
    };

    return (
        <View style={[styles.mainContainer, { backgroundColor: colors.background }]}>
            {/* STICKY HEADER WITH STATUS BAR OFFSET */}
            <View style={[styles.header, { borderBottomColor: colors.border }]}>
                <TouchableOpacity
                    onPress={() => showAddNew ? setShowAddNew(false) : router.back()}
                    hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
                    style={styles.headerBtn}
                >
                    <Ionicons
                        name={showAddNew ? "close" : (Platform.OS === 'ios' ? "chevron-back" : "arrow-back")}
                        size={showAddNew ? 26 : 24}
                        color={colors.text}
                    />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.text }]}>
                    {showAddNew ? "Add New Card" : "Payment Options"}
                </Text>
                <View style={styles.headerSpacer} />
            </View>

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
            >
                {!showAddNew ? (
                    <>
                        <Text style={[styles.sectionLabel, { color: colors.text }]}>SAVED METHODS</Text>

                        <View style={[styles.listContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
                            {paymentMethods.map((method: any, index: number) => {
                                const iconData = getCardIcon(method.brand);
                                const IconLib = iconData.library;
                                const expired = isCardExpired(method.expMonth, method.expYear);

                                return (
                                    <TouchableOpacity
                                        key={method.id}
                                        activeOpacity={0.7}
                                        style={[styles.methodRow, index !== paymentMethods.length - 1 && styles.divider]}
                                        onPress={() => handleSelectMethod(method.id)}
                                    >
                                        <View style={styles.rowLeft}>
                                            <IconLib name={iconData.name as any} size={22} color={iconData.color} style={{ width: 30 }} />
                                            <View>
                                                <Text style={[styles.cardDigits, { color: colors.text }]}>
                                                    {method.brand.toUpperCase()} •••• {method.last4}
                                                </Text>
                                                <View style={styles.badgeRow}>
                                                    <Text style={[styles.expText, { color: expired ? '#ef4444' : '#8e8e93' }]}>
                                                        Exp {method.expMonth}/{method.expYear}
                                                    </Text>
                                                    {expired && <Text style={styles.expiredLabel}>EXPIRED</Text>}
                                                </View>
                                            </View>
                                        </View>
                                        <Ionicons
                                            name={selectedId === method.id ? "checkmark-circle" : "ellipse-outline"}
                                            size={24}
                                            color={selectedId === method.id ? colors.tint : "#c7c7cc"}
                                        />
                                    </TouchableOpacity>
                                );
                            })}

                            <TouchableOpacity
                                activeOpacity={0.7}
                                style={[styles.methodRow, { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border }]}
                                onPress={() => handleSelectMethod('wallet')}
                            >
                                <View style={styles.rowLeft}>
                                    <Ionicons name={Platform.OS === 'ios' ? "logo-apple" : "logo-google"} size={22} color={colors.text} style={{ width: 30 }} />
                                    <Text style={[styles.cardDigits, { color: colors.text }]}>
                                        {Platform.OS === 'ios' ? 'Apple Pay' : 'Google Pay'}
                                    </Text>
                                </View>
                                <Ionicons
                                    name={selectedId === 'wallet' ? "checkmark-circle" : "ellipse-outline"}
                                    size={24}
                                    color={selectedId === 'wallet' ? colors.tint : "#c7c7cc"}
                                />
                            </TouchableOpacity>
                        </View>

                        <TouchableOpacity
                            activeOpacity={0.6}
                            style={styles.addTrigger}
                            onPress={() => { setShowAddNew(true); handleSaveCard(); }}
                        >
                            <View style={[styles.addIconBg, { backgroundColor: colors.tint + '15' }]}>
                                <Ionicons name="add" size={20} color={colors.tint} />
                            </View>
                            <Text style={[styles.addText, { color: colors.tint }]}>Add payment method</Text>
                        </TouchableOpacity>
                    </>
                ) : (
                    <View style={styles.formWrapper}>
                        <Text style={[styles.sectionLabel, { color: colors.text }]}>CARD DETAILS</Text>
                        <View style={[styles.stripeContainer, { backgroundColor: isDark ? "#1c1c1e" : "#f2f2f7", borderColor: colors.border }]}>
                            <CardField
                                placeholders={{ number: "Card Number", expiration: "MM/YY", cvc: "CVC" }}
                                cardStyle={{
                                    backgroundColor: isDark ? "#1c1c1e" : "#f2f2f7",
                                    textColor: colors.text,
                                    placeholderColor: "#8e8e93",
                                    fontSize: 16,
                                }}
                                style={styles.cardField}
                            />
                        </View>
                        <View style={styles.secureBadge}>
                            <Ionicons name="shield-checkmark" size={14} color="#8e8e93" />
                            <Text style={styles.helperText}>PCI-DSS Secure Payment</Text>
                        </View>
                    </View>
                )}
            </ScrollView>

            {/* ACTION FOOTER */}
            <View style={[styles.footer, { borderTopColor: colors.border, paddingBottom: Platform.OS === 'ios' ? 34 : 20 }]}>
                <TouchableOpacity
                    style={[styles.primaryBtn, { backgroundColor: colors.text }]}
                    onPress={showAddNew ? handleSaveCard : () => router.back()}
                    disabled={loading}
                >
                    {loading ? <ActivityIndicator color={colors.background} /> : (
                        <Text style={[styles.primaryText, { color: colors.background }]}>
                            {showAddNew ? "Save and Link Card" : "Use Selected Method"}
                        </Text>
                    )}
                </TouchableOpacity>
            </View>
        </View>
    );
}

// Native constants for manual positioning
const STATUS_BAR_HEIGHT = Platform.OS === 'ios' ? 48 : StatusBar.currentHeight ?? 0;
const HEADER_HEIGHT = 56;

const styles = StyleSheet.create({
    mainContainer: { flex: 1 },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 16,
        // Move header down below the notch/status bar manually
        paddingTop: STATUS_BAR_HEIGHT,
        height: STATUS_BAR_HEIGHT + HEADER_HEIGHT,
    },
    headerBtn: { width: 40, height: 40, justifyContent: 'center' },
    headerTitle: { fontSize: 17, fontWeight: "700", letterSpacing: -0.4 },
    headerSpacer: { width: 40 },
    scrollContent: { padding: 20, paddingTop: 10 },
    sectionLabel: { fontSize: 12, fontWeight: "600", color: "#8e8e93", marginBottom: 12, marginLeft: 4, letterSpacing: 0.5, textTransform: 'uppercase' },
    listContainer: { borderRadius: 14, borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden' },
    methodRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, minHeight: 72 },
    divider: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#c6c6c8' },
    rowLeft: { flexDirection: 'row', alignItems: 'center', gap: 14 },
    cardDigits: { fontSize: 16, fontWeight: '600' },
    expText: { fontSize: 13, marginTop: 2, fontWeight: '400' },
    badgeRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    expiredLabel: { fontSize: 10, fontWeight: '800', color: '#ef4444' },
    addTrigger: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, marginTop: 12 },
    addIconBg: { width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
    addText: { fontWeight: '600', fontSize: 16 },
    formWrapper: { marginTop: 10 },
    stripeContainer: { padding: 12, borderRadius: 12, borderWidth: StyleSheet.hairlineWidth },
    cardField: { width: '100%', height: 50 },
    footer: { padding: 20, borderTopWidth: StyleSheet.hairlineWidth },
    primaryBtn: { height: 56, borderRadius: 16, justifyContent: "center", alignItems: "center" },
    primaryText: { fontWeight: "700", fontSize: 16 },
    secureBadge: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 16, gap: 6 },
    helperText: { fontSize: 12, color: '#8e8e93', fontWeight: '500' },
});