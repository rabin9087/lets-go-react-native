import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useAppSelector } from "@/app/store/hooks";
import { useColorScheme } from "@/components/useColorScheme.web";

type RequestButtonProps = {
    loading: boolean;
    handleGoOnline: () => void;
};

const theme = useColorScheme() ?? "light";


const RequestButton = ({ loading, handleGoOnline }: RequestButtonProps) => {
    return (
        <View style={styles.wrapper}>
            <TouchableOpacity
                style={styles.button}
                onPress={handleGoOnline}
                disabled={loading}
            >
                {loading ? (
                    <ActivityIndicator color={theme ? "#fff" : "#000"} />
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
