import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import prettier from "eslint-config-prettier/flat";
import { defineConfig, globalIgnores } from "eslint/config";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  prettier,
  {
    rules: {
      // Legacy rules migrated
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": "off",
      "react-hooks/exhaustive-deps": "warn",
      "react/no-unescaped-entities": "warn",
      strict: ["error", "never"],
      "no-empty": ["error", { allowEmptyCatch: true }],
      "no-irregular-whitespace": "error",

      // Temporary workaround to stop Husky blocking TS errors while adopting
      "@typescript-eslint/no-explicit-any": "warn",
    },
  },
  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts", "stitch_export/**"]),
]);

export default eslintConfig;
