import {
  ActionFunctionArgs,
  json,
  LoaderFunctionArgs,
  MetaFunction,
  redirect,
} from "@remix-run/cloudflare";
import { Form, Link, useActionData } from "@remix-run/react";
import { drizzle } from "drizzle-orm/d1";
import { initializeLucia } from "auth";
import { Users } from "~/drizzle/schema.server";
import { sql } from "drizzle-orm";
import { Button } from "~/components/ui/button";

export const meta: MetaFunction = () => {
  return [{ title: "Login" }];
};

export async function loader({ context }: LoaderFunctionArgs) {
  if (context.session) {
    throw redirect("/");
  }

  return null;
}


export default function LoginRoute() {
  const actionData = useActionData<typeof action>();

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center">
      <div className="bg-white p-6 mt-48 rounded-lg shadow-lg">
        <h1 className="text-2xl font-bold mb-4">Sign in</h1>
        <Form method="post" className="space-y-4">
          <div>
            <label
              htmlFor="username"
              className="block font-medium text-gray-700"
            >
              Username
            </label>
            <input
              name="username"
              id="username"
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
            />
          </div>
          <div>
            <label
              htmlFor="password"
              className="block font-medium text-gray-700"
            >
              Password
            </label>
            <input
              type="password"
              name="password"
              id="password"
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
            />
          </div>
          {actionData?.error && (
            <p className="text-red-500">{actionData.error}</p>
          )}
          <button
            type="submit"
            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
          >
            Continue
          </button>
        </Form>
        <h1>
          Login with GitHub
        </h1>
        <Button>
          <a href="/github">Sign in with GitHub</a>
        </Button>
        <h1>
          Login with Google
        </h1>
        <Button>
          <a href="/google">Sign in with Google</a>
        </Button>

        <div className="mt-4">
          <Link to="/signup" className="text-blue-500 hover:underline">
            Sign up
          </Link>
        </div>
      </div>
      <Link to="/" className="mt-4 text-blue-500 hover:underline">
        Back to home
      </Link>
    </div>
  );
}


export async function action({ context, request }: ActionFunctionArgs) {
  const db = drizzle(context.cloudflare.env.DB);
  const lucia = initializeLucia(context.cloudflare.env.DB);

  const formData = await request.formData();

  const username = formData.get("username");

  if (
    typeof username !== "string" ||
    username.length < 3 ||
    username.length > 31 ||
    !/^[a-z0-9_-]+$/.test(username)
  ) {
    return json({
      error: "Invalid username",
    });
  }

  const password = formData.get("password");

  if (
    typeof password !== "string" ||
    password.length < 6 ||
    password.length > 255
  ) {
    return json({
      error: "Invalid password",
    });
  }

  const existingUser = await db
    .select()
    .from(Users)
    .where(sql`${Users.username} = ${username}`)
    .execute();

  if (!existingUser) {
    return json({
      error: "Incorrect username or password",
    });
  }

  if (!password) {
    return json({
      error: "Incorrect username or password",
    });
  }

  const session = await lucia.createSession(existingUser[0].id, {});
  const sessionCookie = lucia.createSessionCookie(session.id);

  return redirect("/", {
    headers: {
      "Set-Cookie": sessionCookie.serialize(),
    },
  });
}
