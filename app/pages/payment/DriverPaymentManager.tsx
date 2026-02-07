import { getDriverStripeAccount } from "@/app/axios/payment";
import { useAppDispatch, useAppSelector } from "@/app/store/hooks";
import { setDriverDocuments } from "@/app/store/slices/driver.slice";
import { useColorScheme } from "@/components/useColorScheme";
import Colors from "@/constants/Colors";
import { useQuery } from "@tanstack/react-query";
import React, { useEffect } from "react";
import {
    ActivityIndicator,
    Platform,
    StatusBar,
    StyleSheet,
    View
} from "react-native";
import DriverBankAccount from "./DriverBankAccount";
import DriverOnboardingScreen from "./DriverPayoutScreen";
import DriverUploadDocument from "./DriverUploadDocument";

// Calculate offset for Android if needed, though usually centering 
// is preferred in full-screen logic gates.
const ANDROID_TOP_SPACING = Platform.OS === "android" ? StatusBar.currentHeight || 0 : 0;

export default function DriverPaymentManager() {
    const theme = useColorScheme() ?? "light";
    const colors = Colors[theme];
    const dispatch = useAppDispatch();

    const { driver } = useAppSelector(s => s.driverInfo);

    const { data, isLoading } = useQuery({
        queryKey: ["driverDocuments"],
        queryFn: async () => {
            const res = await getDriverStripeAccount();
            return res?.data?.driverDocuments ?? null;
        },
        refetchOnWindowFocus: true,
    });

    useEffect(() => {
        if (data) {
            dispatch(setDriverDocuments(data));
        }
    }, [data, dispatch]);

    const currentDocs = data || driver?.driverDocuments;
    const stripeDocs = currentDocs?.stripeDocuments;
    const stripeAccountId = stripeDocs?.stripeAccountId;

    // Loading State
    if (isLoading && !currentDocs) {
        return (
            <View style={[styles.center, { backgroundColor: colors.background, paddingTop: ANDROID_TOP_SPACING }]}>
                <ActivityIndicator
                    size={Platform.OS === 'ios' ? "small" : "large"}
                    color={colors.tint}
                />
            </View>
        );
    }

    // --- LOGIC GATE / NATIVE NAVIGATION FLOW ---

    // 1. No Stripe Account: Start Onboarding
    if (!stripeAccountId) {
        return <DriverOnboardingScreen />;
    }

    // 2. Account exists but needs verification (Docs, Identity, etc.)

        return < DriverUploadDocument />;
}

const styles = StyleSheet.create({
    center: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center"
    }
});