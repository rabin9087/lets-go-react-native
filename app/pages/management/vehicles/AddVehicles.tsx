import { addNewVehicle, updateVehicle } from "@/app/axios/driver";
import { useAppDispatch, useAppSelector } from "@/app/store/hooks";
import { addVehicle } from "@/app/store/slices/driver.slice";
import { IVehicle } from "@/app/store/slices/types.slice";
import Colors from "@/constants/Colors";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    useColorScheme,
} from "react-native";
import Toast from "react-native-toast-message";

/* -------------------- CONFIG -------------------- */
const VEHICLE_OPTIONS = [
    { id: "car", label: "Car", icon: "car-outline" },
    { id: "bike", label: "Bike", icon: "bicycle-outline" },
    { id: "safari", label: "City Safari", icon: "bus-outline" },
    { id: "van", label: "Van", icon: "cube-outline" },
    { id: "bus", label: "Bus", icon: "bus" },
];

const AddVehicleForm = () => {
    const theme = useColorScheme() ?? "light";
    const isDark = theme === "dark";
    const themeColors = Colors[theme];
    const router = useRouter();
    const dispatch = useAppDispatch();

    const [loading, setLoading] = useState(false);
    const [loadingRego, setLoadingRego] = useState<string | null>(null);
    const [showForm, setShowForm] = useState(false);

    const { driver } = useAppSelector(s => s.driverInfo);
    const vehicleList: IVehicle[] = driver?.vehicles || [];

    const [newVehicle, setNewVehicle] = useState<IVehicle>({
        vehicleType: "car",
        model: "",
        year: undefined,
        color: "",
        rego: "",
        photos: [],
        inUse: false
    });

    const handleChange = (field: keyof IVehicle, value: string | number) => {
        setNewVehicle((prev) => ({ ...prev, [field]: value }));
    };

    const handleSave = async () => {
        if (!newVehicle.model || !newVehicle.rego || !newVehicle.year) {
            Alert.alert("Required", "Please fill in all required fields");
            return;
        }

        setLoading(true);
        try {
            const res = await addNewVehicle(newVehicle);
            console.log(res)
            if (res?.status === "success") {
                dispatch(addVehicle(res.data?.vehicle as IVehicle));
                setShowForm(false);
                setNewVehicle({ vehicleType: "car", model: "", year: undefined, color: "", rego: "", photos: [], inUse: false });
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleOnInUsevehicle = async (newRego: string, currentInUse: boolean) => {
        // If already in use, no need to trigger update
        if (currentInUse) return;

        // Find the rego of the vehicle that is currently marked as inUse: true
        const currentActiveVehicle = vehicleList.find(v => v.inUse === true);
        const oldRego = currentActiveVehicle?.rego || "";

        setLoadingRego(newRego);
        try {
            // Sending oldRego (to turn off), clickedRego (to turn on), and status: true
            const res = await updateVehicle(oldRego, newRego);
            console.log(res)
            if (res?.status === "success") {
                // Assuming your slice handles the array update logic
                dispatch(addVehicle(res.data?.vehicle as IVehicle));
                Toast.show({
                    type: "success",
                    text1: "vehicle Added Successfully!"
                })
                router.push("/pages/home/Map")
            }
        } catch (error) {
            console.error("Update vehicle error:", error);
        } finally {
            setLoadingRego(null);
        }
    }

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={{ flex: 1, backgroundColor: themeColors.background }}
        >
            <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

            <View style={styles.navBar}>
                <TouchableOpacity
                    onPress={() => router.back()}
                    style={[styles.backButton]}
                >
                    <Ionicons name="chevron-back" size={24} color={themeColors.text} />
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
                <View style={styles.header}>
                    <Text style={[styles.title, { color: themeColors.text }]}>My Vehicles</Text>
                    <Text style={styles.subtitle}>Select your active vehicle for today</Text>
                </View>

                {!showForm && vehicleList.length > 0 && (
                    <View style={styles.listContainer}>
                        {vehicleList.map((item, index) => (
                            <TouchableOpacity
                                key={index}
                                activeOpacity={0.8}
                                onPress={() => handleOnInUsevehicle(item.rego!, !!item.inUse)}
                                style={[
                                    styles.vehicleCard,
                                    { backgroundColor: isDark ? "#1C1C1E" : "#FFF" },
                                    item.inUse && { borderColor: themeColors.backgroundPrimary, borderWidth: 1 }
                                ]}
                            >
                                <View style={styles.cardRow}>
                                    <View style={[styles.iconBox, { backgroundColor: themeColors.backgroundPrimary + '15' }]}>
                                        <Ionicons name="car" size={24} color={themeColors.backgroundPrimary} />
                                    </View>
                                    <View style={styles.cardMainInfo}>
                                        <Text style={[styles.modelText, { color: themeColors.text }]}>{item.model}</Text>
                                        <Text style={styles.regoText}>{item.rego} • {item.vehicleType}</Text>
                                    </View>
                                    <View style={styles.selectionContainer}>
                                        {loadingRego === item.rego ? (
                                            <ActivityIndicator size="small" color={themeColors.backgroundPrimary} />
                                        ) : item.inUse ? (
                                            <View style={[styles.statusBadge, { backgroundColor: isDark ? "#1B3921" : "#E8F5E9" }]}>
                                                <Ionicons
                                                    name="checkmark-circle"
                                                    size={24}
                                                    color={isDark ? "#81C784" : "#2E7D32"}
                                                />
                                            </View>
                                        ) : (
                                            <View style={styles.circleOnly}>
                                                <Ionicons
                                                    name="ellipse-outline"
                                                    size={24}
                                                    color="#8E8E93"
                                                />
                                            </View>
                                        )}
                                    </View>
                                </View>
                            </TouchableOpacity>
                        ))}
                    </View>
                )}

                {!showForm && (
                    <TouchableOpacity
                        activeOpacity={0.7}
                        style={[styles.addNewButton, { borderStyle: 'dashed', borderColor: themeColors.backgroundPrimary }]}
                        onPress={() => setShowForm(true)}
                    >
                        <Ionicons name="add-circle" size={22} color={themeColors.backgroundPrimary} />
                        <Text style={[styles.addNewText, { color: themeColors.backgroundPrimary }]}>
                            {vehicleList.length > 0 ? "Add Another Vehicle" : "Register First Vehicle"}
                        </Text>
                    </TouchableOpacity>
                )}

                {showForm && (
                    <View style={[styles.formContainer, { backgroundColor: isDark ? "#1C1C1E" : "#FFF" }]}>
                        <View style={styles.formHeader}>
                            <Text style={[styles.formTitle, { color: themeColors.text }]}>New Vehicle</Text>
                            <TouchableOpacity onPress={() => setShowForm(false)}>
                                <Ionicons name="close-circle" size={28} color="#FF3B30" />
                            </TouchableOpacity>
                        </View>

                        <Text style={[styles.label, { color: isDark ? "#8E8E93" : "#3A3A3C" }]}>Type</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.typeSelector}>
                            {VEHICLE_OPTIONS.map((opt) => (
                                <TouchableOpacity
                                    key={opt.id}
                                    onPress={() => handleChange("vehicleType", opt.id)}
                                    style={[
                                        styles.typeOption,
                                        { backgroundColor: isDark ? "#2C2C2E" : "#F2F2F7" },
                                        newVehicle.vehicleType === opt.id && { borderColor: themeColors.backgroundPrimary, borderWidth: 2 }
                                    ]}
                                >
                                    <Ionicons name={opt.icon as any} size={20} color={newVehicle.vehicleType === opt.id ? themeColors.backgroundPrimary : "#8E8E93"} />
                                    <Text style={[styles.typeText, { color: newVehicle.vehicleType === opt.id ? themeColors.backgroundPrimary : "#8E8E93" }]}>{opt.label}</Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>

                        <InputField label="Model" value={newVehicle.model} onChangeText={(v: string) => handleChange("model", v)} themeColors={themeColors} isDark={isDark} />

                        <View style={styles.row}>
                            <View style={{ flex: 1, marginRight: 8 }}>
                                <InputField label="Year" keyboardType="numeric" value={newVehicle.year?.toString() || ""} onChangeText={(v: string) => handleChange("year", parseInt(v) || 0)} themeColors={themeColors} isDark={isDark} />
                            </View>
                            <View style={{ flex: 1, marginLeft: 8 }}>
                                <InputField label="Color" value={newVehicle.color} onChangeText={(v: string) => handleChange("color", v)} themeColors={themeColors} isDark={isDark} />
                            </View>
                        </View>

                        <InputField label="Rego / Plate" value={newVehicle.rego} onChangeText={(v: string) => handleChange("rego", v)} autoCapitalize="characters" themeColors={themeColors} isDark={isDark} />

                        <TouchableOpacity
                            onPress={handleSave}
                            disabled={loading}
                            style={[styles.saveBtn, { backgroundColor: themeColors.backgroundPrimary }]}
                        >
                            {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.saveBtnText}>Save Vehicle</Text>}
                        </TouchableOpacity>
                    </View>
                )}
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

const InputField = ({ label, isDark, themeColors, ...props }: any) => (
    <View style={styles.inputGroup}>
        <Text style={[styles.inputLabel, { color: isDark ? "#8E8E93" : "#3A3A3C" }]}>{label}</Text>
        <TextInput
            style={[styles.input, { backgroundColor: isDark ? "#2C2C2E" : "#F2F2F7", color: themeColors.text, borderColor: isDark ? "#3A3A3C" : "#E5E5EA" }]}
            placeholderTextColor="#8E8E93"
            {...props}
        />
    </View>
);

const styles = StyleSheet.create({
    navBar: {
        paddingTop: Platform.OS === 'ios' ? 50 : 20,
        paddingHorizontal: 20,
        paddingBottom: 10,
    },
    selectionContainer: {
        justifyContent: 'center',
        alignItems: 'flex-end',
        minWidth: 50,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    scrollContainer: { paddingHorizontal: 20, paddingBottom: 50 },
    header: { marginBottom: 25 },
    title: { fontSize: 32, fontWeight: '800', letterSpacing: -1 },
    subtitle: { fontSize: 16, color: '#8E8E93', marginTop: 5 },
    listContainer: { gap: 15, marginBottom: 25 },
    vehicleCard: {
        padding: 16,
        borderRadius: 20,
        ...Platform.select({
            ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.08, shadowRadius: 10 },
            android: { elevation: 3 }
        })
    },
    cardRow: { flexDirection: 'row', alignItems: 'center' },
    iconBox: { width: 52, height: 52, borderRadius: 15, justifyContent: 'center', alignItems: 'center' },
    cardMainInfo: { flex: 1, marginLeft: 15 },
    modelText: { fontSize: 18, fontWeight: '700' },
    regoText: { fontSize: 14, color: '#8E8E93', marginTop: 2, fontWeight: '500' },
    statusBadge: { borderRadius: 12 },
    circleOnly: { paddingRight: 2 },
    addNewButton: {
        height: 60,
        borderRadius: 18,
        borderWidth: 1.5,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 10,
    },
    addNewText: { fontSize: 16, fontWeight: '700' },
    formContainer: {
        padding: 24,
        borderRadius: 30,
        marginTop: 10,
    },
    formHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
    formTitle: { fontSize: 22, fontWeight: '800' },
    label: { fontSize: 15, fontWeight: '700', marginBottom: 12 },
    typeSelector: { flexDirection: 'row', marginBottom: 20 },
    typeOption: { paddingHorizontal: 16, paddingVertical: 12, borderRadius: 14, marginRight: 10, flexDirection: 'row', alignItems: 'center', gap: 8 },
    typeText: { fontSize: 14, fontWeight: '700' },
    inputGroup: { marginBottom: 18 },
    inputLabel: { fontSize: 12, fontWeight: '800', marginBottom: 8, textTransform: 'uppercase' },
    input: { height: 54, borderRadius: 15, paddingHorizontal: 16, borderWidth: 1, fontSize: 16 },
    row: { flexDirection: 'row' },
    saveBtn: { height: 58, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginTop: 15 },
    saveBtnText: { color: '#FFF', fontSize: 18, fontWeight: '700' }
});

export default AddVehicleForm;