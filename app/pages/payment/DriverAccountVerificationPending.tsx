import React from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppSelector, useAppDispatch } from '@/app/store/hooks';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { useQuery } from '@tanstack/react-query';
import { getDriverStripeAccount } from '@/app/axios/payment';
import { setDriverDocuments } from '@/app/store/slices/driver.slice';

export const DriverAccountVerificationPending = () => {
    const theme = useColorScheme() ?? 'light';
    const colors = Colors[theme];
    const dispatch = useAppDispatch();

    // Get driver data from state
    const { driver } = useAppSelector(s => s.driverInfo);
    const stripeDocs = driver?.driverDocuments?.stripeDocuments;

    // Internal fetch logic to handle the refresh button and pull-to-refresh
    const { isFetching, refetch } = useQuery({
        queryKey: ["driverDocuments"],
        queryFn: async () => {
            const res = await getDriverStripeAccount();
            if (res?.data?.driverDocuments) {
                dispatch(setDriverDocuments(res.data.driverDocuments));
            }
            return res?.data?.driverDocuments;
        },
        enabled: false, // Only manual refresh here
    });

    // Determine sub-statuses based on the real driver state
    const hasBank = !!stripeDocs?.bankDetails?.bankLast4;
    const hasDocs = stripeDocs?.stripeFiles?.passport?.status === 'verified' ||
        stripeDocs?.stripeFiles?.passport?.status === 'uploaded';
    const isSubmitted = !!stripeDocs?.paymentEnabledStatus?.detailsSubmitted;

    return (
        <View style={{ flex: 1, backgroundColor: colors.background }}>
            {/* Header Section */}
            <View style={styles.header}>
                <TouchableOpacity
                    onPress={() => refetch()}
                    disabled={isFetching}
                    style={[styles.refreshBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
                >
                    {isFetching ? (
                        <ActivityIndicator size="small" color={colors.tint} />
                    ) : (
                        <Ionicons name="refresh" size={20} color={colors.tint} />
                    )}
                </TouchableOpacity>
            </View>

            <ScrollView
                contentContainerStyle={styles.center}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={isFetching} onRefresh={refetch} tintColor={colors.tint} />
                }
            >
                <View style={[styles.iconCircle, { backgroundColor: colors.tint + "15" }]}>
                    <Ionicons name="time-outline" size={50} color={colors.tint} />
                </View>

                <Text style={[styles.title, { color: colors.text }]}>Verification in Progress</Text>
                <Text style={[styles.subtitle, { color: colors.text, opacity: 0.7 }]}>
                    Stripe is currently reviewing your identity and bank details. This usually takes a few minutes, but can take up to 24 hours.
                </Text>

                {/* Progress Steps Card */}
                <View style={[styles.infoCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <StatusStep
                        icon="document-text"
                        label="Documents Uploaded"
                        completed={isSubmitted || hasDocs}
                        colors={colors}
                    />
                    <StatusStep
                        icon="business"
                        label="Bank Details Linked"
                        completed={hasBank}
                        colors={colors}
                    />
                    <StatusStep
                        icon="shield-checkmark"
                        label="Stripe Security Review"
                        completed={stripeDocs?.paymentEnabledStatus?.payoutsEnabled ?? false}
                        colors={colors}
                    />
                </View>

                <View style={styles.tipBox}>
                    <Ionicons name="information-circle-outline" size={18} color={colors.tint} />
                    <Text style={[styles.tipText, { color: colors.text }]}>
                        Pull down to refresh and check for status updates.
                    </Text>
                </View>

                <Text style={[styles.footerText, { color: colors.text, opacity: 0.4 }]}>
                    You will receive a notification once your account is active.
                </Text>
            </ScrollView>
        </View>
    );
};

const StatusStep = ({ icon, label, completed, colors }: any) => (
    <View style={styles.stepRow}>
        <View style={[styles.stepIconContainer, { backgroundColor: completed ? "#22c55e20" : colors.border + "50" }]}>
            <Ionicons
                name={icon}
                size={18}
                color={completed ? "#22c55e" : "#94a3b8"}
            />
        </View>
        <Text style={[styles.stepLabel, { color: completed ? colors.text : "#94a3b8" }]}>
            {label}
        </Text>
        <Ionicons
            name={completed ? "checkmark-circle" : "ellipse-outline"}
            size={20}
            color={completed ? "#22c55e" : colors.border}
        />
    </View>
);

const styles = StyleSheet.create({
    header: {
        paddingHorizontal: 24,
        paddingTop: 10,
        flexDirection: 'row',
        justifyContent: 'flex-end',
    },
    refreshBtn: {
        width: 40,
        height: 40,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
    },
    center: { alignItems: 'center', padding: 30, paddingTop: 20 },
    iconCircle: {
        width: 100,
        height: 100,
        borderRadius: 50,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 24
    },
    title: { fontSize: 24, fontWeight: '900', marginBottom: 12, textAlign: 'center', letterSpacing: -0.5 },
    subtitle: { fontSize: 15, textAlign: 'center', lineHeight: 22, marginBottom: 40 },
    infoCard: { width: '100%', padding: 20, borderRadius: 24, borderWidth: 1, gap: 20 },
    stepRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    stepIconContainer: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
    stepLabel: { fontSize: 15, fontWeight: '700', flex: 1 },
    tipBox: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginTop: 40,
        paddingHorizontal: 20,
        opacity: 0.8
    },
    tipText: { fontSize: 13, flex: 1 },
    footerText: { marginTop: 20, fontSize: 12, textAlign: 'center' }
});