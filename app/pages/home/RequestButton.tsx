import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useAppSelector } from "@/app/store/hooks";

type RequestButtonProps = {
    loading: boolean;
    handleGoOnline: () => void;
};

const RequestButton = ({ loading, handleGoOnline }: RequestButtonProps) => {
    return (
        <View style={styles.wrapper}>
            <TouchableOpacity
                style={styles.button}
                onPress={handleGoOnline}
                disabled={loading}
            >
                {loading ? (
                    <ActivityIndicator color="#fff" />
                ) : (
                    <Text style={styles.text}>Find Driver</Text>
                )}
            </TouchableOpacity>
        </View>
    );
};

export default RequestButton;


const styles = StyleSheet.create({
    wrapper: {
        paddingHorizontal: 20,
        width: "100%",
    },

    button: {
        backgroundColor: "#000",
        paddingVertical: 15,
        borderRadius: 40,
        width: "100%",
        alignItems: "center",
        justifyContent: "center",

        // Uber-like shadow
        shadowColor: "#000",
        shadowOpacity: 0.3,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 3 },
        elevation: 6,
    },

    text: {
        color: "#fff",
        fontSize: 18,
        fontWeight: "600",
        letterSpacing: 0.5,
    },
});
