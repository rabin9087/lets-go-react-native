import { IUser } from '@/app/pages/user/user.types';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

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

export type TInitialState = {
user: Partial<IUser>
}

export const initialState: TInitialState = {
  user: defaultUser
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
  },
});

export const { setUser, setDriverOnlineStatus } = userSlice.actions;

export default userSlice.reducer;
