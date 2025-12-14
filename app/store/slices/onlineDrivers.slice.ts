// store/slices/onlineDrivers.slice.ts
import { IDRIVERRIDE } from "@/app/axios/types";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

type OnlineDriversState = {
  drivers: IDRIVERRIDE[];
  loading: boolean;
  error: string | null;
};

const initialState: OnlineDriversState = {
  drivers: [],
  loading: false,
  error: null,
};

const onlineDriversSlice = createSlice({
  name: "onlineDrivers",
  initialState,
  reducers: {
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

    setDriversLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },

    setDriversError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
      state.loading = false;
    },

    clearOnlineDrivers: (state) => {
      state.drivers = [];
      state.loading = false;
      state.error = null;
    },
  },
});

export const {
  setOnlineDrivers,
  addOrUpdateDriver,
  removeDriver,
  setDriversLoading,
  setDriversError,
  clearOnlineDrivers,
} = onlineDriversSlice.actions;

export default onlineDriversSlice.reducer;
