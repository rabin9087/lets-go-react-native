import { socket } from "./socket";

export const tripRequestSocket = (riderId: string) => {
    socket.emit('rider:request', { riderId})
}

export const tripJoinSocket = (tripId: string, role: string) => {
  socket.emit("trip:join", { tripId}, role)
}