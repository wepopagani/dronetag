import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Compiled Cloud Functions output is a separate workspace and ships
    // CommonJS — don't lint it from the Next.js project. The functions/
    // workspace has its own lint script.
    "functions/lib/**",
    "functions/node_modules/**",
  ]),
]);

export default eslintConfig;
