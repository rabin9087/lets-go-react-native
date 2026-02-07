import * as SecureStorage from "expo-secure-store"

export type ITokenNameTyps = "accessJWT" | "refreshJWT" | "sessionId" | "last_push_token" | "token_owner_id"
export type ISetTokens = {
    tokenName: ITokenNameTyps
    token: string
}
export type IGetTokens = {
    tokenName: ITokenNameTyps
}

export const storeTokens = async ({tokenName, token}: ISetTokens) => {
    await SecureStorage.setItemAsync(tokenName, token);
};

// Get Access Token
export const getTokens = async ({tokenName}:  IGetTokens) => {
     return await SecureStorage.getItemAsync(tokenName);
};
// Remove tokens on logout
export const clearTokens = async ({tokenName}: IGetTokens) => {
 return await SecureStorage.deleteItemAsync(tokenName);
};

export const clearAllTokens = async () => {
  await SecureStorage.deleteItemAsync("accessJWT");
  await SecureStorage.deleteItemAsync("refreshJWT");
    await SecureStorage.deleteItemAsync("sessionId");
   await SecureStorage.deleteItemAsync("last_push_token");
};

