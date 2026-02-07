import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Ionicons } from "@expo/vector-icons";

interface Props {
    colors: any;
    walletAvailable: boolean;
    onSelect: (type: 'card' | 'wallet') => void;
}

export const PaymentMethodSelection: React.FC<Props> = ({ colors, walletAvailable, onSelect }) => {
    const isIOS = Platform.OS === 'ios';

    return (
        <View style={styles.root}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>PAYMENT METHODS</Text>

            <View style={[styles.container, { backgroundColor: colors.card, borderColor: colors.border }]}>
                {/* CREDIT/DEBIT CARD */}
                <TouchableOpacity
                    activeOpacity={0.7}
                    style={styles.option}
                    onPress={() => onSelect('card')}
                >
                    <View style={styles.rowLeft}>
                        <View style={[styles.iconContainer, { backgroundColor: colors.tint + '10' }]}>
                            <Ionicons name="card" size={20} color={colors.tint} />
                        </View>
                        <Text style={[styles.optionText, { color: colors.text }]}>Credit or Debit Card</Text>
                    </View>
                    <Ionicons
                        name={isIOS ? "chevron-forward" : "chevron-forward-outline"}
                        size={18}
                        color={colors.text + '40'}
                    />
                </TouchableOpacity>

                {/* NATIVE WALLET (APPLE/GOOGLE PAY) */}
                {walletAvailable && (
                    <>
                        <View style={[styles.divider, { backgroundColor: colors.border }]} />
                        <TouchableOpacity
                            activeOpacity={0.7}
                            style={styles.option}
                            onPress={() => onSelect('wallet')}
                        >
                            <View style={styles.rowLeft}>
                                <View style={[styles.iconContainer, { backgroundColor: colors.text + '10' }]}>
                                    <Ionicons
                                        name={isIOS ? "logo-apple" : "logo-google"}
                                        size={20}
                                        color={colors.text}
                                    />
                                </View>
                                <Text style={[styles.optionText, { color: colors.text }]}>
                                    {isIOS ? 'Apple Pay' : 'Google Pay'}
                                </Text>
                            </View>
                            <Ionicons
                                name={isIOS ? "chevron-forward" : "chevron-forward-outline"}
                                size={18}
                                color={colors.text + '40'}
                            />
                        </TouchableOpacity>
                    </>
                )}
            </View>

            <Text style={styles.footerNote}>
                Your payment info is processed securely via Stripe.
            </Text>
        </View>
    );
};

const styles = StyleSheet.create({
    root: { paddingHorizontal: 16, marginTop: 20 },
    sectionTitle: {
        fontSize: 13,
        fontWeight: '600',
        marginBottom: 8,
        marginLeft: 4,
        letterSpacing: 0.5,
        opacity: 0.6,
    },
    container: {
        borderRadius: 14,
        borderWidth: StyleSheet.hairlineWidth,
        overflow: 'hidden',
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.05,
                shadowRadius: 8,
            },
            android: {
                elevation: 2,
            },
        }),
    },
    option: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        minHeight: 64,
    },
    rowLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    iconContainer: {
        width: 36,
        height: 36,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    optionText: {
        fontSize: 16,
        fontWeight: '500',
        letterSpacing: -0.3,
    },
    divider: {
        height: StyleSheet.hairlineWidth,
        marginHorizontal: 16,
        alignSelf: 'stretch',
    },
    footerNote: {
        fontSize: 12,
        color: '#8e8e93',
        textAlign: 'center',
        marginTop: 12,
        paddingHorizontal: 20,
    }
});