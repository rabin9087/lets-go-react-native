import AntDesign from '@expo/vector-icons/AntDesign';
import { StyleSheet, View } from 'react-native';

const Menu = () => {
    return (
        <View style={styles.container}>
            <AntDesign name="menu" size={28} />
        </View>
    );
};

export default Menu;

const styles = StyleSheet.create({
    container: {
        padding: 10,
        backgroundColor: "white",
        borderRadius: 8,
        // Shadows
        elevation: 5,
        shadowColor: "#000",
        shadowOpacity: 0.25,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 2 },

        // Auto width & height
        alignSelf: "flex-start",
    },
});
