import { Ionicons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import React, { useState, ComponentProps } from "react";
import {
    ActivityIndicator,
    Alert,
    Image,
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    SafeAreaView,
} from "react-native";
import { useDispatch, useSelector } from "react-redux";

import { uploadDriverDocument } from "@/app/axios/payment";
import { RootState } from "@/app/store";
import { patchDriverDocuments } from "@/app/store/slices/driver.slice";
import { useColorScheme } from "@/components/useColorScheme";
import Colors from "@/constants/Colors";
import {
    DocumentStatus,
    IDriverDocuments,
    DriverRequiredDocumentType,
} from "@/app/store/slices/types.slice";

type IoniconName = ComponentProps<typeof Ionicons>["name"];
type PickedFile = { uri: string; name?: string; mimeType?: string };

export default function DriverUploadDocument() {
    const dispatch = useDispatch();
    const router = useRouter();
    const theme = useColorScheme() ?? "light";
    const colors = Colors[theme];
    const isDark = theme === "dark";

    const { driver } = useSelector((s: RootState) => s.driverInfo);
    const driverDocuments = driver?.driverDocuments;

    const [uploadingDoc, setUploadingDoc] = useState<DriverRequiredDocumentType | null>(null);
    const [previewFile, setPreviewFile] = useState<PickedFile | null>(null);
    const [previewDocKey, setPreviewDocKey] = useState<DriverRequiredDocumentType | null>(null);
    const [uploading, setUploading] = useState<boolean>(false);

    const openPicker = async (): Promise<PickedFile | null> => {
        return new Promise((resolve) => {
            const options = ["Camera", "Gallery", "PDF / File", "Cancel"];

            // On iOS, ActionSheet is usually preferred over Alert for pickers
            Alert.alert("Upload Document", "Choose a source for your document photo or file.", [
                {
                    text: "Take Photo",
                    onPress: async () => {
                        const perm = await ImagePicker.requestCameraPermissionsAsync();
                        if (!perm.granted) return resolve(null);
                        const res = await ImagePicker.launchCameraAsync({ quality: 0.8 });
                        if (res.canceled) return resolve(null);
                        resolve({ uri: res.assets[0].uri });
                    },
                },
                {
                    text: "Photo Library",
                    onPress: async () => {
                        const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
                        if (!perm.granted) return resolve(null);
                        const res = await ImagePicker.launchImageLibraryAsync({ quality: 0.8 });
                        if (res.canceled) return resolve(null);
                        resolve({ uri: res.assets[0].uri });
                    },
                },
                {
                    text: "Files / PDF",
                    onPress: async () => {
                        const res = await DocumentPicker.getDocumentAsync({
                            type: ["application/pdf", "image/*"],
                        });
                        if (res.canceled) return resolve(null);
                        resolve({
                            uri: res.assets[0].uri,
                            name: res.assets[0].name,
                            mimeType: res.assets[0].mimeType,
                        });
                    },
                },
                { text: "Cancel", style: "cancel", onPress: () => resolve(null) },
            ]);
        });
    };

    const confirmUpload = async () => {
        if (!previewFile || !previewDocKey) return;
        setUploading(true);
        setUploadingDoc(previewDocKey);

        try {
            const res = await uploadDriverDocument(previewDocKey, previewFile);
            if (res?.status === "success") {
                const timestamp = new Date().toISOString();
                const stripeKeys: DriverRequiredDocumentType[] = ["passport", "licenceFront", "licenceBack", "policeCheck", "addressProof", "insurance"];

                let updatePayload: Partial<IDriverDocuments> = {};
                if (previewDocKey === "passport") {
                    updatePayload = {
                        stripeDocuments: {
                            ...driverDocuments?.stripeDocuments,
                            stripeFiles: {
                                ...driverDocuments?.stripeDocuments?.stripeFiles,
                                passport: { status: "uploaded", uploadedAt: timestamp, stripeFileId: true }
                            }
                        } as any
                    };
                } else {
                    updatePayload = {
                        [previewDocKey]: { status: "uploaded", uploadedAt: timestamp, s3Url: true }
                    };
                }
                dispatch(patchDriverDocuments(updatePayload));
                setPreviewFile(null);
            }
        } catch (e) {
            Alert.alert("Upload Error", "Could not upload document. Please try again.");
        } finally {
            setUploading(false);
            setUploadingDoc(null);
            setPreviewDocKey(null);
        }
    };

    const getStatusMeta = (status?: DocumentStatus): { text: string; color: string; icon: IoniconName; bgColor: string } => {
        switch (status) {
            case "uploaded":
                return { text: "Reviewing", color: "#f59e0b", icon: "time-outline", bgColor: "#f59e0b10" };
            case "verified":
                return { text: "Verified", color: "#10b981", icon: "checkmark-circle", bgColor: "#10b98110" };
            case "rejected":
                return { text: "Rejected - Tap to retry", color: "#ef4444", icon: "close-circle-outline", bgColor: "#ef444410" };
            default:
                return { text: "Required", color: "#8e8e93", icon: "chevron-forward", bgColor: "transparent" };
        }
    };

    const DocButton = ({ label, docKey }: { label: string; docKey: DriverRequiredDocumentType }) => {
        const docData = docKey === "passport"
            ? driverDocuments?.stripeDocuments?.stripeFiles?.passport
            : (driverDocuments as any)?.[docKey];

        const meta = getStatusMeta(docData?.status);
        const isUploading = uploadingDoc === docKey;
        const isVerified = docData?.status === "verified";

        return (
            <TouchableOpacity
                onPress={() => !isVerified && openPicker().then(f => { if (f) { setPreviewFile(f); setPreviewDocKey(docKey) } })}
                disabled={isUploading || isVerified}
                style={[
                    styles.docBtn,
                    {
                        backgroundColor: isVerified ? meta.bgColor : colors.card,
                        borderColor: isVerified ? meta.color : colors.border
                    },
                ]}
            >
                <View style={{ flex: 1 }}>
                    <Text style={[styles.docLabel, { color: colors.text }]}>{label}</Text>
                    <Text style={{ color: meta.color, fontSize: 13, fontWeight: "500" }}>{meta.text}</Text>
                </View>

                {isUploading ? (
                    <ActivityIndicator size="small" color={colors.tint} />
                ) : (
                    <Ionicons name={meta.icon} size={22} color={meta.color} />
                )}
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
            <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} hitSlop={15}>
                        <Ionicons name={Platform.OS === 'ios' ? "chevron-back" : "arrow-back"} size={28} color={colors.text} />
                    </TouchableOpacity>
                    <Text style={[styles.headerTitle, { color: colors.text }]}>Identity Docs</Text>
                    <View style={{ width: 28 }} />
                </View>

                <ScrollView contentContainerStyle={styles.scrollContent}>
                    <View style={[styles.infoBox, { backgroundColor: isDark ? "#1c1c1e" : "#f2f2f7" }]}>
                        <Ionicons name="information-circle-outline" size={20} color="#8e8e93" />
                        <Text style={styles.infoText}>
                            Documents are encrypted and stored securely. Ensure text is readable and edges are visible.
                        </Text>
                    </View>

                    <DocButton label="Passport / National ID" docKey="passport" />
                    <DocButton label="Driver Licence (Front)" docKey="licenceFront" />
                    <DocButton label="Driver Licence (Back)" docKey="licenceBack" />
                    <DocButton label="Proof of Residential Address" docKey="addressProof" />
                    <DocButton label="National Police Check" docKey="policeCheck" />
                    <DocButton label="Commercial Insurance" docKey="insurance" />

                    <TouchableOpacity
                        onPress={() => router.push("pages/stripe/Success")}
                        style={[styles.finishBtn, { backgroundColor: colors.text }]}
                    >
                        <Text style={[styles.finishBtnText, { color: colors.background }]}>Complete Profile</Text>
                    </TouchableOpacity>
                </ScrollView>
            </KeyboardAvoidingView>

            <Modal visible={!!previewFile} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalCard, { backgroundColor: colors.card }]}>
                        <View style={styles.previewHeader}>
                            <Text style={[styles.previewTitle, { color: colors.text }]}>Confirm Document</Text>
                        </View>

                        <View style={styles.previewContainer}>
                            {previewFile?.uri.toLowerCase().endsWith(".pdf") ? (
                                <View style={styles.pdfCard}>
                                    <Ionicons name="document-text" size={64} color={colors.tint} />
                                    <Text style={{ color: colors.text, marginTop: 10 }}>{previewFile.name}</Text>
                                </View>
                            ) : (
                                <Image source={{ uri: previewFile?.uri }} style={styles.fullImage} resizeMode="contain" />
                            )}
                        </View>

                        <View style={styles.modalFooter}>
                            <TouchableOpacity style={styles.cancelBtn} onPress={() => setPreviewFile(null)}>
                                <Text style={[styles.cancelBtnText, { color: colors.text }]}>Retake</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.confirmBtn, { backgroundColor: colors.tint }]}
                                onPress={confirmUpload}
                                disabled={uploading}
                            >
                                {uploading ? <ActivityIndicator color={colors.background} /> : <Text style={{color: colors.background}}>Upload Doc</Text>}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, height: 50 },
    headerTitle: { fontSize: 17, fontWeight: "600" },
    scrollContent: { padding: 20 },
    infoBox: { flexDirection: "row", padding: 16, borderRadius: 12, marginBottom: 24, gap: 12, alignItems: 'center' },
    infoText: { flex: 1, fontSize: 13, color: "#8e8e93", lineHeight: 18 },
    docBtn: { flexDirection: "row", padding: 18, borderRadius: 16, borderWidth: 1, alignItems: "center", marginBottom: 12 },
    docLabel: { fontSize: 16, fontWeight: "600", marginBottom: 2 },
    finishBtn: { padding: 18, borderRadius: 16, marginTop: 24, alignItems: "center" },
    finishBtnText: { fontSize: 16, fontWeight: "700" },
    modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "flex-end" },
    modalCard: { borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, height: '85%' },
    previewHeader: { alignItems: 'center', marginBottom: 20 },
    previewTitle: { fontSize: 20, fontWeight: "700" },
    previewContainer: { flex: 1, borderRadius: 16, overflow: 'hidden', backgroundColor: '#00000005', justifyContent: 'center', alignItems: 'center' },
    fullImage: { width: '100%', height: '100%' },
    pdfCard: { alignItems: 'center' },
    modalFooter: { flexDirection: 'row', gap: 12, marginTop: 24, paddingBottom: Platform.OS === 'ios' ? 20 : 0 },
    cancelBtn: { flex: 1, padding: 18, alignItems: 'center', borderRadius: 16, borderWidth: 1, borderColor: '#ccc' },
    cancelBtnText: { fontWeight: '600', fontSize: 16 },
    confirmBtn: { flex: 2, padding: 18, alignItems: 'center', borderRadius: 16 },
    confirmBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});