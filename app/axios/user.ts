import { axiosProcessor, rootApi } from ".";
import { ILoginPayload } from "../pages/user/UserSignin";
import { IUser } from "../pages/user/user.types";
import { ICoordinates } from "./types";

const userApi = rootApi + "/api/v1/user";

export const createUser = (data: Partial<IUser>) => {
  return axiosProcessor({
    method: "post",
    url: `${userApi}/sign-up`,
    isPrivate: false,
    obj: data,
  });
};

export const getAUser = async (phone: string) => {   
  try {
    const response = await axiosProcessor({
    method: "get",
    url: `${userApi}` + "/userDetails/" + phone,
    isPrivate: true,
    });
    
    return response.data
  } catch (error) {
    throw new Error("Failed to update product");
  } 
};

export const loginUser = async(data: ILoginPayload) => {
  try {
    const response = await axiosProcessor({
    method: "post",
    url: `${userApi}/sign-in`,
    isPrivate: true,
    obj: data,
    });
    return response.data
  } catch (error) {
    console.log(error)
  }
};

export const logoutUser = async() => {
  try {
    const response = await axiosProcessor({
    method: "get",
    url: `${userApi}/logout`,
      isPrivate: true,
    refreshToken: true,
    });
    console.log("Backend response", response)
    return response
  } catch (error) {
    console.log(error)
  }
};

export const autoLoginUser = async() => {
  try {
    const response = await axiosProcessor({
    method: "get",
    url: `${userApi}/get-accessjwt`,
    isPrivate: true,
    refreshToken: true,
    });
    return response 
  } catch (error) {
    console.log(error)
  }
};

export const addUserAddress = async ({label, address, coords }: {label: string, address: string, coords: ICoordinates }) => {
  try {
    const response = await axiosProcessor({
    method: "post",
    url: `${userApi}/add-address`,
    isPrivate: true,
    refreshToken: true,
    obj: {label, address, coords}
    });
    return response 
  } catch (error) {
    console.log(error)
  }
};

export const pushNotificationToken = async ({ token }: { token: string }) => {
  try {
    const response = await axiosProcessor({
    method: "post",
    url: `${userApi}/push-token`,
    isPrivate: true,
      refreshToken: true,
    obj: {pushToken: token}
    });
    return response 
  } catch (error) {
    console.log(error)
  }
};