import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    Platform,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    useColorScheme,
    StatusBar,
} from "react-native";

import { getUserTrips } from "@/app/axios/trip";
import { Pagination, TripsData } from "@/app/axios/types";
import { ITrip } from "@/app/store/slices/trip.slice";
import Colors from "@/constants/Colors";
import { NoTripsFound } from "./NoTripsFound";
import { TripCard } from "./TripCard";

const LIMIT = 10;

/** * Safe spacing logic:
 * Android: Status bar height + 8px breathing room
 * iOS: 44px (Standard notch/status bar height)
 */
const SAFE_TOP = Platform.select({
    android: (StatusBar.currentHeight || 0) + 8,
    ios: 44,
    default: 0
});

const TripsScreen = () => {
    const theme = useColorScheme() ?? "light";
    const isDark = theme === "dark";
    const themeColors = Colors[theme];
    const router = useRouter();

    const [page, setPage] = useState(1);
    const [allTrips, setAllTrips] = useState<ITrip[]>([]);

    const { data, isLoading, isFetching } = useQuery<TripsData>({
        queryKey: ["user-trips", page],
        queryFn: async () => {
            const res = await getUserTrips(page, LIMIT) as TripsData;
            if (page === 1) setAllTrips(res.trips);
            else setAllTrips(prev => [...prev, ...res.trips]);
            return res;
        },
    });

    const pagination = data?.pagination as Pagination;
    const hasMore = pagination ? page < pagination.totalPages : false;

    const loadMore = () => {
        if (!isFetching && hasMore) {
            setPage(prev => prev + 1);
        }
    };

    if (isLoading && page === 1) {
        return (
            <View style={[styles.center, { backgroundColor: themeColors.background }]}>
                <ActivityIndicator size="large" color={themeColors.tint} />
            </View>
        );
    }

    return (
        <View style={[styles.mainContainer, { backgroundColor: themeColors.background }]}>
            {/* --- NATIVE HEADER --- */}
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => router.back()}
                    // Increased hitSlop for easier tapping
                    hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
                >
                    <Ionicons
                        name={Platform.OS === 'ios' ? "chevron-back" : "arrow-back"}
                        size={28}
                        color={themeColors.text}
                    />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: themeColors.text }]}>
                    {Platform.OS === 'ios' ? "Trips" : "My Trips"}
                </Text>
                <View style={{ width: 44 }} />
            </View>

            <View style={styles.container}>
                {allTrips.length > 0 ? (
                    <FlatList
                        data={allTrips}
                        keyExtractor={(item, index) => item._id?.toString() || index.toString()}
                        renderItem={({ item }) => <TripCard trip={item} theme={theme} />}
                        contentContainerStyle={styles.listContent}
                        showsVerticalScrollIndicator={false}
                        onEndReached={loadMore}
                        onEndReachedThreshold={0.3}
                        ListHeaderComponent={() => (
                            Platform.OS === 'ios' ? <Text style={[styles.iosLargeTitle, { color: themeColors.text }]}>Activity</Text> : null
                        )}
                        ListFooterComponent={() => (
                            isFetching ? (
                                <View style={styles.footerLoader}>
                                    <ActivityIndicator size="small" color={themeColors.tint} />
                                </View>
                            ) : <View style={{ height: 40 }} />
                        )}
                    />
                ) : (
                    !isLoading && <NoTripsFound colors={themeColors} isDark={isDark} />
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    mainContainer: {
        flex: 1,
        // Now applies to both platforms since SafeAreaView is removed
        paddingTop: SAFE_TOP,
    },
    container: {
        flex: 1,
    },
    center: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center"
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 8,
        height: 56,
    },
    backButton: {
        width: 44,
        height: 44,
        alignItems: "center",
        justifyContent: "center"
    },
    headerTitle: {
        fontSize: Platform.OS === 'ios' ? 17 : 20,
        fontWeight: "700",
    },
    iosLargeTitle: {
        fontSize: 34,
        fontWeight: "800",
        paddingHorizontal: 20,
        marginBottom: 15,
        marginTop: 10,
    },
    listContent: {
        paddingHorizontal: Platform.OS === 'ios' ? 16 : 12,
        paddingTop: 10
    },
    footerLoader: {
        paddingVertical: 20,
        alignItems: "center"
    }
});

export default TripsScreen;