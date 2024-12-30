import { LoaderFunction, redirect } from "@remix-run/cloudflare";
import { createCookie } from "@remix-run/cloudflare";
import { google } from "auth"; // Ensure you have Google OAuth setup in auth
import { generateCodeVerifier, generateState } from "arctic";

// Define the cookies
const googleOAuthStateCookie = createCookie("google_oauth_state", {
  path: "/",
  httpOnly: true,
  maxAge: 60 * 10,
  sameSite: "lax",
});

const googleOAuthCodeVerifierCookie = createCookie("google_oauth_code_verifier", {
  path: "/",
  httpOnly: true,
  maxAge: 60 * 10,
  sameSite: "lax",
});

export const loader: LoaderFunction = async ({ request }) => {
  const state = generateState();
  const codeVerifier = generateCodeVerifier();

  const url = await google.createAuthorizationURL(state, codeVerifier, {
    scopes: ["profile", "email"]
  });

  console.log("Google OAuth URL:", url);

 // Set the state and code_verifier in cookies
 const stateCookie = await googleOAuthStateCookie.serialize(state);
 const codeVerifierCookie = await googleOAuthCodeVerifierCookie.serialize(codeVerifier);

 return redirect(String(url), {
   headers: [
     ["Set-Cookie", stateCookie], 
     ["Set-Cookie", codeVerifierCookie]
   ]
 });
};