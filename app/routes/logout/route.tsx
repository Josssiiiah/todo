import type { LoaderFunctionArgs } from "@remix-run/cloudflare";
import { redirect } from "@remix-run/cloudflare";
import { initializeLucia } from "auth";
import { parseCookies } from "oslo/cookie";

export async function loader({ context, request }: LoaderFunctionArgs) {
  const lucia = initializeLucia(context.cloudflare.env.DB);

  const cookies = request.headers.get("cookie");
  const sessionId = parseCookies(cookies || "").get(lucia.sessionCookieName);

  if (!sessionId) {
    throw redirect("/login");
  }

  await lucia.invalidateSession(sessionId);
  console.log;

  const sessionCookie = lucia.createBlankSessionCookie();

  return redirect("/login", {
    headers: {
      "Set-Cookie": sessionCookie.serialize(),
    },
  });
}
