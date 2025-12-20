import { axiosProcessor, rootApi } from ".";
import { socket } from "../utils/socket";

const rideApi = rootApi + "/api/v1/ride";
// √ride-request
export const requestRideByPickupAndDropoffLocation = async (data: any) => {
    try {
    const response = await axiosProcessor({
    method: "post",
    url: `${rideApi}/pickup-dropoff/ride-request`,
    isPrivate: true,
    obj: data,
    })
        return response.data
    } catch (error) {
        console.log(error)
    } 
}

export const requestRideByPickupLocation = async (data: any) => {
    try {
    const response = await axiosProcessor({
    method: "post",
    url: `${rideApi}/pickup/ride-request`,
    isPrivate: true,
    obj: data,
    })
        return response.data
    } catch (error) {
        console.log(error)
    } 
}


export const respondToRide = async (
  rideId: string,
  status: "accepted" | "rejected"
) => {
  // 🔌 Socket
  socket.emit("ride-response", { rideId, status });
    // 📡 API
     try {
    const response = await axiosProcessor({
    method: "post",
    url: `${rideApi}/ride-response`,
    isPrivate: true,
    obj: {rideId, status},
    })
        return response.data
    } catch (error) {
        console.log(error)
    } 
};

