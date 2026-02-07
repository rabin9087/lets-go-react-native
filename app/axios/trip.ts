import { axiosProcessor } from ".";
import { ILocation } from "../store/slices/trip.slice";
import { rootApi } from "./axios";
import { TripsData } from "./types";

const tripApi = rootApi + "/api/v1/trip";
// √ride-request

export type IRideRequesType = {
            pickupLocation: ILocation,
            dropoffLocation: ILocation,
            people: number,
            regoPhone?: string | null,
            rideType?: string;
        }

export const requestTripByPickupAndDropoffLocation = async (data: IRideRequesType) => {

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

export const fareCalulateTripByPickupAndDropoffLocation = async (data: IRideRequesType) => {

    try {
    const response = await axiosProcessor({
    method: "post",
    url: `${tripApi}/pickup-dropoff/trip-fare`,
    isPrivate: true,
    obj: data,
    })
        return response
    } catch (error) {
        console.log(error)
    } 
}

export const requesITripeByPickupLocation = async (data: any) => {
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
 tripId: string,
 status?: "requested" | "ontrip" | "cancelled" | "completed" | "accepted" | "pickedup" | "rejected" | "timeout"
  driverId?: string
}

export const respondToTrip = async (
 {tripId, status, driverId}: IResponseTrip
) => {
    // 📡 API
     try {
    const response = await axiosProcessor({
    method: "post",
    url: `${tripApi}/trip-response`,
    isPrivate: true,
    obj: {tripId , status, driverId},
    })
        return response
    } catch (error) {
        console.log(error)
    } 
};

export const getATrip = async (_id: string) => {
    // 📡 API
     try {
    const response = await axiosProcessor({
    method: "get",
    url: `${tripApi}/tripId/${_id}`,
    isPrivate: true,
    })
        return response.data
    } catch (error) {
        console.log(error)
    } 
};

export const getUserTrips = async (page: number, limit: number) => {
    // 📡 API
     try {
    const response = await axiosProcessor({
    method: "get",
    url: `${tripApi}/allTrips`,
    isPrivate: true,
        params: { page, limit }, 
    
    })
        return response.data?.trips as TripsData 
    } catch (error) {
        console.log(error)
    } 
};

export const cancelTrip = async(tripId: string, cancellationReason: string) => {
    // 📡 API
     try {
    const response = await axiosProcessor({
    method: "patch",
    url: `${tripApi}/cancelTrip`,
    isPrivate: true,
    obj: { tripId, cancellationReason }, 
    
    })
        return response
    } catch (error) {
        console.log(error)
    } 
};
