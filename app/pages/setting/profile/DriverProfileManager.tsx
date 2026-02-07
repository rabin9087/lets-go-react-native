import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Platform,
    useColorScheme,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAppSelector } from '@/app/store/hooks';
import Colors from '@/constants/Colors';

const DriverProfileManager = () => {
    const theme = useColorScheme() ?? 'light';
    const isDark = theme === 'dark';
    const colors = Colors[theme];
    const router = useRouter();

    const { driver } = useAppSelector(s => s.driverInfo);

    // Helper to render status badges
    const getStatusUI = (status?: string) => {
        switch (status) {
            case 'verified':
            case 'approved':
                return { color: '#34C759', icon: 'checkmark-circle' };
            case 'rejected':
                return { color: '#FF3B30', icon: 'close-circle' };
            case 'uploaded':
            case 'pending':
                return { color: '#FF9500', icon: 'time' };
            default:
                return { color: '#8E8E93', icon: 'help-circle' };
        }
    };

    const InfoCard = ({ title, value, subValue, icon, color }: any) => (
        <View style={[styles.card, { backgroundColor: isDark ? '#1C1C1E' : '#FFF' }]}>
            <View style={[styles.cardIcon, { backgroundColor: `${color}15` }]}>
                <Ionicons name={icon} size={22} color={color} />
            </View>
            <Text style={styles.cardLabel}>{title}</Text>
            <Text style={[styles.cardValue, { color: colors.text }]}>{value}</Text>
            {subValue && <Text style={styles.cardSubValue}>{subValue}</Text>}
        </View>
    );

    const DocumentRow = ({ label, status, isLast }: any) => {
        const ui = getStatusUI(status);
        return (
            <>
                <TouchableOpacity style={styles.row} activeOpacity={0.7}>
                    <Text style={[styles.rowLabel, { color: colors.text }]}>{label}</Text>
                    <View style={styles.statusContainer}>
                        <Text style={[styles.statusText, { color: ui.color }]}>
                            {status?.toUpperCase() || 'MISSING'}
                        </Text>
                        <Ionicons name={ui.icon as any} size={18} color={ui.color} style={{ marginLeft: 6 }} />
                    </View>
                </TouchableOpacity>
                {!isLast && <View style={[styles.divider, { backgroundColor: isDark ? '#38383A' : '#E5E5EA' }]} />}
            </>
        );
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            {/* Custom Header (Lowered for Status Bar) */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="chevron-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.text }]}>Driver Dashboard</Text>
                <TouchableOpacity style={styles.backBtn}>
                    <Ionicons name="settings-outline" size={22} color={colors.text} />
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.scrollBody} showsVerticalScrollIndicator={false}>

                {/* 1. Wallet & Earnings Section */}
                <Text style={styles.sectionTitle}>Financial Overview</Text>
                <View style={styles.cardGrid}>
                    <InfoCard
                        title="Wallet Balance"
                        value={`$${driver?.wallet?.balance.toFixed(2) || '0.00'}`}
                        subValue="Available for payout"
                        icon="wallet"
                        color="#5856D6"
                    />
                    <InfoCard
                        title="Total Earnings"
                        value={`$${driver?.totalEarnings.toFixed(2) || '0.00'}`}
                        subValue={`${driver?.totalTrips || 0} Total Trips`}
                        icon="stats-chart"
                        color="#34C759"
                    />
                </View>

                {/* 2. Approval Status */}
                <View style={[styles.statusBanner, { backgroundColor: getStatusUI(driver?.approvalStatus).color + '15' }]}>
                    <Ionicons
                        name={getStatusUI(driver?.approvalStatus).icon as any}
                        size={20}
                        color={getStatusUI(driver?.approvalStatus).color}
                    />
                    <Text style={[styles.bannerText, { color: getStatusUI(driver?.approvalStatus).color }]}>
                        Profile Status: {driver?.approvalStatus?.toUpperCase() || 'INCOMPLETE'}
                    </Text>
                </View>

                {/* 3. Core Documents */}
                <Text style={styles.sectionTitle}>Verification Documents</Text>
                <View style={[styles.listCard, { backgroundColor: isDark ? '#1C1C1E' : '#FFF' }]}>
                    <DocumentRow
                        label="Driver License (Front)"
                        status={driver?.driverDocuments?.licenceFront?.status}
                    />
                    <DocumentRow
                        label="Driver License (Back)"
                        status={driver?.driverDocuments?.licenceBack?.status}
                    />
                    <DocumentRow
                        label="Police Check"
                        status={driver?.driverDocuments?.policeCheck?.status}
                    />
                    <DocumentRow
                        label="Proof of Address"
                        status={driver?.driverDocuments?.addressProof?.status}
                    />
                    <DocumentRow
                        label="Insurance Policy"
                        status={driver?.driverDocuments?.insurance?.status}
                        isLast
                    />
                </View>

                {/* 4. Bank Account (Stripe) */}
                {driver?.driverDocuments?.stripeDocuments?.bankDetails && (
                    <>
                        <Text style={styles.sectionTitle}>Banking</Text>
                        <View style={[styles.listCard, { backgroundColor: isDark ? '#1C1C1E' : '#FFF' }]}>
                            <TouchableOpacity style={styles.row}>
                                <View>
                                    <Text style={[styles.rowLabel, { color: colors.text }]}>
                                        {driver.driverDocuments.stripeDocuments.bankDetails.bankName}
                                    </Text>
                                    <Text style={styles.cardSubValue}>
                                        •••• {driver.driverDocuments.stripeDocuments.bankDetails.bankLast4}
                                    </Text>
                                </View>
                                <Ionicons name="chevron-forward" size={18} color="#C7C7CC" />
                            </TouchableOpacity>
                        </View>
                    </>
                )}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        marginTop: Platform.OS === 'ios' ? 60 : 45,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        marginBottom: 10
    },
    headerTitle: { fontSize: 18, fontWeight: '700' },
    backBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
    scrollBody: { paddingHorizontal: 16, paddingBottom: 40 },
    sectionTitle: {
        fontSize: 13,
        fontWeight: '600',
        color: '#8E8E93',
        textTransform: 'uppercase',
        marginTop: 25,
        marginBottom: 10,
        marginLeft: 4,
        letterSpacing: 0.5
    },
    cardGrid: { flexDirection: 'row', gap: 12 },
    card: {
        flex: 1,
        padding: 16,
        borderRadius: 20,
        ...Platform.select({
            ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10 },
            android: { elevation: 2 }
        })
    },
    cardIcon: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
    cardLabel: { fontSize: 12, color: '#8E8E93', fontWeight: '600', marginBottom: 4 },
    cardValue: { fontSize: 18, fontWeight: '800' },
    cardSubValue: { fontSize: 11, color: '#8E8E93', marginTop: 2 },
    statusBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 14,
        borderRadius: 14,
        marginTop: 20
    },
    bannerText: { marginLeft: 10, fontWeight: '700', fontSize: 13 },
    listCard: {
        borderRadius: 20,
        overflow: 'hidden',
        ...Platform.select({
            ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10 },
            android: { elevation: 2 }
        })
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
    },
    rowLabel: { fontSize: 15, fontWeight: '500' },
    statusContainer: { flexDirection: 'row', alignItems: 'center' },
    statusText: { fontSize: 12, fontWeight: '700' },
    divider: { height: StyleSheet.hairlineWidth, marginLeft: 16 }
});

export default DriverProfileManager;