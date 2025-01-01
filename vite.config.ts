import {
  vitePlugin as remix,
  cloudflareDevProxyVitePlugin as remixCloudflareDevProxy,
} from "@remix-run/dev";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [remixCloudflareDevProxy(), 
    remix(
      {
      routes(defineRoutes) {
        return defineRoutes((route) => {
          route("/google", "routes/auth/google/route.tsx");
          route("/googleredirect", "routes/auth/googleredirect/route.tsx");
        });
      },
    }
  ), tsconfigPaths()],
});
