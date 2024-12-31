import { Lucia } from "lucia";
import { D1Adapter } from "@lucia-auth/adapter-sqlite";
import { GitHub } from "arctic";
import { Google } from "arctic";
import { LoaderFunction } from "@remix-run/cloudflare";
import { useLoaderData } from "@remix-run/react";


declare module "lucia" {
    interface Register {
        Auth: ReturnType<typeof initializeLucia>;
        DatabaseUserAttributes: DatabaseUserAttributes;
    }
}

interface DatabaseUserAttributes {
    github_id: number;
    username: string;
}


// Sets up Lucia auth system with my SQLite database
export function initializeLucia(D1: D1Database) {
    const adapter = new D1Adapter(D1, {
        user: "Users",
        session: "session"
    });
    return new Lucia(adapter, {
        sessionCookie: {
            expires: false,
        },
		// pulls in the specific user attributes from the whole user object, we don't need everything
        getUserAttributes: (attributes) => {
            return {
                githubId: attributes.github_id,
                username: attributes.username
            };
        }
    });
}


  export const loader: LoaderFunction = async ({ request, context }) => {
    const env = context.env;
    console.log('Context:', context);
  
    return {
      GITHUB_CLIENT_ID: context.GITHUB_CLIENT_ID,
      GITHUB_CLIENT_SECRET: context.GITHUB_CLIENT_SECRET,
      GOOGLE_CLIENT_ID: context.GOOGLE_CLIENT_ID,
      GOOGLE_CLIENT_SECRET: context.GOOGLE_CLIENT_SECRET,
      GOOGLE_REDIRECT_URI: context.GOOGLE_REDIRECT_URI,
    };
  };
  
  


// Github provider from Arctic
// export const github = new GitHub(process.env.GITHUB_CLIENT_ID!, process.env.GITHUB_CLIENT_SECRET!);

// const clientId = process.env.GOOGLE_CLIENT_ID!;
// const clientSecret = process.env.GOOGLE_CLIENT_SECRET!;
// const redirectURI = "http://localhost:5173/googleredirect";

// export const google = new Google(clientId, clientSecret, redirectURI);

const {
    GITHUB_CLIENT_ID,
    GITHUB_CLIENT_SECRET,
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    GOOGLE_REDIRECT_URI,
  } = useLoaderData as any;

  export const github = new GitHub(GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET);
  export const google = new Google(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI);
