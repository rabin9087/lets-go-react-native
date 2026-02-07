import { useAppDispatch, useAppSelector } from "@/app/store/hooks";
import { setDropoffLocation, setIncomingRide, setPickupLocation, setTripAccepted } from "@/app/store/slices/trip.slice";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
    Animated,
    Dimensions,
    Easing,
    PanResponder,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import { cancelTrip } from "@/app/axios/trip";

const { width, height: SCREEN_HEIGHT } = Dimensions.get("window");

const FINDING_HEIGHT = 300; // Increased slightly for better spacing
const CANCEL_HEIGHT = SCREEN_HEIGHT * 0.75;
const PROGRESS_BAR_WIDTH = 120;

const CANCEL_REASONS = [
    "Wait time too long",
    "Driver too far away",
    "Changed my mind",
    "Booked another ride",
    "Incorrect pickup location",
    "Other"
];

export const FindingDriverModal = () => {
    const { tripAccepted, incomingRide } = useAppSelector((s) => s.tripInfo);
    const insets = useSafeAreaInsets();
    const dispatch = useAppDispatch();

    const [showCancelReasons, setShowCancelReasons] = useState(false);
    const [selectedReason, setSelectedReason] = useState("");
    const [otherReason, setOtherReason] = useState("");
    const [isCancelling, setIsCancelling] = useState(false);

    const translateX = useRef(new Animated.Value(-PROGRESS_BAR_WIDTH)).current;
    const translateY = useRef(new Animated.Value(0)).current;

    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dy) > 5,
            onPanResponderMove: (_, gesture) => {
                if (gesture.dy > 0) translateY.setValue(gesture.dy);
            },
            onPanResponderRelease: (_, gesture) => {
                if (gesture.dy > 120 || gesture.vy > 0.5) {
                    if (showCancelReasons) {
                        setShowCancelReasons(false);
                        Animated.spring(translateY, { toValue: 0, useNativeDriver: false, bounciness: 4 }).start();
                    } else {
                        Animated.spring(translateY, { toValue: FINDING_HEIGHT - 80, useNativeDriver: false }).start();
                    }
                } else {
                    Animated.spring(translateY, { toValue: 0, useNativeDriver: false, bounciness: 6 }).start();
                }
            },
        })
    ).current;

    const handleCancelSubmit = async () => {
        if (!incomingRide?._id) return;
        setIsCancelling(true);
        const finalReason = selectedReason === "Other" ? otherReason : selectedReason;

        try {
            const response = await cancelTrip(incomingRide._id, finalReason);
            if (response?.status === 'success') {
                setShowCancelReasons(false);
                setSelectedReason("");
                setOtherReason("");
                dispatch(setIncomingRide(null));
                dispatch(setPickupLocation(null));
                dispatch(setDropoffLocation(null));
                dispatch(setTripAccepted(null));
                Toast.show({ type: "info", text1: "Trip Cancelled" });
            }
        } catch (error) {
            Toast.show({ type: "error", text1: "Could not cancel trip" });
        } finally {
            setIsCancelling(false);
        }
    };
    console.log(incomingRide?._id)
    useEffect(() => {
        if (tripAccepted === false) {
            translateX.setValue(-PROGRESS_BAR_WIDTH);
            const anim = Animated.loop(
                Animated.timing(translateX, {
                    toValue: width - 48,
                    duration: 1800,
                    easing: Easing.bezier(0.4, 0, 0.2, 1),
                    useNativeDriver: true,
                })
            );
            anim.start();
            return () => anim.stop();
        }
    }, [tripAccepted]);

    if (tripAccepted !== false) return null;

    return (
        <View style={styles.rootContainer} pointerEvents="box-none">
            {showCancelReasons && (
                <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.4)' }]} />
            )}

            <Animated.View
                style={[
                    styles.sheetContainer,
                    {
                        height: showCancelReasons ? CANCEL_HEIGHT : FINDING_HEIGHT,
                        transform: [{ translateY }],
                        // Lift content based on safe area + manual padding for Android
                        paddingBottom: Math.max(insets.bottom, Platform.OS === 'android' ? 25 : 20)
                    }
                ]}
            >
                <View {...panResponder.panHandlers} style={styles.dragArea}>
                    <View style={styles.grabHandle} />
                </View>

                {!showCancelReasons ? (
                    <View style={styles.content}>
                        <View style={styles.headerRow}>
                            <Text style={styles.title}>Finding your driver</Text>
                            <TouchableOpacity style={styles.helpCircle}>
                                <Ionicons name="help-circle-outline" size={24} color="#6B7280" />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.progressBarBackground}>
                            <Animated.View style={[styles.progressBarValue, { width: PROGRESS_BAR_WIDTH, transform: [{ translateX }] }]} />
                        </View>
                        <Text style={styles.subtitle}>{ incomingRide?._id}</Text>
                        <Text style={styles.subtitle}>
                            We are searching for a nearby driver. This usually takes less than a minute.
                        </Text>

                        <View style={styles.buttonRow}>
                            <TouchableOpacity
                                style={[styles.actionButton, styles.cancelButton]}
                                onPress={() => {
                                    setShowCancelReasons(true);
                                    translateY.setValue(0);
                                }}
                            >
                                <Ionicons name="close-circle" size={22} color="#EF4444" />
                                <Text style={styles.cancelText}>Cancel Request</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                ) : (
                    <View style={styles.content}>
                        <View style={styles.headerRow}>
                            <Text style={styles.title}>Cancel Trip</Text>
                            <TouchableOpacity onPress={() => setShowCancelReasons(false)} style={styles.closeIcon}>
                                <Ionicons name="close" size={24} color="#111827" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.scrollArea} showsVerticalScrollIndicator={false}>
                            <Text style={styles.instructionText}>Please select a reason for cancelling your request.</Text>
                            {CANCEL_REASONS.map((reason) => (
                                <TouchableOpacity
                                    key={reason}
                                    style={styles.reasonOption}
                                    activeOpacity={0.6}
                                    onPress={() => setSelectedReason(reason)}
                                >
                                    <View style={[styles.radio, selectedReason === reason && styles.radioSelected]} />
                                    <Text style={[styles.reasonText, selectedReason === reason && styles.reasonTextActive]}>
                                        {reason}
                                    </Text>
                                </TouchableOpacity>
                            ))}

                            {selectedReason === "Other" && (
                                <TextInput
                                    style={styles.textInput}
                                    placeholder="Tell us more (Optional)"
                                    placeholderTextColor="#9CA3AF"
                                    value={otherReason}
                                    onChangeText={setOtherReason}
                                    multiline
                                />
                            )}
                        </ScrollView>

                        <TouchableOpacity
                            style={[
                                styles.submitButton,
                                (!selectedReason || isCancelling) && styles.submitButtonDisabled
                            ]}
                            disabled={!selectedReason || isCancelling}
                            onPress={handleCancelSubmit}
                        >
                            <Text style={styles.submitButtonText}>
                                {isCancelling ? "Cancelling..." : "Submit"}
                            </Text>
                        </TouchableOpacity>
                    </View>
                )}
            </Animated.View>
        </View>
    );
};

const styles = StyleSheet.create({
    rootContainer: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'flex-end',
        zIndex: 1000,
    },
    sheetContainer: {
        width: width,
        backgroundColor: "#fff",
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        ...Platform.select({
            ios: {
                shadowColor: "#000",
                shadowOffset: { width: 0, height: -8 },
                shadowOpacity: 0.1,
                shadowRadius: 12,
            },
            android: {
                elevation: 20,
            },
        }),
    },
    dragArea: {
        width: '100%',
        height: 30,
        justifyContent: 'center',
        alignItems: 'center',
    },
    grabHandle: {
        width: 36,
        height: 5,
        backgroundColor: "#E5E7EB",
        borderRadius: 2.5
    },
    content: { paddingHorizontal: 24, flex: 1 },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12
    },
    title: {
        fontSize: 22,
        fontWeight: "700",
        color: "#111827",
        letterSpacing: -0.5
    },
    closeIcon: { padding: 4 },
    helpCircle: { padding: 4 },
    progressBarBackground: {
        width: "100%",
        height: 4,
        backgroundColor: "#F3F4F6",
        borderRadius: 2,
        overflow: "hidden",
        marginBottom: 16
    },
    progressBarValue: {
        height: "100%",
        backgroundColor: "#007AFF",
        borderRadius: 2,
        position: 'absolute'
    },
    subtitle: {
        fontSize: 15,
        color: "#6B7280",
        marginBottom: 20,
        lineHeight: 22
    },
    buttonRow: { 
        flexDirection: 'row', 
        marginTop: 10,
        marginBottom: Platform.OS === 'android' ? 10 : 0 
    },
    actionButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        height: 54,
        borderRadius: 16
    },
    cancelButton: { 
        backgroundColor: "#FEF2F2" 
    },
    cancelText: { 
        color: "#EF4444", 
        fontWeight: "700", 
        fontSize: 16, 
        marginLeft: 8 
    },
    scrollArea: { maxHeight: CANCEL_HEIGHT - 220 },
    instructionText: { fontSize: 14, color: '#6B7280', marginBottom: 12 },
    reasonOption: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: '#E5E7EB'
    },
    radio: {
        width: 22,
        height: 22,
        borderRadius: 11,
        borderWidth: 2,
        borderColor: '#D1D5DB',
        marginRight: 14
    },
    radioSelected: {
        borderColor: '#007AFF',
        borderWidth: 7
    },
    reasonText: { fontSize: 16, color: '#374151' },
    reasonTextActive: { color: '#111827', fontWeight: '600' },
    textInput: {
        backgroundColor: '#F9FAFB',
        borderRadius: 14,
        padding: 16,
        marginTop: 16,
        height: 80,
        textAlignVertical: 'top',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        fontSize: 15
    },
    submitButton: {
        backgroundColor: '#111827',
        height: 56,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 20,
    },
    submitButtonDisabled: { backgroundColor: '#E5E7EB' },
    submitButtonText: { color: '#FFF', fontWeight: '700', fontSize: 17 },
});