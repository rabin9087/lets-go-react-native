// store/slices/trip.slice.ts
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface LatLng {
  latitude: number;
  longitude: number;
}

export interface Location {
  address: string;
  coords: LatLng | null;
}

export interface TripState {
  pickupLocation: Location;
  dropupLocation: Location;
  paymentAmount: number;
  seatsAvailable: number;
  status: "pending" | "ongoing" | "completed" | "cancelled";
  [key: string]: any; // for other optional details
}

const initialState: TripState = {
  pickupLocation: { address: "", coords: null },
  dropupLocation: { address: "", coords: null },
  paymentAmount: 0,
  seatsAvailable: 0,
  status: "pending",
};

const tripSlice = createSlice({
  name: "trip",
  initialState,
  reducers: {
    setPickupLocation: (state, action: PayloadAction<Location>) => {
      state.pickupLocation = action.payload;
    },
    setDestinationLocation: (state, action: PayloadAction<Location>) => {
      state.dropupLocation = action.payload;
    },
    setPaymentAmount: (state, action: PayloadAction<number>) => {
      state.paymentAmount = action.payload;
    },
    setSeatsAvailable: (state, action: PayloadAction<number>) => {
      state.seatsAvailable = action.payload;
    },
    setTripStatus: (
      state,
      action: PayloadAction<"pending" | "ongoing" | "completed" | "cancelled">
    ) => {
      state.status = action.payload;
    },
    resetTrip: (state) => {
      state.pickup = { address: "", coords: null };
      state.destination = { address: "", coords: null };
      state.paymentAmount = 0;
      state.seats = 1;
      state.status = "pending";
    },
    updateTripDetails: (state, action: PayloadAction<Partial<TripState>>) => {
      Object.assign(state, action.payload);
    },
  },
});

export const {
  setPickupLocation,
  setDestinationLocation,
  setPaymentAmount,
  setSeatsAvailable,
  setTripStatus,
  resetTrip,
  updateTripDetails,
} = tripSlice.actions;

export default tripSlice.reducer;
