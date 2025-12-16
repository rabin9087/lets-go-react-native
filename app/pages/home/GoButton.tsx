import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useColorScheme } from "@/components/useColorScheme.web";

type GoButtonProps = {
    loading: boolean;
    handleGoOnline: () => void;
    updateRoute? : boolean
};

const theme = useColorScheme() ?? "light";

const GoButton = ({ loading, handleGoOnline, updateRoute }: GoButtonProps) => {
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
                        updateRoute ? <Text style={styles.text}>Update </Text> :  <Text style={styles.text}>Let’s GO</Text>
                )}
            </TouchableOpacity>
        </View>
    );
};

export default GoButton;


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
