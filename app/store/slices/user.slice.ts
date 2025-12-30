import { ICoordinates } from '@/app/axios/types';
import { IUser } from '@/app/pages/user/user.types';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Platform } from 'react-native';

export const defaultUser: Partial<IUser> = {
    _id: "",
    name: "",
    email: "",
    phone: "",
    role: "",
    profileImage: "",
    status: "active", 
    refreshJWT: "",
  
} as const;


export type NavigationApp = "android" | "ios";


export type TInitialState = {
    user: Partial<IUser>,
    navigationApp: NavigationApp;
    openModal: boolean;
}

export const initialState: TInitialState = {
    user: defaultUser,
    navigationApp: Platform.OS === "ios" ? "ios" : "android",
    openModal: false
};

const userSlice = createSlice({
  name: 'users',
  initialState,
  reducers: {
      setUser: (state, {payload}: PayloadAction<IUser>) => {
          state.user = payload
    },
    setDriverOnlineStatus: (state, {payload}: PayloadAction<boolean>) => {
          if (state.user.driverProfile) {
                state.user.driverProfile.isOnline = payload;
            }
      },
      setNavigationApp: (state, {payload}: PayloadAction<NavigationApp>) => {
          state.navigationApp = payload
      },
      setSavedAddress: (state, {payload}: PayloadAction<{label: string, coordinates: ICoordinates, address: string,}>) => {
         state?.user?.savedLocations?.push(payload )
      },
      setOpenModal: (state, {payload}: PayloadAction<boolean>) => {
          state.openModal = payload
      },
  },
});

export const { setUser, setDriverOnlineStatus, setNavigationApp, setOpenModal } = userSlice.actions;

export default userSlice.reducer;
