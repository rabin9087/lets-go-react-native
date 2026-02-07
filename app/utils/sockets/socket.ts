import { io, Socket } from "socket.io-client";
import Constants from "expo-constants";

const SOCKET_URL = Constants.expoConfig?.extra?.EXPO_BASE_URL ?? "";

// Configuration for robust connection
export const socket: Socket = io(SOCKET_URL, {
  transports: ["websocket"],
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 2000,
  autoConnect: false, // Better to control manually via connectSocket
});

export const connectSocket = (userId: string, role: string) => {
  if (socket.connected) {
    console.log("ℹ️ Socket already connected.");
    return;
  }

  // 1. Set Auth Credentials
  socket.auth = { userId, role };

  // 2. Initial Connection
  socket.connect();

  // --- EVENT LISTENERS ---

  socket.on("connect", () => {
    console.log(`🟢 Connected: ${socket.id} | Role: ${role}`);
  });

  socket.on("connect_error", (err) => {
    console.error("🔴 Connection Error:", err.message);
    // Logic: If it's an auth error, you might want to stop reconnection
    if (err.message === "xhr poll error") {
      console.warn("⚠️ Check if server is running or IP is correct.");
    }
  });

  socket.on("disconnect", (reason) => {
    console.log("🟡 Disconnected:", reason);
    if (reason === "io server disconnect") {
      // The server forcefully closed the connection, try reconnecting manually
      socket.connect();
    }
  });

  socket.on("reconnect_attempt", (attempt) => {
    console.log(`🔄 Reconnection attempt #${attempt}`);
  });

  socket.on("reconnect_failed", () => {
    console.error("❌ Failed to reconnect after maximum attempts.");
  });

  // Handle specific Salon errors (Custom events)
  socket.on("error", (msg) => {
    console.error("🔥 Socket Business Logic Error:", msg);
  });
};

export const disConnectSocket = () => {
  if (socket) {
    // Remove all listeners to prevent memory leaks when user logs out
    socket.off("connect");
    socket.off("connect_error");
    socket.off("disconnect");
    socket.disconnect();
    console.log("🔌 Socket Disconnected & Listeners Cleaned");
  }
};