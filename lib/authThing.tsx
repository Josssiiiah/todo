import { LoaderFunctionArgs } from "@remix-run/cloudflare";
import { initializeLucia } from "auth";
import { drizzle } from "drizzle-orm/d1";
import { parseCookies } from "oslo/cookie";


export async function doTheAuthThing({context, request}: Pick<LoaderFunctionArgs, "request" | "context">) { // check out my typescript skill 8=====D
    const db = drizzle(context.cloudflare.env.DB);
    // I could create a seperate auth user table instead of DB
    // why is there no server.ts?
    // Bc we're making the auth happen on every route
    const lucia = initializeLucia(context.cloudflare.env.DB); 
  
    const sessionId = parseCookies(request.headers.get("Cookie") || "").get(
      lucia.sessionCookieName
    );
  
    if (!sessionId) { // no user
      return { user: null, session: null, db: db };
    }
  
    const result = await lucia.validateSession(sessionId);
  
    if (result.session && result.session.fresh) { // this means the user was logged in with a fresh session already
      let sessionCookie = lucia.createSessionCookie(result.session.id);
   }
  
   if (!result.session) { // this means the user's session wasn't fresh 
    let sessionCookie = lucia.createBlankSessionCookie();
  }
  
    return {
      user: result.user,
      session: result.session,
      db: db,
    };
  }