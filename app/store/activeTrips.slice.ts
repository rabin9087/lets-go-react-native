import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";
import { ITrip } from "./slices/trip.slice";

interface TripsState {
  activeTrips: ITrip[];
  tripsHistory: ITrip[];
  loading: boolean;
  error?: string;
}

const initialState: TripsState = {
  activeTrips: [],
  tripsHistory: [],
  loading: false,
  error: undefined,
};
/* =====================================================
   SLICE
===================================================== */

const tripsSlice = createSlice({
  name: "trips",
  initialState,
  reducers: {
    clearTripsState(state) {
      state.activeTrips = [];
      state.tripsHistory = [];
      state.error = undefined;
      state.loading = false;
    },
    addActiveTrip(state, action: PayloadAction<ITrip>) {
      state.activeTrips.push(action.payload);
    },
    updateActiveTrip(state, action: PayloadAction<ITrip>) {
      const index = state.activeTrips.findIndex(t => t._id === action.payload._id);
      if (index !== -1) {
        state.activeTrips[index] = action.payload;
      }
    },
    removeActiveTrip(state, action: PayloadAction<string>) {
      state.activeTrips = state.activeTrips.filter(t => t._id !== action.payload);
      },
    setActiveTrips(state, action: PayloadAction<ITrip[]>) {
      state.activeTrips = action.payload
      },
  },
});

/* =====================================================
   EXPORTS
===================================================== */

export const { clearTripsState, addActiveTrip, updateActiveTrip, removeActiveTrip, setActiveTrips } = tripsSlice.actions;
export default tripsSlice.reducer;
