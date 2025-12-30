import { configureStore } from '@reduxjs/toolkit';
import { ThunkAction } from "@reduxjs/toolkit";
import { AnyAction } from "redux";

import addressSlice from './slices/address.slice';
import onlineDrivers from './slices/onlineDrivers.slice';
import socketData from './slices/socketInfo.slice';
import trips from './slices/trip.slice';
import userSlice from './slices/user.slice';

export const store = configureStore({
  reducer: {
    userInfo: userSlice, // add other reducers here
    onlineDriversInfo: onlineDrivers, // all online drivers
    tripInfo: trips, // trip details
    socketInfo: socketData, // Socket Info,
    addressInfo: addressSlice, // Socket Info,
  },
  devTools:__DEV__
});

// Infer the `RootState` and `AppDispatch` types
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export type AppThunk = ThunkAction<
  Promise<void>,
  RootState,
  unknown,
  AnyAction
>;
