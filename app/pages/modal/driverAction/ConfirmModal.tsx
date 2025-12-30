import { useAppDispatch, useAppSelector } from "@/app/store/hooks";
import { setOpenModal } from "@/app/store/slices/user.slice";
import React, { useEffect, useRef } from "react";
import {
    Animated,
    Modal,
    Platform,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

type ConfirmModalProps = {
    onConfirm: () => void;
    data: string
};

export const ConfirmModal: React.FC<ConfirmModalProps> = ({ onConfirm, data }) => {
    const dispatch = useAppDispatch();
    const { openModal } = useAppSelector((s) => s.userInfo);
    const translateX = useRef(new Animated.Value(-100)).current;

    useEffect(() => {
        if (!openModal) return;

        Animated.loop(
            Animated.sequence([
                Animated.timing(translateX, {
                    toValue: 300,
                    duration: 1200,
                    useNativeDriver: true,
                }),
                Animated.timing(translateX, {
                    toValue: -100,
                    duration: 0,
                    useNativeDriver: true,
                }),
            ])
        ).start();
    }, [openModal]);

    const handleCancel = () => {
        dispatch(setOpenModal(false));
    };

    const handleConfirm = () => {
        onConfirm(); // perform your task
        dispatch(setOpenModal(false));
    };

    return (
        <Modal transparent visible={openModal} animationType="fade" statusBarTranslucent>
            <View style={styles.overlay}>
                <View style={styles.container}>
                    {/* SEARCH LINE */}
                    <Text style={styles.title}>Confirm { data}</Text>
                    <Text style={styles.subtitle}>
                    </Text>

                    {/* Buttons */}
                    <View style={styles.buttonRow}>
                        <TouchableOpacity style={[styles.button, styles.cancelBtn]} onPress={handleCancel}>
                            <Text style={styles.btnText}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.button, styles.confirmBtn]} onPress={handleConfirm}>
                            <Text style={styles.btnText}>Confirm</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.4)",
        justifyContent: "flex-end",
        paddingBottom: Platform.OS === "ios" ? 34 : 20,
    },
    container: {
        width: "100%",
        backgroundColor: "#fff",
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        paddingVertical: 24,
        paddingHorizontal: 20,
        alignItems: "center",
    },
    lineWrapper: {
        width: "90%",
        height: 4,
        backgroundColor: "#E5E7EB",
        borderRadius: 2,
        overflow: "hidden",
        marginBottom: 16,
    },
    movingLine: {
        width: 80,
        height: 4,
        backgroundColor: "#111827",
        borderRadius: 2,
    },
    title: {
        fontSize: 18,
        fontWeight: "600",
        marginTop: 8,
    },
    subtitle: {
        fontSize: 14,
        color: "#6B7280",
        textAlign: "center",
        marginTop: 6,
        marginBottom: 20,
    },
    buttonRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        width: "100%",
        paddingHorizontal: 10,
    },
    button: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 10,
        marginHorizontal: 5,
        alignItems: "center",
    },
    cancelBtn: {
        backgroundColor: "#D1D5DB", // gray
    },
    confirmBtn: {
        backgroundColor: "#10B981", // green
    },
    btnText: {
        color: "#fff",
        fontWeight: "600",
        fontSize: 16,
    },
});
