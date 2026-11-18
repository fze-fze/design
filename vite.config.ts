import { defineConfig } from "vite";

/** The gallery: `npm run dev` serves it straight from src, so a figure edits live. */
export default defineConfig({ root: "gallery", build: { outDir: "../dist-gallery", emptyOutDir: true } });
