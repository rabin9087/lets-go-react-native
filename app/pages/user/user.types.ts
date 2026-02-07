import { ICoordinates } from "@/app/axios/types";
import { ITrip } from "@/app/store/slices/trip.slice";
import { IDeviceInfo } from "@/app/utils/device/getDeviceInfo";

export interface ISavedLocation {
    label: string;
    address: string;
    coordinates: ICoordinates;
}

export interface IUser extends Document {
  // ===== BASIC =====
  _id?: string;
  name: string;
  email?: string;
  phone: string;
  gender: "male" | "female" | "other";
  role: "rider" | "driver" | "admin" | "superadmin";
  profileImage?: string;
  navigationMap:  "android" | "ios" | "";
  password?: string;
  country?: string;
  // ===== STATUS & SECURITY =====
  status: "active" | "suspended" | "pending";
  suspendedReason?: string;
  emailVerified: boolean;
  phoneVerified: boolean;
  lastLoginAt?: Date;
  lastLoginDevice?: string;
  lastLoginIp?: string;
  failedLoginAttempts?: number;
  blockedUntil?: Date;
  termsAccepted: boolean,
  verifyVia: "phone" | "email" | "",
  device?: IDeviceInfo;
  social?: {
  provider?: "google" | "facebook" | "";
  providerId?: string;
};

  // ===== LOCATION & PRESENCE =====
  lastKnownLocation?: ICoordinates;
  lastSeenAt?: Date;
   savedLocations?: ISavedLocation[];

  // ===== RIDER PROFILE =====
  riderProfile?: {
    rating?: number;
    totalTrips?: number;
    totalSpent?: number;
  };

  // ===== DRIVER PROFILE =====

  // ===== PAYMENTS =====
  payments: {
    hasStripeCustomer: boolean,
    hasDefaultPaymentMethod: boolean
  },

  // ===== NOTIFICATIONS =====
  pushTokens?: boolean;
  notificationPrefs?: {
    sms?: boolean;
    email?: boolean;
    push?: boolean;
  };

  // ===== META =====
  createdAt: Date;
  updatedAt: Date;
}