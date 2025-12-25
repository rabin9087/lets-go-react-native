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

export type NavigationApp = "google" | "apple";


export type TInitialState = {
    user: Partial<IUser>,
    navigationApp: NavigationApp | "ios" | "android" | "windows" | "macos" | "web"
}

export const initialState: TInitialState = {
    user: defaultUser,
    navigationApp: Platform.OS  === "ios" ? "apple" : "android"
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
  },
});

export const { setUser, setDriverOnlineStatus, setNavigationApp } = userSlice.actions;

export default userSlice.reducer;
