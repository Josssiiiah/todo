import { Lucia } from 'lucia';
import { D1Adapter } from '@lucia-auth/adapter-sqlite';
import { GitHub } from 'arctic';
import { Google } from 'arctic';
import { LoaderFunction } from '@remix-run/cloudflare';
import { useLoaderData } from '@remix-run/react';

declare module 'lucia' {
  interface Register {
    Auth: ReturnType<typeof initializeLucia>;
    DatabaseUserAttributes: DatabaseUserAttributes;
    SessionAttributes: {
      accessToken: string;
      tokenExpiry: number;
    };
  }
}

interface DatabaseUserAttributes {
  username: string;
}

// Sets up Lucia auth system with my SQLite database
export function initializeLucia(D1: D1Database) {
  const adapter = new D1Adapter(D1, {
    user: 'Users',
    session: 'session',
  });
  return new Lucia(adapter, {
    sessionCookie: {
      expires: false,
    },
    getUserAttributes: attributes => {
      return {
        username: attributes.username,
      };
    },
  });
}


export const loader: LoaderFunction = async ({ request, context }) => {
  const env = context.env;
  console.log('Context:', context);

  return {

    GOOGLE_CLIENT_ID: context.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: context.GOOGLE_CLIENT_SECRET,
    GOOGLE_REDIRECT_URI: context.GOOGLE_REDIRECT_URI,
  };
};


const {
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  GOOGLE_REDIRECT_URI,
} = useLoaderData as any;

export const google = new Google(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI);
