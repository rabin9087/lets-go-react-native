import { PayloadAction, createSlice } from "@reduxjs/toolkit";
import { IDriver, IDriverDocuments, IVehicle } from "./types.slice";

interface DriverState {
  driver: IDriver | null;
  loading: boolean;
  error: string | null;
}

const initialState: DriverState = {
  driver: null,
  loading: false,
  error: null,
};

const driverSlice = createSlice({
  name: "driver",
  initialState,
    reducers: {
      setDriver(state, action: PayloadAction<Partial<IDriver>>) {
      state.driver = action.payload  as IDriver;
    },
    updateDriver(state, action: PayloadAction<Partial<IDriver>>) {
      state.driver = { ...state.driver, ...action.payload } as IDriver;
        },
    setDriverDocuments: (state, action) => {
    if (state.driver) {
      // Ensure you are assigning the object directly
      state.driver.driverDocuments = action.payload;
    } else {
      // If driver object doesn't exist yet, initialize it
      state.driver = { 
        driverDocuments: action.payload 
      } as any;
    }
      },
    patchDriverDocuments: (state, action: PayloadAction<Partial<IDriverDocuments>>) => {
      if (!state.driver) return;

      const currentDocs = state.driver.driverDocuments || {};
      const incoming = action.payload;

      state.driver.driverDocuments = {
        ...currentDocs,
        ...incoming,
        // Special handling for nested stripeDocuments
        stripeDocuments: incoming.stripeDocuments ? {
          ...currentDocs.stripeDocuments,
          ...incoming.stripeDocuments,
          stripeFiles: {
            ...currentDocs.stripeDocuments?.stripeFiles,
            ...incoming.stripeDocuments.stripeFiles
          }
        } : currentDocs.stripeDocuments
      };
      },
      addVehicle: (state, action: PayloadAction<IVehicle>) => {
      if (state.driver) {
        // 1. Ensure vehicles exists as an array to prevent "push of undefined"
        if (!state.driver.vehicles) {
          state.driver.vehicles = [];
        }
        
        // 2. Push the new vehicle
        state.driver.vehicles.push(action.payload);
      }
    },
  },
});

export const { updateDriver, setDriver, setDriverDocuments, patchDriverDocuments, addVehicle } = driverSlice.actions;
export default driverSlice.reducer;
