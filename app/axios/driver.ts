import { axiosProcessor } from ".";
import { IVehicle } from "../store/slices/types.slice";
import { rootApi } from "./axios";

const driverApi = rootApi + "/api/v1/driver";


export const addNewVehicle = async(data: IVehicle) => {
  try {
     const response = await axiosProcessor({
    method: "post",
    url: `${driverApi}/addVehicle`,
    isPrivate: true,
    obj: data,
     });
    return response
  } catch (error) {
    console.log(error)
  }
}

export const updateVehicle = async(oldRego: string, newRego: string) => {
  try {
    console.log(oldRego, newRego)
    const response =
      await axiosProcessor({
    method: "patch",
    url: `${driverApi}/updateInUseVehicle`,
    isPrivate: true,
    obj: {oldRego, newRego},
     });
    return response
  } catch (error) {
    console.log(error)
  }
}