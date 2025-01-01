import { LoaderFunction, redirect } from "@remix-run/cloudflare";
// import { google } from "auth"; // Ensure you have Google OAuth setup in auth
import { createCookie } from "@remix-run/cloudflare";
import { OAuth2RequestError, Google } from "arctic";
import { generateIdFromEntropySize } from "lucia";
import { initializeLucia } from "auth";
import { parseCookies } from "oslo/cookie";
import { Users, session } from "~/drizzle/schema.server";
import { drizzle } from "drizzle-orm/d1";
import { eq } from "drizzle-orm";

interface GoogleUser {
  sub: string;
  name: string;
  given_name: string;
  family_name: string;
  picture: string;
  email: string;
  email_verified: boolean;
  locale: string;
}

// Define the cookies
const googleOAuthStateCookie = createCookie("google_oauth_state", {
  path: "/",
  httpOnly: true,
  maxAge: 60 * 10,
  sameSite: "lax",
  secure: process.env.NODE_ENV === "production",
});

const googleOAuthCodeVerifierCookie = createCookie(
  "google_oauth_code_verifier",
  {
    path: "/",
    httpOnly: true,
    maxAge: 60 * 10,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  }
);

export const loader: LoaderFunction = async ({ request, context }) => {
  const lucia = initializeLucia(context.cloudflare.env.DB as any);
  const db = drizzle(context.cloudflare.env.DB as any);

  const { env }: any = context.cloudflare;
  console.log("Google Client ID:", env.GOOGLE_CLIENT_ID);
  console.log("Google Client Secret:", env.GOOGLE_CLIENT_SECRET);
  console.log("Google Redirect URI:", env.GOOGLE_REDIRECT_URI);
  const google = new Google(
    env.GOOGLE_CLIENT_ID,
    env.GOOGLE_CLIENT_SECRET,
    env.GOOGLE_REDIRECT_URI
  );

  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");

  // Retrieve the stored state and code_verifier from the cookies
  const cookieHeader = request.headers.get("Cookie");

  const storedState = await googleOAuthStateCookie.parse(cookieHeader);
  const codeVerifier = await googleOAuthCodeVerifierCookie.parse(cookieHeader);

  if (!code || !state || !storedState || state !== storedState) {
    console.error("Invalid code/state or state mismatch");
    return new Response(null, { status: 400 });
  }

  if (!codeVerifier) {
    console.error("No code verifier found in cookie");
    return new Response(null, { status: 400 });
  }

  try {
    const tokens = await google.validateAuthorizationCode(code, codeVerifier);
    // @ts-ignore
    const accessToken = tokens.data.access_token;
    // @ts-ignore
    const expiresIn = tokens.data.expires_in;

    const googleUserResponse = await fetch(
      "https://openidconnect.googleapis.com/v1/userinfo",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );
    const googleUser: GoogleUser = await googleUserResponse.json();

    // Check if user already exists
    const existingUser = await db
      .select()
      .from(Users)
      .where(eq(Users.google_id, googleUser.sub))
      .execute()
      .then((rows) => rows[0]);

    let userId: string;
    if (existingUser) {
      userId = existingUser.id;
    } else {
      userId = generateIdFromEntropySize(10);
      await db
        .insert(Users)
        .values({
          id: userId,
          name: googleUser.name,
          google_id: googleUser.sub,
          username: googleUser.name,
          email: googleUser.email,
          avatar_url: googleUser.picture,
        })
        .execute();
    }

    // Create session with Google token data
    const luciaSession = await lucia.createSession(userId, {});
    const sessionCookie = lucia.createSessionCookie(luciaSession.id);

    // Store the access token in the session table
    await db
      .update(session)
      .set({
        accessToken: accessToken,
        tokenExpiry: Date.now() + expiresIn * 1000,
      })
      .where(eq(session.id, luciaSession.id));

    return redirect("/app/", {
      headers: {
        "Set-Cookie": await sessionCookie.serialize(),
      },
    });
  } catch (e) {
    if (e instanceof OAuth2RequestError) {
      console.error("OAuth2RequestError:", e);
      return new Response(null, { status: 400 });
    }
    console.error("Error:", e);
    return new Response(null, { status: 500 });
  }
};
