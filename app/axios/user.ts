import { axiosProcessor } from ".";
import { IUser } from "../pages/user/user.types";
import { getDeviceInfo } from "../utils/device/getDeviceInfo";
import { rootApi } from "./axios";
import { getTokens } from "./secureTokens";
import { ICoordinates, serverReturnDataType } from "./types";

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

export const loginUser = async(data: any) => {
  try {
    console.log(data)
    const response = await axiosProcessor({
    method: "post",
    url: `${userApi}/sign-in`,
    obj: data,
    });

    console.log(response)
    return response as serverReturnDataType
  } catch (error) {
    console.log(error)
  }
};

export const logoutUser = async() => {
  try {
    const pushToken = await getTokens({ tokenName: "last_push_token" });
    const refreshToken = await getTokens({ tokenName: "refreshJWT" })
    console.log("last_push_token",pushToken, refreshToken)
    const response = await axiosProcessor({
    method: "post",
    url: `${userApi}/logout`,
    isPrivate: true,
    obj: {pushToken, refreshToken}
    });
    console.log("Backend response", response)
    return response
  } catch (error) {
    console.log(error)
  }
};

export const autoLoginUser = async () => {
  const refreshJWT = await getTokens({ tokenName: "refreshJWT" });
  const sessionId = await getTokens({ tokenName: "sessionId" });
  
  if (!refreshJWT || !sessionId) return null;
  try {
    const response = await axiosProcessor({
    method: "get",
    url: `${userApi}/auto-login`,
    isPrivate: true,
    refreshToken: true,
    extraHeaders: {
      "x-session-id": sessionId,
      },
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
    obj: {token}
    });
    return response 
  } catch (error) {
    console.log(error)
  }
};

export const removePushNotificationToken = async ({ token }: { token: string }) => {
  try {
    const response = await axiosProcessor({
    method: "post",
    url: `${userApi}/push-token`,
    isPrivate: true,
    obj: {token}
    });
    return response 
  } catch (error) {
    console.log(error)
  }
};

// services/socialLogin.ts
export const socialLogin = async (
  provider: "google" | "facebook",
  token: string
) => {
  return axiosProcessor({
    method: "post",
    url: "/social-login",
    obj: {
      provider,
      token,
    },
  });
};

export const updateNavigationMap = async (navigationMap: "ios" | "android") => {
  try {
    const response = await axiosProcessor({
    method: "patch",
    url: `${userApi}/navigationMap`,
    isPrivate: true,
    obj: {navigationMap}
    });
    return response 
  } catch (error) {
    console.log(error)
  }
};

export const requestPasswordReset = async (email_phone: string) => {
  return axiosProcessor({
    method: "post",
    url: `${userApi}/forgot-password`,
    obj: { email_phone },
  });
};

export const resetPassword = async (password: string, email_phone: string) => {
  return axiosProcessor({
    method: "post",
    url: `${userApi}/reset-password`,
    obj: { password, email_phone },
  });
};