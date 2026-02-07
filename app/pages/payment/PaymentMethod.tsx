import React from 'react';
import { useAppSelector } from "@/app/store/hooks";
import RiderPaymentMethodScreen from './RiderPaymentMethodSetup';
import DriverPaymentManager from './DriverPaymentManager';
import DriverBankAccount from './DriverBankAccount';

// Import your sub-components
       // The one we built for Drivers

export default function PaymentRoleContainer({ tripId }: { tripId: string }) {
    const { user } = useAppSelector(s => s.userInfo);

    // If user is a Driver, show Bank/Payout Setup
    if (user?.role === "driver") {
        return <DriverBankAccount />;
    }

    // Default: Show Payment/Card List for Riders
    return <RiderPaymentMethodScreen tripId={tripId} />;
}