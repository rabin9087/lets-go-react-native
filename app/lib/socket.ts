import { io } from "socket.io-client";

export const socket = io("http://192.168.1.106:5000", {
  transports: ["websocket"],
});
