// // auth/facebookLogin.ts
// import * as AuthSession from "expo-auth-session";
// import * as WebBrowser from "expo-web-browser";

// WebBrowser.maybeCompleteAuthSession();

// const FB_APP_ID = process.env.EXPO_PUBLIC_FACEBOOK_APP_ID!;

// export const facebookLogin = async () => {
//   // ✅ Correct redirect URI
//   const redirectUri = AuthSession.makeRedirectUri({
//     scheme: "letsgo", // 👈 must match app.json
//   });

//   const authUrl =
//     `https://www.facebook.com/v18.0/dialog/oauth` +
//     `?client_id=${FB_APP_ID}` +
//     `&redirect_uri=${encodeURIComponent(redirectUri)}` +
//     `&response_type=token` +
//     `&scope=email,public_profile`;

//   // ✅ Correct API (replaces startAsync)
//   const result = await AuthSession.openAuthSessionAsync(
//     authUrl,
//     redirectUri
//   );

//   if (result.type === "success" && result.url) {
//     const params = AuthSession.parse(result.url);

//     return params.access_token as string;
//   }

//   return null;
// };
