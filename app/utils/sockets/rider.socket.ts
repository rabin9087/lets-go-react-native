import { socket } from "./socket";

export const tripRequestSocket = (riderId: string) => {
  socket.emit('rider:request', { riderId })
  console.log("User Joined", riderId)
}

export const tripJoinSocket = (tripId: string, role: string) => {
  socket.emit("trip:join", { tripId }, role)
  console.log("trip Joined", tripId, role)
}