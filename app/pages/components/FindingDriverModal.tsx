import { useAppSelector } from "@/app/store/hooks";
import React from "react";
import {
    ActivityIndicator,
    Modal,
    StyleSheet,
    Text,
    View
} from "react-native";

export const FindingDriverModal = () => {
    const { tripAccepted } = useAppSelector((s) => s.tripInfo);

    // const visible = assignDriver === "searching";

    return (
        <Modal
            transparent
            visible={!tripAccepted}
            animationType="fade"
            statusBarTranslucent
        >
            <View style={styles.overlay}>
                <View style={styles.container}>
                    <ActivityIndicator size="large" />
                    <Text style={styles.title}>Finding a driver</Text>
                    <Text style={styles.subtitle}>
                        Please wait while we match you with a nearby driver
                    </Text>
                </View>
            </View>
        </Modal>
    );
};
const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.5)",
        alignItems: "center",
        justifyContent: "center"
    },
    container: {
        width: "85%",
        backgroundColor: "#fff",
        borderRadius: 16,
        padding: 24,
        alignItems: "center"
    },
    title: {
        fontSize: 18,
        fontWeight: "600",
        marginTop: 16
    },
    subtitle: {
        fontSize: 14,
        color: "#666",
        textAlign: "center",
        marginTop: 8
    }
});
