import { io } from "socket.io-client";
import Constants from "expo-constants";

const SOCKET_URL = Constants.expoConfig?.extra?.EXPO_BASE_URL ?? "";

// Use local IP for iPhone/Android
export const socket = io(SOCKET_URL, {
  transports: ["websocket"],
  reconnection: true,
});

export const connectSocket = (userId: string, role: string) => {
  if (socket.connected) return;

  // 👇 THIS is what backend reads as handshake.auth
  socket.auth = { userId, role };

  socket.connect();

  socket.on("connect", () => {
    console.log("🟢 Socket connected:", socket.id);

    
  });
};


export const disConnectSocket = () => {
  if (socket.connected) {
    socket.disconnect();
  }
  console.log("Socket DisConnected")
};
