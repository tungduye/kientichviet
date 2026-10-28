import { defineConfig } from "vitest/config"

export default defineConfig({
  test: {
    coverage: {
      provider: "v8",
      include: [
        "src/features/**/*.ts",
        "supabase/functions/heritage-chat/requestGuards.ts",
        "supabase/functions/upload-product-image/galleryValidation.ts",
        "supabase/functions/upload-product-image/imageValidation.ts",
      ],
      exclude: ["**/*.test.ts"],
      thresholds: {
        statements: 80,
        branches: 80,
        functions: 80,
        lines: 80,
      },
    },
  },
})
