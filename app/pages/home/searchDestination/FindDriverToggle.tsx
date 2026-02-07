import Colors from "@/constants/Colors";
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useMemo, useState } from "react";
import {
    FlatList,
    KeyboardAvoidingView,
    Modal,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import countries from '../../../utils/countries.json';
import { setRegoPhone } from "@/app/store/slices/trip.slice";

type FindDriverToggleProps = {
    theme: "light" | "dark";
    searchValue: string;
};

// Strips non-digits and removes the leading 0
export function formatPhoneNumber(rawPhone: string): string {
    let digits = rawPhone.replace(/\D/g, "");
    if (digits.startsWith("0")) digits = digits.slice(1);
    return digits;
}

const FindDriverToggle = ({ theme, searchValue }: FindDriverToggleProps) => {
    const [isOn, setIsOn] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [modalView, setModalView] = useState<"input" | "country">("input");

    const [selectedCountry, setSelectedCountry] = useState(countries.find(c => c.code === "AU") || countries[0]);
    const [countrySearch, setCountrySearch] = useState("");
    const [hasManuallySelected, setHasManuallySelected] = useState(false);

    const isDark = theme === "dark";
    const isPhoneNumber = useMemo(() => /^\d/.test(searchValue), [searchValue]);

    useEffect(() => {
        if (hasManuallySelected) return;
        const getGeo = async () => {
            try {
                const res = await fetch("https://get.geojs.io/v1/ip/geo.json");
                const data = await res.json();
                const found = countries.find(c => c.name === data.country);
                if (found) setSelectedCountry(found);
            } catch (e) { console.log("Geo lookup failed"); }
        };
        getGeo();
    }, [hasManuallySelected]);

    const filteredCountries = useMemo(() => {
        return countries.filter(c =>
            c.name.toLowerCase().includes(countrySearch.toLowerCase()) ||
            c.dial_code.includes(countrySearch)
        );
    }, [countrySearch]);

    const handleTurnOn = () => {
        setIsOn(true);
        setModalView("input");
        setModalVisible(true);
    };

    const handleTurnOff = () => {
        setIsOn(false);
        setRegoPhone(null);
        setModalVisible(false);
    };

    // PROCESS DATA ONLY ON SAVE
    const handleSave = () => {

        
        if (isPhoneNumber) {
            const cleaned = formatPhoneNumber(searchValue);
            setRegoPhone(searchValue
                ? (isPhoneNumber ? `${selectedCountry?.dial_code} ${formatPhoneNumber(searchValue)}` : searchValue.toUpperCase())
                : "ENTER DETAILS");
        }
        setModalVisible(false);
    };

    const renderInputView = () => (
        <View style={[styles.modalCard, { backgroundColor: isDark ? "#1C1C1E" : "#FFFFFF" }]}>
            <Text style={[styles.modalTitle, { color: Colors[theme].text }]}>Enter Driver Details</Text>

            <View style={[styles.inputRow, { borderColor: Colors[theme].border, backgroundColor: isDark ? "#2C2C2E" : "#F2F2F7" }]}>
                {isPhoneNumber && (
                    <TouchableOpacity
                        style={styles.countryPicker}
                        onPress={() => setModalView("country")}
                        activeOpacity={0.7}
                    >
                        <Text style={styles.flag}>{selectedCountry?.emoji}</Text>
                        <Text style={[styles.dialCodeText, { color: Colors[theme].text }]}>
                            {selectedCountry?.dial_code}
                        </Text>
                        <Ionicons name="chevron-down" size={14} color={Colors[theme].text} />
                    </TouchableOpacity>
                )}
                <TextInput
                    placeholder="REGO or PHONE"
                    value={searchValue}
                    onChangeText={setRegoPhone} // User can type 0 freely here
                    autoFocus
                    style={[styles.modalInput, { color: Colors[theme].text }]}
                    placeholderTextColor="#8E8E93"
                    // keyboardType={isPhoneNumber ? "phone-pad" : "default"}
                    autoCapitalize={isPhoneNumber ? "none" : "characters"}
                />
            </View>

            <View style={styles.modalButtons}>
                <TouchableOpacity style={[styles.modalBtn, styles.cancelBtn]} onPress={handleTurnOff}>
                    <Text style={styles.modalBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.modalBtn, styles.saveBtn]} onPress={handleSave}>
                    <Text style={styles.modalBtnText}>Save</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    const renderCountryView = () => (
        <View style={[styles.fullModalContent, { backgroundColor: Colors[theme].background }]}>
            <View style={styles.countryHeader}>
                <TouchableOpacity onPress={() => setModalView("input")} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color={Colors[theme].text} />
                    <Text style={[styles.modalTitle, { color: Colors[theme].text, marginLeft: 15, marginBottom: 0 }]}>Select Country</Text>
                </TouchableOpacity>
            </View>

            <TextInput
                placeholder="Search country..."
                placeholderTextColor="#8E8E93"
                style={[styles.searchBar, { backgroundColor: isDark ? "#1C1C1E" : "#F2F2F7", color: Colors[theme].text }]}
                onChangeText={setCountrySearch}
                autoFocus
            />

            <FlatList
                data={filteredCountries}
                keyExtractor={(item) => item.code}
                renderItem={({ item }) => (
                    <TouchableOpacity
                        style={styles.countryItem}
                        onPress={() => {
                            setSelectedCountry(item);
                            setHasManuallySelected(true);
                            setModalView("input");
                        }}
                    >
                        <Text style={styles.countryFlag}>{item.emoji}</Text>
                        <Text style={[styles.countryName, { color: Colors[theme].text }]}>{item.name}</Text>
                        <Text style={styles.dialCodeList}>{item.dial_code}</Text>
                    </TouchableOpacity>
                )}
            />
        </View>
    );

    return (
        <>
            <View style={{ marginTop: 8, marginHorizontal: 8 }}>
                <Text style={{ color: Colors[theme].text, marginBottom: 6, fontWeight: '600' }}>
                    Find driver by REGO / PHONE
                </Text>
                <View style={styles.row}>
                    <View style={[styles.toggleContainer, { borderColor: Colors[theme].border }]}>
                        <TouchableOpacity style={[styles.toggleBtn, isOn && styles.activeBtn]} onPress={handleTurnOn}>
                            <Text style={[styles.toggleText, isOn && styles.activeText]}>ON</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.toggleBtn, !isOn && styles.activeBtn]} onPress={handleTurnOff}>
                            <Text style={[styles.toggleText, !isOn && styles.activeText]}>OFF</Text>
                        </TouchableOpacity>
                    </View>

                    {isOn && (
                        <TouchableOpacity
                            style={[styles.valueBox, { backgroundColor: isDark ? "#1C1C1E" : "#F2F2F7", borderColor: Colors[theme].border }]}
                            onPress={handleTurnOn}
                        >
                            <Text numberOfLines={1} style={{ color: Colors[theme].text, fontWeight: "700" }}>
                                {searchValue
                                    ? (isPhoneNumber ? `${selectedCountry?.dial_code} ${formatPhoneNumber(searchValue)}` : searchValue.toUpperCase())
                                    : "ENTER DETAILS"}
                            </Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            <Modal
                visible={modalVisible}
                transparent={modalView === "input"}
                animationType="fade"
                onRequestClose={() => modalView === "country" ? setModalView("input") : setModalVisible(false)}
            >
                {modalView === "input" ? (
                    <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === "ios" ? "padding" : "height"}>
                        {renderInputView()}
                    </KeyboardAvoidingView>
                ) : (
                    renderCountryView()
                )}
            </Modal>
        </>
    );
};

// ... Styles remain the same ...
const styles = StyleSheet.create({
    row: { flexDirection: "row", alignItems: "center" },
    toggleContainer: { flexDirection: "row", borderRadius: 14, overflow: "hidden", borderWidth: 1 },
    toggleBtn: { paddingVertical: 10, paddingHorizontal: 20, backgroundColor: "#E0E0E0" },
    activeBtn: { backgroundColor: "#4CAF50" },
    toggleText: { fontWeight: "700", color: "#333" },
    activeText: { color: "#fff" },
    valueBox: {
        flex: 1,
        marginLeft: 12,
        paddingVertical: 12,
        paddingHorizontal: 14,
        borderRadius: 12,
        justifyContent: 'center',
        borderWidth: 1,
    },
    modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.8)", justifyContent: "center", padding: 20 },
    modalCard: { borderRadius: 20, padding: 24, elevation: 5 },
    modalTitle: { fontSize: 18, fontWeight: "800", marginBottom: 15 },
    inputRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 14, paddingHorizontal: 12, overflow: 'hidden' },
    countryPicker: { flexDirection: 'row', alignItems: 'center', borderRightWidth: 1, borderRightColor: '#ccc', paddingRight: 10, marginRight: 10, height: 56, minWidth: 80 },
    flag: { fontSize: 20, marginRight: 6 },
    dialCodeText: { fontWeight: 'bold', fontSize: 15, marginRight: 2 },
    modalInput: { flex: 1, height: 56, fontSize: 16, fontWeight: '600' },
    modalButtons: { flexDirection: "row", justifyContent: "space-between", marginTop: 24 },
    modalBtn: { flex: 1, paddingVertical: 14, borderRadius: 14, alignItems: "center" },
    cancelBtn: { backgroundColor: "#9ca3af", marginRight: 10 },
    saveBtn: { backgroundColor: "#4CAF50", marginLeft: 10 },
    modalBtnText: { color: "#fff", fontWeight: "700", fontSize: 16 },
    fullModalContent: { flex: 1, padding: 20, paddingTop: Platform.OS === 'ios' ? 60 : 20 },
    countryHeader: { marginBottom: 20 },
    backBtn: { flexDirection: 'row', alignItems: 'center' },
    searchBar: { padding: 14, borderRadius: 12, marginBottom: 15, fontSize: 16 },
    countryItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, borderBottomWidth: 0.5, borderBottomColor: '#ccc' },
    countryFlag: { fontSize: 26, marginRight: 15 },
    countryName: { flex: 1, fontSize: 16, fontWeight: '500' },
    dialCodeList: { color: '#888', fontWeight: 'bold', fontSize: 15 }
});

export default FindDriverToggle;