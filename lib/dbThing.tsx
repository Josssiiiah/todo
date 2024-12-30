import { LoaderFunctionArgs } from "@remix-run/cloudflare";
import { initializeLucia } from "auth";
import { drizzle } from "drizzle-orm/d1";
import { parseCookies } from "oslo/cookie";


export async function doTheDbThing({context}: Pick<LoaderFunctionArgs, "context">) { // check out my typescript skill 8=====D
    const db = drizzle(context.cloudflare.env.DB);

    return {
      db: db,
    };
  }