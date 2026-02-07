import { Platform } from "react-native";
import { axiosProcessor } from ".";
import { rootApi } from "./axios";
const paymentApi = rootApi + "/api/v1/payment";

export const createPaymentIntent = async ({
  amount,
  tripId,
}: {
  amount: number;
  tripId: string;
    }) => {
    try {
        const response = await axiosProcessor({
        method: "post",
        url: `${paymentApi}/create-intent`,
        isPrivate: true,
        obj: { amount, tripId },
    });
        return response
    } catch (error) {
        console.log(error)
    }
  
};

export const savePaymentCard = async () => {
    try {
            const response = await axiosProcessor({
            method: "post",
            url: `${paymentApi}/setup-intent`,
            isPrivate: true,
            });
            console.log(response)
         return response
    } catch (error) {
        console.log(error)
    }
  
};

export const savePaymentMethod = async ({
  paymentMethodId,
}: {
  paymentMethodId: any;
    }) => {
    try {
        const response = await axiosProcessor({
            method: "post",
            url: `${paymentApi}/save-method`,
            isPrivate: true,
            obj: { paymentMethodId },
        });
         return response
    } catch (error) {
        console.log(error)

    }
};

export const getSavedCards = async () => {
  return axiosProcessor({
    method: "get",
    url: `${paymentApi}/methods`,
    isPrivate: true,
  });
};

export const setDefaultPaymentMethod = async (paymentMethodId: string) => {
    return axiosProcessor({
        method: "post",
        url: `${paymentApi}/set-default`,
        isPrivate: true,
        obj: { paymentMethodId },
    });
};


export const createDriverPaymentAccount = async (data: any) => {
    console.log("data", data)
    return axiosProcessor({
        method: "post",
        url: `${paymentApi}/create-account`,
        isPrivate: true,
        obj: {data}
    });
};

export const getDriverOnboardingLink = async () => {
    return axiosProcessor({
        method: "post",
        url: `${paymentApi}/onboarding-link`,
        isPrivate: true,
    });
};

export const verifyDriverStripeAccount = async () => {
    return axiosProcessor({
        method: "get",
        url: `${paymentApi}/verify-driver`,
        isPrivate: true,
    });
};

export const getDriverStripeAccount = async () => {
     return axiosProcessor({
        method: "get",
        url: `${paymentApi}/driver-account`,
        isPrivate: true,
    });
};
/**
 * Utility to convert local URI to Stripe File Token
 */
export const uploadFileToStripe = async (uri: string, purpose: 'identity_document' | 'additional_verification'): Promise<string> => {
    const formData = new FormData();
    
    // @ts-ignore - FormData requires this specific structure for files in React Native
    formData.append('file', {
        uri: Platform.OS === 'ios' ? uri.replace('file://', '') : uri,
        name: 'upload.jpg',
        type: 'image/jpeg',
    });
    formData.append('purpose', purpose);

    const response = await fetch('https://files.stripe.com/v1/files', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer YOUR_STRIPE_PUBLISHABLE_KEY`,
        },
        body: formData,
    });

    const result = await response.json();
    if (result.error) throw new Error(result.error.message);
    return result.id; // file_xxx
};

// Step 2: Upload a single document
export const uploadDriverDocument = async (docType: string, file: any) => {
    const formData = new FormData();
    formData.append('docType', docType);
    formData.append('file', {
        uri: file.uri,
        name: file.name || `${docType}.jpg`,
        type: file.mimeType || 'image/jpeg',
    } as any);

    return axiosProcessor({
        method: "post",
        url: `${paymentApi}/upload-document`,
        isPrivate: true,
        obj: formData,
    });
};