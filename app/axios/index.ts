import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import Constants from "expo-constants";
import { IAxiosProcessParams, TAxiosProcessor } from "./types";


export const rootApi = Constants.expoConfig?.extra?.EXPO_BASE_URL ?? "";
// export const GOOGLE_MAPS_API_KEY = Constants.expoConfig?.extra?.GOOGLE_MAPS_API_KEY ?? "";

// Use your environment variables or fallback URLs
// export const rootApi = Constants.expoConfig?.extra?.EXPO_BASE_URL ?? "";
  // "http://192.168.1.106:5000"; // optional fallback

const accessJWT = AsyncStorage.getItem("accessJWT")
const refreshJWT = AsyncStorage.getItem("refreshJWT");

// Axios instance
export const axiosInstance = axios.create({
  baseURL: rootApi,
});

// Axios processor
export const axiosProcessor = async ({
  method,
  url,
  obj,
  isPrivate,
  refreshToken,
  params,
}: IAxiosProcessParams): Promise<TAxiosProcessor> => {
  const requestData = { ...obj };

  try {
    // Get the appropriate token
    const token = refreshToken ? await refreshJWT : await accessJWT;

    const headers: Record<string, string> = {};

    // Do not set Content-Type for FormData
    if (!(obj instanceof FormData)) {
      headers["Content-Type"] = "application/json; charset=UTF-8";
    }

    if (isPrivate && token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const requestPayload = obj instanceof FormData ? obj : requestData;

    const { data } = await axiosInstance({
      method,
      url,
      data: requestPayload,
      headers,
      params,
    });

    return data;
  } catch (error: any) {
    return error.response?.data || {
      status: "error",
      message: "Something went wrong!",
    };
  }
};
