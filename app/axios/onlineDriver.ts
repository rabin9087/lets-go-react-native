import { axiosProcessor } from ".";
import {ILocation } from "../store/slices/trip.slice";
import { IVehicle } from "../store/slices/types.slice";
import { rootApi } from "./axios";
import { ICoordinates } from "./types";

const onlineDriverApi = rootApi + "/api/v1/onlineDriver";

export type IUpdateOnlineStatus = {
    onlineStatus: boolean,
    currentLocation: ILocation,
    destination: ILocation,
    vehicle: Partial<IVehicle>,
    seatAvailable: number;
    routeGeo?: ICoordinates[]
}


export const updateOnlineStatus = async(data: IUpdateOnlineStatus) => {
  try {
     const response = await axiosProcessor({
    method: "put",
    url: `${onlineDriverApi}/online`,
    isPrivate: true,
    obj: data,
     });
    return response
  } catch (error) {
    console.log(error)
  }
}

export const getAllOnlineDrivers = async(currentLocation: ICoordinates, destinationCoord: ICoordinates) => {
  try {
     const response = await axiosProcessor({
    method: "post",
    url: `${onlineDriverApi}/onlineDrivers`,
    isPrivate: true,
    obj: {currentLocation, destination: destinationCoord}
     });
    return response.data?.drivers ?? []
  } catch (error) {
    console.log(error)
        return []

  }

}
// getAllOnlineDrivers(currentLocation: ICoordinate, destinationCoord: ICoordinate)