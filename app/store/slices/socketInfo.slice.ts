import { ICoordinates } from "@/app/axios/types";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

/* ✅ EXPORT THIS */
export interface SocketData {
    isSocketConnected: boolean;
    socketId?: string;
}

const initialState: SocketData = {
    isSocketConnected: false,
}

const socketSlice = createSlice({
  name: "socket",
  initialState,
  reducers: {
    setIsSocketConnected(state, action: PayloadAction<boolean>) {
      state.isSocketConnected = action.payload;
    },
    setDriverOffline(state) {
      state.isSocketConnected = false;
      state.socketId = undefined;
    },
    setSocketId(state, action: PayloadAction<string>) {
      state.socketId = action.payload;
      },
  },
});

export const {
  setIsSocketConnected,
  setDriverOffline,
    setSocketId,
} = socketSlice.actions;

export default socketSlice.reducer;
