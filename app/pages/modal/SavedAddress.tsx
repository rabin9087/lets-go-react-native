import { addUserAddress } from "@/app/axios/user";
import { useAppDispatch } from "@/app/store/hooks";
import { saveAddress } from "@/app/store/slices/address.slice";
import { useColorScheme } from "@/components/useColorScheme";
import Colors from "@/constants/Colors";
import { Ionicons } from "@expo/vector-icons";
import Constants from "expo-constants";
import debounce from "lodash.debounce";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
    Animated,
    Dimensions,
    KeyboardAvoidingView,
    Modal,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View,
    PanResponder, // Added
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");
const GOOGLE_API_KEY = Constants.expoConfig?.extra?.GOOGLE_MAPS_API_KEY ?? "";

interface Props {
    visible: boolean;
    onClose: () => void;
}

const LABELS = [
    { key: "home", label: "Home", icon: "home-outline" },
    { key: "office", label: "Office", icon: "business-outline" },
    { key: "work", label: "Work", icon: "briefcase-outline" },
    { key: "other", label: "Other", icon: "pricetag-outline" },
] as const;

export const SaveAddressModal = ({ visible, onClose }: Props) => {
    const insets = useSafeAreaInsets();
    const dispatch = useAppDispatch();
    const systemTheme = useColorScheme() ?? "light";
    const colors = Colors[systemTheme];

    const isDark = systemTheme === 'dark';
    const surfaceColor = isDark ? "#1C1C1E" : "#FFFFFF";
    const inputBg = isDark ? "#2C2C2E" : "#F2F2F7";
    const textColor = isDark ? "#FFFFFF" : "#000000";
    const subTextColor = isDark ? "#8E8E93" : "#636366";

    const [label, setLabel] = useState<string>("home");
    const [customLabel, setCustomLabel] = useState("");
    const [useCustomLabel, setUseCustomLabel] = useState(false);
    const [address, setAddress] = useState("");
    const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(null);
    const [suggestions, setSuggestions] = useState<any[]>([]);

    const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;

    // --- PAN RESPONDER LOGIC ---
    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: (_, gestureState) => {
                // Only start responding if dragging downwards
                return gestureState.dy > 5;
            },
            onPanResponderMove: (_, gestureState) => {
                // Allow dragging down, but resist dragging up past the starting point
                if (gestureState.dy > 0) {
                    slideAnim.setValue(gestureState.dy);
                }
            },
            onPanResponderRelease: (_, gestureState) => {
                if (gestureState.dy > 120 || gestureState.vy > 0.5) {
                    // If dragged far enough or fast enough, close
                    handleClose();
                } else {
                    // Otherwise, spring back to top
                    Animated.spring(slideAnim, {
                        toValue: 0,
                        useNativeDriver: true,
                        tension: 65,
                        friction: 11,
                    }).start();
                }
            },
        })
    ).current;

    useEffect(() => {
        if (visible) {
            Animated.spring(slideAnim, {
                toValue: 0,
                useNativeDriver: true,
                tension: 65,
                friction: 11,
            }).start();
        } else {
            Animated.timing(slideAnim, {
                toValue: SCREEN_HEIGHT,
                duration: 250,
                useNativeDriver: true,
            }).start();
        }
    }, [visible]);

    const handleClose = () => {
        Animated.timing(slideAnim, {
            toValue: SCREEN_HEIGHT,
            duration: 250,
            useNativeDriver: true,
        }).start(() => {
            setAddress("");
            setSuggestions([]);
            setUseCustomLabel(false);
            onClose();
        });
    };
    // ----------------------------

    const fetchSuggestions = async (text: string) => {
        if (!text) return setSuggestions([]);
        try {
            const res = await fetch(`https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${text}&key=${GOOGLE_API_KEY}`);
            const data = await res.json();
            setSuggestions(data.predictions ?? []);
        } catch (err) { console.error(err); }
    };

    const debouncedFetch = useMemo(() => debounce(fetchSuggestions, 400), []);

    const onSelectAddress = async (placeId: string, description: string) => {
        setSuggestions([]);
        setAddress(description);
        try {
            const res = await fetch(`https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&key=${GOOGLE_API_KEY}`);
            const data = await res.json();
            const loc = data?.result?.geometry?.location;
            if (loc) setCoords({ latitude: loc.lat, longitude: loc.lng });
        } catch (err) { console.error(err); }
    };

    const handleSave = async () => {
        if (!coords || !address) {
            Toast.show({ type: "error", text1: "Address required" });
            return;
        }
        const finalLabel = useCustomLabel ? customLabel : label;
        const res = await addUserAddress({ label: finalLabel, address, coords });
        if (res?.status === "success") {
            dispatch(saveAddress({ label: finalLabel, address, coords }));
            Toast.show({
                type: "success", 
                text1: "Address saved successfully"
            })
            
            handleClose();
        }
    };

    return (
        <Modal transparent visible={visible} animationType="none">
            <View style={styles.overlay}>
                <TouchableWithoutFeedback onPress={handleClose}>
                    <View style={StyleSheet.absoluteFill} />
                </TouchableWithoutFeedback>

                <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"}>
                    <Animated.View
                        {...panResponder.panHandlers} // Dragging logic attached here
                        style={[
                            styles.sheet,
                            {
                                transform: [{ translateY: slideAnim }],
                                backgroundColor: surfaceColor,
                                paddingBottom: insets.bottom + 20
                            }
                        ]}
                    >
                        <View style={[styles.handle, { backgroundColor: textColor + '30' }]} />

                        <Text style={[styles.title, { color: textColor }]}>Save Location</Text>

                        <Text style={[styles.sectionTitle, { color: subTextColor }]}>Category</Text>
                        {!useCustomLabel ? (
                            <View style={styles.labelRow}>
                                {LABELS.map((item) => {
                                    const active = label === item.key;
                                    return (
                                        <TouchableOpacity
                                            key={item.key}
                                            onPress={() => setLabel(item.key)}
                                            style={[styles.labelChip, { backgroundColor: active ? colors.text : inputBg }]}
                                        >
                                            <Ionicons name={item.icon} size={16} color={active ? colors.background : textColor} />
                                            <Text style={[styles.labelText, { color: active ? colors.background : textColor }]}>{item.label}</Text>
                                        </TouchableOpacity>
                                    );
                                })}
                                <TouchableOpacity onPress={() => setUseCustomLabel(true)} style={[styles.labelChip, { borderStyle: 'dashed', borderColor: colors.text, borderWidth: 1 }]}>
                                    <Text style={{ color: colors.text, fontWeight: '700' }}>+ Custom</Text>
                                </TouchableOpacity>
                            </View>
                        ) : (
                            <View style={styles.inputContainer}>
                                <TextInput
                                    value={customLabel}
                                    onChangeText={setCustomLabel}
                                    placeholder="Label Name (e.g. Gym)"
                                    placeholderTextColor={subTextColor}
                                    style={[styles.input, { color: textColor, backgroundColor: inputBg, borderColor: isDark ? '#444' : '#DDD' }]}
                                />
                                <TouchableOpacity onPress={() => setUseCustomLabel(false)}>
                                    <Text style={{ color: colors.tint, marginTop: 8 }}>Pick from list</Text>
                                </TouchableOpacity>
                            </View>
                        )}

                        <Text style={[styles.sectionTitle, { color: subTextColor, marginTop: 15 }]}>Address</Text>
                        <View style={[styles.searchWrapper, { backgroundColor: inputBg }]}>
                            <Ionicons name="search" size={18} color={textColor + '40'} />
                            <TextInput
                                value={address}
                                onChangeText={(t) => { setAddress(t); debouncedFetch(t); }}
                                placeholder="Search for address..."
                                placeholderTextColor={textColor + '40'}
                                style={[styles.textInput, { color: textColor }]}
                            />
                        </View>

                        {suggestions.length > 0 && (
                            <View style={[styles.suggestionList, { backgroundColor: inputBg }]}>
                                {suggestions.slice(0, 3).map((item) => (
                                    <TouchableOpacity key={item.place_id} style={styles.suggestionItem} onPress={() => onSelectAddress(item.place_id, item.description)}>
                                        <Ionicons name="location" size={18} color={colors.tint} />
                                        <Text style={[styles.suggestionText, { color: textColor }]} numberOfLines={1}>{item.description}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        )}

                        <View style={styles.footer}>
                            <TouchableOpacity
                                onPress={handleClose}
                                style={[styles.cancelBtn, { backgroundColor: isDark ? "#2C2C2E" : "#E5E5EA" }]}
                            >
                                <Text style={{ color: textColor, opacity: 0.8, fontWeight: '600' }}>Cancel</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={handleSave}
                                style={[styles.saveBtn, { backgroundColor: colors.text }]}
                            >
                                <Text style={{ color: colors.background, fontWeight: "700", fontSize: 16 }}>Save Address</Text>
                            </TouchableOpacity>
                        </View>
                    </Animated.View>
                </KeyboardAvoidingView>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "flex-end" },
    sheet: { width: "100%", borderTopLeftRadius: 30, borderTopRightRadius: 30, paddingHorizontal: 20, paddingTop: 12 },
    handle: { width: 45, height: 5, borderRadius: 10, alignSelf: "center", marginBottom: 20 },
    title: { fontSize: 24, fontWeight: "900", marginBottom: 20, letterSpacing: -0.5 },
    sectionTitle: { fontSize: 12, fontWeight: "800", textTransform: "uppercase", marginBottom: 10, letterSpacing: 0.5 },
    labelRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 15 },
    labelChip: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 16, paddingVertical: 12, borderRadius: 14 },
    labelText: { fontSize: 14, fontWeight: "700" },
    inputContainer: { marginBottom: 15 },
    input: { borderWidth: 1, borderRadius: 14, padding: 16, fontSize: 16 },
    searchWrapper: { flexDirection: "row", alignItems: "center", borderRadius: 14, paddingHorizontal: 14, height: 56, gap: 10 },
    textInput: { flex: 1, fontSize: 16, height: '100%', fontWeight: '500' },
    suggestionList: { marginTop: 8, borderRadius: 14, overflow: "hidden" },
    suggestionItem: { flexDirection: "row", alignItems: "center", padding: 16, borderBottomWidth: 0.5, borderBottomColor: 'rgba(150,150,150,0.1)' },
    suggestionText: { marginLeft: 10, flex: 1, fontSize: 14, fontWeight: '500' },
    footer: { flexDirection: "row", marginTop: 30, alignItems: "center", gap: 12 },
    cancelBtn: { flex: 1, height: 58, borderRadius: 18, justifyContent: "center", alignItems: "center" },
    saveBtn: { flex: 2, height: 58, borderRadius: 18, justifyContent: "center", alignItems: "center" },
});