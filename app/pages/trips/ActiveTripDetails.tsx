import React from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity, Platform } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppSelector } from '@/app/store/hooks';
import Colors from '@/constants/Colors';
import { useColorScheme } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context'; // Step 1: Import this

const { width } = Dimensions.get('window');

export default function ActiveTripDetails() {
    const router = useRouter();
    const insets = useSafeAreaInsets(); // Step 2: Initialize insets
    const colorScheme = useColorScheme() ?? 'light';
    const colors = Colors[colorScheme];
    const isDark = colorScheme === 'dark';

    const { incomingRide } = useAppSelector((s) => s.tripInfo);
    const { user } = useAppSelector((s) => s.userInfo);

    if (!incomingRide) return null;

    return (
        // Step 3: Apply insets.top to the container margin or padding
        <View style={[
            styles.container,
            {
                backgroundColor: colors.background,
                marginTop: insets.top + 10 // Pushes it exactly below the status bar
            }
        ]}>

            {/* 1. TOP NAVIGATION BAR */}
            <View style={styles.navRow}>
                <TouchableOpacity
                    onPress={() => router.back()}
                    style={styles.navButton}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                    <Ionicons
                        name={Platform.OS === 'ios' ? "chevron-back" : "arrow-back"}
                        size={24}
                        color={colors.text}
                    />
                </TouchableOpacity>

                <Text style={[styles.navTitle, { color: colors.text }]}>Trip Details</Text>

                <TouchableOpacity
                    onPress={() => {/* Open Options Menu */ }}
                    style={styles.navButton}
                >
                    <Ionicons
                        name={Platform.OS === 'ios' ? "ellipsis-horizontal" : "ellipsis-vertical"}
                        size={22}
                        color={colors.text}
                    />
                </TouchableOpacity>
            </View>

            {/* 2. HEADER INFO */}
            <View style={styles.header}>
                <View style={{ flex: 1 }}>
                    <Text style={[styles.riderName, { color: colors.text }]}>
                        {incomingRide?.riderName || "Current Rider"}
                    </Text>
                    <View style={styles.badgeContainer}>
                        <View style={[styles.typeBadge, { backgroundColor: colors.tint + '20' }]}>
                            <Text style={[styles.typeText, { color: colors.tint }]}>
                                {incomingRide?.rideType?.toUpperCase()}
                            </Text>
                        </View>
                        {incomingRide?.paymentMethod === 'cash' && (
                            <View style={styles.cashBadge}>
                                <Text style={styles.cashText}>CASH</Text>
                            </View>
                        )}
                    </View>
                </View>
                <View style={styles.priceContainer}>
                    <Text style={[styles.totalFare, { color: colors.text }]}>
                        ${user?.role === "driver" ? incomingRide?.driverEarning?.toFixed(2) : incomingRide?.totalFare?.toFixed(2)}
                    </Text>
                    <Text style={styles.subtext}> Earnings: ${incomingRide?.driverEarning?.toFixed(2)}</Text>
                    <Text style={styles.subtext}> {user?.role === "driver" ? `Earnings: $${incomingRide?.driverEarning?.toFixed(2)}` : `Paid: $${incomingRide?.totalFare?.toFixed(2)}` }</Text>
                </View>
            </View>

            <View style={[styles.divider, { backgroundColor: isDark ? '#333' : '#eee' }]} />

            {/* 3. STATS ROW */}
            <View style={styles.statsRow}>
                <View style={styles.statItem}>
                    <Ionicons name="people" size={18} color={colors.tabIconDefault} />
                    <Text style={[styles.statValue, { color: colors.text }]}>{incomingRide?.people} Pers.</Text>
                </View>
                <View style={styles.statItem}>
                    <MaterialCommunityIcons name="map-marker-distance" size={18} color={colors.tabIconDefault} />
                    <Text style={[styles.statValue, { color: colors.text }]}>{incomingRide?.distanceKm?.toFixed(1) || 0} km</Text>
                </View>
                <View style={styles.statItem}>
                    <Ionicons name="time-outline" size={18} color={colors.tabIconDefault} />
                    <Text style={[styles.statValue, { color: colors.text }]}>{incomingRide?.durationMin || 0} min</Text>
                </View>
            </View>

            {/* 4. ADDRESSES */}
            <View style={styles.addressContainer}>
                <View style={styles.addressRow}>
                    <View style={[styles.dot, { backgroundColor: '#22c55e' }]} />
                    <Text style={[styles.addressText, { color: colors.text }]} numberOfLines={1}>
                        {incomingRide?.pickupLocation?.address}
                    </Text>
                </View>
                <View style={[styles.verticalLine, { backgroundColor: isDark ? '#444' : '#CCC' }]} />
                <View style={styles.addressRow}>
                    <View style={[styles.dot, { backgroundColor: '#ef4444' }]} />
                    <Text style={[styles.addressText, { color: colors.text }]} numberOfLines={1}>
                        {incomingRide?.dropoffLocation?.address}
                    </Text>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        width: width - 24,
        padding: 16,
        borderRadius: 24,
        alignSelf: 'center',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 16,
        elevation: 8,
    },
    navRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    navButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 20,
    },
    navTitle: {
        fontSize: 16,
        fontWeight: '600',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    riderName: {
        fontSize: 20,
        fontWeight: '700',
        letterSpacing: -0.5,
    },
    badgeContainer: {
        flexDirection: 'row',
        marginTop: 6,
        gap: 6,
    },
    typeBadge: {
        paddingHorizontal: 10,
        paddingVertical: 3,
        borderRadius: 8,
    },
    typeText: {
        fontSize: 10,
        fontWeight: '800',
    },
    cashBadge: {
        backgroundColor: '#EAB308',
        paddingHorizontal: 10,
        paddingVertical: 3,
        borderRadius: 8,
    },
    cashText: {
        fontSize: 10,
        fontWeight: '800',
        color: '#FFF',
    },
    priceContainer: {
        alignItems: 'flex-end',
    },
    totalFare: {
        fontSize: 24,
        fontWeight: '900',
    },
    subtext: {
        fontSize: 11,
        color: '#8E8E93',
        fontWeight: '600',
        marginTop: 2,
    },
    divider: {
        height: 1,
        marginVertical: 16,
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    statItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    statValue: {
        fontSize: 14,
        fontWeight: '700',
    },
    addressContainer: {
        gap: 4,
        backgroundColor: Platform.OS === 'ios' ? 'transparent' : 'rgba(0,0,0,0.02)',
        padding: 8,
        borderRadius: 12,
    },
    addressRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    dot: {
        width: 10,
        height: 10,
        borderRadius: 5,
    },
    addressText: {
        fontSize: 13,
        fontWeight: '500',
        flex: 1,
    },
    verticalLine: {
        width: 1.5,
        height: 12,
        marginLeft: 4,
    }
});