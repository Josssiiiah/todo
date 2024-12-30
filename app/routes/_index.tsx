import { Link } from "@remix-run/react";

export default function Index() {
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center text-gray-800">
      <div className="flex flex-row gap-12 pt-48">
        <Link
          to="/login"
          className="px-4 py-2 rounded bg-blue-500 text-white font-medium hover:bg-blue-600"
        >
          Login
        </Link>
        <Link
          to="/signup"
          className="px-4 py-2 rounded bg-green-500 text-white font-medium hover:bg-green-600"
        >
          Sign Up
        </Link>
        <Link
          to="/logout"
          className="px-4 py-2 rounded bg-red-500 text-white font-medium hover:bg-red-600"
        >
          Logout
        </Link>
        <Link
          to="/protected"
          className="px-4 py-2 rounded bg-black text-white font-medium hover:bg-gray-600"
        >
          Protected
        </Link>
        <Link
          to="/app"
          className="px-4 py-2 rounded bg-purple-500 text-white font-medium hover:bg-purple-600"
        >
          App
        </Link>
      </div>
      <h1 className="text-4xl font-bold mb-4 pt-10">
        Welcome to Josiah's Stack
      </h1>

      <div className="bg-white p-6 rounded-lg shadow mt-6">
        <ul className="space-y-3 text-lg text-gray-700">
          <li>
            <strong>Hosting</strong>: Cloudflare Pages
          </li>
          <li>
            <strong>Javascript Framework</strong>: Remix
          </li>
          <li>
            <strong>CSS Framework</strong>: TailwindCSS
          </li>
          <li>
            <strong>Database</strong>: Cloudflare D1
          </li>
          <li>
            <strong>Bucket Storage</strong>: Cloudflare R2
          </li>
          <li>
            <strong>Serverless Functions</strong>: Cloudflare Workers
          </li>
          <li>
            <strong>ORM</strong>: Drizzle
          </li>
          <li>
            <strong>Auth</strong>: Lucia
          </li>
          <li>
            <strong>Build Tool</strong>: Vite
          </li>
        </ul>
      </div>

      <div className="bg-white p-6 rounded-lg shadow mt-6">
        <h3 className="font-semibold text-2xl">Onboarding Steps</h3>
        <ul className="list-decimal list-inside mt-4 space-y-2">
          <li>Install dependencies: pnpm i</li>
          <li>Authenticate Wrangler: wrangler login</li>
          <li>Set D1 and R2 in wrangler.toml: /wrangler.toml</li>
          <li>Set wrangler types: "wrangler types"</li>
          <li>Create Schemas: /app/drizzle/schema.server.ts</li>
          <li>Migrate changes to local db: "db:migrate:local"</li>
          <li>Migrate changes to remote db: "db:migrate"</li>
          <li>REconfigure auth (Set up new Github and Google OAuth apps)</li>
        </ul>
      </div>
    </div>
  );
}
