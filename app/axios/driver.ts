import { axiosProcessor, rootApi } from ".";
import { ICoordinates } from "./types";

const driverApi = rootApi + "/api/v1/driver";

export type IUpdateOnlineStatus = {
    onlineStatus: boolean,
    currentLocation: ICoordinates,
    destination: ICoordinates,
    rego: string,
    email_phone: string
}


export const updateOnlineStatus = async(data: IUpdateOnlineStatus) => {
  try {
     const response = await axiosProcessor({
    method: "put",
    url: `${driverApi}/online`,
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
    url: `${driverApi}/onlineDrivers`,
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