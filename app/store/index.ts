import { configureStore } from '@reduxjs/toolkit';
import userSlice from './slices/user.slice';
import onlineDrivers from './slices/onlineDrivers.slice';
import trips from './slices/trip.slice';
import socketData from './slices/socketInfo.slice';

export const store = configureStore({
  reducer: {
    userInfo: userSlice, // add other reducers here
    onlineDriversInfo: onlineDrivers, // all online drivers
    tripInfo: trips, // trip details
    socketInfo: socketData, // Socket Info
  },
});

// Infer the `RootState` and `AppDispatch` types
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
