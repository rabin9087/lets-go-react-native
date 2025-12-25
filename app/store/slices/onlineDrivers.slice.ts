// store/slices/onlineDrivers.slice.ts
import { IDRIVERRIDE } from "@/app/axios/types";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { ILocation } from "./trip.slice";

type OnlineDriversState = {
  drivers: IDRIVERRIDE[];     // other online drivers
  driver: IDRIVERRIDE | null; // 👈 current logged-in driver
  loading: boolean;
  error: string | null;
};

const initialState: OnlineDriversState = {
  drivers: [],
  driver: null,
  loading: false,
  error: null,
};

const onlineDriversSlice = createSlice({
  name: "onlineDrivers",
  initialState,
  reducers: {
    // ✅ SET CURRENT DRIVER (IMPORTANT)
    setCurrentDriver: (state, action: PayloadAction<IDRIVERRIDE>) => {
      state.driver = action.payload;
    },

    // ✅ PICKUP LOCATION
    setDriversCurrentLocations: (
      state,
      action: PayloadAction<ILocation>
    ) => {
      if (!state.driver) {
        state.driver = {
          ...({} as IDRIVERRIDE),
          currentLocation: action.payload,
        };
        return;
      }

      state.driver.currentLocation = action.payload;
    },

    // ✅ DESTINATION LOCATION
    setDriversDestinationLocations: (
      state,
      action: PayloadAction<ILocation>
    ) => {
      if (!state.driver) {
        state.driver = {
          ...({} as IDRIVERRIDE),
          destination: action.payload,
        };
        return;
      }

      state.driver.destination = action.payload;
    },

 resetDriversLocations: (
  state,
  { payload }: PayloadAction<"pickup" | "dropoff">
) => {
  if (!state.driver) return;

  if (payload === "pickup") {
    state.driver.currentLocation = {address: "", coords: null};
  }

  if (payload === "dropoff") {
    state.driver.destination = {address: "", coords: null};
  }
},

    // ---------------- OTHER DRIVERS ----------------
    setOnlineDrivers: (state, action: PayloadAction<IDRIVERRIDE[]>) => {
      state.drivers = action.payload;
      state.loading = false;
      state.error = null;
    },

    addOrUpdateDriver: (state, action: PayloadAction<IDRIVERRIDE>) => {
      const index = state.drivers.findIndex(
        (d) => d.driverId === action.payload.driverId
      );

      if (index !== -1) {
        state.drivers[index] = action.payload;
      } else {
        state.drivers.push(action.payload);
      }
    },

    removeDriver: (state, action: PayloadAction<string>) => {
      state.drivers = state.drivers.filter(
        (d) => d.driverId !== action.payload
      );
    },

    clearOnlineDrivers: (state) => {
      state.drivers = [];
      state.driver = null;
      state.loading = false;
      state.error = null;
    },
  },
});

export const {
  setCurrentDriver,
  setDriversCurrentLocations,
  setDriversDestinationLocations,
  setOnlineDrivers,
  addOrUpdateDriver,
  removeDriver,
  resetDriversLocations,
  clearOnlineDrivers,
} = onlineDriversSlice.actions;

export default onlineDriversSlice.reducer;
