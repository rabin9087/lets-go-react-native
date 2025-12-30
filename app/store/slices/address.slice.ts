import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface ILabelAddress {
  label: "home" | "office" | "work" | "other" | string;
  address: string;
  coords: {
    latitude: number;
    longitude: number;
  };
}

/** ✅ EXPORT THIS */
export interface AddressState {
  savedAddresses: ILabelAddress[];
}

const initialState: AddressState = {
  savedAddresses: [],
};

const addressSlice = createSlice({
  name: "address",
  initialState,
  reducers: {
    saveAddress: (state, action: PayloadAction<ILabelAddress>) => {
      state.savedAddresses = state.savedAddresses.filter(
        a => a.label !== action.payload.label
      );
      state.savedAddresses.push(action.payload);
    },
  },
});

export const { saveAddress } = addressSlice.actions;
export default addressSlice.reducer;
