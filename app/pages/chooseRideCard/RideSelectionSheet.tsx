import React, { useRef, useState, useCallback } from 'react';
import {
    View, Text, StyleSheet, Animated, PanResponder,
    Dimensions, TouchableOpacity, FlatList,
    ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '@/constants/Colors';
import { useColorScheme } from 'react-native';
import { useAppDispatch, useAppSelector } from '@/app/store/hooks';
import { requestTripByPickupAndDropoffLocation } from '@/app/axios/trip';
import Toast from 'react-native-toast-message';
import { ITrip, setChooseRide, setIncomingRide, IFare } from '@/app/store/slices/trip.slice';

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');

const MIN_HEIGHT = SCREEN_HEIGHT * 0.80;
const MID_HEIGHT = SCREEN_HEIGHT * 0.55;
const MAX_HEIGHT = SCREEN_HEIGHT * 0.10;

const RIDE_UI_CONFIG: Record<string, { icon: any; label: string }> = {
    standard: { icon: 'car-sport', label: 'Standard' },
    xl: { icon: 'bus', label: 'Extra Large' },
    lux: { icon: 'diamond', label: 'Premium Lux' },
};

export default function RideSelectionSheet() {
    const colorScheme = useColorScheme() ?? 'light';
    const colors = Colors[colorScheme];
    const dispatch = useAppDispatch();

    const [viewState, setViewState] = useState<'list' | 'confirm'>('list');
    const [loading, setLoading] = useState(false);
    const [selectedRide, setSelectedRide] = useState<IFare | null>(null);

    const translateY = useRef(new Animated.Value(MID_HEIGHT)).current;
    const lastScrollY = useRef(MID_HEIGHT);

    const {
        pickupLocation,
        dropoffLocation,
        numberOfPassengers,
        regoPhone,
        fareCalculate
    } = useAppSelector((s) => s.tripInfo);

    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: () => true,
            onPanResponderMove: (_, gesture) => {
                const nextY = lastScrollY.current + gesture.dy;
                if (nextY >= MAX_HEIGHT && nextY <= MIN_HEIGHT) {
                    translateY.setValue(nextY);
                }
            },
            onPanResponderRelease: (_, gesture) => {
                const endY = lastScrollY.current + gesture.dy;
                let snapTo = MID_HEIGHT;
                if (endY < MID_HEIGHT - 50) snapTo = MAX_HEIGHT;
                else if (endY > MID_HEIGHT + 50) snapTo = MIN_HEIGHT;
                else snapTo = MID_HEIGHT;

                lastScrollY.current = snapTo;
                Animated.spring(translateY, {
                    toValue: snapTo,
                    useNativeDriver: true,
                    tension: 50,
                    friction: 8
                }).start();
            },
        })
    ).current;

    const handleSelectRide = (ride: IFare) => {
        setSelectedRide(ride);
        setViewState('confirm');
    };

    const handleBack = () => {
        setViewState('list');
        setSelectedRide(null);
    };

    const handleRequestRide = useCallback(async () => {
        if (!pickupLocation?.coords || !dropoffLocation?.coords || !selectedRide) {
            Toast.show({ type: "error", text1: "Selection incomplete" });
            return;
        }
        setLoading(true);
        try {
            const data = await requestTripByPickupAndDropoffLocation({
                pickupLocation,
                dropoffLocation,
                people: numberOfPassengers as number,
                regoPhone: regoPhone || null,
                rideType: selectedRide.rideType
            });

            if (data?.status === "success") {
                dispatch(setIncomingRide(data?.data?.newTrip as ITrip));
                dispatch(setChooseRide(false));
            }
            Toast.show({ type: data?.status === 'success' ? 'success' : 'error', text1: data?.message });
        } catch (err) {
            Toast.show({ type: 'error', text1: 'Request failed' });
        } finally { setLoading(false); }
    }, [pickupLocation, dropoffLocation, numberOfPassengers, regoPhone, selectedRide, dispatch]);

    const durationValue = Math.round(Number(fareCalculate?.durationMin || 0));
    const distanceValue = Number(fareCalculate?.distanceKm || 0).toFixed(1);

    return (
        <Animated.View style={[styles.container, { backgroundColor: colors.background, transform: [{ translateY }] }]}>
            <View {...panResponder.panHandlers} style={styles.handleContainer}>
                <View style={[styles.handle, { backgroundColor: colorScheme === 'dark' ? '#444' : '#CCC' }]} />
            </View>

            <View style={styles.content}>
                <View style={styles.header}>
                    <View style={styles.headerSide}>
                        {viewState === 'confirm' && (
                            <TouchableOpacity onPress={handleBack}>
                                <Ionicons name="chevron-back" size={28} color={colors.text} />
                            </TouchableOpacity>
                        )}
                    </View>
                    <Text style={[styles.title, { color: colors.text }]}>
                        {viewState === 'list' ? 'Choose a ride' : 'Confirm Ride'}
                    </Text>
                    <View style={styles.headerSide} />
                </View>

                {viewState === 'list' ? (
                    <FlatList
                        data={fareCalculate?.fares || []}
                        keyExtractor={(item) => item.rideType}
                        renderItem={({ item }) => {
                            const typeKey = item.rideType.toLowerCase();
                            const config = RIDE_UI_CONFIG[typeKey] || RIDE_UI_CONFIG.standard;
                            return (
                                <TouchableOpacity
                                    style={[styles.card, { backgroundColor: colorScheme === 'dark' ? '#1c1c1e' : '#f2f2f7' }]}
                                    onPress={() => handleSelectRide(item)}
                                >
                                    <View style={styles.row}>
                                        <View style={[styles.iconCircle, { backgroundColor: colors.tint + '15' }]}>
                                            <Ionicons name={config.icon} size={26} color={colors.tint} />
                                        </View>
                                        <View style={{ marginLeft: 15 }}>
                                            <Text style={[styles.rideTitle, { color: colors.text }]}>{config.label}</Text>

                                            {/* SIDE BY SIDE VIEW */}
                                            <View style={styles.statsRow}>
                                                <Text style={styles.subtitle}>{distanceValue} KM</Text>
                                                <View style={styles.dotSeparator} />
                                                <Text style={styles.subtitle}>{durationValue} Min</Text>
                                            </View>
                                        </View>
                                    </View>
                                    <View style={styles.row}>
                                        <Text style={[styles.fare, { color: colors.text }]}>${item.totalFare.toFixed(2)}</Text>
                                        <Ionicons name="chevron-forward" size={18} color="#CCC" />
                                    </View>
                                </TouchableOpacity>
                            );
                        }}
                    />
                ) : (
                    <View style={styles.confirmContent}>
                        <Ionicons name={RIDE_UI_CONFIG[selectedRide?.rideType.toLowerCase() || 'standard'].icon} size={70} color={colors.tint} />
                        <Text style={[styles.confirmName, { color: colors.text }]}>{RIDE_UI_CONFIG[selectedRide?.rideType.toLowerCase() || 'standard'].label}</Text>

                        <View style={styles.statsRow}>
                            <Text style={styles.subtitle}>{distanceValue} KM</Text>
                            <View style={styles.dotSeparator} />
                            <Text style={styles.subtitle}>{durationValue} Min</Text>
                        </View>

                        <Text style={[styles.confirmPrice, { color: colors.text }]}>${selectedRide?.totalFare.toFixed(2)}</Text>

                        <TouchableOpacity style={[styles.paymentBtn, { borderTopColor: colorScheme === 'dark' ? '#333' : '#eee', borderTopWidth: 1 }]}>
                            <Ionicons name="card" size={20} color={colors.tint} />
                            <Text style={[styles.paymentText, { color: colors.text }]}>Personal Wallet •••• 4242</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={[styles.mainBtn, { backgroundColor: colors.tint }]} onPress={handleRequestRide} disabled={loading}>
                            {loading ? <ActivityIndicator color={colors.background} /> : <Text style={[styles.mainBtnText, { color: colors.background }]}>Confirm {selectedRide?.rideType}</Text>}
                        </TouchableOpacity>
                    </View>
                )}
            </View>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute', width: SCREEN_WIDTH, height: SCREEN_HEIGHT,
        borderTopLeftRadius: 25, borderTopRightRadius: 25,
        shadowColor: "#000", shadowOffset: { width: 0, height: -5 },
        shadowOpacity: 0.1, shadowRadius: 10, elevation: 20, zIndex: 100,
    },
    handleContainer: { width: '100%', alignItems: 'center', paddingVertical: 12 },
    handle: { width: 40, height: 5, borderRadius: 3 },
    content: { paddingHorizontal: 20, flex: 1 },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 15 },
    headerSide: { width: 40 },
    title: { fontSize: 18, fontWeight: '700' },
    card: { flexDirection: 'row', justifyContent: 'space-between', padding: 16, borderRadius: 16, marginBottom: 10 },
    iconCircle: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
    row: { flexDirection: 'row', alignItems: 'center' },

    // FLEX SIDE BY SIDE STYLE
    statsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 2
    },
    dotSeparator: {
        width: 3,
        height: 3,
        borderRadius: 2,
        backgroundColor: '#8E8E93',
        marginHorizontal: 8
    },

    rideTitle: { fontSize: 16, fontWeight: '600' },
    subtitle: { fontSize: 13, color: '#8E8E93' },
    fare: { fontSize: 16, fontWeight: '700', marginRight: 8 },
    confirmContent: { alignItems: 'center', paddingTop: 10 },
    confirmName: { fontSize: 22, fontWeight: '800', marginTop: 10 },
    confirmPrice: { fontSize: 26, fontWeight: '900', marginVertical: 10 },
    paymentBtn: { flexDirection: 'row', width: '100%', paddingVertical: 15, alignItems: 'center', gap: 10, marginTop: 10 },
    paymentText: { fontWeight: '500' },
    mainBtn: { width: '100%', height: 56, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginTop: 10 },
    mainBtnText: { fontSize: 18, fontWeight: '700' }
});