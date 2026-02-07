import { axiosProcessor, rootApi } from ".";
import { OTPIdentifierType } from "../pages/user/VerifyOTP";
const otpApi = rootApi + "/api/v1/otp";

// services/authService.ts


export const verifyOTP = async (email_phone: string, otp: string, otpTypes: OTPIdentifierType) => {
  return axiosProcessor({
    method: "post",
    url: `${otpApi}/verify-otp`,
    obj: { email_phone, otp, otpTypes },
  });
};