import { socket } from "./socket";

export const rideRequestSocket = ({ riderId, data }: { riderId: string, data: any }) => {
// socket.emit("trip:request", {
//   riderId,data
// });
  socket.emit("trip:join", { tripId: data?._id}, "coming from rider", (message:string) => {
    console.log(message)
  })
}