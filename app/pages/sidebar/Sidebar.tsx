import { logoutUser } from "@/app/axios/user";
import { useAppDispatch, useAppSelector } from "@/app/store/hooks";
import { TInitialState, initialState, setUser } from "@/app/store/slices/user.slice";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useEffect, useRef } from "react";
import {
    Animated,
    Dimensions,
    StyleSheet,
    Text,
    TouchableOpacity
} from "react-native";
import { IUser } from "../user/user.types";

const { width } = Dimensions.get("window");

interface SidebarProps {
    visible: boolean;
    onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ visible, onClose }) => {
    const slideAnim = useRef(new Animated.Value(-width * 0.7)).current; // hidden initially
    const {user} = useAppSelector(s => s.userInfo)
    useEffect(() => {
        Animated.timing(slideAnim, {
            toValue: visible ? 0 : -width * 0.7,
            duration: 300,
            useNativeDriver: false,
        }).start();
    }, [visible]);

    const router = useRouter();
    const dispatch = useAppDispatch();

    
    const handleOnLogout = async () => {
        try {
            // 1. Call backend logout endpoint (optional)
            dispatch(setUser({} as IUser));

            // 3. Clear tokens from AsyncStorage
            
            // 4. Navigate to login page
            router.replace("/pages/user/UserSignin");
            const refreshJWT = await AsyncStorage.getItem("refreshJWT");

            if (refreshJWT) {
                const res = await logoutUser()
                console.log("This function called", res)
            }

            // 2. Remove user from Redux
            await AsyncStorage.removeItem("accessJWT");
            await AsyncStorage.removeItem("refreshJWT");
           
        } catch (error) {
            console.error("Logout failed:", error);
            // Optionally show a toast or alert
        }
    };

    return (
        <>
            {/* Transparent overlay */}
            {visible && (
                <TouchableOpacity style={styles.overlay} onPress={onClose} />
            )}

            <Animated.View style={[styles.sidebar, { left: slideAnim }]}>
                <Text style={styles.title}>{user?.name}</Text>
                <Text style={styles.role}>({ user?.role?.toLocaleUpperCase()})</Text>

                <TouchableOpacity
                    style={styles.item}
                    onPress={() => {
                        router.push("account");
                        onClose();
                    }}
                >
                    <Text style={styles.itemText}>Account</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.item}
                    onPress={() => {
                        router.push("pages/user/UserSignin");
                        onClose();
                    }}
                >
                    <Text style={styles.itemText}>Sign In</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.item}
                    onPress={() => {
                        router.push("pages/user/UserSignup");
                        onClose();
                    }}
                >
                    <Text style={styles.itemText}>Sign Up</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.item} onPress={() => alert("Toggle Mode")}>
                    <Text style={styles.itemText}>Mode</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.item} onPress={handleOnLogout}>
                    <Text style={styles.logout}>logout</Text>
                </TouchableOpacity>
            </Animated.View>
        </>
    );
};

export default Sidebar;

const styles = StyleSheet.create({
    overlay: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0,0,0,0.3)",
        zIndex: 999,
    },
    sidebar: {
        position: "absolute",
        top: 0,
        bottom: 0,
        width: width * 0.7,
        backgroundColor: "#fff",
        zIndex: 1000,
        paddingTop: 60,
        paddingHorizontal: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: "700",
    },
    role: {
        fontSize: 20,
        fontWeight: "400",
        marginBottom: 20,
    },
    item: {
        paddingVertical: 15,
        borderBottomColor: "#ddd",
        borderBottomWidth: 1,
    },
    itemText: {
        fontSize: 18,
    },
    logout: {
        color: "#ff0000",
        fontSize: 18,
    }
});
