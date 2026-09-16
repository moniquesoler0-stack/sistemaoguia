import { defineConfig } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsConfigPaths from "vite-tsconfig-paths";
import { nitro } from "nitro/vite";

export default defineConfig({
  server: {
    port: 8080,
  },
  plugins: [
    // Resolve o alias @/ a partir do tsconfig.
    tsConfigPaths(),
    tailwindcss(),
    // server.entry aponta para src/server.ts, o embrulho de erro do SSR.
    tanstackStart({ server: { entry: "server" } }),
    nitro(),
    viteReact(),
  ],
});
