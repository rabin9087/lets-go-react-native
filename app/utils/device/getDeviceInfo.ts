import * as Device from "expo-device";
import * as Application from "expo-application";
import { Platform } from "react-native";

export interface IDeviceInfo {
    deviceId: string;
    deviceType: "ios" | "android" | "web";
    deviceName: string;
    osVersion: string;
    appVersion: string;
}

export const getDeviceInfo = async () => {
  let deviceId = "unknown-device-id";

  if (Platform.OS === "ios") {
    deviceId =
      (await Application.getIosIdForVendorAsync()) ??
      "unknown-ios-device-id";
  }

  if (Platform.OS === "android") {
    deviceId = Application.getAndroidId() ?? "unknown-android-device-id";
  }

  return {
    deviceId,
    deviceType: Platform.OS as "ios" | "android",
    deviceName: Device.modelName ?? "Unknown Device",
    osVersion: Device.osVersion ?? "Unknown OS",
    appVersion: Application.nativeApplicationVersion ?? "1.0.0",
  };
};
