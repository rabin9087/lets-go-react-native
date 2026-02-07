export type DriverRequiredDocumentType =
  | "passport"
  | "licenceFront"
  | "licenceBack"
  | "policeCheck"
  | "addressProof"
  | "insurance";

export interface IVehicle {
  inUse?: boolean;
  vehicleType?: string;
  model?: string;
  year?: number;
  color?: string;
  rego?: string;
  photos?: string[];
}

export interface IDriverWallet {
  balance: number;
  payable: number;
  paidOut: number;
}

export type DocumentStatus = "uploaded" | "verified" | "rejected";


export interface IStripeFile {
  stripeFileId: boolean;
  uploadedAt: Date;
  status: DocumentStatus;
}

export interface IDriverStripeDocuments {
  stripeAccountId?: boolean;
  stripeNeedsIdentity: boolean;
  bankDetails: {
    bankName: string;
    bankLast4: string;
    country: string;
    currency: string;
  }
  stripeFiles?: {
    passport?: IStripeFile | null;
    licenceFront?: IStripeFile | null;
    licenceBack?: IStripeFile | null;
  };
  paymentEnabledStatus: {
    payoutsEnabled: boolean;
    chargesEnabled: boolean;
    detailsSubmitted: boolean;
  };
}

export interface IDriverS3Document {
  s3Url: boolean;
  uploadedAt: Date;
  status: DocumentStatus;
}

export interface IDriverDocuments {
  stripeDocuments?: IDriverStripeDocuments;
  licenceFront?: IDriverS3Document | null;
  licenceBack?: IDriverS3Document | null;
  addressProof?: IDriverS3Document | null;
  policeCheck?: IDriverS3Document | null;
  insurance?: IDriverS3Document | null;
  verifiedAll?: boolean
}

export type IDriver = {
  vehicles: IVehicle[];
  driverDocuments?: IDriverDocuments;
  isApproved: boolean;
  approvalStatus: "pending" | "approved" | "rejected";
  rating?: number;
  totalTrips: number;
  surgeEligible?: boolean;
  totalEarnings: number;
  wallet: IDriverWallet;
  defaultSeatsCapacity: number;
  createdAt?: Date;
  updatedAt?: Date;
}