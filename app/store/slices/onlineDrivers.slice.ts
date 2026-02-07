// store/slices/onlineDrivers.slice.ts
import { IOnlineDriver } from "@/app/axios/types";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { ILocation } from "./trip.slice";

type OnlineDriversState = {
  OnlineDrivers: IOnlineDriver[];     // other online drivers
  onlineDriver: IOnlineDriver | null; // 👈 current logged-in driver
  loading: boolean;
  error: string | null;
};

const initialState: OnlineDriversState = {
  OnlineDrivers: [],
  onlineDriver: null,
  loading: false,
  error: null,
};

const onlineDriversSlice = createSlice({
  name: "onlineDrivers",
  initialState,
  reducers: {
    // ✅ SET CURRENT DRIVER (IMPORTANT)
    setOnlineDriver: (state, action: PayloadAction<IOnlineDriver>) => {
      state.onlineDriver = action.payload;
    },
    setDriverOnlineStatus: (state, { payload }: PayloadAction<boolean>) => {
      if (state?.onlineDriver) {
              if (state.onlineDriver) {
                state.onlineDriver.isOnline = payload;
              }
      }
    },

    // ✅ PICKUP LOCATION
    setOnlineDriverCurrentLocations: (
      state,
      action: PayloadAction<ILocation>
    ) => {
      if (!state.onlineDriver) {
        state.onlineDriver = {
          ...({} as IOnlineDriver),
          currentLocation: action.payload,
        };
        return;
      }

      state.onlineDriver.currentLocation = action.payload;
    },

    // ✅ DESTINATION LOCATION
    setOnlineDriverDestinationLocations: (
      state,
      action: PayloadAction<ILocation>
    ) => {
      if (!state.onlineDriver) {
        state.onlineDriver = {
          ...({} as IOnlineDriver),
          destination: action.payload,
        };
        return;
      }

      state.onlineDriver.destination = action.payload;
    },

      resetOnlineDriverLocations: (
        state,
        { payload }: PayloadAction<"pickup" | "dropoff">
      ) => {
        if (!state.onlineDriver) return;

        if (payload === "pickup") {
          state.onlineDriver.currentLocation = {address: "", coords: null};
        }

        if (payload === "dropoff") {
          state.onlineDriver.destination = {address: "", coords: null};
        }
      },

    // ---------------- OTHER DRIVERS ----------------
    setOnlineDrivers: (state, action: PayloadAction<IOnlineDriver[]>) => {
      state.OnlineDrivers = action.payload;
      state.loading = false;
      state.error = null;
    },

    addOrUpdateOnlineDriver: (state, action: PayloadAction<IOnlineDriver>) => {
      const index = state.OnlineDrivers.findIndex(
        (d) => d.driverId === action.payload.driverId
      );

      if (index !== -1) {
        state.OnlineDrivers[index] = action.payload;
      } else {
        state.OnlineDrivers.push(action.payload);
      }
    },

    removeDriver: (state, action: PayloadAction<string>) => {
      state.OnlineDrivers = state.OnlineDrivers.filter(
        (d) => d.driverId !== action.payload
      );
    },

        setSeatsAvailable: (state, { payload }: PayloadAction<number>) => {
      if (state.onlineDriver) {
        state.onlineDriver.seatAvailable = payload;
      }
    },

    clearOnlineDrivers: (state) => {
      state.OnlineDrivers = [];
      state.onlineDriver = null;
      state.loading = false;
      state.error = null;
    },
  },
});

export const {
  setOnlineDriver,
  setDriverOnlineStatus,
  setOnlineDriverCurrentLocations,
  setOnlineDriverDestinationLocations,
  setOnlineDrivers,
  addOrUpdateOnlineDriver,
  removeDriver,
  resetOnlineDriverLocations,
  clearOnlineDrivers,
  setSeatsAvailable
} = onlineDriversSlice.actions;

export default onlineDriversSlice.reducer;
