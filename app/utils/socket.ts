import { io } from "socket.io-client";

// Use local IP for iPhone/Android
export const socket = io(process.env.EXPO_BASE_URL, {
  transports: ["websocket"],
  reconnection: true,
});

export const goOnlineDriverSocket = (driverId: string) => {
  socket.emit("online-driver", { driverId });
};

export const updateDriverLocation = (driverId: string, lat: number, lng: number) => {
  socket.emit("driver-location", { driverId, lat, lng });
};
