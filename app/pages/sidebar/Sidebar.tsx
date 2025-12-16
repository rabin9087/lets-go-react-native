import { logoutUser } from "@/app/axios/user";
import { useAppDispatch, useAppSelector } from "@/app/store/hooks";
import { setUser } from "@/app/store/slices/user.slice";
import { useColorScheme } from "@/components/useColorScheme";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useEffect, useRef } from "react";
import {
    Animated,
    Dimensions,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { IUser } from "../user/user.types";

const { width } = Dimensions.get("window");

interface SidebarProps {
    visible: boolean;
    onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ visible, onClose }) => {
    const slideAnim = useRef(new Animated.Value(-width * 0.7)).current;
    const { user } = useAppSelector((s) => s.userInfo);

    const theme = useColorScheme() ?? "light";
    const isDark = theme === "dark";

    const colors = {
        bg: isDark ? "#000" : "#fff",
        text: isDark ? "#fff" : "#000",
        subText: isDark ? "#aaa" : "#555",
        border: isDark ? "#222" : "#e5e5e5",
        overlay: "rgba(0,0,0,0.4)",
        logout: "#ff3b30",
        itemBg: isDark ? "#0f0f0f" : "#fafafa",
    };

    useEffect(() => {
        Animated.timing(slideAnim, {
            toValue: visible ? 0 : -width * 0.7,
            duration: 280,
            useNativeDriver: false,
        }).start();
    }, [visible]);

    const router = useRouter();
    const dispatch = useAppDispatch();


    return (
        <>
            {/* Overlay */}
            {visible && (
                <TouchableOpacity
                    style={[styles.overlay, { backgroundColor: colors.overlay }]}
                    onPress={onClose}
                    activeOpacity={1}
                />
            )}

            {/* Sidebar */}
            <Animated.View
                style={[
                    styles.sidebar,
                    {
                        left: slideAnim,
                        backgroundColor: colors.bg,
                        borderRightColor: colors.border,
                    },
                ]}
            >
                {/* Header */}
                <View style={styles.header}>
                    <Text style={[styles.title, { color: colors.text }]}>
                        {user?.name || "Guest"}
                    </Text>
                    <Text style={[styles.role, { color: colors.subText }]}>
                        {user?.role ? `(${user.role.toUpperCase()})` : ""}
                    </Text>
                </View>

                {/* Items */}
                <SidebarItem
                    label="Account"
                    onPress={() => {
                        router.push("pages/sidebar/Account");
                        onClose();
                    }}
                    colors={colors}
                />

                <SidebarItem
                    label="Sign In"
                    onPress={() => {
                        router.push("pages/user/UserSignin");
                        onClose();
                    }}
                    colors={colors}
                />

                <SidebarItem
                    label="Sign Up"
                    onPress={() => {
                        router.push("pages/user/UserSignup");
                        onClose();
                    }}
                    colors={colors}
                />

                <SidebarItem
                    label="Mode"
                    onPress={() => { }}
                    colors={colors}
                />

            </Animated.View>
        </>
    );
};

export default Sidebar;

/* ---------------- REUSABLE ITEM ---------------- */

const SidebarItem = ({
    label,
    onPress,
    colors,
}: {
    label: string;
    onPress: () => void;
    colors: any;
}) => (
    <TouchableOpacity
        style={[
            styles.item,
            { borderBottomColor: colors.border },
        ]}
        onPress={onPress}
        activeOpacity={0.7}
    >
        <Text style={[styles.itemText, { color: colors.text }]}>
            {label}
        </Text>
    </TouchableOpacity>
);

/* ---------------- STYLES ---------------- */

const styles = StyleSheet.create({
    overlay: {
        position: "absolute",
        inset: 0,
        zIndex: 999,
    },
    sidebar: {
        position: "absolute",
        top: 0,
        bottom: 0,
        width: width * 0.7,
        zIndex: 1000,
        paddingTop: 60,
        paddingHorizontal: 20,
        borderRightWidth: 1,
    },
    header: {
        marginBottom: 30,
    },
    title: {
        fontSize: 22,
        fontWeight: "700",
    },
    role: {
        fontSize: 14,
        marginTop: 4,
    },
    item: {
        paddingVertical: 16,
        borderBottomWidth: 1,
    },
    itemText: {
        fontSize: 16,
        fontWeight: "500",
    },
    logout: {
        fontSize: 16,
        fontWeight: "600",
    },
});
