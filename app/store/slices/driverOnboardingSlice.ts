import { createSlice, PayloadAction } from "@reduxjs/toolkit";

// ✅ All valid driver document types
export type DriverDocumentType =
  | "passport"
  | "licenceFront"
  | "licenceBack"
  | "policeCheck"
  | "addressProof"
  | "insurance";

// ✅ Stripe file type
export interface StripeUploadedFile {
  stripeFileId: string;
  uploadedAt: Date;
  status: "uploaded" | "verified" | "rejected";
}

// ✅ Strongly typed driver documents
export type DriverDocuments = {
  [K in DriverDocumentType]?: StripeUploadedFile | null;
};

// ✅ Driver onboarding state
export interface DriverOnboardingState {
  dob: { day: string; month: string; year: string };
  address: { line1: string; city: string; state: string; postalCode: string };
  bank: { bankName: string, accountHolderName: string; bsb: string; accountNumber: string };
  abn?: string;
  documents: DriverDocuments;
  loading: boolean;
  errors: Record<string, string>;
}

// ✅ Initial state
const initialState: DriverOnboardingState = {
  dob: { day: "", month: "", year: "" },
  address: { line1: "", city: "", state: "", postalCode: "" },
  bank: {bankName: "", accountHolderName: "", bsb: "", accountNumber: "" },
  documents: {
    passport: null,
    licenceFront: null,
    licenceBack: null,
    policeCheck: null,
    addressProof: null,
    insurance: null,
  },
  abn: "",
  loading: false,
  errors: {},
};

const driverOnboardingSlice = createSlice({
  name: "driverOnboarding",
  initialState,
  reducers: {
    updateField(
      state,
      action: PayloadAction<{ key: string; value: any }>
    ) {
      const { key, value } = action.payload;
      const keys = key.split(".");
      let current: any = state;

      for (let i = 0; i < keys.length - 1; i++) {
        if (!(keys[i] in current)) current[keys[i]] = {};
        current = current[keys[i]];
      }

      const lastKey = keys[keys.length - 1];

      // ✅ Type-safe assignment for DriverDocuments
      if (current === state.documents && (lastKey as keyof DriverDocuments)) {
        current[lastKey as keyof DriverDocuments] = value;
      } else {
        current[lastKey] = value;
      }

      // Remove error if exists
      if (state.errors[key]) {
        const newErrors = { ...state.errors };
        delete newErrors[key];
        state.errors = newErrors;
      }
    },

    setErrors(state, action: PayloadAction<Record<string, string>>) {
      state.errors = action.payload;
    },

    setLoading(state, action: PayloadAction<boolean>) {
      state.loading = action.payload;
    },

    resetDriverOnboarding() {
      return initialState;
    },
  },
});

export const { updateField, setLoading, resetDriverOnboarding, setErrors } =
  driverOnboardingSlice.actions;

export default driverOnboardingSlice.reducer;
