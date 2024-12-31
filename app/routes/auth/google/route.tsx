import { LoaderFunction, redirect } from "@remix-run/cloudflare";
import { createCookie } from "@remix-run/cloudflare";
// import { google } from "auth"; // Ensure you have Google OAuth setup in auth
import { generateCodeVerifier, generateState, Google } from "arctic";

// Define the cookies
const googleOAuthStateCookie = createCookie("google_oauth_state", {
  path: "/",
  httpOnly: true,
  maxAge: 60 * 10,
  sameSite: "lax",
});

const googleOAuthCodeVerifierCookie = createCookie(
  "google_oauth_code_verifier",
  {
    path: "/",
    httpOnly: true,
    maxAge: 60 * 10,
    sameSite: "lax",
  }
);

export const loader: LoaderFunction = async ({ request, context }) => {
  const state = generateState();
  const codeVerifier = generateCodeVerifier();
  const { env }: any = context.cloudflare;
  console.log("Google Cliient ID:", env.GOOGLE_CLIENT_ID);
  console.log("Google Cliient Secret:", env.GOOGLE_CLIENT_SECRET);
  console.log("Google Redirect URI:", env.GOOGLE_REDIRECT_URI);
  const google = new Google(
    env.GOOGLE_CLIENT_ID,
    env.GOOGLE_CLIENT_SECRET,
    env.GOOGLE_REDIRECT_URI
  );

  const url = await google.createAuthorizationURL(state, codeVerifier, {
    scopes: ["profile", "email"],
  });

  console.log("Google OAuth URL:", url);

  // Set the state and code_verifier in cookies
  const stateCookie = await googleOAuthStateCookie.serialize(state);
  const codeVerifierCookie = await googleOAuthCodeVerifierCookie.serialize(
    codeVerifier
  );

  return redirect(String(url), {
    headers: [
      ["Set-Cookie", stateCookie],
      ["Set-Cookie", codeVerifierCookie],
    ],
  });
};
