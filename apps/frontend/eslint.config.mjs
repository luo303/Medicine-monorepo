import { defineConfig } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

export default defineConfig(
  {
    ignores: [".next/**", "next-env.d.ts", "out/**"],
    languageOptions: {
      parserOptions: {
        project: false,
        projectService: false,
        tsconfigRootDir: import.meta.dirname
      }
    }
  },
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "react-hooks/set-state-in-effect": "off"
    }
  }
);
