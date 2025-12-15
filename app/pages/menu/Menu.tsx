import { useColorScheme } from "@/components/useColorScheme";
import AntDesign from "@expo/vector-icons/AntDesign";
import { StyleSheet, View } from "react-native";

const Menu = () => {
    const theme = useColorScheme() ?? "light";
    const isDark = theme === "dark";

    return (
        <View
            style={[
                styles.container,
                {
                    backgroundColor: isDark ? "#fff" : "#000",
                },
            ]}
        >
            <AntDesign
                name="menu"
                size={22}
                color={isDark ? "#000" : "#fff"}
            />
        </View>
    );
};

export default Menu;

const styles = StyleSheet.create({
    container: {
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: "center",
        justifyContent: "center",

        // Shadow
        elevation: 6,
        shadowColor: "#000",
        shadowOpacity: 0.2,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 3 },
    },
});
