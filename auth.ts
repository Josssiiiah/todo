import { Lucia } from "lucia";
import { D1Adapter } from "@lucia-auth/adapter-sqlite";
import { GitHub } from "arctic";
import { Google } from "arctic";


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

// Github provider from Arctic
export const github = new GitHub(process.env.GITHUB_CLIENT_ID!, process.env.GITHUB_CLIENT_SECRET!);

const clientId = process.env.GOOGLE_CLIENT_ID!;
const clientSecret = process.env.GOOGLE_CLIENT_SECRET!;
const redirectURI = "http://localhost:5173/googleredirect";

export const google = new Google(clientId, clientSecret, redirectURI);
