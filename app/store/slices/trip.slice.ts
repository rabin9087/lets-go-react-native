// store/slices/trip.slice.ts
import { ICoordinates } from "@/app/axios/types";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface Location {
  address: string;
  coords: ICoordinates | null;
}

export type IIncomingRide = {
    _id?: string,
    pickupLocation: Location,
    dropoffLocation: Location,
    people: number,
    riderId: string,
    distance: string,
    duration: string, 
    price:number
}

export interface TripState {
  pickupLocation: Location;
  dropoffLocation: Location;
  paymentAmount: number;
  seatsAvailable: number;
  status: "pending" | "ongoing" | "completed" | "cancelled";
  [key: string]: any; // for other optional details
  routeInfo: {
  routeGeo: ICoordinates[];
    distance: string,
    duration: string;
  },
  incomingRide: IIncomingRide | null,
  expiresAt: number | null
}

const initialState: TripState = {
  pickupLocation: { address: "", coords: null },
  dropoffLocation: { address: "", coords: null },
  paymentAmount: 0,
  seatsAvailable: 0,
  status: "pending",
  routeInfo: {
  routeGeo: [],
  distance: "",
    duration: "",
  },
  incomingRide: null,
 expiresAt: null
};

const tripSlice = createSlice({
  name: "trip",
  initialState,
  reducers: {
    setPickupLocation: (state, action: PayloadAction<Location>) => {
      state.pickupLocation = action.payload;
    },
    setDestinationLocation: (state, action: PayloadAction<Location>) => {
      state.dropoffLocation = action.payload;
    },
    setPaymentAmount: (state, action: PayloadAction<number>) => {
      state.paymentAmount = action.payload;
    },
    setSeatsAvailable: (state, action: PayloadAction<number>) => {
      state.seatsAvailable = action.payload;
    },
    setRouteGeo: (state, action: PayloadAction<ICoordinates[]>) => {
      state.routeInfo.routeGeo = action.payload;
    },
      setDistance: (state, action: PayloadAction<string>) => {
      state.routeInfo.distance = action.payload;
    },
      setDuration: (state, action: PayloadAction<string>) => {
      state.routeInfo.duration = action.payload;
    },
    setTripStatus: (
      state,
      action: PayloadAction<"pending" | "ongoing" | "completed" | "cancelled">
    ) => {
      state.status = action.payload;
    },
    resetLocation: (state, {payload}: PayloadAction<"pickup" | "dropoff">) => {
      if (payload === "pickup") { state.pickupLocation = { address: "", coords: null }; }
      else if(payload === "dropoff") {state.dropoffLocation = { address: "", coords: null };}
    },
    resetTrip: (state) => {
       state.pickupLocation = { address: "", coords: null };
      state.dropoffLocation = { address: "", coords: null };
      state.paymentAmount = 0;
      state.seats = 1;
      state.status = "pending";
    },

    updateTripDetails: (state, action: PayloadAction<Partial<TripState>>) => {
      Object.assign(state, action.payload);
    },
    setIncomingRide: (state, {payload}: PayloadAction<IIncomingRide>) => {
          state.incomingRide = payload
           state.expiresAt = Date.now() + 45_000; // ⏱ 45 sec
      },
      clearIncomingRide: (state) => {
        state.incomingRide = null;
          state.expiresAt = null;
    },
  },
});

export const {
  setPickupLocation,
  setDestinationLocation,
  setPaymentAmount,
  setSeatsAvailable,
  setTripStatus,
  setRouteGeo,
  resetTrip,
  resetLocation,
  updateTripDetails,
  setDistance,
  setDuration,
  setIncomingRide,
  clearIncomingRide
} = tripSlice.actions;

export default tripSlice.reducer;
