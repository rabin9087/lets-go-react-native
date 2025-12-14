import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { StyleSheet, TextInput, View } from "react-native";

interface Props {
    currentLocation: { latitude: number; longitude: number } | null;
    destination: string;
    onDestinationChange: (text: string) => void;
}

const Destination = ({ destination, onDestinationChange }: Props) => {
    const router = useRouter();

    return (
        <View style={styles.card}>
            {/* Destination Input */}
            <View style={styles.inputContainer}>
                <Ionicons name="location" size={18} color="red" />
                    <TextInput
                        style={styles.input}
                        value={destination}
                        onPress={() => {
                            router.push("pages/home/SearchDesitantion");
                        }}
                        onChangeText={onDestinationChange}
                        placeholder="Enter destination"
                        placeholderTextColor="#999"
                    />
                
                </View>
        </View>
    );
};

export default Destination;

const styles = StyleSheet.create({
    card: {
        backgroundColor: "#fff",
        padding: 12,
        borderRadius: 12,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 5,
        width: "80%",
    },
    inputContainer: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#F3F3F3",
        paddingHorizontal: 10,
        paddingVertical: 8,
        borderRadius: 10,
    },
    input: {
        marginLeft: 8,
        flex: 1,
        fontSize: 16,
        color: "#333",
    },
});
