import { socket } from "./socket";

export const goOnlineDriverSocket = (driverId: string) => {
  socket.emit("driver:online", { driverId });
};

export const emitDriverLocation = (
  tripId: string,
  latitude: number,
  longitude: number
) => {
  socket.emit("driver:location", {
    tripId,
    coords: { latitude, longitude },
    timestamp: Date.now()
  });
};