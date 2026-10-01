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
    // Standalone Node scripts (verification harnesses run with `node`, not part
    // of the Next build). They are CommonJS by design so they can be invoked
    // without a build step, which the TS rules for the app would reject.
    "scripts/**",
  ]),
]);

export default eslintConfig;
