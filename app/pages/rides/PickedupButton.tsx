import { respondToTrip } from "@/app/axios/trip";
import { useAppDispatch, useAppSelector } from "@/app/store/hooks";
import { clearIncomingRide, setIncomingRide, setPickedup } from "@/app/store/slices/trip.slice";
import { View } from "@/components/Themed";
import { useColorScheme } from "@/components/useColorScheme.web";
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity } from "react-native";

type IPickedupButton = {
    loading?: boolean;
};

const theme = useColorScheme() ?? "light";

const PickedupButton = ({ loading }: IPickedupButton) => {
    const {incomingRide, pickedup } = useAppSelector(s => s.tripInfo)
    const {user} = useAppSelector(s => s.userInfo)
    const dispatch = useAppDispatch()

    const handleOnPickedup = () => {
        dispatch(setPickedup(true))
        respondToTrip({ _id: incomingRide?._id as string, status: "pickedup", driverId: user?._id})
    }
    const handleOnDropoff = () => {
       
        respondToTrip({ _id: incomingRide?._id as string, status: "completed", driverId: user?._id })
        dispatch(clearIncomingRide());
        dispatch(setPickedup(null))
    }
    return (
        <View style={styles.wrapper}>
        <TouchableOpacity
            style={styles.button}
            // onPress={handleGoOnline}
            disabled={loading}
        >
            {loading ? (
                <ActivityIndicator color={theme ? "#000" : "#fff"} />
            ) : (
                pickedup ? <Text onPress={handleOnDropoff} style={styles.text}>Dropoff </Text> : <Text onPress={handleOnPickedup} style={styles.text}>Pick up</Text>
            )}
        </TouchableOpacity>
        </View>
    );
};

export default PickedupButton;


const styles = StyleSheet.create({
    wrapper: {
        paddingHorizontal: 20,
        width: "60%",
    },

    button: {
        backgroundColor: theme ? "#fff" : "#000",
        paddingVertical: 15,
        borderRadius: 40,
        width: "100%",
        alignItems: "center",
        justifyContent: "center",

        // Uber-like shadow
        shadowColor: theme ? "#000" : "#fff",
        shadowOpacity: 0.3,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 3 },
        elevation: 6,
    },

    text: {
        color: theme ? "#000" : "#fff",
        fontSize: 18,
        fontWeight: "600",
        letterSpacing: 0.5,
    },
});
