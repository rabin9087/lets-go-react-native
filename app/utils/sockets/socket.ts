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

  // ✅ MUST be set BEFORE connect
  socket.auth = { userId, role };

  socket.connect();

  socket.on("connect", () => {
    console.log("🟢 Socket connected:", socket.id);
    console.log("Joined room: user_" + userId + "--" + role);
  });

   socket.on("connect_error", (err) => {
    console.error("🔴 Socket connection error:", err.message);
  });
}

export const disConnectSocket = () => {
  if (socket.connected) {
    socket.disconnect();
  }
  console.log("Socket DisConnected")
};
