import { addUserAddress } from "@/app/axios/user";
import { useAppDispatch } from "@/app/store/hooks";
import { saveAddress } from "@/app/store/slices/address.slice";
import { useColorScheme } from "@/components/useColorScheme.web";
import Colors from "@/constants/Colors";
import { Ionicons } from "@expo/vector-icons";
import Constants from "expo-constants";
import debounce from "lodash.debounce";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
    Animated,
    FlatList,
    Modal,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View,
    ViewStyle,
} from "react-native";
import Toast from "react-native-toast-message";
import { PlacePrediction } from "../home/SearchDestiantion";

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

type LabelType = typeof LABELS[number]["key"];

export const SaveAddressModal = ({ visible, onClose }: Props) => {
    const dispatch = useAppDispatch();
    const scheme = useColorScheme();
    const theme: "light" | "dark" = scheme === "dark" ? "dark" : "light";
    const colors = Colors[theme];

    const [label, setLabel] = useState<LabelType>("home");
    const [customLabel, setCustomLabel] = useState("");
    const [useCustomLabel, setUseCustomLabel] = useState(false);

    const [address, setAddress] = useState("");
    const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(null);
    const [suggestions, setSuggestions] = useState<PlacePrediction[]>([]);

    const slideAnim = useRef(new Animated.Value(-500)).current;

    /* Slide animation */
    useEffect(() => {
        Animated.timing(slideAnim, {
            toValue: visible ? 0 : -500,
            duration: 300,
            useNativeDriver: true,
        }).start();
    }, [visible]);

    /* Google autocomplete */
    const fetchSuggestions = async (text: string) => {
        if (!text) return setSuggestions([]);
        try {
            const res = await fetch(
                `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${text}&key=${GOOGLE_API_KEY}`
            );
            const data = await res.json();
            setSuggestions(data.predictions ?? []);
        } catch (err) {
            console.log("Autocomplete error:", err);
        }
    };

    const debouncedFetch = useMemo(() => debounce(fetchSuggestions, 400), []);
    const onInputChange = (text: string) => {
        setAddress(text);
        debouncedFetch(text);
    };

    const onSelectAddress = async (placeId: string, description: string) => {
        setSuggestions([]);
        setAddress(description);

        try {
            const res = await fetch(
                `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&key=${GOOGLE_API_KEY}`
            );
            const data = await res.json();
            const loc = data?.result?.geometry?.location;
            if (loc) setCoords({ latitude: loc.lat, longitude: loc.lng });
        } catch (err) {
            console.log("Place details error:", err);
        }
    };

    const handleSave = async () => {
        if (!coords || !address) {
            Toast.show({
                type: "error",
                text1: "Address required",
                text2: "Please select a valid address",
                position: "bottom",
            });
            return;
        }

        const finalLabel =
            useCustomLabel && customLabel.trim()
                ? customLabel.trim()
                : label;

        const res = await addUserAddress({ label: finalLabel, address, coords  })
        if (res?.status === "success") {
            console.log(res)
            dispatch(saveAddress({ label: finalLabel, address, coords }));

            onClose();
            setAddress("");
            setCoords(null);
            setLabel("home");
            setCustomLabel("");
            setUseCustomLabel(false);
        }
    };

    return (
        <Modal transparent visible={visible} animationType="none">
            <TouchableWithoutFeedback>
                <View style={[styles.overlay, { backgroundColor: "rgba(0,0,0,0.5)" }]}>
                    <Animated.View
                        style={[
                            styles.container,
                            { transform: [{ translateY: slideAnim }], backgroundColor: colors.card },
                        ]}
                    >
                        <Text style={[styles.title, { color: colors.text }]}>
                            Save Address
                        </Text>

                        {/* LABEL SELECTION */}
                        {!useCustomLabel ? (
                            <>
                                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                                    Save as
                                </Text>

                                <View style={styles.labelRow}>
                                    {LABELS.map((item) => {
                                        const active = label === item.key;
                                        return (
                                            <TouchableOpacity
                                                key={item.key}
                                                onPress={() => setLabel(item.key)}
                                                style={[
                                                    styles.labelChip,
                                                    {
                                                        backgroundColor: active ? colors.tint : colors.seatBox,
                                                        borderColor: active ? colors.tint : colors?.border,
                                                    },
                                                ]}
                                            >
                                                <Ionicons
                                                    name={item.icon}
                                                    size={18}
                                                    color={active ? "#fff" : colors.text}
                                                />
                                                <Text
                                                    style={[
                                                        styles.labelText,
                                                        { color: active ? "#fff" : colors.text },
                                                    ]}
                                                >
                                                    {item.label}
                                                </Text>
                                            </TouchableOpacity>
                                        );
                                    })}

                                    <TouchableOpacity
                                        onPress={() => setUseCustomLabel(true)}
                                        style={[
                                            styles.labelChip,
                                            styles.customChip,
                                            { borderColor: colors.tint },
                                        ]}
                                    >
                                        <Ionicons name="add-outline" size={18} color={colors.tint} />
                                        <Text style={[styles.labelText, { color: colors.tint }]}>
                                            Custom
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            </>
                        ) : (
                            <>
                                <TouchableOpacity
                                    onPress={() => setUseCustomLabel(false)}
                                    activeOpacity={0.7}
                                    style={styles.backBtn}
                                >
                                    <Ionicons
                                        name="chevron-back"
                                        size={20}
                                        color={colors.tint}
                                    />
                                    <Text style={[styles.backText, { color: colors.tint }]}>
                                        Choose predefined
                                    </Text>
                                </TouchableOpacity>
                                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                                    Custom label
                                </Text>
                                <TextInput
                                    value={customLabel}
                                    onChangeText={setCustomLabel}
                                    placeholder="e.g. Gym, School"
                                    placeholderTextColor={colors.text + "80"}
                                    style={[
                                        styles.input,
                                        { color: colors.text, borderColor: colors.tint },
                                    ]}
                                />

                            </>
                        )}

                        {/* ADDRESS INPUT */}
                        <View style={[styles.card, styles.shadow, { backgroundColor: colors.seatBox }]}>
                            <Text style={[styles.label, { color: colors.text }]}>Address</Text>
                            <TextInput
                                value={address}
                                onChangeText={onInputChange}
                                placeholder="Add address"
                                placeholderTextColor={ "#ffbb00"}
                                style={[
                                    styles.input,
                                    { color: colors.text, borderColor: colors?.border },
                                ]}
                            />
                        </View>

                        {/* SUGGESTIONS */}
                        {suggestions.length > 0 && (
                            <View style={[styles.suggestionBox, { backgroundColor: colors.card }]}>
                                <FlatList
                                    data={suggestions}
                                    keyExtractor={(i) => i.place_id}
                                    renderItem={({ item }) => (
                                        <TouchableOpacity
                                            style={styles.suggestionItem}
                                            onPress={() =>
                                                onSelectAddress(item.place_id, item.description)
                                            }
                                        >
                                            <Ionicons
                                                name="location-outline"
                                                size={18}
                                                color={colors.tint}
                                            />
                                            <Text
                                                style={[
                                                    styles.suggestionText,
                                                    { color: colors.text },
                                                ]}
                                            >
                                                {item.description}
                                            </Text>
                                        </TouchableOpacity>
                                    )}
                                />
                            </View>
                        )}

                        {/* ACTIONS */}
                        <View style={styles.actions}>
                            <TouchableOpacity onPress={onClose} style={styles.cancel}>
                                <Text style={{ color: colors.text }}>Cancel</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={handleSave}
                                style={[styles.save, { backgroundColor: colors.tint }]}
                            >
                                <Text style={{ color: "#fff", fontWeight: "600" }}>
                                    Save
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </Animated.View>
                </View>
            </TouchableWithoutFeedback>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        paddingTop: Platform.OS === "ios" ? 50 : 30,
    },
    container: {
        marginHorizontal: 20,
        borderRadius: 20,
        padding: 20,
    },
    title: {
        fontSize: 18,
        fontWeight: "600",
        textAlign: "center",
        marginBottom: 12,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: "600",
        marginBottom: 8,
    },
    labelRow: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 10,
        marginBottom: 14,
    },
    labelChip: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 20,
        borderWidth: 1,
    },
    customChip: {
        borderStyle: "dashed",
    },
    labelText: {
        fontSize: 14,
        fontWeight: "500",
    },
    card: {
        borderRadius: 16,
        padding: 14,
        marginBottom: 14,
    },
    shadow: Platform.select({
        ios: {
            shadowColor: "#000",
            shadowOpacity: 0.1,
            shadowRadius: 10,
            shadowOffset: { width: 0, height: 6 },
        },
        android: { elevation: 4 },
    }) as ViewStyle,
    label: {
        fontSize: 13,
        marginBottom: 6,
        opacity: 0.7,
    },
    input: {
        borderWidth: 1,
        borderRadius: 12,
        padding: 12,
        fontSize: 15,
    },
    suggestionBox: {
        borderRadius: 14,
        overflow: "hidden",
        marginBottom: 12,
    },
    suggestionItem: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        paddingVertical: 12,
        paddingHorizontal: 10,
    },
    suggestionText: {
        fontSize: 14,
        flex: 1,
    },
    actions: {
        flexDirection: "row",
        justifyContent: "space-between",
    },
    cancel: {
        padding: 14,
    },
    save: {
        paddingHorizontal: 24,
        paddingVertical: 14,
        borderRadius: 14,
    },
    backBtn: {
        flexDirection: "row",
        alignItems: "center",
        marginTop: 10,
        paddingVertical: 6,
        alignSelf: "flex-start",
    },

    backText: {
        fontSize: 14,
        fontWeight: "500",
    },

});
