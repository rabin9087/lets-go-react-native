import { IUser } from "../pages/user/user.types";

// Generic Axios processor params
export interface IAxiosProcessParams {
  method: string;
  url: string;
  obj?: object;
  isPrivate?: boolean;
  refreshToken?: boolean;
  params?: object;
}

// API return type
export type TAxiosProcessor = Promise<serverReturnDataType>;

export interface ICartHistory {
  amount: number;
  deliveryStatus: string;
  paymentStatus: string;
  orderNumber: number;
  orderType: string;
  purchasedAt: Date;
}

export type createUserParams = {
  fName: string;
  lName: string;
  phone: string;
  email: string;
  password: string;
};

export type signInUserParams = {
  email_phone: string;
  password: string;
};

export type forgetPasswordParams = {
  email_phone: string;
};

export type otp_PasswordParams = {
  email_phone: string;
  otp: string;
  password: string;
};

export type otpParams = {
  email_phone: string;
  otp: string;
};

export type newPasswordParams = {
  email_phone: string;
  password: string;
};

export type LocationState = {
  from: {
    pathname: string;
  };
};

// Category
export type ICategoryTypes = {
  _id?: string;
  status?: string;
  name: string;
  alternativeName?: string;
  slug?: string;
  description?: string;
};

export enum Status {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
}

// Reviews
export interface IReviews {
  userId: string;
  review: string;
}

export type ICoordinates = {
    latitude: number;
    longitude: number
}
export type IDRIVERRIDE = {
  driverId: string;
  phone: string;
  vehicle: {
    rego: string;
  };
  currentLocation: ICoordinates;
  destination?: ICoordinates;
  polyline: ICoordinates[];
  isOnline: boolean;
  status: "online" | "on-trip" | "offline";
  socketId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type IResponse = {
    tokens?: {
        accessJWT: String,
        refreshJWT: String,
        },
  user?: Partial<IUser>,
  updatedRide?: any,
  onlineStatus: boolean,
  drivers: IDRIVERRIDE[]
}

// Server return type
export type serverReturnDataType = {
  status: "success" | "error";
  message?: string;
  inserted?: number;
  result?: [];
  user?: IResponse;
  data?: IResponse;
  accessJWT?: string;
  users?: IUser[];
  userEmail_Phone?: string;
  tokens?: { accessJWT: string; refreshJWT: string };
  clientSecret?: string;
  paymentIntentId?: string;
  customerSessionClientSecret?: string;
  amount: [];
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };

};
