import { ICoordinates } from '@/app/axios/types';
import { IUser } from '@/app/pages/user/user.types';
import { createSlice, PayloadAction, WritableDraft } from '@reduxjs/toolkit';
export type NavigationApp = "android" | "ios" | "";

export type TInitialState = {
    user: Partial<IUser> | null,
    openModal: boolean;
    tempIdentifier: string | null;

}

export const initialState: TInitialState = {
    user: null,
    openModal: false,
    tempIdentifier: null,
};

const userSlice = createSlice({
  name: 'users',
  initialState,
  reducers: {
     setUser: (state, { payload }: PayloadAction<Partial<IUser> | null>) => {
            state.user = payload as WritableDraft<Partial<IUser>> | null;
},
      setNavigationApp: (state, { payload }: PayloadAction<NavigationApp>) => {
    // 1. You cannot use ?. on the left side of an assignment
    // 2. Check if state.user exists before assigning
    if (state.user) {
        state.user.navigationMap = payload;
    }
},
      setSavedAddress: (state, {payload}: PayloadAction<{label: string, coordinates: ICoordinates, address: string,}>) => {
         state?.user?.savedLocations?.push(payload )
      },
      setOpenModal: (state, {payload}: PayloadAction<boolean>) => {
          state.openModal = payload
      },
      setTempIdentifier: (state, action) => {
        state.tempIdentifier = action.payload;
},
  },
});

export const { setUser, setNavigationApp, setOpenModal, setTempIdentifier } = userSlice.actions;

export default userSlice.reducer;
