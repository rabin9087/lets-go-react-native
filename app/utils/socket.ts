import { io } from "socket.io-client";
import Constants from "expo-constants";



const SOCKET_URL = Constants.expoConfig?.extra?.EXPO_BASE_URL ?? "";

// Use local IP for iPhone/Android
export const socket = io(SOCKET_URL, {
  transports: ["websocket"],
  reconnection: true,
});

export const connectSocket = () => {
  if (!socket.connected) {
    socket.connect();
  }
    console.log("Socket Connected")
};


export const goOnlineDriverSocket = (driverId: string) => {
  socket.emit("online-driver", { driverId });
};

export const updateDriverLocation = (driverId: string, lat: number, lng: number) => {
  socket.emit("driver-location", { driverId, lat, lng });
};

export const disConnectSocket = () => {
  if (socket.connected) {
    socket.disconnect();
  }
  console.log("Socket DisConnected")
};
