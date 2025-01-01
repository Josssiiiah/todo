import type { Config } from "drizzle-kit";

export default {
  schema: "./app/drizzle/schema.server.ts",
  out: "./app/drizzle/migrations",
  driver: "better-sqlite",
  dbCredentials: {
    url: "./.wrangler/state/v3/d1/miniflare-D1DatabaseObject/10844c50d41e027390e71ff17f4e0e328967bca338915e295401c9757f9a1d07.sqlite",
  },
} satisfies Config;
