import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import Constants from "expo-constants";
import { IAxiosProcessParams, TAxiosProcessor } from "./types";

export const rootApi = Constants.expoConfig?.extra?.EXPO_BASE_URL ?? "";

export const axiosInstance = axios.create({
  baseURL: rootApi,
});

export const axiosProcessor = async ({
  method,
  url,
  obj,
  isPrivate,
  refreshToken,
  params,
}: IAxiosProcessParams): Promise<TAxiosProcessor> => {
  try {
    const token = refreshToken
      ? await AsyncStorage.getItem("refreshJWT")
      : await AsyncStorage.getItem("accessJWT");

    const headers: Record<string, string> = {
      "Content-Type": "application/json; charset=UTF-8",
    };

    if (isPrivate && token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const config: any = {
      method,
      url,
      headers,
      params,
    };

    // ✅ ONLY attach data for non-GET requests
    if (method.toLowerCase() !== "get" && obj) {
      config.data = obj instanceof FormData ? obj : obj;
    }

    const { data } = await axiosInstance(config);
    return data;

  } catch (error: any) {
    console.log("❌ AXIOS ERROR STATUS:", error?.response?.status);
    console.log("❌ AXIOS ERROR DATA:", error?.response?.data);
    console.log("❌ AXIOS ERROR MESSAGE:", error?.message);

    return {
      status: "error",
      message:
        error?.response?.data?.message ||
        error?.message ||
        "Auto login failed",
    };
  }
};
