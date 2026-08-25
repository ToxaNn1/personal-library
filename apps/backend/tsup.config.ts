import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts", "src/migrate.ts"],
  format: ["esm"],
  target: "node20",
  outDir: "dist",
  clean: true,
  noExternal: [/^@library\//],
});
