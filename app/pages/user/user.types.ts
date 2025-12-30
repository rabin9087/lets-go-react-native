import { ICoordinates } from "@/app/axios/types";
import { IIncomingRide } from "@/app/store/slices/trip.slice";


export type IUser = {
  _id: string;
  name: string;
  email?: string;
  phone: string;
  password?: string;
  role: "rider" | "driver" | "admin" | "superadmin" | "";
  profileImage?: string;
  status?: "active" | "suspended";
  refreshJWT?: string;
  riderProfile?: {
    rating?: number;
    totalTrips?: number;
    savedLocations?: { label: string; coordinates: { lat: number; lng: number } }[];
  };
  driverProfile?: {
    isOnline?: boolean;
    isApproved?: boolean;
    rating?: number;
    totalTrips?: number;
    vehicle?: any;
    coordinate?: { lat: number; lng: number };
    bankDetails?: any;
    identityDocs?: any;
  };
  savedLocations: [
    {
      label: string,
      coordinates: ICoordinates,
      address: string
    },
  ],
  currentTrip: IIncomingRide,
  trips: string[]
}