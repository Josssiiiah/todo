import { Form, Link, useActionData } from "@remix-run/react";
import {
  ActionFunctionArgs,
  json,
  redirect,
} from "@remix-run/cloudflare";
import { drizzle } from "drizzle-orm/d1";
import { generateId } from "lucia";

import { initializeLucia } from "auth";
import { Users } from "~/drizzle/schema.server";





export default function SignUpRoute() {
  const actionData = useActionData<typeof action>();

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center">
      <div className="bg-white p-6 mt-48 rounded-lg shadow-lg">
        <h1 className="text-2xl font-bold mb-4">Sign up</h1>
        <Form method="POST" className="space-y-4">
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
            Create account
          </button>
        </Form>
        <div className="mt-4">
          <Link to="/login" className="text-blue-500 hover:underline">
            Sign in
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
  // username must be between 4 ~ 31 characters, and only consists of lowercase letters, 0-9, -, and _
  // keep in mind some database (e.g. mysql) are case insensitive
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

  const userId = generateId(15);
  if (
    username &&
    password &&
    typeof username === "string" &&
    typeof password === "string"
  ) {
    await db
      .insert(Users)
      .values({
        id: userId,
        username: username as string,
        password: password as string,
      })
      .execute();
  }

  const session = await lucia.createSession(userId, {});
  const sessionCookie = lucia.createSessionCookie(session.id);

  return redirect("/app/select", {
    headers: {
      "Set-Cookie": sessionCookie.serialize(),
    },
  });
}