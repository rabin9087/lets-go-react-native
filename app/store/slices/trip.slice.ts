import { ICoordinates } from "@/app/axios/types";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface ILocation {
  address: string;
  coords: ICoordinates | null;
}

export type TripStatus = 
  | "requested" | "accepted" | "pickedup" | "ontrip" 
  | "completed" | "cancelled" | "rejected" | "arrived" 
  | "started" | "pending";

export type IRideType = "Standard" | "XL" | "Lux"
export type IFare = {
  rideType: IRideType;
  totalFare: number;
}

export type IFareCalculate = {
  distanceKm: string,
  durationMin: string,
  fares: IFare[],
}

export type ITrip = {
  _id?: string;
  riderId: string;
  riderName?: string;
  driverName?: string;
  driverId?: string;
  pickupLocation: ILocation | null;
  dropoffLocation: ILocation | null;
  distanceKm?: number;
  durationMin?: number;
  routePolyline?: string;
  people?: number;
  rideType: "standard" | "xl" | "lux";
  baseFare: number;
  distanceFare: number;
  timeFare: number;
  surgeMultiplier?: number;
  surgeAmount?: number;
  taxAmount?: number;
  discountAmount?: number;
  totalFare: number;
  platformCommissionPercent: number;
  platformFee: number;
  driverEarning: number;
  paymentMethod: "card" | "cash" | "wallet";
  paymentIntentId?: string;
  paymentStatus: "pending" | "authorized" | "paid" | "failed" | "refunded";
  status: TripStatus;
  cancellationReason?: string;
  cancelledBy?: "rider" | "driver" | "system";
  requestedAt: string; // Redux best practice: use strings for dates
  acceptedAt?: string;
  startedAt?: string;
  completedAt?: string;
  cancelledAt?: string;
  riderRating?: number;
  driverRating?: number;
  createdAt: string;
  updatedAt: string;
};

export interface TripState {
  pickupLocation: ILocation;
  dropoffLocation: ILocation;
  paymentAmount: number;
  numberOfPassengers?: number;
  seatsAvailable?: number;
  status: TripStatus;
  routeInfo: {
    routeGeo: ICoordinates[];
    distance: string;
    duration: string;
  };
  incomingRide: ITrip | null;
  showModal: boolean;
  expiresAt: number | null;
  pickedup: boolean | null;
  tripAccepted: boolean | null;
  chooseRide: boolean;
  regoPhone: string | null;
  fareCalculate: IFareCalculate | null
}

const initialState: TripState = {
  pickupLocation: { address: "", coords: null },
  dropoffLocation: { address: "", coords: null },
  paymentAmount: 0,
  numberOfPassengers: 1,
  status: "pending",
  routeInfo: {
    routeGeo: [],
    distance: "",
    duration: "",
  },
  incomingRide: null,
  showModal: false,
  expiresAt: null,
  pickedup: false,
  tripAccepted: null,
  chooseRide: false,
  regoPhone: null,
  fareCalculate: null
};

const tripSlice = createSlice({
  name: "trip",
  initialState,
  reducers: {
    // Corrected logic: If null is passed, reset to empty location object
    setPickupLocation: (state, action: PayloadAction<ILocation | null>) => {
      state.pickupLocation = action.payload ?? { address: "", coords: null };
    },
    setDropoffLocation: (state, action: PayloadAction<ILocation | null>) => {
      state.dropoffLocation = action.payload ?? { address: "", coords: null };
    },
    setPaymentAmount: (state, action: PayloadAction<number>) => {
      state.paymentAmount = action.payload;
    },
    setNumberOfPassengers: (state, action: PayloadAction<number>) => {
      state.numberOfPassengers = action.payload;
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
    setShowModal: (state, action: PayloadAction<boolean>) => {
      state.showModal = action.payload;
    },
    setChooseRide: (state, action: PayloadAction<boolean>) => {
      state.chooseRide = action.payload;
    },
    setRegoPhone: (state, action: PayloadAction<string | null>) => {
      state.regoPhone = action.payload;
    },
    setPickedup: (state, action: PayloadAction<boolean | null>) => {
      state.pickedup = action.payload;
    },
    setTripAccepted: (state, action: PayloadAction<boolean | null>) => {
      state.tripAccepted = action.payload;
    },

    setTripStatus: (state, action: PayloadAction<TripStatus>) => {
      state.status = action.payload;
    },
    resetITripLocation: (state, { payload }: PayloadAction<"pickup" | "dropoff">) => {
      const emptyLocation = { address: "", coords: null };
      if (payload === "pickup") state.pickupLocation = emptyLocation;
      if (payload === "dropoff") state.dropoffLocation = emptyLocation;
    },
    reseITrip: () => initialState, // Cleanest way to reset the whole slice
    updateTripDetails: (state, action: PayloadAction<Partial<TripState>>) => {
      Object.assign(state, action.payload);
    },
    setIncomingRide: (state, { payload }: PayloadAction<ITrip | null>) => {
      state.incomingRide = payload;
      state.expiresAt = payload ? Date.now() + 45_000 : null;
      if (payload?.status) state.status = payload.status;
    },
    setFareCalculate: (state, { payload }: PayloadAction<IFareCalculate | null>) => {
      state.fareCalculate = payload;
    },
    clearIncomingRide: (state) => {
      state.incomingRide = null;
      state.expiresAt = null;
      state.showModal = false;
      state.tripAccepted = null;
    },
  },
});

export const {
  setPickupLocation,
  setDropoffLocation,
  setPaymentAmount,
  setNumberOfPassengers,
  setTripStatus,
  setRouteGeo,
  setPickedup,
  reseITrip,
  resetITripLocation,
  updateTripDetails,
  setDistance,
  setDuration,
  setIncomingRide,
  clearIncomingRide,
  setShowModal,
  setTripAccepted,
  setRegoPhone,
  setChooseRide,
  setFareCalculate
} = tripSlice.actions;

export default tripSlice.reducer;