import { useColorScheme } from "@/components/useColorScheme";
import Colors from "@/constants/Colors";
import { useRouter } from "expo-router";
import React from "react";
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";

const Setting = () => {
    const router = useRouter();
    const theme = useColorScheme() ?? "light";
    const isDark = theme === "dark";

    // Example action functions
    const toggleTheme = () => {
        Alert.alert("Theme toggled", "You can implement actual theme change here.");
    };

    const logout = () => {
        Alert.alert("Logout", "User logged out successfully.");
        router.replace("/pages/user/UserSignin"); // Redirect to login page
    };

    return (
        <View style={[styles.container, { backgroundColor: isDark ? "#000" : "#fff" }]}>
            {/* Back Button */}
            <TouchableOpacity
                style={styles.backBtn}
                onPress={() => router.back()}
            >
                <Text style={[styles.backText, { color: Colors[theme].text }]}>← Back</Text>
            </TouchableOpacity>

            <Text style={[styles.title, { color: isDark ? "#fff" : "#000" }]}>Settings</Text>

            {/* Buttons for actions */}
            <TouchableOpacity style={styles.button} onPress={toggleTheme}>
                <Text style={styles.buttonText}>Toggle Theme</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.button, { backgroundColor: "#ff3b30" }]} onPress={logout}>
                <Text style={styles.buttonText}>Logout</Text>
            </TouchableOpacity>
        </View>
    );
};

export default Setting;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
    },
    backBtn: {
        marginBottom: 20,
    },
    backText: {
        fontSize: 20,
        fontWeight: "500",
    },
    title: {
        fontSize: 24,
        fontWeight: "700",
        marginBottom: 30,
    },
    button: {
        backgroundColor: "#007AFF",
        paddingVertical: 14,
        paddingHorizontal: 20,
        borderRadius: 12,
        marginBottom: 15,
        alignItems: "center",
    },
    buttonText: {
        color: "#fff",
        fontWeight: "600",
        fontSize: 16,
    },
});
