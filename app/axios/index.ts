import axios from "axios";
import Constants from "expo-constants";
import { IAxiosProcessParams, TAxiosProcessor } from "./types";
import { getTokens } from "./secureTokens";
import { getDeviceInfo } from "../utils/device/getDeviceInfo";

export const rootApi =
  Constants.expoConfig?.extra?.EXPO_BASE_URL ?? "";

export const axiosInstance = axios.create({
  baseURL: rootApi,
});

/* ======================================================
 * 🔹 Cache device info (DON’T fetch every request)
 * ====================================================== */
let cachedDeviceInfo: any | null = null;

const getCachedDeviceInfo = async () => {
  if (cachedDeviceInfo) return cachedDeviceInfo;

  cachedDeviceInfo = await getDeviceInfo();
  return cachedDeviceInfo;
};

/* ======================================================
 * 🔹 Axios Processor
 * ====================================================== */
export const axiosProcessor = async ({
  method,
  url,
  obj,
  isPrivate,
  refreshToken,
  params,
  extraHeaders = {},
}: IAxiosProcessParams): Promise<TAxiosProcessor> => {
  try {
    /* ---------- Tokens ---------- */
    const token = refreshToken
      ? await getTokens({ tokenName: "refreshJWT" })
      : await getTokens({ tokenName: "accessJWT" });

    /* ---------- Device Info ---------- */
    const device = await getCachedDeviceInfo();

    const isFormData = obj instanceof FormData;

    /* ---------- Headers ---------- */
    const headers: Record<string, string> = {
      ...(isFormData
        ? {}
        : { "Content-Type": "application/json; charset=UTF-8" }),

      // ✅ Attach device info
      "X-Device-Info": JSON.stringify(device),

      ...extraHeaders,
    };

    if (isPrivate && token) {
      headers.Authorization = `Bearer ${token}`;
    }

    /* ---------- Axios Config ---------- */
    const config: any = {
      method,
      url,
      headers,
      params,
      data: method.toLowerCase() !== "get" ? obj : undefined,
    };

    const { data } = await axiosInstance(config);
    return data;
  } catch (error: any) {
    return {
      status: "error",
      message:
        error?.response?.data?.message ||
        error?.message ||
        "Request failed",
    };
  }
};
