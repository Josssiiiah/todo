// app/routes/auth/github.ts
import { generateState } from "arctic";
import { createCookie, LoaderFunction, redirect } from "@remix-run/cloudflare";
import { github } from "auth";

// Define the cookie
const githubOAuthStateCookie = createCookie("github_oauth_state", {
  path: "/",
  httpOnly: true,
  maxAge: 60 * 10,
  sameSite: "lax"
});

export const loader: LoaderFunction = async ({ request }) => {
  const state = generateState();
  const url = await github.createAuthorizationURL(state);
  console.log("Girhub OAuth URL:", url);

  // Set the cookie
  return redirect(String(url), {
    headers: {
      "Set-Cookie": await githubOAuthStateCookie.serialize(state)
    }
  });
};