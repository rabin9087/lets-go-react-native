import { respondToTrip } from "@/app/axios/trip";
import { useAppDispatch, useAppSelector } from "@/app/store/hooks";
import { clearIncomingRide, setPickedup } from "@/app/store/slices/trip.slice";
import { setOpenModal } from "@/app/store/slices/user.slice";
import { useColorScheme } from "@/components/useColorScheme.web";
import Colors from "@/constants/Colors";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
    ActivityIndicator,
    StyleSheet,
    Text,
    TouchableOpacity,
} from "react-native";
import { ConfirmModal } from "../modal/driverAction/ConfirmModal";

type IPickedupButton = {
    loading?: boolean;
    confirmModal?: string
};

const PickedupButton = ({ loading, confirmModal }: IPickedupButton) => {
    const theme = useColorScheme() === "dark" ? "dark" : "light";
    const colors = Colors[theme];

    const { incomingRide, pickedup } = useAppSelector((s) => s.tripInfo);
    const { user } = useAppSelector((s) => s.userInfo);
    const dispatch = useAppDispatch();

    const handlePress = async () => {
        if (!incomingRide?._id) return;

        if (!pickedup) {
            dispatch(setPickedup(true));
            await respondToTrip({
                tripId: incomingRide._id,
                status: "pickedup",
                driverId: user?._id,
            });
        } else {
            await respondToTrip({
                tripId: incomingRide._id,
                status: "completed",
                driverId: user?._id,
            });
            dispatch(clearIncomingRide());
            dispatch(setPickedup(null));
        }
    };

    return (
        <TouchableOpacity
            activeOpacity={0.85}
            disabled={loading}
            onPress={() => dispatch(setOpenModal(true))}
            style={[
                styles.button,
                {
                    backgroundColor: pickedup ? "#16A34A" : colors.tint,
                },
            ]}
        >
            <ConfirmModal onConfirm={() => handlePress()} />
            {loading ? (
                <ActivityIndicator color="#fff" />
            ) : (
                <>
                    <Ionicons
                        name={pickedup ? "flag-outline" : "car-outline"}
                        size={18}
                        color="#fff"
                    />
                    <Text style={styles.text}>
                        {pickedup ? "Confirm Drop-off" : "Confirm Pickup"}
                    </Text>
                </>
            )}
        </TouchableOpacity>
    );
};

export default PickedupButton;

const styles = StyleSheet.create({
    button: {
        flex: 1,                 // 🔥 critical for row layout
        height: 56,
        borderRadius: 30,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,

        shadowColor: "#000",
        shadowOpacity: 0.25,
        shadowRadius: 5,
        shadowOffset: { width: 0, height: 4 },
        elevation: 6,
    },
    text: {
        color: "#fff",
        fontSize: 15,
        fontWeight: "600",
        letterSpacing: 0.4,
    },
});
