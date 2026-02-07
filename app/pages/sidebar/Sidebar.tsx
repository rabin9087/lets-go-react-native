import { useAppSelector } from "@/app/store/hooks";
import { useColorScheme } from "@/components/useColorScheme";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useRef } from "react";
import {
    Animated,
    BackHandler,
    Dimensions,
    Platform,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

const { width } = Dimensions.get("window");
const SIDEBAR_WIDTH = width * 0.75;
const SAFE_TOP_PADDING = Platform.OS === "ios" ? 80 : (StatusBar.currentHeight ?? 0) + 40;

interface SidebarProps {
    visible: boolean;
    onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ visible, onClose }) => {
    const slideAnim = useRef(new Animated.Value(-SIDEBAR_WIDTH)).current;
    const opacityAnim = useRef(new Animated.Value(0)).current;

    const { user } = useAppSelector((s) => s.userInfo);
    const theme = useColorScheme() ?? "light";
    const isDark = theme === "dark";
    const router = useRouter();

    const colors = {
        bg: isDark ? "#121212" : "#FFFFFF",
        text: isDark ? "#E6E6E6" : "#1C1C1E",
        subText: isDark ? "#9BA1A6" : "#636366",
        border: isDark ? "#2C2C2E" : "#E5E5EA",
        overlay: "rgba(0,0,0,0.5)",
        accent: isDark ? "#0A84FF" : "#007AFF",
    };

    useEffect(() => {
        Animated.parallel([
            Animated.timing(slideAnim, {
                toValue: visible ? 0 : -SIDEBAR_WIDTH,
                duration: 300,
                useNativeDriver: true,
            }),
            Animated.timing(opacityAnim, {
                toValue: visible ? 1 : 0,
                duration: 300,
                useNativeDriver: true,
            })
        ]).start();

        if (visible) {
            const backAction = () => {
                onClose();
                return true;
            };
            const backHandler = BackHandler.addEventListener("hardwareBackPress", backAction);
            return () => backHandler.remove();
        }
    }, [visible]);

    const sidebarItems = [
        { label: "Account", icon: "person-outline", route: "pages/sidebar/Account" },
        { label: "Settings", icon: "settings-outline", route: "pages/setting/Setting" },
        { label: "Current Trip", icon: "car-outline", route: "pages/trips/ActiveTripDetails" },
        { label: "Dashboard", icon: "speedometer-outline", route: "pages/setting/profile/DriverProfileManager" },
    ];

    return (
        <>
            <Animated.View
                pointerEvents={visible ? "auto" : "none"}
                style={[styles.overlay, { backgroundColor: colors.overlay, opacity: opacityAnim }]}
            >
                <TouchableOpacity style={{ flex: 1 }} onPress={onClose} activeOpacity={1} />
            </Animated.View>

            <Animated.View
                style={[
                    styles.sidebar,
                    {
                        transform: [{ translateX: slideAnim }],
                        backgroundColor: colors.bg,
                        borderRightColor: colors.border,
                    },
                ]}
            >
                <TouchableOpacity onPress={() => { router.push("/pages/setting/profile/Profile") }} activeOpacity={1}>

                    <View style={styles.header}>
                        <View style={[styles.avatar, { backgroundColor: isDark ? "#2C2C2E" : "#F2F2F7" }]}>
                            <Text style={[styles.avatarText, { color: colors.accent }]}>
                                {user?.name?.charAt(0) || "G"}
                            </Text>
                        </View>
                        <View style={styles.headerInfo}>
                            <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
                                {user?.name || "Guest"}
                            </Text>
                            <Text style={[styles.role, { color: colors.subText }]}>
                                {user?.role?.toUpperCase() || "VISITOR"}
                            </Text>
                        </View>
                    </View>
                </TouchableOpacity>
                <View style={[styles.divider, { backgroundColor: colors.border }]} />

                <View style={styles.itemsContainer}>
                    {sidebarItems.map((item, idx) => (
                        <TouchableOpacity
                            key={idx}
                            activeOpacity={0.6}
                            style={styles.item}
                            onPress={() => {
                                if (item.route) router.push(item.route as any);
                                onClose();
                            }}
                        >
                            <View style={styles.itemLeft}>
                                <Ionicons name={item.icon as any} size={22} color={colors.accent} style={styles.itemIcon} />
                                <Text style={[styles.itemText, { color: colors.text }]}>{item.label}</Text>
                            </View>
                            {/* Added the right arrow icon */}
                            <Ionicons name="chevron-forward" size={18} color={isDark ? "#48484A" : "#C4C4C6"} />
                        </TouchableOpacity>
                    ))}
                </View>

                <View style={styles.footer}>
                    <Text style={[styles.versionText, { color: colors.subText }]}>v1.0.0</Text>
                </View>
            </Animated.View>
        </>
    );
};

const styles = StyleSheet.create({
    overlay: { ...StyleSheet.absoluteFillObject, zIndex: 999 },
    sidebar: {
        position: "absolute",
        top: 0,
        bottom: 0,
        width: SIDEBAR_WIDTH,
        zIndex: 1000,
        paddingTop: SAFE_TOP_PADDING,
        borderRightWidth: StyleSheet.hairlineWidth,
        ...Platform.select({
            android: { elevation: 24 },
            ios: {
                shadowColor: "#000",
                shadowOffset: { width: 4, height: 0 },
                shadowOpacity: 0.1,
                shadowRadius: 12,
            },
        }),
    },
    header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 24, marginBottom: 30 },
    avatar: { width: 54, height: 54, borderRadius: 27, justifyContent: "center", alignItems: "center", marginRight: 16 },
    avatarText: { fontSize: 22, fontWeight: "bold" },
    headerInfo: { flex: 1 },
    title: { fontSize: 20, fontWeight: "700" },
    role: { fontSize: 11, fontWeight: "600", letterSpacing: 1, marginTop: 2, opacity: 0.8 },
    divider: { height: 1, marginHorizontal: 24, marginBottom: 20, opacity: 0.5 },
    itemsContainer: { paddingHorizontal: 16 },
    item: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between", // Push arrow to the far right
        paddingVertical: 16,
        paddingHorizontal: 12,
        borderRadius: 12,
        marginBottom: 4
    },
    itemLeft: {
        flexDirection: "row",
        alignItems: "center",
        flex: 1,
    },
    itemIcon: { marginRight: 16, width: 24 },
    itemText: { fontSize: 16, fontWeight: "500" },
    footer: { position: "absolute", bottom: 40, left: 24 },
    versionText: { fontSize: 12, fontWeight: "500" },
});

export default Sidebar;