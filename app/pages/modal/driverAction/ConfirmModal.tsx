import Colors from "@/constants/Colors";
import { useAppDispatch, useAppSelector } from "@/app/store/hooks";
import { setOpenModal } from "@/app/store/slices/user.slice";
import React, { useEffect, useRef, useState } from "react";
import {
    Animated,
    Modal,
    Platform,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    Dimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColorScheme } from "@/components/useColorScheme";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

type ConfirmModalProps = {
    onConfirm: () => void;
};

export const ConfirmModal: React.FC<ConfirmModalProps> = ({ onConfirm }) => {
    const dispatch = useAppDispatch();
    const { openModal } = useAppSelector((s) => s.userInfo);
    const { incomingRide, pickedup } = useAppSelector((s) => s.tripInfo);
    const { onlineDriver } = useAppSelector((s) => s.onlineDriversInfo);

    const theme = useColorScheme() ?? "light";
    const isDark = theme === "dark";
    const colors = Colors[theme];

    const insets = useSafeAreaInsets();

    // SMOOTH FIX 1: Use a dedicated Opacity animation to hide layout "snapping"
    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (openModal) {
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 300,
                useNativeDriver: true,
            }).start();
        } else {
            fadeAnim.setValue(0);
        }
    }, [openModal]);

    const handleCancel = () => {
        dispatch(setOpenModal(false));
    };

    const handleConfirm = () => {
        onConfirm();
        dispatch(setOpenModal(false));
    };

    // Determine the text based on state
    const actionText = !onlineDriver?.isOnline
        ? "Online"
        : (incomingRide?._id ? (pickedup ? "Drop-off" : "Pickup") : "Offline");

    const isGoingOnline = !onlineDriver?.isOnline;

    return (
        <Modal
            transparent
            visible={openModal}
            animationType="slide" // Use system slide for smoothness
            statusBarTranslucent
            onRequestClose={handleCancel}
        >
            <View style={styles.overlay}>
                <TouchableOpacity
                    style={styles.dismissArea}
                    activeOpacity={1}
                    onPress={handleCancel}
                />

                <Animated.View
                    style={[
                        styles.container,
                        {
                            backgroundColor: isDark ? "#1C1C1E" : "#FFFFFF",
                            opacity: fadeAnim, // SMOOTH FIX 2: Fade in content
                            // SMOOTH FIX 3: Safe Area management
                            paddingBottom: Platform.OS === "ios"
                                ? (insets.bottom || 30) + 10
                                : 40,
                        }
                    ]}
                >
                    <View style={styles.grabHandle} />

                    <Text style={[styles.title, { color: colors.text }]}>
                        Confirm {actionText}
                    </Text>

                    <Text style={[styles.subtitle, { color: isDark ? "#9CA3AF" : "#6B7280" }]}>
                        Are you sure you want to go {isGoingOnline ? "online" : "offline"}?
                    </Text>

                    <View style={styles.buttonRow}>
                        <TouchableOpacity
                            style={[styles.button, { backgroundColor: isDark ? "#2C2C2E" : "#F3F4F6" }]}
                            onPress={handleCancel}
                            activeOpacity={0.7}
                        >
                            <Text style={[styles.btnText, { color: isDark ? "#FFFFFF" : "#4B5563" }]}>
                                Cancel
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[
                                styles.button,
                                { backgroundColor: isDark ? "#059669" : "#10B981" }
                            ]}
                            onPress={handleConfirm}
                            activeOpacity={0.8}
                        >
                            <Text style={styles.btnText}>Confirm</Text>
                        </TouchableOpacity>
                    </View>
                </Animated.View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.3)",
        justifyContent: "flex-end",
    },
    dismissArea: {
        flex: 1,
    },
    container: {
        width: "100%",
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        paddingTop: 16,
        paddingHorizontal: 24,
        alignItems: "center",
        ...Platform.select({
            ios: {
                shadowColor: "#000",
                shadowOffset: { width: 0, height: -4 },
                shadowOpacity: 0.1,
                shadowRadius: 8,
            },
            android: {
                elevation: 24,
            },
        }),
    },
    grabHandle: {
        width: 36,
        height: 5,
        backgroundColor: "#E5E7EB",
        borderRadius: 10,
        marginBottom: 24,
    },
    title: {
        fontSize: 22,
        fontWeight: "800",
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        textAlign: "center",
        marginBottom: 32,
        lineHeight: 24,
    },
    buttonRow: {
        flexDirection: "row",
        width: "100%",
        gap: 12,
    },
    button: {
        flex: 1,
        height: 58,
        borderRadius: 18,
        alignItems: "center",
        justifyContent: "center",
    },
    btnText: {
        color: "#fff",
        fontWeight: "700",
        fontSize: 17,
    },
});