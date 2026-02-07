import { IUser } from "../pages/user/user.types";
import { IFareCalculate, ILocation, ITrip } from "../store/slices/trip.slice";
import { DriverRequiredDocumentType, IDriverDocuments, IDriverS3Document, IStripeFile, IVehicle } from "../store/slices/types.slice";

// Generic Axios processor params
export interface IAxiosProcessParams {
  method: "get" | "post" | "put" | "patch" | "delete";
  url: string;
  obj?: any;
  isPrivate?: boolean;
  refreshToken?: boolean;
  params?: any;
  extraHeaders?: Record<string, string>; // 🔥 NEW
}

// API return type
export type TAxiosProcessor = Promise<serverReturnDataType>;

export type ICoordinates = {
    latitude: number;
    longitude: number
}

export type IOnlineDriver = {
  driverId: string;
  vehicle: IVehicle;
  currentLocation: ILocation;
  destination?: ILocation;
  isOnline: boolean;
  status: "online" | "on-trip" | "offline";
  seatAvailable: number;
  createdAt: Date;
  updatedAt: Date;
}

export type Pagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;

};export interface StripeAccountData {
    payoutsEnabled: boolean;
    chargesEnabled: boolean;
    detailsSubmitted: boolean;
    bankName?: string;
    bankLast4?: string;
    requirements: { currentlyDue: string[] };
}

export type IBankAccountDetailsTypes = {
    payoutsEnabled: boolean;
    chargesEnabled: boolean;
    detailsSubmitted: boolean;
    bankName?: string;
    bankLast4?: string;
    requirements: {
      currentlyDue: string[],
      eventuallyDue: string[]
     };
      country: string,
      currency: string, 
}

export type TripsData = {
  trips: ITrip[];
  pagination: Pagination;
};

export type IDriverDocument = {
  licenceBack: string,
  licenectFront: null,
  passport: string,
  policeCheck?: string,
  addressProof?: string,
  insurance?: string
}

export type UploadedDocumentsMap = Partial<{
  [K in DriverRequiredDocumentType]: IDriverS3Document | IStripeFile;
}>;

export type IResponse = {
  user?: Partial<IUser>,
  tokens?: {
        accessJWT: string,
        refreshJWT: string,
        sessionId: string
  },
  activeTrips: ITrip[],
  trips?: TripsData,
  updatedRide?: any,
  onlineStatus?: boolean,
  drivers?: IOnlineDriver[],
  driver?: IOnlineDriver
  newTrip?: ITrip,
  clientSecret?: string;
  paymentMethods?: any,
  url?: string;
  stripVerificationStatus?: {
    detailsSubmitted: boolean;
    chargesEnabled: boolean;
    payoutsEnabled: boolean;
  },
  stripeAccountId?: string,
  bankAccountDetail?: IBankAccountDetailsTypes,
  documents?: IDriverDocument,
  s3Url: string | null
  driverDocuments?: IDriverDocuments
  uploadedDocuments?: UploadedDocumentsMap;
  vehicle?: IVehicle;
  onlineDriver: IOnlineDriver,
  fareCalculate: IFareCalculate
}

// Server return type
export type serverReturnDataType = {
  status: "success" | "error";
  code?: string;
  message?: string;
  data?: IResponse;
};
