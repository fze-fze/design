import { defineConfig } from "vite";

/** The library: two entries on one copy of the core, so every figure shares one frame loop. */
export default defineConfig({
  build: {
    target: "es2020",
    sourcemap: true,
    minify: false,
    lib: { entry: { index: "src/index.ts", react: "src/react.tsx" }, formats: ["es"] },
    rollupOptions: {
      external: ["react", "react/jsx-runtime"],
      output: { banner: (chunk) => (chunk.name === "react" ? '"use client";' : "") },
    },
  },
});
