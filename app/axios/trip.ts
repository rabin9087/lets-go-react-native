import { axiosProcessor, rootApi } from ".";
import { socket } from "../utils/sockets/socket";
import { IResponse } from "./types";

const tripApi = rootApi + "/api/v1/trip";
// √ride-request
export const requestTripByPickupAndDropoffLocation = async (data: any) => {
    try {
    const response = await axiosProcessor({
    method: "post",
    url: `${tripApi}/pickup-dropoff/trip-request`,
    isPrivate: true,
    obj: data,
    })
        return response
    } catch (error) {
        console.log(error)
    } 
}

export const requestTripeByPickupLocation = async (data: any) => {
    try {
    const response = await axiosProcessor({
    method: "post",
    url: `${tripApi}/pickup/trip-request`,
    isPrivate: true,
    obj: data,
    })
        return response.data
    } catch (error) {
        console.log(error)
    } 
}

export type IResponseTrip = {
 _id: string,
    status?: "requested" | "ontrip" | "cancelled" | "completed" | "accepted" | "pickedup" | "rejected",
  driverId?: string
}

export const respondToTrip = async (
 {_id, status, driverId}: IResponseTrip
) => {
    // 📡 API
     try {
    const response = await axiosProcessor({
    method: "post",
    url: `${tripApi}/trip-response`,
    isPrivate: true,
    obj: {_id , status, driverId},
    })
        return response.data
    } catch (error) {
        console.log(error)
    } 
};

