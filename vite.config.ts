import vue from "@vitejs/plugin-vue";
import dts from "vite-plugin-dts";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [
    vue(),
    dts({ include: ["src/lib/**"], exclude: ["src/lib/__tests__/**"] }),
  ],
  build: {
    lib: {
      entry: "src/lib/index.ts",
      formats: ["es"],
      fileName: "index",
    },
    rolldownOptions: {
      external: ["vue", "@vueuse/core", "motion-v", "d3-array", "d3-scale", "d3-shape"],
    },
  },
  test: { include: ["src/lib/__tests__/**/*.test.ts"] },
});
