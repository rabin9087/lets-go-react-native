import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import Constants from "expo-constants";
import { clearAllTokens, getTokens, storeTokens } from "./secureTokens";
export const rootApi = Constants.expoConfig?.extra?.EXPO_BASE_URL ?? "";

export const axiosInstance = axios.create({
  baseURL: rootApi,
});

axiosInstance.interceptors.request.use(
  async (config) => {
    const token = await getTokens({tokenName: "accessJWT"});

    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

/* ---------------- REQUEST INTERCEPTOR ---------------- */

axiosInstance.interceptors.request.use(
  async (config) => {
    const accessToken = await getTokens({ tokenName: "accessJWT" });

    if (accessToken && config.headers) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

/* ---------------- RESPONSE INTERCEPTOR ---------------- */

let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((p) => {
    if (error) p.reject(error);
    else p.resolve(token);
  });
  failedQueue = [];
};

axiosInstance.interceptors.response.use(
  (response) => response,

  async (error) => {
    const originalRequest = error.config;

    if (
      error.response?.status === 401 &&
      error.response?.data?.code === "ACCESS_TOKEN_EXPIRED" &&
      !originalRequest._retry
    ) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({
            resolve: (token: string) => {
              originalRequest.headers.Authorization = `Bearer ${token}`;
              resolve(axiosInstance(originalRequest));
            },
            reject,
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = await getTokens({
          tokenName: "refreshJWT",
        });

        if (!refreshToken) throw new Error("No refresh token");

        const { data } = await axios.post(
          `${rootApi}/auth/refresh`,
          { refreshToken }
        );

        await storeTokens({
          tokenName: "accessJWT",
          token: data.accessToken,
        });
        await storeTokens({
          tokenName: "refreshJWT",
          token: data.refreshToken,
        });

        axiosInstance.defaults.headers.Authorization =
          `Bearer ${data.accessToken}`;

        processQueue(null, data.accessToken);

        originalRequest.headers.Authorization =
          `Bearer ${data.accessToken}`;

        return axiosInstance(originalRequest);
      } catch (err) {
        processQueue(err, null);
        await clearAllTokens();
        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);