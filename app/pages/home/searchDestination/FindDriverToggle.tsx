import Colors from "@/constants/Colors";
import React, { useState } from "react";
import {
    KeyboardAvoidingView,
    Modal,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

type FindDriverToggleProps = {
    theme: "light" | "dark";
    searchValue: string;
    setSearchValue: React.Dispatch<React.SetStateAction<string>>;
};

const FindDriverToggle = ({ theme, searchValue, setSearchValue }: FindDriverToggleProps) => {
    const [isOn, setIsOn] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);

    const handleTurnOn = () => {
        setIsOn(true);
        setModalVisible(true);
    };

    const handleTurnOff = () => {
        setIsOn(false);
        setSearchValue("");
        setModalVisible(false);
    };

    const handleSave = () => {
        if (!searchValue.trim()) return;
        setModalVisible(false);
    };

    return (
        <>
            {/* MAIN VIEW */}
            <View style={{ marginTop: 8, marginHorizontal: 8 }}>
                <Text style={{ color: Colors[theme].text, marginBottom: 6 }}>
                    Find driver by REGO / PHONE
                </Text>

                <View style={styles.row}>
                    {/* TOGGLE */}
                    <View style={[styles.toggleContainer, { borderColor: Colors[theme].border }]}>
                        <TouchableOpacity
                            style={[
                                styles.toggleBtn,
                                isOn && styles.activeBtn,
                            ]}
                            onPress={handleTurnOn}
                        >
                            <Text style={[styles.toggleText, isOn && styles.activeText]}>
                                ON
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[
                                styles.toggleBtn,
                                !isOn && styles.activeBtn,
                            ]}
                            onPress={handleTurnOff}
                        >
                            <Text style={[styles.toggleText, !isOn && styles.activeText]}>
                                OFF
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {/* DISPLAY SAVED VALUE */}
                    {isOn && !!searchValue && (
                        <TouchableOpacity
                            style={styles.valueBox}
                            onPress={handleTurnOn}
                        >
                            <View>
                                <Text
                                    numberOfLines={1}
                                    style={{
                                        color: Colors[theme].background,
                                        fontWeight: "600",
                                    }}
                                >
                                    {searchValue ? searchValue.toUpperCase() : "ENTER REGO / PHONE"}
                                </Text>
                            </View>
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {/* MODAL */}
            <Modal
                visible={modalVisible}
                transparent
                animationType="slide"
                onRequestClose={() => setModalVisible(false)}
            >
                <KeyboardAvoidingView
                    style={styles.modalOverlay}
                    behavior={Platform.OS === "ios" ? "padding" : "height"}
                >
                    <View style={[styles.modalCard, { backgroundColor: Colors[theme].card }]}>
                        <Text style={[styles.modalTitle, { color: Colors[theme].text }]}>
                            Enter Driver Details
                        </Text>

                        <TextInput
                            placeholder="Enter REGO or PHONE"
                            value={searchValue.toUpperCase()}
                            onChangeText={setSearchValue}
                            autoFocus
                            style={[
                                styles.modalInput,
                                {
                                    color: Colors[theme].text,
                                    borderColor: Colors[theme].border,
                                },
                            ]}
                            placeholderTextColor={Colors[theme].text + "80"}
                        />

                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={[styles.modalBtn, styles.cancelBtn]}
                                onPress={handleTurnOff}
                            >
                                <Text style={styles.modalBtnText}>Cancel</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.modalBtn, styles.saveBtn]}
                                onPress={handleSave}
                            >
                                <Text style={styles.modalBtnText}>Save</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </Modal>
        </>
    );
};

export default FindDriverToggle;

const styles = StyleSheet.create({
    row: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },

    toggleContainer: {
        flexDirection: "row",
        borderRadius: 14,
        overflow: "hidden",
        borderWidth: 1,
    },

    toggleBtn: {
        paddingVertical: 10,
        paddingHorizontal: 20,
        backgroundColor: "#E0E0E0",
    },

    activeBtn: {
        backgroundColor: "#4CAF50",
    },

    toggleText: {
        fontWeight: "700",
        color: "#333",
    },

    activeText: {
        color: "#fff",
    },

    valueBox: {
        flex: 1,
        marginLeft: 12,
        paddingVertical: 10,
        paddingHorizontal: 14,
        borderRadius: 12,
        backgroundColor: "#f1f5f9",
    },

    /* MODAL */
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.9)",
        justifyContent: "center",
        padding: 20,
    },

    modalCard: {
        borderRadius: 16,
        padding: 20,
    },

    modalTitle: {
        fontSize: 16,
        fontWeight: "700",
        marginBottom: 12,
    },

    modalInput: {
        borderWidth: 1,
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 12,
        fontSize: 15,
    },

    modalButtons: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginTop: 20,
    },

    modalBtn: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 12,
        alignItems: "center",
    },

    cancelBtn: {
        backgroundColor: "#9ca3af",
        marginRight: 10,
    },

    saveBtn: {
        backgroundColor: "#4CAF50",
        marginLeft: 10,
    },

    modalBtnText: {
        color: "#fff",
        fontWeight: "700",
    },
});
